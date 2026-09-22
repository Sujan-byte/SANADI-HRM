export class EmployeeSalaryModel {
    employee: number;
    employee_first_name: string;
    employee_last_name: string;
    employee_grade: string;
    effective_date: any;
    document_number: string;
    source: string;
    initial_gratuity: number;
    gross_earnings: GrossEarnings[];
    gross_deductions: Array<GrossDeductions>;
    employee_default_object: any;
    net_pay_monthly: any;
    net_pay_yearly: any;
    balance_loan_amount: any;
    loan_start_date: any;
    pf_employer: number;
    pf_employer_yearly: number;
    esi_employer: number;
    esi_employer_yearly: number;
    ctc: number;
    pf_employer_contribution: number
    esi_employer_share: number
}

export class GrossEarnings {
    id?: any;
    components: string;
    monthly: number;
    yearly: number;
    table_row_id: number;
    salary_component: number;
}

export class GrossDeductions {
    id?: any;
    components: string;
    monthly: number;
    yearly: number;
    table_row_id: number;
    salary_component: number;
}