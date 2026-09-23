import uuid
from collections import defaultdict
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group
from django.db import models
from hrm_audit_fields.models import AuditUuidModelMixin
from hrm_audit_fields.models.audit_model_mixin import AuditModelMixin
from hrm_audit_fields.models.Protect_Delete_Mixin import ProtectDeleteMixin, ProtectWithDeleteMixin, SoftDeleteMixin
from hrm_audit_fields.models.softd_delete_mixin import SoftDeleteMixin
from hrm_audit_fields.models.validator_mixin import DynamicValidatorModel
from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from django.contrib.auth import get_user_model
from hrm_main.models import (AttendanceStatusMaster)
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase
from hrm_utils.constants import ItemTypeConstants
from django.contrib.contenttypes.models import ContentType
from hrm_contract_resolver import resolve
User = get_user_model()


class Department(AuditUuidModelMixin, ProtectDeleteMixin):
    department_code = models.CharField(max_length=100, blank=True, null=True)
    department_name = models.CharField(max_length=100, unique=True)
    order           = models.IntegerField(default=None, null=True, blank=True)

    class Meta:
        unique_together = ('department_name', 'b_id')
        ordering        = ['order', 'department_name']

class Designation(AuditUuidModelMixin, ProtectDeleteMixin):
    designation_code = models.CharField(max_length=100, blank=True, null=True)
    designation_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('designation_name', 'b_id')

class AllowanceMaster(AuditUuidModelMixin, ProtectDeleteMixin):
    ALLOWANCE_TYPE_CHOICES = [
        ('fixed_per_day',          'Fixed Per Day'),
        ('fixed_per_shift',        'Fixed Per Shift'),
        ('fixed_per_attendance',   'Fixed Per Attendance'),
        ('hourly',                 'Hourly'),
        ('percentage_basic',       'Percentage of Basic Salary'),
        ('percentage_daily_wage',  'Percentage of Daily Wage'),
        ('per_trip',               'Per Trip'),
        ('per_kilometre',          'Per Kilometre'),
        ('per_mobilization',       'Per Mobilization'),
        ('per_demobilization',     'Per Demobilization'),
        ('per_operating_hour',     'Per Operating Hour'),
        ('per_standby_hour',       'Per Standby Hour'),
        ('per_productive_hour',    'Per Productive Hour'),
        ('monthly_fixed',          'Monthly Fixed'),
        ('rotation_based',         'Rotation-Based'),
    ]

    allowance_code  = models.CharField(max_length=100, blank=True, null=True)
    allowance_name  = models.CharField(max_length=100)
    allowance_type  = models.CharField(max_length=50, choices=ALLOWANCE_TYPE_CHOICES, blank=True, null=True)
    unit_rate       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('allowance_name', 'b_id')

class Grade(AuditUuidModelMixin, ProtectDeleteMixin):
    grade_code = models.CharField(max_length=100, blank=True, null=True)
    grade_description = models.CharField(max_length=100)
    gross_monthly_total = models.FloatField(default=0, blank=True, null=True)
    gross_yearly_total = models.FloatField(default=0, blank=True, null=True)
    deduction_monthly_total = models.FloatField(default=0, blank=True, null=True)
    deduction_yearly_total = models.FloatField(default=0, blank=True, null=True)
    confirm_msg = models.BooleanField(default=False)

    class Meta:
        pass  # unique_together = ('grade_code', 'grade_description', 'b_id')

class GradeMonthlyAllowanceDetails(AuditUuidModelMixin):
    gross_earnings = models.ForeignKey(Grade, on_delete=models.CASCADE, null=True,
                                       blank=True,
                                       related_name="grade_gross_earnings")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)
    lop_applicable = models.BooleanField(null=True, blank=True, default=True)
    table_row_id = models.IntegerField(default=0)
    salary_component = models.ForeignKey("hrm_master.SalaryComponents", on_delete=models.PROTECT, null=True,
                                         blank=True)

    class Meta:
        default_permissions = {}
        ordering = ['salary_component__type', 'salary_component__order', 'id']

class GradeMonthlyDeductionDetails(AuditUuidModelMixin):
    gross_deductions = models.ForeignKey(Grade, on_delete=models.CASCADE, null=True,
                                         blank=True, related_name="grade_gross_deductions")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)
    lop_applicable = models.BooleanField(null=True, blank=True, default=True)
    table_row_id = models.IntegerField(default=0)
    salary_component = models.ForeignKey("hrm_master.SalaryComponents", on_delete=models.PROTECT, null=True,
                                         blank=True)

    class Meta:
        default_permissions = {}
        ordering = ['salary_component__type', 'salary_component__order', 'id']

class LeaveDetails(AuditUuidModelMixin, DynamicValidatorModel):
    leave_type = models.CharField(max_length=100, default=None)
    number_of_leaves = models.FloatField(default=0, null=True, blank=True)
    grade = models.ForeignKey("hrm_master.Grade", on_delete=models.CASCADE,
                              null=True, related_name="leave_details")

    class Meta:
        pass

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.row_name = f"{self.leave_type.capitalize() if self.leave_type is not None else ''}"

