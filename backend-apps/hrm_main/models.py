from django.db import models
from hrm_audit_fields.models import AuditUuidModelMixin
# Vendor or Party master
from hrm_audit_fields.models.Protect_Delete_Mixin import ProtectDeleteMixin, ProtectWithDeleteMixin
from hrm_audit_fields.models.validator_mixin import DynamicValidatorModel

from hrm_audit_fields.models.approval_model_mixin import ApprovalModelMixin
from hrm_audit_fields.approval_stages.approval_stages_base_mixin import MultiApprovalMixinBase


from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey



class EmployeeMonthlySalary(AuditUuidModelMixin):
    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    initial_gratuity = models.FloatField(default=0, blank=True, null=True)
    net_pay_monthly = models.FloatField(default=0, blank=True, null=True)
    net_pay_yearly = models.FloatField(default=0, blank=True, null=True)
    pf_employer = models.FloatField(default=0, blank=True, null=True)
    pf_employer_yearly = models.FloatField(default=0, blank=True, null=True)
    esi_employer = models.FloatField(default=0, blank=True, null=True)
    esi_employer_yearly = models.FloatField(default=0, blank=True, null=True)
    ctc = models.FloatField(default=0, blank=True, null=True)
    grade = models.ForeignKey('hrm_master.grade', on_delete=models.CASCADE, null=True, blank=True)
    # Salary versioning / increment fields
    effective_date    = models.DateField(null=True, blank=True)
    reason            = models.CharField(max_length=50, null=True, blank=True)
    arrears_processed = models.BooleanField(default=False)
    # Document numbering (ES000001 for salary setup, SI000001 for increments)
    document_number   = models.CharField(max_length=20, null=True, blank=True)
    # Approval workflow (used only for salary increment records)
    approval_status   = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        db_table = 'hrm_employeemonthlysalary'
        ordering = ['created']
        # unique_together = ('employee', 'b_id','grade')


class EmployeeMonthlyAllowanceDetails(AuditUuidModelMixin):
    gross_earnings = models.ForeignKey(EmployeeMonthlySalary, on_delete=models.CASCADE, null=True,
                                       blank=True,
                                       related_name="gross_earnings")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)
    lop_applicable = models.BooleanField(null=True, blank=True, default=True)
    grade_allowance = models.ForeignKey('hrm_master.GradeMonthlyAllowanceDetails', on_delete=models.CASCADE, null=True,
                                        blank=True,related_name="grade_earnings")
    table_row_id = models.IntegerField(default=0)
    salary_component = models.ForeignKey("hrm_master.SalaryComponents", on_delete=models.PROTECT, null=True,
                                         blank=True)
    class Meta:
        db_table = 'hrm_employeemonthlyallowancedetails'
        ordering = ['salary_component__type', 'salary_component__order', 'id']


class EmployeeMonthlyDeductionDetails(AuditUuidModelMixin):
    gross_deductions = models.ForeignKey(EmployeeMonthlySalary, on_delete=models.CASCADE, null=True,
                                         blank=True, related_name="gross_deductions")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)
    lop_applicable = models.BooleanField(null=True, blank=True, default=True)
    grade_deduction = models.ForeignKey('hrm_master.GradeMonthlyDeductionDetails', on_delete=models.CASCADE, null=True,
                                        blank=True, related_name="grade_deduction")
    table_row_id = models.IntegerField(default=0)
    salary_component = models.ForeignKey("hrm_master.SalaryComponents", on_delete=models.PROTECT, null=True,
                                         blank=True)
    class Meta:
        db_table = 'hrm_employeemonthlydeductiondetails'
        ordering = ['salary_component__type', 'salary_component__order', 'id']



class CareerLetter(AuditUuidModelMixin):
    class Meta:
        db_table = 'hrm_careerletter'

    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField(null=True, default=None, blank=True)
    career_latter_type = models.CharField(max_length=100, blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    subject_template = models.JSONField(blank=True, null=True)
    editor = models.ForeignKey("master.Editor", on_delete=models.PROTECT, null=True)
    is_header_footer = models.BooleanField(default=False)
    employee_name = models.CharField(max_length=100, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    passport = models.CharField(max_length=100, blank=True, null=True)
    years_of_service = models.CharField(max_length=100, blank=True, null=True)

class CareerLetterImages(AuditUuidModelMixin):
    career_letter = models.ForeignKey('CareerLetter', on_delete=models.CASCADE, null=True, blank=True,
                                       related_name="career_letter_images")
    file = models.FileField(upload_to="images", null=True, blank=True, default=None)
    file_name = models.TextField(default='', null=True, blank=True)
    size = models.TextField(default='', null=True, blank=True)
    file_type = models.TextField(default='', null=True, blank=True)

    class Meta:
        db_table = 'hrm_careerletterimages'
        ordering = ['created']
class Advance(AuditUuidModelMixin, ApprovalModelMixin):
    class Meta:
        db_table = 'hrm_advance'

    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField(null=True, default=None, blank=True)
    advance_type = models.CharField(max_length=100, default=None, blank=True, null=True)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    deduction_tenure_months = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    emi = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    balance_loan_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    loan_start_date = models.DateField(null=True, default=None, blank=True)


class Bonus(AuditUuidModelMixin, ApprovalModelMixin):
    class Meta:
        db_table = 'hrm_bonus'

    grade = models.ForeignKey("hrm_master.Grade", on_delete=models.CASCADE, null=True)
    date = models.DateField(null=True, default=None, blank=True)
    bonus_months = models.DateField(default=None, blank=True, null=True)
    total_bonus_amount = models.FloatField(default=0, blank=True, null=True)


class BonusDetails(AuditUuidModelMixin):
    bonus = models.ForeignKey("Bonus", on_delete=models.CASCADE,
                              null=True, related_name="bonus_details")
    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    employee_code = models.CharField(max_length=100, blank=True, null=True)
    bonus_amount = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True, blank=True)
    management_incentive = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True, blank=True)
    variable_incentive = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True, blank=True)
    vehicle_maintenance_incentive = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True,
                                                        blank=True)
    # Deduction fields
    accidental_insurance_premium_share = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True,
                                                             blank=True)
    health_insurance_premium_share = models.DecimalField(max_digits=10, default=0.00, decimal_places=2, null=True,
                                                         blank=True)

    class Meta:
        db_table = 'hrm_bonusdetails'
        ordering = ['created']


