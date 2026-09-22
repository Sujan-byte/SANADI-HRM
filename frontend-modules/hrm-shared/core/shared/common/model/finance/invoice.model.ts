import { BillWiseReferenceDetailsModel } from "../accounts/bill-wise-reference.model";

export class InvoiceModel {
  id?: string;
  invoice_no?: string;
  invoice_type?: string;
  ci_invoice_type?: string;
  invoice_date?: any;
  due_date?: any;
  source?: string;
  order_acceptance?: number;
  sales_order_profile?: number;
  service_order_profile?: number;
  invoice_for?: string;
  customer_po_no?: string;
  customer_po_date?: any = null;
  delivery_date?: string;
  dispatch_doc_no?: string;
  dispatch_doc_date?: string;
  payment_terms?: string;
  delivery_terms?: string;
  terms_and_condition?: string;
  name?: string;
  customer?: number;
  select_customer?: number;
  bank_detail?: any;
  bill_to_address?: string;
  ship_to_address?: string;
  phone_number?: string;
  fax?: string;
  tax_number?: string;
  website?: string;
  region?: string;
  poc_name?: string;
  poc_email?: string;
  poc_mobile?: string;
  customer_commercial_id?:string;

  total_qty?: number = 0;
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

  adjust_amount_ledger?: any;
  invoice_details?: Array<InvoiceDetailsModel>;
  invoice_terms_and_condition?: Array<InvoiceTermsAndConditionModel>;
  invoice_poc_details?: Array<InvoicePocDetailsModel>;
  default_customer_object?: Record<string, any>;
  default_select_customer_object?: Record<string, any>;
  default_bank_detail_object?: Record<string, any>;
  default_order_acceptance_object?: Record<string, any>;
  default_sales_order_profile_object?: Record<string, any>;
  default_service_order_profile_object?: Record<string, any>;
  default_proforma_invoice_object?: Record<string, any>;
  default_delivery_terms?: Record<string, any>;
  default_payment_terms_object?: any;
  default_delivery_terms_object?: any;
  invoice_file_upload: Array<any> = [];
  state_code?: any;
  country?: any;
  approval_status?: string;
  is_sez?: boolean = false;
  is_export?: boolean = false;
  party_sez?: boolean = false;
  conversion_rate?: Number;
  cif?: Number;
  total_amount_base_currency?: Number;
  lut_number?: any;
  proforma_invoice?: any;
  is_interstate?: boolean = false;
  registered_address: string = '';
  ship_from: any = null;
  ship_from_address: string = '';
  country_of_origin?: string;
  port_of_loading?: string;
  net_weight?: number = 0;
  gross_weight?: number = 0;
  part_of_shipment?: string;
  transportation_terms?: string;
  shipment_payment_terms?: string;
  description_packing?: string;
  mode_of_transportation?: string;
  cpi_currency?: string;
  pgm_remark?: string;

  need_eway_bill?: boolean = false;
  eway_bill_no?: string;
  generated_by?: string;
  supply_type?: string;
  mode?: string;
  approx_distance?: string;
  transaction_type?: string;
  generated_date?: any;
  valid_upto?: any;
  transporter_id?: string;
  transportation_name?: string;
  transportation_doc_no?: string;
  transportation_date?: any;
  vehicle_no?: string;
  from_location?: string;
  cewb_no?: string;
  irn_number?: string;
  ack_no?: string;
  ack_date: string;
  tax_types?: string;
  default_tax_types_object?: any;
  foreign_tax_types?: string;
  charge_value?: any;
  charge_des?: any
  is_foreign?: boolean = false
  service_route?: any;
  invoice_status?: string;
  e_waybill_status?: string;
  delivery_challan?: any;
  default_delivery_challan_object?: any;
  invoice_claim_details?: Array<InvoiceClaimDetailsModel> = [];
  total_commission_amount?: Number = 0;
  from_date?: any = null;
  to_date?: any = null;
  signed_qr_code?: any = null;
  product_service?: boolean = false;

