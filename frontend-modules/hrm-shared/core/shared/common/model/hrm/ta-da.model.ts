export class TaDaModel {
    id: any;
    tada_number: string;
    employee: any;
    employee_first_name: string;
    employee_department_name: string;
    employee_designation_name: string;
    total_cost: any;
    travel_planning?: any;
    travel_planning_numbers?: string;
    travel_planning_log_details?: Array<TravelPlanningLogDetailsModel>
    tada_details: Array<TaDaDetails>
    employee_default_object: Record<string, any>;
}

export class TaDaDetails {
    id?: any;
    tada: number;
    expense_name: string;
    from_date: any;
    to_date: any;
    cost: any;
    tada_details_images: Array<TaDaDetailsImages>
}

export class TaDaDetailsImages {
    id?: any;
    tada_details: number;
    file: any;
    file_name: any;
    size: any;
    file_type: any;
}

export class TravelPlanningLogDetailsModel {
    id: any;
    travel_planning: any;
    checkin_flag: boolean;
    checkin_date: string; 
    checkin_time: string; 
    checkin_location: string; 
    checkout_flag: boolean;
    checkout_date: string; 
    checkout_time: string; 
    checkout_location: string;
    total_log_time: string;
    breakin_flag: boolean;
    breakin_time: string;
    breakout_flag: boolean;
    breakout_time: string;
    total_break_time: string;
    checkout_photo?: any;
}