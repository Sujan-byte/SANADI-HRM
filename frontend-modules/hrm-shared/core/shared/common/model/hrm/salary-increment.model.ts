export class SalaryIncrementModel {
    id?: number;
    employee:          number;
    employee_code:     string;
    first_name:        string;
    effective_date:    any;
    reason:            string;
    increment_percentage: number = 0;
    current_gross:     number = 0;
    new_gross:         number = 0;
    arrears_amount:    number = 0;
    approval_status:   string;
    earnings:          Array<SalaryIncrementEarning>   = [];
    deductions:        Array<SalaryIncrementDeduction> = [];
}

export class SalaryIncrementEarning {
    id?:                  any;
    components:           string;
    current_amount:       number = 0;
    increment_percentage: number = 0;
    new_amount:           number = 0;
}

export class SalaryIncrementDeduction {
    id?:            any;
    components:     string;
    current_amount: number = 0;
    new_amount:     number = 0;
}
