export enum LeaveMasterEnum {
    leave_master_details = 'leave_master_details',
    total_allocated_leaves='total_allocated_leaves',
    total_utilized_leaves='total_utilized_leaves',
    total_available_leaves='total_available_leaves',
    ticket_sector = 'ticket_sector',
    last_ticket_availed = 'last_ticket_availed',
    next_ticket_availed = 'next_ticket_availed',
    ticket_period = 'ticket_period',
    ticket_eligible_month = 'ticket_eligible_month'
}
  
export enum LeaveMasterDetailsEnum {
    financialYear = 'financial_year',
    opening_balance = 'opening_balance',
    leave_type = 'leave_type',
    allocated_leaves='allocated_leaves',
    utilized_leaves='utilized_leaves',
    available_leaves='available_leaves',
    breakup_details = 'breakup_details',
    carry_forward_days = 'carry_forward_days',
    lapse_days = 'lapse_days'
}

export enum LeaveMasterDetailsBreakupEnum {
    opening_balance = 'opening_balance',
    allocated_leaves='allocated_leaves',
    utilized_leaves='utilized_leaves',
    available_leaves='available_leaves',
    allocated_month='allocated_month',
    allocated_year='allocated_year',
    type_of_pay='type_of_pay'
}


export enum TicketHistoryDetailsEnum {
    date = 'date',
    last_ticket_availed = 'last_ticket_availed',
    next_ticket_availed = 'next_ticket_availed',
    ticket_eligible_month = 'ticket_eligible_month',
    ticket_sector = 'ticket_sector'
}
