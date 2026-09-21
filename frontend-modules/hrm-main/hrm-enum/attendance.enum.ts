export enum AttendanceImportEnum {
    attendance = 'attendance',
    date = 'date',
    attendance_details = 'attendance_details'
}
export enum AttendanceDetailsEnum {
    attendance = 'attendance',
    date = 'date',
    employee_code = 'employee_code',
    employee_name = 'employee_name',
    login_time = 'login_time',
    logout_time = 'logout_time',
    working_time = 'working_time',
    status = 'status',

}


export enum TimeSheetDetailsEnum {
    date = 'date',
    conDate = 'converted_date',
    attendance = 'attendance',
    employeeName = 'employee_name',
    employeeCode = 'employee_code',
    employeeType = 'employee_type',
    loginTime = 'login_time',
    logoutTime = 'logout_time',
    // conLoginTime = 'converted_login_time',
    // conLogoutTime = 'converted_logout_time',
    shift = 'shift',
    shiftIn = 'shift_in',
    shiftOut = 'shift_out',
    conWorkingTime = 'converted_working_time',
    conTotalHours = 'converted_total_hours',
    conOtHrs = 'converted_ot_hrs',
    workingTime = 'working_time',
    totalHours = 'total_hours',
    otHrs = 'ot_hrs',
    ot2Hrs = 'ot2_hrs',
    hotHrs = 'hot_hrs',
    lessHrs = 'less_hrs',
    comOt2Hrs = 'converted_ot2_hrs',
    conHotHrs = 'converted_hot_hrs',
    conLessHrs = 'converted_less_hrs',
    conExtraHrs = 'converted_extra_hrs',
    extraHrs = 'extra_hrs',
    status = 'status',
    permittedOT = 'permitted_ot',
    convertedPermittedOT = 'converted_permitted_ot',
    remarks='remarks',
    breakHrs='break_hrs',
    convertedBreakHrs='converted_break_hrs'
  }
