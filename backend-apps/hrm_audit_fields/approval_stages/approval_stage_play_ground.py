""""Buffer File"""
# from hrm_audit_fields.models.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase
# from rest_framework.exceptions import ValidationError
# from django.apps import apps
# from django.utils import timezone
# from rest_framework import serializers
# from datetime import datetime
# import json
#
#
# # """ **** Re-usable Functions **** """
# # def get_matching_permissions(self,instance):
# #     app_label = instance._meta.app_label
# #     permissions = getattr(instance._meta, 'permissions', [])
# #     permission_codes = [perm[0] for perm in permissions]
# #     user_permissions = self.context['request'].user.get_all_permissions()
# #     matching_permissions = [code for code in permission_codes if f"{app_label}.{code}" in user_permissions]
# #     return matching_permissions
# #
# #
# # def get_last_permission_stage_name(matching_permissions):
# #     codename = matching_permissions[-1]
# #
# #     if not codename.startswith('custom_approval_stage_'):
# #         raise ValueError("Permission code should start with 'custom_approval_stage_'.")
# #
# #     stage_name = codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
# #     return stage_name,codename
# #
# #
# # def get_approval_model(instance):
# #     approval_model = instance.approval_stages.model
# #     return approval_model
# #
# #
# # def create_approval_model(instance,stage_name,codename):
# #     approval_model = get_approval_model(instance)
# #     stage = approval_model.objects.create(
# #         related_object=instance,
# #         stage_name=stage_name,
# #         approval_status=MultiApprovalMixinBase.PENDING_APPROVAL,
# #         order=1,
# #         permission_code=codename
# #     )
# #     instance.approval_stages.add(stage)
# #     instance.current_stage = stage_name
# #     instance.current_stage_description = f'Pending with {stage_name}'
# #     return instance
# #
# #
# # def get_permission_wise_approval_stages(self,approval_stages,instance):
# #     matching_permissions=get_matching_permissions(self,instance)
# #     if matching_permissions:
# #         permission_approval_stages = approval_stages.filter(permission_code__in=matching_permissions)
# #         if permission_approval_stages.exists():
# #             last_stage = permission_approval_stages.order_by('order').last()
# #             return last_stage
# #         return None
# #     return None
# #
# #
# # def get_last_permission_obj(approval_stages,instance):
# #     permissions = getattr(instance._meta, 'permissions', [])
# #     if permissions:
# #         codename, _ = permissions[-1]
# #         return approval_stages.filter(permission_code=codename).order_by('id').last()
# #     return None
# #
# #
# # def get_last_approval_obj(approval_stages):
# #     last_stage=approval_stages.order_by('order').last()
# #     return last_stage
# #
# #
# # def get_dynamic_serializer(DynamicModel, required_fields):
# #     class DynamicSerializer(serializers.ModelSerializer):
# #         class Meta:
# #             model = DynamicModel
# #             fields = required_fields
# #         def to_representation(self, instance):
# #             data = super().to_representation(instance)
# #             if 'modified_date' in data:
# #                 data['modified_date'] = datetime.strftime(instance.modified_date, '%d-%m-%Y %I:%M %p')
# #             data['normalized_approval_status'] = MultiApprovalMixinBase.APPROVAL_STATUS_DICT.get(instance.approval_status,
# #                                                                                              instance.approval_status)
# #             return data
# #
# #     return DynamicSerializer
# # """ **** Re-usable Functions Ends **** """
#
#
# # """ ***** On Create New Instance ***** """
# # def create_approval_stages_from_permissions(self, model_instance):
# #     matching_permissions = get_matching_permissions(self, model_instance)
# #     stage_name, codename = get_last_permission_stage_name(matching_permissions)
# #
# #     if not model_instance.approval_stages.filter(stage_name=stage_name).exists():
# #         return create_approval_model(model_instance, stage_name, codename)
# #
# #     return model_instance
# # """ ***** On Create Ends ***** """
#
#
#
# """ ***** On Get List and On Get By PK ***** """
# def get_approval_stage_status(self, instance, data, approval_stages):
#     pk = self.context['request'].parser_context['kwargs'].get('pk', None)
#
#     def set_status_from_stage(stage):
#         data['approval_stage_status'] = stage.approval_status
#         data['stage_name'] = stage.stage_name
#
#     def set_permission_code(permission_list):
#         app_label = instance._meta.app_label
#         data['approval_permission_code'] = [f"{app_label}.{permission}" for permission in permission_list]
#
#     if not pk:
#         filtered_stage = get_last_permission_obj(approval_stages, instance)
#
#         if filtered_stage and filtered_stage.approval_status == MultiApprovalMixinBase.APPROVED:
#             data['approval_stage_status'] = MultiApprovalMixinBase.APPROVED
#             data['local_approval_status'] = MultiApprovalMixinBase.APPROVED
#         else:
#             last_stage = get_permission_wise_approval_stages(self, approval_stages, instance)
#             if last_stage:
#                 data['local_approval_status'] = last_stage.approval_status
#     else:
#         last_stage = get_permission_wise_approval_stages(self, approval_stages, instance) or \
#                      approval_stages.order_by('order').last()
#
#         checked_stage = get_rejected_status_obj(self, approval_stages, last_stage)
#         set_status_from_stage(checked_stage)
#
#         matching_permissions = get_matching_permissions(self, instance)
#         if matching_permissions:
#             new_stage_name = matching_permissions[-1].split('custom_approval_stage_')[-1].replace('_', ' ').title()
#             data['stage_name'] = new_stage_name
#             set_permission_code(matching_permissions)
#         else:
#             set_permission_code([last_stage.permission_code])
#     return "No Approval Stages"
#
#
# def get_rejected_status_obj(self, approval_stages, last_stage):
#     rejection_type = getattr(self.instance, 'get_rejection_type',
#                              lambda: MultiApprovalMixinBase.OPEN_RE_ENTRY)()
#
#     stage = approval_stages.all().order_by('order').last()
#     if stage.approval_status == MultiApprovalMixinBase.REJECTED and last_stage.approval_status == MultiApprovalMixinBase.APPROVED:
#         if rejection_type == MultiApprovalMixinBase.PREVIOUS_FLOW_RE_ENTRY:
#             previous_stage = approval_stages.filter(order__lt=stage.order).last()
#             if previous_stage.stage_name == last_stage.stage_name:
#                 previous_stage.approval_status = MultiApprovalMixinBase.REJECTED
#                 return previous_stage
#             return last_stage
#         return stage
#     return last_stage
# """ ***** On Get List and On Get By PK Ends ***** """
#
#
#
# # """ ***** Get Approval Stage Details to show remarks in UI ***** """
# # def get_approval_stages_details(self, instance, approval_stage_detail_fields,approval_stages):
# #     """Fetch and serialize approval stages for the given instance."""
# #     approval_model = get_approval_model(instance)
# #     required_fields = approval_stage_detail_fields.split(',')
# #     ApprovalStageSerializer = get_dynamic_serializer(approval_model, required_fields)
# #     data = ApprovalStageSerializer(approval_stages, many=True).data
# #
# #     last_stage=get_last_approval_obj(approval_stages)
# #     new_entry = push_new_entry_on_rejection(self,last_stage)
# #     if not  new_entry:
# #         new_entry=push_new_entry_for_higher_authority(self,last_stage)
# #     if new_entry:
# #         data.insert(0, new_entry)
# #     return data
# #
# #
# # def create_new_entry(stage_name, stage, permission_code):
# #     return {
# #         'stage_name': stage_name,
# #         'approval_status': '-',
# #         'normalized_approval_status': '-',
# #         'approval_by': '-',
# #         'modified_date': '-',
# #         'permission_code': permission_code,
# #         'new_entry': True,
# #         'order': stage.order + 1,
# #         'comments': '',
# #     }
# #
# #
# # def push_new_entry_on_rejection(self, stage):
# #     stage_name = self.context['request'].query_params.get('stage_name')
# #     new_entry = None
# #     if stage and stage.approval_status == MultiApprovalMixinBase.REJECTED and stage.stage_name != stage_name:
# #         permission_code = self.context['request'].query_params.get('permission_code', '')
# #         if permission_code:
# #             permission_code = eval(permission_code)[-1]
# #             permission_code = permission_code.split('.')[-1]
# #         else:
# #             permission_code = ""
# #         if stage_name:
# #             new_entry = {}
# #             new_entry.update(create_new_entry(stage_name,stage,permission_code))
# #     return new_entry
# #
# #
# # def push_new_entry_for_higher_authority(self, stage):
# #     stage_name = self.context['request'].query_params.get('stage_name')
# #     new_entry = None
# #     if stage and stage.approval_status == MultiApprovalMixinBase.PENDING_APPROVAL:
# #         permission_code_string = self.context['request'].query_params.get('permission_code', '')
# #         permission_codes = [permission_code.split('.')[-1] for permission_code in eval(permission_code_string)]
# #         if stage.permission_code in permission_codes:
# #             new_stage_name = permission_codes[-1].split('custom_approval_stage_')[-1].replace('_', ' ').title()
# #             if stage.stage_name != new_stage_name:
# #                 if stage_name:
# #                     new_entry = {}
# #                     new_entry.update(create_new_entry(stage_name,stage,permission_codes[-1]))
# #     return new_entry
# # """ ***** Get Approval Stage Detail Ends ***** """
#
#
# # """ ***** Update Approval Stage ***** """
# # def update_approval_stage(self,approval_stages):
# #     approval_stage_status = self.initial_data.get('approval_stage_status')
# #     approval_stage_comment = self.initial_data.get('approval_stage_comment', "")
# #     new_approval_stage = self.initial_data.get('new_approval_stage', None)
# #     stage_name = self.initial_data.get('stage_name', "")
# #     permission_code = self.initial_data.get('approval_permission_code', [])
# #
# #     if not approval_stage_status:
# #         return
# #
# #     if new_approval_stage:
# #         add_newly_generated_stage(self,json.loads(new_approval_stage), approval_stage_status, self.instance)
# #     else:
# #         new_entry = get_new_entry_on_rejection(self,approval_stages, stage_name, permission_code)
# #         if new_entry:
# #             add_newly_generated_stage(self,new_entry, approval_stage_status, self.instance)
# #
# #     user = self.context['request'].user
# #     filtered_stage = approval_stages.filter(stage_name=stage_name).order_by('order').last()
# #
# #     if not filtered_stage:
# #         return
# #
# #     update_data = {
# #         "approval_status": approval_stage_status,
# #         "approved_user_id": user.pk,
# #         "approval_by": user.first_name,
# #         "modified_date": timezone.now(),
# #         "comments": approval_stage_comment
# #     }
# #
# #     if approval_stage_status == MultiApprovalMixinBase.APPROVED:
# #         update_data.update({
# #             "approval_date": timezone.now().date()
# #         })
# #         if check_is_final_stage(self.instance,stage_name):
# #             update_current_instance(self,self.instance,stage_name)
# #         else:
# #             create_next_approval_stage(self,self.instance, stage_name, filtered_stage)
# #     else:
# #         self.instance.current_stage_description= get_current_stage_description(approval_stage_status,stage_name,user.first_name)
# #         self.instance.current_stage = stage_name
# #         self.instance.approval_status = approval_stage_status
# #         self.instance.save()
# #
# #     for field, value in update_data.items():
# #         setattr(filtered_stage, field, value)
# #
# #     filtered_stage.save()
# #
# #
# # def create_next_approval_stage(self, instance, stage_name, filtered_stage):
# #     permissions = getattr(instance._meta, 'permissions', [])
# #     if permissions:
# #         for idx, (codename, _) in enumerate(permissions):
# #             current_stage_name = codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
# #
# #             if current_stage_name == stage_name:
# #                 if idx + 1 < len(permissions):
# #                     next_codename, _ = permissions[idx + 1]
# #                     next_stage_name = next_codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
# #
# #                     approval_model = instance.approval_stages.model
# #                     approval_model.objects.create(
# #                         related_object=instance,
# #                         stage_name=next_stage_name,
# #                         approval_status=MultiApprovalMixinBase.PENDING_APPROVAL,
# #                         order=filtered_stage.order + 1,
# #                         permission_code=next_codename,
# #                     )
# #                     instance.current_stage=next_stage_name
# #                     instance.current_stage_description=f"Pending with {next_stage_name}"
# #                     instance.save()
# #                     return
# #
# #
# # def add_newly_generated_stage(self, stage_details, status, instance):
# #     # print("New entry stage details:", stage_details)
# #     approval_model = self.instance.approval_stages.model
# #     stage_details.pop('new_entry', None)
# #     stage_details.pop('normalized_approval_status', None)
# #     approval_model.objects.create(
# #         related_object=instance,
# #         stage_name=stage_details['stage_name'],
# #         approval_status=status,
# #         order=stage_details['order'],
# #         permission_code=stage_details['permission_code'],
# #     )
# #     return
# #
# #
# # def get_new_entry_on_rejection(self, approval_stages, stage_name, permission_codes):
# #     # print("comes at new entry",stage_name,permission_codes)
# #     stage = approval_stages.order_by('order').last()
# #     new_entry = None
# #     if approval_stages and stage.approval_status == MultiApprovalMixinBase.REJECTED and stage.stage_name != stage_name:
# #         if permission_codes:
# #             permission_code = eval(permission_codes)[-1]
# #             permission_code = permission_code.split('.')[-1]
# #         else:
# #             permission_code = ""
# #         if stage_name:
# #             new_entry = {}
# #             new_entry.update({
# #                 'stage_name': stage_name,
# #                 'approval_status': '-',
# #                 'normalized_approval_status': '-',
# #                 'approval_by': '-',
# #                 'modified_date': '-',
# #                 'permission_code': permission_code,
# #                 'new_entry': True,
# #                 'order': stage.order + 1,
# #                 'comments': '',
# #             })
# #     return new_entry
# #
# #
# # def check_is_final_stage(instance,stage_name):
# #     permissions = getattr(instance._meta, 'permissions', [])
# #     codename,_=permissions[-1]
# #     last_stage_name = codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
# #     return stage_name==last_stage_name
# #
# #
# # def update_current_instance(self,instance,stage_name):
# #     approved_user = self.context.get('request').user
# #     approval_by = self.context['request'].user.first_name
# #     instance.approved_user = approved_user
# #     instance.approval_by = approval_by
# #     instance.approval_date = timezone.now().date()
# #     instance.approval_status = MultiApprovalMixinBase.APPROVED
# #     instance.current_stage = stage_name
# #     instance.current_stage_description=f"Approved by {stage_name}"
# #     instance.save()
# #
# #
# # def get_current_stage_description(approval_status,stage_name,approval_by):
# #     if approval_status in [MultiApprovalMixinBase.REJECTED, MultiApprovalMixinBase.NOT_APPROVED,
# #                               MultiApprovalMixinBase.PENDING_APPROVAL]:
# #         status_message = (
# #             f"Rejected by {stage_name}-{approval_by}" if approval_status == MultiApprovalMixinBase.REJECTED
# #             else f"Pending with {stage_name}"
# #         )
# #         return status_message
# #
# #
# # """ ***** Update Approval Stage Ends ***** """
# #
#
#
#
#
