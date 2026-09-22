export class LeaveApplicationModel {
    // Employee Details
    employee_code?: string; // Foreign key to EmployeeMaster
    employee_name?: string;
    department?: string;
    date_of_joining?: Date;
    home_country_mobile_no?: string;
    local_mobile_no?: string;
    eligible_for_company_ticket?: string;
    ticket_period_for?: string; 
    travel_sector?: string;
    leave_eligible_as_on?: any;
    leave_days_eligible?: number;
    location?: string;
    days?: any;
    department_name?:any;
    employee_code_code?: any;
  
    // Last Leave Availed Details
    last_leave_start_date?: Date;
    last_leave_end_date?: Date;
    total_leave_days?: number;
    return_to_work_date?: Date;
    resumed_work_date?: Date;
    lop_days?: number;
    ticket_period?: string; 
    last_ticket_provided_by?: string;
  
    // New Leave Application Details
    new_leave_start_date?: Date;
    new_leave_end_date?: Date;
    leave_days_applied?: number;
    ticket_to_be_issued_date?: Date;
    return_ticket_to_be_issued_date?: Date;
    emergency_contact_no?: string;
    note?: string;
  
    // Approval Details
    leave_approved?: boolean; 
    duties_to_be_covered_by_reliver?: boolean; 
    leave_approved_start_date?: Date;
    leave_approved_end_date?: Date;
    leave_approved_days?: number;
    note_for_approval?: string;
  
    // HR/Admin Completion Details
    passport_expiry_date?: Date;
    visa_expiry_date?: Date;
    eid_expiry_date?: Date;
    labour_card_expiry_date?: Date;
    job_loss_insurance_expiry_date?: Date;
    note_by_hr_admin?: string;
    remarks_labour_card_expiry?: any;
    remarks_eid_expiry?: any;
    remarks_visa_expiry?: any;
    remarks_passport_expiry?: any;
  
    // Return to Work Details
    resume_duty_on?: Date; // When the employee resumes duty
    was_on_leave_from?: Date; // Start of the leave period
    was_on_leave_till?: Date; // End of the leave period (renamed field)
    no_of_days?: number; // Total number of days on leave
    late_early_days_by?: string; // Late/Early days adjustment

    employee_default_object?: any;
    approval_status?: any;
    default_delegated_reviewer_object?:any;
    is_reversal?:boolean=false;
    balance_no_of_days?:number=0;
    allow_beyond_eligible?:boolean=false;
    lop_days_from_extension?:number=0;
    extension_lop_attendance_ids?:any[]=[];
    extend_to_date?:Date=null;
    available_leaves?:number=null;


  
  }
  