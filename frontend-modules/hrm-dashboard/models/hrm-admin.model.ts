export interface HRMAdminDashboardData {
  admin: boolean,
  departments: Department[],
  employee_type: EmployeeType[],
  holidays: Holiday[],
  leave_application: LeaveApplication[],
  todays_attendance: number,
  total_no_of_employees: number,
}

export interface Department {
  department_code: string,
  department_name: string,
  number_of_employees: number,
}

export interface EmployeeType {
  [key: string]: number,
}

export interface Holiday {
  date: string,
  description: string,
}

export interface LeaveApplication {
  employee__employee_code: string,
  employee__first_name: string,
  leave_type: number,
  from_date: string,
  to_date: string,
  approval_status: string,
}