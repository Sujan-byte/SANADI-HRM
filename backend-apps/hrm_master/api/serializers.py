# serializers.py
import ast, re
import importlib
import json
from datetime import datetime, timedelta, date, time

import os
from urllib import request
from urllib.parse import urljoin
from backend import settings
from rest_framework import serializers
import uuid
from django.db.models.functions import Length
from django.db.models import Func, F
import math
from decimal import Decimal, ROUND_DOWN, InvalidOperation

from django.db import transaction
from copy import deepcopy
from django.db.models import Q
from django.db.models import F
from django.db.models.signals import post_save
from django.db import IntegrityError
from django.utils import timezone
from django.db.models import Q
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import Group
from django.forms import model_to_dict
from rest_framework import serializers

from hrm_utils import custom_handle_empty_fields
from branch.models import BranchUser
from hrm_main.api.service import EmployeeGraceDetails
from hrm_main.api.time_sheet_cal import TimeSheetCal
from hrm_master.models import Department, Designation, EmployeeLetterImages, EmployeeMaster, Grade, LeaveReversalRequest, GradeMonthlyAllowanceDetails, GradeMonthlyDeductionDetails, HolidayMaster, LeaveDetails, LeaveEntry, LeaveMaster, LeaveMasterDetailBreakup, LeaveMasterDetails, ShiftMaster, ShiftTimings
from master.models import AppSettings, Editor, FormSettings
from hrm_utils.custom_functions import CustomFunction, convert_base64
from hrm_master.models import Department, Designation, Grade, LeaveDetails, EmployeeMaster, LeaveEntry, LeaveMaster, LeaveMasterDetails, HolidayMaster, ShiftTimings, LeaveMasterDetailBreakup
from master.models import Editor, AppSettings, FormSettings
from hrm_audit_fields.serializers import AuditModelMixinSerializer, ApprovalModelMixinSerializer
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import Permission
# from master.signals.mark_for_recalculation import mark_for_recalculation
from hrm_utils.constants import NumberConstructorConstants
from hrm_utils.number_constuctor import NumberConstructor
from hrm_utils.custom_functions import context_data_on_create, \
    context_data_on_update, remove_permissions, add_permissions
from hrm_master.models import PreviousEmploymentDetails, EmployeeDocumentsDetails, DocumentTypeMaster, LeaveApplication, LeavePolicy, LeavePolicyDetail, SalaryComponents
from master.models import GlobalMaster
from hrm_audit_fields.models.validator_mixin import DynamicValidatorModel, UniqueConstraintValidator
from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from security import models
from master import models
from notificationemail.notification import NotificationService
from hrm_master.models import PreviousEmploymentDetails
from master.models import GlobalMaster
from hrm_utils.custom_functions import convert_form_data, DefaultValue, validate_nation, phone_number_validate, \
    tax_number_validate, email_validate, TableFunction
from hrm_main.models import AttendanceStatusMaster, EmployeeMonthlyAllowanceDetails, GratuityEmployeeForm, AttendanceDetails
from django.db.models import Sum
from hrm_main.models import EmployeeMonthlySalary, EmployeeMonthlyDeductionDetails
# NotificationApprovalERPSerializer moved to notifications/signals.py handlers
from datetime import timedelta
from django.core.exceptions import ValidationError
from hrm_utils.custom_functions import ImageConversion
from security.models import EditorConfiguration
from hrm_master.models import TicketMaster, TicketHistory
from hrm_master.models import AllowanceMaster, AllowanceAssignment
from rest_framework.exceptions import ValidationError  as ve
from django.core.exceptions import ValidationError
from hrm_utils.custom_functions import format_date_with_day
import re
from hrm_utils.custom_handle_empty_fields import handle_empty_fields
from django.contrib.contenttypes.models import ContentType
from security.api.serializers import UserSerializer
User = get_user_model()
from datetime import date
from hrm_utils.custom_handle_empty_fields import handle_empty_fields

ALLOWED_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']

