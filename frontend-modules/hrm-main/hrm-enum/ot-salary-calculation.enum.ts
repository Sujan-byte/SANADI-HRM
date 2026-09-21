export enum OTSalaryCalculationEnum {
    ot_payroll_number = 'ot_payroll_number',
    payroll_type      = 'payroll_type',
    selection_mode    = 'selection_mode',
    month             = 'month',
    from_date         = 'from_date',
    to_date           = 'to_date',
    filter_type            = 'filter_type',
    filter_employee        = 'filter_employee',
    filter_employee_ids    = 'filter_employee_ids',
    filter_designation     = 'filter_designation',
    filter_designation_ids = 'filter_designation_ids',
    filter_department      = 'filter_department',
    filter_department_ids  = 'filter_department_ids',
    selected_columns       = 'selected_columns',
    ot_employee_list       = 'ot_employee_list',
}

export const otPayrollTypeList = [
    { label: 'Operations', value: 'Operations' },
    { label: 'All',        value: 'All' },
];

export const otFilterTypeList = [
    { label: 'None',        value: '' },
    { label: 'Individual',  value: 'Individual' },
    { label: 'Designation', value: 'Designation' },
    { label: 'Department',  value: 'Department' },
];

export enum OTEmployeeListEnum {
    employee = 'employee',
    employee_code = 'employee_code',
    first_name = 'first_name',
    last_name = 'last_name',
    designation = 'designation',
    department = 'department',
    gross_salary = 'gross_salary',
    total_ot_hours = 'total_ot_hours',
    hourly_rate = 'hourly_rate',
    ot_amount = 'ot_amount',
    allowance = 'allowance',
    allowance_breakdown = 'allowance_breakdown',
    deduction = 'deduction',
    net_ot_amount = 'net_ot_amount',
    ot_salary = 'ot_salary',
}
