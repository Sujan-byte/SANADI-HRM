from hrm_audit_fields.approval_stages.approval_stage_utils import ApprovalUtils
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase

from hrm_utils.constants import ApprovalConstants


class ApprovalStageLoader:
    def __init__(self, context,approval_stages,instance):
        self.context = context
        self.approval_stages = approval_stages
        self.instance=instance
        self.request = self.context['request']


    """ ***** On Get List and On Get By PK ***** """
    def get_approval_stage_status(self,data):
        pk = self.context['request'].parser_context['kwargs'].get('pk', None)
        # print('number', data.get('form_code'))
        def set_status_from_stage(stage):
            data['approval_stage_status'] = stage.approval_status
            data['stage_name'] = stage.stage_name

        def set_permission_code(permission_list):
            app_label = self.instance._meta.app_label
            data['approval_permission_code'] = [f"{app_label}.{permission}" for permission in permission_list]

        if not pk:
            # print('if')
            filtered_stage = ApprovalUtils.get_last_permission_obj(self.approval_stages, self.instance)

            if filtered_stage and filtered_stage.approval_status == MultiApprovalMixinBase.APPROVED:
                data['approval_stage_status'] = MultiApprovalMixinBase.APPROVED
                data['local_approval_status'] = MultiApprovalMixinBase.APPROVED
            else:
                last_stage = ApprovalUtils.get_permission_wise_approval_stages(self.approval_stages, self.instance,self.request)
                if last_stage:
                    data['local_approval_status'] = last_stage.approval_status
        else:
            # print('else')
            permission_last_stage = ApprovalUtils.get_permission_wise_approval_stages(
                self.approval_stages, self.instance, self.request
            )
            checked_stage = self.get_rejected_status_obj(
                self.approval_stages,
                permission_last_stage or self.approval_stages.order_by('order').last()
            )
            # print('stage', permission_last_stage, checked_stage)
            if checked_stage:
                set_status_from_stage(checked_stage)
                if permission_last_stage:
                    matching_permissions = ApprovalUtils.get_matching_permissions(self.context['request'],
                                                                                  self.instance)
                    if matching_permissions:
                        data['stage_name'] = matching_permissions[-1].split('custom_approval_stage_')[-1].replace('_',
                                                                                                                  ' ').title()
                        set_permission_code(matching_permissions)
                else:
                    self.process_approval_stage(data,checked_stage)
        # print('approval_stage_status', data.get('approval_stage_status'))
        return "No Approval Stages"


    def get_rejected_status_obj(self, approval_stages, last_stage):
        rejection_type=ApprovalUtils.get_rejection_type(self.instance)
        stage = approval_stages.all().order_by('order').last()
        if stage and stage.approval_status == MultiApprovalMixinBase.REJECTED and last_stage.approval_status == MultiApprovalMixinBase.APPROVED:
            if rejection_type == MultiApprovalMixinBase.PREVIOUS_FLOW_RE_ENTRY:
                previous_stage=ApprovalUtils.get_previous_stage_by_permission_code(self.instance,stage.permission_code)
                previous_stage = approval_stages.filter(stage_name=previous_stage).order_by('order').last()
                if previous_stage.stage_name == last_stage.stage_name:
                    previous_stage.approval_status = MultiApprovalMixinBase.REJECTED
                    return previous_stage
                return last_stage
            return stage
        return last_stage

    def determine_permission(self, assigned_user_id, assign_to_value, data, checked_stage):
        """Determine and set the appropriate permission code."""
        requested_user_id = self.request.user.id
        first_reporting_authority_id = ApprovalUtils.get_first_reporting_authority_id(assign_to_value)

        if assigned_user_id == requested_user_id or (first_reporting_authority_id == requested_user_id and data[
            'approval_stage_status'] != ApprovalConstants.APPROVED.value):
            user_permission = ApprovalUtils.get_matching_permissions(self.request, self.instance)
            permission = user_permission[-1]  # Get last permission
            stage_name = permission.split('custom_approval_stage_')[-1].replace('_', ' ').title()
            data['stage_name'] = stage_name
            self.set_permission_code(user_permission,data)
        else:
            self.set_permission_code([checked_stage.permission_code],data)

    def set_permission_code(self,permission_list, data):
        app_label = self.instance._meta.app_label
        data['approval_permission_code'] = [f"{app_label}.{permission}" for permission in permission_list]

    def process_approval_stage(self, data, checked_stage):
        """Main function to handle approval stage logic."""
        config = ApprovalUtils.get_config(self.instance)
        assign_to_field = config.get('assign_to_field') if config else None

        if assign_to_field:
            assigned_user_id, assign_to_value = ApprovalUtils.get_assigned_user_id(self.instance, assign_to_field)
            if assigned_user_id:
                self.determine_permission(assigned_user_id, assign_to_value, data, checked_stage)
            else:
                self.set_permission_code([checked_stage.permission_code],data)
        else:
            self.set_permission_code([checked_stage.permission_code],data)

    """ ***** On Get List and On Get By PK Ends ***** """