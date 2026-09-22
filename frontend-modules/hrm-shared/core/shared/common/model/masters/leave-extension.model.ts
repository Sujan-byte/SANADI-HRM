export class LeaveExtensionModel {
    leave_application?: any = null;
    leave_entry?: any       = null;
    employee?: any          = null;
    extended_to_date?: any  = null;
    extension_days?: number = 0;
    allow_beyond_eligible?: boolean = false;
    is_paid_beyond?: boolean = false;
    lop_days?: number       = 0;
    reason?: string         = '';
    delegated_reviewer?: any = null;

    // read-only from serializer
    current_end_date?: any  = null;
    employee_name?: string  = '';

    // pre-populated from parent leave for display
    employee_default_object?: any = {};
    default_delegated_reviewer_object?: any = {};
    available_leaves?: number = null;
    leave_days_applied?: number = 0;
    approval_status?: string = '';
}
