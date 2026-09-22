export class LeaveReversalModel {
    employee?: string;
    first_name?: string;
    last_name?: string;
    leave_type?: number;
    from_date?: any;
    to_date?: any;
    condition?: string;
    no_of_days?: number;
    balance_no_of_days?: number;
    reverse_from_date?: string;
    reverse_to_date?: string;
    reverse_no_of_days?: number;
    reason?: string;
    employee_default_object: any;
    leave_type_default_object: any;
    travel_or_leave?: any;
    default_delegated_reviewer_obj?: any;
    delegated_reviewer?: any;
    leave_entry: any = null;
    leave_application: any = null;
    type_of_days?: string;
    include_holidays: boolean = false;
    default_initiator_reviewer_obj:any={}
}