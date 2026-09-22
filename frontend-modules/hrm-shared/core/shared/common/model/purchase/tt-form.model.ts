export class TTFormModel {
  id?: any;
  reference_no?: string;
  bd_reference_no?: string;
  supplier_proforma_invoice?: string = "";
  payment_request_date?: any = null;
  payment_method?: string = "";
  beneficiary_name?: string = "";
  beneficiary_address?: string = "";
  bank_name?: string = "";
  bank_address?: string = "";
  swift?: string = "";
  bank_account_number?: string = "";
  IBAN?: string = "";
  amount_in_digit?: number = 0;
  amount_in_words?: string = "";
  currency?: string = "";
  swift_release_date?: any = null;
  reason_of_request?: string = "";
  source_of_payment?: string = "";
  bd_default_object:any={};
  request_number?: string = "";
  trustee?: string = "";
  bd_number?: any;
  bl_no?: string;
  //bl_number?: any;
  xe?: number;                       // default 0.0
  our_rate?: number;                 // default 0.0
  target?: number;                   // default 0.0
  outstanding?: number;              // default 0.0
  swift_no?: string | null;           // max_length=10
  supplier_approval_date?: string | null; // YYYY-MM-DD
  tt_details?:any=[];
  approval_status?:string;
  total_paid_amount:number=0;
  bd_type_in_TT?: any;
  ttform_file_upload?: Array<any>;
  spi_no?: string;
  pi_ref_no?: string;
  po_company_no?: string;
  name_of_initiator?: any;
  name_of_initiator_name?: any;
  warning
  warning_text
  
}

export class TTDetailsModel {
  bank_number?:any='';
  paid_amount?: number=0;      
  source_of_payment?:any;
  payment_status?:any;
  xe_rate?: number=0;    
  target?: number=0;        
  our_rate?: number=0;                           
  outstanding?: number=0;             
  swift_no?: string | null; 
  date_of_order?: string | null; 
  swift_date?: string | null; 
  ledger?:any=null
  supplier_approval_date?: string;
  remarks?; string = "";
}

