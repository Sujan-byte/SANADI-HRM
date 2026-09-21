from hrm_audit_fields.approval_stages.approval_stage_utils import ApprovalUtils


class ApprovalStageInitiator:
    def __init__(self, context,approval_stages,instance):
        self.context = context
        self.approval_stages = approval_stages
        self.instance=instance

    def create_approval_stages_from_permissions(self):
        """Initialize the Approval Stages"""
        matching_permissions = ApprovalUtils.get_matching_permissions(self.context['request'], self.instance)
        created_user = self.context['request'].user
        stage_name, codename = ApprovalUtils.get_last_permission_stage_name(matching_permissions)

        if not self.approval_stages.filter(stage_name=stage_name).exists():
            return ApprovalUtils.create_approval_model(self.instance, stage_name, codename, created_user)

        return self.instance