class GratuityEmployeeForm(AuditUuidModelMixin, ApprovalModelMixin, metaclass=MultiApprovalMixinBase):
    # â”€â”€ Form Number (auto-generated from app settings) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    form_number = models.CharField(max_length=30, null=True, blank=True, unique=True,
        help_text='Auto-generated gratuity form reference number e.g. GR-2024-00001')

    # â”€â”€ Calculation Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    CALCULATION_TYPE_CHOICES = [
        ('estimate',          'Estimate'),
        ('final_separation',  'Final Separation'),
        ('transfer_settlement', 'Transfer Settlement'),
        ('liability_transfer',  'Liability Transfer'),
    ]
    calculation_type = models.CharField(
        max_length=30, choices=CALCULATION_TYPE_CHOICES,
        default='final_separation', blank=True,
        help_text='Purpose of this gratuity calculation')

    # â”€â”€ Notice Completion Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    NOTICE_STATUS_CHOICES = [
        ('served',      'Served'),
        ('waived',      'Waived'),
        ('not_served',  'Not Served'),
        ('na',          'N/A'),
    ]
    notice_completion_status = models.CharField(
        max_length=20, choices=NOTICE_STATUS_CHOICES, default='na', blank=True,
        help_text='Whether the notice period was served, waived, or not served')

    # â”€â”€ Manual Basic Salary Override â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    basic_salary_manual_override = models.BooleanField(default=False,
        help_text='If True, present_basic_pay was entered manually by HR (not auto-fetched)')

    # â”€â”€ Forfeiture Reference â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    forfeiture_ref = models.CharField(max_length=200, blank=True, null=True,
        help_text='Disciplinary case / legal decision reference for Article 54 forfeiture')

    # â”€â”€ Document Uploads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    resignation_letter    = models.FileField(upload_to='gratuity/documents', blank=True, null=True,
        help_text='Resignation letter or termination notice')
    forfeiture_document   = models.FileField(upload_to='gratuity/documents', blank=True, null=True,
        help_text='HR committee / court decision document for Article 54 forfeiture')
    supporting_document   = models.FileField(upload_to='gratuity/documents', blank=True, null=True,
        help_text='Any additional supporting document')

    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    dor = models.DateField(null=True, default=None, blank=True)
    doc = models.DateField(null=True, default=None, blank=True,
        help_text='Date of Confirmation â€” service start for gratuity. Overrides employee.doc when set.')
    present_basic_pay = models.FloatField(default=0, blank=True, null=True)
    service_years = models.CharField(max_length=30, blank=True, null=True)
    total_gratuity_monthly = models.FloatField(blank=True, null=True)
    total_gratuity_yearly = models.FloatField(blank=True, null=True)

    # â”€â”€ Unpaid Leave â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    consider_unpaid_leave    = models.BooleanField(default=False,
        help_text='Include unpaid leave days when computing effective service period')
    consider_auto_sync       = models.BooleanField(default=False,
        help_text='Also count system attendance days (is_paid=False) in addition to manual days')
    unpaid_leave_days_manual = models.IntegerField(default=0, blank=True,
        help_text='Historical unpaid days entered manually by HR')
    unpaid_leave_days_system = models.IntegerField(default=0, blank=True,
        help_text='Unpaid days auto-computed from AttendanceDetails (is_paid=False statuses)')
    unpaid_leave_days_total  = models.IntegerField(default=0, blank=True,
        help_text='Effective unpaid days used in formula (manual or manual+system)')
    unpaid_leave_last_synced = models.DateField(null=True, blank=True,
        help_text='Date when system unpaid days were last refreshed')

    # â”€â”€ Debt Deduction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    consider_debt_deduction  = models.BooleanField(default=False,
        help_text='Deduct outstanding advance balance from gross gratuity')
    debt_deduction           = models.FloatField(default=0, blank=True,
        help_text='Outstanding advance balance synced from Advance records')
    debt_deduction_remark    = models.CharField(max_length=500, blank=True, null=True,
        help_text='Advance reference numbers included in this deduction')
    net_gratuity_payable     = models.FloatField(default=0, blank=True,
        help_text='Gross gratuity minus debt deduction')

    # â”€â”€ Calculation Remarks (auto-generated, read-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    calculation_remarks = models.TextField(blank=True, null=True,
        help_text='Auto-generated step-by-step calculation breakdown shown to HR')

    # â”€â”€ Statutory Cap Override â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    OVERRIDE_CAP_CHOICES = [
        ('inherit', 'Use Branch Setting'),
        ('on',      'Force Cap ON'),
        ('off',     'Force Cap OFF'),
    ]
    override_statutory_cap = models.CharField(
        max_length=10, choices=OVERRIDE_CAP_CHOICES,
        default='inherit', blank=True,
        help_text=(
            'inherit = use branch gratuity_apply_statutory_cap setting. '
            'on = force cap ON for this employee. '
            'off = force cap OFF (special contract).'
        )
    )

    # â”€â”€ Termination / Forfeiture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    TERMINATION_CHOICES = [
        ('normal',      'Normal / Resignation'),
        ('article_44',  'Terminated â€“ Article 44 (Non-Assault)'),
        ('article_54',  'Terminated â€“ Article 54 (Gross Misconduct)'),
    ]
    termination_reason = models.CharField(
        max_length=20, choices=TERMINATION_CHOICES, default='normal', blank=True)
    gratuity_forfeited = models.BooleanField(default=False,
        help_text='True when terminated under Article 54 â€“ full gratuity forfeited')

    # â”€â”€ Service Display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    service_years_display = models.CharField(max_length=50, blank=True, null=True,
        help_text='Human-readable service period e.g. "3 yrs 2 mos 15 days"')

    # â”€â”€ Settlement Due Date (UAE Labour Law: DOR + 14 days) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    settlement_due_date = models.DateField(null=True, blank=True,
        help_text='Statutory settlement deadline = DOR + 14 calendar days')

    # â”€â”€ Pre-Forfeiture Gross (audit trail for Article 54) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    gross_gratuity_before_forfeiture = models.FloatField(default=0, blank=True,
        help_text='What gross gratuity would have been before Article 54 forfeiture (audit)')

    # â”€â”€ Residual Employee Debt (excess advance over gratuity) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    residual_employee_debt = models.FloatField(default=0, blank=True,
        help_text='MAX(debt_deduction - gross_gratuity, 0) â€” outstanding balance after gratuity offset')

    # â”€â”€ Status Lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    STATUS_CHOICES = [
        ('draft',        'Draft'),
        ('calculated',   'Calculated'),
        ('submitted',    'Submitted'),
        ('under_review', 'Under Review'),
        ('approved',     'Approved'),
        ('rejected',     'Rejected'),
        ('posted',       'Posted'),
        ('paid',         'Paid / Settled'),
        ('reversed',     'Reversed'),
        ('cancelled',    'Cancelled'),
    ]
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='draft', blank=True,
        help_text='Lifecycle status of this gratuity form')

    class Meta:
        db_table = 'hrm_gratuityemployeeform'
        default_permissions = {}
        permissions = [
            ('custom_approval_stage_initiator', 'Can approve as initiator'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),
            ('custom_approval_stage_secondary_approver', 'Can approve as secondary approver'),
        ]

    def save(self, *args, **kwargs):
        # Last Working Date is mandatory before final approval
        if self.approval_status == 'APPROVED' and not self.dor:
            from rest_framework.serializers import ValidationError
            raise ValidationError(
                {'dor': 'Last Working Date (Date of Relieving) is required before approving the gratuity form.'}
            )
        super().save(*args, **kwargs)