  party_name?: string = '';
  transportation_remarks?: string = '';
  dc_nos?: string = '';
  dc_dates?: string = '';
  dispatched_through = '';
  destination = '';
  bill_of_lading_lr_rr_no = '';
  user_created?: string = '';
  dc_no_balance?: boolean;
  dc_status?: string;
  default_payment_terms?: any = {};
  default_mode_of_transport?: any = {};
  vat?: number = 0;
  vat_treatment?: string;
  party_code?:any;
  lr_rr_date?: any = null;
  lc_no?: string = '';
  lc_date?: any = null;
  note?: string = '';
  // proforma_invoice_poc_details?: Array<InvoicePocDetailsModel>;
  bill_wise_reference_details?: Array<BillWiseReferenceDetailsModel>;
  bill_wise_total_amount?: number = 0;
  amount_type?: string = 'Dr';
  packing?: number = 0;
  other_charges?: number = 0;
  other_charges_type?: string = '';
  proforma_invoice_number?: string = '';
  proforma_invoice_date?: string = '';
  no_of_shipment?: string = '';
  bl_number?: number = 0;
  currency_rate?:number=0;
  base_currency?:string;
  treasury_balance_amount?:number=0;
  warning?: boolean = false;
  warning_text?: string = '';
 
  
}

export class InvoiceDetailsModel {
  id?: string;
  invoice?: string;
  item_code?: any;
  drawing_number?: any;
  part_number?: string;
  product_name?: string;
  description?: string;
  model?: string;
  brand?: string;
  hsn?: string;
  order_type?: string;
  other_charge_calculation_type?: string;

  order_qty?: number = 0;
  previous_qty?: number = 0;
  shipping_qty?: number = 0;
  balance_qty?: number = 0;
  unit_price?: number = 0;
  total_amount?: number = 0;
  discount?: number = 0;
  discount_amount?: number = 0;
  final_price?: number = 0;
  taxable_amount?: number = 0;
  tax?: number = 0;
  tax_value?: number = 0;
  total?: number = 0;

  product?: any;
  invoice_sub_products?: any;
  invoice_serial_numbers?: any;
  project?: any = null;
  project_code?: string = '';

  oa_details?: any;
  sales_op_details?: any;
  service_op_details?: any;
  cpi_details?:any;
  total_amount_base_currency?: any;
  final_total?: any;
  dc_balance_quantity?: any;
  dc_details?: any;

  product_service?: boolean = false;

  serial_number?: string = '';
  project_details?: any = [];
  project_codes?: string = '';

  country_of_origin?: string;
  port_of_loading?: string;
  destination?: string;
  net_weight?: number = 0;
  gross_weight?: number = 0;
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
  freight_charge?: number = 0;
  round_off?: number = 0;
  customer_part_number: string = '';
  weight: string = '';
  floor_status: string = '';
  base_unit_price?: number = 0;
  unit?: any = null;
  unit_conversion_ratio?: number = 0;
  unit_name?: string = '';


  invoice_no?: string;
  invoice_date?: any;
  customer_po_no?: string;
  
}

export class InvoiceSubProductModel {
  id?: any;
  invoice_details?: any;
  part_number?: any;
  product_name?: any;
  model?: any;
  hsn?: any;
  unit?: any;
  quantity?: any;
  shipping_qty?: any;
  product?: any;
}

export class InvoiceTermsAndConditionModel {
  id?: string;
  invoice?: number;
  term?: string;
  description?: string;
}

export class InvoiceSerialNumberModel {
  id?: string;
  invoice_details?: string;
  serial_number?: string;
  custom?: boolean;
  type?: string;
}

export class InvoiceClaimDetailsModel {
  id?: any = null;
  invoice?: number = 0;
  part_number?: string = '';
  product_name?: string = '';
  model?: string = '';
  brand?: string = '';
  hsn?: string = '';
  description?: string = '';
  qty?: number = 0;
  list_price?: number = 0;
  discount?: number = 0;
  net_price?: number = 0;
  po_value?: number = 0;
  commission_amount?: number = 0;
  total_commission_amount?: number = 0;
  product?: any = null;
  invoice_details?: any = null;
}

export class InvoicePocDetailsModel {
  id?: any;
  invoice?: any;
  poc?: any;
  poc_name?: string = '';
  poc_email?: string = '';
  poc_mobile?: string = '';
  poc_department?: string = '';
}