class DepartmentSerializer(AuditModelMixinSerializer):
    class Meta:
        model = Department
        fields = '__all__'

    def to_internal_value(self, data):
        data = data.copy()
        return super().to_internal_value(handle_empty_fields(data, model=Department, serializer=self))

    def create(self, validated_data):
        request = self.context.get('request')
        try:
            validated_data['department_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.DEPARTMENT_CODE)
        except:
            raise serializers.ValidationError("App key: DEPARTMENT_CODE does not exist")
        department_name = validated_data.get('department_name', '').lower().strip()
        b_id = self.get_query_int('b_id')
        self.validate_unique_department_name(department_name, b_id, request=request)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        department_name = validated_data.get('department_name', instance.department_name).lower().strip()
        # print("department_name", department_name)
        b_id = self.get_query_int('b_id')
        # print("b_id", b_id)
        self.validate_unique_department_name(department_name, b_id, instance.id, request=request)
        return super().update(instance, validated_data)

    def validate_unique_department_name(self, department_name, b_id, instance_id=None, **kwargs):
        if Department.objects.filter(department_name__iexact=department_name, b_id=b_id).exclude(
                id=instance_id).exists():
            raise serializers.ValidationError(f"Department with name '{department_name}' already exists.")


class DesignationSerializer(AuditModelMixinSerializer):
    class Meta:
        model = Designation
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        try:
            validated_data['designation_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.DESIGNATION_CODE)
        except:
            raise serializers.ValidationError("App key: DESIGNATION_CODE does not exist")
        designation_name = validated_data.get('designation_name', '').lower().strip()
        # print("designation_name", designation_name)
        b_id = self.get_query_int('b_id')
        # print("b_id", b_id)
        self.validate_unique_designation_name(designation_name, b_id, request=request)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        designation_name = validated_data.get('designation_name', instance.designation_name).lower().strip()
        # print("designation_name", designation_name)
        b_id = self.get_query_int('b_id')
        # print("b_id", b_id)
        self.validate_unique_designation_name(designation_name, b_id, instance.id, request=request)

        return super().update(instance, validated_data)

    def validate_unique_designation_name(self, designation_name, b_id, instance_id=None, **kwargs):
        if Designation.objects.filter(designation_name__iexact=designation_name, is_active=True).exclude(
                id=instance_id).exists():
            raise serializers.ValidationError(f"Designation with name '{designation_name}' already exists.")


class AllowanceMasterSerializer(AuditModelMixinSerializer):
    class Meta:
        model = AllowanceMaster
        fields = '__all__'

    def create(self, validated_data):
        try:
            validated_data['allowance_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.ALLOWANCE_CODE)
        except Exception:
            raise serializers.ValidationError("App key: ALLOWANCE_CODE does not exist")
        allowance_name = validated_data.get('allowance_name', '').lower().strip()
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        if AllowanceMaster.objects.filter(allowance_name__iexact=allowance_name, b_id=b_id).exists():
            raise serializers.ValidationError(f"Allowance name '{allowance_name}' already exists.")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        allowance_name = validated_data.get('allowance_name', instance.allowance_name).lower().strip()
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        if AllowanceMaster.objects.filter(allowance_name__iexact=allowance_name, b_id=b_id).exclude(id=instance.id).exists():
            raise serializers.ValidationError(f"Allowance name '{allowance_name}' already exists.")
        return super().update(instance, validated_data)


class AllowanceAssignmentListSerializer(serializers.ListSerializer):
    """Custom list serializer — collects ALL duplicate conflicts across the batch
    and raises a single combined error string the frontend can display as-is."""

    def validate(self, data):
        from django.db.models import Q
        conflicts = []

        for attrs in data:
            employee  = attrs.get('employee')
            allowance = attrs.get('allowance')
            from_date = attrs.get('from_date')
            to_date   = attrs.get('to_date')
            batch_id  = attrs.get('batch_id')

            if not (employee and allowance):
                continue

            qs = AllowanceAssignment.objects.filter(
                employee=employee,
                allowance=allowance,
                is_active=True,
            )
            if batch_id:
                qs = qs.exclude(batch_id=batch_id)

            if from_date and to_date:
                qs = qs.filter(
                    Q(from_date__lte=to_date) &
                    (Q(to_date__gte=from_date) | Q(to_date__isnull=True))
                )
            elif from_date:
                qs = qs.filter(Q(to_date__gte=from_date) | Q(to_date__isnull=True))
            elif to_date:
                qs = qs.filter(Q(from_date__lte=to_date))

            conflict = qs.select_related('employee').first()
            if conflict:
                emp  = conflict.employee
                name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
                code = emp.employee_code or ''
                asgn = conflict.assignment_code or ''
                fd   = conflict.from_date.strftime('%d-%m-%Y') if conflict.from_date else '—'
                td   = conflict.to_date.strftime('%d-%m-%Y')   if conflict.to_date   else 'open'
                conflicts.append(f"{code} - {name} (existing: {asgn}, {fd} to {td})")

        if conflicts:
            raise serializers.ValidationError(
                "Duplicate allowance assignment for the same date range: " +
                "; ".join(conflicts) + "."
            )

        return data


class AllowanceAssignmentSerializer(AuditModelMixinSerializer):
    employee_name       = serializers.SerializerMethodField()
    employee_code       = serializers.SerializerMethodField()
    designation_name    = serializers.SerializerMethodField()
    department_name     = serializers.SerializerMethodField()
    from_date      = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    to_date        = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    allowance_type = serializers.CharField(required=True, allow_blank=False)
    allowance_default_object = serializers.SerializerMethodField()

    class Meta:
        model      = AllowanceAssignment
        fields     = '__all__'
        list_serializer_class = AllowanceAssignmentListSerializer

    def get_employee_name(self, obj):
        if obj.employee_id:
            return f"{obj.employee.first_name or ''} {obj.employee.last_name or ''}".strip()
        return ''

    def get_employee_code(self, obj):
        return obj.employee.employee_code if obj.employee_id else ''

    def get_designation_name(self, obj):
        if obj.employee_id and obj.employee.designation_id:
            return obj.employee.designation.designation_name or ''
        return ''

    def get_department_name(self, obj):
        if obj.employee_id and obj.employee.department_id:
            return obj.employee.department.department_name or ''
        return ''

    def get_allowance_default_object(self, obj):
        """Default object for the lazy allowance dropdown — lets PrimeNG show the selected label
        in edit mode without requiring the full options list to be loaded."""
        if obj.allowance_id:
            return {
                'id':    obj.allowance_id,
                'label': f"{obj.allowance_code} - {obj.allowance_name}".strip(' -'),
            }
        return {}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.from_date:
            data['from_date'] = instance.from_date.strftime('%d-%m-%Y')
        if instance.to_date:
            data['to_date'] = instance.to_date.strftime('%d-%m-%Y')
        # For list display — human-readable amount/rate
        if instance.mode == 'auto':
            data['amount_display'] = f"{instance.rate}/unit"
        else:
            data['amount_display'] = str(instance.amount)
        return data


class LeaveDetailsSerializer(AuditModelMixinSerializer):
    leave_type = serializers.CharField(allow_blank=True, allow_null=True)

    class Meta:
        model = LeaveDetails
        fields = [
            'id',
            'leave_type',
            'number_of_leaves',
            'grade',
        ]


class GradeMonthlyAllowanceDetailsSerializer(AuditModelMixinSerializer):
    tableRowId = serializers.IntegerField(default=0, source="table_row_id")

    class Meta:
        model = GradeMonthlyAllowanceDetails
        fields = '__all__'

    def validate_monthly(self, value):
        if value in [None, 0, "", "0", 0.0]:
            raise serializers.ValidationError("Monthly amount cannot be empty or zero.")
        return value


class GradeMonthlyDeductionDetailsSerializer(AuditModelMixinSerializer):
    tableRowId = serializers.IntegerField(default=0, source="table_row_id")

    class Meta:
        model = GradeMonthlyDeductionDetails
        fields = '__all__'

    def validate_monthly(self, value):
        if value in [None, 0, "", "0", 0.0]:
            raise serializers.ValidationError("Monthly amount cannot be empty or zero.")
        return value


class GradeSerializer(AuditModelMixinSerializer):
    grade_gross_deductions = GradeMonthlyDeductionDetailsSerializer(many=True, required=False)
    grade_gross_earnings = GradeMonthlyAllowanceDetailsSerializer(many=True, required=False)

    class Meta:
        model = Grade
        fields = '__all__'

    def to_internal_value(self, data):
        data = data.copy()
        data = convert_form_data(data)
        file_upload = data.pop('file', None)
        grade_gross_deductions = data.pop('grade_gross_deductions', [])
        grade_gross_earnings = data.pop('grade_gross_earnings', [])
        validated_data = super().to_internal_value(handle_empty_fields(data, model=Grade, serializer=self))
        validated_data['grade_gross_deductions'] = grade_gross_deductions
        validated_data['grade_gross_earnings'] = grade_gross_earnings
        return validated_data

    def create(self, validated_data):
        request = self.context.get('request')
        try:
            validated_data['grade_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.GRADE_CODE)
        except Exception as e:
            raise serializers.ValidationError("App key: GRADE_CODE does not exist")
        grade_code = validated_data.get('grade_code', '').lower().strip()
        grade_description = validated_data.get('grade_description', '').lower().strip()
        grade_gross_deductions = validated_data.pop('grade_gross_deductions', [])
        grade_gross_earnings = validated_data.pop('grade_gross_earnings', [])
        master_service = importlib.import_module('hrm_master.api.service')
        grade_signal = master_service.MasterSignal
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        grade_signal.validate_grade_master(grade_code, grade_description, b_id)
        instance = super().create(validated_data)
        self._create_or_update_grade_gross_deductions(instance, grade_gross_deductions, request=request)
        self._create_or_update_grade_gross_earnings(instance, grade_gross_earnings, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        grade_code = validated_data.get('grade_code', '').lower().strip()
        grade_description = validated_data.get('grade_description', '').lower().strip()
        grade_gross_deductions = validated_data.pop('grade_gross_deductions', [])
        grade_gross_earnings = validated_data.pop('grade_gross_earnings', [])
        instance = super().update(instance, validated_data)
        master_service = importlib.import_module('hrm_master.api.service')
        grade_signal = master_service.MasterSignal
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        grade_signal.validate_grade_master(grade_code, grade_description, b_id, exclude_instance=instance)
        self._create_or_update_grade_gross_deductions(instance, grade_gross_deductions, request=request)
        self._create_or_update_grade_gross_earnings(instance, grade_gross_earnings, request=request)
        self.employee_salary_update(validated_data, instance, request=request)
        # if validated_data['confirm_msg']:
        #     self.employee_salary_update(validated_data, instance, request=request)
        return instance

    def _create_or_update_grade_gross_deductions(self, employee_monthly_instance,
                                                 gross_deductions_items_data, **kwargs):
        employee_deduction_items_ids = []
        for item_data in gross_deductions_items_data:
            # print("item_data",item_data)
            self.validate_duplicate_data(gross_deductions_items_data)
            if 'id' in item_data and isinstance(item_data['id'], str):
                # print(" update item_data.component", item_data['components'])
                item_data.pop('id')
                item_data['gross_deductions'] = employee_monthly_instance.id
                employee_deduction_items_serializer = GradeMonthlyDeductionDetailsSerializer(data=item_data,
                                                                                             context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                gross_deductions_item_instance = employee_deduction_items_serializer.create(
                    employee_deduction_items_serializer.validated_data)

                employee_deduction_items_ids.append(gross_deductions_item_instance.id)
            else:
                # print(" create item_data.component", item_data['components'])
                employee_deduction_items_ids.append(item_data['id'])
                employee_deduction_item_instance = GradeMonthlyDeductionDetails.objects.get(id=item_data['id'])
                employee_deduction_items_serializer = GradeMonthlyDeductionDetailsSerializer(
                    instance=employee_deduction_item_instance,
                    data=item_data,
                    context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                employee_deduction_items_serializer.update(
                    employee_deduction_item_instance,
                    employee_deduction_items_serializer.validated_data)
        self._delete_deduction_detail_items(employee_deduction_items_ids, employee_monthly_instance)
        return True

    def _create_or_update_grade_gross_earnings(self, employee_monthly_instance,
                                               gross_earnings_items_data, **kwargs):
        employee_allowance_items_ids = []
        for item_data in gross_earnings_items_data:
            self.validate_duplicate_data(gross_earnings_items_data)
            # print("item_data",item_data)
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['gross_earnings'] = employee_monthly_instance.id
                employee_allowance_items_serializer = GradeMonthlyAllowanceDetailsSerializer(data=item_data,
                                                                                             context=self.context)
                employee_allowance_items_serializer.is_valid(raise_exception=True)
                gross_earnings_item_instance = employee_allowance_items_serializer.create(
                    employee_allowance_items_serializer.validated_data)

                employee_allowance_items_ids.append(gross_earnings_item_instance.id)
            else:
                employee_allowance_items_ids.append(item_data['id'])
                employee_allowance_item_instance = GradeMonthlyAllowanceDetails.objects.get(id=item_data['id'])
                employee_allowance_items_serializer = GradeMonthlyAllowanceDetailsSerializer(
                    instance=employee_allowance_item_instance,
                    data=item_data,
                    context=self.context)
                employee_allowance_items_serializer.is_valid(raise_exception=True)
                employee_allowance_items_serializer.update(
                    employee_allowance_item_instance,
                    employee_allowance_items_serializer.validated_data)
        self._delete_allowance_detail_items(employee_allowance_items_ids, employee_monthly_instance)
        return True

    def _delete_deduction_detail_items(self, ids, employee_deduction_item_instance):
        GradeMonthlyDeductionDetails.objects.filter(
            gross_deductions=employee_deduction_item_instance).exclude(
            id__in=ids).delete()

    def _delete_allowance_detail_items(self, ids, employee_allowance_item_instance):
        GradeMonthlyAllowanceDetails.objects.filter(
            gross_earnings=employee_allowance_item_instance).exclude(
            id__in=ids).delete()

    def validate_duplicate_data(self, items_data):
        component_names = set()  # Set to store unique component names
        for item_data in items_data:
            if 'components' in item_data:
                component_name = item_data['components'].lower().strip()
                if component_name in component_names:
                    # Duplicate component name found
                    raise ValueError(f"Duplicate component name found: {component_name}")
                else:
                    component_names.add(component_name)

    def validate(self, attrs):
        """Global validation for both create and update operations"""
        grade_description = attrs.get('grade_description')
        if grade_description:
            grade_description = grade_description.strip()
            request = self.context.get('request')
            b_id = None
            if request:
                b_id = getattr(request, 'b_id', None) or request.query_params.get('b_id')
            
            if not b_id and self.instance:
                b_id = self.instance.b_id
            
            if b_id:
                qs = Grade.objects.filter(grade_description__iexact=grade_description,b_id=b_id)
                
                # Exclude current instance for update
                if self.instance and self.instance.pk:
                    qs = qs.exclude(pk=self.instance.pk)
                
                if qs.exists():
                    raise serializers.ValidationError({
                        "grade_description": "Grade description already exists for this business."
                    })
        return attrs

    def employee_salary_update(self, validated_data, instances, request):
        salary_employees = EmployeeMonthlySalary.objects.filter(employee__grade=instances.id)

        for salary_instance in salary_employees:
            # Process Allowances
            for earning in instances.grade_gross_earnings.all():
                earning_data = {
                    'components': earning.components,
                    'monthly': earning.monthly,
                    'yearly': earning.yearly,
                    'grade_allowance': earning,
                    'gross_earnings': salary_instance,
                    'b_id': earning.b_id,
                    'table_row_id': earning.table_row_id if earning.table_row_id else 0,
                    'salary_component': earning.salary_component if earning.salary_component else None,

                }
                allowance = EmployeeMonthlyAllowanceDetails.objects.filter(
                    grade_allowance=earning,
                    gross_earnings=salary_instance
                ).first()
                if not allowance:
                    allowance = EmployeeMonthlyAllowanceDetails.objects.filter(
                        gross_earnings=salary_instance,
                        components__iexact=earning.components
                    ).first()
                if allowance:
                    allowance.monthly = earning.monthly
                    allowance.yearly = earning.yearly
                    allowance.components = earning.components
                    allowance.grade_allowance = earning
                    allowance.table_row_id = earning.table_row_id if earning.table_row_id else 0
                    allowance.salary_component = earning.salary_component if earning.salary_component else None
                    allowance.save()
                else:
                    EmployeeMonthlyAllowanceDetails.objects.create(**earning_data)

            # Process Deductions
            for deduction in instances.grade_gross_deductions.all():
                deduction_data = {
                    'components': deduction.components,
                    'monthly': deduction.monthly,
                    'yearly': deduction.yearly,
                    'grade_deduction': deduction,
                    'gross_deductions': salary_instance,
                    'b_id': deduction.b_id,
                    'table_row_id': deduction.table_row_id if deduction.table_row_id else 0,
                    'salary_component': deduction.salary_component if deduction.salary_component else None
                }
                deductions = EmployeeMonthlyDeductionDetails.objects.filter(
                    grade_deduction=deduction,
                    gross_deductions=salary_instance
                ).first()
                if not deductions:
                    deductions = EmployeeMonthlyDeductionDetails.objects.filter(
                        gross_deductions=salary_instance,
                        components__iexact=deduction.components
                    ).first()
                if deductions:
                    deductions.monthly = deduction.monthly
                    deductions.yearly = deduction.yearly
                    deductions.components = deduction.components
                    deductions.grade_deduction = deduction
                    deductions.table_row_id = deduction.table_row_id if deduction.table_row_id else 0
                    deductions.salary_component = deduction.salary_component if deduction.salary_component else None
                    deductions.save()
                else:
                    EmployeeMonthlyDeductionDetails.objects.create(**deduction_data)

            # Calculate net pay and CTC
            salary_instance.net_pay_monthly = round(instances.gross_monthly_total - instances.deduction_monthly_total)
            salary_instance.net_pay_yearly = round(instances.gross_yearly_total - instances.deduction_yearly_total)
            salary_instance.ctc = salary_instance.net_pay_yearly
            salary_instance.save()

        return True

class DocumentTypeMasterSerializer(AuditModelMixinSerializer):
    class Meta:
        model = DocumentTypeMaster
        fields = "__all__"

    def validate_doc_type_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Document type name is required.")

        value = str(value).strip()

        qs = DocumentTypeMaster.objects.filter(
            doc_type_name__iexact=value,
            is_active=True
        )

        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                f"Document type name '{value}' already exists."
            )

        return value

    def create(self, validated_data):
        validated_data.setdefault("applies_to", "Employee")
        if not validated_data.get("doc_type_code"):
            try:
                validated_data["doc_type_code"] = NumberConstructor().generate_next_sequence(
                    NumberConstructorConstants.DOCUMENT_TYPE_CODE
                )
            except Exception:
                raise serializers.ValidationError(
                    "App key: DOCUMENT_TYPE_CODE does not exist"
                )

        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)

        alert_days = data.get("default_alert_days") or []
        if isinstance(alert_days, list):
            data["default_alert_days_display"] = ", ".join(
                str(item.get("value", item)) if isinstance(item, dict) else str(item)
                for item in alert_days
            )
        else:
            data["default_alert_days_display"] = str(alert_days)

        data["expiry_required_display"] = "Yes" if instance.expiry_required else "No"

        return data


class EmployeeDocumentsDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = EmployeeDocumentsDetails
        fields = [
            'id',
            'employee_document',
            'document_type_master',
            'document_name',
            'document',
            'document_number',
            'document_valid_upto',
            'issue_date'
        ]

    def get_document_url(self, obj):
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
        return None
    
    def validate_document_name(self, value):
        # Get the parent equipment
        employee_document = (
            self.instance.employee_document if self.instance else self.initial_data.get("employee_document")
        )
        document_number=  self.instance.document_number if self.instance else self.initial_data.get("document_number")

        if not employee_document:
            return value  # Skip validation if parent not provided

        # Case-insensitive check
        qs = EmployeeDocumentsDetails.objects.filter(
            employee_document=employee_document,
            document_name__iexact=value,  # case-insensitive match
            document_number__iexact=document_number

        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                f"A document with the name '{value}' (case-insensitive) already exists for this Employee."
            )

        return value

    def to_internal_value(self, data):
        # Handling null values - child table
        if 'document_valid_upto' in data:
            data['document_valid_upto'] = data['document_valid_upto'] if data['document_valid_upto'] != "" else None
        if 'issue_date' in data:
            data['issue_date'] = data['issue_date'] if data['issue_date'] != "" else None
        product_image = data.pop('document', None)
        if product_image is not None:
            if isinstance(product_image, dict):
                data['document'] = ImageConversion().check_image(product_image, type='type')
        validated_data = super().to_internal_value(data)
        return validated_data

    def create(self, validated_data):
        if validated_data.get("document_type_master") and not validated_data.get("document_name"):
            validated_data["document_name"] = validated_data["document_type_master"].doc_type_name
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("document_type_master") and not validated_data.get("document_name"):
            validated_data["document_name"] = validated_data["document_type_master"].doc_type_name
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # handle if document deleted from server
        file_obj = instance.document

        if file_obj:
            try:
                if not file_obj.storage.exists(file_obj.name):
                    data['document'] = None
            except Exception:
                data['document'] = None

        request = self.context.get('request')
        if instance.employee_document is not None:
            employee_data = EmployeeMaster.objects.filter(id=instance.employee_document_id).values(
                'employee_code', 'first_name'
            ).first()
            data['Employee' \
            'Master'] = employee_data if employee_data else {}

        if instance.document_type_master:
            data['document_type_master_object'] = {
                'id': instance.document_type_master.id,
                'doc_type_code': instance.document_type_master.doc_type_code,
                'doc_type_name': instance.document_type_master.doc_type_name,
                'expiry_required': instance.document_type_master.expiry_required,
                'default_alert_days': instance.document_type_master.default_alert_days,
            }
        else:
            data['document_type_master_object'] = None

        expiry_date = instance.document_valid_upto
        if expiry_date:
            data['days_to_expiry'] = (expiry_date - timezone.now().date()).days
        else:
            data['days_to_expiry'] = None

        return data


class PreviousEmploymentDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = PreviousEmploymentDetails
        fields = [
            'id',
            'employee_previous',
            'company_name',
            'designation',
            'location',
            'joined_date',
            'resigned_date',
        ]

class EmployeeLetterImagesSerializer(AuditModelMixinSerializer):
    class Meta:
        model = EmployeeLetterImages
        fields = '__all__'

    def to_internal_value(self, data):
        # Handling null values - child table
        file = data.pop('file', None)
        validated_data = super().to_internal_value(data)
        if file is not None:
            data['file'] = file

            file = self.check_image(data)

        validated_data['file'] = file

        return validated_data

    def check_image(self, image):
        if 'file' in image and isinstance(image, dict):
            file_content = image['file']
            if isinstance(file_content, str) and ';base64,' in file_content:
                file_name = image['file_name'] if 'file_name' in image else 'image.png'
                file_type = image['file_type'] if 'file_type' in image else 'image/png'
                image_file = convert_base64(image['file'], file_name, file_type)
                return image_file
            else:
                return None

class EmployeeMasterSerializer(AuditModelMixinSerializer):
    display_employee_status = serializers.SerializerMethodField(read_only=True)

    employee_letter_images = EmployeeLetterImagesSerializer(many=True, required=False, read_only=True)
    dob = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    doj = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    dor = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    doc = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    cicpa_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                              required=False)
    passport_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                required=False)
    passport_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                 required=False)
    visa_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                            required=False)
    visa_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                             required=False)
    emirates_id_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                   required=False)
    emirates_id_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                    required=False)
    labour_card_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                   required=False)
    labour_card_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                    required=False)
    fhc_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                           required=False)
    fhc_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                            required=False)
    job_loss_insurance_issue_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'],
                                                          allow_null=True,
                                                          required=False)
    job_loss_insurance_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'],
                                                           allow_null=True,
                                                           required=False)
    issue_date_of_license = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                  required=False)
    expiry_date_of_license = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                                   required=False)
    previous_employments = PreviousEmploymentDetailsSerializer(many=True, required=False)
    # employee_documents_details = EmployeeDocumentsDetailsSerializer(many=True, required=False)
    employee_documents_details = serializers.ListField(required=False, write_only=True)

    class Meta:
        model = EmployeeMaster
        fields = '__all__'


    def get_display_employee_status(self, instance):
        # Onboarding statuses take priority — return stored value directly
        MANAGED_STATUSES = {'Onboarding', 'Documents Pending', 'Salary Setup Pending'}
        if instance.employee_status in MANAGED_STATUSES:
            return instance.employee_status

        # Existing operational status logic
        active_leave = self.has_active_leave_today(instance)

        if instance.is_under_leave and active_leave:
            return 'On Leave'

        elif instance.is_under_leave and not active_leave:
            return 'Not Joined'

        elif instance.is_available:
            return 'Available'

        return 'On Hire'

    def validate_restricted_employee_documents(self, employee_documents_details):
        restricted_docs = {
            'passport': 'Passport Details',
            'visa': 'Visa Details',
            'emiratesid': 'Emirates ID Details',
            'labourcard': 'Labour Card Details',
            'workpermit': 'Labour Card Details',
            'medicalhealthinsurance': 'Medical health insurance Details',
            'joblossinsurance': 'Job Loss Insurance Details',
        }

        def normalize(value):
            return re.sub(r'[^a-z0-9]', '', str(value or '').lower())

        for item in employee_documents_details or []:
            document_name = item.get('document_name')
            normalized_name = normalize(document_name)

            for restricted_key, section_name in restricted_docs.items():
                if restricted_key in normalized_name:
                    display_name = str(document_name or '').replace('_', ' ').title()
                    raise serializers.ValidationError({
                        'employee_documents_details': (
                            f"{display_name} should be uploaded in {section_name}, "
                            f"not in the bottom certificate upload table."
                        )
                    })
                
    def create(self, validated_data):
        service = importlib.import_module('hrm_master.api.service')
        # print("in service", service)

        request = self.context.get('request')
        # print("request in create", request)
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        # print("b_id in create", b_id)
        is_imported = self.context.get('imported', False)
        if not is_imported:
            try:
                code = NumberConstructor().generate_next_sequence(
                    NumberConstructorConstants.EMPLOYEE_CODE)
                if '-' in code:
                    prefix, number = code.split('-', 1)
                    final_code = f"{prefix}{number.zfill(3)}"
                else:
                    final_code = code
                validated_data['employee_code'] = final_code

            except Exception as e:
                raise serializers.ValidationError("App key: EMPLOYEE_CODE does not exist")
            try:
                validated_data = self.validate(validated_data)
            except serializers.ValidationError as e:
                raise serializers.ValidationError({"dob": str(e)})
            previous_employments = validated_data.pop('previous_employments', [])
            employee_documents_details = validated_data.pop('employee_documents_details', [])
            self.validate_restricted_employee_documents(employee_documents_details)
            employee_letter_images= validated_data.pop('employee_letter_images', [])

            # if 'device_id' in validated_data:
            #     if EmployeeMaster.objects.filter(device_id=validated_data['device_id']).exists():
            #         raise serializers.ValidationError(f"The Device '{validated_data['device_id']}' already exists.")
            instance = super().create(validated_data)
            if instance.grade is not None:
                service.EmployeeSalary.create_employee_salary_based_on_grade(instance)
            if 'doc' in validated_data and validated_data['doc']:
                self._create_employee_gratuity(instance, request,b_id)
            if 'system_user' in validated_data and validated_data['system_user'] == True:
                if not validated_data.get('email'):
                        raise serializers.ValidationError({'email': 'Email is required for system users.'})
                if validated_data['user_password'] == "" or validated_data['user_password'] is None:
                    raise serializers.ValidationError({'User Password': 'User Password cannot be empty'})
                if validated_data['groups'] == "" or validated_data['groups'] is None:
                    raise serializers.ValidationError({'System Access Group': 'System Access Group cannot be empty'})
                else:
                    emp_password = validated_data['user_password']
            else:
                emp_password = validated_data['first_name'][:4] + validated_data['employee_code'][-2:]
            if 'email' in validated_data and 'system_user' in validated_data and validated_data['system_user'] == True:
                if User.objects.filter(email=validated_data['email']).exists():
                    raise serializers.ValidationError(f"The email '{validated_data['email']}' already exists.")
                user = User.objects.create(
                    employee=instance,
                    username=validated_data['employee_code'],
                    first_name=instance.first_name,
                    last_name=instance.last_name,
                    password=make_password(emp_password),
                    email=instance.email,
                    date_of_birth=instance.dob,
                    phone_number=instance.local_mobile_number,
                    b_id=getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id'),
                    user_created=str(self.context['request'].user),
                    user_modified=str(self.context['request'].user),
                    ip_address=self.get_client_ip(),
                    branch_id=b_id
                )

                BranchUser.objects.create(
                    branch_id=b_id,
                    user=user,
                    table_row_id=user.id
                )

                if 'groups' in validated_data and validated_data['groups'] is not None:
                    user.groups.add(validated_data['groups'])
                instance = EmployeeMaster.objects.get(id=instance.id)
                instance.user = user
                instance.user_password = user.password
                instance.save()

                emailNotification = NotificationService()
                emailNotification.send_user_created_email(to_mail=validated_data.get('email'),
                                                          username=validated_data['first_name'],
                                                          employee_code=validated_data['employee_code'],
                                                          email_body=emp_password)
            self._create_or_update_employee_letter_images(instance, employee_letter_images)
            self._create_or_update_previous_employments(instance, previous_employments, request=request)
            self._create_or_update_employee_documents_details(instance, employee_documents_details,
                                                              request=request)
            # self._create_leave_master_for_employee(instance,request)

        else:
            instance = super().create(validated_data)
            if instance.grade is not None:
                service.EmployeeSalary.create_employee_salary_based_on_grade(instance)
        return instance

    def _create_or_update_employee_letter_images(self, employee_letter_instance, employee_letter_images):
        image_ids = []

        for item_data in (employee_letter_images or []):
            item_data['employee_letters'] = employee_letter_instance.id
            if 'id' not in item_data or isinstance(item_data['id'], str):
                serializer = EmployeeLetterImagesSerializer(data=item_data, context=self.context)
                serializer.is_valid(raise_exception=True)
                instance = serializer.save()
                image_ids.append(instance.id)
            else:
                image_ids.append(item_data['id'])

        EmployeeLetterImages.objects.filter(employee_letters=employee_letter_instance).exclude(id__in=image_ids).delete()


    def get_leave_policies_for_employee(self, employee_type, employee_group, employee_reporting, b_id):
        # print("b_id and details", b_id, employee_type, employee_group, employee_reporting)
        employee_type_q = Q(employee_group="All") if employee_type in ["", None, "All"] else Q(
            employee_type=employee_type)
        employee_group_q = Q(employee_group="All") if employee_group in ["", None, "All"] else Q(
            employee_group=employee_group)
        employee_reporting_q = Q(employee_reporting="All") if employee_reporting in ["", None, "All"] else Q(
            employee_reporting=employee_reporting)

        leave_policies = LeavePolicy.objects.filter(
            Q(b_id=b_id) &
            Q(is_active=True) &
            employee_type_q &
            employee_group_q &
            employee_reporting_q
        ).order_by('id')

        # print("leave_policies", leave_policies)
        return leave_policies

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # print("hello",getattr(self.context['request'], 'b_id', None))
        old_instance = EmployeeMaster.objects.get(id=instance.id)
        service = importlib.import_module('hrm_master.api.service')
        prev_is_active = instance.is_active
        new_is_active = validated_data.get('is_active', prev_is_active)
        # request = self.context.get('request')
        # print("sdddd",request.b_id,getattr(self.context['request'], 'b_id', None))
        b_id = getattr(request, 'b_id', None) or request.query_params.get('b_id') or instance.b_id
        # b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        # print("b_id",b_id)
        is_imported = self.context.get('imported', False)
        # self.validate_previous_value_changes(validated_data)
        if not is_imported:
            try:
                validated_data = self.validate(validated_data)
            except serializers.ValidationError as e:
                raise serializers.ValidationError({"dob": str(e)})
            if 'email' in validated_data and validated_data['email']:
                if EmployeeMaster.objects.exclude(id=instance.id).filter(email=validated_data['email'], b_id=b_id,
                                                                         is_active=True).exists():
                    raise serializers.ValidationError(f"The email '{validated_data['email']}' already exists.")

            if 'system_user' in validated_data and validated_data['system_user']:
                if not validated_data['email']:
                    raise serializers.ValidationError(f"Please Provide Email")

                exists_email = EmployeeMaster.objects.get(id=instance.id)
                emp_password = validated_data[
                    'user_password'] if not exists_email.user_password else exists_email.user_password
                # print("emp passowrd",emp_password)
                if (exists_email.email != validated_data['email']):
                    if User.objects.filter(email=validated_data['email']).exists():
                        raise serializers.ValidationError(f"The email '{validated_data['email']}' already exists.")

                if models.User.objects.filter(employee=instance.id).exists():
                    user = models.User.objects.get(employee=instance.id)
                    validated_data['user'] = user
                    if models.User.objects.filter(id=user.id).exists():
                        user.username = validated_data['employee_code']
                        user.first_name = validated_data['first_name']
                        user.last_name = validated_data['last_name']
                        user.email = validated_data['email']
                        user.date_of_birth = validated_data.get('dob', None)
                        user.phone_number = validated_data.get('local_mobile_number', '')
                        # user.b_id=int(getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')),
                        user.user_modified = str(self.context['request'].user),
                        user.modified = timezone.now()
                        user.ip_address = self.get_client_ip(),
                        user.is_active = True
                        user.groups.clear()
                        user.groups.add(validated_data['groups']) if 'groups' in validated_data and validated_data[
                            'groups'] is not None else None
                        if 'system_user' not in validated_data or not validated_data['system_user']:
                            if user.password == "" or user.password is None:
                                user.password = make_password(
                                    validated_data['first_name'][:4] + validated_data['employee_code'][-2:])
                        else:
                            if validated_data['user_password'] == "" or validated_data['user_password'] is None:
                                raise serializers.ValidationError({'User Password': 'User Password cannot be empty'})
                            if validated_data['groups'] == "" or validated_data['groups'] is None:
                                raise serializers.ValidationError(
                                    {'System Access Group': 'System Access Group cannot be empty'})
                        user.save()
                        # if exists_email.email != validated_data['email']:
                        #     emailNotification = NotificationService()
                        #     if 'system_user' in validated_data and validated_data['system_user'] == True:
                        #         # emp_password = exists_email.user_password
                        #         emp_password = validated_data['first_name'][:4] + validated_data['employee_code'][-2:]
                        #     else:
                        #         if user.password == "" or user.password is None:
                        #             user.password = validated_data['first_name'][:4] + validated_data['employee_code'][
                        #                                                                -2:]
                        # emailNotification.send_user_update_email(to_mail=validated_data['email'],
                        #                                          username=validated_data['first_name'],
                        #                                          employee_code=validated_data['employee_code'],
                        #                                          email_body=emp_password)
                else:
                    if 'email' in validated_data:
                        user = User.objects.create(
                            employee=instance,
                            username=validated_data['employee_code'],
                            first_name=instance.first_name,
                            last_name=instance.last_name,
                            password=make_password(emp_password),
                            email=validated_data['email'],
                            date_of_birth=instance.dob,
                            phone_number=instance.local_mobile_number,
                            b_id=getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id'),
                            user_created=str(self.context['request'].user),
                            user_modified=str(self.context['request'].user),
                            ip_address=self.get_client_ip(),
                            branch_id=b_id
                        )

                        BranchUser.objects.create(
                            branch_id=b_id,
                            user=user,
                            table_row_id=user.id
                        )

                        if 'groups' in validated_data and validated_data['groups'] is not None:
                            user.groups.add(validated_data['groups'])
                        instance = EmployeeMaster.objects.get(id=instance.id)
                        instance.user = user
                        instance.user_password = user.password
                        validated_data['user'] = user
                        # print("instance user password", instance.user)
                        instance.save()

                        emailNotification = NotificationService()
                        emailNotification.send_user_created_email(to_mail=validated_data.get('email'),
                                                                  username=validated_data['first_name'],
                                                                  employee_code=validated_data['employee_code'],
                                                                  email_body=emp_password)

            instance = EmployeeMaster.objects.get(id=instance.id)
            employee_documents_details = validated_data.pop('employee_documents_details', [])
            self.validate_restricted_employee_documents(employee_documents_details)
            previous_employments = validated_data.pop('previous_employments', [])
            employee_letter_images= validated_data.pop('employee_letter_images', [])

            # is_under_leave -> employee status
            if 'is_under_leave' in validated_data:
                new_is_under_leave = validated_data.get('is_under_leave')
                old_is_under_leave = instance.is_under_leave

                # Only handle when toggle actually changed
                if new_is_under_leave != old_is_under_leave:

                    # Trying to turn ON under leave
                    if new_is_under_leave is True:
                        if instance.is_available is False and instance.employee_status == 'On Hire':
                            raise serializers.ValidationError({
                                "is_under_leave": "This operator is currently On Hire. Please release the operator before marking as Under Leave."
                            })

                        active_leave = self.has_active_leave_today(instance)

                        if active_leave:
                            validated_data['employee_status'] = 'On Leave'
                        else:
                            validated_data['employee_status'] = 'Not Joined'

                        validated_data['is_available'] = False

                    # Trying to turn OFF under leave
                    else:
                        self.validate_under_leave_toggle_off(instance)
                        validated_data['employee_status'] = 'Available'
                        validated_data['is_available'] = True


            instance = super().update(instance, validated_data)

            # Sync dor to gratuity form whenever it changes in employee master
            new_dor = validated_data.get('dor')
            if new_dor != old_instance.dor:
                GratuityEmployeeForm.objects.filter(employee=instance).update(dor=new_dor)

            # Trigger full gratuity create/update only when confirmation date actually changes.
            # Use 'doc' in validated_data (not `if new_doc`) so that a date being set for
            # the first time (old=None, new=date) is also caught correctly.
            new_doc = validated_data.get('doc')
            if 'doc' in validated_data and new_doc != old_instance.doc and new_doc is not None:
                print("doc changed, creating/updating gratuity form")
                self._create_employee_gratuity(instance, request, b_id)
            # service.EmployeeSalary.update_employee_salary_based_on_grade(instance, old_instance)
            # print("update..create befoe 919",employee_letter_images)
            self._create_or_update_employee_letter_images(instance, employee_letter_images)
            self._create_or_update_previous_employments(instance, previous_employments, request=request)
            self._create_or_update_employee_documents_details(instance, employee_documents_details,
                                                              request=request)
            # self._create_leave_master_for_employee(instance,request)
        else:
            # if instance.grade is not None:
            #     service.EmployeeSalary.update_employee_salary_based_on_grade(instance, old_instance)
            instance = super().update(instance, validated_data)

        if not prev_is_active and new_is_active:
            if hasattr(instance, 'reactivate'):
                # print("coming inside reaciavte")
                instance.reactivate()
        return instance


    def has_active_leave_today(self, instance):
        today = date.today()

        approved_reversed_leave_entry_ids = LeaveReversalRequest.objects.filter(
            employee=instance,
            approval_status='APPROVED',
            is_active=True,
            leave_entry__isnull=False,
            reverse_from_date__lte=today,
            reverse_to_date__gte=today
        ).values_list('leave_entry_id', flat=True)

        approved_reversed_leave_application_ids = LeaveReversalRequest.objects.filter(
            employee=instance,
            approval_status='APPROVED',
            is_active=True,
            leave_application__isnull=False,
            reverse_from_date__lte=today,
            reverse_to_date__gte=today
        ).values_list('leave_application_id', flat=True)

        active_leave_entry = LeaveEntry.objects.filter(
            employee=instance,
            approval_status='APPROVED',
            # is_reversal=False,
            is_active=True,
            from_date__lte=today,
            to_date__gte=today
        ).exclude(
            id__in=approved_reversed_leave_entry_ids
        ).exists()

        active_leave_application = LeaveApplication.objects.filter(
            employee_code=instance,
            approval_status='APPROVED',
            is_active=True,
            new_leave_start_date__lte=today,
            new_leave_end_date__gte=today
        ).exclude(
            id__in=approved_reversed_leave_application_ids
        ).exists()

        return active_leave_entry or active_leave_application
    

    def validate_under_leave_toggle_off(self, instance):
        today = date.today()
        active_leave = self.has_active_leave_today(instance)

        pending_reversal = LeaveReversalRequest.objects.filter(
            employee=instance,
            approval_status='PENDING_APPROVAL',
            is_active=True
        ).exists()

        # Only TODAY's active leave entries with reversal toggle ON but no request created
        reversal_toggled_but_no_request_entry = LeaveEntry.objects.filter(
            employee=instance,
            is_reversal=True,
            is_active=True,
            from_date__lte=today,      #  date range
            to_date__gte=today
        ).exclude(
            id__in=LeaveReversalRequest.objects.filter(
                employee=instance,
                leave_entry__isnull=False
            ).values_list('leave_entry_id', flat=True)
        ).exists()

        reversal_toggled_but_no_request_application = LeaveApplication.objects.filter(
            employee_code=instance,
            is_reversal=True,
            is_active=True,
            new_leave_start_date__lte=today,    # date range
            new_leave_end_date__gte=today
        ).exclude(
            id__in=LeaveReversalRequest.objects.filter(
                employee=instance,
                leave_application__isnull=False
            ).values_list('leave_application_id', flat=True)
        ).exists()

        if pending_reversal or reversal_toggled_but_no_request_entry or reversal_toggled_but_no_request_application:
            raise serializers.ValidationError({
                "is_under_leave": "Leave reversal is pending. Please wait for approval before turning off Under Leave Toggle."
            })

        if active_leave:
            raise serializers.ValidationError({
                "is_under_leave": "Employee is currently on approved leave. Please reverse the leave before turning off Under Leave Toggle."
            })
        
    def _create_or_update_previous_employments(self, previous_employments_instance,
                                               previous_employments_items_data, **kwargs):
        previous_employments_items_ids = []
        for item_data in previous_employments_items_data:
            # print("item_data", item_data)
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['employee_previous'] = previous_employments_instance.id
                previous_employments_items_serializer = PreviousEmploymentDetailsSerializer(data=item_data,
                                                                                            context=self.context)
                previous_employments_items_serializer.is_valid(raise_exception=True)
                previous_employments_details_item_instance = previous_employments_items_serializer.create(
                    previous_employments_items_serializer.validated_data)

                previous_employments_items_ids.append(previous_employments_details_item_instance.id)
            else:
                previous_employments_items_ids.append(item_data['id'])
                previous_employments_details_item_instance = PreviousEmploymentDetails.objects.get(id=item_data['id'])
                previous_employments_items_serializer = PreviousEmploymentDetailsSerializer(
                    instance=previous_employments_details_item_instance,
                    data=item_data,
                    context=self.context)
                previous_employments_items_serializer.is_valid(raise_exception=True)
                previous_employments_items_serializer.update(
                    previous_employments_details_item_instance,
                    previous_employments_items_serializer.validated_data)
        self._delete_previous_employments_detail_items(previous_employments_items_ids, previous_employments_instance)
        return True

    def _delete_previous_employments_detail_items(self, ids, previous_employments_item_instance):
        PreviousEmploymentDetails.objects.filter(employee_previous=previous_employments_item_instance).exclude(
            id__in=ids).delete()

    def _create_or_update_employee_documents_details(self, employee_documents_instance,
                                                 employee_documents_details_items_data, **kwargs):
        employee_documents_items_ids = []
        for item_data in employee_documents_details_items_data:
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['employee_document'] = employee_documents_instance.id
                employee_documents_items_serializer = EmployeeDocumentsDetailsSerializer(data=item_data,
                                                                                         context=self.context)
                employee_documents_items_serializer.is_valid(raise_exception=True)
                employee_documents_details_item_instance = employee_documents_items_serializer.create(
                    employee_documents_items_serializer.validated_data)
                employee_documents_items_ids.append(employee_documents_details_item_instance.id)
            else:
                employee_documents_items_ids.append(item_data['id'])
                employee_documents_details_item_instance = EmployeeDocumentsDetails.objects.get(id=item_data['id'])
                employee_documents_items_serializer = EmployeeDocumentsDetailsSerializer(
                    instance=employee_documents_details_item_instance,
                    data=item_data,
                    context=self.context)
                employee_documents_items_serializer.is_valid(raise_exception=True)
                employee_documents_items_serializer.update(
                    employee_documents_details_item_instance,
                    employee_documents_items_serializer.validated_data)
        self._delete_employee_documents_details(employee_documents_items_ids, employee_documents_instance)
        return True

    def _delete_employee_documents_details(self, ids, employee_documents_instance):
        EmployeeDocumentsDetails.objects.filter(employee_document=employee_documents_instance).exclude(
            id__in=ids).delete()

    def _create_employee_leave_master(self, instance, request):
        if instance.grade is None:
            print("Grade is not set for this employee, skipping leave master creation")
            return
        try:
            grade_details = Grade.objects.get(id=instance.grade.id)
            leave_details = LeaveDetails.objects.filter(grade=grade_details.id)
            leave_details_list = list(leave_details.values())

            if not leave_details_list:
                print(f"No leave details found for grade id {grade_details.id}")
                return

            leaveMasterInstance = LeaveMaster.objects.create(employee=instance, b_id=grade_details.b_id)
            if leaveMasterInstance:
                total = 0
                for item in leave_details_list:
                    try:
                        LeaveMasterDetails.objects.create(
                            leave_master=leaveMasterInstance,
                            leave_type=item['leave_type'],
                            allocated_leaves=item['number_of_leaves'],
                            utilized_leaves=0,
                            available_leaves=item['number_of_leaves'],
                            b_id=grade_details.b_id
                        )
                        total = total + item['number_of_leaves']
                        print(
                            f"Created LeaveMasterDetails for leave_type {item['leave_type']} with {item['number_of_leaves']} leaves")
                    except Exception as e:
                        print(f"Failed to create LeaveMasterDetails for leave_type {item['leave_type']}: {e}")

                leaveMasterInstance.total_allocated_leaves = total
                leaveMasterInstance.total_utilized_leaves = 0
                leaveMasterInstance.total_available_leaves = total
                leaveMasterInstance.save()

        except Grade.DoesNotExist:
            grade_id = instance.grade.id if instance.grade else None
            print(f"Grade with id {grade_id} does not exist")
        except Exception as e:
            print(f"An error occurred: {e}")

    def _create_employee_gratuity(self, instance, request, b_id):
        # present_basic_pay is intentionally not set here — the gratuity router
        # fetches it dynamically from EmployeeMonthlyAllowanceDetails at calculation time.
        try:
            if GratuityEmployeeForm.objects.filter(employee=instance).exists():
                # Sync date fields only — do NOT touch form_number or approval stages
                GratuityEmployeeForm.objects.filter(employee=instance).update(
                    b_id=b_id,
                    dor=instance.dor if instance.dor else None,
                    doc=instance.doc if instance.doc else None,
                )
            else:
                # Go through the serializer so form_number is generated and
                # approval stages are created via call_multi_approval_main
                from hrm_main.api.serializers import GratuityEmployeeFormSerializer
                # Stamp b_id on the request object so ApprovalModelMixinSerializer
                # and its approval-stage logic pick it up the same way the middleware does.
                request.b_id = b_id
                payload = {
                    'employee': instance.id,
                    'b_id': b_id,
                    'dor': instance.dor.strftime('%d-%m-%Y') if instance.dor else None,
                    'doc': instance.doc.strftime('%d-%m-%Y') if instance.doc else None,
                }
                ser = GratuityEmployeeFormSerializer(
                    data=payload,
                    context={'request': request},
                )
                if ser.is_valid():
                    ser.save()
                else:
                    print(f"GratuityEmployeeFormSerializer errors: {ser.errors}")
                    raise serializers.ValidationError(ser.errors)
        except serializers.ValidationError:
            raise
        except Exception as e:
            print(f"Error creating/updating gratuity: {e}")
            raise serializers.ValidationError(f"Error creating/updating gratuity: {str(e)}")

    def to_internal_value(self, data):
        # print("=== IMAGE FIELDS IN REQUEST ===")
        # for f in ['passport_image', 'visa_image', 'emirates_image', 'labour_card_image', 
        #         'fhc_image', 'insurance_image', 'profile_image', 'emirates_image_back']:
        #     print(f"{f}: {repr(data.get(f, 'NOT PRESENT'))}")
        
        # print("employee_documents_details IS:", data[''])
        self.validate_file(data=data)
        #  FIX: extract image files BEFORE copy 
        image_fields = [
            'passport_image', 'passport_image_back', 'visa_image', 'emirates_image',
            'labour_card_image', 'fhc_image', 'insurance_image',
            'profile_image', 'emirates_image_back'
        ]

        extracted_images = {}
        for field in image_fields:
            if field in data:
                extracted_images[field] = data.get(field)
        # data = data.copy()
        # print("data..",data)
        data = convert_form_data(data)
        
        # ignore front end data submission for loa 
        data.pop('linked_loa_list', None)

        # print("dta line no 1207..",data)
        profile_image = data.pop('profile_image', None)
        image_fields = ['passport_image', 'passport_image_back', 'visa_image','emirates_image','labour_card_image','fhc_image','insurance_image','profile_image','emirates_image_back']
        # Pop the rest of the image fields too — they're re-applied from
        # extracted_images after super().to_internal_value() below. Left in
        # `data`, DRF's auto-generated FileField would reject the raw base64
        # string outright ("The submitted data was not a file...") before our
        # conversion code ever runs.
        for field in image_fields:
            data.pop(field, None)
        device_id = data.pop('device_id', None)
        lic_details_details = data.pop('lic_details', [])
        previous_employments_details = data.pop('previous_employments', [])
        employee_documents_details = data.pop('employee_documents_details', [])
        employee_letter_images = data.pop('employee_letter_images', [])
        for field in ['primary_equipment_specialization','secondary_equipment_specialization','tertiary_equipment_specialization','quaternary_equipment_specialization']:
            if field in data:
                data[field] = json.loads(data[field]) if data[field] not in ["", []] else []
        data, child_table_data = DefaultValue().pop_keys(data, ['loa'], [])
        # print('primary_equipment_specialization before...',data['primary_equipment_specialization'])
        # if 'primary_equipment_specialization' in data:
        #     data['primary_equipment_specialization'] = json.loads(data['primary_equipment_specialization']) if data[
        #                                                                                                            'primary_equipment_specialization'] not in [
        #                                                                                                            "",
        #                                                                                                            []] else []
        # if 'secondary_equipment_specialization' in data:
        #     data['secondary_equipment_specialization'] = json.loads(data['secondary_equipment_specialization']) if data[
        #                                                                                                                'secondary_equipment_specialization'] not in [
        #                                                                                                                "",
        #                                                                                                                []] else []
        if 'issue_date_of_license' in data:
            data['issue_date_of_license'] = data['issue_date_of_license'] if data[
                                                                                 'issue_date_of_license'] != "" else None
        if 'expiry_date_of_license' in data:
            data['expiry_date_of_license'] = data['expiry_date_of_license'] if data[
                                                                                   'expiry_date_of_license'] != "" else None
        if 'dob' in data:
            data['dob'] = data['dob'] if data['dob'] != "" else None
        if 'cicpa_expiry_date' in data:
            data['cicpa_expiry_date'] = data['cicpa_expiry_date'] if data['cicpa_expiry_date'] != "" else None
        if 'doj' in data:
            data['doj'] = data['doj'] if data['doj'] != "" else None
        if 'doc' in data:
            data['doc'] = data['doc'] if data['doc'] != "" else None
        if 'dor' in data:
            data['dor'] = data['dor'] if data['dor'] != "" else None
        if 'passport_issue_date' in data:
            data['passport_issue_date'] = data['passport_issue_date'] if data['passport_issue_date'] != "" else None
        if 'passport_expiry_date' in data:
            data['passport_expiry_date'] = data['passport_expiry_date'] if data['passport_expiry_date'] != "" else None
        if 'visa_issue_date' in data:
            data['visa_issue_date'] = data['visa_issue_date'] if data['visa_issue_date'] != "" else None
        if 'visa_expiry_date' in data:
            data['visa_expiry_date'] = data['visa_expiry_date'] if data['visa_expiry_date'] != "" else None
        if 'emirates_id_issue_date' in data:
            data['emirates_id_issue_date'] = data['emirates_id_issue_date'] if data[
                                                                                   'emirates_id_issue_date'] != "" else None
        if 'emirates_id_expiry_date' in data:
            data['emirates_id_expiry_date'] = data['emirates_id_expiry_date'] if data[
                                                                                     'emirates_id_expiry_date'] != "" else None
        if 'labour_card_issue_date' in data:
            data['labour_card_issue_date'] = data['labour_card_issue_date'] if data[
                                                                                   'labour_card_issue_date'] != "" else None
        if 'labour_card_expiry_date' in data:
            data['labour_card_expiry_date'] = data['labour_card_expiry_date'] if data[
                                                                                     'labour_card_expiry_date'] != "" else None
        if 'fhc_issue_date' in data:
            data['fhc_issue_date'] = data['fhc_issue_date'] if data['fhc_issue_date'] != "" else None
        if 'fhc_expiry_date' in data:
            data['fhc_expiry_date'] = data['fhc_expiry_date'] if data['fhc_expiry_date'] != "" else None
        if 'is_available' in data:
            data['is_available'] = data['is_available'] if data['is_available'] not in ["",None] else None
        if 'employee_status' in data:
            data['employee_status'] = data['employee_status'] if data['employee_status'] not in ["",None] else None
        if 'employee_status_is_active' in data:
            data['employee_status_is_active'] = data['employee_status_is_active'] if data['employee_status_is_active'] not in ["",None,"null",'',] else False
        if 'is_mobile_punch' in data:
            data['is_mobile_punch'] = data['is_mobile_punch'] if data['is_mobile_punch'] not in ["",None,"null",'',] else False
        if 'is_under_leave' in data:
            data['is_under_leave'] = data['is_under_leave'] if data['is_under_leave'] not in ["",None,"null",'',] else False
        if 'job_loss_insurance_issue_date' in data:
            data['job_loss_insurance_issue_date'] = data['job_loss_insurance_issue_date'] if data[                                                                                           'job_loss_insurance_issue_date'] != "" else None
        if 'job_loss_insurance_expiry_date' in data:
            data['job_loss_insurance_expiry_date'] = data['job_loss_insurance_expiry_date'] if data[
                                                                                                   'job_loss_insurance_expiry_date'] != "" else None
        if 'note' in data:
            data['note'] = data['note'] if data['note'] not in ["", None, "null"] else None
                            
        # Convert branch from object to ID for validation
        if 'branch' in data and data['branch'] not in [None, '', 'null']:
            branch_val = data['branch']
            if isinstance(branch_val, dict) and branch_val.get('id'):
                # Replace the object with just the ID
                data['branch'] = branch_val['id']
            elif isinstance(branch_val, str) and not branch_val.isdigit():
                # If it's a string but not a digit, try to extract ID from a possible JSON string
                try:
                    branch_obj = json.loads(branch_val)
                    if isinstance(branch_obj, dict) and branch_obj.get('id'):
                        data['branch'] = branch_obj['id']
                except (json.JSONDecodeError, TypeError):
                    # Keep as is, let the validation handle it
                    pass
        
        
        
        validated_data = super().to_internal_value(data)

        # if 'branch' in data:
        #     branch_val = data['branch']
        #     if isinstance(branch_val, (int, str)) and str(branch_val).isdigit():
        #         try:
        #             from branch.models import Branch
        #             validated_data['branch'] = Branch.objects.get(id=int(branch_val))
        #         except Branch.DoesNotExist:
        #             validated_data['branch'] = None
        #     elif isinstance(branch_val, dict) and branch_val.get('id'):
        #         try:
        #             from branch.models import Branch
        #             validated_data['branch'] = Branch.objects.get(id=branch_val['id'])
        #         except Branch.DoesNotExist:
        #             validated_data['branch'] = None
        
        # for field in image_fields:
        #     value = data.pop(field, None)
        #     if value is not None:
        #         validated_data[field] = value


        # Handle branch - convert ID to model instance
        if 'branch' in data and data['branch'] not in [None, '', 'null']:
            try:
                from branch.models import Branch
                branch_id = int(data['branch'])
                validated_data['branch'] = Branch.objects.get(id=branch_id)
            except (Branch.DoesNotExist, ValueError, TypeError) as e:
                validated_data['branch'] = None
        


        for field, file in extracted_images.items():
            if file in ["", None, "null"]:
                validated_data[field] = None
            elif isinstance(file, str) and ';base64,' in file:
                # Frontend sends a bare base64 data-URI for these FileField-backed
                # images (no filename/content-type metadata) — decode it into a
                # real uploadable file before it reaches the model's FileField.
                mime_header = file.split(';base64,', 1)[0]
                file_type = mime_header.replace('data:', '') or 'image/png'
                extension = file_type.split('/')[-1] or 'png'
                validated_data[field] = convert_base64(file, f"{field}.{extension}", file_type)
            else:
                validated_data[field] = file
        # for field, file in extracted_images.items():
        #     if file is not None:
        #         validated_data[field] = file
        # if profile_image is not None:
        #     validated_data['profile_image'] = profile_image
        if lic_details_details:
            validated_data['lic_details'] = json.loads(lic_details_details)
        if previous_employments_details:
            validated_data['previous_employments'] = json.loads(previous_employments_details)
        if employee_documents_details:
            validated_data['employee_documents_details'] = json.loads(employee_documents_details)
        if employee_letter_images:
            validated_data['employee_letter_images'] = json.loads(employee_letter_images)
        else:
            # if it's already a list (like your case), just use it
            validated_data['employee_letter_images'] = employee_letter_images or []
        if device_id == '':
            validated_data['device_id'] = None
        else:
            validated_data['device_id'] = device_id

        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # handle if missing file on server
        image_fields = [
            'passport_image',
            'passport_image_back',
            'visa_image',
            'emirates_image',
            'labour_card_image',
            'fhc_image',
            'insurance_image',
            'profile_image',
            'emirates_image_back'
        ]

        for field in image_fields:
            file_obj = getattr(instance, field, None)

            if file_obj:
                try:
                    if not file_obj.storage.exists(file_obj.name):
                        data[field] = None
                except Exception:
                    data[field] = None

        # employee_documents_details is write_only above (its own model's
        # FileField needs the raw base64 dict shape on write) — return the
        # saved rows here so the Documents table repopulates on edit.
        data['employee_documents_details'] = EmployeeDocumentsDetailsSerializer(
            instance.employee_documents_details.all(), many=True, context=self.context
        ).data

        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.department is not None:
                data['department_default_object'] = dict(
                    department_name=instance.department.department_name,
                    id=instance.department.id
                )
            if instance.designation is not None:
                data['designation_namee'] = instance.designation.designation_name
            if instance.designation is not None:
                data['designation_default_object'] = dict(
                    designation_name=instance.designation.designation_name,
                    id=instance.designation.id
                )
            if instance.grade is not None:
                data['grade_default_object'] = dict(
                    grade_description=instance.grade.grade_description,
                    grade_code=instance.grade.grade_code,
                    id=instance.grade.id
                )
            if instance.operator_type is not None:
                data['default_operator_object'] = dict(
                    name=instance.operator_type,
                    id=instance.operator_type
                )
            if instance.technician_type is not None:
                data['default_technician_object'] = dict(
                    name=instance.technician_type,
                    id=instance.technician_type
                )
            if instance.first_reporting_authority is not None:
                data['default_first_reporting_authority_object'] = dict(
                    designation_name=instance.first_reporting_authority.designation.designation_name,
                    employee_code=instance.first_reporting_authority.employee_code,
                    first_name=instance.first_reporting_authority.first_name,
                    id=instance.first_reporting_authority.id
                )
            if instance.second_reporting_authority is not None:
                data['default_second_reporting_authority_object'] = dict(
                    designation_name=instance.second_reporting_authority.designation.designation_name,
                    employee_code=instance.second_reporting_authority.employee_code,
                    first_name=instance.second_reporting_authority.first_name,
                    id=instance.second_reporting_authority.id
                )
            if instance.employee_type is not None and instance.employee_type != "":
                data['default_global_object'] = dict(
                    name=instance.employee_type,
                    id=instance.employee_type
                )
            if instance.groups is not None:
                data['default_main_group_object'] = dict(
                    id=instance.groups.id,
                    name=instance.groups.name,
                )
            # branch
            if instance.branch:
                data['branch'] = {
                    'id': instance.branch.id,
                    'branch_name': instance.branch.branch_name,
                    'city': instance.branch.city
                }
                data['branch_default_object'] = {
                    'id': instance.branch.id,
                    'branch_name': instance.branch.branch_name
                }
            else:
                data['branch'] = None
                data['branch_default_object'] = {}

        # if instance.shift_details is not None:
        #     total_seconds = int(instance.shift_details.duration.total_seconds())
        #     minutes = total_seconds // 60
        #     seconds = total_seconds % 60
        #     durationnn = f"{minutes:02d}:{seconds:02d}"
        #     data['shift_category_object'] = dict(
        #         shift_name=instance.shift_details.shift_name,
        #         duration=durationnn,
        #         id=instance.shift_details.id
        #     )

        if instance.shift_details is not None:
            shift = instance.shift_details
            total_seconds = int(shift.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            duration_hh_mm = f"{hours:02d}:{minutes:02d}"
            
            data['shift_category_object'] = {
                'id': shift.id,
                'shift_name': shift.shift_name,
                'duration': duration_hh_mm,
                'start_time': shift.start_time.strftime('%H:%M') if shift.start_time else None,
                'end_time': shift.end_time.strftime('%H:%M') if shift.end_time else None,
                'grace_period_in': shift.grace_period_in.strftime('%H:%M') if shift.grace_period_in else "",
                'grace_period_out': shift.grace_period_out.strftime('%H:%M') if shift.grace_period_out else "",
                'max_ot': shift.max_ot.strftime('%H:%M') if shift.max_ot else ""
            }
        if instance.department is not None:
            data['department_name'] = instance.department.department_name
        if instance.designation is not None:
            data['designation_name'] = instance.designation.designation_name
        if instance.grade is not None:
            data['grade_code'] = instance.grade.grade_code
            data['grade_description'] = instance.grade.grade_description
        # if instance.default_shift is not None:
        #     data['default_shift_name'] = instance.default_shift.shift_name
        if 'weekly_off' in data and data['weekly_off'] is not None:
            try:
                data['weekly_off'] = json.loads(data['weekly_off'])
            except:
                data['weekly_off'] = []

        data['is_emirati'] = instance.is_emirati

        return data
     

    def validate(self, data):
        # dob = data.get('dob')
        # doj = data.get('doj')
        # print("dob",dob,doj)
        # # Calculate the date 18 years before the date of appointment
        # eighteen_years_before_doa = doj - relativedelta(years=18)
        #
        # # Check if the date of birth is at least 18 years before the date of appointment
        # if dob > eighteen_years_before_doa:
        #     raise serializers.ValidationError(
        #         {
        #             "dob": "The date of birth indicates the individual is younger than 18 years old at the time of appointment."})

        return data

    def validate_file(self, data):
        file_fields = [
            'profile_image'
        ]

        for field in file_fields:
            file = data.get(field)
            if file and hasattr(file, 'size') and file.size > 12 * 1024 * 1024:  # 12 MB
                raise serializers.ValidationError(
                    {field: f"{field.replace('_', ' ').title()} size must be 12MB or less."})
        return data


class LeaveEntrySerializer(ApprovalModelMixinSerializer,AuditModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    extended_to_date=serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', 'iso-8601'], allow_null=True)
    is_lop = serializers.BooleanField(required=False)
    is_comp_off = serializers.BooleanField(required=False)
    is_reversal = serializers.BooleanField(required=False)
    is_extension = serializers.BooleanField(required=False)

    class Meta:
        model = LeaveEntry
        fields = '__all__'

        


    def create(self, validated_data):
        request = self.context.get('request')
        user=self.context.get('request').user
        self.validate_whether_same_user(validated_data['employee'],self.context)
        self.if_not_delegated_reviewer(validated_data['delegated_reviewer'], self.context)

        allow_beyond = validated_data.get('allow_beyond_eligible', False)
        is_paid_beyond = validated_data.get('is_paid_beyond', False)

        # Skip condition validation for allow_beyond leaves (may exceed max stretch / balance)
        if not allow_beyond:
            self._validate_leave_conditions(validated_data, None, request)

        master_service = importlib.import_module('hrm_master.api.service')
        leave_entry_signal = master_service.MasterSignal
        leave_entry_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])

        if not allow_beyond:
            leave_entry_signal.validate_duplicate_dates(validated_data['employee'], validated_data['from_date'],
                                                        validated_data['to_date'])

        # lop_days_from_extension is computed client-side and sent by the frontend.
        # Backend trusts this value. Ensure 0 when paid_beyond or not allow_beyond.
        if not allow_beyond or is_paid_beyond:
            validated_data['lop_days_from_extension'] = 0

        validated_data['balance_no_of_days'] = validated_data['no_of_days']
        instance = super().create(validated_data)
        self.update_next_stage(instance,user)
        self._trigger_post_save_signal(instance, is_created=True)

        from notifications.signals import leave_entry_created
        leave_entry_created.send(sender=instance.__class__, instance=instance, user=request.user)

        return instance

    def validate_whether_same_user(self,employee,context):
        user=self.context.get('request').user
        if employee.user == user :
            perms_to_remove = [
                'custom_approval_stage_HR',
                'custom_approval_stage_approver',
                'custom_approval_stage_secondary_approver'
            ]
            permissions_add = [
                'custom_approval_stage_initiator',
            ]
            remove_permissions(context,perms_to_remove)
            add_permissions(context,permissions_add)

    def if_not_delegated_reviewer(self,delegated_reviewer,context):

        if not delegated_reviewer or delegated_reviewer != self.context.get('request').user:
            perms_to_remove = [
                'custom_approval_stage_secondary_approver'
            ]
            remove_permissions( context, perms_to_remove)

    def update_next_stage(self,instance,user):
        approval_stages_object = instance.approval_stages.last()
        if approval_stages_object.stage_name == 'Initiator':
            approval_stages_object.approval_status = 'APPROVED'
            approval_stages_object.approval_date = timezone.now().date()
            approval_stages_object.approved_user = user
            approval_stages_object.approval_by = user.first_name
            approval_stages_object.modified_date = timezone.now()
            approval_stages_object.save()
            approval_model = instance.approval_stages.model
            approval_model.objects.create(
                related_object=instance,
                stage_name='Hr',
                approval_status='PENDING_APPROVAL',
                order=2,
                permission_code='custom_approval_stage_HR',
                created_user_id=user.id
            )
            instance.approval_remarks = 'Pending with HR'
            instance.save()

  
    def update(self, instance, validated_data):
        old_instance = LeaveEntry.objects.get(id=instance.id)
        request = self.context.get('request')

        # extended_to_date = resume duty date (overstay tracking only).
        # It does NOT represent extra leave — no balance deduction ever happens for it.
        _new_extended = validated_data.get('extended_to_date')
        _old_extended = old_instance.extended_to_date
        extended_to_date_changed = bool(_new_extended) and (_new_extended != _old_extended)

        allow_beyond = validated_data.get('allow_beyond_eligible', False) or instance.allow_beyond_eligible
        is_paid_beyond = validated_data.get('is_paid_beyond', False)
        if 'is_paid_beyond' not in validated_data:
            is_paid_beyond = instance.is_paid_beyond

        validated_data['balance_no_of_days'] = validated_data['no_of_days']

        if 'delegated_reviewer' in validated_data:
            instance.delegated_reviewer = validated_data.get('delegated_reviewer')
            self.if_not_delegated_reviewer(instance.delegated_reviewer, self.context)
            instance.save(update_fields=['delegated_reviewer'])

        # Skip leave conditions validation for allow_beyond leaves or when resume date changed
        if not extended_to_date_changed and not allow_beyond:
            self._validate_leave_conditions(validated_data, instance, request)
        else:
            print(f"\n- Skipping leave conditions validation (extended_to_date_changed={extended_to_date_changed}, allow_beyond={allow_beyond}) -")

        master_service = importlib.import_module('hrm_master.api.service')
        leave_entry_signal = master_service.MasterSignal
        leave_entry_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])

        # No need to snapshot balance — LOP days are computed client-side and sent in
        # lop_days_from_extension. Attendance marking happens post-transfer via on_commit.

        instance = super().update(instance, validated_data)

        newly_approved = (
            instance.approval_status != old_instance.approval_status
            and instance.approval_status == self.Meta.model.APPROVED
        )

        if validated_data['travel_or_leave'] == "Leave" or validated_data['travel_or_leave'] == "Work From Home":

            # extended_to_date is resume duty date — overstay only, never deduct balance for it.
            if newly_approved:
                if allow_beyond and not is_paid_beyond:
                    # lop_days_from_extension is sent by frontend (computed client-side).
                    # Deduct only paid portion from balance — LOP days are unpaid, no balance hit.
                    lop_days  = float(instance.lop_days_from_extension or 0)
                    total_days = float(instance.no_of_days or 0)
                    paid_days  = max(0, total_days - lop_days)
                    if paid_days > 0:
                        self.update_leave_balances(instance, paid_days_override=paid_days)
                        print(f"[LeaveEntry] allow_beyond unpaid: deducted {paid_days} paid day(s), LOP={lop_days}")
                    else:
                        print(f"[LeaveEntry] allow_beyond: all {total_days} day(s) are LOP — no balance deduction")
                else:
                    # Standard approval OR paid-beyond — full balance deduction
                    self.update_leave_balances(instance)

                instance.employee.is_under_leave = True
                instance.employee.employee_status = "On Leave"
                instance.employee.is_available = False
                instance.employee.save(update_fields=['is_under_leave', 'employee_status', 'is_available'])
                print(f"[LeaveEntry] Employee {instance.employee.employee_code} status updated to On Leave")

            else:
                print("[LeaveEntry] No balance update needed — not extending and approval status unchanged")
        else:
            print(f"[LeaveEntry] Skipping balance update - travel_or_leave is {validated_data['travel_or_leave']}")

        self._trigger_post_save_signal(instance, is_created=False, validated_data=validated_data)

        # Handle notifications for approval status changes
        if instance.approval_status != old_instance.approval_status:
            if instance.approval_status != ApprovalModelMixin.PENDING_APPROVAL:
                from notifications.signals import leave_entry_status_changed
                leave_entry_status_changed.send(sender=instance.__class__, instance=instance, user=request.user, old_status=old_instance.approval_status)

        # Skip duplicate date validation for allow_beyond leaves
        if not allow_beyond:
            leave_entry_signal.validate_duplicate_dates(
                validated_data['employee'],
                validated_data['from_date'],
                validated_data['to_date'],
                exclude_instance=instance
            )
        else:
            print(f"\n- Skipping duplicate date validation (allow_beyond={allow_beyond}) -")

        # ── Attendance transfer + LOP marking ────────────────────────────────
        # Run transfer_attendance_details on the LEAVE RANGE (from_date→to_date) only when
        # the leave range attendance actually needs updating:
        #   - Freshly approved (newly_approved)
        #   - allow_beyond / is_paid_beyond flags changed (affects LOP split)
        #   - NOT when the only change is setting/updating extended_to_date (overstay range):
        #     the overstay signal already handles the overstay window; the leave range is untouched.

        already_approved = (instance.approval_status == self.Meta.model.APPROVED)

        # Detect if this update only touched extended_to_date (pure overstay/resume date update).
        # In that case skip the leave-range transfer — the overstay signal handles the window.
        _only_overstay_change = (
            extended_to_date_changed
            and not newly_approved
            and old_instance.allow_beyond_eligible == allow_beyond
            and old_instance.is_paid_beyond == is_paid_beyond
        )

        if already_approved and not _only_overstay_change:
            try:
                emp_code      = instance.employee.employee_code
                from_date_str = instance.from_date.strftime('%Y-%m-%d')
                to_date_str   = instance.to_date.strftime('%Y-%m-%d')
                _instance     = instance
                _is_paid      = is_paid_beyond
                _allow_beyond = allow_beyond
                _request      = request
                _self         = self

                def _run_transfer_and_lop():
                    try:
                        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
                        transfer_attendance_details(
                            start_date=from_date_str,
                            end_date=to_date_str,
                            employee_codes=[emp_code],
                        )
                        print(f"[LeaveEntry] transfer done: emp={emp_code}, {from_date_str} to {to_date_str}")
                    except Exception as e:
                        import traceback
                        print(f"[LeaveEntry] transfer error: {e}\n{traceback.format_exc()}")

                    if _allow_beyond and not _is_paid:
                        # allow_beyond unpaid: split last lop_days rows → LOP
                        try:
                            _instance.refresh_from_db()
                            _self._apply_lop_entry(_instance, _request)
                        except Exception as e:
                            import traceback
                            print(f"[LeaveEntry] _apply_lop_entry error: {e}\n{traceback.format_exc()}")
                    elif _allow_beyond and _is_paid:
                        # allow_beyond paid: all days = leave, clear any stale LOP IDs
                        try:
                            _instance.refresh_from_db()
                            if _instance.extension_lop_attendance_ids:
                                _instance.extension_lop_attendance_ids = []
                                _instance.lop_days_from_extension = 0
                                _instance.save(update_fields=['extension_lop_attendance_ids', 'lop_days_from_extension'])
                                print(f"[LeaveEntry] Cleared stale LOP IDs (is_paid_beyond=True)")
                        except Exception as e:
                            import traceback
                            print(f"[LeaveEntry] LOP clear error: {e}\n{traceback.format_exc()}")
                    # else: standard leave — transfer already set correct status, nothing more needed

                transaction.on_commit(_run_transfer_and_lop)
                print(f"[LeaveEntry] Queued transfer on_commit: emp={emp_code}, {from_date_str} to {to_date_str}, allow_beyond={_allow_beyond}, is_paid={_is_paid}")
            except Exception as e:
                import traceback
                print(f"[LeaveEntry] on_commit setup error: {e}\n{traceback.format_exc()}")
        elif already_approved and _only_overstay_change:
            print(f"[LeaveEntry] Skipping leave-range transfer — only extended_to_date changed; overstay signal handles the window.")

        return instance

    # ─── LOP helpers for allow_beyond_eligible on LeaveEntry ─────────────────

    def _revert_lop_entry(self, instance):
        """Restore any attendance rows previously marked LOP by _apply_lop_entry."""
        try:
            import json as _json
            from hrm_main.models import AttendanceDetails
            raw = getattr(instance, 'extension_lop_attendance_ids', None) or []
            # Field may be stored as a JSON string rather than a parsed list
            if isinstance(raw, str):
                try:
                    raw = _json.loads(raw)
                except Exception:
                    raw = []
            lop_ids = [int(x) for x in raw if str(x).lstrip('-').isdigit()]
            if not lop_ids:
                print("[LeaveEntry] No stored LOP attendance IDs to revert")
                return
            leave_status_code = None
            try:
                leave_status_code = str(
                    AttendanceStatusMaster.objects.filter(
                        status_name=instance.leave_type.status_name
                    ).first().code
                )
            except Exception:
                pass
            reverted = 0
            for att_id in lop_ids:
                att = AttendanceDetails.objects.filter(id=att_id).first()
                if att and att.status == '22':
                    att.status = leave_status_code or att.status
                    att.save(update_fields=['status'])
                    reverted += 1
            # Clear stored IDs only — do NOT zero lop_days_from_extension.
            # That field holds the frontend-computed value we'll use to re-apply
            # LOP after any subsequent transfer_attendance_details call.
            instance.extension_lop_attendance_ids = []
            instance.save(update_fields=['extension_lop_attendance_ids'])
            print(f"[LeaveEntry] Reverted {reverted} LOP attendance records (lop_days preserved={instance.lop_days_from_extension})")
        except Exception as e:
            import traceback
            print(f"[LeaveEntry] _revert_lop_entry error: {e}\n{traceback.format_exc()}")

    def _apply_lop_entry(self, instance, request):
        """Mark attendance as LOP for the last lop_days_from_extension days of the leave.

        lop_days_from_extension is computed client-side (frontend) and already stored
        on the instance before this runs. We trust that value — no recalculation.

        Walk from_date → to_date chronologically. Skip WO/Holiday rows.
        First (no_of_days - lop_days) chargeable rows → leave status (already set by transfer).
        Last lop_days chargeable rows → status='22'.
        """
        try:
            from hrm_main.models import AttendanceDetails
            from datetime import timedelta as _td

            b_id = instance.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')
            emp = instance.employee
            from_date = instance.from_date
            to_date = instance.to_date
            if not from_date or not to_date:
                return

            # Trust the frontend-computed value. If it's 0 (corrupted/not yet set),
            # fall back to computing from no_of_days - available_leaves.
            lop_days = int(instance.lop_days_from_extension or 0)
            if lop_days <= 0:
                total_days = float(instance.no_of_days or 0)
                available  = float(instance.available_leaves or 0)
                lop_days   = int(max(0, total_days - available))
                if lop_days > 0:
                    print(f"[LeaveEntry] lop_days was 0, computed fallback: {total_days} - {available} = {lop_days}")
                    instance.lop_days_from_extension = lop_days
                    instance.save(update_fields=['lop_days_from_extension'])
                else:
                    print(f"[LeaveEntry] lop_days=0 and fallback=0 — nothing to mark as LOP")
                    return

            total_days = float(instance.no_of_days or 0)
            paid_days = max(0, total_days - lop_days)

            leave_status_code = None
            try:
                leave_status_code = str(
                    AttendanceStatusMaster.objects.filter(
                        status_name=instance.leave_type.status_name
                    ).first().code
                )
            except Exception:
                pass

            att_records = list(AttendanceDetails.objects.filter(
                employee_code=emp.employee_code,
                b_id=b_id,
                date__range=[from_date, to_date],
            ).order_by('date'))

            # Calendar_days: WO/Holiday also count as leave days — don't skip them.
            # Working_days: WO (17) and Holiday (5) are not chargeable — skip.
            type_of_days = instance.type_of_days or 'Calendar_days'
            if type_of_days == 'Working_days':
                SKIP_STATUSES = {'17', '5', '11', '18', '19'}
            else:
                # Calendar days — only skip already-processed non-leave statuses
                SKIP_STATUSES = {'11', '18', '19'}

            att_by_date = {att.date: att for att in att_records}

            lop_ids = []
            covered = 0.0
            current = from_date
            while current <= to_date:
                att = att_by_date.get(current)
                if att and att.status in SKIP_STATUSES:
                    current += _td(days=1)
                    continue
                if covered < paid_days:
                    # Paid leave day — ensure leave status (transfer already set this)
                    covered += 1
                    if att and leave_status_code and att.status != leave_status_code:
                        att.status = leave_status_code
                        att.save(update_fields=['status'])
                else:
                    # LOP day
                    if att:
                        att.status = '22'
                        att.save(update_fields=['status'])
                        lop_ids.append(att.id)
                current += _td(days=1)

            instance.extension_lop_attendance_ids = lop_ids
            instance.save(update_fields=['extension_lop_attendance_ids'])
            print(f"[LeaveEntry] LOP applied: paid={paid_days}, lop={lop_days}, marked IDs={lop_ids}")
        except Exception as e:
            import traceback
            print(f"[LeaveEntry] _apply_lop_entry error: {e}\n{traceback.format_exc()}")

    # ─────────────────────────────────────────────────────────────────────────

    def update_leave_balance_for_extension(self, instance, extended_days):


        try:
            with transaction.atomic():
                leave_detail = LeaveMasterDetails.objects.select_for_update().filter(
                    leave_master__employee=instance.employee,
                    leave_type=instance.leave_type.status_name
                ).order_by('id').last()
                
                if leave_detail:

                    if leave_detail.leave_policy_key:
                        print(f"Year to year carry: {leave_detail.leave_policy_key.year_to_year_carry}")
                
                if not leave_detail:
                    leave_master, created = LeaveMaster.objects.get_or_create(
                        employee=instance.employee,
                        defaults={
                            'total_allocated_leaves': 0,
                            'total_utilized_leaves': 0,
                            'total_available_leaves': 0
                        }
                    )
                    
                    leave_detail = LeaveMasterDetails.objects.create(
                        leave_master=leave_master,
                        leave_type=instance.leave_type.status_name,
                        available_leaves=0,
                        utilized_leaves=0,
                        allocated_leaves=0,
                        opening_balance=0
                    )
                
                old_available = float(leave_detail.available_leaves or 0)
                # actual_deduct: can't deduct more than what's available (floor at 0)
                actual_deduct = min(extended_days, max(old_available, 0))
                leave_detail.available_leaves = round(old_available - actual_deduct, 2)

                if leave_detail.leave_policy_key and leave_detail.leave_policy_key.year_to_year_carry:
                    old_carry = leave_detail.carry_forward_days
                    old_lapse = leave_detail.lapse_days

                    if leave_detail.available_leaves <= leave_detail.carry_forward_days:
                        leave_detail.carry_forward_days = max(0, round(leave_detail.available_leaves, 2))
                        leave_detail.lapse_days = 0
                    else:
                        leave_detail.lapse_days = round(leave_detail.available_leaves - leave_detail.carry_forward_days, 2)
                else:
                    print("Year-to-year carry is disabled or no policy")

                old_utilized = leave_detail.utilized_leaves
                leave_detail.utilized_leaves = round(float(leave_detail.utilized_leaves or 0) + extended_days, 2)

                leave_detail.save()

                leave_breakup = LeaveMasterDetailBreakup.objects.filter(
                    leave_master_detail=leave_detail
                ).order_by('id').last()

                if leave_breakup:
                    old_breakup_available = float(leave_breakup.available_leaves or 0)
                    old_breakup_utilized = leave_breakup.utilized_leaves
                    breakup_deduct = min(extended_days, max(old_breakup_available, 0))
                    leave_breakup.available_leaves = round(old_breakup_available - breakup_deduct, 2)
                    leave_breakup.utilized_leaves = round(float(leave_breakup.utilized_leaves or 0) + extended_days, 2)
                    
                    
                    leave_breakup.save()
              
                updated = LeaveMaster.objects.filter(pk=leave_detail.leave_master.pk).update(
                    total_available_leaves=F('total_available_leaves') - round(extended_days, 2),
                    total_utilized_leaves=F('total_utilized_leaves') + round(extended_days, 2)
                )
                
                # Fetch and display updated master values
                updated_master = LeaveMaster.objects.get(pk=leave_detail.leave_master.pk)
                
        except Exception as e:
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(f"Failed to update leave balance: {str(e)}")
        
        print("========== UPDATE LEAVE BALANCE FOR EXTENSION END ==========\n")


    def update_time_on_leave_entry(self,instance):
        request = self.context.get('request')
        b_id = instance.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')
        status_code = self.instance.leave_type.code
        timesheet_cal = TimeSheetCal()
        employee_grace_details = EmployeeGraceDetails()
        from_date = self.instance.from_date
        to_date = self.instance.to_date

        leave_master_detail = LeaveMasterDetails.objects.filter(
            leave_master__employee=instance.employee,
            leave_type=instance.leave_type.status_name
        ).order_by('id').last()

        type_of_days = getattr(getattr(leave_master_detail, 'leave_policy_key', None), 'type_of_days', None) or 'Working_days'
        if not (from_date and to_date):
            return  # Exit early if dates are invalid
        
        attendance_details = AttendanceDetails.objects.filter(
            date__range=[from_date, to_date],
            b_id=b_id,
            employee_code=self.instance.employee.employee_code
        )
        for detail in attendance_details:
            try:
                total_hours = int(detail.total_hours or 0)
                processed_hours = int(detail.processed_total_hour or 0)
            except :
                total_hours = 0
                processed_hours = 0

            is_auto_punch = getattr(self.instance.employee, 'auto_punch', False)
            status_to_validate = ['11', '17', '5', '18', '19'] if type_of_days == 'Working_days' else  ['11', '5', '19']

            if detail.status in status_to_validate or (not is_auto_punch and (total_hours > 0 or processed_hours > 0)):
                continue
            if self.instance.travel_or_leave == 'Leave':
                updated_data = timesheet_cal.get_attendance_obj_for_leave(status_code)
            else:
                employee_type = self.instance.employee.employee_type
                employee_group = self.instance.employee.employee_group
                employee_reporting = self.instance.employee.reporting

                grace_record = employee_grace_details.get_grace_details(
                    detail.date,
                    employee_type,
                    employee_group,
                    employee_reporting,
                    b_id
                )

                updated_data = timesheet_cal.auto_punch_attendance_details(status_code, grace_record)

            for field, value in updated_data.items():
                if field == 'working_time':
                    continue  # preserve existing working_time — it reflects actual device punch data
                setattr(detail, field, value)

            detail.save()

        # After updating the leave span, also check if the day immediately after
        # leave end is a weekly off that should become LOP
        _apply_lop_after_leave(
            emp_code=instance.employee.employee_code,
            b_id=b_id,
            leave_end_date=self.instance.to_date,
            leave_type_name=instance.leave_type.status_name,
            emp_type=instance.employee.employee_type,
            emp_group=instance.employee.employee_group,
            emp_reporting=instance.employee.reporting,
        )

    def update_leave_balances(self, instance, paid_days_override=None):
        """Deduct leave balance on approval.

        paid_days_override: when set, deducts this many days instead of instance.no_of_days.
        Used for allow_beyond_eligible leaves where only the paid portion counts against balance.
        LOP days (beyond eligible) don't consume balance — they're unpaid absences.
        """
        leave_detail = LeaveMasterDetails.objects.filter(
            leave_master__employee=instance.employee,
            leave_type=instance.leave_type.status_name
        ).order_by('id').last()

        if not leave_detail:
            return

        no_of_days        = float(instance.no_of_days or 0)
        days_to_deduct    = float(paid_days_override) if paid_days_override is not None else no_of_days
        current_available = float(leave_detail.available_leaves or 0)

        # Deduct only what's available (can't go below 0)
        deduct_days   = min(days_to_deduct, max(current_available, 0))
        new_available = round(current_available - deduct_days, 2)
        leave_detail.available_leaves = new_available

        policy = leave_detail.leave_policy_key
        if policy and policy.year_to_year_carry:
            carry_cap = float(policy.carry_threshold_value or 0)
            if new_available <= carry_cap:
                leave_detail.carry_forward_days = round(new_available, 2)
                leave_detail.lapse_days = 0
            else:
                leave_detail.carry_forward_days = carry_cap
                leave_detail.lapse_days = round(new_available - carry_cap, 2)

        # utilized tracks actual paid days used (not LOP days)
        leave_detail.utilized_leaves = round(float(leave_detail.utilized_leaves or 0) + days_to_deduct, 2)
        leave_detail.save()

        leave_breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=leave_detail).order_by('id').last()
        if leave_breakup:
            leave_breakup.available_leaves = round(float(leave_breakup.available_leaves or 0) - deduct_days, 2)
            leave_breakup.utilized_leaves  = round(float(leave_breakup.utilized_leaves or 0) + days_to_deduct, 2)
            leave_breakup.save()

        LeaveMaster.objects.filter(pk=leave_detail.leave_master.pk).update(
            total_available_leaves=F('total_available_leaves') - round(deduct_days, 2),
            total_utilized_leaves=F('total_utilized_leaves') + round(days_to_deduct, 2)
        )

    def _trigger_post_save_signal(self, instance, is_created, validated_data=None):
        """Helper method to handle post-save signal triggering"""
        # Determine dates and leave days based on status
        if is_created or instance.approval_status != 'APPROVED':
            start_date = format_date_with_day(instance.from_date)
            end_date = format_date_with_day(instance.to_date)
            leave_days = instance.no_of_days
        else:
            start_date = format_date_with_day(instance.from_date)
            end_date = format_date_with_day(instance.to_date)
            leave_days = instance.no_of_days

        # Prepare signal data
        signal_kwargs = {
            'sender': LeaveEntry,
            'instance': instance,
            'created': is_created,
            'update_fields': validated_data.keys() if validated_data else None,
            'raw': False,
            'request': self.context.get('request'),
            'data': {
                'start_date': start_date,
                'end_date': end_date,
                'leave_days': leave_days
            }
        }
        post_save.send(**signal_kwargs)

    def to_internal_value(self, data):
        data = data.copy()
        data = convert_form_data(data)
        certificate = data.pop('certificate', None)
        if 'is_reversal' in data:
            data['is_reversal'] = data['is_reversal'] if data['is_reversal'] != "" else False
        if 'is_extension' in data:
            data['is_extension'] = data['is_extension'] if data['is_extension'] != "" else False
        if 'allow_beyond_eligible' in data:
            data['allow_beyond_eligible'] = data['allow_beyond_eligible'] if data['allow_beyond_eligible'] != "" else False
        if 'is_paid_beyond' in data:
            data['is_paid_beyond'] = data['is_paid_beyond'] if data['is_paid_beyond'] != "" else False
        if 'lop_days_from_extension' in data:
            data['lop_days_from_extension'] = data['lop_days_from_extension'] if data['lop_days_from_extension'] not in ["", None] else 0
        if 'travel_or_leave' in data:
            data['travel_or_leave'] = data['travel_or_leave'] if data['travel_or_leave'] != "" else None
        if 'holiday_days' in data:
            data['holiday_days'] = data['holiday_days'] if data['holiday_days'] not in ["", None] else 0
        if 'extended_to_date' in data:
            data['extended_to_date'] = data['extended_to_date'] if data['extended_to_date'] not in ["", None] else None
        if 'weekly_off_days' in data:
            data['weekly_off_days'] = data['weekly_off_days'] if data['weekly_off_days'] not in ["", None] else 0
        validated_data = super().to_internal_value(data)
        if certificate is not None:
            validated_data['certificate'] = certificate
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee is not None:
                emp = instance.employee
                data['employee_default_object'] = dict(
                    first_name=emp.first_name,
                    employee_code=emp.employee_code,
                    id=emp.id,
                    designation_name=emp.designation.designation_name if emp.designation else None
                )
                data['last_name'] = emp.last_name
                data['first_name'] = emp.first_name
                data['grade'] = emp.grade.grade_code if emp.grade else None
                data['designation'] = emp.designation.designation_code if emp.designation else None
                data['designation_name'] = emp.designation.designation_name if emp.designation else None
                data['department_name'] = emp.department.department_name if emp.department else None
                data['doj'] = emp.doj.strftime('%d-%m-%Y') if emp.doj else None
                data['weekly_off'] = emp.weekly_off
            if instance.leave_type is not None:
                data['leave_type_default_object'] = dict(
                    status_name=instance.leave_type.status_name,
                    # available_leaves=instance.leave_type.available_leaves,
                    id=instance.leave_type.id
                )
                data['leave_type_status_code']=instance.leave_type.code

        if instance.employee is not None:
            data['first_name'] = instance.employee.first_name
            data['employee_code'] = instance.employee.employee_code
        if instance.leave_type is not None:
            data['leave_types'] = instance.leave_type.status_name
        if hasattr(instance, 'approval_status'):
            data['status'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                         instance.approval_status)
        if instance.delegated_reviewer is not None:
            data['default_delegated_reviewer_object'] = dict(
                first_name=instance.delegated_reviewer.first_name,
                id=instance.delegated_reviewer.id
            )

        # Override stored available_leaves snapshot with the live balance from LeaveMasterDetails.
        # The model field holds a snapshot from application time; the extension dialog needs the
        # current balance so it can correctly compute extension_days vs LOP split.
        if get_by_id and instance.employee and instance.leave_type:
            try:
                live_detail = LeaveMasterDetails.objects.filter(
                    leave_master__employee=instance.employee,
                    leave_type=instance.leave_type.status_name,
                ).order_by('id').last()
                if live_detail is not None:
                    data['available_leaves'] = float(live_detail.available_leaves or 0)
            except Exception:
                pass  # keep the stored snapshot on error

        return data

    def validate(self, validated_data):
        instance = self.instance
        # extended_to_date = resume duty date (overstay only), not extra leave.
        has_resume_date = bool(validated_data.get('extended_to_date'))

        # Get dates (always needed for validation)
        from_date = validated_data.get('from_date')
        to_date = validated_data.get('to_date')

        # Skip available leaves check when allow_beyond_eligible or resume date is set
        # (already an active leave — balance was checked at creation time)
        allow_beyond = validated_data.get('allow_beyond_eligible', False) or (instance and getattr(instance, 'allow_beyond_eligible', False))
        if validated_data['travel_or_leave'] == 'Leave' and not has_resume_date and not allow_beyond:
            if validated_data['available_leaves'] == 0:
                raise ValidationError(f"You don't have sufficient available leaves")

        # Skip overlapping check when resume date is set or allow_beyond leaves
        if not has_resume_date and not allow_beyond:
            employee = validated_data.get('employee')
            
            if employee and from_date and to_date:
                overlapping_applications = LeaveApplication.objects.filter(
                    employee_code=employee,
                    approval_status='APPROVED',
                    is_reversal=False,
                    new_leave_start_date__lte=to_date,
                    new_leave_end_date__gte=from_date
                )
                
                if instance:
                    overlapping_applications = overlapping_applications.exclude(id=instance.id)
                
                if overlapping_applications.exists():
                    overlap = overlapping_applications.first()
                    raise serializers.ValidationError({
                        'from_date': f"Leave dates overlap with approved leave application from {overlap.new_leave_start_date.strftime('%d-%m-%Y')} to {overlap.new_leave_end_date.strftime('%d-%m-%Y')}"
                    })
        
        # Date range validation - always check this regardless of extension
        if from_date and to_date and from_date > to_date:
            raise serializers.ValidationError({
                'to_date': 'To date must be after or equal to from date'
            })
        
        return validated_data


    def _validate_leave_conditions(self, validated_data, instance, request):
        """
        Policy-driven leave validation.
        Checks: min/max stretch, eligible_after_days, backdated_days_limit,
        allow_half_day, allow_advance_leave, require_document (threshold from policy).
        All hardcoded designation/leave-type-name logic removed.
        When allow_beyond_eligible=True, balance-based checks are skipped.
        """
        # If allow_beyond_eligible is set, skip all balance/eligibility checks
        allow_beyond = validated_data.get('allow_beyond_eligible', False) or (instance and getattr(instance, 'allow_beyond_eligible', False))
        if allow_beyond:
            print("[LeaveExtension] allow_beyond_eligible=True — skipping balance/eligibility validation")
            return
        certificate = None
        b_id = (
            request.query_params.get('b_id')
            or getattr(request, 'b_id', None)
            or (instance.b_id if instance else None)
            or validated_data.get('b_id')
        )

        # On partial updates (approval flow), fall back to instance fields
        employee   = validated_data.get('employee')   or (instance.employee   if instance else None)
        leave_type = validated_data.get('leave_type') or (instance.leave_type if instance else None)
        no_of_days = float(validated_data.get('no_of_days') or (instance.no_of_days if instance else 0) or 0)
        from_date  = validated_data.get('from_date')  or (instance.from_date  if instance else None)
        today      = date.today()

        if not employee or not leave_type:
            return

        leave = LeaveMasterDetails.objects.filter(
            leave_master__employee__id=employee.id,
            leave_type=leave_type.status_name,
            b_id=b_id,
        ).order_by('id').last()

        policy = leave.leave_policy_key if leave else None


        # Fallback: look up policy directly from LeavePolicy if not found via balance
        if not policy:
            from hrm_master.tasks.accrue_leave_task import get_leave_policies_for_employee, get_policy_for_date
            policies_by_lt = get_leave_policies_for_employee(
                employee.employee_type,
                employee.employee_group,
                employee.reporting,
                b_id,
            )
            for _, versions in policies_by_lt.items():
                sample = versions[-1]
                if sample.type_of_leave and sample.type_of_leave.status_name == leave_type.status_name:
                    policy = get_policy_for_date(versions, today) or versions[-1]
                    break


        # ── Min / Max stretch ────────────────────────────────────────────
        if policy:
            max_days = float(policy.max_stretch_days or 0)
            min_days = float(policy.min_stretch_days or 0)

            if max_days > 0 and no_of_days > max_days:
                readable = int(max_days) if max_days == int(max_days) else max_days
                raise serializers.ValidationError(f"Max stretch days is {readable}")

            if min_days > 0 and no_of_days < min_days:
                readable = int(min_days) if min_days == int(min_days) else min_days
                raise serializers.ValidationError(f"Min stretch days is {readable}")

        # ── Eligible after days (service length gate) ────────────────────
        if policy and policy.eligible_after_days:
            doj = employee.doj
            if doj:
                service_days = (today - doj).days
                if service_days < policy.eligible_after_days:
                    raise serializers.ValidationError(
                        f"You are not yet eligible for {leave_type.status_name}. "
                        f"Required service: {policy.eligible_after_days} days "
                        f"(you have {service_days} days)."
                    )

        # ── Backdated days limit ─────────────────────────────────────────
        if policy and policy.backdated_days_limit and from_date:
            backdated_days = (today - from_date).days
            if backdated_days > policy.backdated_days_limit:
                raise serializers.ValidationError(
                    f"Leave cannot be applied more than {policy.backdated_days_limit} days in the past."
                )

        # ── Advance leave (future dates) ─────────────────────────────────
        if policy and not policy.allow_advance_leave and from_date:
            if from_date > today:
                raise serializers.ValidationError(
                    f"Advance leave is not allowed for {leave_type.status_name}."
                )

        # ── Half day ─────────────────────────────────────────────────────
        if policy and not policy.allow_half_day:
            condition = validated_data.get('condition', '')
            if condition and 'half' in str(condition).lower():
                raise serializers.ValidationError(
                    f"Half-day leave is not allowed for {leave_type.status_name}."
                )

        # ── Document requirement ─────────────────────────────────────────
        if policy and policy.require_document:
            threshold = float(policy.require_document_after_days or 0)
            # Prefer incoming validated_data certificate (new upload),
            # fall back to existing instance certificate (already saved file)
            certificate = validated_data.get('certificate', None)
            if not certificate and instance is not None:
                certificate = instance.certificate or None

            if no_of_days > threshold and not certificate:
                raise serializers.ValidationError(
                    f"A supporting document is required for {leave_type.status_name} "
                    f"exceeding {int(threshold)} day(s)."
                )

        # File type validation — runs whenever a certificate is uploaded
        certificate = validated_data.get('certificate', None)
        if certificate:
            file_extension = os.path.splitext(certificate.name)[1][1:].lower()
            if file_extension not in ALLOWED_FILE_EXTENSIONS:
                raise serializers.ValidationError(
                    f"Medical certificate must be one of the following file types: {', '.join(ALLOWED_FILE_EXTENSIONS)}."
                )