class Gratuity(AuditUuidModelMixin):
    class Meta:
        db_table = 'hrm_gratuity'

    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)


class GratuityCalculations(AuditUuidModelMixin):
    employee_id = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, related_name="emp_gratuity")
    gratuity_cal_type = models.CharField(max_length=1, default=1, null=False)
    monthly_sal_id = models.ForeignKey(EmployeeMonthlySalary, on_delete=models.CASCADE, related_name="m_sal_gratuity",
                                       null=True)
    calculation_date = models.CharField(max_length=30, null=True)
    gratuity_amount = models.CharField(max_length=30, null=True)

    class Meta:
        db_table = 'hrm_gratuitycalculations'
        pass


class SalaryHold(AuditUuidModelMixin,ApprovalModelMixin):
    employee_ids    = models.JSONField(default=list, blank=True)   # list of EmployeeMaster PKs
    employee_names  = models.TextField(null=True, blank=True)      # display string
    hold_from_date  = models.DateField(null=True, blank=True)
    hold_to_date    = models.DateField(null=True, blank=True)
    reason          = models.TextField(null=True, blank=True)
    remarks         = models.TextField(null=True, blank=True)
    released_on     = models.DateField(null=True, blank=True)
    release_remarks = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'hrm_salaryhold'
        ordering = ['-hold_from_date']


