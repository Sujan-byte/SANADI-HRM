export class TravelPlanningLogModel {
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