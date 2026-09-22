export class FinalSettlementModel {
    employee: number;
    employee_name: string;
    dob: null;
    doc: null;
    dor: null;
    present_basic_pay: number = 0;
    service_years: any;
    total_gratuity_monthly: any;
    total_gratuity_yearly: any;
    default_employee_object: Record<string, any>;
    date_of_resignation_lt_received: any;
    last_working_date: any;
    notice_period: any;
    total_experience: any;
    relieving_certificate: any;
    salary_advance: any;
    final_settlement_allowance: any;
    final_settlement_deduction: any;
    gross_salary_month: number = 0;
    net_salary_month: number = 0;
    earned_leaves_balance: number = 0;
    gross_salary_payable_days: number = 0;
    total_payable_amount: number = 0;
    deduction_total: Number = 0;
    allowance_total: Number = 0;
    gross_salary_payable_amount: Number = 0;
    copy_final_settlement_deduction: any;

}
export class FinalSettlementAllowance {
    id?: any;
    components: string;
    monthly: number;
}

export class FinalSettlementDeductions {
    id?: any;
    components: string;
    monthly: number;
}