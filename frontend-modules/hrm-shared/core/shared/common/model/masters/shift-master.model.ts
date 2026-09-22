export class ShiftMasterModel {
    id?: number;
    shift_code?: string;
    shift_name?: string;
    status?: string;
    start_time?: Date | string | any;
    end_time?: Date | string;
    grace_period_in?: Date | string;
    grace_period_out?: Date | string;
    duration?: string; // ISO 8601 duration string (e.g., "PT8H30M")
    max_ot?: string; // ISO 8601 duration string
    ot_multiplier?: number;
    ot_rounding?: string;
    notes?: string;
    is_cross_midnight?: boolean;
    b_id?: number;
    is_active?: boolean;
    created?: Date;
    modified?: Date;
    user_created?: string;
    user_modified?: string;
    ip_address?: string;


}