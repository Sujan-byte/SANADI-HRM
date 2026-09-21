from hrm_audit_fields.approval_stages.approval_stage_initiator import ApprovalStageInitiator
from hrm_audit_fields.approval_stages.approval_stage_loader import ApprovalStageLoader
from hrm_audit_fields.approval_stages.approval_stage_processor import ApprovalStageProcessor
from hrm_audit_fields.approval_stages.approval_stage_updater import ApprovalStageUpdater


class ApprovalStageMain:

    def __init__(self, context, initial_data):
        """Initialize the context and initial_data."""
        self.context = context
        self.initial_data = initial_data

    def multi_level_approval_method(self, instance, data, status='DEFAULT'):
        """Handle multi-level approval stages."""
        approval_stages = getattr(instance, 'approval_stages', None)
        if approval_stages:
            self.instance = instance

            def update_approval_stage():
                """Handle the update of approval stage."""
                data.pop('approval_status', None)
                data.pop('approval_remarks', None)
                updater = ApprovalStageUpdater(self.instance, self.context, self.initial_data)
                updater.update_approval_stage(approval_stages)
                return data

            def create_approval_stages():
                """Handle the creation of approval stages."""
                initiator = ApprovalStageInitiator(self.context, approval_stages, instance)
                initiator.create_approval_stages_from_permissions()

            def process_approval_stage_details():
                """Process the approval stage details when provided."""
                approval_stage_detail_fields = self.context.get('request').query_params.get('approval_stage_detail_fields', '') if self.context.get('request') else None
                if approval_stage_detail_fields:
                    processor = ApprovalStageProcessor(self.context, approval_stages, approval_stage_detail_fields, self.instance)
                    data['approval_stages'] = processor.get_approval_stages_details()
                else:
                    loader = ApprovalStageLoader(self.context, approval_stages, instance)
                    loader.get_approval_stage_status(data)

            if status == 'UPDATE':
                return update_approval_stage()
            elif status == 'CREATE':
                create_approval_stages()
            else:
                process_approval_stage_details()

        return data