# class LeaveEntrySerializer(AuditModelMixinSerializer, ApprovalModelMixinSerializer):
#     from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
#     to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
#     is_lop = serializers.BooleanField(required=False)
#     is_comp_off = serializers.BooleanField(required=False)

#     class Meta:
#         model = LeaveEntry
#         fields = '__all__'

#     def create(self, validated_data):
#         """
#         Handle leave entry creation with validation.
#         """
#         master_service = importlib.import_module('hrm_master.api.service')
#         leave_entry_signal = master_service.MasterSignal

#         # Validate dates
#         leave_entry_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])
#         leave_entry_signal.validate_duplicate_dates(
#             validated_data['employee'], 
#             validated_data['from_date'], 
#             validated_data['to_date']
#         )

#         instance = super().create(validated_data)

#         # Handle approval logic if already approved during creation
#         if instance.approval_status == ApprovalModelMixin.APPROVED:
#             self.update_leave_balances(instance)

#         return instance

#     def update(self, instance, validated_data):
#         """
#         Handle leave entry updates with validation and approval logic.
#         """
#         master_service = importlib.import_module('hrm_master.api.service')
#         leave_entry_signal = master_service.MasterSignal

#         # Validate dates
#         leave_entry_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])

#         # Update instance
#         instance = super().update(instance, validated_data)