class EmployeeMaster(AuditUuidModelMixin, SoftDeleteMixin):
    class Meta:
        pass

    employee_code = models.CharField(max_length=50, null=True, default=None, blank=True)
    employee_card_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    biometric_key = models.CharField(max_length=50, null=True, default=None, blank=True)
    title = models.CharField(max_length=100, null=True, default=None, blank=True)
    first_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    last_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    father_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    mother_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    employee_type = models.CharField(max_length=100, null=True, default=None, blank=True)
    detailed_employee_type = models.CharField(max_length=100, null=True, default=None, blank=True)
    count_by_level = models.CharField(max_length=100, null=True, default=None, blank=True)
    designation = models.ForeignKey(Designation, on_delete=models.PROTECT, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True, blank=True)
    grade = models.ForeignKey("hrm_master.Grade", on_delete=models.PROTECT,
                              null=True)
    default_shift = models.ForeignKey('ShiftTimings', on_delete=models.PROTECT, null=True, blank=True,
                                      related_name='employee_shift')
    default_shift_new=models.CharField(max_length=250,null=True,blank=True)
    weekly_off = models.JSONField(default=dict)
    employee_group = models.CharField(max_length=100, null=True, default=None, blank=True)
    nationality = models.CharField(max_length=100, null=True, default=None, blank=True)
    device_id = models.CharField(max_length=100, null=True, default=None, blank=True)
    first_reporting_authority = models.ForeignKey('EmployeeMaster', on_delete=models.SET_NULL, null=True, blank=True,
                                                  related_name='first_reported')
    report_authority_first_name = models.CharField(max_length=100, null=True, blank=True)
    report_authority_last_name = models.CharField(max_length=100, null=True, blank=True)
    second_reporting_authority = models.ForeignKey('EmployeeMaster', on_delete=models.SET_NULL, null=True, blank=True,
                                                   related_name='second_reported')
    second_report_authority_first_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    second_report_authority_last_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    system_user = models.BooleanField(default=False)
    reporting = models.CharField(max_length=100, null=True, default=None, blank=True)
    groups = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True, related_name='securityGroup')
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True,
                             related_name='securityUser')
    user_password = models.CharField(max_length=1000, blank=True, null=True)

    dob = models.DateField(null=True, default=None, blank=True)
    doj = models.DateField(null=True, default=None, blank=True)
    doc = models.DateField(null=True, default=None, blank=True)
    dor = models.DateField(null=True, default=None, blank=True)
    local_mobile_number = models.CharField(max_length=50, null=True, default=None, blank=True)
    home_mobile_number = models.CharField(max_length=50, null=True, default=None, blank=True)
    email = models.CharField(max_length=250, null=True, default=None, blank=True)
    marital_status = models.CharField(max_length=100, null=True, default=None, blank=True)
    gender = models.CharField(max_length=50, null=True, default=None, blank=True)
    religion = models.CharField(max_length=100, null=True, default=None, blank=True)
    blood_group = models.CharField(max_length=50, null=True, default=None, blank=True)
    address = models.TextField(default=None, blank=True, null=True)
    postal_code = models.CharField(max_length=100, null=True, default=None, blank=True)
    passport_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    passport_issue_date = models.DateField(null=True, default=None, blank=True)
    passport_expiry_date = models.DateField(null=True, default=None, blank=True)
    passport_image=models.FileField(upload_to="images", blank=True, null=True)
    passport_image_back=models.FileField(upload_to="images", blank=True, null=True)
    visa_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    visa_issue_date = models.DateField(null=True, default=None, blank=True)
    visa_expiry_date = models.DateField(null=True, default=None, blank=True)
    visa_image=models.FileField(upload_to="images", blank=True, null=True)

    emirates_id_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    emirates_id_issue_date = models.DateField(null=True, default=None, blank=True)
    emirates_id_expiry_date = models.DateField(null=True, default=None, blank=True)
    emirates_image=models.FileField(upload_to="images", blank=True, null=True)
    emirates_image_back=models.FileField(upload_to="images", blank=True, null=True)
    labour_card_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    labour_card_issue_date = models.DateField(null=True, default=None, blank=True)
    labour_card_expiry_date = models.DateField(null=True, default=None, blank=True)
    labour_card_image=models.FileField(upload_to="images", blank=True, null=True)
    fhc_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    fhc_issue_date = models.DateField(null=True, default=None, blank=True)
    fhc_expiry_date = models.DateField(null=True, default=None, blank=True)
    fhc_image=models.FileField(upload_to="images", blank=True, null=True)

    # branch = models.CharField(max_length=100, null=True, default=None, blank=True)
    branch = models.ForeignKey(resolve("BRANCH"), on_delete=models.PROTECT, null=True, blank=True, related_name='employees')


    profile_image = models.ImageField(upload_to="images", blank=True, null=True)
    is_sal_created = models.BooleanField(default=False)

    bank_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    account_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    iban_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    agent_id = models.CharField(max_length=100, null=True, default=None, blank=True)
    swift_code = models.CharField(max_length=100, null=True, default=None, blank=True)

    # Salary Payment Info
    PAYMENT_METHOD_CHOICES = [
        ('WPS', 'WPS'),
        ('Cash', 'Cash'),
    ]
    ACCOUNT_TYPE_CHOICES = [
        ('C3Pay Card', 'C3Pay Card'),
        ('Bank Account', 'Bank Account'),
    ]
    wps_establishment_id = models.CharField(max_length=100, null=True, default=None, blank=True)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, null=True, default=None, blank=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, null=True, default=None, blank=True)
    bank_routing_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    nominee_relationship = models.CharField(max_length=100, null=True, default=None, blank=True)
    nominee_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    payout = models.CharField(max_length=100, null=True, default=None, blank=True)
    nominee_mobile_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    auto_punch = models.BooleanField(default=False)
    job_loss_insurance_no = models.CharField(max_length=100, null=True, default=None, blank=True)
    job_loss_insurance_issue_date = models.DateField(null=True, default=None, blank=True)
    job_loss_insurance_expiry_date = models.DateField(null=True, default=None, blank=True)
    insurance_image=models.FileField(upload_to="images", blank=True, null=True)
    is_ot_eligible = models.BooleanField(default=True)

    ##additions for employee master by gatewayof gulf
    license_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    permit_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    issue_date_of_license = models.DateField(null=True, default=None, blank=True)
    expiry_date_of_license = models.DateField(null=True, default=None, blank=True)
    sponsors = models.CharField(max_length=100, null=True, default=None, blank=True)

    ###basic details
    cicpa_number = models.CharField(max_length=100, blank=True, null=True)
    cicpa_name = models.CharField(max_length=200, blank=True, null=True)
    cicpa_location = models.CharField(max_length=250, blank=True, null=True)
    cicpa_expiry_date = models.DateField(null=True, blank=True)
    ##operator mechanic classification
    operator_driver = models.BooleanField(default=False)
    mechanic_technician = models.BooleanField(default=False)
    operator_type = models.CharField(max_length=150, null=True, blank=True)
    technician_type = models.CharField(max_length=150, null=True, blank=True)
    primary_equipment_specialization = models.JSONField(default=list, null=True, blank=True)
    secondary_equipment_specialization = models.JSONField(default=list, null=True, blank=True)
    tertiary_equipment_specialization = models.JSONField(default=list, null=True, blank=True)
    quaternary_equipment_specialization = models.JSONField(default=list, null=True, blank=True)
    employee_status_is_active = models.BooleanField(default=False)
    resident = models.CharField(max_length=100, null=True, default=None, blank=True)
    exchange_number=models.CharField(max_length=255,null=True,blank=True,default=None)
    is_exchange_number=models.BooleanField(default=False)
    is_available=models.BooleanField(default=True)
    shift_details=models.ForeignKey('hrm_master.ShiftMaster',on_delete=models.CASCADE,related_name='shift_master_details_employee',null=True)
    branch_master=models.CharField(max_length=100, null=True, default=None, blank=True)
    shift_one = models.BooleanField(default=False)   
    shift_two = models.BooleanField(default=False)
    shift_three = models.BooleanField(default=False)
    shift_one_id = models.ForeignKey('hrm_master.ShiftMaster',on_delete=models.CASCADE,related_name='shift_master_one_details_employee',null=True)
    shift_two_id = models.ForeignKey('hrm_master.ShiftMaster',on_delete=models.CASCADE,related_name='shift_master_two_details_employee',null=True)
    shift_three_id = models.ForeignKey('hrm_master.ShiftMaster',on_delete=models.CASCADE,related_name='shift_master_three_details_employee',null=True)
    employee_status = models.CharField(max_length=255, blank=True, null=True, default='Onboarding')
    is_emirati = models.BooleanField(default=False)
    is_under_leave = models.BooleanField(default=False)
    note = models.TextField(blank=True, null=True)
                                                                                         


    PARENTAL_LEAVE_CHOICES = [
        ('Maternity Leave', 'Maternity Leave'),
        ('Paternity Leave', 'Paternity Leave'),
    ]

    eligible_for_parental_leave = models.CharField(
        max_length=20,
        choices=PARENTAL_LEAVE_CHOICES,
        null=True,
        blank=True,
        default=None
    )