class SalaryCalculation(AuditUuidModelMixin, ApprovalModelMixin):
    class Meta:
        db_table = 'hrm_salarycalculation'

    salary_number          = models.CharField(max_length=100, null=True, blank=True)
    selection_mode         = models.CharField(max_length=20, default='month')
    month                  = models.IntegerField(null=True, blank=True)
    employee_type          = models.JSONField(default=dict, blank=True)
    from_date              = models.DateField(null=True, default=None, blank=True)
    to_date                = models.DateField(null=True, default=None, blank=True)
    filter_criteria        = models.CharField(max_length=30, null=True, blank=True)
    filter_employee_ids    = models.TextField(null=True, blank=True)
    filter_employee_type   = models.CharField(max_length=255, null=True, blank=True)
    filter_designation_ids = models.TextField(null=True, blank=True)
    filter_department_ids  = models.TextField(null=True, blank=True)
    filter_sponsor         = models.TextField(null=True, blank=True,default=None)
    selected_columns       = models.JSONField(default=list, blank=True)


class EmployeeList(AuditUuidModelMixin):
    salary = models.ForeignKey("hrm_main.SalaryCalculation", on_delete=models.CASCADE,
                               null=True, related_name="employee_list")
    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True, default=None)
    employee_code = models.CharField(max_length=100, null=True, blank=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    no_of_days = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    ot = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    other_expense = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    other_incentive = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    tds = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    income_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    advance = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    net_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    advance_emi = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    gross_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    deductions_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    base_gross_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    base_deductions_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    lop_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    basic = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    variable = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    employee_type = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    designation = models.CharField(max_length=100, null=True, blank=True)
    allowance_details        = models.JSONField(default=dict, null=True, blank=True)
    deduction_details        = models.JSONField(default=dict, null=True, blank=True)
    other_allowances         = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    other_allowances_detail  = models.JSONField(default=list, null=True, blank=True)
    employer_pf_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)

    SALARY_STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('processed',  'Processed'),
        ('hold',       'Hold'),
        ('rejected',   'Rejected'),
    ]
    salary_status    = models.CharField(max_length=20, choices=SALARY_STATUS_CHOICES, default='processing', null=True, blank=True)
    sponsors         = models.CharField(max_length=255, null=True, blank=True)
    leave_days       = models.IntegerField(default=0, null=True, blank=True)
    working_days     = models.IntegerField(default=0, null=True, blank=True)
    advance_balance  = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    earned           = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    arrears          = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    remarks          = models.TextField(null=True, blank=True)
    salary_breakdown = models.JSONField(default=dict, null=True, blank=True,
                                        help_text="Full salary breakdown snapshot for this period. "
                                                  "Keys: allowances (list), deductions (list incl. LOP), "
                                                  "attendance (per-status with is_paid/pay_percentage/lop_contribution), "
                                                  "summary (gross_pay, lop_amount, ot_amount, earned, "
                                                  "total_deductions, advance_emi, arrears, net_pay)")

    class Meta:
        db_table = 'hrm_employeelist'
        ordering = ["id"]  # Default ordering
        # pass

    # @classmethod
    # def sorted_queryset(cls):
    #     return cls.objects.raw('SELECT * FROM hrm_employeelist ORDER BY first_name COLLATE "C"')


class AllowanceDetails(AuditUuidModelMixin):
    allowance_salary = models.ForeignKey("hrm_main.EmployeeList", on_delete=models.CASCADE,
                                         null=True, related_name="employee_gross")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_allowancedetails'
        ordering = ['created']


class DeductionDetails(AuditUuidModelMixin):
    deduction_salary = models.ForeignKey("hrm_main.EmployeeList", on_delete=models.CASCADE,
                                         null=True, related_name="employee_deduction")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)
    yearly = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_deductiondetails'
        ordering = ['created']


class OTSalaryCalculation(AuditUuidModelMixin, ApprovalModelMixin):
    PAYROLL_TYPE_CHOICES = [
        ('Operations', 'Operations'),
        ('All', 'All'),
    ]
    SELECTION_MODE_CHOICES = [
        ('month',      'Month'),
        ('date_range', 'Date Range'),
    ]
    ot_payroll_number = models.CharField(max_length=100, null=True, blank=True)
    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    payroll_type = models.CharField(
        max_length=20, choices=PAYROLL_TYPE_CHOICES, default='Operations', null=True, blank=True
    )
    selection_mode = models.CharField(
        max_length=20, choices=SELECTION_MODE_CHOICES, default='month', null=True, blank=True
    )
    month = models.IntegerField(null=True, blank=True)
    # Filter criteria â€” only used when payroll_type = 'All'
    filter_type = models.CharField(max_length=20, null=True, blank=True)  # Individual / Designation / Department
    filter_value = models.CharField(max_length=200, null=True, blank=True)  # comma-separated IDs / single value
    selected_columns = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'hrm_otsalarycalculation'
        ordering = ['-created']