#         # Handle approval logic
#         if instance.approval_status == ApprovalModelMixin.APPROVED:
#             self.update_leave_balances(instance)

#         return instance

#     def validate(self, validated_data):
#         """
#         Validate available leaves before saving.
#         """
#         if validated_data.get('leave_type') and validated_data.get('employee'):
#             try:
#                 # Fetch leave balance details
#                 leave_balance = LeaveMasterDetails.objects.get(
#                     leave_master__employee=validated_data['employee'],
#                     leave_type=validated_data['leave_type'].status_name
#                 )
#             except LeaveMasterDetails.DoesNotExist:
#                 raise serializers.ValidationError(
#                     {"leave_type": "Leave balance details not found for the given leave type and employee."}
#                 )

#             # Check if available leaves are sufficient
#             if leave_balance.available_leaves < validated_data.get('no_of_days', 0):
#                 raise serializers.ValidationError(
#                     {"available_leaves": f"Insufficient available leaves. Available: {leave_balance.available_leaves}"}
#                 )

#         return validated_data

#     def update_leave_balances(self, instance):
#         """
#         Update the available and utilized leaves in LeaveMasterDetails and LeaveMaster.
#         """
#         try:
#             with transaction.atomic():
#                 # Fetch the related LeaveMasterDetails record
#                 leave_detail = LeaveMasterDetails.objects.select_for_update().get(
#                     leave_master__employee=instance.employee,
#                     leave_type=instance.leave_type.status_name
#                 )

