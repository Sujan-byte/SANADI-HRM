export class TicketMasterModel {
    id?:number;
    ticket_sector: string;
    ticket_histories:Array<TicketMasterDetails>;
    employee_default_object:any;
    last_ticket_availed:string;
    next_ticket_availed:string;
    ticket_eligible_month:string;
    ticket_period:string;
}

export class TicketMasterDetails{
    id?:number;
    date:any;
    last_ticket_availed:string;
    next_ticket_availed:string;
    ticket_eligible_month:string;
    ticket_sector:string;
  }
