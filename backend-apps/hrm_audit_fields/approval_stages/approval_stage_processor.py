import ast
from hrm_audit_fields.approval_stages.approval_stage_utils import ApprovalUtils
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase
from hrm_utils.constants import ApprovalConstants


class ApprovalStageProcessor:
    def __init__(self, request_context, approval_stages, approval_stage_detail_fields,instance):
        self.context = request_context
        self.approval_stages = approval_stages
        self.approval_stage_detail_fields = approval_stage_detail_fields
        self.instance=instance
        self.request =self.context['request']

    def get_approval_stages_details(self):
        """Fetch and serialize approval stages for the given instance."""
        approval_model = ApprovalUtils.get_approval_model(self.instance)
        required_fields = self.approval_stage_detail_fields.split(',')
        ApprovalStageSerializer = ApprovalUtils.get_dynamic_serializer(approval_model, required_fields)
        data = ApprovalStageSerializer(self.approval_stages.order_by('-order'), many=True).data
        last_stage = ApprovalUtils.get_last_approval_obj(self.approval_stages)
        new_entry = self._push_new_entry_on_rejection(last_stage)
        if not new_entry:
            new_entry = self._push_new_entry_for_higher_authority(last_stage)

        if not new_entry:
            new_entry = self.push_new_entry_by_assignee(last_stage)
        print("new entry",new_entry)
        if new_entry:
            data.insert(0, new_entry)

        return data

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
            'created_user':stage.created_user.id
        }

    def _push_new_entry_on_rejection(self, stage):
        """Push a new entry if the stage was rejected."""
        stage_name = self.context['request'].query_params.get('stage_name')
        new_entry = None
        if stage and stage.approval_status == MultiApprovalMixinBase.REJECTED and stage.stage_name != stage_name:
            permission_code = self.context['request'].query_params.get('permission_code', '')
            if permission_code:
                permission_code = eval(permission_code)[-1]
                permission_code = permission_code.split('.')[-1]
            else:
                permission_code = ""

            if stage_name:
                new_entry = self._create_new_entry(stage_name, stage, permission_code)

        return new_entry

    def _push_new_entry_for_higher_authority(self, stage):
        """Push a new entry for higher authority."""
        stage_name = self.context['request'].query_params.get('stage_name')
        new_entry = None
        if stage and stage.approval_status == MultiApprovalMixinBase.PENDING_APPROVAL:
            permission_code_string = self.context['request'].query_params.get('permission_code', '')
            permission_codes = [permission_code.split('.')[-1] for permission_code in eval(permission_code_string)]
            if stage.permission_code in permission_codes:
                new_stage_name = permission_codes[-1].split('custom_approval_stage_')[-1].replace('_', ' ').title()
                if stage.stage_name != new_stage_name:
                    if stage_name:
                        new_entry = self._create_new_entry(stage_name, stage, permission_codes[-1])

        return new_entry

    def determine_permission(self, assigned_user_id, assign_to_value, stage):
        """Determine and set the appropriate permission code."""
        requested_user_id = self.request.user.id
        first_reporting_authority_id = ApprovalUtils.get_first_reporting_authority_id(assign_to_value)

        if assigned_user_id == requested_user_id or (
                first_reporting_authority_id == requested_user_id
                and stage.approval_status != ApprovalConstants.APPROVED.value
        ):
            stage_name = self.context["request"].query_params.get("stage_name")
            permission_code_str = self.context["request"].query_params.get("permission_code", "")

            permission_code = ""
            if permission_code_str:
                try:
                    parsed_code = ast.literal_eval(permission_code_str)
                    permission_code = parsed_code[-1].split(".")[-1] if isinstance(parsed_code, list) else ""
                except (SyntaxError, ValueError):
                    permission_code = ""

            return self._create_new_entry(stage_name, stage, permission_code) if stage_name else None

        return None

    def push_new_entry_by_assignee(self, stage):
        """Main function to handle approval stage logic."""
        config = ApprovalUtils.get_config(self.instance)
        assign_to_field = config.get("assign_to_field") if config else None
        stage_name = self.context["request"].query_params.get("stage_name")
        stage_exists=self.approval_stages.filter(stage_name=stage_name)
        if assign_to_field and not stage_exists:
            assigned_user_id, assign_to_value = ApprovalUtils.get_assigned_user_id(self.instance, assign_to_field)
            if assigned_user_id:
                return self.determine_permission(assigned_user_id, assign_to_value, stage)
        return None