#                 # Validate available leaves before deduction
#                 if leave_detail.available_leaves < instance.no_of_days:
#                     raise serializers.ValidationError(
#                         {"available_leaves": f"Insufficient available leaves. Available: {leave_detail.available_leaves}"}
#                     )

#                 # Update LeaveMasterDetails (atomic operation)
#                 LeaveMasterDetails.objects.filter(pk=leave_detail.pk).update(
#                     available_leaves=F('available_leaves') - instance.no_of_days,
#                     utilized_leaves=F('utilized_leaves') + instance.no_of_days
#                 )

#                 # Update LeaveMaster (atomic operation)
#                 LeaveMaster.objects.filter(pk=leave_detail.leave_master.pk).update(
#                     total_available_leaves=F('total_available_leaves') - instance.no_of_days,
#                     total_utilized_leaves=F('total_utilized_leaves') + instance.no_of_days
#                 )

#         except LeaveMasterDetails.DoesNotExist:
#             raise serializers.ValidationError(
#                 {"leave_type": "No matching leave balance found for this employee and leave type."}
#             )


class LeaveMasterDetailsBreakupSerializer(AuditModelMixinSerializer):
    class Meta:
        model = LeaveMasterDetailBreakup
        fields = [
            'id',
            'leave_master_detail',
            'leave_policy',
            'opening_balance',
            'allocated_leaves',
            'utilized_leaves',
            'available_leaves',
            'allocated_month',
            'allocated_year'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # if instance.leave_policy_detail is not None:
        #         pay_type_mapping = {
        #             'Full_pay': 'Full Pay',
        #             'Half_pay': 'Half Pay',
        #             'No_pay': 'No Pay'
        #         }
        #
        #         data['type_of_pay'] = pay_type_mapping.get(instance.leave_policy_detail.full_half_day,
        #                                                    instance.leave_policy_detail.full_half_day)
        return data


class LeaveMasterDetailsSerializer(AuditModelMixinSerializer):
    breakup_details = LeaveMasterDetailsBreakupSerializer(many=True, required=False)

    class Meta:
        model = LeaveMasterDetails
        fields = [
            'id',
            'leave_type',
            'leave_master',
            'allocated_leaves',
            'utilized_leaves',
            'available_leaves',
            'financial_year',
            'opening_balance',
            'breakup_details',
            'carry_forward_days',
            'lapse_days',
            'leave_policy_key',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['total_allocated_leaves'] = instance.leave_master.total_allocated_leaves
        data['total_utilized_leaves'] = instance.leave_master.total_utilized_leaves
        data['total_available_leaves'] = instance.leave_master.total_available_leaves

        return data


class LeaveMasterSerializer(AuditModelMixinSerializer):
    leave_master_details = LeaveMasterDetailsSerializer(many=True, required=False)

    class Meta:
        model = LeaveMaster
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        leave_master_details = validated_data.pop('leave_master_details', [])

        instance = super().create(validated_data)
        self._create_or_update_leave_master_details(instance, leave_master_details, request=request)
        return instance

    def update(self, instance, validated_data):
        # print('validated data leave update', validated_data)
        request = self.context.get('request')

        # Update or create leave details instances related to the Grade Model
        leave_master_details = validated_data.pop('leave_master_details', [])
        # print('leave_master_details', leave_master_details)

        instance = super().update(instance, validated_data)
        self._create_or_update_leave_master_details(instance, leave_master_details, request=request)
        return instance

    def _create_or_update_leave_master_details(self, leave_master_instance,
                                               leave_master_details_items_data, **kwargs):
        leave_items_ids = []
        for item_data in leave_master_details_items_data:
            # print("item_data",item_data)
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['leave_master'] = leave_master_instance.id
                leave_master_items_serializer = LeaveMasterDetailsSerializer(data=item_data, context=self.context)
                leave_master_items_serializer.is_valid(raise_exception=True)
                leave_master_details_item_instance = leave_master_items_serializer.create(
                    leave_master_items_serializer.validated_data)

                leave_items_ids.append(leave_master_details_item_instance.id)
            else:
                leave_items_ids.append(item_data['id'])
                leave_master_details_instance = LeaveMasterDetails.objects.get(id=item_data['id'])
                leave_master_items_serializer = LeaveMasterDetailsSerializer(
                    instance=leave_master_details_instance,
                    data=item_data,
                    context=self.context)
                leave_master_items_serializer.is_valid(raise_exception=True)
                leave_master_items_serializer.update(
                    leave_master_details_instance,
                    leave_master_items_serializer.validated_data)
        self._delete_leave_master_detail_items(leave_items_ids, leave_master_instance)
        return True

    def _delete_leave_master_detail_items(self, ids, leave_master_instance):
        LeaveMasterDetails.objects.filter(leave_master=leave_master_instance).exclude(
            id__in=ids).delete()

    def to_internal_value(self, data):
        leave_master_details = data.pop('leave_master_details', [])
        validated_data = super().to_internal_value(data)
        validated_data['leave_master_details'] = leave_master_details
        if 'total_allocated_leaves' in data:
            data['total_allocated_leaves'] = data['total_allocated_leaves'] if data['total_allocated_leaves'] != (
                    "" or None) else 0
        if 'total_utilized_leaves' in data:
            data['total_utilized_leaves'] = data['total_utilized_leaves'] if data['total_utilized_leaves'] != (
                    "" or None) else 0.0
        if 'total_available_leaves' in data:
            data['total_available_leaves'] = data['total_available_leaves'] if data['total_available_leaves'] != (
                    "" or None) else 0
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee is not None:
                data['employee_default_object'] = dict(
                    first_name=instance.employee.first_name,
                    employee_code=instance.employee.employee_code,
                    id=instance.employee.id
                )
        if instance.employee is not None:
            data['first_name'] = instance.employee.first_name
            data['last_name'] = instance.employee.last_name
            data['employee_code'] = instance.employee.employee_code
            data[
                'department_name'] = instance.employee.department.department_name if instance.employee.department is not None else ''
            data['employee_type'] = instance.employee.employee_type
            data['employee_group'] = instance.employee.employee_group
            data['reporting'] = instance.employee.reporting
            data['doj'] = instance.employee.doj.strftime('%d-%m-%Y') if instance.employee.doj else None

        return data


class HolidayMasterSerializer(AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    class Meta:
        model = HolidayMaster
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        self.validate_holiday_master(validated_data, b_id, request=request)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        self.validate_holiday_master(validated_data, b_id, instance.id, request=request)
        instance = super().update(instance, validated_data)
        if instance.approval_status == ApprovalModelMixin.APPROVED:
            self.update_time_based_on_holiday(b_id)
        return instance

    def update_time_based_on_holiday(self, b_id):
        from_date = self.instance.date
        to_date   = self.instance.to_date

        if not (from_date and to_date):
            return

        from datetime import date as _date
        today = _date.today()

        # Future holidays have no attendance records yet — the nightly scheduler
        # will apply the holiday correctly when it runs for those dates.
        if from_date > today:
            return

        # Only reprocess up to today; future portion handled by nightly scheduler.
        effective_to = min(to_date, today)

        try:
            from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
            transfer_attendance_details(
                start_date=from_date.strftime('%Y-%m-%d'),
                end_date=effective_to.strftime('%Y-%m-%d'),
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(
                f"[HolidayMaster] Failed to re-run attendance for holiday "
                f"{from_date}–{effective_to}: {e}"
            )

    def validate_holiday_master(self, validated_data, b_id, instance_id=None, **kwargs):
        if HolidayMaster.objects.filter(date=validated_data['date'], b_id=b_id).exclude(
                id=instance_id).exists():
            formatted_date = validated_data['date'].strftime('%d-%m-%Y')
            raise serializers.ValidationError(
                f"A holiday has already been declared for the selected date:{formatted_date}")


class ShiftTimingsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = ShiftTimings
        fields = '__all__'


class LeaveApplicationSerializer(ApprovalModelMixinSerializer,AuditModelMixinSerializer):
    date_of_joining = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    last_leave_start_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    last_leave_end_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    return_to_work_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    resumed_work_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    new_leave_start_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    new_leave_end_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    ticket_to_be_issued_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    return_ticket_to_be_issued_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    leave_approved_start_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    leave_approved_end_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    passport_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    visa_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    eid_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    labour_card_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    job_loss_insurance_expiry_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    resume_duty_on = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    was_on_leave_from = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    was_on_leave_till = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    # return_ticket_to_be_issued_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    # Make only employee_code required
    # employee_code = serializers.PrimaryKeyRelatedField(queryset=EmployeeMaster.objects.all(), required=True)

    
    # Handle department as ForeignKey
    # department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False)

    # Handle integer fields
    total_leave_days = serializers.IntegerField(required=False, allow_null=True)
    lop_days = serializers.IntegerField(required=False, allow_null=True)
    leave_approved_days = serializers.IntegerField(required=False, allow_null=True)
    no_of_days = serializers.IntegerField(required=False, allow_null=True)

    leave_eligible_as_on = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], required=False, allow_null=True)
    leave_days_eligible = serializers.FloatField(required=False, default=0)
    eligible_for_company_ticket = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    ticket_period_for = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    is_reversal = serializers.BooleanField(required=False)
    is_passport_received = serializers.BooleanField(required=False)
    allow_beyond_eligible = serializers.BooleanField(required=False, default=False)
    lop_days_from_extension = serializers.FloatField(required=False, allow_null=True, default=0)
    # Extension field — not stored directly; processed in update() to extend leave_approved_end_date
    extend_to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', 'iso-8601'], allow_null=True, required=False)
    # Read-only: returns the employee's current available annual leave balance from LeaveMasterDetails
    available_leaves = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LeaveApplication
        fields = '__all__'

    def get_available_leaves(self, obj):
        """Return the employee's current available annual leave balance from LeaveMasterDetails."""
        try:
            emp = obj.employee_code
            if not emp:
                return None
            detail = LeaveMasterDetails.objects.filter(
                leave_master__employee=emp,
                leave_type='Annual Leave',
            ).order_by('id').last()
            return float(detail.available_leaves) if detail else None
        except Exception:
            return None

    def validate(self, validated_data):
        employee = validated_data.get('employee_code')
        from_date = validated_data.get('new_leave_start_date')
        to_date = validated_data.get('new_leave_end_date')
        instance = self.instance
        
        if employee and from_date and to_date:
            # Get all approved leave entries that might overlap
            potential_overlaps = LeaveEntry.objects.filter(
                employee=employee,
                approval_status='APPROVED',
                from_date__lte=to_date,
                to_date__gte=from_date
            )
            
            if instance:
                potential_overlaps = potential_overlaps.exclude(id=instance.id)
            
            # Get all approved reversals
            approved_reversals = LeaveReversalRequest.objects.filter(
                employee=employee,
                approval_status='APPROVED'
            ).values('leave_entry_id', 'reverse_from_date', 'reverse_to_date')
            
            # Check each potential overlap
            for entry in potential_overlaps:
                entry_to_date = entry.extended_to_date if entry.extended_to_date else entry.to_date
                
                # Get all reversals for this entry
                entry_reversals = [r for r in approved_reversals if r['leave_entry_id'] == entry.id]
                
                if entry_reversals:
                    # Calculate occupied periods (original leave minus reversed portions)
                    occupied_periods = []
                    current_start = entry.from_date
                    
                    # Sort reversals by from_date
                    entry_reversals.sort(key=lambda x: x['reverse_from_date'])
                    
                    for reversal in entry_reversals:
                        rev_from = reversal['reverse_from_date']
                        rev_to = reversal['reverse_to_date']
                        
                        # Add period before reversal if it exists
                        if current_start < rev_from:
                            occupied_periods.append((current_start, rev_from - timedelta(days=1)))
                        
                        # Move current_start to after reversal
                        current_start = rev_to + timedelta(days=1)
                    
                    # Add remaining period after all reversals
                    if current_start <= entry_to_date:
                        occupied_periods.append((current_start, entry_to_date))
                    
                    # Check if requested dates overlap with any occupied period
                    for occ_start, occ_end in occupied_periods:
                        if occ_start <= to_date and occ_end >= from_date:
                            raise serializers.ValidationError({
                                'new_leave_start_date': f"Leave dates overlap with approved leave from {occ_start.strftime('%d-%m-%Y')} to {occ_end.strftime('%d-%m-%Y')}"
                            })
                else:
                    # No reversals, check entire period
                    if entry.from_date <= to_date and entry_to_date >= from_date:
                        raise serializers.ValidationError({
                            'new_leave_start_date': f"Leave dates overlap with approved leave from {entry.from_date.strftime('%d-%m-%Y')} to {entry_to_date.strftime('%d-%m-%Y')}"
                        })
        
        if from_date and to_date and from_date > to_date:
            raise serializers.ValidationError({
                'new_leave_end_date': 'To date must be after or equal to from date'
            })
        
        return validated_data

    def _compute_lop_days(self, validated_data, instance=None):
        """
        When allow_beyond_eligible=True, compute how many of the applied days
        exceed the employee's ACTUAL available balance (not the annual entitlement).
        Uses LeaveMasterDetails.available_leaves from DB; falls back to leave_days_eligible
        only when no DB record is found.
        """
        allow_beyond = validated_data.get('allow_beyond_eligible', False) or (instance and getattr(instance, 'allow_beyond_eligible', False))
        if not allow_beyond:
            validated_data['lop_days_from_extension'] = 0
            return
        days_applied = float(validated_data.get('leave_days_applied') or (instance.leave_days_applied if instance else 0) or 0)
        # Prefer DB available_leaves over the form's leave_days_eligible (which is total entitlement)
        employee = validated_data.get('employee_code') or (instance.employee_code if instance else None)
        available_leaves = None
        if employee:
            try:
                detail = LeaveMasterDetails.objects.filter(
                    leave_master__employee=employee,
                    leave_type='Annual Leave',
                ).order_by('id').last()
                if detail:
                    available_leaves = float(detail.available_leaves or 0)
            except Exception:
                pass
        if available_leaves is None:
            # Fallback: use leave_days_eligible from form
            available_leaves = float(validated_data.get('leave_days_eligible') or (instance.leave_days_eligible if instance else 0) or 0)
        lop_days = max(0, days_applied - available_leaves)
        validated_data['lop_days_from_extension'] = round(lop_days, 2)
        print(f"[LeaveApplication] allow_beyond_eligible=True — applied={days_applied}, available={available_leaves}, lop={lop_days}")

    def create(self, validated_data):
        request = self.context.get('request')
        user = self.context.get('request').user
        allow_beyond = validated_data.get('allow_beyond_eligible', False)
        validated_data.pop('extend_to_date', None)  # not a model field — only used in update()
        self.if_not_delegated_reviewer(validated_data['delegated_reviewer'], self.context)
        if not allow_beyond:
            self._validate_leave_application_conditions(validated_data, None, request)
        else:
            print("[LeaveApplication] allow_beyond_eligible=True — skipping condition validation on create")
        self._compute_lop_days(validated_data)
        validated_data['balance_no_of_days'] = validated_data['no_of_days']
        instance = super().create(validated_data)
        master_service = importlib.import_module('hrm_master.api.service')
        leave_application_signal = master_service.MasterSignal
        leave_application_signal.validate_leave_application_duplicate_dates(validated_data['employee_code'], validated_data['new_leave_start_date'],
                                                    validated_data['new_leave_end_date'], exclude_instance=instance)
        self._trigger_post_save_signal(instance, is_created=True)
        self.update_next_stage(instance, user)

        from notifications.signals import leave_application_created
        leave_application_created.send(sender=instance.__class__, instance=instance, user=request.user)

        return instance

    def if_not_delegated_reviewer(self,delegated_reviewer,context):

        if not delegated_reviewer or delegated_reviewer != self.context.get('request').user:
            perms_to_remove = [
                'custom_approval_stage_secondary_approver'
            ]
            remove_permissions( context, perms_to_remove)

    def update_next_stage(self,instance,user):
        approval_stages_object = instance.approval_stages.last()
        if approval_stages_object.stage_name == 'Initiator':
            approval_stages_object.approval_status = 'APPROVED'
            approval_stages_object.approval_date = timezone.now().date()
            approval_stages_object.approved_user = user
            approval_stages_object.approval_by = user.first_name
            approval_stages_object.modified_date = timezone.now()
            approval_stages_object.save()
            approval_model = instance.approval_stages.model
            approval_model.objects.create(
                related_object=instance,
                stage_name='Hr',
                approval_status='PENDING_APPROVAL',
                order=2,
                permission_code='custom_approval_stage_HR',
                created_user_id=user.id
            )
            instance.approval_remarks = 'Pending with HR'
            instance.save()

    def update(self, instance, validated_data):
        request = self.context.get('request')
        allow_beyond = validated_data.get('allow_beyond_eligible', False) or getattr(instance, 'allow_beyond_eligible', False)

        if 'delegated_reviewer' in validated_data:
            instance.delegated_reviewer = validated_data.get('delegated_reviewer')
            self.if_not_delegated_reviewer(instance.delegated_reviewer, self.context)
            instance.save(update_fields=['delegated_reviewer'])

        previous_instance_approval_status = self.instance.approval_status
        is_approved = previous_instance_approval_status == ApprovalModelMixin.APPROVED

        # ── Snapshot available balance BEFORE any deductions ───────────────────
        pre_available_balance_app = None
        if allow_beyond:
            try:
                _la_snap = LeaveMasterDetails.objects.filter(
                    leave_master__employee=instance.employee_code,
                    leave_type='Annual Leave',
                ).order_by('id').last()
                pre_available_balance_app = float(getattr(_la_snap, 'available_leaves', 0) or 0)
                print(f"[LeaveApplication] Pre-deduction balance snapshot: {pre_available_balance_app}")
            except Exception as _e:
                print(f"[LeaveApplication] Could not snapshot balance: {_e}")

        # ── APPROVED date-lock guard ──────────────────────────────────────────
        # Once a LeaveApplication is APPROVED, new_leave_start_date / new_leave_end_date
        # and leave_approved_start_date / leave_approved_end_date are locked forever.
        # Extension is done only through the extend_to_date field.
        if is_approved:
            if validated_data.get('new_leave_start_date') and validated_data['new_leave_start_date'] != instance.new_leave_start_date:
                raise serializers.ValidationError(
                    "new_leave_start_date cannot be changed after leave is approved."
                )
            if validated_data.get('leave_approved_start_date') and validated_data['leave_approved_start_date'] != instance.leave_approved_start_date:
                raise serializers.ValidationError(
                    "leave_approved_start_date cannot be changed after leave is approved."
                )
            incoming_end = validated_data.get('new_leave_end_date')
            if incoming_end and incoming_end != instance.new_leave_end_date:
                extended_to = validated_data.get('extend_to_date')
                if not extended_to:
                    raise serializers.ValidationError(
                        "new_leave_end_date cannot be changed after leave is approved. Use the 'Extend To' field."
                    )
                if incoming_end < instance.new_leave_end_date:
                    raise serializers.ValidationError("Extension date must be after the current leave end date.")
            incoming_approved_end = validated_data.get('leave_approved_end_date')
            if incoming_approved_end and incoming_approved_end != instance.leave_approved_end_date:
                extended_to = validated_data.get('extend_to_date')
                if not extended_to:
                    raise serializers.ValidationError(
                        "leave_approved_end_date cannot be changed after leave is approved. Use the 'Extend To' field."
                    )

        # ── Extension path: extend_to_date ───────────────────────────────────
        extend_to_date = validated_data.pop('extend_to_date', None)
        old_approved_end = instance.leave_approved_end_date
        old_new_end = instance.new_leave_end_date
        is_extending = is_approved and extend_to_date and old_approved_end and extend_to_date != old_approved_end

        if is_extending:
            if allow_beyond:
                print(f"[LeaveApplication] Reverting LOP records before extension: {old_approved_end} → {extend_to_date}")
                self._revert_extension_lop_application(instance)
            # Apply extension dates
            validated_data['new_leave_end_date'] = extend_to_date
            validated_data['leave_approved_end_date'] = extend_to_date
            # Recompute days
            start = instance.leave_approved_start_date or instance.new_leave_start_date
            if start:
                total_days = (extend_to_date - start).days + 1
                validated_data['leave_approved_days'] = total_days
                validated_data['leave_days_applied'] = total_days
                validated_data['no_of_days'] = total_days
                validated_data['balance_no_of_days'] = total_days

        # ── Revert LOP on end-date change (non-extension allow_beyond path) ──
        if allow_beyond and is_approved and not is_extending:
            new_end = validated_data.get('new_leave_end_date') or validated_data.get('leave_approved_end_date')
            if new_end and new_end != old_approved_end:
                print(f"[LeaveApplication] End date changed, reverting LOP records")
                self._revert_extension_lop_application(instance)

        validated_data['balance_no_of_days'] = validated_data.get('no_of_days', instance.no_of_days)

        if not allow_beyond:
            self._validate_leave_application_conditions(validated_data, instance, request)
        else:
            print("[LeaveApplication] allow_beyond_eligible=True — skipping condition validation on update")

        # lop_days_from_extension comes directly from the frontend payload on update.
        # _compute_lop_days is only needed on create(). Do not call it here.
        instance = super().update(instance, validated_data)

        master_service = importlib.import_module('hrm_master.api.service')
        leave_application_signal = master_service.MasterSignal
        if not is_extending and not allow_beyond:
            leave_application_signal.validate_leave_application_duplicate_dates(
                validated_data['employee_code'],
                validated_data['new_leave_start_date'],
                validated_data['new_leave_end_date'],
                exclude_instance=instance
            )
        else:
            print(f"[LeaveApplication] Skipping duplicate date validation (is_extending={is_extending}, allow_beyond={allow_beyond})")

        self._trigger_post_save_signal(instance, is_created=False, validated_data=validated_data, previous_instance_approval_status=previous_instance_approval_status)

        newly_approved = (previous_instance_approval_status == ApprovalModelMixin.PENDING_APPROVAL
                          and instance.approval_status == ApprovalModelMixin.APPROVED)

        if newly_approved:
            if not instance.leave_approved_start_date or not instance.leave_approved_end_date:
                raise serializers.ValidationError("Please provide both leave approval start and end dates.")
            instance.employee_code.is_under_leave = True
            instance.employee_code.employee_status = "On Leave"
            instance.employee_code.is_available = False
            instance.employee_code.save(update_fields=['is_under_leave', 'employee_status', 'is_available'])
            if instance.ticket_provided_by == "Company":
                self.update_ticket_master()
            if not allow_beyond:
                # Standard approval: deduct from annual leave balance (balance check happens inside)
                self.operate_on_annual_leave()
            # Update timesheet BEFORE applying LOP so LOP marks aren't overwritten
            self.update_time_on_leave_entry(instance)

        # ── Extension: update attendance timesheet for extended span ──────────
        if is_extending:
            extended_days = (extend_to_date - old_approved_end).days
            if extended_days > 0 and not allow_beyond:
                # Standard extension: deduct additional days from annual leave balance
                self._deduct_extended_days_application(instance, extended_days)
            # Update timesheet BEFORE applying LOP so LOP marks aren't overwritten
            self.update_time_on_leave_entry(instance)

        # ── Apply LOP LAST for allow_beyond_eligible ──────────────────────────
        # Runs after update_time_on_leave_entry so LOP marks overwrite the leave-status
        # records for excess days. Uses pre-deduction balance so split is correct.
        if allow_beyond:
            end_changed = (
                (newly_approved)
                or (is_approved and (
                    (extend_to_date and extend_to_date != old_approved_end)
                    or (validated_data.get('new_leave_end_date') and validated_data.get('new_leave_end_date') != old_new_end)
                ))
            )
            if end_changed:
                print(f"[LeaveApplication] Applying LOP for beyond-eligible days")
                self._apply_extension_lop_application(instance, request, available_override=pre_available_balance_app)

                # Now deduct the PAID portion from annual leave balance.
                # paid_days = total_approved_days - lop_days (lop days cost nothing from balance)
                # This covers both newly_approved and extension cases.
                total_approved = float(instance.leave_approved_days or 0)
                lop_days = float(instance.lop_days_from_extension or 0)
                print("lop days",lop_days,"total_approved",total_approved)
                paid_days = max(0, total_approved - lop_days)
                if newly_approved and paid_days > 0:
                    self._deduct_extended_days_application(instance, paid_days)
                    print(f"[LeaveApplication] allow_beyond: deducted {paid_days} paid day(s) from balance (total={total_approved}, lop={lop_days})")

                # For extension path: deduct only the paid portion of the NEW extended days
                if is_extending:
                    ext_days = (extend_to_date - old_approved_end).days
                    paid_ext = max(0, float(ext_days) - lop_days)
                    if paid_ext > 0:
                        self._deduct_extended_days_application(instance, paid_ext)
                        print(f"[LeaveApplication] allow_beyond extension: deducted {paid_ext} paid extension day(s) from balance")

        # ── Notifications ─────────────────────────────────────────────────────
        if previous_instance_approval_status != instance.approval_status and instance.approval_status != ApprovalModelMixin.PENDING_APPROVAL:
            from notifications.signals import leave_application_status_changed
            leave_application_status_changed.send(sender=instance.__class__, instance=instance, user=request.user, old_status=previous_instance_approval_status)

        return instance

    def _deduct_extended_days_application(self, instance, extended_days):
        """Deduct paid days from annual leave balance (LeaveMasterDetails, LeaveMaster, LeaveMasterDetailBreakup)."""
        try:
            leave_master_detail = LeaveMasterDetails.objects.filter(
                leave_master__employee=instance.employee_code,
                leave_type='Annual Leave',
            ).order_by('id').last()
            if not leave_master_detail:
                print("[LeaveApplication] No annual leave record found — skipping balance deduction")
                return

            # ── LeaveMasterDetails ────────────────────────────────────────────
            leave_master_detail.available_leaves = round(
                leave_master_detail.available_leaves - extended_days, 2
            )
            leave_master_detail.utilized_leaves = round(
                leave_master_detail.utilized_leaves + extended_days, 2
            )
            # Carry-forward adjustment
            policy = leave_master_detail.leave_policy_key
            if policy and policy.year_to_year_carry:
                carry_cap = float(policy.carry_threshold_value or 0)
                new_avail = leave_master_detail.available_leaves
                if new_avail <= carry_cap:
                    leave_master_detail.carry_forward_days = round(new_avail, 2)
                    leave_master_detail.lapse_days = 0
                else:
                    leave_master_detail.carry_forward_days = carry_cap
                    leave_master_detail.lapse_days = round(new_avail - carry_cap, 2)
            leave_master_detail.save()

            # ── LeaveMasterDetailBreakup ──────────────────────────────────────
            leave_breakup = LeaveMasterDetailBreakup.objects.filter(
                leave_master_detail=leave_master_detail
            ).order_by('id').last()
            if leave_breakup:
                leave_breakup.available_leaves = round(leave_breakup.available_leaves - extended_days, 2)
                leave_breakup.utilized_leaves = round(leave_breakup.utilized_leaves + extended_days, 2)
                leave_breakup.save()

            # ── LeaveMaster (parent totals) ───────────────────────────────────
            leave_master = leave_master_detail.leave_master
            leave_master.total_available_leaves = round(
                leave_master.total_available_leaves - extended_days, 2
            )
            leave_master.total_utilized_leaves = round(
                leave_master.total_utilized_leaves + extended_days, 2
            )
            leave_master.save()

            print(f"[LeaveApplication] Deducted {extended_days} paid day(s) from annual leave balance")
        except Exception as e:
            import traceback
            print(f"[LeaveApplication] _deduct_extended_days_application error: {e}\n{traceback.format_exc()}")

    def _revert_extension_lop_application(self, instance):
        """Revert LOP attendance records previously marked by _apply_extension_lop_application."""
        try:
            from hrm_main.models import AttendanceDetails
            lop_ids = list(getattr(instance, 'extension_lop_attendance_ids', None) or [])
            if not lop_ids:
                print("[LeaveApplication] No stored LOP attendance IDs to revert")
                return
            reverted = 0
            status_code = None
            try:
                status_code = str(AttendanceStatusMaster.objects.filter(status_name='Annual Leave').first().code)
            except Exception:
                pass
            for att_id in lop_ids:
                att = AttendanceDetails.objects.filter(id=att_id).first()
                if att and att.status == '22':
                    att.status = status_code or att.status
                    att.save(update_fields=['status'])
                    reverted += 1
            instance.extension_lop_attendance_ids = []
            instance.lop_days_from_extension = 0
            instance.save(update_fields=['extension_lop_attendance_ids', 'lop_days_from_extension'])
            print(f"[LeaveApplication] Reverted {reverted} LOP attendance records")
        except Exception as e:
            import traceback
            print(f"[LeaveApplication] _revert_extension_lop_application error: {e}\n{traceback.format_exc()}")

    def _apply_extension_lop_application(self, instance, request, available_override=None):
        """Mark attendance as LOP for days that exceed available annual leave balance.

        available_override: pass the pre-deduction balance snapshot so this function
        correctly splits leave-status vs LOP even after balance was already reduced.
        """
        try:
            from hrm_main.models import AttendanceDetails
            b_id = instance.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')
            emp = instance.employee_code
            from_date = instance.leave_approved_start_date or instance.new_leave_start_date
            to_date = instance.leave_approved_end_date or instance.new_leave_end_date
            if not from_date or not to_date:
                return
            if available_override is not None:
                available = float(available_override)
                print(f"[LeaveApplication] Using pre-deduction balance override: {available}")
            else:
                leave_master_detail = LeaveMasterDetails.objects.filter(
                    leave_master__employee=emp,
                    leave_type='Annual Leave',
                ).order_by('id').last()
                available = float(getattr(leave_master_detail, 'available_leaves', 0) or 0)
            status_code = None
            try:
                status_code = str(AttendanceStatusMaster.objects.filter(status_name='Annual Leave').first().code)
            except Exception:
                pass
            att_records = list(AttendanceDetails.objects.filter(
                employee_code=emp.employee_code,
                b_id=b_id,
                date__range=[from_date, to_date],
            ).order_by('date'))

            # Count calendar days in range that are NOT skipped (WO/Holiday etc.)
            # Some days may have no attendance row at all (missing records) — these
            # still count as working days for LOP purposes.
            SKIP_STATUSES = {'17', '5', '11', '18', '19'}
            att_by_date = {att.date: att for att in att_records}

            total_calendar_days = (to_date - from_date).days + 1
            # Count days that are skipped (WO/Holiday) — only from existing records
            skipped_days = sum(
                1 for att in att_records if att.status in SKIP_STATUSES
            )
            # Chargeable days = calendar days minus WO/Holiday days
            chargeable_days = total_calendar_days - skipped_days

            # True LOP = chargeable days beyond available balance
            true_lop_days = max(0, chargeable_days - int(available))

            lop_ids = []
            covered = 0.0
            from datetime import timedelta as _td
            current = from_date
            while current <= to_date:
                att = att_by_date.get(current)
                if att and att.status in SKIP_STATUSES:
                    current += _td(days=1)
                    continue
                if covered < available:
                    covered += 1
                    if att and status_code and att.status != status_code:
                        att.status = status_code
                        att.save(update_fields=['status'])
                else:
                    # LOP — mark existing record if present, record date if missing
                    if att:
                        att.status = '22'
                        att.save(update_fields=['status'])
                        lop_ids.append(att.id)
                    # Missing attendance row: still counts as LOP (no row to update)
                current += _td(days=1)

            instance.extension_lop_attendance_ids = lop_ids
            instance.lop_days_from_extension = true_lop_days  # use calculated value, not just len(lop_ids)
            instance.save(update_fields=['extension_lop_attendance_ids', 'lop_days_from_extension'])
            print(f"[LeaveApplication] chargeable={chargeable_days}, available={available}, LOP={true_lop_days}, marked IDs: {lop_ids}")
        except Exception as e:
            import traceback
            print(f"[LeaveApplication] _apply_extension_lop_application error: {e}\n{traceback.format_exc()}")

    def _validate_leave_application_conditions(self, validated_data, instance, request):
        b_id = (
            request.query_params.get('b_id')
            or getattr(request, 'b_id', None)
            or (instance.b_id if instance else None)
            or validated_data.get('b_id')
        )
        today = date.today()

        # Fall back to instance fields on partial updates (approval flow)
        employee      = validated_data.get('employee_code') or (instance.employee_code if instance else None)
        no_of_days    = float(validated_data.get('leave_days_applied') or (instance.leave_days_applied if instance else 0) or 0)
        leave_app_days = float(validated_data.get('leave_approved_days') or (instance.leave_approved_days if instance else 0) or 0)

        if not employee:
            return

        leave = LeaveMasterDetails.objects.filter(
            leave_master__employee__id=employee.id,
            leave_type='Annual Leave',
        ).last()

        policy = leave.leave_policy_key if leave else None

        # Fallback: look up policy directly from LeavePolicy
        if not policy:
            from hrm_master.tasks.accrue_leave_task import get_leave_policies_for_employee, get_policy_for_date
            policies_by_lt = get_leave_policies_for_employee(
                employee.employee_type,
                employee.employee_group,
                employee.reporting,
                b_id,
            )
            for _, versions in policies_by_lt.items():
                sample = versions[-1]
                if sample.type_of_leave and sample.type_of_leave.status_name == 'Annual Leave':
                    policy = get_policy_for_date(versions, today) or versions[-1]
                    break

        if policy:
            max_days = float(policy.max_stretch_days or 0)
            min_days = float(policy.min_stretch_days or 0)

            # Skip max stretch check if the leave application has any approved allow_beyond extension
            has_beyond_extension = False
            if instance and max_days > 0:
                try:
                    from hrm_master.models import LeaveExtension
                    has_beyond_extension = LeaveExtension.objects.filter(
                        leave_application=instance,
                        allow_beyond_eligible=True,
                        approval_status=_AMM.APPROVED,
                    ).exists()
                except Exception:
                    pass

            if max_days > 0 and not has_beyond_extension:
                if no_of_days > max_days:
                    readable_max = int(max_days) if max_days == int(max_days) else max_days
                    raise serializers.ValidationError(f"Max stretch days is {readable_max}")
                if leave_app_days > max_days:
                    readable_max = int(max_days) if max_days == int(max_days) else max_days
                    raise serializers.ValidationError(f"Max stretch days is {readable_max}")

            if min_days > 0 and no_of_days < min_days:
                readable_min = int(min_days) if min_days == int(min_days) else min_days
                raise serializers.ValidationError(f"Min stretch days is {readable_min}")

            if min_days > 0 and leave_app_days < min_days:
                readable_min = int(min_days) if min_days == int(min_days) else min_days
                raise serializers.ValidationError(f"Min stretch days is {readable_min}")

    def update_time_on_leave_entry(self,instance):
        request = self.context.get('request')
        b_id = instance.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')
        status_code = AttendanceStatusMaster.objects.filter(status_name='Annual Leave').first().code
        timesheet_cal = TimeSheetCal()
        from_date = self.instance.leave_approved_start_date
        to_date = self.instance.leave_approved_end_date

        leave_master_detail = LeaveMasterDetails.objects.filter(
            leave_master__employee=instance.employee_code,
            leave_type='Annual Leave'
        ).order_by('id').last()

        type_of_days = getattr(getattr(leave_master_detail, 'leave_policy_key', None), 'type_of_days',
                               None) or 'Working_days'

        if not (from_date and to_date):
            return  # Exit early if dates are invalid

        attendance_details = AttendanceDetails.objects.filter(
            date__range=[from_date, to_date],
            employee_code=self.instance.employee_code.employee_code
        )

        for detail in attendance_details:
            try:
                total_hours = int(detail.total_hours or 0)
                processed_hours = int(detail.processed_total_hour or 0)
            except:
                total_hours = 0
                processed_hours = 0

            is_auto_punch = getattr(self.instance.employee_code, 'auto_punch', False)
            status_to_validate = ['11', '17', '5', '18', '19'] if type_of_days == 'Working_days' else ['11', '5', '19']

            if detail.status in status_to_validate or (not is_auto_punch and (total_hours > 0 or processed_hours > 0)):
                continue

            updated_data = timesheet_cal.get_attendance_obj_for_leave(status_code)
            for field, value in updated_data.items():
                if field == 'working_time':
                    continue  # preserve existing working_time — it reflects actual device punch data
                setattr(detail, field, value)

            detail.save()

        # After updating the leave span, also check if the day immediately after
        # leave end is a weekly off that should become LOP
        emp = instance.employee_code
        _apply_lop_after_leave(
            emp_code=emp.employee_code,
            b_id=b_id,
            leave_end_date=self.instance.leave_approved_end_date,
            leave_type_name='Annual Leave',
            emp_type=emp.employee_type,
            emp_group=emp.employee_group,
            emp_reporting=emp.reporting,
        )

    def operate_on_annual_leave(self):
        leave_master_detai_obj = LeaveMasterDetails.objects.filter(
            leave_master__employee=self.instance.employee_code,
            leave_type='Annual Leave'
        ).order_by('id').last()

        if not leave_master_detai_obj:
            raise serializers.ValidationError("Annual leave record not found for this employee.")

        if leave_master_detai_obj.available_leaves < self.instance.leave_approved_days:
            raise serializers.ValidationError("Cannot approve leave more than available leave days.")

        approved_days = self.instance.leave_approved_days

        leave_master_detai_obj.available_leaves = round(
            leave_master_detai_obj.available_leaves - approved_days, 2
        )

        if leave_master_detai_obj.leave_policy_key.year_to_year_carry:
            if leave_master_detai_obj.available_leaves <= leave_master_detai_obj.carry_forward_days:
                leave_master_detai_obj.carry_forward_days = leave_master_detai_obj.available_leaves
                leave_master_detai_obj.lapse_days = 0
            else:
                leave_master_detai_obj.lapse_days = leave_master_detai_obj.available_leaves - leave_master_detai_obj.carry_forward_days

        leave_master_detai_obj.utilized_leaves = round(
            leave_master_detai_obj.utilized_leaves + approved_days, 2
        )
        leave_master_detai_obj.save()

        leave_breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=leave_master_detai_obj).order_by('id').last()
        leave_breakup.available_leaves = round(
            leave_breakup.available_leaves - approved_days, 2
        )
        leave_breakup.utilized_leaves = round(
            leave_breakup.utilized_leaves + approved_days, 2
        )
        leave_breakup.save()

        leave_master = leave_master_detai_obj.leave_master
        leave_master.total_available_leaves = round(
            leave_master.total_available_leaves - approved_days, 2
        )
        leave_master.total_utilized_leaves = round(
            leave_master.total_utilized_leaves + approved_days, 2
        )
        leave_master.save()

    def _trigger_post_save_signal(self, instance, is_created,validated_data=None,previous_instance_approval_status=ApprovalModelMixin.PENDING_APPROVAL):
        """Helper method to handle post-save signal triggering"""
        # Determine dates and leave days based on status
        if is_created or instance.approval_status != 'APPROVED':
            start_date = format_date_with_day(instance.new_leave_start_date)
            end_date = format_date_with_day(instance.new_leave_end_date)
            leave_days = instance.leave_days_applied
        else:
            start_date = format_date_with_day(instance.leave_approved_start_date)
            end_date = format_date_with_day(instance.leave_approved_end_date)
            leave_days = instance.leave_approved_days

        # Prepare signal data
        signal_kwargs = {
            'sender': self.Meta.model,
            'instance': instance,
            'created': is_created,
            'update_fields': validated_data.keys() if validated_data else None,
            'raw': False,
            'request': self.context.get('request'),
            'data': {
                'start_date': start_date,
                'end_date': end_date,
                'leave_days': leave_days
            },
            'previous_instance_approval_status':previous_instance_approval_status
        }
        post_save.send(**signal_kwargs)

    def to_representation(self, instance):
        self.if_not_delegated_reviewer(instance.delegated_reviewer,self.context)
        data = super().to_representation(instance)

        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        
        if get_by_id:
                data['employee_default_object'] = dict(
                    employee_code=instance.employee_code.employee_code,
                    first_name=instance.employee_code.first_name,
                    id=instance.employee_code.id
            )

                data['home_mobile_number'] = instance.employee_code.home_mobile_number
                data['local_mobile_number'] = instance.employee_code.local_mobile_number
                data['date_of_joining'] = instance.employee_code.doj.strftime('%d-%m-%Y') if instance.employee_code.doj else None

                # Provide type_of_days and leave_type_default_object so the
                # "Create Leave Reversal" popup can auto-populate those fields.
                # Leave Applications are always Annual Leave — filter explicitly.
                # Same approach as operate_on_annual_leave / update_time_on_leave_entry.
                try:
                    leave_type_name = 'Annual Leave'
                    lmd = LeaveMasterDetails.objects.filter(
                        leave_master__employee=instance.employee_code,
                        leave_type='Annual Leave'
                    ).select_related('leave_policy_key').order_by('id').last()
                    type_of_days = (
                        lmd.leave_policy_key.type_of_days
                        if (lmd and lmd.leave_policy_key)
                        else 'Working_days'
                    )
                    leave_type_status = AttendanceStatusMaster.objects.filter(
                        status_name=leave_type_name
                    ).first()
                    data['type_of_days'] = type_of_days
                    data['leave_type_default_object'] = dict(
                        status_name=leave_type_name,
                        id=leave_type_status.id if leave_type_status else None
                    )
                    data['leave_type'] = leave_type_status.id if leave_type_status else None
                except Exception:
                    data['type_of_days'] = 'Working_days'
                    data['leave_type_default_object'] = {}
                    data['leave_type'] = None

        if instance.department is not None:
            data['department'] = instance.department.department_code
            data['department_name'] = instance.department.department_name
        # Additional department data for detailed views
            if get_by_id:
                data['department_default_object'] = dict(
                    department_name=instance.department.department_name,
                    id=instance.department.id
            )

        if instance.delegated_reviewer is not None:
            data['default_delegated_reviewer_object'] = dict(
                first_name=instance.delegated_reviewer.first_name,
                id=instance.delegated_reviewer.id
            )
        data['employee_code_code'] = f"{instance.employee_code.employee_code}"
        data['employee_name'] = f"{instance.employee_code.first_name}"
        if instance.approval_status==ApprovalModelMixin.APPROVED:
            data['approval_remarks'] = f'Approved by {instance.approval_by}'
    
        return data

    def update_ticket_master(self):
        ticket_master_obj = TicketMaster.objects.filter(employee=self.instance.employee_code).last()

        if ticket_master_obj:
            ticket_master_obj.last_ticket_availed = self.instance.ticket_period_for

            match = re.match(r'^(\d{6})-(\d{6})$', self.instance.ticket_period_for)
            if match:
                start_str, end_str = match.groups()
                start_year, start_month = int(start_str[:4]), int(start_str[4:])
                end_year, end_month = int(end_str[:4]), int(end_str[4:])

                new_start = f"{start_year + 2:04d}{start_month:02d}"
                new_end = f"{end_year + 2:04d}{end_month:02d}"
                ticket_master_obj.next_ticket_eligible_period = f"{new_start}-{new_end}"
            else:
                ticket_master_obj.next_ticket_eligible_period = ''

            ticket_master_obj.save()
            self.create_ticket_history(ticket_master_obj)

    def create_ticket_history(self, ticket_master_obj):  # Proper method
        data = {
            'ticket_master': ticket_master_obj.id,
            'availed_date': datetime.now().date(),
            'last_ticket_availed': self.instance.ticket_period_for,
            'last_ticket_eligible_month': ticket_master_obj.ticket_eligible_month,
            'last_ticket_sector': self.instance.travel_sector
        }

        detail_serializer = TicketHistoryDetailsSerializer(data=data, context=self.context)
        detail_serializer.is_valid(raise_exception=True)
        detail_instance = detail_serializer.save()
        return detail_instance

    def to_internal_value(self, data):
        date_fields = [
            'date_of_joining', 'last_leave_start_date', 'last_leave_end_date', 'return_to_work_date',
            'resumed_work_date', 'new_leave_start_date', 'new_leave_end_date', 'ticket_to_be_issued_date',
            'return_ticket_to_be_issued_date', 'leave_approved_start_date', 'leave_approved_end_date',
            'passport_expiry_date', 'visa_expiry_date', 'eid_expiry_date', 'labour_card_expiry_date',
            'job_loss_insurance_expiry_date', 'resume_duty_on', 'was_on_leave_from', 'was_on_leave_till','return_ticket_to_be_issued_date'
        ]
        for field in date_fields:
            if field in data and data[field] == '':
                data[field] = None

        integer_fields = ['total_leave_days', 'lop_days', 'leave_approved_days', 'no_of_days', 'leave_days_applied','days']
        for field in integer_fields:
            if field in data:
                if data[field] == '' or data[field] is None:
                    data[field] = 0
                else:
                    try:
                        data[field] = int(data[field])
                    except (ValueError, TypeError):
                        data[field] = 0
        if 'department' in data and data['department']:
            try:
                department_id = int(data['department'])
                data['department'] = department_id
            except ValueError:
                try:
                    department = Department.objects.get(department_code=data['department'])
                    data['department'] = department.id
                except Department.DoesNotExist:
                    raise serializers.ValidationError({'department': 'Invalid department code'})
        if 'leave_days_eligible' in data and (data['leave_days_eligible'] == '' or data['leave_days_eligible'] is None):
            data['leave_days_eligible'] = 0
        if 'is_reversal' in data:
            data['is_reversal'] = data['is_reversal'] if data['is_reversal'] != "" else False
        if 'is_passport_received' in data:
            data['is_passport_received'] = data['is_passport_received'] if data['is_passport_received'] != "" else False
        if 'leave_eligible_as_on' in data and data['leave_eligible_as_on'] == '':
            data['leave_eligible_as_on'] = None
        if 'extend_to_date' in data:
            data['extend_to_date'] = data['extend_to_date'] if data['extend_to_date'] != "" else None
        if 'lop_days_from_extension' in data:
            data['lop_days_from_extension'] = data['lop_days_from_extension'] if data['lop_days_from_extension'] != "" else 0
        return super().to_internal_value(data)

class LeavePolicyDetailSerializer(AuditModelMixinSerializer):
    class Meta:
        model = LeavePolicyDetail
        fields = ['id', 'leave_policy', 'pay_percentage', 'number_of_days']

    def to_internal_value(self, data):
        data = data.copy()
        validated_data = super().to_internal_value(data)
        return validated_data


class LeavePolicySerializer(AuditModelMixinSerializer):
    leave_policy_details = LeavePolicyDetailSerializer(many=True, required=False)
    employee = serializers.PrimaryKeyRelatedField(
        queryset=EmployeeMaster.objects.all(), required=False, allow_null=True, default=None
    )
    effective_from = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    effective_to = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)

    class Meta:
        model = LeavePolicy
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        leave_policy_details_data = validated_data.pop('leave_policy_details', [])
        # if (leave_policy_details_data):
        #     total_days = sum(detail.get('number_of_days',0) for detail in leave_policy_details_data    
        master_service = importlib.import_module('hrm_master.api.service')
        instance = super().create(validated_data)
        policy_signal = master_service.MasterSignal
        # post_save.send(sender=LeavePolicy,instance=instance,created=True,leave_policy_details_data=leave_policy_details_data,context=self.context)
        self._create_or_update_leave_policy_details(instance, leave_policy_details_data, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        leave_policy_details_data = validated_data.pop('leave_policy_details', [])    
        instance = super().update(instance, validated_data)
        self._create_or_update_leave_policy_details(instance, leave_policy_details_data, request=request)
        return instance

    def _create_or_update_leave_policy_details(self, policy_instance, details_data, **kwargs):
        detail_ids = []
        for detail_data in details_data:    
            if 'id' in detail_data and isinstance(detail_data['id'], str):
                detail_data.pop('id')
                detail_data['leave_policy'] = policy_instance.id
                detail_serializer = LeavePolicyDetailSerializer(data=detail_data, context=self.context)
                detail_serializer.is_valid(raise_exception=True)
                detail_instance = detail_serializer.create(detail_serializer.validated_data)
                detail_ids.append(detail_instance.id)
            else:
                detail_id = detail_data.get('id')
                if detail_id:
                    try:
                        detail_instance = LeavePolicyDetail.objects.get(id=detail_id)
                        detail_serializer = LeavePolicyDetailSerializer(
                            instance=detail_instance,
                            data=detail_data,
                            context=self.context
                        )
                        detail_serializer.is_valid(raise_exception=True)
                        detail_serializer.save()
                        detail_ids.append(detail_id)
                    except LeavePolicyDetail.DoesNotExist:
                        raise serializers.ValidationError("LeavePolicyDetail not found")
        self._cleanup_removed_details(policy_instance, detail_ids)

    def _cleanup_removed_details(self, policy_instance, keep_ids):
        LeavePolicyDetail.objects.filter(leave_policy=policy_instance).exclude(
            id__in=keep_ids
        ).delete()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.type_of_leave is not None:
            data['leave_typeee'] = instance.type_of_leave.status_name
        return data
    
    def to_internal_value(self, data):
        data = data.copy()
        leave_policy_details = data.pop('leave_policy_details', [])
        if 'year_to_year_carry' in data and (data['year_to_year_carry']=="" or data['year_to_year_carry'] == False):
            data['year_to_year_carry']=False
            data['carry_threshold_value'] = 0 if type(data['carry_threshold_value']) == str else data['carry_threshold_value']

        if 'min_stretch_days' in data:
            data['min_stretch_days'] = data['min_stretch_days'] if data['min_stretch_days'] not in ["", None] else 0
        if 'max_stretch_days' in data:
            data['max_stretch_days'] = data['max_stretch_days'] if data['max_stretch_days'] not in ["", None] else 0
        for field_name in ['employee_type', 'employee_group', 'employee_reporting']:
            if field_name in data and data[field_name] == "":
                data[field_name] = None
        if 'employee' in data and (data['employee'] == "" or data['employee'] is None):
            data['employee'] = None

        # Coerce empty year_month -> 'Month'
        if 'year_month' in data and data['year_month'] in ('', None):
            data['year_month'] = 'Month'
        # Coerce empty fy_start_month -> 1 (January)
        if 'fy_start_month' in data and data['fy_start_month'] in ('', None):
            data['fy_start_month'] = 1
        # Integer policy fields — empty string → 0
        for int_field in ['eligible_after_days', 'backdated_days_limit', 'require_document_after_days']:
            if int_field in data and data[int_field] in ('', None):
                data[int_field] = 0
        # Date policy fields — empty string → None
        for date_field in ['effective_from', 'effective_to']:
            if date_field in data and data[date_field] == '':
                data[date_field] = None
        # Boolean policy fields — empty string → False
        for bool_field in [
            'allow_advance_leave', 'allow_half_day',
            'require_document', 'lop_on_overstay', 'lop_on_weekly_off_after_leave',
            'prorate_on_join',
        ]:
            if bool_field in data and data[bool_field] == '':
                data[bool_field] = False
        # pay_on — default to 'gross' if empty
        if 'pay_on' in data and data['pay_on'] in ('', None):
            data['pay_on'] = 'gross'

        if not leave_policy_details:
            raise serializers.ValidationError({
                'leave_policy_details': 'At least one leave policy detail (Pay % and Number of Days) is required.'
            })
        for _detail in leave_policy_details:
            if not _detail.get('number_of_days'):
                raise serializers.ValidationError({
                    'leave_policy_details': 'Number of Days must be greater than 0 for each leave policy detail.'
                })
            if _detail.get('pay_percentage') is None:
                raise serializers.ValidationError({
                    'leave_policy_details': 'Pay % is required for each leave policy detail.'
                })

        validated_data = super().to_internal_value(data)
        validated_data['leave_policy_details'] = leave_policy_details
        return validated_data


class TicketHistoryDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = TicketHistory
        fields = '__all__'


class TicketMasterSerializer(AuditModelMixinSerializer):
    ticket_histories = TicketHistoryDetailsSerializer(many=True, required=False)

    class Meta:
        model = TicketMaster
        fields = '__all__'

    def to_internal_value(self, data):
        if 'ticket_histories' in data:
            data.pop('ticket_histories')
        validated_data = super().to_internal_value(data)
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.employee is not None:
            data['employee_code'] = instance.employee.employee_code
            data['employee_name'] = instance.employee.first_name
            data['employee_default_object'] = dict(
                employee_code=data['employee_code'],
                first_name=data['employee_name'],
                id=instance.employee.id
            )
        return data


class SalaryComponentsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = SalaryComponents
        fields = '__all__'


    def create(self, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        #print('CREATE - Final b_id:', b_id)
        if 'component' in validated_data:
            component_name = validated_data.get('component', '').strip()
            
            if component_name:
                # For CREATE - just check if component exists globally
                query = Q(component__iexact=component_name)
                
                # Check if component already exists globally
                if SalaryComponents.objects.filter(query).exists():
                    raise serializers.ValidationError({
                        'component': [f"Component '{component_name}' already exists globally."]
                    })
        
        instance = super().create(validated_data)
        self.set_default_type_if_missing(instance, b_id)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
       # print('UPDATE - Final b_id from instance:', instance.b_id)

        # Update instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        self.set_default_type_if_missing(instance, instance.b_id)
        instance.save()
        return instance


    # def update(self, instance, validated_data):
    #     request = self.context.get('request')
    #     component_name = validated_data.get('component', '').lower().strip()
    #     b_id = request.query_params.get('b_id')
    #     print('in the update method bid', b_id)

    #     for attr, value in validated_data.items():

    #         setattr(instance, attr, value)

    #     self.set_default_type_if_missing(instance, b_id)
    #     self.validate_unique_component_name(component_name, b_id, instance, request=request)
    #     instance.save()
    #     return instance

    # def validate_unique_component_name(self, component_name, b_id, instance=None, **kwargs):
    #     if SalaryComponents.objects.filter(
    #             b_id=b_id, type=instance.type, order=instance.order
    #     ).exclude(id=instance.id).exists():
    #         raise serializers.ValidationError(
    #             f"Type with name '{instance.type}' and order '{instance.order}' already exists."
    #         )
    #     # if SalaryComponents
    #     if SalaryComponents.objects.filter(
    #             component__iexact=component_name, b_id=b_id, type=instance.type
    #     ).exclude(id=instance.id).exists():
    #         raise serializers.ValidationError(
    #             f"Salary Component with name '{component_name}' already exists."
    #         )
            
    #     if SalaryComponents.objects.filter(
    #             component__iexact=component_name, b_id=b_id
    #     ).exclude(id=instance.id).exists():
    #         raise serializers.ValidationError(
    #             f"Salary Component with name '{component_name}' already exists."
    #         )
        
    #     print("Validation passed for component name:", component_name)

    def set_default_type_if_missing(self, instance, b_id):
        if not instance.order or instance.order == 0:
            last = SalaryComponents.objects.filter(
                b_id=b_id, type=instance.type
            ).order_by('-order').first()

            if last and last.order:
                instance.order = last.order + 1

class ShiftMasterSerializer(AuditModelMixinSerializer):
    # Change DateTimeField to TimeField for time-only inputs
    shift_code=serializers.CharField(required=False,allow_null=True,allow_blank=True)
    start_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'], allow_null=True, required=False)
    end_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'], allow_null=True, required=False)
    grace_period_in = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'], allow_null=True, required=False)
    grace_period_out = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'], allow_null=True, required=False)

    class Meta:
        model = ShiftMaster
        fields = '__all__'

    

    def create(self, validated_data):
        try:
            # Generate shift code before creation
            validated_data['shift_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.SHIFT_CODE)
        except Exception as e:
            raise serializers.ValidationError(
                {"shift_code": "App key: SHIFT_CODE does not exist."}
            )

        # Handle time fields - convert string times to time objects
        time_fields = ['start_time', 'end_time', 'grace_period_in', 'grace_period_out']
        for field in time_fields:
            if field in validated_data and isinstance(validated_data[field], str):
                try:
                    # Parse HH:mm format string to time object
                    from datetime import datetime
                    time_obj = datetime.strptime(validated_data[field], '%H:%M').time()
                    validated_data[field] = time_obj
                except ValueError:
                    # If parsing fails, set to None
                    validated_data[field] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle time fields during update as well
        time_fields = ['start_time', 'end_time', 'grace_period_in', 'grace_period_out']
        for field in time_fields:
            if field in validated_data and isinstance(validated_data[field], str):
                try:
                    from datetime import datetime
                    time_obj = datetime.strptime(validated_data[field], '%H:%M').time()
                    validated_data[field] = time_obj
                except ValueError:
                    validated_data[field] = None

        return super().update(instance, validated_data)

    def to_internal_value(self, data):
        from django.utils import timezone
        import pytz
        
        # Handle empty strings for time fields
        time_fields = ['start_time', 'end_time', 'grace_period_in', 'grace_period_out', 'max_ot']
        for field in time_fields:
            if field in data:
                value = data[field]
                if value == "" or value is None:
                    data[field] = None
                else:
                    # Handle both ISO datetime strings and pure time strings
                    if isinstance(value, str):
                        try:
                            # Try parsing as full ISO datetime (e.g., "2025-09-22T11:20:00.000Z")
                            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            # Convert to Dubai timezone
                            dubai_tz = pytz.timezone('Asia/Dubai')
                            dt_dubai = dt.astimezone(dubai_tz)
                            data[field] = dt_dubai.time()  # Extract time part
                        except ValueError:
                            try:
                                # Try parsing as pure time (e.g., "11:20")
                                # Assume time is in Dubai timezone
                                time_obj = datetime.strptime(value, '%H:%M').time()
                                data[field] = time_obj
                            except ValueError:
                                # If all parsing fails, set to None to let validation handle it
                                data[field] = None

        # Handle other fields
        if 'ot_multiplier' in data and data['ot_multiplier'] in ["", None]:
            data['ot_multiplier'] = 1.0
        if 'ot_rounding' in data and data['ot_rounding'] in ["", None," "]:
            data['ot_rounding'] = None
        if 'is_cross_midnight' in data and data['is_cross_midnight'] in ["", None]:
            data['is_cross_midnight'] = False
        if 'status' in data and data['status'] in ["", None]:
            data['status'] = 'active'

        return super().to_internal_value(data)
    
    def to_representation(self, instance):
        """
        Convert outgoing data (Python time objects) into strings (HH:MM) for the frontend.
        This is called AFTER the instance is fetched from the DB.
        """
        representation = super().to_representation(instance)

        # Convert time objects to 'HH:MM' strings for the frontend
        time_fields = ['start_time', 'end_time', 'grace_period_in', 'grace_period_out', 'max_ot']
        for field in time_fields:
            value = getattr(instance, field, None)
            if value is not None:
                representation[field] = value.strftime('%H:%M')
            else:
                representation[field] = ""
                

        # ADD THIS PART - Format duration field as HH:MM
        duration_value = getattr(instance, 'duration', None)
        if duration_value is not None:
            total_seconds = int(duration_value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            representation['duration'] = f"{hours:02d}:{minutes:02d}"
        else:
            representation['duration'] = ""

        return representation


class LeaveReversalRequestSerializer(ApprovalModelMixinSerializer,AuditModelMixinSerializer):
    reverse_from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    reverse_to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    class Meta:
        model = LeaveReversalRequest
        fields = '__all__'


    def validate(self, data):
        rf = data.get('reverse_from_date')
        rt = data.get('reverse_to_date')
        le = data.get('leave_entry')
        la = data.get('leave_application')

        # Must have dates
        if not rf or not rt:
            raise serializers.ValidationError("Provide both reversal dates.")

        # Must be in correct order
        if rf > rt:
            raise serializers.ValidationError("From date must be before to date.")

        # Must be within original leave
        if le and (rf < le.from_date or rt > le.to_date):
            raise serializers.ValidationError("Reversal dates must be within original leave.")

        if la and (rf < la.new_leave_start_date or rt > la.new_leave_end_date):
            raise serializers.ValidationError("Reversal dates must be within applied leave.")

        return super().validate(data)

    def create(self, validated_data):
        request = self.context.get('request')
        user = self.context.get('request').user
        self.validate_whether_same_user(validated_data['employee'], self.context)
        self.if_not_delegated_reviewer(validated_data['delegated_reviewer'], self.context)
        master_service = importlib.import_module('hrm_master.api.service')
        leave_entry_signal = master_service.MasterSignal
        leave_entry_signal.validate_reversal_dates(validated_data['reverse_from_date'], validated_data['reverse_to_date'])
        leave_entry_signal.validate_reversal_duplicate_dates(validated_data['employee'], validated_data['reverse_from_date'],
                                                    validated_data['reverse_to_date'])
        instance = super().create(validated_data)
        self.update_next_stage(instance, user)
        self._trigger_post_save_signal(instance, is_created=True)
        if instance.approval_status == ApprovalModelMixin.APPROVED:
            self.update_revert_leave_balances(instance)

        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # Capture status BEFORE super().update() so we know if approval is new this call
        prev_approval_status = instance.approval_status
        instance = super().update(instance, validated_data)
        if 'delegated_reviewer' in validated_data:
            instance.delegated_reviewer = validated_data.get('delegated_reviewer')
            self.if_not_delegated_reviewer(instance.delegated_reviewer, self.context)
            instance.save(update_fields=['delegated_reviewer'])
        # Refresh from DB — the multi-stage approval system saves directly via
        # self.instance.save() inside _finalize_instance, so the local variable
        # may still hold the pre-approval status.
        instance.refresh_from_db()
        just_approved = (
            prev_approval_status != ApprovalModelMixin.APPROVED
            and instance.approval_status == ApprovalModelMixin.APPROVED
        )
        if just_approved:
            # Use instance fields as fallback when keys absent from partial update payload
            leave_entry_ref = validated_data.get('leave_entry', instance.leave_entry)
            leave_app_ref   = validated_data.get('leave_application', instance.leave_application)
            reverse_days    = instance.reverse_no_of_days
            try:
                if leave_entry_ref is not None:
                    leave_entry = LeaveEntry.objects.get(id=leave_entry_ref.id)
                    if leave_entry.balance_no_of_days == 0:
                        raise serializers.ValidationError("Leave balance is already zero — reversal not allowed.")
                    if leave_entry.balance_no_of_days - reverse_days < 0:
                        raise serializers.ValidationError("Insufficient leave balance: reversal exceeds current balance.")
                    leave_entry.balance_no_of_days -= reverse_days
                    leave_entry.save()
                    self.update_revert_leave_balances(instance)
                elif leave_app_ref is not None:
                    leave_app = LeaveApplication.objects.get(id=leave_app_ref.id)
                    if leave_app.balance_no_of_days == 0:
                        raise serializers.ValidationError("Leave balance is already zero — reversal not allowed.")
                    if leave_app.balance_no_of_days - reverse_days < 0:
                        raise serializers.ValidationError(
                            "Insufficient leave balance: reversal exceeds current balance.")
                    leave_app.balance_no_of_days -= reverse_days
                    leave_app.save()
                    self.operate_on_annual_leave(instance)

            except LeaveEntry.DoesNotExist:
                raise serializers.ValidationError("Leave entry not found.")
            except LeaveApplication.DoesNotExist:
                raise serializers.ValidationError("Leave application not found.")

            # Re-run device attendance after the transaction commits so the
            # approved reversal row is visible to _bulk_fetch_leave_reversals.
            start_str  = instance.reverse_from_date.strftime('%Y-%m-%d')
            end_str    = instance.reverse_to_date.strftime('%Y-%m-%d')
            emp_code   = instance.employee.employee_code

            def _run_device_attendance():
                try:
                    from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
                    transfer_attendance_details(
                        start_date=start_str,
                        end_date=end_str,
                        employee_codes=[emp_code],
                    )
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"[REVERSAL] transfer_attendance_details failed: {e}")

            from django.db import transaction
            transaction.on_commit(_run_device_attendance)

        self._trigger_post_save_signal(instance, is_created=False, validated_data=validated_data)
        return instance
    def update_revert_leave_balances(self, instance):
        # Resolve leave type name from whichever source is set
        if instance.leave_entry is not None:
            leave_type_name = instance.leave_entry.leave_type.status_name
        elif instance.leave_application is not None:
            leave_type_name = 'Annual Leave'
        else:
            return  # nothing to reverse against

        leave_detail = LeaveMasterDetails.objects.filter(
            leave_master__employee=instance.employee,
            leave_type=leave_type_name
        ).order_by('id').last()

        if not leave_detail:
            return

        leave_detail.available_leaves = round(leave_detail.available_leaves + instance.reverse_no_of_days, 2)

        if leave_detail.leave_policy_key.year_to_year_carry:
            carry_forward_cap=leave_detail.leave_policy_key.carry_threshold_value
            if leave_detail.available_leaves > carry_forward_cap:
                leave_detail.carry_forward_days = carry_forward_cap
                leave_detail.lapse_days = round(leave_detail.available_leaves - carry_forward_cap,2)
            else:
                leave_detail.carry_forward_days = leave_detail.available_leaves
                leave_detail.lapse_days =0.0

        leave_detail.utilized_leaves = round(leave_detail.utilized_leaves - instance.reverse_no_of_days, 2)
        leave_detail.save()

        leave_breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=leave_detail).order_by('id').last()
        if leave_breakup:
            leave_breakup.available_leaves = round(leave_breakup.available_leaves + instance.reverse_no_of_days, 2)
            leave_breakup.utilized_leaves = round(leave_breakup.utilized_leaves - instance.reverse_no_of_days, 2)
            leave_breakup.save()

        LeaveMaster.objects.filter(pk=leave_detail.leave_master.pk).update(
            total_available_leaves=F('total_available_leaves') + round(instance.reverse_no_of_days, 2),
            total_utilized_leaves=F('total_utilized_leaves') - round(instance.reverse_no_of_days, 2)
        )


    def validate_whether_same_user(self,employee,context):
        user=self.context.get('request').user
        # print("employee.user == user",employee.user == user)
        if employee.user == user:
            perms_to_remove = [
                'custom_approval_stage_approver',
                'custom_approval_stage_secondary_approver'
                'custom_approval_stage_HR',
            ]
            permissions_add = [
                'custom_approval_stage_requester',
            ]
            remove_permissions(context,perms_to_remove)
            add_permissions(context,permissions_add)

    def if_not_delegated_reviewer(self,delegated_reviewer,context):

        if not delegated_reviewer or delegated_reviewer != self.context.get('request').user:
            perms_to_remove = [
                'custom_approval_stage_secondary_approver'
            ]
            remove_permissions( context, perms_to_remove)

    def update_next_stage(self,instance,user):
        approval_stages_object = instance.approval_stages.last()
        if approval_stages_object.stage_name == 'Requester':
            approval_stages_object.approval_status = 'APPROVED'
            approval_stages_object.approval_date = timezone.now().date()
            approval_stages_object.approved_user = user
            approval_stages_object.approval_by = user.first_name
            approval_stages_object.modified_date = timezone.now()
            approval_stages_object.save()
            approval_model = instance.approval_stages.model
            approval_model.objects.create(
                related_object=instance,
                stage_name='Hr',
                approval_status='PENDING_APPROVAL',
                order=2,
                permission_code='custom_approval_stage_HR',
                created_user_id=user.id
            )
            instance.approval_remarks = 'Pending with HR'
            instance.save()

    def _trigger_post_save_signal(self, instance, is_created, validated_data=None):
        """Helper method to handle post-save signal triggering"""
        # Determine dates and leave days based on status
        if is_created or instance.approval_status != 'APPROVED':
            start_date = format_date_with_day(instance.reverse_from_date)
            end_date = format_date_with_day(instance.reverse_to_date)
            leave_days = instance.reverse_no_of_days
        else:
            start_date = format_date_with_day(instance.reverse_from_date)
            end_date = format_date_with_day(instance.reverse_to_date)
            leave_days = instance.reverse_no_of_days

        # Prepare signal data
        signal_kwargs = {
            'sender': LeaveReversalRequest,
            'instance': instance,
            'created': is_created,
            'update_fields': validated_data.keys() if validated_data else None,
            'raw': False,
            'request': self.context.get('request'),
            'data': {
                'start_date': start_date,
                'end_date': end_date,
                'leave_days': leave_days
            }
        }
        # print("signal_kwargs",signal_kwargs)
        post_save.send(**signal_kwargs)

    def operate_on_annual_leave(self,instance):
        leave_master_detai_obj = LeaveMasterDetails.objects.filter(
            leave_master__employee=self.instance.employee,
            leave_type='Annual Leave'
        ).order_by('id').last()

        approved_days = instance.reverse_no_of_days
        leave_master_detai_obj.available_leaves = round(
            leave_master_detai_obj.available_leaves + approved_days, 2
        )

        if leave_master_detai_obj.leave_policy_key.year_to_year_carry:
            carry_forward_cap=leave_master_detai_obj.leave_policy_key.carry_threshold_value
            if leave_master_detai_obj.available_leaves > carry_forward_cap:
                leave_master_detai_obj.carry_forward_days = carry_forward_cap
                leave_master_detai_obj.lapse_days = round(leave_master_detai_obj.available_leaves - carry_forward_cap,2)
            else:
                leave_master_detai_obj.carry_forward_days = leave_master_detai_obj.available_leaves
                leave_master_detai_obj.lapse_days =0.0

        leave_master_detai_obj.utilized_leaves = round(
            leave_master_detai_obj.utilized_leaves - approved_days, 2
        )
        leave_master_detai_obj.save()

        leave_breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=leave_master_detai_obj).order_by('id').last()
        leave_breakup.available_leaves = round(
            leave_breakup.available_leaves + approved_days, 2
        )
        leave_breakup.utilized_leaves = round(
            leave_breakup.utilized_leaves - approved_days, 2
        )
        leave_breakup.save()

        leave_master = leave_master_detai_obj.leave_master
        leave_master.total_available_leaves = round(
            leave_master.total_available_leaves + approved_days, 2
        )
        leave_master.total_utilized_leaves = round(
            leave_master.total_utilized_leaves - approved_days, 2
        )
        leave_master.save()

    def to_representation(self, instance):
        self.validate_whether_same_user(instance.employee,self.context)
        self.if_not_delegated_reviewer(instance.delegated_reviewer,self.context)
        data = super().to_representation(instance)
        if instance.employee is not None:
            data['employee_default_object'] = dict(
                first_name=instance.employee.first_name,
                employee_code=instance.employee.employee_code,
                id=instance.employee.id,
                designation_name=instance.employee.designation.designation_name
            )
            data['last_name'] = instance.employee.last_name
            data['first_name'] = instance.employee.first_name
            data['employee_code'] = instance.employee.employee_code
            data['weekly_off'] = instance.employee.weekly_off
            
        if instance.leave_entry is not None:
            if instance.leave_entry.leave_type is not None:
                data['leave_type_default_object'] = dict(
                    status_name=instance.leave_entry.leave_type.status_name,
                    id=instance.leave_entry.leave_type.id
                )
                data['leave_type'] = instance.leave_entry.leave_type.id
                data['leave_types'] = instance.leave_entry.leave_type.status_name
        # if instance.delegated_reviewer is not None:
        #     data['default_delegated_reviewer_obj'] = dict(
        #         first_name=instance.delegated_reviewer.first_name,
        #         id=instance.delegated_reviewer.id
        #     )
        # else:
        #     # print("employee",instance.employee.first_reporting_authority)
        #     data['default_delegated_reviewer_obj'] = dict(
        #         first_name=instance.employee.first_reporting_authority.first_name,
        #         id=instance.employee.first_reporting_authority.id
        #     )
        #     data['delegated_reviewer']=instance.employee.first_reporting_authority.id

        # secondary apporaval null fix                 
        if instance.delegated_reviewer is not None:
            data['default_delegated_reviewer_obj'] = dict(
                first_name=instance.delegated_reviewer.first_name,
                id=instance.delegated_reviewer.id
            )

        elif instance.employee is not None and instance.employee.first_reporting_authority is not None:
            data['default_delegated_reviewer_obj'] = dict(
                first_name=instance.employee.first_reporting_authority.first_name,
                id=instance.employee.first_reporting_authority.id
            )
            data['delegated_reviewer'] = instance.employee.first_reporting_authority.id

        else:
            data['default_delegated_reviewer_obj'] = {}
            data['delegated_reviewer'] = None
        
        if instance.initiator_reviewer is not None:
            data['default_initiator_reviewer_obj'] = dict(
                first_name=instance.initiator_reviewer.first_name,
                id=instance.initiator_reviewer.id
            )
        if instance.leave_entry is not None:
            data['travel_or_leave'] = instance.leave_entry.travel_or_leave
            data['type_of_days'] = instance.leave_entry.type_of_days
            data['from_date'] = instance.leave_entry.from_date.strftime(
                '%d-%m-%Y') if instance.leave_entry.from_date else None
            data['to_date'] = instance.leave_entry.to_date.strftime(
                '%d-%m-%Y') if instance.leave_entry.to_date else None

            data['no_of_days'] = instance.leave_entry.no_of_days
            data['balance_no_of_days'] = instance.leave_entry.balance_no_of_days
            data['condition'] = instance.leave_entry.condition
            data['reason'] = instance.leave_entry.reason
        if instance.leave_application is not None:
            # Leave Applications are always Annual Leave.
            # Resolve type_of_days from the employee's Annual Leave policy record.
            leave_type_name = 'Annual Leave'
            lmd = LeaveMasterDetails.objects.filter(
                leave_master__employee=instance.employee,
                leave_type='Annual Leave'
            ).select_related('leave_policy_key').order_by('id').last()
            type_of_days = (
                lmd.leave_policy_key.type_of_days
                if (lmd and lmd.leave_policy_key)
                else 'Working_days'
            )
            leave_type_status = AttendanceStatusMaster.objects.filter(
                status_name=leave_type_name
            ).first()
            data['travel_or_leave'] = 'Leave'
            data['type_of_days'] = type_of_days
            data['leave_type_default_object'] = dict(
                status_name=leave_type_name,
                id=leave_type_status.id if leave_type_status else None
            )
            data['leave_type'] = leave_type_status.id if leave_type_status else None
            data['leave_types'] = leave_type_name
            data['from_date'] = instance.leave_application.new_leave_start_date.strftime(
                '%d-%m-%Y') if instance.leave_application.new_leave_start_date else None
            data['to_date'] = instance.leave_application.new_leave_end_date.strftime(
                '%d-%m-%Y') if instance.leave_application.new_leave_end_date else None
            data['no_of_days'] = instance.leave_application.no_of_days
            data['balance_no_of_days'] = instance.leave_application.balance_no_of_days
            data['condition'] = 'Full Day'
            data['reason'] = instance.leave_application.note

        if instance.approval_status == ApprovalModelMixin.APPROVED:
            data['approval_remarks'] = f'Approved by {instance.approval_by}'

        return data
    def to_internal_value(self, data):
        if 'reverse_from_date' in data:
            data['reverse_from_date'] = data['reverse_from_date'] if data['reverse_from_date'] != "" else None
        if 'reverse_to_date' in data:
            data['reverse_to_date'] = data['reverse_to_date'] if data['reverse_to_date'] != "" else None
        validated_data = super().to_internal_value(data)
        return validated_data


class LeaveExtensionSerializer(AuditModelMixinSerializer):
    extended_to_date = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y', '%Y-%m-%d', 'iso-8601'],
        allow_null=True, required=False
    )
    lop_days = serializers.FloatField(default=0, allow_null=True, required=False)
    extension_days = serializers.FloatField(default=0, allow_null=True, required=False)

    def to_internal_value(self, data):
        # Coerce empty string to 0 for numeric fields before DRF field-level validation
        for field in ('lop_days', 'extension_days'):
            if field in data and (data[field] == '' or data[field] is None):
                data[field] = 0
        if 'allow_beyond_eligible' in data:
            data['allow_beyond_eligible'] = data['allow_beyond_eligible'] if data['allow_beyond_eligible'] != "" else False
        if 'is_paid_beyond' in data:
            data['is_paid_beyond'] = data['is_paid_beyond'] if data['is_paid_beyond'] != "" else False
        return super().to_internal_value(data)

    # Read-only display fields populated in to_representation
    employee_name = serializers.SerializerMethodField(read_only=True)
    employee_code = serializers.SerializerMethodField(read_only=True)
    leave_type = serializers.SerializerMethodField(read_only=True)
    current_end_date = serializers.SerializerMethodField(read_only=True)
    available_leaves = serializers.SerializerMethodField(read_only=True)

    class Meta:
        from hrm_master.models import LeaveExtension
        model = LeaveExtension
        fields = '__all__'

    def get_employee_name(self, obj):
        try:
            return obj.employee.first_name if obj.employee else None
        except Exception:
            return None

    def get_employee_code(self, obj):
        try:
            return obj.employee.employee_code if obj.employee else None
        except Exception:
            return None

    def get_leave_type(self, obj):
        """Return leave type name from the parent leave application or leave entry."""
        try:
            if obj.leave_application:
                return 'Annual Leave'
            elif obj.leave_entry:
                lt = obj.leave_entry.leave_type
                return lt.status_name if lt else None
        except Exception:
            pass
        return None

    def get_current_end_date(self, obj):
        """Return the parent leave's current end date for display."""
        try:
            if obj.leave_application:
                d = obj.leave_application.leave_approved_end_date or obj.leave_application.new_leave_end_date
            elif obj.leave_entry:
                d = obj.leave_entry.to_date
            else:
                return None
            return d.strftime('%d-%m-%Y') if d else None
        except Exception:
            return None

    def get_available_leaves(self, obj):
        """Return current available leave balance for the employee based on the actual leave type."""
        try:
            emp = obj.employee
            if not emp:
                return None
            # Resolve leave type name from parent leave
            leave_type_name = None
            if obj.leave_application:
                leave_type_name = 'Annual Leave'
            elif obj.leave_entry and obj.leave_entry.leave_type:
                leave_type_name = obj.leave_entry.leave_type.status_name
            if not leave_type_name:
                return None
            lmd = LeaveMasterDetails.objects.filter(
                leave_master__employee=emp,
                leave_type=leave_type_name,
            ).order_by('id').last()
            return float(lmd.available_leaves) if lmd and lmd.available_leaves is not None else 0
        except Exception:
            return None

    def validate(self, data):
        # Coerce empty/null numeric fields to safe defaults
        for field in ('lop_days', 'extension_days'):
            if field in data and (data[field] is None or data[field] == ''):
                data[field] = 0

        la = data.get('leave_application') or (self.instance.leave_application if self.instance else None)
        le = data.get('leave_entry') or (self.instance.leave_entry if self.instance else None)
        ext_date = data.get('extended_to_date')

        if not la and not le:
            raise serializers.ValidationError("Either leave_application or leave_entry must be provided.")
        if la and le:
            raise serializers.ValidationError("Provide only one of leave_application or leave_entry, not both.")
        if ext_date:
            if la:
                current_end = la.leave_approved_end_date or la.new_leave_end_date
                if current_end and ext_date <= current_end:
                    raise serializers.ValidationError(
                        f"extended_to_date ({ext_date}) must be after the current leave end date ({current_end})."
                    )
            if le:
                current_end = le.to_date
                if current_end and ext_date <= current_end:
                    raise serializers.ValidationError(
                        f"extended_to_date ({ext_date}) must be after the current leave end date ({current_end})."
                    )
        return super().validate(data)

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        la = validated_data.get('leave_application')
        le = validated_data.get('leave_entry')
        ext_date = validated_data.get('extended_to_date')

        # Compute extension_days
        if ext_date:
            if la:
                current_end = la.leave_approved_end_date or la.new_leave_end_date
            elif le:
                current_end = le.to_date
            else:
                current_end = None
            if current_end:
                validated_data['extension_days'] = (ext_date - current_end).days

        # Auto-populate employee from parent leave
        if not validated_data.get('employee'):
            if la:
                validated_data['employee'] = la.employee_code
            elif le:
                validated_data['employee'] = le.employee

        instance = super().create(validated_data)
        # Apply only if already approved on creation (superuser direct approval)
        if instance.approval_status == ApprovalModelMixin.APPROVED:
            self._apply_extension(instance, request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        prev_status = instance.approval_status
        instance = super().update(instance, validated_data)
        instance.refresh_from_db()
        # Apply only when transitioning to APPROVED
        if prev_status != ApprovalModelMixin.APPROVED and instance.approval_status == ApprovalModelMixin.APPROVED:
            self._apply_extension(instance, request)
        return instance

    def _apply_extension(self, instance, request):
        """On approval: update parent leave end date + attendance records."""
        try:
            ext_date = instance.extended_to_date
            allow_beyond = instance.allow_beyond_eligible
            is_paid_beyond = instance.is_paid_beyond  # True = Paid (no LOP), False = Unpaid (mark LOP)

            if instance.leave_application:
                self._apply_extension_to_application(instance, request, ext_date, allow_beyond, is_paid_beyond=is_paid_beyond)
            elif instance.leave_entry:
                self._apply_extension_to_entry(instance, request, ext_date, allow_beyond, is_paid_beyond=is_paid_beyond)
        except Exception as e:
            import traceback
            print(f"[LeaveExtension] _apply_extension error: {e}\n{traceback.format_exc()}")

    def _apply_extension_to_application(self, instance, request, ext_date, allow_beyond, is_paid_beyond=False):
        from datetime import date as _date, timedelta as _td
        from django.db import transaction
        la = instance.leave_application
        old_end = la.leave_approved_end_date or la.new_leave_end_date
        emp = la.employee_code
        b_id = la.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')

        # When is_paid_beyond=True, skip all LOP marking — fully paid extension
        if allow_beyond and is_paid_beyond:
            print(f"[LeaveExtension] is_paid_beyond=True — skipping LOP, treating as fully paid extension")
            allow_beyond = False  # reuse standard deduction path

        # Snapshot available balance BEFORE any deductions (needed for LOP calculation)
        pre_available = None
        if allow_beyond:
            try:
                snap = LeaveMasterDetails.objects.filter(
                    leave_master__employee=emp,
                    leave_type='Annual Leave',
                ).order_by('id').last()
                pre_available = float(getattr(snap, 'available_leaves', 0) or 0)
            except Exception:
                pass

        # 1. Update parent LeaveApplication dates + days
        start = la.leave_approved_start_date or la.new_leave_start_date
        total_days = (ext_date - start).days + 1 if start else la.leave_approved_days

        la.leave_approved_end_date = ext_date
        la.new_leave_end_date = ext_date
        la.was_on_leave_till = ext_date
        la.leave_approved_days = total_days
        la.leave_days_applied = total_days
        la.no_of_days = total_days
        la.balance_no_of_days = total_days
        la.save(update_fields=[
            'leave_approved_end_date', 'new_leave_end_date', 'was_on_leave_till',
            'leave_approved_days', 'leave_days_applied', 'no_of_days', 'balance_no_of_days'
        ])

        # 3. Standard extension: deduct balance synchronously (no LOP)
        if not allow_beyond:
            ext_days = (ext_date - old_end).days if old_end else 0
            if ext_days > 0:
                self._deduct_leave_balance(emp, ext_days)

        # 4. Transfer attendance via device task for the extended range only, via on_commit.
        #    from_date = old_end + 1 (newly added days only)
        #    to_date   = min(ext_date, today) — no point reprocessing future dates
        #    For allow_beyond: _apply_lop_for_application runs AFTER transfer (inside the callback)
        #    so transfer marks Annual Leave first, then LOP overwrites excess days → correct ordering.
        if old_end:
            transfer_start = old_end + _td(days=1)
            transfer_end = min(ext_date, _date.today())
            if transfer_start <= transfer_end:
                emp_code = emp.employee_code
                start_str = transfer_start.strftime('%Y-%m-%d')
                end_str = transfer_end.strftime('%Y-%m-%d')

                # Capture references for closure (avoid late-binding issues)
                _instance = instance
                _la = la
                _emp = emp
                _b_id = b_id
                _pre_available = pre_available
                _allow_beyond = allow_beyond
                _ext_from_date = transfer_start   # old_end + 1 — only process extension days for LOP

                def _run_transfer():
                    try:
                        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
                        transfer_attendance_details(
                            start_date=start_str,
                            end_date=end_str,
                            employee_codes=[emp_code],
                        )
                        print(f"[LeaveExtension] transfer_attendance_details done: emp={emp_code}, {start_str}→{end_str}")
                    except Exception as e:
                        import traceback
                        print(f"[LeaveExtension] transfer_attendance_details error: {e}\n{traceback.format_exc()}")

                    # Apply LOP AFTER transfer so Annual Leave is already set on those rows.
                    # Pass ext_from_date = old_end+1 so only extension days are walked —
                    # original leave days are untouched (already correctly set at approval time).
                    if _allow_beyond:
                        try:
                            self._apply_lop_for_application(_instance, _la, _emp, _b_id, _pre_available, ext_from_date=_ext_from_date)
                        except Exception as e:
                            import traceback
                            print(f"[LeaveExtension] _apply_lop_for_application error (post-transfer): {e}\n{traceback.format_exc()}")

                transaction.on_commit(_run_transfer)
            else:
                # Extended range is entirely in the future — no attendance to transfer yet,
                # but still apply LOP synchronously for the extension range only.
                if allow_beyond:
                    self._apply_lop_for_application(instance, la, emp, b_id, pre_available, ext_from_date=transfer_start)
        else:
            # No old_end — fallback: walk from leave start (first extension ever, no prior end)
            if allow_beyond:
                self._apply_lop_for_application(instance, la, emp, b_id, pre_available)

        print(f"[LeaveExtension] Applied extension to LeaveApplication {la.id}: end={ext_date}, days={total_days}")

    def _apply_extension_to_entry(self, instance, request, ext_date, allow_beyond, is_paid_beyond=False):
        from datetime import date as _date, timedelta as _td
        from django.db import transaction
        le = instance.leave_entry
        old_end = le.to_date
        emp = le.employee
        b_id = le.b_id or getattr(request, 'b_id', None) or request.query_params.get('b_id')

        # When is_paid_beyond=True, skip all LOP marking — fully paid extension
        if allow_beyond and is_paid_beyond:
            print(f"[LeaveExtension] is_paid_beyond=True — skipping LOP, treating as fully paid extension")
            allow_beyond = False  # reuse standard deduction path

        pre_available = None
        if allow_beyond:
            try:
                snap = LeaveMasterDetails.objects.filter(
                    leave_master__employee=emp,
                    leave_type=le.leave_type.status_name if le.leave_type else 'Annual Leave',
                    b_id=b_id,
                ).order_by('id').last()
                pre_available = float(getattr(snap, 'available_leaves', 0) or 0)
            except Exception:
                pass

        # 1. Update LeaveEntry dates + days
        total_days = (ext_date - le.from_date).days + 1 if le.from_date else le.no_of_days
        le.to_date = ext_date
        le.no_of_days = total_days
        le.balance_no_of_days = total_days
        le.save(update_fields=['to_date', 'no_of_days', 'balance_no_of_days'])

        # 2. Standard: deduct balance synchronously
        if not allow_beyond:
            ext_days = (ext_date - old_end).days if old_end else 0
            if ext_days > 0:
                self._deduct_leave_balance_entry(le, ext_days)

        # 3. Transfer attendance via device task for the extended range only, via on_commit.
        #    For allow_beyond: _apply_lop_for_entry runs AFTER transfer inside the callback.
        if old_end:
            transfer_start = old_end + _td(days=1)
            transfer_end = min(ext_date, _date.today())
            if transfer_start <= transfer_end:
                emp_code = emp.employee_code
                start_str = transfer_start.strftime('%Y-%m-%d')
                end_str = transfer_end.strftime('%Y-%m-%d')

                _instance = instance
                _le = le
                _emp = emp
                _b_id = b_id
                _pre_available = pre_available
                _allow_beyond = allow_beyond
                _ext_from_date = transfer_start   # old_end + 1 — only process extension days for LOP

                def _run_transfer_entry():
                    try:
                        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
                        transfer_attendance_details(
                            start_date=start_str,
                            end_date=end_str,
                            employee_codes=[emp_code],
                        )
                        print(f"[LeaveExtension] transfer_attendance_details (entry) done: emp={emp_code}, {start_str}→{end_str}")
                    except Exception as e:
                        import traceback
                        print(f"[LeaveExtension] transfer_attendance_details (entry) error: {e}\n{traceback.format_exc()}")

                    if _allow_beyond:
                        try:
                            self._apply_lop_for_entry(_instance, _le, _emp, _b_id, _pre_available, ext_from_date=_ext_from_date)
                        except Exception as e:
                            import traceback
                            print(f"[LeaveExtension] _apply_lop_for_entry error (post-transfer): {e}\n{traceback.format_exc()}")

                transaction.on_commit(_run_transfer_entry)
            else:
                # Future range — apply LOP synchronously for extension days only
                if allow_beyond:
                    self._apply_lop_for_entry(instance, le, emp, b_id, pre_available, ext_from_date=transfer_start)
        else:
            if allow_beyond:
                self._apply_lop_for_entry(instance, le, emp, b_id, pre_available)

        print(f"[LeaveExtension] Applied extension to LeaveEntry {le.id}: end={ext_date}, days={total_days}")

    # NOTE: _update_attendance_for_application and _update_attendance_for_entry are superseded
    # by transfer_attendance_details (device attendance task) called via transaction.on_commit.
    # Kept here commented out for reference only.

    # def _update_attendance_for_application(self, la, request, from_date_override=None):
    #     """Mark attendance records as Annual Leave for the extended date range only."""
    #     ... (replaced by transfer_attendance_details in _apply_extension_to_application)

    # def _update_attendance_for_entry(self, le, request):
    #     """Mark attendance records as leave status for full leave span."""
    #     ... (replaced by transfer_attendance_details in _apply_extension_to_entry)

    def _apply_lop_for_application(self, ext_instance, la, emp, b_id, pre_available, ext_from_date=None):
        """Mark LOP attendance for beyond-eligible extension days only.

        Walks only the EXTENSION range (ext_from_date → la.leave_approved_end_date).
        pre_available is the balance at extension time — all of it applies to extension days.
        Original leave days are untouched (already correctly set during initial approval).
        """
        try:
            from datetime import timedelta as _td
            # Only process the newly extended days, not the full original leave span.
            # ext_from_date = old_end + 1 (first day of extension)
            from_date = ext_from_date or (la.leave_approved_start_date or la.new_leave_start_date)
            to_date = la.leave_approved_end_date
            if not from_date or not to_date:
                return
            available = float(pre_available) if pre_available is not None else 0.0
            status_code = str(AttendanceStatusMaster.objects.filter(status_name='Annual Leave').first().code)
            SKIP = {'17', '5', '11', '18', '19'}
            att_records = list(AttendanceDetails.objects.filter(
                employee_code=emp.employee_code, b_id=b_id,
                date__range=[from_date, to_date],
            ).order_by('date'))
            att_by_date = {a.date: a for a in att_records}
            total_days = (to_date - from_date).days + 1
            skipped = sum(1 for a in att_records if a.status in SKIP)
            chargeable = total_days - skipped
            true_lop = max(0, chargeable - int(available))
            lop_ids = []
            covered = 0.0
            cur = from_date
            while cur <= to_date:
                att = att_by_date.get(cur)
                if att and att.status in SKIP:
                    cur += _td(days=1)
                    continue
                if covered < available:
                    covered += 1
                    if att and att.status != status_code:
                        att.status = status_code
                        att.save(update_fields=['status'])
                else:
                    if att:
                        att.status = '22'
                        att.save(update_fields=['status'])
                        lop_ids.append(att.id)
                cur += _td(days=1)
            ext_instance.extension_lop_attendance_ids = lop_ids
            ext_instance.save(update_fields=['extension_lop_attendance_ids'])
            # Deduct only the paid (non-LOP) extension days from balance
            ext_total = (to_date - from_date).days + 1
            paid = max(0, ext_total - true_lop)
            if paid > 0:
                self._deduct_leave_balance(emp, paid)
            print(f"[LeaveExtension] LOP applied (extension only from {from_date}): chargeable={chargeable}, available={available}, lop={true_lop}, paid={paid}")
        except Exception as e:
            import traceback
            print(f"[LeaveExtension] _apply_lop_for_application error: {e}\n{traceback.format_exc()}")

    def _apply_lop_for_entry(self, ext_instance, le, emp, b_id, pre_available, ext_from_date=None):
        """Mark LOP attendance for beyond-eligible extension days only.

        Walks only the EXTENSION range (ext_from_date → le.to_date).
        pre_available is the balance at extension time — all of it applies to extension days.
        Original leave days are untouched (already correctly set during initial approval).
        """
        try:
            from datetime import timedelta as _td
            from_date = ext_from_date or le.from_date
            to_date = le.to_date
            if not from_date or not to_date:
                return
            available = float(pre_available) if pre_available is not None else 0.0
            leave_status_code = str(le.leave_type.code) if le.leave_type else None
            SKIP = {'17', '5', '11', '18', '19'}
            att_records = list(AttendanceDetails.objects.filter(
                employee_code=emp.employee_code, b_id=b_id,
                date__range=[from_date, to_date],
            ).order_by('date'))
            att_by_date = {a.date: a for a in att_records}
            total_days = (to_date - from_date).days + 1
            skipped = sum(1 for a in att_records if a.status in SKIP)
            chargeable = total_days - skipped
            true_lop = max(0, chargeable - int(available))
            lop_ids = []
            covered = 0.0
            cur = from_date
            while cur <= to_date:
                att = att_by_date.get(cur)
                if att and att.status in SKIP:
                    cur += _td(days=1)
                    continue
                if covered < available:
                    covered += 1
                    if att and leave_status_code and att.status != leave_status_code:
                        att.status = leave_status_code
                        att.save(update_fields=['status'])
                else:
                    if att:
                        att.status = '22'
                        att.save(update_fields=['status'])
                        lop_ids.append(att.id)
                cur += _td(days=1)
            ext_instance.extension_lop_attendance_ids = lop_ids
            ext_instance.save(update_fields=['extension_lop_attendance_ids'])
            # Deduct only the paid (non-LOP) extension days from balance
            ext_total = (to_date - from_date).days + 1
            paid = max(0, ext_total - true_lop)
            if paid > 0:
                self._deduct_leave_balance_entry(le, paid)
            print(f"[LeaveExtension] LOP applied (entry, extension only from {from_date}): chargeable={chargeable}, available={available}, lop={true_lop}, paid={paid}")
        except Exception as e:
            import traceback
            print(f"[LeaveExtension] _apply_lop_for_entry error: {e}\n{traceback.format_exc()}")

    def _deduct_leave_balance(self, emp, days):
        """Deduct days from Annual Leave balance (LeaveMasterDetails + breakup + master). Floors at 0."""
        try:
            lmd = LeaveMasterDetails.objects.filter(
                leave_master__employee=emp, leave_type='Annual Leave'
            ).order_by('id').last()
            if not lmd:
                return
            old_avail = float(lmd.available_leaves or 0)
            actual_deduct = min(days, max(old_avail, 0))
            lmd.available_leaves = round(old_avail - actual_deduct, 2)
            lmd.utilized_leaves = round(float(lmd.utilized_leaves or 0) + days, 2)
            lmd.save()
            breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=lmd).order_by('id').last()
            if breakup:
                old_b_avail = float(breakup.available_leaves or 0)
                b_deduct = min(days, max(old_b_avail, 0))
                breakup.available_leaves = round(old_b_avail - b_deduct, 2)
                breakup.utilized_leaves = round(float(breakup.utilized_leaves or 0) + days, 2)
                breakup.save()
            master = lmd.leave_master
            old_m_avail = float(master.total_available_leaves or 0)
            m_deduct = min(days, max(old_m_avail, 0))
            master.total_available_leaves = round(old_m_avail - m_deduct, 2)
            master.total_utilized_leaves = round(float(master.total_utilized_leaves or 0) + days, 2)
            master.save()
        except Exception as e:
            import traceback
            print(f"[LeaveExtension] _deduct_leave_balance error: {e}\n{traceback.format_exc()}")

    def _deduct_leave_balance_entry(self, le, days):
        """Deduct days from leave balance for LeaveEntry (any leave type). Floors at 0."""
        try:
            b_id = le.b_id
            lmd = LeaveMasterDetails.objects.filter(
                leave_master__employee=le.employee,
                leave_type=le.leave_type.status_name if le.leave_type else 'Annual Leave',
                b_id=b_id,
            ).order_by('id').last()
            if not lmd:
                return
            old_avail = float(lmd.available_leaves or 0)
            actual_deduct = min(days, max(old_avail, 0))
            lmd.available_leaves = round(old_avail - actual_deduct, 2)
            lmd.utilized_leaves = round(float(lmd.utilized_leaves or 0) + days, 2)
            lmd.save()
            breakup = LeaveMasterDetailBreakup.objects.filter(leave_master_detail=lmd).order_by('id').last()
            if breakup:
                old_b_avail = float(breakup.available_leaves or 0)
                b_deduct = min(days, max(old_b_avail, 0))
                breakup.available_leaves = round(old_b_avail - b_deduct, 2)
                breakup.utilized_leaves = round(float(breakup.utilized_leaves or 0) + days, 2)
                breakup.save()
            master = lmd.leave_master
            old_m_avail = float(master.total_available_leaves or 0)
            m_deduct = min(days, max(old_m_avail, 0))
            master.total_available_leaves = round(old_m_avail - m_deduct, 2)
            master.total_utilized_leaves = round(float(master.total_utilized_leaves or 0) + days, 2)
            master.save()
        except Exception as e:
            import traceback
            print(f"[LeaveExtension] _deduct_leave_balance_entry error: {e}\n{traceback.format_exc()}")
