export class AttendanceImportModel {
    id?: number;
    import_file: any;
    date: any
    attendance_details: any;
    importCode: any;
    fileName: any;
    fileSelected: any;
}
export class AttendanceDetails {
    id?: number;
    attendance: string;
    date: string;
    employee_code: string;
    employee_name: string;
    login_time: string;
    logout_time: string;
    working_time: string;
    status: string;
    attendance_details: Array<AttendanceDetails>
}
export class AccountDetails {
    id: any;
    date?: string | null;
    attendance?: string | null;
    employeeName?: string | null;
    employeeCode?: string | null;
    loginTime?: string | null;
    logoutTime?: string | null;
    shift?: string | null;
    shiftIn?: string | null;
    shiftOut?: string | null;
    workingTime?: string | null;
    totalHours?: string | null;
    otHrs?: string | null;
    status?: string | null;
}

export class TimeSheetDetails {
    id:any;
    date?: string | null;
    attendance?: string | null;
    employeeName?: string | null;
    employeeCode?: string | null;
    loginTime?: string | null;
    logoutTime?: string | null;
    shift?: string | null;
    shiftIn?: string | null;
    shiftOut?: string | null;
    workingTime?: string | null;
    totalHours?: string | null;
    otHrs?: string | null;
    status?: string | null;
    editing?: boolean;
  }
