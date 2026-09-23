# serializers.py
import base64
import csv
import importlib
import json
from datetime import datetime, timedelta
from rest_framework import serializers
from hrm_audit_fields.serializers import AuditModelMixinSerializer, ApprovalModelMixinSerializer
from hrm_utils.optional_notifications import create_optional_approval_notification
from hrm_utils.constants import NumberConstructorConstants
from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from hrm_utils.number_constuctor import NumberConstructor
from hrm_utils.custom_functions import context_data_on_create, context_data_on_update, ImageConversion, convert_form_data
from hrm_audit_fields.models.validator_mixin import DynamicValidatorModel, UniqueConstraintValidator
from hrm_main.models import EmployeeMonthlySalary, GratuityEmployeeForm, GratuityCalculations, Gratuity, CareerLetter, \
    Advance, EmployeeList, SalaryCalculation, SalaryHold, OTSalaryCalculation, OTEmployeeList, \
    Bonus, BonusDetails, EmployeeMonthlyAllowanceDetails, EmployeeMonthlyDeductionDetails, AttendanceImport, \
    AttendanceDetails, AllowanceDetails, DeductionDetails, TaDaDetailsImages, TaDaDetails, TaDa, TravelPlanning, \
    FinalSettlement, FinalSettlementEmployeeMonthlyAllowanceDetails, ExpenseClaimCategory, \
    ExpenseClaimLinkType, ExpenseClaim, ExpenseClaimLine, ExpenseClaimAttachment, \
    FinalSettlementEmployeeMonthlyDeductionDetails, TravelPlanningLog, AttendanceStatusMaster, GraceDetails, \
    CareerLetterImages, DisciplinaryAction, PettyCashFund, PettyCashTransaction
from hrm_master.models import EmployeeMaster, ShiftTimings
from master.models import GlobalMaster
import pandas as pd
from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from hrm_utils.custom_functions import convert_base64, generate_unique_id,DefaultValue
from django.db.models import Sum
from backend.image_compression_service import ImageCompressionService
from dateutil import parser
from decimal import Decimal

# â”€â”€ Column-existence cache (checked once per process, not per request) â”€â”€â”€â”€â”€â”€â”€â”€
_SALARY_BREAKDOWN_COL: bool | None = None

def _salary_breakdown_col_exists() -> bool:
    global _SALARY_BREAKDOWN_COL
    if _SALARY_BREAKDOWN_COL is None:
        try:
            from django.db import connection
            with connection.cursor() as cur:
                cols = [c.name for c in connection.introspection.get_table_description(cur, 'hrm_employeelist')]
            _SALARY_BREAKDOWN_COL = 'salary_breakdown' in cols
        except Exception:
            _SALARY_BREAKDOWN_COL = False
    return _SALARY_BREAKDOWN_COL
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


class EmployeeMonthlyAllowanceDetailsSerializer(AuditModelMixinSerializer):
    tableRowId = serializers.IntegerField(default=0, source="table_row_id")
    class Meta:
        model = EmployeeMonthlyAllowanceDetails
        fields = '__all__'


class EmployeeMonthlyDeductionDetailsSerializer(AuditModelMixinSerializer):
    tableRowId = serializers.IntegerField(default=0, source="table_row_id")
    class Meta:
        model = EmployeeMonthlyDeductionDetails
        fields = '__all__'


