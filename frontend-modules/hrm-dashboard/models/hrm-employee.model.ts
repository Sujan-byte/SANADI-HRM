export interface HRMEmployeeDashboardData {
  admin_employee: boolean,
  leaves: Leave[],
  leave_application: LeaveApplication[],
  holidays: Holiday[],
  total_leaves: number,
  number_of_leave_applied: number,
}

export interface Holiday {
  date: string,
  description: string,
}

export interface LeaveApplication {
  leave_type: number,
  from_date: string,
  to_date: string,
  no_of_days: number,
  approval_status: string,
}

export interface Leave {
  leave_type: string,
  allocated_leaves: number,
  available_leaves: number,
}