class OTEmployeeList(AuditUuidModelMixin):
    ot_salary = models.ForeignKey("hrm_main.OTSalaryCalculation", on_delete=models.CASCADE,
                                  null=True, related_name="ot_employee_list")
    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True, default=None)
    employee_code = models.CharField(max_length=100, null=True, blank=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    designation = models.CharField(max_length=200, null=True, blank=True)
    department = models.CharField(max_length=200, null=True, blank=True)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    total_ot_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    ot_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    allowance_breakdown = models.JSONField(default=list, null=True, blank=True)  # [{name, amount}, ...]
    deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    net_ot_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)

    class Meta:
        db_table = 'hrm_otemployeelist'
        ordering = ['first_name']


class AttendanceImport(AuditUuidModelMixin):
    date = models.DateField(null=True, default=None, blank=True)
    import_code = models.CharField(max_length=30, blank=True, null=True)
    file_name = models.CharField(max_length=500, blank=True, null=True)
    import_file = models.FileField(upload_to="files", null=True, blank=True, default=None)

    class Meta:
        db_table = 'hrm_attendanceimport'
        # pass
        unique_together = ('date', 'b_id')


class AttendanceDetails(AuditUuidModelMixin, ApprovalModelMixin):
    date = models.DateField(null=True, default=None, blank=True)
    attendance = models.ForeignKey("AttendanceImport", on_delete=models.CASCADE,
                                   null=True, related_name="attendance_details")
    employee_name = models.CharField(max_length=100, blank=True, null=True)
    employee_code = models.CharField(max_length=100, blank=True, null=True)
    login_time = models.CharField(max_length=100, blank=True, null=True)
    logout_time = models.CharField(max_length=100, blank=True, null=True)
    processed_total_hour = models.CharField(max_length=100, blank=True, null=True)
    shift = models.CharField(max_length=100, blank=True, null=True)
    shift_in = models.CharField(max_length=100, blank=True, null=True)
    shift_out = models.CharField(max_length=100, blank=True, null=True)
    working_time = models.CharField(max_length=100, blank=True, null=True)
    total_hours = models.CharField(max_length=100, blank=True, null=True)
    processed_logout_time = models.CharField(max_length=100, blank=True, null=True)
    ot_hrs = models.CharField(max_length=100, blank=True, null=True)
    extra_hrs = models.CharField(max_length=100, blank=True, null=True, default="0")
    hot_hrs = models.CharField(max_length=100, blank=True, null=True, default="0")
    ot2_hrs = models.CharField(max_length=100, blank=True, null=True, default="0", help_text="night ot")
    less_hrs = models.CharField(max_length=100, blank=True, null=True, default="0")
    late_hrs = models.CharField(max_length=100, blank=True, null=True, default="0")
    permitted_ot = models.CharField(max_length=100, blank=True, null=True, default="0")
    scheduled_ot = models.CharField(max_length=100, blank=True, null=True, default="0")
    is_consecutive_weekly_off = models.BooleanField(default=False)
    status = models.CharField(max_length=100, blank=True, null=True)
    edited_data = models.JSONField(blank=True, null=True, help_text="JSON input to store temp edited data",
                                   default=None)
    t_enter_id = models.IntegerField(null=True, default=None, blank=True,
                                     help_text="integrated table ID through schedular")
    remarks = models.TextField(default="", null=True, blank=True)
    break_hrs = models.CharField(max_length=100, blank=True, null=True, default="0")

    class Meta:
        db_table = 'hrm_attendancedetails'
        ordering = ['id']
        verbose_name = 'Timesheet'
        permissions = [
            ("custom_can_approve_timesheet", "Can Approve Timesheet"),
            ("custom_can_edit_timesheet", "Can Edit Timesheet"),
            ("custom_can_view_actual_timesheet", "Can View Actual Timesheet")
        ]


class FinalSettlement(AuditUuidModelMixin, ApprovalModelMixin):
    employee = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.CASCADE, null=True, blank=True)
    date_of_resignation_lt_received = models.DateField(null=True, default=None, blank=True)
    dor = models.DateField(null=True, default=None, blank=True)
    relieving_certificate = models.CharField(max_length=100, blank=True, null=True)
    notice_period = models.CharField(max_length=100, blank=True, null=True)
    total_experience = models.CharField(max_length=100, blank=True, null=True)
    gross_salary_month = models.FloatField(default=0, blank=True, null=True)
    net_salary_month = models.FloatField(default=0, blank=True, null=True)
    earned_leaves_balance = models.CharField(max_length=100, blank=True, null=True)
    salary_payable_days = models.FloatField(default=0, blank=True, null=True)
    gross_salary_payable_days = models.FloatField(default=0, blank=True, null=True)
    deduction_total = models.FloatField(default=0, blank=True, null=True)
    allowance_total = models.FloatField(default=0, blank=True, null=True)
    total_payable_amount = models.FloatField(default=0, blank=True, null=True)
    gross_salary_payable_amount = models.FloatField(default=0, blank=True, null=True)
    copy_final_settlement_deduction = models.JSONField(default=dict, null=True, blank=True)

    class Meta:
        db_table = 'hrm_finalsettlement'
        ordering = ['created']
        # unique_together = ('employee', 'b_id')


