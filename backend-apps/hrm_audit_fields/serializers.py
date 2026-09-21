from django.contrib.auth.models import AnonymousUser
from rest_framework import serializers

from hrm_audit_fields.approval_stages.approval_stage_main import ApprovalStageMain
from . import models
from datetime import datetime
from django.utils import timezone

from .models.approval_model_mixin import  ApprovalModelMixin

class AuditModelMixinSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AuditModelMixin
        fields = '__all__'

    def create(self, validated_data):
        validated_data['created'] = timezone.now()
        validated_data['modified'] = timezone.now()
        if 'request' in self.context  and self.context['request'].user:
            validated_data['user_created'] = self.context['request'].user.first_name + '(' + self.context[
                'request'].user.email + ')' if not isinstance(self.context['request'].user, AnonymousUser) else self.context['request'].user
            # validated_data['device'] = self.context['request'].META.get('HTTP_USER_AGENT')
            validated_data['user_modified'] = self.context['request'].user.first_name + '(' + self.context[
                'request'].user.email + ')' if not isinstance(self.context['request'].user, AnonymousUser) else self.context['request'].user
            validated_data['ip_address'] = self.get_client_ip()
            validated_data['b_id'] = self.get_query_int('b_id')
            validated_data['uc_id'] = self.context['request'].user.id if self.context['request'].user else None
            validated_data['um_id'] = self.context['request'].user.id if self.context['request'].user else None
            validated_data['c_id'] = self.get_query_int('c_id')
            validated_data['decimal'] = self.get_query_int('decimal')
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['modified'] = timezone.now()
        # validated_data['device'] = self.context['request'].META.get('HTTP_USER_AGENT')
        if 'request' in self.context  and self.context['request'].user:
            validated_data['user_modified'] = str(self.context['request'].user)
            validated_data['ip_address'] = self.get_client_ip()
            validated_data['b_id'] = self.get_query_int('b_id')
            validated_data['c_id'] = self.get_query_int('c_id')
            validated_data['um_id'] = self.context['request'].user.id if self.context['request'].user else None
            validated_data['decimal'] = self.get_query_int('decimal')
        return super().update(instance, validated_data)

    def get_query_int(self, param_name):
        """
        Read an IntegerField-bound query param (b_id/c_id/decimal) safely.
        These model fields are nullable (see hrm_audit_fields.models.AuditModelMixin),
        but the frontend's jwt.interceptor always sets them - as an empty
        string when the value isn't known yet (e.g. a user with no branch/
        company assigned). Django rejects '' for an IntegerField outright
        ("Field 'c_id' expected a number but got ''"), so normalize blank/
        missing values to None here instead of forwarding them as-is.
        """
        value = self.context.get('request').query_params.get(param_name)
        if value in (None, ''):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    def get_client_ip(self):
        x_forwarded_for = self.context.get('request').META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[-1].strip()
        else:
            ip = self.context.get('request').META.get('REMOTE_ADDR')
        return ip


class ApprovalModelMixinSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        # approved_user = self.context.get('request').user
        # approval_by = self.context['request'].user.first_name
        # validated_data['approved_user'] = approved_user
        # validated_data['approval_by'] = approval_by
        # validated_data['approval_date'] = timezone.now().date()
        base_revised_fk = validated_data.get('base_revised_fk', None)
        if base_revised_fk is not None:
            self.context['logger_status'] = 'revised'
        instance=super().create(validated_data)
        self.call_multi_approval_main(instance, {},status='CREATE')
        if hasattr(instance,'base_revised_fk') and instance.base_revised_fk is not None:
                # Sending the previous version to the Inactive list once it has been revised, so it can no
                # longer be edited/restored on its own without going through the new revision first.
                instance.base_revised_fk.is_revised = True
                instance.base_revised_fk.is_active = False
                instance.base_revised_fk.save()
        if hasattr(instance, 'base_revised_fk') and instance.base_revised_fk is not None:
            instance.base_revised_fk.is_revised = True
            instance.base_revised_fk.save()
        return instance

    def update(self, instance, validated_data, **kwargs):
        request = self.context.get('request')
        
        #--------------- THIS IS DONE FOR EDIT IN TRANSACTION HISTORY----------
        #1. 
        old_status = instance.approval_status

        #2
        new_status = validated_data.get('approval_status', instance.approval_status)
        #3
        is_superuser = request.user.is_superuser if request else False

        #4
        if old_status == 'APPROVED' and new_status == 'APPROVED' and is_superuser:
            # 5:
            self.context['logger_status'] = 'edited'
        #-----------------------------------------------------------------------

        #------------- PREVENT RESTORING A REVISED RECORD WHILE ITS OWN REVISION IS STILL ACTIVE (applies to every form with revisions) -------------
        if instance.is_active is False and validated_data.get('is_active') is True and getattr(instance, 'is_revised', False):
            model_class = type(instance)
            if model_class.objects.filter(base_revised_fk=instance, is_active=True).exists():
                raise serializers.ValidationError({
                    'is_active': 'Cannot activate this record because its revised entry is still active. Please deactivate the revised entry first.'
                })
        #-----------------------------------------------------------------------

        if request and request.method != 'PATCH':
            approved_user = self.context['request'].user
            approval_by = self.context['request'].user.first_name
            validated_data['approved_user'] = approved_user
            validated_data['approval_by'] = approval_by
            validated_data['approval_date'] = timezone.now().date()
            validated_data = self.call_multi_approval_main(instance, validated_data, status='UPDATE')
            approval_status = validated_data.get('approval_status', instance.approval_status)
            if approval_status=='APPROVED' and hasattr(instance,'base_revised_fk') and instance.base_revised_fk is not None:
                print("comes here",instance.base_revised_fk)
                instance.base_revised_fk.is_lock = True
                instance.base_revised_fk.save()
        return super().update(instance, validated_data)

    class Meta:
        model = ApprovalModelMixin
        fields = '__all__'
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        self.call_multi_approval_main(instance, data)
        logger_status = self.context.get('logger_status', None)
        if logger_status:
            data['logger_status'] = logger_status
        return data

    # Multi stage Approval code
    def call_multi_approval_main(self, instance, data, status='DEFAULT'):
        # print('status', status)
        # print('self', self)
        # print('self_attribute', self.get('self_attribute'))
        initial_data = self.initial_data if hasattr(self, 'initial_data') else None
        # self.context = self.context if (status != 'DEFAULT') else self.context 
        main_stage = ApprovalStageMain(self.context, initial_data)
        main_stage.multi_level_approval_method(instance, data, status)
        return data
