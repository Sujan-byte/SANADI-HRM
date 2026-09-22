export class LeaveMasterModel {
    employee: number;
    leave_master_details: Array<LeaveMasterDetails>;
    employee_default_object: any;
    total_allocated_leaves: number;
    total_utilized_leaves: number;
    total_available_leaves: number;
    user_created?: string = '';
}

export class LeaveMasterDetails {
    id?: number;
    leave_master: number;
    leave_type: string;
    financial_year?: string;
    opening_balance?: number;
    allocated_leaves: number;
    utilized_leaves: number;
    available_leaves: number;
    carry_forward_days?: number;
    lapse_days?: number;
}

export class LeaveMasterBreakupDetails {
    id?: number;
    leave_master_detail: number;
    leave_policy_detail: number;
    allocated_leaves: number;
    utilized_leaves: number;
    available_leaves: number;
    opening_balance: number;
    allocated_month: string;
    allocated_year: string;
}