class EmployeeMonthlySalarySerializer(UniqueConstraintValidator, AuditModelMixinSerializer):
    gross_deductions = EmployeeMonthlyDeductionDetailsSerializer(many=True, required=False)
    gross_earnings = EmployeeMonthlyAllowanceDetailsSerializer(many=True, required=False)
    effective_date = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', 'iso-8601'],
        allow_null=True, required=False,
    )

    class Meta:
        model = EmployeeMonthlySalary
        fields = '__all__'

    def create(self, validated_data):
        from sequences import get_next_value
        request = self.context.get('request')
        gross_deductions = validated_data.pop('gross_deductions', [])
        gross_earnings = validated_data.pop('gross_earnings', [])
        # Auto-generate document number if not already set
        if not validated_data.get('document_number'):
            is_increment = bool(validated_data.get('reason', ''))
            if is_increment:
                seq = get_next_value('salary_increment_number', initial_value=1)
                validated_data['document_number'] = f"SI{seq:06d}"
                if not validated_data.get('approval_status'):
                    validated_data['approval_status'] = 'draft'
            else:
                seq = get_next_value('employee_salary_number', initial_value=1)
                validated_data['document_number'] = f"ES{seq:06d}"
        employee_instance = validated_data['employee']
        employee_instance.is_sal_created = True
        employee_instance.save(update_fields=['is_sal_created'])
        instance = super().create(validated_data)
        self._create_or_update_gross_deductions(instance, gross_deductions, request=request)
        self._create_or_update_gross_earnings(instance, gross_earnings, request=request)
        # Compute backdated arrears when saving a salary increment
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        gross_deductions = validated_data.pop('gross_deductions', [])
        gross_earnings = validated_data.pop('gross_earnings', [])
        hrm_services = importlib.import_module('hrm_main.api.service')
        gratuity_device_signal = hrm_services.GratuitySignal
        instance = super().update(instance, validated_data)
        self._create_or_update_gross_deductions(instance, gross_deductions, request=request)
        self._create_or_update_gross_earnings(instance, gross_earnings, request=request)
        return instance

    def _create_or_update_gross_deductions(self, employee_monthly_instance,
                                           gross_deductions_items_data, **kwargs):
        self.validate_duplicate_data(gross_deductions_items_data)
        employee_deduction_items_ids = []
        for item_data in gross_deductions_items_data:
            if 'id' in item_data and isinstance(item_data['id'], str):
                # print(" update item_data.component", item_data['components'])
                item_data.pop('id')
                item_data['gross_deductions'] = employee_monthly_instance.id
                employee_deduction_items_serializer = EmployeeMonthlyDeductionDetailsSerializer(data=item_data,
                                                                                                context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                gross_deductions_item_instance = employee_deduction_items_serializer.create(
                    employee_deduction_items_serializer.validated_data)

                employee_deduction_items_ids.append(gross_deductions_item_instance.id)
            else:
                # print(" create item_data.component", item_data['components'])
                employee_deduction_items_ids.append(item_data['id'])
                employee_deduction_item_instance = EmployeeMonthlyDeductionDetails.objects.get(id=item_data['id'])
                employee_deduction_items_serializer = EmployeeMonthlyDeductionDetailsSerializer(
                    instance=employee_deduction_item_instance,
                    data=item_data,
                    context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                employee_deduction_items_serializer.update(
                    employee_deduction_item_instance,
                    employee_deduction_items_serializer.validated_data)
        self._delete_deduction_detail_items(employee_deduction_items_ids, employee_monthly_instance)
        return True

    def _create_or_update_gross_earnings(self, employee_monthly_instance,
                                         gross_earnings_items_data, **kwargs):
        self.validate_duplicate_data(gross_earnings_items_data)
        employee_allowance_items_ids = []
        for item_data in gross_earnings_items_data:
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['gross_earnings'] = employee_monthly_instance.id
                employee_allowance_items_serializer = EmployeeMonthlyAllowanceDetailsSerializer(data=item_data,
                                                                                                context=self.context)
                employee_allowance_items_serializer.is_valid(raise_exception=True)
                gross_earnings_item_instance = employee_allowance_items_serializer.create(
                    employee_allowance_items_serializer.validated_data)

                employee_allowance_items_ids.append(gross_earnings_item_instance.id)
            else:
                employee_allowance_items_ids.append(item_data['id'])
                employee_allowance_item_instance = EmployeeMonthlyAllowanceDetails.objects.get(id=item_data['id'])
                employee_allowance_items_serializer = EmployeeMonthlyAllowanceDetailsSerializer(
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
        EmployeeMonthlyDeductionDetails.objects.filter(
            gross_deductions=employee_deduction_item_instance).exclude(
            id__in=ids).delete()

    def _delete_allowance_detail_items(self, ids, employee_allowance_item_instance):
        EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings=employee_allowance_item_instance).exclude(
            id__in=ids).delete()

    def to_internal_value(self, data):
        gross_deductions = data.pop('gross_deductions', [])
        gross_earnings = data.pop('gross_earnings', [])
        keys_to_zero = ['initial_gratuity', 'net_pay_monthly', 'net_pay_yearly', 'ctc']
        data = DefaultValue().set_default_value(data, keys_to_zero, 0)
        validated_data = super().to_internal_value(data)
        validated_data['gross_deductions'] = gross_deductions
        validated_data['gross_earnings'] = gross_earnings
        return validated_data

    def validate_duplicate_data(self, items_data):
        component_names = set()
        for item_data in items_data:
            if 'components' in item_data:
                component_name = item_data['components'].lower().strip()
                if component_name in component_names:
                    raise serializers.ValidationError(
                        {"components": f"Duplicate component '{component_name}' found. Each component must be unique."}
                    )
                component_names.add(component_name)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee is not None:
                data['employee_default_object'] = dict(
                    designation_name=instance.employee.designation.designation_name,
                    employee_code=instance.employee.employee_code,
                    first_name=instance.employee.first_name,
                    id=instance.employee.id
                )
                data['employee_grade'] = instance.employee.grade.grade_code

        if instance.employee is not None:
            data['first_name'] = instance.employee.first_name
            data['department_name'] = instance.employee.department.department_name
            data['designation_name'] = instance.employee.designation.designation_name
            data['employee_code'] = instance.employee.employee_code

        data['source'] = 'Salary Increment' if instance.reason else 'Employee Salary'

        return data


class SalaryIncrementSerializer(EmployeeMonthlySalarySerializer):
    """
    Extends EmployeeMonthlySalarySerializer with computed display fields
    used by the Salary Increment list and form.
    """
    employee_code = serializers.SerializerMethodField(read_only=True)
    employee_name = serializers.SerializerMethodField(read_only=True)
    new_gross     = serializers.SerializerMethodField(read_only=True)
    current_gross = serializers.SerializerMethodField(read_only=True)

    class Meta(EmployeeMonthlySalarySerializer.Meta):
        pass

    def get_employee_code(self, obj):
        return obj.employee.employee_code if obj.employee else None

    def get_employee_name(self, obj):
        return (obj.employee.first_name or '').strip() if obj.employee else None

    def get_new_gross(self, obj):
        return round(sum(float(e.monthly or 0) for e in obj.gross_earnings.all()), 2)

    def get_current_gross(self, obj):
        if not obj.reason or not obj.effective_date:
            return None
        from datetime import date as _date
        from django.db.models import Q
        from django.db.models.functions import Coalesce
        from django.db.models import Value
        prev = EmployeeMonthlySalary.objects.filter(
            employee=obj.employee,
        ).exclude(id=obj.id).filter(
            Q(effective_date__lt=obj.effective_date) | Q(effective_date__isnull=True)
        ).annotate(
            eff_sortable=Coalesce('effective_date', Value(_date(1900, 1, 1)))
        ).order_by('-eff_sortable').first()
        if not prev:
            return None
        return round(sum(float(e.monthly or 0) for e in prev.gross_earnings.all()), 2)


class CareerLetterImagesSerializer(AuditModelMixinSerializer):
    class Meta:
        model = CareerLetterImages
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

class CareerLetterSerializer(UniqueConstraintValidator, AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    career_letter_images = CareerLetterImagesSerializer(many=True, required=False, read_only=True)

    class Meta:
        model = CareerLetter
        fields = '__all__'

    def create(self, validated_data):
        career_letter_data = self.initial_data.get('outward_product_images', [])
        if 'docs' in self.initial_data and self.initial_data['docs']:
            format, imgstr = self.initial_data['docs'].split(';base64,')
            ext = format.split('/')[-1]
            file_name = datetime.now().strftime("%Y%m%d%H%M%S")
            file_data = ContentFile(base64.b64decode(imgstr), name=f"{file_name}.{ext}")
            validated_data['file'] = file_data

        global_template = GlobalMaster.objects.filter(
            global_key='career_letter_subject',
        ).first()
        # print("global_template", global_template)
        if global_template:
            for item in global_template.global_value:
                if item['id'] == validated_data.get('subject'):
                    item['global_template'] = validated_data['subject_template']
                    # print("global_template item:", item)
            global_template.save()

        instance = super().create(validated_data)
        self._create_or_update_career_letter(instance, career_letter_data)
        return instance

    def update(self, instance, validated_data):
        career_letter_data = self.initial_data.get('career_letter_images', [])
        if 'docs' in self.initial_data and self.initial_data['docs']:
            format, imgstr = self.initial_data['docs'].split(';base64,')
            ext = format.split('/')[-1]
            file_name = datetime.now().strftime("%Y%m%d%H%M%S")
            file_data = ContentFile(base64.b64decode(imgstr), name=f"{file_name}.{ext}")
            validated_data['file'] = file_data

        global_template = GlobalMaster.objects.filter(
            global_key='career_letter_subject',
        ).first()
        # print("global_template", global_template)
        if global_template:
            for item in global_template.global_value:
                if item['id'] == validated_data.get('subject'):
                    item['global_template'] = validated_data['subject_template']
                    # print("global_template item:", item)
            global_template.save()
        instance = super().update(instance, validated_data)
        self._create_or_update_career_letter(instance, career_letter_data)
        return instance

    def _create_or_update_career_letter(self, career_letter_instance, career_letter_data):
        image_ids = []

        for item_data in (career_letter_data or []):
            item_data['career_letter'] = career_letter_instance.id

            if 'id' not in item_data or isinstance(item_data['id'], str):
                serializer = CareerLetterImagesSerializer(data=item_data, context=self.context)
                serializer.is_valid(raise_exception=True)
                instance = serializer.save()
                image_ids.append(instance.id)
            else:
                image_ids.append(item_data['id'])

        CareerLetterImages.objects.filter(career_letter=career_letter_instance).exclude(id__in=image_ids).delete()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.career_latter_type is not None:
                data['default_global_object'] = dict(
                    name=instance.career_latter_type,
                    id=instance.career_latter_type
                )
            if instance.subject is not None:
                data['default_subject_object'] = dict(
                    name=instance.subject,
                    id=instance.subject
                )
            if instance.editor is not None and instance.editor != "":
                data['default_editor_for_object'] = dict(
                    id=instance.editor.id,
                    editor_type_name=instance.editor.config_editor.editor_type,
                    subject=instance.editor.subject,

                )
                data['subject'] = instance.editor.subject
            if instance.employee is not None:
                data['default_employee_object'] = dict(
                    designation_name=instance.employee.designation.designation_name,
                    employee_code=instance.employee.employee_code,
                    first_name=instance.employee.first_name,
                    id=instance.employee.id
                )
                data['first_name'] = instance.employee.first_name or ''
                data['employee_code'] = instance.employee.employee_code or ''
                data['last_name'] = instance.employee.last_name or ''
                data['email'] = instance.employee.email or ''
                data['mobile_no'] = instance.employee.home_mobile_number or ''
                data['title'] = instance.employee.title or ''
                data['designation_name'] = instance.employee.designation.designation_name
                data['employee_designation'] = instance.employee.designation.designation_name
                data['department_name'] = instance.employee.department.department_name
                data['doj'] = instance.employee.doj


        if instance.employee is not None:
            data['employee_code'] = instance.employee.employee_code
            data['first_name'] = instance.employee.first_name or ''
        else:
            data['first_name'] = instance.employee_name or ''
        if instance.editor is not None and instance.editor != "":
            data['subject'] = instance.editor.subject
        return data


class AdvanceSerializer(AuditModelMixinSerializer, ApprovalModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    loan_start_date = serializers.DateField(format='%m-%Y', input_formats=['%m-%Y'], allow_null=True)

    class Meta:
        model = Advance
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        try:
            # advance_same_month = Advance.objects.filter(
            #     loan_start_date__month=validated_data['loan_start_date'].month,
            #     loan_start_date__year=validated_data['loan_start_date'].year,
            #     employee=validated_data['employee'], advance_type=validated_data['advance_type']
            # ).first()
            advance_same_month = Advance.objects.filter(
                employee=validated_data['employee'], advance_type=validated_data['advance_type']
            ).first()
            if advance_same_month and advance_same_month.balance_loan_amount != 0:
                raise serializers.ValidationError("Please clear the previous loan amount before taking a new advance.")
        except Advance.DoesNotExist:
            pass

        instance = super().create(validated_data)
        return instance

    def to_internal_value(self, data):
        if 'loan_start_date' in data:
            data['loan_start_date'] = data['loan_start_date'] if data['loan_start_date'] != "" else None
        validated_data = super().to_internal_value(data)
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)


         # Convert decimal to integer for deduction_tenure_months only
        if instance.deduction_tenure_months is not None:
            data['deduction_tenure_months'] = int(instance.deduction_tenure_months)

        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee is not None:
                data['employee_default_object'] = dict(
                    first_name=instance.employee.first_name,
                    employee_code=instance.employee.employee_code,
                    designation_name=instance.employee.designation.designation_name,
                    id=instance.employee.id
                )
                data['designation_name'] = instance.employee.designation.designation_name
                data['department'] = instance.employee.department.department_name

            if instance.advance_type is not None:
                data['default_global_object'] = dict(
                    name=instance.advance_type,
                    id=instance.advance_type
                )
        if instance.employee is not None:
            data['employee_name'] = instance.employee.first_name
            data['employee_code'] = instance.employee.employee_code
        if hasattr(instance, 'approval_status'):
            data['status'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                         instance.approval_status)

        return data

 

class BonusDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = BonusDetails
        fields = [
            'id',
            'employee',
            'first_name',
            'employee_code',
            'management_incentive',
            'variable_incentive',
            'vehicle_maintenance_incentive',
            'accidental_insurance_premium_share',
            'health_insurance_premium_share',
            'bonus_amount',
            'bonus'
        ]
    def to_internal_value(self, data):
        keys_to_zero = ['management_incentive', 'variable_incentive', 'vehicle_maintenance_incentive',
                        'accidental_insurance_premium_share', 'health_insurance_premium_share', 'bonus_amount']

        data = DefaultValue().set_default_value(data, keys_to_zero, 0)
        validated_data = super().to_internal_value(data)
        return validated_data



class BonusSerializer(UniqueConstraintValidator, AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    bonus_months = serializers.DateField(format='%m-%Y', input_formats=['%m-%Y'], allow_null=True)
    bonus_details = BonusDetailsSerializer(many=True, required=False)

    class Meta:
        model = Bonus
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')

        # bonus_details = self.initial_data.pop('bonus_details', [])
        bonus_details = validated_data.pop('bonus_details', [])

        instance = super().create(validated_data)
        self._create_or_update_bouns_details(instance, bonus_details, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')

        # bonus_details = self.initial_data.pop('bonus_details', [])
        bonus_details = validated_data.pop('bonus_details', [])
        instance = super().update(instance, validated_data)
        self._create_or_update_bouns_details(instance, bonus_details, request=request)
        return instance

    def _create_or_update_bouns_details(self, bonus_instance,
                                        bonus_details_items_data, **kwargs):
        if not bonus_details_items_data:
            raise serializers.ValidationError(
                {'error_msg': 'Ensure that a bonus is set for at least one employee to proceed.'})
        bonus_items_ids = []
        for item_data in bonus_details_items_data:
            # Check if bonus_amount is missing or a negative value
            bonus_amount_raw = item_data.get('bonus_amount', '')
            if bonus_amount_raw is None or bonus_amount_raw == '':
                bonus_amount = None
            else:
                try:
                    bonus_amount = float(bonus_amount_raw)
                except (ValueError, TypeError):
                    raise serializers.ValidationError({
                        'error_msg': f"Invalid bonus amount for {item_data.get('first_name')}"
                    })

            if bonus_amount is None:
                raise serializers.ValidationError({
                    'error_msg': f"Please enter a value for {item_data.get('first_name')}"
                })
            if bonus_amount < 0:
                raise serializers.ValidationError({
                    'error_msg': f"Bonus amount should not be a negative value: {bonus_amount}"
                })
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['bonus'] = bonus_instance.id
                bonus_items_serializer = BonusDetailsSerializer(data=item_data, context=self.context)
                bonus_items_serializer.is_valid(raise_exception=True)
                bonus_details_item_instance = bonus_items_serializer.create(
                    bonus_items_serializer.validated_data)

                bonus_items_ids.append(bonus_details_item_instance.id)
            else:
                bonus_items_ids.append(item_data['id'])
                bonus_details_item_instance = BonusDetails.objects.get(id=item_data['id'])
                bonus_items_serializer = BonusDetailsSerializer(
                    instance=bonus_details_item_instance,
                    data=item_data,
                    context=self.context)
                bonus_items_serializer.is_valid(raise_exception=True)
                bonus_items_serializer.update(
                    bonus_details_item_instance,
                    bonus_items_serializer.validated_data)
        self._delete_bonus_detail_items(bonus_items_ids, bonus_instance)
        return True

    def _delete_bonus_detail_items(self, ids, bonus_details_item_instance):
        BonusDetails.objects.filter(bonus=bonus_details_item_instance).exclude(
            id__in=ids).delete()

    def to_internal_value(self, data):
        bonus_details = data.pop('bonus_details', [])
        if 'date' in data:
            data['date'] = data['date'] if data['date'] != "" else None
        if 'bonus_months' in data:
            data['bonus_months'] = data['bonus_months'] if data['bonus_months'] != "" else None
        # Normalize numeric fields before validation so empty strings don't cause "A valid number is required." errors
        for num_field in ('bonus_amount', 'total_bonus_amount'):
            if num_field in data and (data[num_field] == "" or data[num_field] is None):
                data[num_field] = 0

        validated_data = super().to_internal_value(data)
        validated_data['bonus_details'] = bonus_details
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.grade is not None:
                data['grade_default_object'] = dict(
                    grade_description=instance.grade.grade_description,
                    grade_code=instance.grade.grade_code,
                    id=instance.grade.id
                )
        if instance.grade is not None:
            data['grade_code'] = instance.grade.grade_code
            data['grade_description'] = instance.grade.grade_description
        if hasattr(instance, 'approval_status'):
            data['status'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                         instance.approval_status)
        return data


class GratuityEmployeeFormSerializer(ApprovalModelMixinSerializer,UniqueConstraintValidator,AuditModelMixinSerializer):
    dor = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    doc = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    unpaid_leave_last_synced = serializers.DateField(
        format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False
    )
    settlement_due_date = serializers.DateField(
        format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False
    )

    class Meta:
        model = GratuityEmployeeForm
        fields = '__all__'

    def create(self, validated_data):
        # Generate form number on first save
        if not validated_data.get('form_number'):
            try:
                validated_data['form_number'] = NumberConstructor().generate_next_sequence(
                    NumberConstructorConstants.GRATUITY_FORM_NUMBER
                )
            except Exception:
                # GRATUITY_FORM_NUMBER not yet configured in App Settings â€” form saved without number
                pass
        return super().create(validated_data)

    def to_internal_value(self, data):
        data = data.copy()

        if 'dor' in data:
            data['dor'] = data['dor'] if data['dor'] != "" else None
        if 'doc' in data:
            data['doc'] = data['doc'] if data['doc'] != "" else None

        # Integer fields â€” replace empty string / None with 0 so validation passes
        for int_field in ('unpaid_leave_days_manual', 'unpaid_leave_days_system',
                          'unpaid_leave_days_total'):
            if data.get(int_field) in (None, '', 'null'):
                data[int_field] = 0

        # Float fields that are NOT nullable â€” coerce empty/null to 0
        for float_field in ('debt_deduction', 'net_gratuity_payable'):
            if data.get(float_field) in (None, '', 'null'):
                data[float_field] = 0

        # Float fields that ARE nullable â€” coerce empty string to None
        for float_field in ('total_gratuity_monthly', 'total_gratuity_yearly',
                            'present_basic_pay'):
            if data.get(float_field) in ('', 'null'):
                data[float_field] = None

        # unpaid_leave_last_synced â€” allow blank
        if data.get('unpaid_leave_last_synced') in ('', 'null'):
            data['unpaid_leave_last_synced'] = None

        # termination_reason â€” default to 'normal' when not provided (choices field rejects empty string)
        if not data.get('termination_reason'):
            data['termination_reason'] = 'normal'

        # status â€” default to 'draft' when not provided
        if not data.get('status'):
            data['status'] = 'draft'

        # settlement_due_date â€” allow blank
        if data.get('settlement_due_date') in ('', 'null'):
            data['settlement_due_date'] = None

        # new float fields â€” coerce empty/null to 0
        for float_field in ('gross_gratuity_before_forfeiture', 'residual_employee_debt'):
            if data.get(float_field) in (None, '', 'null'):
                data[float_field] = 0

        # calculation_type â€” default to 'final_separation'
        if not data.get('calculation_type'):
            data['calculation_type'] = 'final_separation'

        # notice_completion_status â€” default to 'na'
        if not data.get('notice_completion_status'):
            data['notice_completion_status'] = 'na'

        validated_data = super().to_internal_value(data)
        return validated_data

    def validate(self, attrs):
        # Last working date (dor) is mandatory when approving a gratuity form
        approval_status = attrs.get('approval_status') or (
            self.instance.approval_status if self.instance else None
        )
        dor = attrs.get('dor') or (self.instance.dor if self.instance else None)
        if approval_status == 'APPROVED' and not dor:
            raise serializers.ValidationError(
                {'dor': 'Last Working Date is required before approving the gratuity form.'}
            )
        return super().validate(attrs)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.employee is not None:
            emp = instance.employee
            data['employee_name']   = emp.first_name
            data['first_name']      = emp.first_name
            data['employee_code']   = emp.employee_code
            data['department_name'] = emp.department.department_name if emp.department_id else ''
            data['designation_name'] = emp.designation.designation_name if emp.designation_id else ''
            data['grade_code']      = emp.grade.grade_code if emp.grade_id else ''
            data['dob'] = emp.dob.strftime('%d-%m-%Y') if emp.dob else None
            data['doj'] = emp.doj.strftime('%d-%m-%Y') if emp.doj else None
            # dor: use form-level value (instance.dor) â€” do NOT overwrite with employee.dor
            if not data.get('dor') and emp.dor:
                data['dor'] = emp.dor.strftime('%d-%m-%Y')
            # doc: use form-level override if set, otherwise fall back to employee.doc
            if not data.get('doc') and emp.doc:
                data['doc'] = emp.doc.strftime('%d-%m-%Y')
            data['default_employee_object'] = {
                'employee_code': emp.employee_code,
                'id':            emp.id,
            }
        # Ensure numeric defaults for new fields on older records
        data.setdefault('consider_unpaid_leave',    False)
        data.setdefault('consider_auto_sync',        False)
        data.setdefault('unpaid_leave_days_manual',  0)
        data.setdefault('unpaid_leave_days_system',  0)
        data.setdefault('unpaid_leave_days_total',   0)
        data.setdefault('consider_debt_deduction',   False)
        data.setdefault('debt_deduction',            0)
        data.setdefault('net_gratuity_payable',      0)
        data.setdefault('termination_reason',               data.get('termination_reason') or '')
        data.setdefault('gratuity_forfeited',               False)
        data.setdefault('override_statutory_cap',           'inherit')
        data.setdefault('calculation_remarks',              '')
        data.setdefault('service_years_display',            '')
        data.setdefault('settlement_due_date',              None)
        data.setdefault('gross_gratuity_before_forfeiture', 0)
        data.setdefault('residual_employee_debt',           0)
        data.setdefault('status',                           'draft')
        data['form_number']                 = instance.form_number or ''
        data.setdefault('calculation_type',                 'final_separation')
        data.setdefault('notice_completion_status',         'na')
        data.setdefault('basic_salary_manual_override',     False)
        data.setdefault('forfeiture_ref',                   '')

        # â”€â”€ List-view display fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # Approval remarks (e.g. "Pending with Hr Manager")
        data['approval_remarks'] = instance.approval_remarks or ''

        # Last modified date â€” formatted
        if instance.modified:
            from django.utils import timezone
            modified = instance.modified
            if timezone.is_naive(modified):
                modified = timezone.make_aware(modified, timezone.utc)
            data['last_modified_date'] = timezone.localtime(modified).strftime('%d-%m-%Y %I:%M %p')
        else:
            data['last_modified_date'] = ''

        # Modified by â€” strip email portion (e.g. "John (john@email.com)" â†’ "John")
        raw = instance.user_modified or ''
        import re
        data['modified_by'] = re.sub(r'\s*\(.*?\)\s*$', '', raw).strip()

        return data


class GratuityCalculationsSerializer(UniqueConstraintValidator, AuditModelMixinSerializer):
    class Meta:
        model = GratuityCalculations
        fields = '__all__'


class GratuitySerializer(UniqueConstraintValidator, AuditModelMixinSerializer):
    class Meta:
        model = Gratuity
        fields = '__all__'


class AllowanceDetailsSerializer(AuditModelMixinSerializer):

    class Meta:
        model = AllowanceDetails
        fields = [
            'id',
            'allowance_salary',
            'components',
            'monthly',
            'yearly',
        ]


class DeductionDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = DeductionDetails
        fields = [
            'id',
            'deduction_salary',
            'components',
            'monthly',
            'yearly',
        ]


class SalaryHoldSerializer(ApprovalModelMixinSerializer,AuditModelMixinSerializer):
    hold_from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', 'iso-8601'], allow_null=True, required=False)
    hold_to_date   = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', 'iso-8601'], allow_null=True, required=False)
    released_on    = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', 'iso-8601'], allow_null=True, required=False)

    def to_internal_value(self, data):
        if 'released_on' in data and data['released_on'] in (None, '', 'null', 'undefined'):
            data = data.copy()
            data['released_on'] = None
        return super().to_internal_value(data)


    class Meta:
        model  = SalaryHold
        fields = '__all__'


class EmployeeListSerializer(AuditModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', 'iso-8601'], allow_null=True, required=False)
    to_date   = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d', 'iso-8601'], allow_null=True, required=False)

    class Meta:
        model = EmployeeList
        fields = [
            'id',
            'employee',
            'employee_code',
            'first_name',
            'last_name',
            'no_of_days',
            'ot',
            'other_expense',
            'other_incentive',
            'tds',
            'income_tax',
            'bonus',
            'advance',
            'gross_pay',
            'net_pay',
            'salary',
            'from_date',
            'to_date',
            'base_gross_amount',
            'base_deductions_amount',
            'lop_amount',
            'basic',
            'variable',
            'advance_emi',
            'deductions_pay',
            'employee_type',
            'department',
            'designation',
            'allowance_details',
            'deduction_details',
            'other_allowances',
            'other_allowances_detail',
            'employer_pf_contribution',
            'salary_status',
            'sponsors',
            'leave_days',
            'working_days',
            'advance_balance',
            'earned',
            'arrears',
            'remarks',
            'salary_breakdown',
        ]


class SalaryCalculationSerializer(AuditModelMixinSerializer, ApprovalModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    to_date   = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    month     = serializers.IntegerField(allow_null=True, required=False, default=None)

    def to_internal_value(self, data):
        if 'month' in data and data['month'] in (None, '', 'null', 'undefined'):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            data['month'] = None
        return super().to_internal_value(data)
    modified  = serializers.DateTimeField(read_only=True)
    employee_list = EmployeeListSerializer(many=True, required=False)

    class Meta:
        model = SalaryCalculation
        fields = '__all__'

    def _fill_dates_from_month(self, validated_data):
        """If selection_mode is month, derive from_date/to_date from the month value."""
        import calendar as _cal
        from datetime import date as _date
        if validated_data.get('selection_mode') == 'month' and validated_data.get('month'):
            m    = int(validated_data['month'])
            year = _date.today().year
            last_day = _cal.monthrange(year, m)[1]
            from django.utils.dateparse import parse_date
            validated_data['from_date'] = _date(year, m, 1)
            validated_data['to_date']   = _date(year, m, last_day)

    def create(self, validated_data):
        request = self.context.get('request')
        master_service = importlib.import_module('hrm_master.api.service')
        master_signal = master_service.MasterSignal
        self._fill_dates_from_month(validated_data)
        if validated_data.get('from_date') and validated_data.get('to_date'):
            master_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])
        employee_list = self.initial_data.pop('employee_list', [])
        validated_data.pop('employee_list', [])

        if not validated_data.get('salary_number'):
            from django.utils import timezone as _tz
            now = _tz.localtime()
            validated_data['salary_number'] = f"SAL-{now.year}-{now.strftime('%m%d')}-{now.strftime('%H%M')}"

        instance = super().create(validated_data)
        self._create_or_update_employee_list_details(instance, employee_list, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        master_service = importlib.import_module('hrm_master.api.service')
        master_signal = master_service.MasterSignal
        self._fill_dates_from_month(validated_data)
        if validated_data.get('from_date') and validated_data.get('to_date'):
            master_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])
        employee_list = self.initial_data.pop('employee_list', [])
        validated_data.pop('employee_list', [])

        instance = super().update(instance, validated_data)
        self._create_or_update_employee_list_details(instance, employee_list, request=request)

        return instance

    def _create_or_update_employee_list_details(self, salary_calculation_instance, employee_list_items_data, **kwargs):
        request = self.context.get('request')
        salary_items_ids = []
        hrm_service = importlib.import_module('hrm_main.api.service')
        hrm_entry_signal = hrm_service.HRMSignal

        parent_from_date = salary_calculation_instance.from_date
        parent_to_date   = salary_calculation_instance.to_date

        for item_data in employee_list_items_data:
            if 'allowance_details' not in item_data or 'deduction_details' not in item_data:
                raise ValueError("Missing allowance_details or deduction_details in item_data.")
            # Always use parent's dates â€” never trust child row dates from frontend
            if parent_from_date:
                item_data['from_date'] = parent_from_date.strftime('%d-%m-%Y')
            if parent_to_date:
                item_data['to_date'] = parent_to_date.strftime('%d-%m-%Y')

            # If salary_breakdown has attendance rows (HR may have edited pay_percentage),
            # recompute lop_amount from the breakdown so it stays consistent.
            # Guard: salary_breakdown column may not exist in DB yet â€” pop it if so.
            breakdown = item_data.get('salary_breakdown') or {}
            attendance_rows = breakdown.get('attendance') or []
            if attendance_rows:
                recomputed_lop = round(sum(
                    float(row.get('lop_contribution') or 0) for row in attendance_rows
                ))
                item_data['lop_amount'] = recomputed_lop
                if 'summary' in breakdown:
                    breakdown['summary']['lop_amount'] = recomputed_lop
                    item_data['salary_breakdown'] = breakdown
            # Guard: remove salary_breakdown from payload if DB column doesn't exist yet
            # (SQL ALTER TABLE may not have been run). Cached after first check.
            if not _salary_breakdown_col_exists():
                item_data.pop('salary_breakdown', None)

            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['salary'] = salary_calculation_instance.id
                employee_list_serializer = EmployeeListSerializer(data=item_data, context=self.context)
                employee_list_serializer.is_valid(raise_exception=True)
                employee_list_instance = employee_list_serializer.create(employee_list_serializer.validated_data)
                salary_items_ids.append(employee_list_instance.id)
            else:
                salary_items_ids.append(item_data['id'])
                employee_list_details_instance = EmployeeList.objects.get(id=item_data['id'])
                employee_list_serializer = EmployeeListSerializer(
                    instance=employee_list_details_instance,
                    data=item_data,
                    context=self.context
                )
                employee_list_serializer.is_valid(raise_exception=True)
                employee_list_serializer.update(employee_list_details_instance, employee_list_serializer.validated_data)

                if salary_calculation_instance.approval_status == ApprovalModelMixin.APPROVED:
                    gross_earnings_list = item_data['allowance_details']
                    gross_deductions_list = item_data['deduction_details']
                    # Write the post-deduction balance back to the Advance model
                    self._update_advance_balance(
                        employee_id=item_data['employee'],
                        from_date=item_data['from_date'],
                        new_balance=item_data.get('advance_balance', 0),
                    )
                    self._create_or_update_employee_allowance_details(
                        employee_list_details_instance, gross_earnings_list, request=request
                    )
                    self._create_or_update_employee_deduction_details(
                        employee_list_details_instance, gross_deductions_list, request=request
                    )

        self._delete_employee_list_detail_items(salary_items_ids, salary_calculation_instance)
        # Mark arrears as processed when payroll is approved and 'arrears' column is selected
        if salary_calculation_instance.approval_status == ApprovalModelMixin.APPROVED:
            selected_columns = salary_calculation_instance.selected_columns or []
            if 'arrears' in selected_columns:
                employee_ids = list(
                    salary_calculation_instance.employee_list.values_list('employee_id', flat=True)
                )
                EmployeeMonthlySalary.objects.filter(
                    employee_id__in=employee_ids,
                    arrears_processed=False,
                ).update(arrears_processed=True)
        return True

    def _update_advance_balance(self, employee_id, from_date, new_balance):
        from hrm_main.models import Advance
        from decimal import Decimal
        from datetime import datetime, date as _date
        if isinstance(from_date, str):
            for fmt in ('%d-%m-%Y', '%Y-%m-%d'):
                try:
                    from_date = datetime.strptime(from_date, fmt).date()
                    break
                except ValueError:
                    continue
        if not isinstance(from_date, _date):
            return
        salary_month_start = _date(from_date.year, from_date.month, 1)
        # Find all active approved advances for this employee whose loan started on or before salary month
        active_advances = Advance.objects.filter(
            employee_id=employee_id,
            approval_status='APPROVED',
            loan_start_date__isnull=False,
            balance_loan_amount__gt=0,
            loan_start_date__lte=salary_month_start,
        ).order_by('loan_start_date')
        new_bal = Decimal(str(new_balance or 0))
        for adv in active_advances:
            emi = adv.emi or Decimal('0')
            updated = max(Decimal('0'), (adv.balance_loan_amount or Decimal('0')) - emi)
            adv.balance_loan_amount = updated
            adv.save(update_fields=['balance_loan_amount'])

    def _delete_employee_list_detail_items(self, ids, salary_instance):
        EmployeeList.objects.filter(salary=salary_instance).exclude(
            id__in=ids).delete()

    # Allowance Details Employee
    def _create_or_update_employee_allowance_details(self, employee_monthly_instance,
                                                     allowance_details_items_data, **kwargs):
        employee_allowance_items_ids = []
        # print("allowance_details_items_data", allowance_details_items_data)
        for component, value in allowance_details_items_data.items():
            item_data = {
                'allowance_salary': employee_monthly_instance.id,
                'components': component,
                'monthly': value,
            }
            employee_allowance_items_serializer = AllowanceDetailsSerializer(data=item_data, context=self.context)
            employee_allowance_items_serializer.is_valid(raise_exception=True)
            allowance_details_item_instance = employee_allowance_items_serializer.create(
                employee_allowance_items_serializer.validated_data
            )
            employee_allowance_items_ids.append(allowance_details_item_instance.id)

        return True

    # Deduction Details Employee
    def _create_or_update_employee_deduction_details(self, employee_monthly_instance,
                                                     deduction_details_items_data, **kwargs):
        employee_deduction_items_ids = []
        for component, value in deduction_details_items_data.items():
            item_data = {
                'deduction_salary': employee_monthly_instance.id,
                'components': component,
                'monthly': value,
            }
            employee_deduction_items_serializer = DeductionDetailsSerializer(data=item_data, context=self.context)
            employee_deduction_items_serializer.is_valid(raise_exception=True)
            deduction_details_item_instance = employee_deduction_items_serializer.create(
                employee_deduction_items_serializer.validated_data
            )
            employee_deduction_items_ids.append(deduction_details_item_instance.id)

        return True

    def employee_salary_details(self, employee):
        gross_earnings_list = EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings__employee=employee
        ).values('components', 'monthly')
        gross_deductions_list = EmployeeMonthlyDeductionDetails.objects.filter(
            gross_deductions__employee=employee
        ).values('components', 'monthly')
        return gross_earnings_list, gross_deductions_list

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee_type is not None:
                data['default_global_object'] = dict(
                    name=instance.employee_type,
                    id=instance.employee_type
                )
                data['employee_global_object'] = [
                    {'name': emp_type, 'id': emp_type} for emp_type in instance.employee_type
                ]

            # Resolve IDs to display names for picker text fields
            from hrm_master.models import Designation, Department

            def _ids_to_names(ids_str, model_cls, name_field, code_field=None):
                if not ids_str:
                    return ''
                ids = [i.strip() for i in str(ids_str).split(',') if i.strip()]
                if not ids:
                    return ''
                objs = model_cls.objects.filter(id__in=ids)
                if code_field:
                    return ', '.join(f"{getattr(o, code_field)} - {getattr(o, name_field)}" for o in objs)
                return ', '.join(getattr(o, name_field) for o in objs)

            data['filter_employee']    = _ids_to_names(instance.filter_employee_ids,    EmployeeMaster, 'first_name', 'employee_code')
            data['filter_designation'] = _ids_to_names(instance.filter_designation_ids, Designation,    'designation_name', 'designation_code')
            data['filter_department']  = _ids_to_names(instance.filter_department_ids,  Department,     'department_name', 'department_code')
            data['filter_sponsor']     = instance.filter_sponsor or ''

        # Clean user_created â€” strip "(email)" suffix, keep name only
        if data.get('user_created'):
            import re
            data['user_created'] = re.sub(r'\s*\(.*?\)\s*$', '', data['user_created']).strip()

        # Format modified datetime to DD-MM-YYYY hh:mm AM/PM
        if instance.modified:
            from django.utils import timezone as tz
            modified = instance.modified
            if tz.is_naive(modified):
                modified = tz.make_aware(modified, tz.utc)
            local_dt = tz.localtime(modified)
            data['modified'] = local_dt.strftime('%d-%m-%Y %I:%M %p')

        if hasattr(instance, 'approval_status'):
            data['status'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                         instance.approval_status)
            data['employee_types'] = instance.employee_type

        if hasattr(instance, 'allowance_details') and hasattr(instance, 'deduction_details'):
            data['allowance_details'] = instance.allowance_details
            data['deduction_details'] = instance.deduction_details

        return data


class AttendanceDetailsSerializer(AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    class Meta:
        model = AttendanceDetails
        fields = [
            'id',
            'date',
            'attendance',
            'employee_name',
            'employee_code',
            'login_time',
            'logout_time',
            'working_time',
            'status',
            'total_hours',
            'ot_hrs',
            'ot2_hrs',
            'hot_hrs',
            'extra_hrs',
            'less_hrs',
            'shift',
            'shift_in',
            'shift_out',
            'permitted_ot',
            'scheduled_ot',
            'processed_logout_time',
            'processed_total_hour',
            'is_consecutive_weekly_off',
            'edited_data',
            'remarks',
            't_enter_id',
            'break_hrs'
        ]

    def update(self, instance, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        time_sheet_editing = request.query_params.get('time_sheet_editing', 'false')
        time_sheet_editing = time_sheet_editing.lower() == 'true'
        if time_sheet_editing:
            print("comes inside")
            instance = self.send_for_approval(instance)
        else:
            instance = super().update(instance, validated_data)
            self.update_consecutive_weekly_off(validated_data, instance, b_id=b_id)
        return instance

    def send_for_approval(self, instance):
        edited_data = self.initial_data
        instance.edited_data = edited_data
        instance.save()
        return instance

    def to_internal_value(self, data):
        self.time_calculation(data)
        self.update_processed_details(data)
        self.update_permitted_ot_with_hot(data)
        validated_data = super().to_internal_value(data)
        return validated_data

    def update_permitted_ot_with_hot(self, data):
        if 'permitted_ot' in data and data['permitted_ot'] != '' and data['status'] in ['11', '19']:
            data['permitted_ot'], data['hot_hrs'] = data.get('hot_hrs', 0), data['permitted_ot']
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        b_id = request.query_params.get('b_id', None)

        if data['edited_data']:
            data = data['edited_data']

        is_time_sheet = self.context.get('time_sheet')
        export_timesheet = self.context.get('export_timesheet')
        request = self.context.get('request', None)
        is_processed = request.query_params.get('is_processed',
                                                'False').lower() == 'true' if request is not None else False

        if is_processed:
            self.get_processed_data(data)

        if is_time_sheet:
            # data = self.Atemporary_calculation(data)
            if not export_timesheet:
                data = self.update_permitted_ot_with_hot(data)
            data['converted_date'] = instance.date.strftime("[%a], %Y-%m-%d")
            data = self.get_shift_details(data)
            data = self.return_converted_data(data)
            emp_data = EmployeeMaster.objects.filter(employee_code=data['employee_code']).values('employee_type',
                                                                                                 'employee_group',
                                                                                                 'reporting',
                                                                                                 'is_ot_eligible',
                                                                                                 'weekly_off')
            if emp_data:
                data.update(emp_data[0])

        if export_timesheet:
            status_exists = AttendanceStatusMaster.objects.filter(code=data['status']).first()
            if status_exists:
                data['status'] = status_exists.status_name

        return data

    def time_calculation(self, data):
        convertable_fields = ['login_time', 'logout_time']
        for field in convertable_fields:
            if field in data and data[field]:
                time_obj = datetime.strptime(data[field], "%H:%M")
                data[field] = time_obj.strftime("%H%M")
        return data

    def update_processed_details(self, data):
        logout_time = data['logout_time']
        total_hrs = int(data['total_hours'])
        extra_hrs = int(data['extra_hrs'])
        processed_total_hour = total_hrs - extra_hrs
        data['processed_total_hour'] = processed_total_hour
        logout_dt = datetime.strptime(str(logout_time).zfill(4), "%H%M")
        new_logout_dt = logout_dt - timedelta(minutes=extra_hrs)
        data['processed_logout_time'] = new_logout_dt.strftime("%H%M")
        return data

    def update_consecutive_weekly_off(self, data, instance, **kwargs):
        # TODO Instead of b_id map by break hrs and weekly off days for consecutive declaration
        b_id = int(kwargs.get('b_id', 1))
        weekday_map = {1: 6, 2: 4}

        check_weekday = weekday_map.get(b_id, 6)  # Default to Sunday if b_id is unknown

        date = data.get('date')
        status = data.get('status')
        employee_code = data.get('employee_code')
        # print("check_weekday", check_weekday)
        if date.weekday() == check_weekday:
            previous_weekday = date - timedelta(days=7)
            next_weekday = date + timedelta(days=7)

            if status == '11':
                print("Inside status check:", status)

                previous_instance = self.Meta.model.objects.filter(
                    date=previous_weekday,
                    employee_code=employee_code,
                    status='11',
                    is_consecutive_weekly_off=False
                ).exclude(status='-1').first()

                instance.is_consecutive_weekly_off = bool(previous_instance)
                instance.save()

                print("Previous week:", previous_weekday, previous_instance)
                print("Next week:", next_weekday)
                print("Current:", date)

                if not instance.is_consecutive_weekly_off:
                    next_instance = self.Meta.model.objects.filter(
                        date=next_weekday,
                        employee_code=employee_code,
                        status='11',
                        is_consecutive_weekly_off=False
                    ).exclude(status='-1').first()

                    if next_instance:
                        next_instance.is_consecutive_weekly_off = True
                        next_instance.save()

                        # Recursively update next occurrence
                        next_data = {
                            'date': next_instance.date,
                            'status': next_instance.status,
                            'employee_code': next_instance.employee_code,
                        }
                        self.update_consecutive_weekly_off(next_data, next_instance, **kwargs)
                else:
                    next_instance = self.Meta.model.objects.filter(
                        date=next_weekday,
                        employee_code=employee_code,
                        status='11',
                        is_consecutive_weekly_off=True
                    ).exclude(status='-1').first()

                    if next_instance:
                        next_instance.is_consecutive_weekly_off = False
                        next_instance.save()

                        next_data = {
                            'date': next_instance.date,
                            'status': next_instance.status,
                            'employee_code': next_instance.employee_code,
                        }
                        self.update_consecutive_weekly_off(next_data, next_instance, **kwargs)

            else:
                instance.is_consecutive_weekly_off = False
                instance.save()
                next_instance = self.Meta.model.objects.filter(
                    date=next_weekday,
                    employee_code=employee_code,
                    status='11',
                    is_consecutive_weekly_off=True
                ).exclude(status='-1').first()

                if next_instance:
                    next_instance.is_consecutive_weekly_off = False
                    next_instance.save()

                    next_data = {
                        'date': next_instance.date,
                        'status': next_instance.status,
                        'employee_code': next_instance.employee_code,
                    }
                    self.update_consecutive_weekly_off(next_data, next_instance, **kwargs)

        return data

    def get_processed_data(self, data):
        print()
        # record_total_hrs = int(data['total_hours'])
        total_hours = data.get('total_hours')
        try:
            record_total_hrs = float(total_hours) if total_hours not in [None, ''] else 0.0
        except (ValueError, TypeError):
            record_total_hrs = 0.0 

        if data['is_consecutive_weekly_off']:
            data['total_hours'] = '0'
            data['login_time'] = '0'
            data['logout_time'] = '0'
            data['ot_hrs'] = '0'
            data['ot2_hrs'] = '0'
            data['hot_hrs'] = '0'
            data['less_hrs'] = '0'
            data['extra_hrs'] = '0'
            data['break_hrs'] = '0'
            data['status'] = '17'

        else:
            if record_total_hrs > 0:
                data['logout_time'] = data['processed_logout_time']
                data['total_hours'] = data['processed_total_hour']
                data['extra_hrs'] = '0'
        return data

    def return_converted_data(self, data):
        time_fields = ['login_time', 'logout_time', 'shift_in', 'shift_out']
        for field in time_fields:
            if data.get(field):
                try:
                    time_str = str(data[field]).zfill(4)
                    time_obj = datetime.strptime(time_str, "%H%M")
                    data[field] = time_obj.strftime('%H:%M')
                except Exception:
                    data[field] = "00:00"

        # For the hour fields
        hour_fields = ['total_hours', 'working_time', 'ot_hrs', 'ot2_hrs', 'hot_hrs', 'less_hrs', 'extra_hrs',
                       'permitted_ot', 'break_hrs']
        for field in hour_fields:
            if data.get(field):
                try:
                    minutes = int(data[field]) // 60
                    seconds = int(data[field]) % 60
                    data[f'converted_{field}'] = f"{minutes:02}.{seconds:02}"
                except Exception:
                    data[f'converted_{field}'] = "00:00"

        return data

    def get_shift_details(self, data):
        shift_obj = ShiftTimings.objects.filter(shift_code=data['shift']).first()
        if shift_obj:
            data['shift_name'] = shift_obj.shift_name
        if data['shift'] == '1':
            data['shift_in'] = '0700'
            data['shift_out'] = '1900'
        elif data['shift'] == '2':
            data['shift_in'] = '1900'
            data['shift_out'] = '0700'
        elif data['shift'] == 'GEN-SFIC':
            data['shift_in'] = '0900'
            data['shift_out'] = '1800'
        else:
            login_time = int(data['login_time']) if data['login_time'] not in ['0','0000',None,""] else 0
            logout_time = int(data['logout_time']) if data['logout_time'] not in ['0','0000',None,""] else 0

            if login_time > logout_time and logout_time != 0:
                data['shift_in'] = '1900'
                data['shift_out'] = '0700'
            elif login_time < logout_time and login_time != 0:
                data['shift_in'] = '0700'
                data['shift_out'] = '1900'
            else:
                data['shift_in'] = '0000'
                data['shift_out'] = '0000'

        return data


class AttendanceImportSerializer(AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    attendance_details = AttendanceDetailsSerializer(many=True, required=False)

    class Meta:
        model = AttendanceImport
        fields = [
            'id',
            'date',
            'import_file',
            'import_code',
            'file_name',
            'attendance_details',
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        try:
            validated_data['import_code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.IMPORT_CODE)
        except:
            raise serializers.ValidationError("App key: IMPORT_CODE does not exist")
        attendance_details = validated_data.pop('attendance_details', [])
        date = validated_data.get('date')
        self.validate_attendance_import(date, b_id, request=request)
        instance = super().create(validated_data)

        attendance_details_list = []
        for item in attendance_details:
            date_str = item['date']
            date_obj = datetime.strptime(date_str, '%d/%m/%Y')
            formatted_date = date_obj.strftime('%Y-%m-%d')
            attendance_detail = AttendanceDetails(
                attendance=instance,
                date=formatted_date,
                employee_code=item['employee_code'],
                employee_name=item['employee_name'],
                login_time=item['login_time'],
                logout_time=item['logout_time'],
                working_time=item['working_time'],
                status=item['status'],
                b_id=b_id
            )
            attendance_details_list.append(attendance_detail)
        AttendanceDetails.objects.bulk_create(attendance_details_list)
        # self._create_or_update_attendance_details(instance, attendance_details, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')

        # attendance_details = self.initial_data.pop('attendance_details', [])
        attendance_details = validated_data.pop('attendance_details', [])
        instance = super().update(instance, validated_data)
        self._create_or_update_attendance_details(instance, attendance_details, request=request)
        return instance

    def _create_or_update_attendance_details(self, attendance_instance,
                                             attendance_details_items_data, **kwargs):
        attendance_items_ids = []
        for item_data in attendance_details_items_data:
            # print("item_data", item_data)
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['attendance'] = attendance_instance.id
                attendance_items_serializer = AttendanceDetailsSerializer(data=item_data, context=self.context)
                attendance_items_serializer.is_valid(raise_exception=True)
                attendance_details_item_instance = attendance_items_serializer.create(
                    attendance_items_serializer.validated_data)

                attendance_items_ids.append(attendance_details_item_instance.id)
            else:
                # attendance_items_ids.append(item_data['id'])
                attendance_details_item_instance = AttendanceDetails.objects.get(id=item_data['id'])
                attendance_items_serializer = AttendanceDetailsSerializer(
                    instance=attendance_details_item_instance,
                    data=item_data,
                    context=self.context)
                attendance_items_serializer.is_valid(raise_exception=True)
                attendance_items_serializer.update(
                    attendance_details_item_instance,
                    attendance_items_serializer.validated_data)
        self._delete_attendance_detail_items(attendance_items_ids, attendance_instance)
        return True

    def _delete_attendance_detail_items(self, ids, attendance_details_item_instance):
        AttendanceDetails.objects.filter(attendance=attendance_details_item_instance).exclude(
            id__in=ids).delete()

    def to_internal_value(self, data):
        attendance_details = data.pop('attendance_details', [])
        if 'date' in data:
            data['date'] = data['date'] if data['date'] != "" else None
        validated_data = super().to_internal_value(data)
        validated_data['attendance_details'] = attendance_details
        return validated_data

    def validate_attendance_import(self, date, b_id, instance_id=None, **kwargs):
        if AttendanceImport.objects.filter(date=date, b_id=b_id).exclude(
                id=instance_id).exists():
            formatted_date = date.strftime('%B-%Y')
            raise serializers.ValidationError(f"An attendance record for this {formatted_date} already exists.")


class FinalSettlementEmployeeMonthlyAllowanceDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = FinalSettlementEmployeeMonthlyAllowanceDetails
        fields = [
            'id',
            'final_settlement',
            'components',
            'monthly',
        ]


class FinalSettlementEmployeeMonthlyDeductionDetailsSerializer(AuditModelMixinSerializer):
    class Meta:
        model = FinalSettlementEmployeeMonthlyDeductionDetails
        fields = [
            'id',
            'final_settlement',
            'components',
            'monthly',
        ]


class FinalSettlementSerializer(AuditModelMixinSerializer):
    date_of_resignation_lt_received = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'],
                                                            allow_null=True)
    dor = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    final_settlement_deduction = EmployeeMonthlyDeductionDetailsSerializer(many=True, required=False)
    final_settlement_allowance = EmployeeMonthlyAllowanceDetailsSerializer(many=True, required=False)

    class Meta:
        model = FinalSettlement
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        # print("department_name", department_name)
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        # print("b_id", b_id)
        final_settlement_deduction = validated_data.pop('final_settlement_deduction', [])
        final_settlement_allowance = validated_data.pop('final_settlement_allowance', [])
        instance = super().create(validated_data)
        self._create_or_update_final_settlement_deduction(instance, final_settlement_deduction, request=request)
        self._create_or_update_final_settlement_allowance(instance, final_settlement_allowance, request=request)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')
        final_settlement_deduction = validated_data.pop('final_settlement_deduction', [])
        final_settlement_allowance = validated_data.pop('final_settlement_allowance', [])
        instance = super().update(instance, validated_data)
        self._create_or_update_final_settlement_deduction(instance, final_settlement_deduction, request=request)
        self._create_or_update_final_settlement_allowance(instance, final_settlement_allowance, request=request)
        return instance

    def to_internal_value(self, data):
        data = data.copy()
        final_settlement_deduction = data.pop('final_settlement_deduction', [])
        final_settlement_allowance = data.pop('final_settlement_allowance', [])

        # Handle specific fields
        for field in ['date_of_resignation_lt_received', 'dor']:
            if field in data:
                data[field] = data[field] if data[field] != "" else None

        # Default numeric fields to 0 if they are None or empty
        numeric_fields = ['gross_salary_month', 'net_salary_month','gross_salary_payable_days',
                          'deduction_total', 'allowance_total', 'total_payable_amount',
                          'gross_salary_payable_amount', 'salary_payable_days', 'gross_salary_payable_days'
                                                                                'earned_leaves_balance'
                          ]
        for field in numeric_fields:
            if data.get(field) is None or data.get(field) == '':
                data[field] = 0

        validated_data = super().to_internal_value(data)
        validated_data['final_settlement_deduction'] = final_settlement_deduction
        validated_data['final_settlement_allowance'] = final_settlement_allowance

        return validated_data

    def _create_or_update_final_settlement_deduction(self, employee_monthly_instance,
                                                     final_settlement_deduction_items_data, **kwargs):
        self.validate_duplicate_data(final_settlement_deduction_items_data)
        employee_deduction_items_ids = []
        for item_data in final_settlement_deduction_items_data:
            item_data['final_settlement'] = employee_monthly_instance.id
            self._advance_amount_update(item_data, employee_monthly_instance)
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                employee_deduction_items_serializer = FinalSettlementEmployeeMonthlyDeductionDetailsSerializer(
                    data=item_data, context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                final_settlement_deduction_item_instance = employee_deduction_items_serializer.create(
                    employee_deduction_items_serializer.validated_data)
                employee_deduction_items_ids.append(final_settlement_deduction_item_instance.id)
            else:
                # print("item_data['id']", item_data['id'])
                employee_deduction_items_ids.append(item_data['id'])
                employee_deduction_item_instance = FinalSettlementEmployeeMonthlyDeductionDetails.objects.get(
                    id=item_data['id'])
                employee_deduction_items_serializer = FinalSettlementEmployeeMonthlyDeductionDetailsSerializer(
                    instance=employee_deduction_item_instance, data=item_data, context=self.context)
                employee_deduction_items_serializer.is_valid(raise_exception=True)
                employee_deduction_items_serializer.update(employee_deduction_item_instance,
                                                           employee_deduction_items_serializer.validated_data)

        self._delete_deduction_detail_items(employee_deduction_items_ids, employee_monthly_instance)
        return True

    def _delete_deduction_detail_items(self, ids, employee_monthly_instance):
        FinalSettlementEmployeeMonthlyDeductionDetails.objects.filter(
            final_settlement=employee_monthly_instance).exclude(id__in=ids).delete()

    def _create_or_update_final_settlement_allowance(self, employee_monthly_instance,
                                                     final_settlement_allowance_items_data, **kwargs):
        self.validate_duplicate_data(final_settlement_allowance_items_data)
        employee_allowance_items_ids = []
        for item_data in final_settlement_allowance_items_data:

            item_data['final_settlement'] = employee_monthly_instance.id
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                employee_allowance_items_serializer = FinalSettlementEmployeeMonthlyAllowanceDetailsSerializer(
                    data=item_data, context=self.context)
                employee_allowance_items_serializer.is_valid(raise_exception=True)
                final_settlement_allowance_item_instance = employee_allowance_items_serializer.create(
                    employee_allowance_items_serializer.validated_data)
                employee_allowance_items_ids.append(final_settlement_allowance_item_instance.id)
            else:
                employee_allowance_items_ids.append(item_data['id'])
                employee_allowance_item_instance = FinalSettlementEmployeeMonthlyAllowanceDetails.objects.get(
                    id=item_data['id'])
                employee_allowance_items_serializer = FinalSettlementEmployeeMonthlyAllowanceDetailsSerializer(
                    instance=employee_allowance_item_instance, data=item_data, context=self.context)
                employee_allowance_items_serializer.is_valid(raise_exception=True)
                employee_allowance_items_serializer.update(employee_allowance_item_instance,
                                                           employee_allowance_items_serializer.validated_data)

        self._delete_final_settlement_allowance_detail_items(employee_allowance_items_ids, employee_monthly_instance)
        return True

    def _delete_final_settlement_allowance_detail_items(self, ids, employee_monthly_instance):
        FinalSettlementEmployeeMonthlyAllowanceDetails.objects.filter(
            final_settlement=employee_monthly_instance).exclude(id__in=ids).delete()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if instance.employee is not None:
            data['employee_name'] = instance.employee.first_name
            data['employee_code'] = instance.employee.employee_code
            data['first_name'] = instance.employee.first_name
            data['address'] = instance.employee.address
            data['department_name'] = instance.employee.department.department_name
            data['designation_name'] = instance.employee.designation.designation_name
            data['department_name'] = instance.employee.department.department_name
            data['grade_code'] = instance.employee.grade.grade_code

            data['employee_code'] = instance.employee.employee_code
            data['dob'] = instance.employee.dob.strftime('%d-%m-%Y') if instance.employee.dob else None
            data['doc'] = instance.employee.doc.strftime('%d-%m-%Y') if instance.employee.doc else None
            data['doj'] = instance.employee.doj.strftime('%d-%m-%Y') if instance.employee.doj else None
            # data['dor'] = instance.employee.dor.strftime('%d-%m-%Y') if instance.employee.dor else None
            data['default_employee_object'] = dict(
                employee_code=instance.employee.employee_code,
                first_name=instance.employee.first_name,
                id=instance.employee.id
            )
        if hasattr(instance, 'approval_status'):
            data['approvalStatus'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                                 instance.approval_status)
        return data

    def validate_duplicate_data(self, items_data):
        component_names = set()
        for item_data in items_data:
            if 'components' in item_data:
                component_name = item_data['components'].lower().strip()
                if component_name in component_names:
                    raise serializers.ValidationError(
                        {"components": f"Duplicate component '{component_name}' found. Each component must be unique."}
                    )
                component_names.add(component_name)

    def _advance_amount_update(self, items_data, employee_monthly_instance):
        if employee_monthly_instance.approval_status == "APPROVED":
            if 'components' in items_data and items_data['components'] == 'Salary Advance':
                Advance.objects.filter(employee=employee_monthly_instance.employee).update(
                    balance_loan_amount=0,
                    deduction_tenure_months=0,
                    emi=0
                )
            # Update the EmployeeMaster model
            EmployeeMaster.objects.filter(id=employee_monthly_instance.employee.id).update(
                dor=employee_monthly_instance.dor
            )

    # def validate_unique_department_name(self, department_name, b_id, instance_id=None, **kwargs):
    #     if Department.objects.filter(department_name__iexact=department_name, b_id=b_id).exclude(
    #             id=instance_id).exists():
    #         raise serializers.ValidationError(f"Department with name '{department_name}' already exists.")


class TaDaDetailsImagesSerializer(AuditModelMixinSerializer):
    class Meta:
        model = TaDaDetailsImages
        fields = [
            'id',
            'tada_details',
            'file',
            'file_name',
            'size',
            'file_type'
        ]

    def to_internal_value(self, data):
        file = data.pop('file', None)
        if data.get('file_type'):
            data['file_type'] = data.get('file_type')
        else:
            raise serializers.ValidationError({"file_type": "file_type required"})
        if data.get('file_name'):
            data['file_name'] = data.get('file_name')
        else:
            raise serializers.ValidationError({"file_name": "file_name required"})
        validated_data = super().to_internal_value(data)
        if file is not None:
            data['file'] = file
            file = self.check_image(data)
            # if data['file_type'] not in ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            if data['file_type'] in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
                validated_data['file'] = ImageCompressionService.compress_image_to_jpg(self, image_data=file,
                                                                                       max_size=0.5 * 1024 * 1024)
            else:
                validated_data['file'] = file
        return validated_data

    def check_image(self, image):
        if 'file' in image and isinstance(image, dict):
            file_content = image['file']
            if isinstance(file_content, str) and ';base64,' in file_content:
                # file_name = image['file_name'] if 'file_name' in image else 'image.png'
                # file_type = image['file_type'] if 'file_type' in image else 'image/png'
                image_file = ImageConversion().convert_base64(image['file'], image['file_name'], image['file_type'])
                return image_file
            else:
                return None


class TaDaDetailsSerializer(AuditModelMixinSerializer):
    tada_details_images = TaDaDetailsImagesSerializer(many=True, required=False)

    class Meta:
        model = TaDaDetails
        fields = [
            'id',
            'tada',
            'expense_name',
            'from_date',
            'to_date',
            'cost',
            'tada_details_images'
        ]

    def to_internal_value(self, data):
        # Handling null values - child table
        # if 'from_date' in data:
        data['from_date'] = data.get('from_date') if data.get('from_date', None) else None
        # if 'to_date' in data:
        data['to_date'] = data.get('to_date') if data.get('to_date', None) else None
        # if 'cost' in data:
        # data['cost'] = data['cost'] if data['cost'] != "" else 0
        data['cost'] = float(data.get('cost')) if data.get('cost', 0) else 0
        validated_data = super().to_internal_value(data)
        return validated_data


class TaDaSerializer(AuditModelMixinSerializer, ApprovalModelMixinSerializer):
    tada_details = TaDaDetailsSerializer(many=True, required=False)

    class Meta:
        model = TaDa
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        user = self.context.get('request').user
        try:
            validated_data['tada_number'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.TA_DA_NUMBER)
        except Exception as e:
            raise serializers.ValidationError("App key: TA_DA_NUMBER does not exist")
        # tada_details = self.initial_data.get('tada_details', [])
        tada_details = validated_data.pop('tada_details', [])
        instance = super().create(validated_data)
        self._create_or_update_tada_details(instance, tada_details, request=request)
        # CREATE NOTIFICATION (best-effort - no-op if the host has no notifications app)
        create_optional_approval_notification(
            user=user.id,
            request_type="Tada",
            subject=f"TaDa request from {instance.employee.first_name}",
            message=f"TaDa request on {instance.created} by {instance.employee.first_name} is pending for Approval",
            form_id=instance.id,
            context=self.context,
        )
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # tada_details = self.initial_data.get('tada_details', [])
        tada_details = validated_data.pop('tada_details', [])
        instance = super().update(instance, validated_data)
        self._create_or_update_tada_details(instance, tada_details, request=request)
        return instance

    def _create_or_update_tada_details(self, tada_instance, tada_details_items_data, **kwargs):
        tada_ids = []
        for item_data in tada_details_items_data:
            if item_data['from_date'] and item_data['to_date']:
                if item_data['from_date'] > item_data['to_date']:
                    raise serializers.ValidationError(
                        {'date': f"{item_data['expense_name']} From Date should be earlier than To Date"})
            if not item_data['cost']:
                raise serializers.ValidationError(
                    {'cost': f"{item_data['expense_name']} cost cannot be empty or zero"})
            tada_details_images = item_data.pop('tada_details_images', [])
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['tada'] = tada_instance.id
                tada_details_serializer = TaDaDetailsSerializer(data=item_data, context=self.context)
                tada_details_serializer.is_valid(raise_exception=True)
                tada_details_instance = tada_details_serializer.create(
                    tada_details_serializer.validated_data)
                tada_ids.append(tada_details_instance.id)
                self._create_or_update_tada_details_images(tada_details_instance, tada_details_images)

            else:
                tada_ids.append(item_data['id'])
                tada_details_instance = TaDaDetails.objects.get(
                    id=item_data['id'])
                tada_details_serializer = TaDaDetailsSerializer(
                    instance=tada_details_instance,
                    data=item_data,
                    context=self.context)
                tada_details_serializer.is_valid(raise_exception=True)
                tada_details_serializer.update(
                    tada_details_instance,
                    tada_details_serializer.validated_data)
                self._create_or_update_tada_details_images(tada_details_instance, tada_details_images)
        self._delete_tada_details(tada_ids, tada_instance)
        return True

    def _delete_tada_details(self, ids, tada_instance):
        TaDaDetails.objects.filter(tada=tada_instance).exclude(
            id__in=ids).delete()

    def _create_or_update_tada_details_images(self, tada_details_instance, tada_details_images_items_data, **kwargs):
        tada_details_ids = []
        for item_data in tada_details_images_items_data:
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['tada_details'] = tada_details_instance.id
                tada_details_images_serializer = TaDaDetailsImagesSerializer(data=item_data, context=self.context)
                tada_details_images_serializer.is_valid(raise_exception=True)
                tada_details_images_instance = tada_details_images_serializer.create(
                    tada_details_images_serializer.validated_data)
                tada_details_ids.append(tada_details_images_instance.id)
            else:
                tada_details_ids.append(item_data['id'])
                # tada_details_images_instance = TaDaDetailsImages.objects.get(id=item_data['id'])
                # tada_details_images_serializer = TaDaDetailsImagesSerializer(
                #     instance=tada_details_images_instance,
                #     data=item_data,
                #     context=self.context)
                # tada_details_images_serializer.is_valid(raise_exception=True)
                # tada_details_images_serializer.update(
                #     tada_details_images_instance, tada_details_images_serializer.validated_data)
        self._delete_tada_details_images(tada_details_ids, tada_details_instance)
        return True

    def _delete_tada_details_images(self, ids, tada_details_instance):
        TaDaDetailsImages.objects.filter(tada_details=tada_details_instance).exclude(
            id__in=ids).delete()

    def to_internal_value(self, data):
        if 'travel_planning' in data:
            data['travel_planning'] = data['travel_planning'] if data['travel_planning'] != "" else []
        tada_details = data.pop('tada_details', [])
        validated_data = super().to_internal_value(data)
        validated_data['tada_details'] = tada_details
        return validated_data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        get_by_id = True if request and 'required_fields' not in request.query_params else False
        if get_by_id:
            if instance.employee is not None:
                data['employee_default_object'] = dict(
                    first_name=instance.employee.first_name,
                    designation_name=instance.employee.designation.designation_name,
                    department_name=instance.employee.department.department_name,
                    employee_code=instance.employee.employee_code,
                    id=instance.employee.id
                )
        if instance.employee is not None:
            data['employeeCode'] = instance.employee.employee_code
        # status
        if hasattr(instance, 'approval_status'):
            data['approvalStatus'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(instance.approval_status,
                                                                                 instance.approval_status)
        return data


class TravelPlanningSerializer(AuditModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    class Meta:
        model = TravelPlanning
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        try:
            validated_data['plan_number'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.TRAVEL_PLANNING)
        except Exception as e:
            raise serializers.ValidationError("App key: TRAVEL_PLANNING does not exist")
        instance = super().create(validated_data)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance = super().update(instance, validated_data)
        return instance

    def to_internal_value(self, data):
        if 'from_date' in data:
            data['from_date'] = data['from_date'] if data['from_date'] != "" else None
        if 'to_date' in data:
            data['to_date'] = data['to_date'] if data['to_date'] != "" else None
        validated_data = super().to_internal_value(data)
        return validated_data


class TravelPlanningLogSerializer(AuditModelMixinSerializer):
    checkin_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    checkin_time = serializers.TimeField(format='%H:%M:%S', input_formats=['%H:%M:%S'], allow_null=True, required=False)
    checkout_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True,
                                          required=False)
    checkout_time = serializers.TimeField(format='%H:%M:%S', input_formats=['%H:%M:%S'], allow_null=True,
                                          required=False)
    breakin_time = serializers.TimeField(format='%H:%M:%S', input_formats=['%H:%M:%S'], allow_null=True, required=False)
    breakout_time = serializers.TimeField(format='%H:%M:%S', input_formats=['%H:%M:%S'], allow_null=True,
                                          required=False)

    class Meta:
        model = TravelPlanningLog
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        hrm_service = importlib.import_module('hrm_main.api.service')
        validate_log_signal = hrm_service.HRMSignal
        validate_log_signal.validate_checkin(validated_data)
        instance = super().create(validated_data)
        return instance

    def update(self, instance, validated_data):
        request = self.context.get('request')
        hrm_service = importlib.import_module('hrm_main.api.service')
        validate_log_signal = hrm_service.HRMSignal
        validate_log_signal.validate_checkin_breakin(validated_data, instance)
        try:
            if validated_data.get('checkout_flag') == False and validated_data.get('breakout_flag') == True:
                validated_data['total_break_time'] = validate_log_signal.break_timing(validated_data, instance)
            if validated_data.get('checkout_flag') == True:
                validated_data['total_log_time'] = validate_log_signal.total_timing(validated_data, instance)
                if (validated_data.get('travel_planning').id) not in ["", None]:
                    travel_plan_instance = TravelPlanning.objects.get(
                        id=validated_data.get('travel_planning').id)
                    travel_plan_instance.total_distance = validate_log_signal.calculate_total_distance(validated_data,
                                                                                                       instance)
                    travel_plan_instance.save()
        except Exception as e:
            raise serializers.ValidationError("Error", e)

        instance = super().update(instance, validated_data)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.travel_planning is not None:
            data['plan_number'] = instance.travel_planning.plan_number
            data['place_name'] = instance.travel_planning.place_name
        return data

    def to_internal_value(self, data):
        self.validate_file(data=data)
        data = data.copy()
        data = convert_form_data(data)
        checkin_photo = data.pop('checkin_photo', None)
        checkout_photo = data.pop('checkout_photo', None)
        if 'checkin_date' in data:
            data['checkin_date'] = data['checkin_date'] if data['checkin_date'] != "" else None
        if 'checkin_time' in data:
            data['checkin_time'] = data['checkin_time'] if data['checkin_time'] != "" else None
        if 'checkout_date' in data:
            data['checkout_date'] = data['checkout_date'] if data['checkout_date'] != "" else None
        if 'checkout_time' in data:
            data['checkout_time'] = data['checkout_time'] if data['checkout_time'] != "" else None
        if 'breakin_time' in data:
            data['breakin_time'] = data['breakin_time'] if data['breakin_time'] != "" else None
        if 'breakout_time' in data:
            data['breakout_time'] = data['breakout_time'] if data['breakout_time'] != "" else None

        validated_data = super().to_internal_value(data)
        if checkin_photo not in ["", None]:
            validated_data['checkin_photo'] = ImageCompressionService.compress_image_to_jpg(self,
                                                                                            image_data=checkin_photo,
                                                                                            max_size=0.5 * 1024 * 1024)
        if checkout_photo not in ["", None]:
            validated_data['checkout_photo'] = ImageCompressionService.compress_image_to_jpg(self,
                                                                                             image_data=checkout_photo,
                                                                                             max_size=0.5 * 1024 * 1024)
        return validated_data

    def validate_file(self, data):
        file_fields = ['checkin_photo', 'checkout_photo']

        for field in file_fields:
            file = data.get(field)
            if file and file.size > 6 * 1024 * 1024:  # 6 MB
                raise serializers.ValidationError(
                    {field: f"{field.replace('_', ' ').title()} size must be 6MB or less."})
        return data


class AttendanceStatusMasterSerializer(AuditModelMixinSerializer):
    class Meta:
        model = AttendanceStatusMaster
        fields = '__all__'

    def create(self, validated_data):
        instance = super().create(validated_data)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.code == '-1':
            data['disabled'] = True
        return data


class GraceDetailsSerializer(AuditModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    shift_name = serializers.CharField(source='shift.shift_name', read_only=True, allow_null=True, default=None)

    class Meta:
        model = GraceDetails
        fields = '__all__'

    def to_internal_value(self, data):
        fields_to_check = [
            "min_work_mins", "max_work_mins", "break_time",
            "max_day_ot_mins", "max_night_ot_mins", "weekly_off_work_mins",
            "wo_max_day_ot_mins", "wo_max_night_ot_mins", "total_work_hours", "wo_break_time"
        ]

        if not data['from_date']:
            data['from_date'] = None
        if not data['to_date']:
            data['to_date'] = None

        for field in fields_to_check:
            if data.get(field) in [None, ""]:
                data[field] = 0
        validated_data = super().to_internal_value(data)
        return validated_data

    def validate(self, data):
        b_id = getattr(self.context['request'], 'b_id', None) or self.context['request'].query_params.get('b_id')

        type = data.get('type')
        from_date = data.get('from_date')
        to_date = data.get('to_date')
        emp_type = data.get('emp_type')
        emp_group = data.get('emp_group')
        emp_reporting = data.get('emp_reporting')

        queryset = GraceDetails.objects.filter(
            type=type,
            from_date=from_date,
            to_date=to_date,
            emp_type=emp_type,
            emp_group=emp_group,
            emp_reporting=emp_reporting,
            shift_id=data.get('shift'),
            b_id=b_id
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                "non_field_errors": "A record with the same type, date range, employee type, group, and reporting already exists."
            })

        return data


class DisciplinaryActionSerializer(AuditModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    to_date   = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True, required=False)
    employee_name = serializers.CharField(source='employee.first_name', read_only=True, allow_null=True, default=None)
    employee_code = serializers.CharField(source='employee.employee_code', read_only=True, allow_null=True, default=None)

    class Meta:
        model  = DisciplinaryAction
        fields = '__all__'
        read_only_fields = ('reference_no', 'affects_pay')

    def to_internal_value(self, data):
        # Extract attachment BEFORE super() â€” same pattern as EmployeeMasterSerializer
        # DRF merges request.FILES into request.data for multipart, so data.get gives the file object
        attachment = data.get('attachment', None)

        # Make data mutable if it's a QueryDict
        if hasattr(data, '_mutable'):
            data._mutable = True
        data.pop('attachment', None)

        validated_data = super().to_internal_value(data)

        # Put file back into validated_data only if it's a real uploaded file
        if attachment and hasattr(attachment, 'read'):
            validated_data['attachment'] = attachment
        # else: don't touch it â€” instance's existing file is preserved by DRF partial update

        return validated_data

    def validate(self, data):
        penalty_type = data.get('penalty_type', getattr(self.instance, 'penalty_type', None))
        if penalty_type in DisciplinaryAction.AFFECTS_PAY_PENALTIES:
            if not data.get('from_date') and not getattr(self.instance, 'from_date', None):
                raise serializers.ValidationError({'from_date': 'From date is required for this penalty type.'})
            if not data.get('to_date') and not getattr(self.instance, 'to_date', None):
                raise serializers.ValidationError({'to_date': 'To date is required for this penalty type.'})
        return data

    def update(self, instance, validated_data):
        import logging
        # If no new file uploaded, preserve existing attachment
        if 'attachment' not in validated_data:
            validated_data['attachment'] = instance.attachment
        prev_approval_status = instance.approval_status
        instance = super().update(instance, validated_data)
        instance.refresh_from_db()

        just_approved = (
            prev_approval_status != ApprovalModelMixin.APPROVED
            and instance.approval_status == ApprovalModelMixin.APPROVED
        )
        just_rejected = (
            prev_approval_status == ApprovalModelMixin.APPROVED
            and instance.approval_status == ApprovalModelMixin.REJECTED
        )

        trigger = (just_approved or just_rejected) and instance.affects_pay and instance.from_date and instance.to_date
        if trigger:
            from datetime import date as _date
            today = _date.today()
            # Only process dates up to today â€” no point running for future dates
            effective_end = min(instance.to_date, today)
            if instance.from_date <= effective_end:
                start_str = instance.from_date.strftime('%Y-%m-%d')
                end_str   = effective_end.strftime('%Y-%m-%d')
                emp_code  = instance.employee.employee_code if instance.employee else None

                def _run_device_attendance():
                    try:
                        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
                        transfer_attendance_details(start_date=start_str, end_date=end_str, employee_codes=[emp_code])
                    except Exception as e:
                        logging.getLogger(__name__).error(f'[DISCIPLINARY] transfer_attendance_details failed: {e}')

                from django.db import transaction
                transaction.on_commit(_run_device_attendance)

        return instance


class HistoricalAttendanceDetailsSerializer(AuditModelMixinSerializer):
    date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    class Meta:
        model = AttendanceDetails.history.model
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['converted_date'] = instance.date.strftime("[%a], %Y-%m-%d")
        data = AttendanceDetailsSerializer().return_converted_data(data)
        shift_obj = ShiftTimings.objects.filter(shift_code=data['shift']).first()
        if shift_obj:
            data['shift_name'] = shift_obj.shift_name
        status_exists = AttendanceStatusMaster.objects.filter(code=data['status']).first()
        if status_exists:
            data['status'] = status_exists.status_name

        if isinstance(data['history_date'], str):
            parsed_date = parser.parse(data['history_date'])
            data['history_date'] = parsed_date.strftime('%d-%m-%Y %I:%M %p')
        data['history_type'] = self.get_history_action_text(data['history_type'])
        if instance.history_user:
            data['history_user'] = instance.history_user.first_name
        else:
            data['history_user'] = "Unknown User"
        return data

    def get_history_action_text(self, history_type):
        if history_type == '+':
            return "Created"
        elif history_type == '~':
            return "Updated"
        elif history_type == '-':
            return "Deleted"
        else:
            return "Unknown action"


class OTEmployeeListSerializer(AuditModelMixinSerializer):
    class Meta:
        model = OTEmployeeList
        fields = '__all__'


class OTSalaryCalculationSerializer(AuditModelMixinSerializer, ApprovalModelMixinSerializer):
    from_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    to_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)
    ot_employee_list = OTEmployeeListSerializer(many=True, required=False)

    class Meta:
        model = OTSalaryCalculation
        fields = '__all__'

    def create(self, validated_data):
        master_service = importlib.import_module('hrm_master.api.service')
        master_signal = master_service.MasterSignal
        master_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])
        try:
            validated_data['ot_payroll_number'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.OT_PAYROLL_NUMBER)
        except Exception:
            raise serializers.ValidationError("App key: OT_PAYROLL_NUMBER does not exist")
        ot_employee_list = self.initial_data.pop('ot_employee_list', [])
        validated_data.pop('ot_employee_list', None)
        instance = super().create(validated_data)
        self._save_ot_employee_list(instance, ot_employee_list)
        return instance

    def update(self, instance, validated_data):
        master_service = importlib.import_module('hrm_master.api.service')
        master_signal = master_service.MasterSignal
        master_signal.validate_dates(validated_data['from_date'], validated_data['to_date'])
        ot_employee_list = self.initial_data.pop('ot_employee_list', [])
        validated_data.pop('ot_employee_list', None)
        instance = super().update(instance, validated_data)
        self._save_ot_employee_list(instance, ot_employee_list)
        return instance

    def to_representation(self, instance):
        import re
        data = super().to_representation(instance)
        if hasattr(instance, 'approval_status'):
            data['status'] = ApprovalModelMixin.APPROVAL_STATUS_DICT.get(
                instance.approval_status, instance.approval_status)

        # Strip "(email)" suffix from user_created â€” show name only
        if data.get('user_created'):
            data['user_created'] = re.sub(r'\s*\(.*?\)\s*$', '', data['user_created']).strip()

        # Reconstruct frontend display fields from filter_type + filter_value (comma-sep IDs)
        filter_type  = instance.filter_type  or ''
        filter_value = instance.filter_value or ''
        ids = [v.strip() for v in filter_value.split(',') if v.strip()]

        data['filter_employee']        = ''
        data['filter_employee_ids']    = ''
        data['filter_designation']     = ''
        data['filter_designation_ids'] = ''
        data['filter_department']      = ''
        data['filter_department_ids']  = ''

        if ids:
            if filter_type == 'Individual':
                from hrm_master.models import EmployeeMaster
                emps = EmployeeMaster.objects.filter(id__in=ids).values('id', 'employee_code', 'first_name', 'last_name')
                data['filter_employee']     = ', '.join(
                    f"{e['employee_code']} - {e['first_name']} {e['last_name']}".strip() for e in emps)
                data['filter_employee_ids'] = ','.join(str(e['id']) for e in emps)

            elif filter_type == 'Designation':
                from hrm_master.models import Designation
                desigs = Designation.objects.filter(id__in=ids).values('id', 'designation_name')
                data['filter_designation']     = ', '.join(d['designation_name'] for d in desigs)
                data['filter_designation_ids'] = ','.join(str(d['id']) for d in desigs)

            elif filter_type == 'Department':
                from hrm_master.models import Department
                depts = Department.objects.filter(id__in=ids).values('id', 'department_name')
                data['filter_department']     = ', '.join(d['department_name'] for d in depts)
                data['filter_department_ids'] = ','.join(str(d['id']) for d in depts)

        return data

    def _save_ot_employee_list(self, ot_salary_instance, ot_employee_list_data):
        saved_ids = []
        for item_data in ot_employee_list_data:
            if 'id' in item_data and isinstance(item_data['id'], str):
                item_data.pop('id')
                item_data['ot_salary'] = ot_salary_instance.id
                ser = OTEmployeeListSerializer(data=item_data, context=self.context)
                ser.is_valid(raise_exception=True)
                new_instance = ser.create(ser.validated_data)
                saved_ids.append(new_instance.id)
            else:
                item_id = item_data.get('id')
                if not item_id:
                    continue
                saved_ids.append(item_id)
                try:
                    emp_instance = OTEmployeeList.objects.get(id=item_id)
                    ser = OTEmployeeListSerializer(emp_instance, data=item_data, context=self.context)
                    ser.is_valid(raise_exception=True)
                    ser.update(emp_instance, ser.validated_data)
                except OTEmployeeList.DoesNotExist:
                    pass
        OTEmployeeList.objects.filter(ot_salary=ot_salary_instance).exclude(id__in=saved_ids).delete()


class ExpenseClaimCategorySerializer(AuditModelMixinSerializer):

    class Meta:
        model = ExpenseClaimCategory
        fields = '__all__'

    def create(self, validated_data):
        try:
            validated_data['code'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.EXPENSE_CLAIM_CATEGORY_CODE
            )
        except Exception:
            raise serializers.ValidationError("App key: EXPENSE_CLAIM_CATEGORY_CODE does not exist")

        return super().create(validated_data)

    def validate_code(self, value):
        if value:
            value = value.strip().upper()

            qs = ExpenseClaimCategory.objects.filter(
                code__iexact=value
            )

            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError(
                    'Expense claim category code already exists.'
                )

        return value


class ExpenseClaimLinkTypeSerializer(AuditModelMixinSerializer):

    content_type_label = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseClaimLinkType
        fields = '__all__'

    def get_content_type_label(self, obj):
        if not obj.content_type:
            return ''

        return f'{obj.content_type.app_label} | {obj.content_type.model}'


class ExpenseClaimLineSerializer(AuditModelMixinSerializer):


    expense_date = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=[
            '%d-%m-%Y',
            '%Y-%m-%d',
            'iso-8601'
        ],
        allow_null=True,
        required=False
    )


    linked_object_display = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = ExpenseClaimLine
        fields = '__all__'

    def get_linked_object_display(self, obj):
        if not obj.linked_object:
            return ''

        if obj.link_type and obj.link_type.display_field:
            value = getattr(
                obj.linked_object,
                obj.link_type.display_field,
                None
            )

            if value is not None:
                return str(value)

        return str(obj.linked_object)



    def to_internal_value(self, data):

        data = data.copy()

        if 'expense_date' in data:
            data['expense_date'] = (
                data['expense_date']
                if data['expense_date']
                not in ['', None, 'null']
                else None
            )

        if 'amount' in data:
            data['amount'] = (
                data['amount']
                if data['amount']
                not in ['', None, 'null']
                else 0
            )

        if 'receipt_attached' in data:
            data['receipt_attached'] = (
                data['receipt_attached']
                if data['receipt_attached']
                not in ['', None, 'null']
                else False
            )

        if 'link_type' in data:
            data['link_type'] = (
                data['link_type']
                if data['link_type']
                not in ['', None, 'null']
                else None
            )

        if 'linked_object_id' in data:
            data['linked_object_id'] = (
                data['linked_object_id']
                if data['linked_object_id']
                not in ['', None, 'null']
                else None
            )

        return super().to_internal_value(data)
        
    def validate(self, attrs):
        instance = self.instance

        claim = attrs.get(
            'claim',
            instance.claim if instance else None
        )

        expense_date = attrs.get(
            'expense_date',
            instance.expense_date if instance else None
        )

        category = attrs.get(
            'category',
            instance.category if instance else None
        )

        amount = attrs.get(
            'amount',
            instance.amount if instance else None
        )

        receipt_attached = attrs.get(
            'receipt_attached',
            instance.receipt_attached if instance else False
        )

        link_type = attrs.get(
            'link_type',
            instance.link_type if instance else None
        )

        linked_object_id = attrs.get(
            'linked_object_id',
            instance.linked_object_id if instance else None
        )

        # Amount validation
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({
                'amount': 'Amount must be greater than zero.'
            })

        # Expense date must fall inside claim period
        if claim and expense_date:

            if claim.period_from and expense_date < claim.period_from:
                raise serializers.ValidationError({
                    'expense_date':
                        'Expense date cannot be before Period From.'
                })

            if claim.period_to and expense_date > claim.period_to:
                raise serializers.ValidationError({
                    'expense_date':
                        'Expense date cannot be after Period To.'
                })

        # Receipt required based on category
        if (
            category
            and category.requires_receipt
            and not receipt_attached
        ):
            raise serializers.ValidationError({
                'receipt_attached':
                    'Receipt is required for this expense category.'
            })

        # Dynamic linked object
        if link_type and linked_object_id:

            content_type = link_type.content_type

            if not content_type:
                raise serializers.ValidationError({
                    'link_type':
                        'Content type is not configured for this link type.'
                })

            model_class = content_type.model_class()

            if model_class is None:
                raise serializers.ValidationError({
                    'link_type':
                        'Configured content type is invalid.'
                })

            if not model_class.objects.filter(
                pk=linked_object_id
            ).exists():
                raise serializers.ValidationError({
                    'linked_object_id':
                        'Selected linked record does not exist.'
                })

            # Do not trust frontend for content type.
            attrs['linked_content_type'] = content_type

        elif not link_type:
            attrs['linked_content_type'] = None
            attrs['linked_object_id'] = None

        return attrs


    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Category display
        data['category_name'] = (
            instance.category.name
            if instance.category else ''
        )

        # Link Type display
        data['link_type_label'] = (
            instance.link_type.label
            if instance.link_type else ''
        )

        # Needed when editing existing line and opening Linked Object popup
        data['link_search_url'] = (
            instance.link_type.search_url
            if instance.link_type else ''
        )

        data['link_display_field'] = (
            instance.link_type.display_field
            if instance.link_type else ''
        )

        return data
        
class ExpenseClaimAttachmentSerializer(AuditModelMixinSerializer):

    file_url = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = ExpenseClaimAttachment
        fields = '__all__'


    def to_internal_value(self, data):
        file = data.get('file', None)

        if file is not None:
            # If your existing project requires image conversion,
            # same LOA utility can be used here.
            data['file'] = ImageConversion().check_image(data)

        return super().to_internal_value(data)


    def validate(self, attrs):
        file = attrs.get('file')

        if file and file.size > 12 * 1024 * 1024:
            raise serializers.ValidationError({
                'file': 'File size must be 12MB or less.'
            })

        return super().validate(attrs)


    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get('request')

        if request:
            return request.build_absolute_uri(
                obj.file.url
            )

        return obj.file.url


class ExpenseClaimSerializer(ApprovalModelMixinSerializer,AuditModelMixinSerializer):


    period_from = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y'],
        allow_null=True,
        required=False
    )

    period_to = serializers.DateField(
        format='%d-%m-%Y',
        input_formats=['%d-%m-%Y'], 
        allow_null=True, 
        required=False
    )


    # --------------------------------------------------
    # CHILD TABLES
    # --------------------------------------------------
    lines = ExpenseClaimLineSerializer(
        many=True,
        required=False
    )

    attachments = ExpenseClaimAttachmentSerializer(
        many=True,
        required=False
    )


    class Meta:
        model = ExpenseClaim
        fields = '__all__'


    # --------------------------------------------------
    # MAIN VALIDATION
    # --------------------------------------------------
    def validate(self, attrs):

        instance = self.instance

        period_from = attrs.get(
            'period_from',
            instance.period_from if instance else None
        )

        period_to = attrs.get(
            'period_to',
            instance.period_to if instance else None
        )

        advance_amount = attrs.get(
            'advance_amount',
            instance.advance_amount
            if instance
            else Decimal('0.00')
        )

        # Period validation
        if (
            period_from
            and period_to
            and period_from > period_to
        ):
            raise serializers.ValidationError({
                'period_to':
                    'Period To cannot be before Period From.'
            })

        # Advance amount validation
        if (
            advance_amount is not None
            and advance_amount < 0
        ):
            raise serializers.ValidationError({
                'advance_amount':
                    'Advance amount cannot be negative.'
            })


            

        return attrs


    
    def create(self, validated_data):

        child_table_keys = [
            'lines',
            'attachments',
        ]

        validated_data, child_table_data = (
            DefaultValue().pop_keys(
                validated_data,
                child_table_keys,
                []
            )
        )

        try:
            validated_data['claim_no'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.EXPENSE_CLAIM_NUMBER
            )
        except Exception:
            raise serializers.ValidationError("App key: EXPENSE_CLAIM_NUMBER does not exist")

        # Create parent claim first
        instance = super().create(
            validated_data
        )

        # Create child rows
        self._child_tables(
            instance=instance,
            child_table_data=child_table_data
        )

        # Recalculate totals after lines are saved
        self._recalculate_totals(
            instance
        )

        return instance


    # --------------------------------------------------
    # UPDATE
    # Same child-table pattern as LOA
    # --------------------------------------------------
    def update(
        self,
        instance,
        validated_data
    ):

        child_table_keys = [
            'lines',
            'attachments',
        ]

        validated_data, child_table_data = (
            DefaultValue().pop_keys(
                validated_data,
                child_table_keys,
                []
            )
        )

        # Update parent
        instance = super().update(
            instance,
            validated_data
        )

        # Update child rows
        self._child_tables(
            instance=instance,
            child_table_data=child_table_data
        )

        # Recalculate totals
        self._recalculate_totals(
            instance
        )

        return instance


    # --------------------------------------------------
    # CHILD TABLE HANDLER
    # --------------------------------------------------
    def _child_tables(
        self,
        instance,
        child_table_data
    ):

        for item in child_table_data:

            # -----------------------------
            # Expense Lines
            # -----------------------------
            if (
                item['key'] == 'lines'
                and item['is_present']
            ):
                self._create_or_update_lines(
                    instance,
                    item['data']
                )

            # -----------------------------
            # Attachments
            # -----------------------------
            if (
                item['key'] == 'attachments'
                and item['is_present']
            ):
                self._create_or_update_attachments(
                    instance,
                    item['data']
                )


    # --------------------------------------------------
    # CREATE / UPDATE EXPENSE LINES
    # --------------------------------------------------
    def _create_or_update_lines(
        self,
        claim_instance,
        lines_data,
        **kwargs
    ):

        line_ids = []

        for item_data in lines_data:

            item_id = item_data.get('id')

            # ------------------------------------------
            # NEW ROW
            # frontend table temp ID may be string
            # ------------------------------------------
            if (
                item_id is None
                or isinstance(item_id, str)
            ):

                item_data.pop(
                    'id',
                    None
                )

                item_data['claim'] = (
                    claim_instance.id
                )

                serializer = (
                    ExpenseClaimLineSerializer(
                        data=item_data,
                        context=self.context
                    )
                )

                serializer.is_valid(
                    raise_exception=True
                )

                line_instance = serializer.create(
                    serializer.validated_data
                )

                line_ids.append(
                    line_instance.id
                )

            # ------------------------------------------
            # EXISTING ROW
            # ------------------------------------------
            else:

                line_ids.append(
                    item_id
                )

                line_instance = (
                    ExpenseClaimLine.objects.get(
                        id=item_id,
                        claim=claim_instance
                    )
                )

                serializer = (
                    ExpenseClaimLineSerializer(
                        instance=line_instance,
                        data=item_data,
                        context=self.context
                    )
                )

                serializer.is_valid(
                    raise_exception=True
                )

                serializer.update(
                    line_instance,
                    serializer.validated_data
                )

        # Remove deleted rows
        self._delete_lines(
            line_ids,
            claim_instance
        )

        return True


    def _delete_lines(
        self,
        ids,
        claim_instance
    ):

        ExpenseClaimLine.objects.filter(
            claim=claim_instance
        ).exclude(
            id__in=ids
        ).delete()


    # --------------------------------------------------
    # CREATE / UPDATE ATTACHMENTS
    # Exact LOA File Upload pattern
    # --------------------------------------------------
    def _create_or_update_attachments(
        self,
        claim_instance,
        attachments_data,
        **kwargs
    ):

        attachment_ids = []

        for item_data in attachments_data:

            item_id = item_data.get('id')

            # ------------------------------------------
            # NEW FILE
            # ------------------------------------------
            if (
                item_id is None
                or isinstance(item_id, str)
            ):

                item_data.pop(
                    'id',
                    None
                )

                item_data['claim'] = (
                    claim_instance.id
                )

                serializer = (
                    ExpenseClaimAttachmentSerializer(
                        data=item_data,
                        context=self.context
                    )
                )

                serializer.is_valid(
                    raise_exception=True
                )

                attachment_instance = (
                    serializer.create(
                        serializer.validated_data
                    )
                )

                attachment_ids.append(
                    attachment_instance.id
                )

            # ------------------------------------------
            # EXISTING FILE
            # ------------------------------------------
            else:

                attachment_ids.append(
                    item_id
                )

        # Delete removed files
        self._delete_attachments(
            attachment_ids,
            claim_instance
        )

        return True


    def _delete_attachments(
        self,
        ids,
        claim_instance
    ):

        ExpenseClaimAttachment.objects.filter(
            claim=claim_instance
        ).exclude(
            id__in=ids
        ).delete()


    # --------------------------------------------------
    # TOTAL CALCULATION
    # Backend is source of truth
    # --------------------------------------------------
    def _recalculate_totals(
        self,
        instance
    ):

        total_claimed = (
            instance.lines.aggregate(
                total=Sum('amount')
            ).get('total')
            or Decimal('0.00')
        )

        advance_amount = (
            instance.advance_amount
            or Decimal('0.00')
        )

        net_payable = (
            total_claimed
            - advance_amount
        )

        excess_to_return = (
            abs(net_payable)
            if net_payable < 0
            else Decimal('0.00')
        )

        instance.total_claimed = (
            total_claimed
        )

        instance.net_payable = (
            net_payable
        )

        instance.excess_to_return = (
            excess_to_return
        )

        instance.save(
            update_fields=[
                'total_claimed',
                'net_payable',
                'excess_to_return',
            ]
        )

        return instance


    # --------------------------------------------------
    # FORM DATA HANDLING
    # Important for CarouselField / multipart form data
    # Same pattern as LOA
    # --------------------------------------------------
    def to_internal_value(
        self,
        data
    ):

        data = data.copy()

        # Carousel / multipart child-table conversion
        data = convert_form_data(
            data
        )

        child_table_keys = [
            'lines',
            'attachments',
        ]

        data, child_table_data = (
            DefaultValue().pop_keys(
                data,
                child_table_keys,
                []
            )
        )

        # Decimal fields
        for field in (
            'advance_amount',
            'total_claimed',
            'net_payable',
            'excess_to_return',
        ):

            if data.get(field) in (
                '',
                None,
                'null',
            ):
                data[field] = 0

        # Date fields
        for field in (
            'period_from',
            'period_to',
            'payment_date',
        ):

            if data.get(field) in (
                '',
                'null',
            ):
                data[field] = None

        validated_data = (
            super().to_internal_value(
                data
            )
        )

        # Put child data back into validated_data
        validated_data = (
            DefaultValue().add_keys(
                validated_data,
                child_table_data
            )
        )

        return validated_data


    # --------------------------------------------------
    # RESPONSE
    # Keep your existing response logic
    # --------------------------------------------------
    def to_representation(
        self,
        instance
    ):

        data = super().to_representation(
            instance
        )

        # ----------------------------
        # Claim totals
        # ----------------------------
        total_claimed = (
            instance.lines.aggregate(
                total=Sum('amount')
            ).get('total')
            or Decimal('0.00')
        )

        advance_amount = (
            instance.advance_amount
            or Decimal('0.00')
        )

        net_payable = (
            total_claimed
            - advance_amount
        )

        excess_to_return = (
            abs(net_payable)
            if net_payable < 0
            else Decimal('0.00')
        )

        data['total_claimed'] = (
            total_claimed
        )

        data['net_payable'] = (
            net_payable
        )

        data['excess_to_return'] = (
            excess_to_return
        )


        # ----------------------------
        # Claimant display data
        # ----------------------------
        if instance.claimant:

            claimant = instance.claimant

            data['claimant_name'] = (
                claimant.first_name or ''
            )

            data['claimant_code'] = (
                claimant.employee_code or ''
            )

            data['claimant_default_object'] = {
                'id': claimant.id,
                'employee_code':
                    claimant.employee_code,
                'first_name':
                    claimant.first_name,
            }

            data['department_name'] = (
                claimant.department.department_name
                if claimant.department_id
                else ''
            )

            data['designation_name'] = (
                claimant.designation.designation_name
                if claimant.designation_id
                else ''
            )


        # ----------------------------
        # Petty Cash Fund
        # ----------------------------
        data['petty_cash_fund_no'] = (
            instance.petty_cash_fund.fund_no
            if instance.petty_cash_fund_id else ''
        )

        data['petty_cash_fund_holder_name'] = (
            instance.petty_cash_fund.holder.first_name
            if instance.petty_cash_fund_id and instance.petty_cash_fund.holder else ''
        )


        # ----------------------------
        # Submitted By
        # ----------------------------
        if instance.submitted_by:

            data['submitted_by_name'] = (
                instance.submitted_by.first_name
                or ''
            )

            data['submitted_by_code'] = (
                instance.submitted_by.employee_code
                or ''
            )

        return data


# ============================================================
# Petty Cash Module
# ============================================================


class PettyCashFundSerializer(ApprovalModelMixinSerializer, AuditModelMixinSerializer):

    fund_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    # Derived field â€” always recomputed server-side via _recompute_fund_balance,
    # never trusted from client input (the client only ever sees a stale snapshot).
    current_balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PettyCashFund
        fields = '__all__'

    def create(self, validated_data):
        try:
            validated_data['fund_no'] = NumberConstructor().generate_next_sequence(
                NumberConstructorConstants.PETTY_CASH_FUND_NUMBER
            )
        except Exception:
            raise serializers.ValidationError("App key: PETTY_CASH_FUND_NUMBER does not exist")

        return super().create(validated_data)

    def update(self, instance, validated_data):

        new_status = validated_data.get('status')

        if new_status == 'CLOSED' and instance.status != 'CLOSED':
            current_balance = instance.current_balance or 0

            if current_balance != 0:
                raise serializers.ValidationError({
                    'status': 'Fund balance must be zero before closing.'
                })

        return super().update(instance, validated_data)



    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['holder_name'] = (
            instance.holder.first_name
            if instance.holder else ''
        )

        data['holder_employee_code'] = (
            instance.holder.employee_code
            if instance.holder else ''
        )

        return data
        

class PettyCashTransactionSerializer(AuditModelMixinSerializer):

    transaction_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y'], allow_null=True)

    class Meta:
        model = PettyCashTransaction
        fields = '__all__'

    
    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['fund_no'] = (
            instance.fund.fund_no
            if instance.fund else ''
        )

        data['fund_holder_name'] = (
            instance.fund.holder.first_name
            if instance.fund and instance.fund.holder else ''
        )

        data['expense_claim_no'] = (
            instance.expense_claim.claim_no
            if instance.expense_claim else ''
        )

        # Human-readable choice labels
        data['transaction_type_display'] = (
            instance.get_transaction_type_display()
            if instance.transaction_type else ''
        )

        data['source_type_display'] = (
            instance.get_source_type_display()
            if instance.source_type else ''
        )

        return data

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._recompute_fund_balance(instance.fund)
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self._recompute_fund_balance(instance.fund)
        return instance

    def _recompute_fund_balance(self, fund):

        if not fund:
            return

        credits = fund.transactions.filter(
            transaction_type='CREDIT'
        ).aggregate(total=Sum('amount')).get('total') or Decimal('0.00')

        debits = fund.transactions.filter(
            transaction_type='DEBIT'
        ).aggregate(total=Sum('amount')).get('total') or Decimal('0.00')

        fund.current_balance = credits - debits

        fund.save(update_fields=['current_balance'])

