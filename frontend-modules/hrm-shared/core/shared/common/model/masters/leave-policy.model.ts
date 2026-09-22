export class LeavePolicyModel {
  employee_type: string;
  employee_group: string;
  employee_reporting: string;
  type_of_leave: number;
  type_of_leave_name: string;
  leave_policy_details: Array<LeavePolicyDetailModel>;
  type_of_leave_default_object: Record<string, any>;
  year_to_year_carry: boolean = false;
  carry_threshold_value: number = 0;
  type_of_days: any;
  min_stretch_days: number;
  max_stretch_days: number;
  // Policy rules
  effective_from: string;
  effective_to: string;
  eligible_after_days: number = 0;
  backdated_days_limit: number = 0;
  allow_advance_leave: boolean = false;
  allow_half_day: boolean = false;
  require_document: boolean = false;
  require_document_after_days: number = 0;
  lop_on_overstay: boolean = true;
  lop_on_weekly_off_after_leave: boolean = false;
  prorate_on_join: boolean = false;
  // Accrual settings (policy-level, not per-band)
  fy_start_month: number = 1;
  year_month: string = 'Month';
  // Pay percentage basis: 'basic' = Basic Pay only, 'gross' = full Gross
  pay_on: string = 'gross';
}

export class LeavePolicyDetailModel {
  id?: string;
  leave_policy: number;
  pay_percentage: number = 100;
  number_of_days: number;
}
