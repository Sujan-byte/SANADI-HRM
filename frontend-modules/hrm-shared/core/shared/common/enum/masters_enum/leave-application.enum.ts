export enum LeaveApplicationEnum {
    employeeCode = 'employee_code',
    employeeName = 'employee_name',
    department = 'department',
    dateOfJoining = 'date_of_joining',
    homeCountryMobileNo = 'home_country_mobile_no',
    localMobileNo = 'local_mobile_no',
    eligibleForCompanyTicket = 'eligible_for_company_ticket',
    ticketPeriodFor = 'ticket_period_for',
    travelSector = 'travel_sector',
    leaveEligibleAsOn = 'leave_eligible_as_on',
    leaveDaysEligible = 'leave_days_eligible',
    location = 'location',
    days='days',
    ticketProvideBy='ticket_provide_by',
    
    // Last Leave Availed Details
    lastLeaveStartDate = 'last_leave_start_date',
    lastLeaveEndDate = 'last_leave_end_date',
    totalLeaveDays = 'total_leave_days',
    returnToWorkDate = 'return_to_work_date',
    resumedWorkDate = 'resumed_work_date',
    lopDays = 'lop_days',
    ticketPeriod = 'ticket_period',
    lastTicketProvidedBy = 'last_ticket_provided_by',
    
    // New Leave Application Details
    newLeaveStartDate = 'new_leave_start_date',
    newLeaveEndDate = 'new_leave_end_date',
    leaveDaysApplied = 'leave_days_applied',
    ticketToBeIssuedDate = 'ticket_to_be_issued_date',
    return_ticket_to_be_issued_date = 'return_ticket_to_be_issued_date',
    emergencyContactNo = 'emergency_contact_no',
    note = 'note',
    
    // Approval Details
    leaveApproved = 'leave_approved',
    dutiesToBeCoveredByReliver = 'duties_to_be_covered_by_reliver',
    leaveApprovedStartDate = 'leave_approved_start_date',
    leaveApprovedEndDate = 'leave_approved_end_date',
    leaveApprovedDays = 'leave_approved_days',
    noteForApproval = 'note_for_apporval',
    
    // HR/Admin Completion Details
    passportExpiryDate = 'passport_expiry_date',
    visaExpiryDate = 'visa_expiry_date',
    eidExpiryDate = 'eid_expiry_date',
    labourCardExpiryDate = 'labour_card_expiry_date',
    jobLossInsuranceExpiryDate = 'job_loss_insurance_expiry_date',
    noteByHrAdmin = 'note_by_hr_admin',
    remarks_labour_card_expiry = 'Remarks for labour card expiry',
    remarks_eid_expiry='Remarks for Eid expiry',
    remarks_visa_expiry='Remarks for Visa expiry',
    remarks_passport_expiry='Remarks for Passport expiry',
    
    // Return to Work Details
    resumeDutyOn = 'resume_duty_on',
    wasOnLeaveFrom = 'was_on_leave_from',
    was_on_leave_till = 'to',
    noOfDays = 'no_of_days',
    lateEarlyDaysBy = 'late_early_days_by',

    // Leave Extension
    allowBeyondEligible = 'allow_beyond_eligible',
    lopDaysFromExtension = 'lop_days_from_extension',
    extendToDate = 'extend_to_date',
}