class FinalSettlementEmployeeMonthlyAllowanceDetails(AuditUuidModelMixin):
    final_settlement = models.ForeignKey(FinalSettlement, on_delete=models.CASCADE, null=True,
                                         blank=True,
                                         related_name="final_settlement_allowance")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_finalsettlementemployeemonthlyallowancedetails'
        ordering = ['created']


class FinalSettlementEmployeeMonthlyDeductionDetails(AuditUuidModelMixin):
    final_settlement = models.ForeignKey(FinalSettlement, on_delete=models.CASCADE, null=True,
                                         blank=True, related_name="final_settlement_deduction")
    components = models.CharField(max_length=100, blank=True, null=True)
    monthly = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_finalsettlementemployeemonthlydeductiondetails'
        ordering = ['created']


class TaDa(AuditUuidModelMixin, ApprovalModelMixin):
    tada_number = models.CharField(max_length=100, blank=True, null=True)
    employee = models.ForeignKey("hrm_master.EmployeeMaster", on_delete=models.PROTECT, null=True)
    employee_first_name = models.CharField(max_length=100, blank=True, null=True)
    employee_department_name = models.CharField(max_length=100, blank=True, null=True)
    employee_designation_name = models.CharField(max_length=100, blank=True, null=True)
    total_cost = models.CharField(max_length=100, blank=True, null=True)
    travel_planning = models.ManyToManyField('hrm_main.TravelPlanning', related_name="tada_travel_planning",
                                             default=[], blank=True)
    travel_planning_numbers = models.TextField(default="", null=True, blank=True)

    class Meta:
        db_table = 'hrm_tada'
        pass


class TaDaDetails(AuditUuidModelMixin):
    tada = models.ForeignKey("hrm_main.TaDa", on_delete=models.CASCADE,
                             null=True, related_name="tada_details")
    expense_name = models.CharField(max_length=100, blank=True, null=True)
    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    cost = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'hrm_tadadetails'
        ordering = ('id',)


class TaDaDetailsImages(AuditUuidModelMixin):
    tada_details = models.ForeignKey("hrm_main.TaDaDetails", on_delete=models.CASCADE, null=True,
                                     blank=True,
                                     related_name="tada_details_images")
    file = models.FileField(upload_to="tada/images", null=True, blank=True, default=None)
    file_name = models.TextField(default='', null=True, blank=True)
    size = models.CharField(max_length=100, null=True, blank=True)
    file_type = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'hrm_tadadetailsimages'
        pass


class TravelPlanning(AuditUuidModelMixin, ProtectWithDeleteMixin):
    plan_number = models.CharField(max_length=100, blank=True, null=True)
    employee = models.ForeignKey("hrm_master.EmployeeMaster", on_delete=models.PROTECT, null=True)
    from_date = models.DateField(null=True, default=None, blank=True)
    to_date = models.DateField(null=True, default=None, blank=True)
    place_name = models.CharField(max_length=100, blank=True, null=True)
    to_address = models.TextField(blank=True, null=True)
    total_distance = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_travelplanning'
        pass


class TravelPlanningLog(AuditUuidModelMixin):
    travel_planning = models.ForeignKey("hrm_main.TravelPlanning", on_delete=models.PROTECT, null=True)
    checkin_flag = models.BooleanField(default=False)
    checkin_date = models.DateField(blank=True, null=True)
    checkin_time = models.TimeField(blank=True, null=True)
    checkin_location = models.TextField(blank=True, null=True)
    checkin_photo = models.FileField(upload_to="hrm/checkin/travelplanninglog", blank=True, null=True)
    checkout_flag = models.BooleanField(default=False)
    checkout_date = models.DateField(blank=True, null=True)
    checkout_time = models.TimeField(blank=True, null=True)
    checkout_location = models.TextField(blank=True, null=True)
    total_log_time = models.CharField(max_length=100, blank=True, null=True)
    breakin_flag = models.BooleanField(default=False)
    breakin_time = models.TimeField(blank=True, null=True)
    breakout_flag = models.BooleanField(default=False)
    breakout_time = models.TimeField(blank=True, null=True)
    total_break_time = models.CharField(max_length=100, blank=True, null=True)
    checkout_photo = models.FileField(upload_to="hrm/checkout/travelplanninglog", blank=True, null=True)
    distance_latitude = models.CharField(max_length=200, blank=True, null=True)
    distance_longitude = models.CharField(max_length=200, blank=True, null=True)
    distance = models.FloatField(default=0, blank=True, null=True)

    class Meta:
        db_table = 'hrm_travelplanninglog'
        pass


