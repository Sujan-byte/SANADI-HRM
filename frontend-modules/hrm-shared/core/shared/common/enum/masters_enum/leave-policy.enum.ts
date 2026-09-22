// Define enums for field names
export enum LeavePolicyEnum {
  employee_type = 'employee_type',
  employee_group = 'employee_group',
  employee_reporting = 'employee_reporting',
  type_of_leave = 'type_of_leave',
  leave_policy_details = 'leave_policy_details',
  year_to_year_carry = 'year_to_year_carry',
  carry_threshold_value = 'carry_threshold_value',
  type_of_days = 'type_of_days',
  min_stretch_days = 'min_stretch_days',
  max_stretch_days = 'max_stretch_days',
  effective_from = 'effective_from',
  effective_to = 'effective_to',
  eligible_after_days = 'eligible_after_days',
  backdated_days_limit = 'backdated_days_limit',
  allow_advance_leave = 'allow_advance_leave',
  allow_half_day = 'allow_half_day',
  require_document = 'require_document',
  require_document_after_days = 'require_document_after_days',
  lop_on_overstay = 'lop_on_overstay',
  lop_on_weekly_off_after_leave = 'lop_on_weekly_off_after_leave',
  prorate_on_join = 'prorate_on_join',
  fy_start_month = 'fy_start_month',
  year_month = 'year_month',
  pay_on = 'pay_on',
}

export enum LeavePolicyDetailEnum {
  pay_percentage = 'pay_percentage',
  number_of_days = 'number_of_days',
}