class PreviousEmploymentDetails(AuditUuidModelMixin, DynamicValidatorModel):
    employee_previous = models.ForeignKey(EmployeeMaster, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name="previous_employments")
    company_name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, null=True, default=None)
    location = models.CharField(max_length=100, null=True, default=None)
    joined_date = models.DateField(null=True, default=None, blank=True)
    resigned_date = models.DateField(null=True, default=None, blank=True)

    class Meta:
        default_permissions = {}
        ordering = ['id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.row_name = f"{self.company_name.capitalize() if self.company_name is not None else ''}"

class EmployeeLetterImages(AuditUuidModelMixin):
    employee_letters = models.ForeignKey('EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True,
                                       related_name="employee_letter_images")
    file = models.FileField(upload_to="images", null=True, blank=True, default=None)
    file_name = models.TextField(default='', null=True, blank=True)
    size = models.TextField(default='', null=True, blank=True)
    file_type = models.TextField(default='', null=True, blank=True)

    class Meta:
        ordering = ['created']

class DocumentTypeMaster(AuditUuidModelMixin):
    # Michellin only manages Employee documents (no Equipment/Attachment entities), so this is locked to Employee.
    APPLIES_TO_CHOICES = (
        ("Employee", "Employee"),
    )

    doc_type_code = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True
    )

    doc_type_name = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    applies_to = models.CharField(
        max_length=50,
        choices=APPLIES_TO_CHOICES,
        blank=True,
        null=True,
        default="Employee"
    )

    expiry_required = models.BooleanField(default=True)

    default_alert_days = models.JSONField(
        default=list,
        blank=True,
        null=True
    )

    remarks = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):
        return self.doc_type_name or self.doc_type_code or ""

    class Meta:
        ordering = ["id"]