class GraceDetails(AuditUuidModelMixin,ProtectDeleteMixin):
    type = models.CharField(max_length=50, default="", verbose_name="Type")
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)
    min_work_mins = models.IntegerField(default=0, null=True, blank=True)  # Minimum work minutes
    max_work_mins = models.IntegerField(default=0, null=True, blank=True)  # Maximum work minutes
    break_time = models.IntegerField(default=0, null=True, blank=True)  # Break time in minutes
    max_day_ot_mins = models.IntegerField(default=0, null=True, blank=True)  # Maximum Day OT Minutes
    max_night_ot_mins = models.IntegerField(default=0, null=True, blank=True)  # Maximum Night OT Minutes
    weekly_off_work_mins = models.IntegerField(default=0, null=True, blank=True)  # Weekly off work minutes
    wo_max_day_ot_mins = models.IntegerField(default=0, null=True, blank=True)  # Weekly Off Maximum Day OT Minutes
    wo_max_night_ot_mins = models.IntegerField(default=0, null=True, blank=True)  # Weekly Off Maximum Night OT Minutes
    wo_break_time = models.IntegerField(default=0, null=True, blank=True)
    total_work_hours = models.IntegerField(default=0, null=True, blank=True)
    emp_type = models.CharField(max_length=50, default=None, blank=True, null=True)  # Employee Type
    description = models.CharField(max_length=250, default="", blank=True, null=True)
    emp_group = models.CharField(max_length=50, default=None, blank=True, null=True)
    emp_reporting = models.CharField(max_length=50, default=None, blank=True, null=True)
    shift = models.ForeignKey('hrm_master.ShiftMaster', on_delete=models.SET_NULL, null=True, blank=True, related_name='grace_details')
    lop_on_absent = models.BooleanField(default=False)  # If True: absent day + subsequent WO both become LOP

    class Meta:
        db_table = 'hrm_gracedetails'
        pass


class DisciplinaryAction(AuditUuidModelMixin, ApprovalModelMixin):
    PENALTY_CHOICES = [
        ('verbal_warning',   'Verbal Warning'),
        ('written_warning',  'Written Warning'),
        ('show_cause',       'Show Cause Notice'),
        ('pay_deduction',    'Pay Deduction'),
        ('suspension',       'Suspension Without Pay'),
        ('termination',      'Termination'),
    ]
    AFFECTS_PAY_PENALTIES = {'pay_deduction', 'suspension'}

    reference_no   = models.CharField(max_length=30, unique=True, editable=False)
    employee       = models.ForeignKey('hrm_master.EmployeeMaster', on_delete=models.SET_NULL, null=True, blank=True, related_name='disciplinary_actions')
    violation_type = models.CharField(max_length=100, null=True, blank=True)   # value from GlobalMaster key=violation_type
    penalty_type   = models.CharField(max_length=30, choices=PENALTY_CHOICES)
    affects_pay    = models.BooleanField(default=False)
    from_date      = models.DateField(null=True, blank=True)
    to_date        = models.DateField(null=True, blank=True)
    description    = models.TextField(null=True, blank=True)
    attachment     = models.FileField(upload_to='disciplinary_attachments/', null=True, blank=True)

    class Meta:
        db_table = 'hrm_disciplinaryaction'
        permissions = [
            ('custom_can_approve_disciplinary_action', 'Can approve disciplinary action'),
        ]

    def save(self, *args, **kwargs):
        if not self.reference_no:
            from django.db.models import Max
            last = DisciplinaryAction.objects.aggregate(Max('id'))['id__max'] or 0
            self.reference_no = f'DA-{self.created.year if hasattr(self, "created") and self.created else __import__("datetime").date.today().year}-{str(last + 1).zfill(5)}'
        self.affects_pay = self.penalty_type in self.AFFECTS_PAY_PENALTIES
        super().save(*args, **kwargs)


class AttendanceStatusMaster(AuditUuidModelMixin, ProtectDeleteMixin):
    class Meta:
        db_table = 'hrm_attendancestatusmaster'

    description = models.TextField(verbose_name="Description", blank=True, null=True)
    code = models.CharField(max_length=20, unique=True, verbose_name="Code", null=True, blank=True)
    status_name = models.CharField(max_length=50, verbose_name="Status Name")
    type = models.CharField(max_length=50, verbose_name="Status Type", null=True, blank=True, default='Attendance')
    is_paid = models.BooleanField(default=True, verbose_name="Is Paid",
                                  help_text="If True, days with this status attract full salary (or partial via "
                                            "leave policy pay_percentage). If False, full daily salary is deducted.")






# ============================================================
# Expense Claim Module
# ============================================================


class ExpenseClaimCategory(AuditUuidModelMixin):
    name = models.CharField(max_length=100, null=True, blank=True)
    code = models.CharField(max_length=100, blank=True, null=True)
    requires_receipt = models.BooleanField(default=True)

    class Meta:
        db_table = 'hrm_expenseclaimcategory'
        ordering = ['name']


class ExpenseClaimLinkType(AuditUuidModelMixin):
    label = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )


    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='expense_claim_link_types'
    )

    display_field = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    search_url = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )

    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'hrm_expenseclaimlinktype'
        ordering = ['order', 'label']


