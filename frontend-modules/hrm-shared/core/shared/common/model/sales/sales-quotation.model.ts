import { AnyARecord } from "node:dns";

export class SalesQuotationDetailsModel {
  id?: any = null;
  sales_quotation?: any = null;
  part_number?: string = '';
  customer_part_number?: string;
  weight?: string;
  product_name?: string = '';
  hsn?: string = '';
  model?: string = '';
  brand?: string = '';
  description?: string = '';
  qty?: number = 0;

  quantity?: number = 0;
  unit_price?: number = 0;
  total_amount?: number = 0;
  discount?: number = 0;
  discount_amount?: number = 0;
  final_price?: number = 0;
  taxable_amount?: number = 0;
  tax?: number = 0;
  tax_value?: number = 0;
  total?: number = 0;
  product: any = null;
  primary_units_name?: any = '';
  item_code?: string = '';
  drawing_number?: string = '';
  base_unit_price :number=0;
  gross_weight?: number = 0;
  primary_units?: any = null;
        
  unit_master?:any=null;
  unit?: any = null;
  unit_conversion_ratio?:number=0;
  unit_name?:string='';
  currency?:string='';
  currency_rate?:number=0;
  form_unit_price?:number=0;
  post_fso_qty?: number;

}

export class SalesQuotationModel {
  id?: string;
  quotation_no?: string;
  quotation_type?: string;
  type?: string;
  sales_inquiry?: any;
  opportunity?: any;
  quotation_date?: any;
  quotation_validity_date?: any;
  currency?: string;
  quotation_for?: string;
  mpds?: string;
  mids?: string;
  assign_to?: string;
  approver_name: string;
  status?: string;
  remarks?: string;

  customer?: any;
  bank_detail?: any;
  customer_code?: string;
  trn?: string;
  customer_address?: string;
  customer_email?: string;
  customer_mobile?: string;
  mode_of_transport?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  delivery_terms?: string;
  bill_to_address?: string;
  ship_to_address?: string;
  freight_charges?: number = 0;
  fax?: string;
  website?: string;
  region?: string;
  poc_name?: string;
  poc_email?: string;
  poc_mobile?: string;
  poc_department?: string;
  payment_terms?: string;
  customer_fpo_no?: string;
  eta?: any;
  etd?: any;
  approval_by?:any;
  approval_date?:any;
  approval_stage_status?:any;


  total_qty?: number = 0;
  total?: number = 0;
  discount?: number = 0;
  taxable_amount?: number = 0;
  cgst?: number = 0;
  sgst?: number = 0;
  igst?: number = 0;
  pf?: number = 0;
  pf_amount?: number = 0;
  tcs?: number = 0;
  adjust_amount?: number = 0;
  grand_total?: number = 0;
  cancel_amt?: number = 0;
  vat_amount?: number = 0;
  vat_treatment?:string;

  file_upload: any;

  delivery_price: string;
  delivery_validity: string;
  delivery: string;
  delivery_inspection: string;
  delivery_insurance: string;
  delivery_dispatch_details: string;
  delivery_transporter: string;
  delivery_freight: string;
  note: string;

  editor?: any = null;
  template?: any = {};

  sales_quotation_details?: Array<SalesQuotationDetailsModel>;
  sales_followup_details: Array<SalesFollowupModel>;
  sales_quotation_terms_and_condition: Array<SalesTermsAndConditionModel>;
  payment_terms_details: Array<SalesQuotationPTModel>;
  quotation_file_upload: Array<any>;

  default_customer_object: Record<string, any>;
  default_bank_detail_object: Record<string, any>;
  default_inquiry_object: Record<string, any>;
  default_opportunity_object: Record<string, any>;
  default_assign_to_object: Record<string, any>;
  default_assignTo_object: Record<string, any>;
  default_approver_object: Record<string, any>;
  default_quotation_for_object: Record<string, any>;
  default_currency_object: Record<string, any>;
  default_payment_object?: Record<string, any>;
  default_delivery_terms: Record<string, any>;
  default_editor_object?: any = {};

  state_code: any;
  quotation_stages: any;
  revise_count: number;
  approval_status: string;
  is_revised: boolean;
  base_quotation: number;
  base_sales_quotation_stages: any;
  sales_quotation_stages: any;
  // ViewRevisedQuotation
  viewRevisedQuotation: boolean;

  customer_name?: string;
  user_created?: string;
  user_modified?: string;
  currency_rate :number=0;

  customer_commercial_id?:string;
  country_of_origin?: string;
  destination?: string;
  net_weight?: number = 0;
  gross_weight?: number = 0;
  part_of_shipment?: string;
  transportation_terms?: string;
  description_packing?: string;
  mode_of_transportation?: string;
  cpi_currency?: string;
  pgm_remark?: string;
  ref?:string;
  delivery_date?:any;
  default_payment_terms_object: Record<string, any>;
  packing?:number=0;
  other_charges?:number=0;
  other_charges_type?:string='';
  customer_po_no?:any;
  expiry_date?:any;
  reference_no?:string;
  base_revised_fk
  is_finalized?: boolean;

}

export class SalesQuotationStagesModel {
  id?: string;
  date: string;
  quotation_number: string;
  technical_negotiation: string;
  commercial_negotiation: string;
}

export class SalesFollowupModel {
  id?: string;
  sales_quotation?: number;
  followup_date: string;
  followup_details: string;
  remarks: string;
}

export class SalesTermsAndConditionModel {
  id?: string;
  sales_quotation?: number;
  term: string;
  description: string;
}

export class SalesQuotationPTModel {
  id?: string;
  sales_quotation?: number;
  payment_terms: string;
  percentage: number;
  value: number;
}