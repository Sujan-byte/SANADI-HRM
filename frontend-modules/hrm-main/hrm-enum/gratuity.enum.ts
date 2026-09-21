export enum GratuityEnum {
    employee                  = 'employee',
    employee_name             = 'employee_name',
    dob                       = 'dob',
    doc                       = 'doc',
    dor                       = 'dor',
    doj                       = 'doj',
    present_basic_pay         = 'present_basic_pay',
    department_name           = 'department_name',
    service_years             = 'service_years',
    total_gratuity_monthly    = 'total_gratuity_monthly',
    total_gratuity_yearly     = 'total_gratuity_yearly',
    designation_name          = 'designation_name',
    grade_code                = 'grade_code',

    // Unpaid leave
    consider_unpaid_leave     = 'consider_unpaid_leave',
    consider_auto_sync        = 'consider_auto_sync',
    unpaid_leave_days_manual  = 'unpaid_leave_days_manual',
    unpaid_leave_days_system  = 'unpaid_leave_days_system',
    unpaid_leave_days_total   = 'unpaid_leave_days_total',
    unpaid_leave_last_synced  = 'unpaid_leave_last_synced',

    // Debt deduction
    consider_debt_deduction   = 'consider_debt_deduction',
    debt_deduction            = 'debt_deduction',
    debt_deduction_remark     = 'debt_deduction_remark',
    net_gratuity_payable      = 'net_gratuity_payable',

    // Termination / cap override
    termination_reason        = 'termination_reason',
    gratuity_forfeited        = 'gratuity_forfeited',
    override_statutory_cap    = 'override_statutory_cap',

    // Calculation breakdown (readonly)
    calculation_remarks       = 'calculation_remarks',

    // New FRD fields
    service_years_display              = 'service_years_display',
    settlement_due_date                = 'settlement_due_date',
    gross_gratuity_before_forfeiture   = 'gross_gratuity_before_forfeiture',
    residual_employee_debt             = 'residual_employee_debt',
    status                             = 'status',

    // Form identity & workflow
    form_number                        = 'form_number',
    calculation_type                   = 'calculation_type',
    notice_completion_status           = 'notice_completion_status',
    basic_salary_manual_override       = 'basic_salary_manual_override',
    forfeiture_ref                     = 'forfeiture_ref',

    // Documents
    resignation_letter                 = 'resignation_letter',
    forfeiture_document                = 'forfeiture_document',
    supporting_document                = 'supporting_document',
}