class ExpenseClaim(AuditUuidModelMixin,ApprovalModelMixin,metaclass=MultiApprovalMixinBase):

    PAID_BY_CHOICES = [
        ('OUT_OF_POCKET', 'Out of Pocket'),
        ('CASH_ADVANCE', 'Cash Advance'),
        ('PETTY_CASH', 'Petty Cash'),
        ('COMPANY_CARD', 'Company Card'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('MANAGER_APPROVED', 'Manager Approved'),
        ('HR_APPROVED', 'HR Approved'),
        ('FINANCE_APPROVED', 'Finance Approved'),
        ('PAID', 'Paid'),
        ('REJECTED', 'Rejected'),
    ]

    claim_no = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    claim_name = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )

    claimant = models.ForeignKey(
        'hrm_master.EmployeeMaster',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='expense_claims'
    )

    submitted_by = models.ForeignKey(
        'hrm_master.EmployeeMaster',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='submitted_expense_claims'
    )

    period_from = models.DateField(
        null=True,
        blank=True
    )

    period_to = models.DateField(
        null=True,
        blank=True
    )

    business_purpose = models.TextField(
        null=True,
        blank=True
    )

    paid_by = models.CharField(
        max_length=30,
        choices=PAID_BY_CHOICES,
        default='OUT_OF_POCKET',
        null=True,
        blank=True
    )

    advance_reference = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    advance_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    total_claimed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    net_payable = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    excess_to_return = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='DRAFT',
        null=True,
        blank=True
    )

    rejection_reason = models.TextField(
        null=True,
        blank=True
    )

    payment_reference = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    payment_date = models.DateField(
        null=True,
        blank=True
    )

    remarks = models.TextField(
        null=True,
        blank=True
    )

    petty_cash_fund = models.ForeignKey(
        'hrm_main.PettyCashFund',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expense_claims'
    )

    class Meta:
        db_table = 'hrm_expenseclaim'
        ordering = ['-created']
        permissions = [
            ('custom_approval_stage_initiator', 'Can approve as initiator'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),
            ('custom_approval_stage_secondary_approver', 'Can approve as secondary approver'),
        ]


class ExpenseClaimLine(AuditUuidModelMixin):
    claim = models.ForeignKey(
        'hrm_main.ExpenseClaim',
        on_delete=models.CASCADE,
        null=True,
        related_name='lines'
    )

    expense_date = models.DateField(
        null=True,
        blank=True
    )

    category = models.ForeignKey(
        'hrm_main.ExpenseClaimCategory',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='expense_claim_lines'
    )

    vendor_name = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )

    description = models.TextField(
        null=True,
        blank=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    receipt_attached = models.BooleanField(
        default=False
    )

    link_type = models.ForeignKey(
        'hrm_main.ExpenseClaimLinkType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expense_claim_lines'
    )

    linked_object_id = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    linked_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expense_claim_linked_objects'
    )

    linked_object = GenericForeignKey(
        'linked_content_type',
        'linked_object_id'
    )

    class Meta:
        db_table = 'hrm_expenseclaimline'
        ordering = ['id']


class ExpenseClaimAttachment(AuditUuidModelMixin):
    claim = models.ForeignKey(
        'hrm_main.ExpenseClaim',
        on_delete=models.CASCADE,
        null=True,
        related_name='attachments'
    )

    file = models.FileField(
        upload_to='expense_claims/',
        null=True,
        blank=True,
        default=None
    )

    file_name = models.CharField(
        max_length=200,
        null=True,
        blank=True
    )



    class Meta:
        db_table = 'hrm_expenseclaimattachment'
        ordering = ['created']


# ============================================================
# Petty Cash Module
# ============================================================


class PettyCashFund(AuditUuidModelMixin,ApprovalModelMixin,metaclass=MultiApprovalMixinBase):

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('CLOSED', 'Closed'),
    ]

    fund_no = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True
    )

    holder = models.ForeignKey(
        'hrm_master.EmployeeMaster',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='petty_cash_funds'
    )

    opening_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    current_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    fund_date = models.DateField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        null=True,
        blank=True
    )

    remarks = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'hrm_pettycashfund'
        ordering = ['-created']
        permissions = [
            ('custom_approval_stage_initiator', 'Can approve as initiator'),
            ('custom_approval_stage_HR', 'Can approve as HR'),
            ('custom_approval_stage_approver', 'Can approve as approver'),
            ('custom_approval_stage_secondary_approver', 'Can approve as secondary approver'),
        ]


class PettyCashTransaction(AuditUuidModelMixin):

    TRANSACTION_TYPE_CHOICES = [
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    ]

    SOURCE_TYPE_CHOICES = [
        ('OPENING', 'Opening'),
        ('REPLENISHMENT', 'Replenishment'),
        ('EXPENSE_CLAIM', 'Expense Claim'),
    ]

    fund = models.ForeignKey(
        'hrm_main.PettyCashFund',
        on_delete=models.CASCADE,
        null=True,
        related_name='transactions'
    )

    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES,
        null=True,
        blank=True
    )

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        null=True,
        blank=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        null=True,
        blank=True
    )

    transaction_date = models.DateField(
        null=True,
        blank=True
    )

    expense_claim = models.ForeignKey(
        'hrm_main.ExpenseClaim',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='petty_cash_txns'
    )

    reference = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    remarks = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'hrm_pettycashtransaction'
        ordering = ['-transaction_date', '-created']