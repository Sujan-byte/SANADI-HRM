import ast

from rest_framework import serializers
from datetime import datetime
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase


class ApprovalUtils:

    @staticmethod
    def get_model_permissions(instance):
       all_permissions = getattr(instance._meta, 'permissions', [])
       filtered_permissions =[
            perm for perm in all_permissions if perm[0].startswith('custom_approval_stage_')
        ]
       return filtered_permissions


    @staticmethod
    def get_matching_permissions(request, instance):
        """Get the matching permissions for the given instance based on user permissions."""
        app_label = instance._meta.app_label
        permissions = ApprovalUtils.get_model_permissions(instance)
        permission_codes = [perm[0] for perm in permissions]
        user_permissions = request.user.get_all_permissions()
        user_permission_set = {f"{app_label}.{code}" for code in permission_codes} & user_permissions

        highest_index = -1
        for idx, code in enumerate(permission_codes):
            if f"{app_label}.{code}" in user_permission_set:
                highest_index = idx

        return permission_codes[: highest_index + 1] if highest_index >= 0 else []

    # # initial code
    # @staticmethod
    # def get_matching_permissions(request, instance):
    #     """Get the matching permissions for the given instance based on user permissions."""
    #     app_label = instance._meta.app_label
    #     permissions = ApprovalUtils.get_model_permissions(instance)
    #     permission_codes = [perm[0] for perm in permissions]
    #     user_permissions = request.user.get_all_permissions()
    #     matching_permissions = [code for code in permission_codes if f"{app_label}.{code}" in user_permissions]
    #     return matching_permissions

    # second revised code
    # @staticmethod
    # def get_matching_permissions(request, instance):
    #     """Get the matching permissions for the given instance based on user permissions."""
    #     app_label = instance._meta.app_label
    #     permissions = ApprovalUtils.get_model_permissions(instance)
    #     permission_codes = [perm[0] for perm in permissions]
    #     user_permissions = request.user.get_all_permissions()
    #
    #     matching_permissions = []
    #     for code in permission_codes:
    #         if f"{app_label}.{code}" in user_permissions:
    #             matching_permissions = permission_codes[: permission_codes.index(code) + 1]
    #             break
    #     return matching_permissions

    @staticmethod
    def get_last_permission_stage_name(matching_permissions):
        """Get the stage name and codename for the last permission."""
        try:
            codename = matching_permissions[-1]

            if not codename.startswith('custom_approval_stage_'):
                raise ValueError("Permission code should start with 'custom_approval_stage_'.")

            stage_name = codename.split('custom_approval_stage_')[-1].replace('_', ' ').title()
            return stage_name, codename
        except Exception as e:
            raise serializers.ValidationError("You do not have permission to perform this action.")

    @staticmethod
    def get_approval_model(instance):
        """Get the approval model related to the instance."""
        approval_model = instance.approval_stages.model
        return approval_model

    @staticmethod
    def create_approval_model(instance, stage_name, codename, user):
        """Create a new approval model instance and associate it with the instance."""
        approval_model = ApprovalUtils.get_approval_model(instance)
        stage = approval_model.objects.create(
            related_object=instance,
            stage_name=stage_name,
            approval_status=MultiApprovalMixinBase.PENDING_APPROVAL,
            order=1,
            permission_code=codename,
            created_user = user
        )
        instance.approval_stages.add(stage)
        instance.approval_remarks = f'Pending with {stage_name}'
        instance.save()
        return instance

    @staticmethod
    def get_permission_wise_approval_stages(approval_stages, instance, request):
        """Get approval stages for matching permissions."""
        matching_permissions = ApprovalUtils.get_matching_permissions(request, instance)
        if matching_permissions:
            permission_approval_stages = approval_stages.filter(permission_code__in=matching_permissions)
            if permission_approval_stages.exists():
                last_stage = permission_approval_stages.order_by('order').last()
                return last_stage
        return None

    @staticmethod
    def get_last_permission_obj(approval_stages, instance):
        """Get the last approval object based on permission code."""
        permissions = ApprovalUtils.get_model_permissions(instance)
        if permissions:
            codename, _ = permissions[-1]
            return approval_stages.filter(permission_code=codename).order_by('id').last()
        return None

    @staticmethod
    def get_last_approval_obj(approval_stages):
        """Get the last approval stage object."""
        last_stage = approval_stages.order_by('order').last()
        return last_stage

    @staticmethod
    def get_dynamic_serializer(DynamicModel, required_fields):
        """Get a dynamic serializer for the given model and required fields."""

        class DynamicSerializer(serializers.ModelSerializer):
            class Meta:
                model = DynamicModel
                fields = required_fields

            def to_representation(self, instance):
                """Custom to_representation to format 'modified_date' and 'approval_status'."""
                data = super().to_representation(instance)
                if 'modified_date' in data:
                    data['modified_date'] = datetime.strftime(instance.modified_date, '%d-%m-%Y %I:%M %p')
                data['normalized_approval_status'] = MultiApprovalMixinBase.APPROVAL_STATUS_DICT.get(
                    instance.approval_status, instance.approval_status)
                return data

        return DynamicSerializer

    @staticmethod
    def get_previous_stage_by_permission_code(instance, permission_code):
        permissions = [perm[0] for perm in ApprovalUtils.get_model_permissions(instance)]
        try:
            index = permissions.index(permission_code)
            previous_stage = permissions[index - 1] if index > 0 else None
        except ValueError:
            return None
        return previous_stage.split('custom_approval_stage_')[-1].replace('_', ' ').title() if previous_stage else None

    @staticmethod
    def get_rejection_type(instance):
        if hasattr(instance, 'get_approval_stage_config'):
            config = instance.get_approval_stage_config()
        else:
            config = {'rejection_type': MultiApprovalMixinBase.OPEN_RE_ENTRY}

        return config.get('rejection_type', MultiApprovalMixinBase.OPEN_RE_ENTRY)

    @staticmethod
    def get_config(instance):
        """Retrieve the approval stage config if available."""
        return instance.get_approval_stage_config() if hasattr(instance,
                                                                    'get_approval_stage_config') else None

    @staticmethod
    def get_assigned_user_id(instance,assign_to_field):
        """Retrieve the assigned user's ID based on the assign_to_field."""
        assign_to_value = getattr(instance, assign_to_field, None)
        return getattr(assign_to_value, 'id', None), assign_to_value

    @staticmethod
    def get_first_reporting_authority_id(assign_to_value):
        """Retrieve the first reporting authority's user ID if available."""
        if hasattr(assign_to_value, 'employee') and assign_to_value.employee:
            return getattr(assign_to_value.employee.first_reporting_authority.user, 'id', None)
        return None

    @staticmethod
    def get_last_permission_code(permission_codes):
        """Safely extracts the last permission code from a list or string representation of a list."""
        if isinstance(permission_codes, str):
            try:
                permission_codes = ast.literal_eval(permission_codes)
            except (ValueError, SyntaxError):
                return None

        if isinstance(permission_codes, list) and permission_codes:
            return permission_codes[-1]

        return None