def get_user_table(data):
    try:
        user_object = UserSerializer(User.objects.get(id=data)).data
        return user_object
    except Exception as e:
        return None


def _revert_lop_after_leave(emp_code, b_id, leave_end_date, leave_type_name, emp_type, emp_group, emp_reporting):
    """
    When a leave reversal is approved, undo the LOP that was applied to the day
    immediately after leave_end_date (if the policy had lop_on_weekly_off_after_leave=True).
    Restores the attendance record back to Weekly Off status.
    Only acts if the day is still LOP — if someone has since worked that day, leave it alone.
    """
    try:
        from attendance_scheduler_tasks.device_attendance_task import (
            _should_lop_weekly_off, check_if_weekly_off, parse_weekly_off
        )
        from hrm_main.models import AttendanceDetails
        from hrm_master.models import EmployeeMaster

        WO_STATUS  = '17'  # Status.WeeklyOff
        LOP_STATUS = '22'  # Status.LOP

        emp = EmployeeMaster.objects.filter(employee_code=emp_code, b_id=b_id).first()
        if not emp:
            return

        weekly_off_parsed = parse_weekly_off(emp.weekly_off)
        check_date = leave_end_date + timedelta(days=1)

        if not check_if_weekly_off(check_date, weekly_off_parsed):
            return  # day after leave is not a weekly off — nothing to revert

        if not _should_lop_weekly_off(emp_type, emp_group, emp_reporting, b_id, leave_type_name):
            return  # policy never applied LOP here — nothing to revert

        att = AttendanceDetails.objects.filter(
            employee_code=emp_code,
            b_id=b_id,
            date=check_date,
        ).first()

        if not att or att.status != LOP_STATUS:
            return  # not currently LOP — don't touch it

        att.status      = WO_STATUS
        att.login_time  = '0000'
        att.logout_time = '0000'
        att.total_hours = '0'
        att.save(update_fields=['status', 'login_time', 'logout_time', 'total_hours'])

    except Exception as e:
        import traceback
        print(f"[WO-LOP] _revert_lop_after_leave error: {e}\n{traceback.format_exc()}")


