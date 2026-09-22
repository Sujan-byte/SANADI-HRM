export class GradeModel {
  grade_code: string = '';
  grade_description: string = '';
  gross_monthly_total: number = 0;
  gross_yearly_total: number = 0;
  deduction_monthly_total: number = 0;
  deduction_yearly_total: number = 0;
  grade_gross_earnings: Array<GradeGrossEarningsModel>
  grade_gross_deductions: Array<GradeGrossDeductionsModel>
  confirm_msg: any;
}

export class GradeGrossEarningsModel {
  id?: any;
  components: string;
  monthly: number;
  yearly: number;
  table_row_id?: number;
  salary_component?: number;
}

export class GradeGrossDeductionsModel {
  id?: any;
  table_row_id?: number;
  components: string;
  monthly: number;
  yearly: number;
  salary_component?: number;
}