class EmployeeDocumentsDetails(AuditUuidModelMixin, DynamicValidatorModel):
    employee_document = models.ForeignKey("hrm_master.EmployeeMaster", on_delete=models.CASCADE, null=True,
                                          blank=True,
                                          related_name="employee_documents_details")
    document_type_master = models.ForeignKey(
        "hrm_master.DocumentTypeMaster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents"
    )
    document_name = models.CharField(max_length=100, null=True, default=None, blank=True)
    document = models.FileField(upload_to="employee_documents/document", null=True, blank=True, default=None)
    document_number = models.CharField(max_length=100, null=True, default=None, blank=True)
    document_valid_upto = models.DateField(null=True, default=None, blank=True)
    issue_date = models.DateField(null=True,default=None,blank=True)

    class Meta:
        default_permissions = {}
        ordering = ['id']

class LeaveEntry(AuditUuidModelMixin, ApprovalModelMixin, metaclass=MultiApprovalMixinBase):
    employee = models.ForeignKey(EmployeeMaster, on_delete=models.SET_NULL, null=True, blank=True)
    leave_type = models.ForeignKey(AttendanceStatusMaster, on_delete=models.SET_NULL, null=True, blank=True)
    available_leaves = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    condition = models.CharField(max_length=250, null=True, blank=True, default=None)
    no_of_days = models.FloatField(default=0, blank=True, null=True)
    reason = models.CharField(max_length=500, null=True, default=None, blank=True)
    remarks = models.CharField(max_length=500, null=True, default=None, blank=True)
    is_lop = models.BooleanField(default=False)
    is_authorized = models.BooleanField(default=False)
    first_authorized = models.BooleanField(default=False)
    second_authorized = models.BooleanField(default=False)
    is_comp_off = models.BooleanField(default=False)
    comp_off_date = models.JSONField(default=dict, blank=True)
    is_system_generated = models.BooleanField(default=False)
    travel_or_leave = models.CharField(max_length=100, null=True, blank=True)
    delegated_reviewer = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True,
                                           related_name='delegated_reviewer')
    delegated_reviewer_mail_sent = models.BooleanField(default=False)
    holiday_days = models.FloatField(default=0, blank=True, null=True)
    weekly_off_days = models.FloatField(default=0, blank=True, null=True)
    type_of_days = models.CharField(max_length=100, null=True, blank=True)
    certificate = models.FileField(upload_to="certificte_uploads/", blank=True, null=True)
    balance_no_of_days = models.FloatField(default=0, blank=True, null=True)
    is_reversal = models.BooleanField(default=False)
    no_of_days_extended=models.CharField(max_length=100, null=True, blank=True)
    is_extension = models.BooleanField(default=False)
    extended_to_date = models.DateField(null=True, default=None, blank=True)
    allow_beyond_eligible = models.BooleanField(default=False)
    is_paid_beyond = models.BooleanField(default=False)
    lop_days_from_extension = models.FloatField(default=0, blank=True, null=True)
    extension_lop_attendance_ids = models.JSONField(default=list, blank=True)

    class Meta:
        permissions = [
            ('custom_approval_stage_initiator', 'Can approve as initiator'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),
            ('custom_approval_stage_secondary_approver', 'Can approve as  secondary approver'),
            ('custom_enable_leave_reversal', 'Can Enable Leave Reversal'),

        ]

    def get_approval_stage_config(self):
        final_stage = 'custom_approval_stage_approver'

        if self.delegated_reviewer:
            final_stage = 'custom_approval_stage_secondary_approver'

        config = dict(
            rejection_type=MultiApprovalMixinBase.OPEN_RE_ENTRY,
            final_stage=final_stage,
            forward_on_creation=True,
            assign_to_field='delegated_reviewer',
            hide_from_reporting_authority=True,
            alternative_authority_variant='employee__first_reporting_authority__user__id'
        )
        return config

class LeaveMaster(AuditUuidModelMixin):
    employee = models.ForeignKey(EmployeeMaster, on_delete=models.SET_NULL, null=True, blank=True)
    total_allocated_leaves = models.FloatField(default=0, blank=True, null=True)
    total_utilized_leaves = models.FloatField(default=0, blank=True, null=True)
    total_available_leaves = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        permissions = [
            ('custom_show_all_employees', 'Can view all employees')
        ]

class LeaveMasterDetails(AuditUuidModelMixin):
    leave_master = models.ForeignKey(LeaveMaster, on_delete=models.CASCADE, null=True, blank=True,
                                     related_name="leave_master_details")
    leave_policy_key = models.ForeignKey("hrm_master.LeavePolicy", on_delete=models.PROTECT, null=True, blank=True)
    leave_type = models.CharField(max_length=100, blank=True, null=True)
    financial_year = models.CharField(max_length=100, blank=True, null=True)
    opening_balance = models.FloatField(default=0, blank=True, null=True)
    allocated_leaves = models.FloatField(default=0, blank=True, null=True)
    utilized_leaves = models.FloatField(default=0, blank=True, null=True)
    available_leaves = models.FloatField(default=0, blank=True, null=True)
    carry_forward_days = models.FloatField(default=0, blank=True, null=True)
    lapse_days = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        default_permissions = {}
        ordering = ('id',)