def _apply_lop_after_leave(emp_code, b_id, leave_end_date, leave_type_name, emp_type, emp_group, emp_reporting):
    """
    After a leave is approved, check the day immediately following leave_end_date.
    If that day is a weekly off AND the policy has lop_on_weekly_off_after_leave=True,
    update the attendance record to LOP — unless the employee actually worked that day (WO-OT).
    """
    try:
        from attendance_scheduler_tasks.device_attendance_task import (
            _should_lop_weekly_off, check_if_weekly_off, parse_weekly_off
        )
        from hrm_main.models import AttendanceDetails
        from hrm_master.models import EmployeeMaster

        WO_OT_STATUS = '11'  # Status.WeeklyOffOvertime
        LOP_STATUS   = '22'  # Status.LOP

        emp = EmployeeMaster.objects.filter(employee_code=emp_code, b_id=b_id).first()
        if not emp:
            return

        weekly_off_parsed = parse_weekly_off(emp.weekly_off)
        check_date = leave_end_date + timedelta(days=1)

        if not check_if_weekly_off(check_date, weekly_off_parsed):
            return  # day after leave is not a weekly off — nothing to do

        if not _should_lop_weekly_off(emp_type, emp_group, emp_reporting, b_id, leave_type_name):
            return  # policy does not require LOP after leave

        att = AttendanceDetails.objects.filter(
            employee_code=emp_code,
            b_id=b_id,
            date=check_date,
        ).first()

        if not att:
            return  # no attendance record for that day yet — task will handle it on next run

        # Skip if employee actually worked on the weekly off (WO-OT)
        if att.status == WO_OT_STATUS or int(att.total_hours or 0) > 0:
            return

        att.status      = LOP_STATUS
        att.login_time  = '0000'
        att.logout_time = '0000'
        att.total_hours = '0'
        att.save(update_fields=['status', 'login_time', 'logout_time', 'total_hours'])

    except Exception as e:
        import traceback
        print(f"[WO-LOP] _apply_lop_after_leave error: {e}\n{traceback.format_exc()}")


