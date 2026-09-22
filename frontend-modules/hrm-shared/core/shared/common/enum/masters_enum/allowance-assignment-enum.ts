export enum AllowanceAssignmentEnum {
    batch_id               = 'batch_id',
    assignment_code        = 'assignment_code',
    approval_status        = 'approval_status',
    employee               = 'employee',
    allowance              = 'allowance',
    allowance_code         = 'allowance_code',
    allowance_name         = 'allowance_name',
    allowance_type         = 'allowance_type',
    mode                   = 'mode',
    amount                 = 'amount',
    rate                   = 'rate',
    remark                 = 'remark',
    from_date              = 'from_date',
    to_date                = 'to_date',
    filter_criteria        = 'filter_criteria',
    filter_designation_ids = 'filter_designation_ids',
    filter_department_ids  = 'filter_department_ids',
    employees              = 'employees',
    is_active              = 'is_active',
    // display-only (computed / serializer fields)
    employee_name  = 'employee_name',
    employee_code  = 'employee_code',
    designation_name = 'designation_name',
    department_name  = 'department_name',
    amount_display   = 'amount_display',
    employee_count   = 'employee_count',
}

export enum AllowanceAssignmentModeEnum {
    manual = 'manual',
    auto   = 'auto',
}

export enum AllowanceAssignmentCriteriaEnum {
    employee_wise = 'employee_wise',
    designation   = 'designation',
    department    = 'department',
}

export enum AllowanceAssignmentEmployeeEnum {
    employee         = 'employee',
    employee_code    = 'employee_code',
    employee_name    = 'employee_name',
    designation_name = 'designation_name',
    department_name  = 'department_name',
    amount           = 'amount',
    rate             = 'rate',
    remark           = 'remark',
}