class LeaveMasterDetailBreakup(AuditUuidModelMixin):
    ENTRY_TYPE_CHOICES = [
        ('accrual',    'Accrual'),
        ('correction', 'Correction'),
        ('adjustment', 'Adjustment'),
        ('encashment', 'Encashment'),
    ]
    leave_master_detail = models.ForeignKey(
        LeaveMasterDetails, on_delete=models.CASCADE, related_name="breakup_details"
    )
    leave_policy = models.ForeignKey(
        "LeavePolicy", on_delete=models.CASCADE, related_name="allocated_details"
    )
    opening_balance = models.FloatField(default=0, blank=True, null=True)
    allocated_leaves = models.FloatField(default=0, blank=True, null=True)
    utilized_leaves = models.FloatField(default=0, blank=True, null=True)
    available_leaves = models.FloatField(default=0, blank=True, null=True)
    allocated_month = models.CharField(max_length=10, blank=True, null=True)
    allocated_year = models.CharField(max_length=10, blank=True, null=True)
    entry_type = models.CharField(max_length=20, default='accrual', choices=ENTRY_TYPE_CHOICES,
                                  null=True, blank=True)
    policy_snapshot = models.JSONField(default=dict, null=True, blank=True,
                                       help_text="Snapshot of policy values at time of accrual")
    remarks = models.TextField(null=True, blank=True)

    class Meta:
        default_permissions = {}
        ordering = ('id',)
        # unique_together = ("leave_master_detail", "leave_policy_detail")  # Prevent duplicate allocations

class HolidayMaster(AuditUuidModelMixin, ApprovalModelMixin):
    date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    total_days = models.FloatField(default=0.0, blank=True, null=True)
    description = models.TextField(default='', null=True, blank=True)

    class Meta:
        unique_together = ('date', 'to_date', 'b_id')

class ProfessionalTaxSlab(AuditUuidModelMixin):
    min_salary = models.DecimalField(max_digits=10, decimal_places=2, help_text="Minimum salary for the slab")
    max_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True,
                                     help_text="Maximum salary for the slab (leave blank for no upper limit)")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Tax amount for this slab")

    class Meta:
        unique_together = ('min_salary', 'max_salary')
        ordering = ['min_salary']

    def __str__(self):
        return f"{self.min_salary} to {self.max_salary or 'No Limit'}: {self.tax_amount}"

class ShiftTimings(AuditUuidModelMixin):
    class Meta:
        pass

    shift_name = models.CharField(max_length=200)
    shift_code = models.CharField(max_length=200, blank=True, null=True, default=None)
    start_time = models.CharField(max_length=200, blank=True, null=True, default=None)
    end_time = models.CharField(max_length=200, blank=True, null=True, default=None)
    half_day_time = models.CharField(max_length=200, blank=True, null=True, default=None)
    late_checkin_threshold = models.CharField(max_length=200, blank=True, null=True, default=None)
    early_checkout_threshold = models.CharField(max_length=200, blank=True, null=True, default=None)

    def __str__(self):
        return self.shift_name

