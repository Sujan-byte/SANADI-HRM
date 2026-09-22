export class OTSalaryCalculationModel {
    id?: any;
    ot_payroll_number: string;
    payroll_type?: string = 'Operations';
    selection_mode?: string = 'month';
    month?: number = null;
    from_date?: any = null;
    to_date?: any = null;
    filter_type?: string = '';
    filter_employee?: string = '';
    filter_employee_ids?: string = '';
    filter_designation?: string = '';
    filter_designation_ids?: string = '';
    filter_department?: string = '';
    filter_department_ids?: string = '';
    selected_columns?: string[] = [];
    ot_employee_list: Array<OTEmployeeList> = [];
}

export class OTEmployeeList {
    id?: number;
    employee: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    designation?: string = '';
    department?: string = '';
    gross_salary: number;
    total_ot_hours: number;
    hourly_rate: number;
    ot_amount: number;
    allowance: number = 0;
    allowance_breakdown?: { name: string; amount: number }[] = [];
    deduction: number = 0;
    net_ot_amount: number = 0;
    ot_salary: number;
}
