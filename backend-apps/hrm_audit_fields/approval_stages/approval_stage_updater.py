import ast

from django.utils import timezone
import json
from hrm_audit_fields.approval_stages.approval_stage_utils import ApprovalUtils
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase
from hrm_utils.constants import ApprovalConstants


class ApprovalStageUpdater:
    def __init__(self, instance, context, initial_data):
        self.instance = instance
        self.context = context
        self.initial_data = initial_data
        self.request =self.context['request']

    def update_approval_stage(self, approval_stages):
        approval_stage_status = self.initial_data.get('approval_stage_status')
        approval_stage_comment = self.initial_data.get('approval_stage_comment', None)
        new_approval_stage = self.initial_data.get('new_approval_stage', None)
        stage_name = self.initial_data.get('stage_name', "")
        permission_code = self.initial_data.get('approval_permission_code', [])
        # print('updater new_approval_stage', new_approval_stage)
        # print('updater permission_code', permission_code)
        if not approval_stage_status:
            return

        if new_approval_stage:
            if isinstance(new_approval_stage, str):
                new_approval_stage = json.loads(new_approval_stage)
            self._add_stage(new_approval_stage, approval_stage_status)
        else:
            new_entry = self._get_new_entry_on_rejection(approval_stages, stage_name, permission_code)
            if not new_entry:
                last_stage = ApprovalUtils.get_last_approval_obj(approval_stages)
                new_entry = self._push_new_entry_for_higher_authority(last_stage, stage_name, permission_code)
                if new_entry:
                    self._add_stage(new_entry, approval_stage_status)
                else:
                    # assignee
                    new_entry = self.push_new_entry_by_assignee(last_stage,approval_stages,stage_name,permission_code)
                    if new_entry:
                        self._add_stage(new_entry, approval_stage_status)

            else:
                self._add_stage(new_entry, approval_stage_status)

        self._process_stage_update(approval_stages, stage_name, approval_stage_status, approval_stage_comment, permission_code)

    def _process_stage_update(self, approval_stages, stage_name, status, comment, permission_codes):
        user = self.context['request'].user
        filtered_stage = approval_stages.filter(stage_name=stage_name).order_by('order').last()
        if not filtered_stage:
            return

        update_data = self._build_update_data(status, user, comment)

        if status == MultiApprovalMixinBase.APPROVED:
            update_data["approval_date"] = timezone.now()
            if self._is_final_stage(stage_name):
                self._finalize_instance(stage_name)
            else:
                self._create_next_stage(stage_name, filtered_stage, permission_codes)
        else:
            self._update_instance_status(stage_name, status, user)

        self._apply_updates(filtered_stage, update_data)

    def _build_update_data(self, status, user, comment):
        data = {
            "approval_status": status,
            "approved_user_id": user.pk,
            "approval_by": user.first_name,
            "modified_date": timezone.now()
        }
        if comment:
            data.update({"comments": comment})
        return data

    def _update_instance_status(self, stage_name, status, user):
        self.instance.approval_remarks = self._get_stage_description(status, stage_name, user.first_name)
        self.instance.approval_status = status
        self.instance.save()

    def _add_stage(self, stage_details, status):
        approval_model = self.instance.approval_stages.model
        stage_details.pop('new_entry', None)
        stage_details.pop('normalized_approval_status', None)
        # print('updater _add_stage', stage_details['stage_name'], stage_details['permission_code'])
        approval_model.objects.create(
            related_object=self.instance,
            stage_name=stage_details['stage_name'],
            approval_status=status,
            order=stage_details['order'],
            permission_code=stage_details['permission_code'],
            created_user_id=stage_details['created_user']
        )

    def _get_new_entry_on_rejection(self, approval_stages, stage_name, permission_codes):
        stage = approval_stages.order_by('order').last()
        if not stage or stage.approval_status != MultiApprovalMixinBase.REJECTED or stage.stage_name == stage_name:
            return None

        permission_code = self._extract_permission_code(permission_codes)
        # print('updater _get_new_entry_on_rejection', stage_name, permission_codes)
        return {
            'stage_name': stage_name,
            'approval_status': '-',
            'normalized_approval_status': '-',
            'approval_by': '-',
            'modified_date': '-',
            'permission_code': permission_code,
            'new_entry': True,
            'order': stage.order + 1,
            'comments': '',
            'created_user': stage.created_user.id
        }

    def _extract_permission_code(self, permission_codes):
        # if permission_codes:
        #     # print('permission_codes', type(permission_codes))
        #     if isinstance(permission_codes, list):
        #         return permission_codes
        #     return eval(permission_codes)[-1].split('.')[-1]
        # return ""
        if not permission_codes:
            return ""

        # If it's a real Python list
        if isinstance(permission_codes, list):
            last_code = permission_codes[-1]
            return last_code.split('.')[-1] if isinstance(last_code, str) else ""

        # If it's a string (possibly a stringified list)
        if isinstance(permission_codes, str):
            try:
                parsed_codes = ast.literal_eval(permission_codes)
                if isinstance(parsed_codes, list) and parsed_codes:
                    last_code = parsed_codes[-1]
                    return last_code.split('.')[-1] if isinstance(last_code, str) else ""
                else:
                    # It's a single permission code string (not a list)
                    return permission_codes.split('.')[-1]
            except (SyntaxError, ValueError):
                # Fallback for malformed strings
                return permission_codes.split('.')[-1]

        return ""

    def _is_final_stage(self, stage_name):
        config = self.instance.get_approval_stage_config() if hasattr(self.instance,
                                                                      'get_approval_stage_config') else None
        last_stage = config.get('final_stage', None) if config else None
        permissions = ApprovalUtils.get_model_permissions(self.instance)
        if last_stage:
            last_stage_name = last_stage.split('custom_approval_stage_')[-1].replace('_', ' ').title()
            stage_names = [perm[0].split('custom_approval_stage_')[-1].replace('_', ' ').title() for perm in
                           permissions]
            if stage_name in stage_names and last_stage_name in stage_names:
                stage_index = stage_names.index(stage_name)
                last_stage_index = stage_names.index(last_stage_name)
                if stage_index > last_stage_index:
                    return True
                else:
                    return stage_name == last_stage_name
        last_stage_name = permissions[-1][0].split('custom_approval_stage_')[-1].replace('_', ' ').title()
        return stage_name == last_stage_name

    def _finalize_instance(self, stage_name):
        user = self.context['request'].user
        self.instance.approved_user = user
        self.instance.approval_by = user.first_name
        self.instance.approval_date = timezone.now().date()
        self.instance.approval_status = MultiApprovalMixinBase.APPROVED
        self.instance.approval_remarks = f"Approved by {stage_name}"
        self.instance.save()

    def _create_next_stage(self, stage_name, filtered_stage, permission_codes):
        permissions = ApprovalUtils.get_model_permissions(self.instance)

        # parallel approval
        permissions = self.get_filtered_permissions( permissions, permission_codes)

        for idx, (codename, _) in enumerate(permissions):
            current_stage_name = codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()

            if current_stage_name == stage_name and idx + 1 < len(permissions):
                next_codename = permissions[idx + 1][0]
                next_stage_name = next_codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
                self._add_stage({
                    'stage_name': next_stage_name,
                    'approval_status': MultiApprovalMixinBase.PENDING_APPROVAL,
                    'order': filtered_stage.order + 1,
                    'permission_code': next_codename,
                    'created_user': filtered_stage.created_user.id
                }, MultiApprovalMixinBase.PENDING_APPROVAL)
                self.instance.approval_remarks = f"Pending with {next_stage_name}"
                self.instance.save()
                break

    def _get_stage_description(self, status, stage_name, approval_by):
        if status == MultiApprovalMixinBase.REJECTED:
            return f"Rejected by {stage_name}-{approval_by}"
        if status == MultiApprovalMixinBase.PENDING_APPROVAL:
            return f"Pending with {stage_name}"
        if status == MultiApprovalMixinBase.CANCELLED:
            return f"Cancelled by {stage_name}-{approval_by}"

    def _apply_updates(self, stage, update_data):
        for field, value in update_data.items():
            setattr(stage, field, value)
        stage.save()

    def _push_new_entry_for_higher_authority(self, stage, stage_name, permission_codes):
        """Push a new entry for higher authority."""
        new_entry = None
        if stage and stage.approval_status == MultiApprovalMixinBase.PENDING_APPROVAL:
            permission_codes = eval(permission_codes) if isinstance(permission_codes, str) else permission_codes
            permission_codes = [code.split('.')[1] for code in permission_codes]
            if stage.permission_code in permission_codes:
                new_stage_name = permission_codes[-1].split('custom_approval_stage_')[-1].replace('_', ' ').title()
                if stage.stage_name != new_stage_name:
                    if stage_name:
                        # print('updater _push_new_entry_for_higher_authority', permission_codes[-1])
                        new_entry = self._create_new_entry(stage_name, stage, permission_codes[-1])

        return new_entry

    def _create_new_entry(self, stage_name, stage, permission_code):
        """Create a new entry for the approval stage."""
        return {
            'stage_name': stage_name,
            'approval_status': '-',
            'normalized_approval_status': '-',
            'approval_by': '-',
            'modified_date': '-',
            'permission_code': permission_code,
            'new_entry': True,
            'order': stage.order + 1,
            'comments': '',
            'created_user': stage.created_user.id
        }

    def determine_permission(self, assigned_user_id, assign_to_value, stage, stage_name, permission_code_str):
        """Determine and set the appropriate permission code."""
        requested_user_id = self.request.user.id
        first_reporting_authority_id = ApprovalUtils.get_first_reporting_authority_id(assign_to_value)

        if assigned_user_id == requested_user_id or (
                first_reporting_authority_id == requested_user_id
                and stage.approval_status != ApprovalConstants.APPROVED.value
        ):
            permission_code = ""
            if permission_code_str:
                try:
                    parsed_code = eval(permission_code_str) if isinstance(permission_code_str, str) else permission_code_str
                    permission_code = parsed_code[-1].split(".")[-1] if isinstance(parsed_code, list) else ""
                except (SyntaxError, ValueError):
                    permission_code = ""
            # print('updater determine_permission', permission_code)
            return self._create_new_entry(stage_name, stage, permission_code) if stage_name else None

        return None

    def push_new_entry_by_assignee(self, stage, approval_stages, stage_name, permission_code):
        """Main function to handle approval stage logic."""
        config = ApprovalUtils.get_config(self.instance)
        assign_to_field = config.get("assign_to_field") if config else None
        stage_exists = approval_stages.filter(stage_name=stage_name)
        if assign_to_field and not stage_exists:
            assigned_user_id, assign_to_value = ApprovalUtils.get_assigned_user_id(self.instance, assign_to_field)
            if assigned_user_id:
                return self.determine_permission(assigned_user_id, assign_to_value, stage, stage_name, permission_code)
        return None

    def get_filtered_permissions(self, permissions, permission_codes):
        """Filters permissions by removing optional stages unless they match the last permission code."""
        config = ApprovalUtils.get_config(self.instance)
        optional_stages = config.get("optional_stages",[]) if config else []

        if not optional_stages:
            return permissions

        app_label = self.instance._meta.app_label
        last_permission_code = ApprovalUtils.get_last_permission_code(permission_codes)

        return [
            perm for perm in permissions
            if perm[0] not in optional_stages or last_permission_code == f"{app_label}.{perm[0]}"
        ]