class LeaveApplication(AuditUuidModelMixin, ProtectDeleteMixin, ApprovalModelMixin, metaclass=MultiApprovalMixinBase):
    employee_code = models.ForeignKey(EmployeeMaster, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="leave_applications_emp_code")
    employee_name = models.CharField(max_length=100)
    # department = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    home_country_mobile_no = models.CharField(max_length=15, blank=True, null=True)
    local_mobile_no = models.CharField(max_length=15, blank=True, null=True)
    eligible_for_company_ticket = models.CharField(max_length=50, null=True, blank=True, default="")
    ticket_period_for = models.CharField(max_length=50, null=True, blank=True, default="")
    # days=models.IntegerField(null=True,blank=True)
    travel_sector = models.CharField(max_length=100, blank=True, null=True)
    leave_eligible_as_on = models.DateField(null=True, blank=True)
    leave_days_eligible = models.FloatField(default=0)
    location = models.CharField(max_length=100, null=True, blank=True, default="")

    # Last Leave Availed Details
    last_leave_start_date = models.DateField(blank=True, null=True)
    last_leave_end_date = models.DateField(blank=True, null=True)
    total_leave_days = models.IntegerField(blank=True, null=True)
    return_to_work_date = models.DateField(blank=True, null=True)
    resumed_work_date = models.DateField(blank=True, null=True)
    lop_days = models.IntegerField(blank=True, null=True)
    ticket_period = models.CharField(max_length=50, blank=True, null=True)
    last_ticket_provided_by = models.CharField(max_length=50, blank=True, null=True)
    ticket_provided_by = models.CharField(max_length=50, blank=True, null=True)
    # New Leave Application Details
    new_leave_start_date = models.DateField(null=True, blank=True)
    new_leave_end_date = models.DateField(null=True, blank=True)
    leave_days_applied = models.IntegerField(null=True, blank=True)
    ticket_to_be_issued_date = models.DateField(blank=True, null=True)
    return_ticket_to_be_issued_date = models.DateField(blank=True, null=True)
    emergency_contact_no = models.CharField(max_length=15, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    # new_leave_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # new_leave_date_sign = models.DateField(blank=True, null=True)

    # Approval Details
    leave_approved = models.BooleanField(default=False)
    duties_to_be_covered_by_reliver = models.BooleanField(default=False)
    leave_approved_start_date = models.DateField(blank=True, null=True)
    leave_approved_end_date = models.DateField(blank=True, null=True)
    leave_approved_days = models.IntegerField(blank=True, null=True)
    note_for_apporval = models.TextField(blank=True, null=True)
    # recommendated_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # recommendated_date = models.DateField(blank=True, null=True)
    # approved_by_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # approved_by_sign_date = models.DateField(blank=True, null=True)

    # HR/Admin Completion Details
    passport_expiry_date = models.DateField(blank=True, null=True)
    visa_expiry_date = models.DateField(blank=True, null=True)
    eid_expiry_date = models.DateField(blank=True, null=True)
    labour_card_expiry_date = models.DateField(blank=True, null=True)
    job_loss_insurance_expiry_date = models.DateField(blank=True, null=True)
    note_by_hr_admin = models.TextField(blank=True, null=True)
    remarks_passport_expiry = models.CharField(max_length=50, blank=True, null=True)
    remarks_visa_expiry = models.CharField(max_length=50, blank=True, null=True)
    remarks_eid_expiry = models.CharField(max_length=50, blank=True, null=True)
    remarks_labour_card_expiry = models.CharField(max_length=50, blank=True, null=True)
    # hr_admin_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # hr_admin_sign_date = models.DateField(blank=True, null=True)    

    # Return to Work Details
    resume_duty_on = models.DateField(blank=True, null=True)
    was_on_leave_from = models.DateField(blank=True, null=True)
    was_on_leave_till = models.DateField(blank=True, null=True)
    no_of_days = models.IntegerField(blank=True, null=True)
    late_early_days_by = models.CharField(max_length=50, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    # emp_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # emp_sign_date = models.DateField(blank=True, null=True)
    # manager_signature = models.ImageField(upload_to="images", blank=True, null=True)
    # manager_sign_date = models.DateField(blank=True, null=True)
    delegated_reviewer = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True,
                                           related_name='la_delegated_reviewer')
    delegated_reviewer_mail_sent = models.BooleanField(default=False)
    is_passport_received = models.BooleanField(default=False)
    is_reversal = models.BooleanField(default=False)
    balance_no_of_days = models.FloatField(default=0, blank=True, null=True)
    allow_beyond_eligible = models.BooleanField(default=False)
    lop_days_from_extension = models.FloatField(default=0, blank=True, null=True)
    extension_lop_attendance_ids = models.JSONField(default=list, blank=True)

    # class Meta:
    #     pass

    class Meta:
        permissions = [
            ('custom_approval_stage_initiator', 'Can approve as initiator'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),
            ('custom_approval_stage_secondary_approver', 'Can approve as  Secondary Approver'),
            ('custom_enable_leave_reversal', 'Can Enable Leave Reversal'),

        ]

    def get_approval_stage_config(self):
        final_stage = 'custom_approval_stage_approver'

        if self.delegated_reviewer:
            final_stage = 'custom_approval_stage_secondary_approver'

        config = dict(
            rejection_type=MultiApprovalMixinBase.OPEN_RE_ENTRY,
            final_stage=final_stage,
            forward_on_creation=True,
            assign_to_field='delegated_reviewer',
            hide_from_reporting_authority=True,
            alternative_authority_variant='employee_code__first_reporting_authority__user__id'
        )
        return config

class LeavePolicy(AuditUuidModelMixin, ProtectDeleteMixin,ApprovalModelMixin):
    employee_type = models.CharField(max_length=100, null=True, blank=True)
    employee = models.ForeignKey(EmployeeMaster, on_delete=models.SET_NULL, null=True, blank=True)
    employee_group = models.CharField(max_length=100, null=True, blank=True)
    employee_reporting = models.CharField(max_length=100, null=True, blank=True)
    type_of_leave = models.ForeignKey(AttendanceStatusMaster, on_delete=models.PROTECT,
                                      null=True, blank=True, verbose_name="Type of Leave")
    year_to_year_carry = models.BooleanField(default=False)
    carry_threshold_value = models.FloatField(default=0.00)
    type_of_days = models.CharField(max_length=100, null=True, blank=True,
                                    choices=[('Working_days', 'Working_days'),
                                             ('Calendar_days', 'Calendar_days')])
    min_stretch_days = models.FloatField(default=0, null=True, blank=True)
    max_stretch_days = models.FloatField(default=0, null=True, blank=True)
    # ── Phase 2: Policy versioning & accrual settings ──────────────────────
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    eligible_after_days = models.IntegerField(default=0, null=True, blank=True)
    backdated_days_limit = models.IntegerField(default=0, null=True, blank=True)
    allow_advance_leave = models.BooleanField(default=True)
    allow_half_day = models.BooleanField(default=False)
    require_document = models.BooleanField(default=False)
    require_document_after_days = models.IntegerField(default=0, null=True, blank=True)
    lop_on_overstay = models.BooleanField(default=True)
    lop_on_weekly_off_after_leave = models.BooleanField(default=False)
    prorate_on_join = models.BooleanField(default=False,
                                          help_text="If False (default), new joiners get full leave grant. "
                                                    "If True, leave is prorated based on DOJ.")
    fy_start_month = models.IntegerField(default=1, null=True, blank=True,
                                         help_text="Financial year start month (1=Jan, 4=Apr, etc.)")
    year_month = models.CharField(max_length=10, default='Month', null=True, blank=True,
                                  choices=[('Month', 'Month'), ('Year', 'Year')],
                                  help_text="Accrual frequency: Month or Year")
    pay_on = models.CharField(max_length=10, default='gross', null=True, blank=True,
                              choices=[('basic', 'Basic Pay'), ('gross', 'Gross Pay')],
                              help_text="Whether leave pay percentage applies on Basic Pay or Gross Pay")

    class Meta:
        verbose_name = 'Leave Policy'
        verbose_name_plural = 'Leave Policies'
        # unique_together = ('employee_type', 'type_of_leave', 'b_id')
        # Unique constraint commented out to support policy versioning
        # (multiple policies per leave type with different effective_from/effective_to)
        # constraints = [
        #     models.UniqueConstraint(fields=['employee_type','employee_group', 'type_of_leave', 'b_id', 'is_active'],
        #                             name='unique_leave_policy',
        #                             condition=Q(employee_type__isnull=False) & Q(type_of_leave__isnull=False))
        # ]

class LeavePolicyDetail(AuditUuidModelMixin, ProtectDeleteMixin):
    leave_policy = models.ForeignKey(LeavePolicy, on_delete=models.CASCADE,
                                     related_name="leave_policy_details")
    pay_percentage = models.FloatField(default=100, null=True, blank=True,
                                       help_text="Percentage of salary paid during this leave (0–100)")
    number_of_days = models.FloatField(default=0, null=True, blank=True)

    class Meta:
        default_permissions = {}
        verbose_name = 'Leave Policy Detail'
        verbose_name_plural = 'Leave Policy Details'

class TicketMaster(AuditUuidModelMixin):
    employee = models.OneToOneField(
        'EmployeeMaster',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ticket'
    )
    ticket_sector = models.CharField(max_length=20, blank=True, null=True, default='')
    last_ticket_availed = models.CharField(max_length=20, blank=True, null=True, default='')
    next_ticket_eligible_period = models.CharField(max_length=20, blank=True, null=True, default='')
    ticket_eligible_month = models.CharField(max_length=20, blank=True, null=True, default='')

    def __str__(self):
        return f"{self.ticket_sector} - {self.ticket_period}"

    class Meta:
        verbose_name = "Ticket Master"
        verbose_name_plural = "Ticket Masters"

class TicketHistory(AuditUuidModelMixin):
    ticket_master = models.ForeignKey(TicketMaster, on_delete=models.CASCADE, related_name='ticket_histories')
    availed_date = models.DateField(null=True, blank=True, default=None)
    last_ticket_availed = models.CharField(max_length=20, blank=True, null=True, default='')
    last_ticket_eligible_month = models.CharField(max_length=20, blank=True, null=True, default='')
    last_ticket_sector = models.CharField(max_length=20, blank=True, null=True, default='')

    def __str__(self):
        return f"History for {self.ticket_master.ticket_sector} on {self.date}"

    class Meta:                  
        verbose_name = "Ticket History"
        verbose_name_plural = "Ticket Histories"

class AllowanceAssignment(AuditUuidModelMixin, ProtectDeleteMixin, ApprovalModelMixin):
    """MNC-standard allowance assignment: one record per employee per allowance.
    Records created together in a bulk operation share the same batch_id."""

    MODE_CHOICES = [
        ('manual', 'Manual'),
        ('auto',   'Auto'),
    ]
    CRITERIA_CHOICES = [
        ('employee_wise', 'Individual'),
        ('designation',   'Designation'),
        ('department',    'Department'),
    ]
    ALLOWANCE_TYPE_CHOICES = [
        ('fixed_per_day', 'Fixed Per Day'),
        ('hourly',        'Hourly'),
        ('monthly_fixed', 'Monthly Fixed'),
    ]

    # Batch grouping — all records created in the same bulk operation share this
    batch_id = models.UUIDField(default=uuid.uuid4, db_index=True)

    # Auto-generated code — same for all records in a batch (set on first save)
    assignment_code = models.CharField(max_length=50, blank=True, db_index=True)

    # Core relations
    employee  = models.ForeignKey(
        'hrm_master.EmployeeMaster', on_delete=models.CASCADE,
        related_name='allowance_assignments'
    )
    allowance = models.ForeignKey(
        'hrm_master.AllowanceMaster', on_delete=models.PROTECT,
        related_name='assignments'
    )

    # Copied from AllowanceMaster at assignment time (denormalised for speed); user can override
    allowance_code = models.CharField(max_length=100, blank=True)
    allowance_name = models.CharField(max_length=200, blank=True)
    allowance_type = models.CharField(max_length=100, choices=ALLOWANCE_TYPE_CHOICES, blank=False)

    # Mode + amounts
    mode   = models.CharField(max_length=10, choices=MODE_CHOICES, default='manual')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Manual
    rate   = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Auto
    remark = models.TextField(blank=True, null=True)

    # Effective dates
    from_date = models.DateField(null=True, blank=True)
    to_date   = models.DateField(null=True, blank=True)

    # Filter tracking (stored so bulk-edit can restore the original filter)
    filter_criteria        = models.CharField(max_length=20, choices=CRITERIA_CHOICES, blank=True)
    filter_designation_ids = models.CharField(max_length=500, blank=True)
    filter_department_ids  = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created']

class SalaryComponents(AuditUuidModelMixin, ProtectDeleteMixin):
    type = models.CharField(max_length=100, blank=True, null=True, default='')
    component = models.CharField(max_length=100, blank=True, null=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        pass
        ordering = ['type', 'order']
        # unique_together = ('component', 'b_id', 'type',)

class ShiftMaster(AuditUuidModelMixin):
        
    shift_code = models.CharField(max_length=50,verbose_name="Shift Code")
    shift_name = models.CharField(max_length=100, verbose_name="Shift Name")
    status = models.CharField(max_length=10, default='active')
    start_time = models.TimeField(null=True, blank=True)  # Should be TimeField
    end_time = models.TimeField(null=True, blank=True)    # Should be TimeField
    grace_period_in = models.TimeField(null=True, blank=True)  # Should be TimeField
    grace_period_out = models.TimeField(null=True, blank=True) 
    duration = models.DurationField(verbose_name="Duration", blank=True,null=True)
    # max_ot = models.DurationField(verbose_name="Max OT per shift")
    max_ot = models.TimeField(null=True, blank=True)  # Should be TimeField
    ot_multiplier = models.DecimalField(max_digits=4,decimal_places=2,default=1.0)
    ot_rounding = models.CharField(max_length=10,blank=True,null=True)
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    is_cross_midnight = models.BooleanField(default=False, editable=False)

    class Meta:
        pass

class LeaveReversalRequest(AuditUuidModelMixin, ApprovalModelMixin,metaclass=MultiApprovalMixinBase):
    leave_entry = models.ForeignKey('LeaveEntry', on_delete=models.CASCADE, related_name='reversals' , default=None, null=True)
    leave_application = models.ForeignKey('LeaveApplication', on_delete=models.CASCADE, related_name='reverApplicationSals' , default=None, null=True)
    employee = models.ForeignKey(
        'EmployeeMaster',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reversal_request'
    )
    reason_for_reversal = models.TextField()
    delegated_reviewer=models.ForeignKey(
        'EmployeeMaster',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_delegated_reviewer'
    )
    initiator_reviewer = models.ForeignKey(
        'EmployeeMaster',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_Initiator_reviewer'
    )
    reverse_from_date = models.DateField(null=True, default=None, blank=True)
    reverse_to_date = models.DateField(null=True, default=None, blank=True)
    reverse_no_of_days = models.FloatField(default=0, blank=True, null=True)
    include_holidays = models.BooleanField(default=False, help_text="Include approved holidays in reverse_no_of_days (only relevant when type_of_days is Working_days)")
    delegated_reviewer_mail_sent = models.BooleanField(default=False)
    class Meta:
        verbose_name = "Leave Reversal Request"
        verbose_name_plural = "Leave Reversal Requests"
        permissions = [
            ('custom_approval_stage_requester', 'Can approve as Requester'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),

        ]

    def get_approval_stage_config(self):
        # final_stage = 'custom_approval_stage_approver'
        #
        # if self.delegated_reviewer:
        #     final_stage = 'custom_approval_stage_secondary_approver'

        config = dict(
            rejection_type=MultiApprovalMixinBase.OPEN_RE_ENTRY,
            # final_stage=final_stage,
            forward_on_creation=True,
            assign_to_field='delegated_reviewer',
            hide_from_reporting_authority=True,
            alternative_authority_variant='delegated_reviewer__user__id'
        )
        return config

class LeaveExtension(AuditUuidModelMixin,ApprovalModelMixin):
    """
    Leave Extension Request — one record per extension event.
    Links to either a LeaveEntry or a LeaveApplication (not both).
    On APPROVED: parent leave end date moves forward to extended_to_date,
    attendance is updated, and leave balance is deducted.
    """
    leave_entry = models.ForeignKey(
        'LeaveEntry', on_delete=models.CASCADE,
        related_name='extensions', null=True, blank=True
    )
    leave_application = models.ForeignKey(
        'LeaveApplication', on_delete=models.CASCADE,
        related_name='extensions', null=True, blank=True
    )
    employee = models.ForeignKey(
        'EmployeeMaster', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='leave_extensions'
    )
    extended_to_date = models.DateField(null=True, blank=True)
    extension_days = models.FloatField(default=0, blank=True, null=True)
    allow_beyond_eligible = models.BooleanField(default=False)
    is_paid_beyond = models.BooleanField(default=False)
    lop_days = models.FloatField(default=0, blank=True, null=True)
    extension_lop_attendance_ids = models.JSONField(default=list, blank=True)
    reason = models.TextField(blank=True, null=True)
    delegated_reviewer = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='leave_extension_reviewer'
    )

    class Meta:
        verbose_name = "Leave Extension"
        verbose_name_plural = "Leave Extensions"


