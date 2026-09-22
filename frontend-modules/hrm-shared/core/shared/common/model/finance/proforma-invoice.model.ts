
export class ProformaInvoiceModel {
  id?: string;
  proforma_invoice_no?: string;
  invoice_type?: string;
  invoice_date?: any;
  source?: string;
  order_acceptance?: number;
  purchase_order_no?: any;
  order_type?: string;
  other_charges_calculation_type?: string;
  invoice_for?: string;
  customer_po_no?: string;
  customer_po_date?: any = null;
  delivery_date?: string;
  dispatch_doc_no?: string;
  dispatch_doc_date?: any = null;
  payment_terms?: string;
  delivery_terms?: string;
  terms_and_condition?: string;
  remarks?: string;
  customer_commercial_id?:string;

  customer?: number;
  select_customer?: number;
  bank_detail?: any;
  bill_to_address?: string;
  ship_to_address?: string;
  fax?: string;
  phone_number?: string;
  website?: string;
  region?: string;
  poc_name?: string;
  poc_email?: string;
  poc_mobile?: string;

  total_qty?: number = 0;
  total_unit_price?: number = 0;
  total?: number = 0;
  discount?: number = 0;
  taxable_amount?: number = 0;
  cgst?: number = 0;
  sgst?: number = 0;
  igst?: number = 0;
  tcs?: number = 0;
  adjust_amount?: number = 0;
  grand_total?: number = 0;
  freight_charges?: number = 0;
  party_code?:any;
  prepaid_advance?: number = 0;
  receiving_amount_advance?: number = 0;
  cancel_amt?: number = 0;

  proforma_invoice_details?: Array<ProformaInvoiceDetailsModel>;
  proforma_invoice_terms_and_condition?: Array<ProformaInvoiceTermsAndConditionModel>;
  proforma_invoice_poc_details?: Array<ProformaInvoicePocDetailsModel>;
  default_customer_object?: Record<string, any>;
  default_delivery_terms?: Record<string,any>;
  default_cpi_currency?: Record<string, any>;
  default_select_customer_object?: Record<string, any>;
  default_bank_detail_object?: Record<string, any>;
  default_order_acceptance_object?: Record<string, any>;
  default_purchase_order_object?: Record<string, any>;
  proforma_invoice_file_upload: Array<any>;
  default_payment_terms_object?: any = {};
  state_code?: any;
  country?: any;
  approval_status?: string;
  lut_number?: any;
  service_route?: boolean = false;
  tax_types?: string;
  default_tax_types_object?: any;
  foreign_tax_types?: string;
  charge_value?: any;
  charge_des?: any
  is_foreign?: boolean = false
  supplierName?: any;
  vat?: number = 0;
  vat_treatment?:string;
  party_name?: string = '';
  currency?: string = '';
  user_created?: string = '';
  default_payment_terms?: any;
  default_mode_of_transport?: any = {};
  packing?:number=0;
  other_charges?:number=0;
  other_charges_type?:string='';
  expiry_date?: any;

  country_of_origin?: string;
  port_of_loading?: string;
  destination?: string;
  net_weight?: number = 0;
  gross_weight?: number = 0;
  part_of_shipment?: string;
  transportation_terms?: string;
  description_packing?: string;
  mode_of_transportation?: string;
  cpi_currency?: string;
  pgm_remark?: string;
  note?: string;
  currency_rate?:number=0;
  treasury_balance_amount?:number=0;
  reference_no?:any;
  ref?: any;
  warning?: boolean = false;
  warning_text?: string = '';
  base_revised_fk
  is_finalized:boolean=false
  revise_count
  approval_stage_status
  pending_freight_charge?: number = 0;
  pending_packing_charge?: number = 0;
}

export class ProformaInvoiceDetailsModel {
  id?: string;
  proforma_invoice?: string;
  item_code?: any;
  drawing_number?: any;
  part_number?: string;
  product_name?: string;
  model?: string;
  brand?: string;
  hsn?: string;
  description?: string;
  order_qty?: number = 0;
  previous_qty?: number = 0;
  shipping_qty?: number = 0;
  balance_qty?: number = 0;
  unit_price?: number = 0;
  base_unit_price?: number = 0;
  total_amount?: number = 0;
  discount?: number = 0;
  discount_amount?: number = 0;
  final_price?: number = 0;
  taxable_amount?: number = 0;
  tax?: number = 0;
  tax_value?: number = 0;
  total?: number = 0;

  product?: any;
  proforma_invoice_sub_products?: any;
  proforma_invoice_serial_numbers?: any;
  project?: any = null;
  project_code?: string = '';

  product_service?: boolean = false;

  oa_details?: any;
  sales_op_details?: any;
  service_op_details?: any;
  soc_details?: any;

  project_details?: any = [];
  project_codes?: string = '';
  country_of_origin?: string;
  port_of_loading?: string;
  destination?: string;
  net_weight?: number = 0;
  gross_weight?: number = 0;
  gross_weights?: number = 0;
  base_gross_weight?: number = 0;
  part_of_shipment?: string;
  transportation_terms?: string;
  description_packing?: string;
  payment_terms?: string;
  mode_of_transportation?: string;
  cpi_currency?: string;
  delivery_terms?: string;
  delivery_date?: any;
  pgm_remark?: string;
  note?: string;
  default_payment_terms?: any = {};
  currency?: string;
  conversion_rate?: number = 0;
  price_in_aed?: number = 0;
  freight_charges?: number = 0;
  round_off?: number = 0;
  customer_part_number:string='';
  weight:string='';
  floor_status:string='Floor Open';
  
  unit?: any = null;
  unit_conversion_ratio?:number=0;
  unit_name?:string=''
  ci_balance_qty?:number=0;
}

export class ProformaInvoiceSubProductModel {
  id?: any;
  proforma_invoice_details?: any;
  part_number?: any;
  product_name?: any;
  model?: any;
  hsn?: any;
  unit?: any;
  quantity?: any;
  shipping_qty?: any;
  product?: any;
}

export class ProformaInvoiceTermsAndConditionModel {
  id?: string;
  proforma_invoice?: number;
  term?: string;
  description?: string;
}

export class ProformaInvoiceSerialNumberModel {
  id?: string;
  proforma_invoice_details?: string;
  serial_number?: string;
  custom?: boolean;
  type?: string;
}

export class ProformaInvoicePocDetailsModel {
  id?: any;
  proforma_invoice?: any;
  poc?: any;
  poc_name?: string = '';
  poc_email?: string = '';
  poc_mobile?: string = '';
  poc_department?: string = '';
}