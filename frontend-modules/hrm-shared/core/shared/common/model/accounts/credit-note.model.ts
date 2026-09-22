import { BillWiseReferenceDetailsModel } from "./bill-wise-reference.model";

export class CreditNoteModel {
  id?: string;
  credit_note_no?: string;
  date?: string;
  due_date?: string;
  sales_voucher?: string;
  customer_po_no?: string;
  customer_po_date?: string;
  
  select_customer?: number;
  
  invoice_no?: string;
  invoice_date?: string;
  customer_debit_note_no?: string;
  customer_debit_note_date?: string;
  
  other_charges_type?: string;

  total_qty?:number=0;
  note?: string;
  amount_type?: string;
  base_currency?: string;
  transaction_currency?: string;

  // Party currency & rates
  party_counter_currency?: string;
  party_cc_to_bc_rate?: number;
  party_tc_to_bc_rate?: number;
  party_tc_to_cc_rate?: number;
  
  // Freight currency & rates
  freight_counter_currency?: string;
  freight_cc_to_bc_rate?: number;
  freight_tc_to_bc_rate?: number;
  freight_tc_to_cc_rate?: number;
  
  // Adjust currency & rates
  adjust_counter_currency?: string;
  adjust_cc_to_bc_rate?: number;
  adjust_tc_to_bc_rate?: number;
  adjust_tc_to_cc_rate?: number;
  
  // Packing currency & rates
  packing_counter_currency?: string;
  packing_cc_to_bc_rate?: number;
  packing_tc_to_bc_rate?: number;
  packing_tc_to_cc_rate?: number;
  
  // Other currency & rates
  other_counter_currency?: string;
  other_cc_to_bc_rate?: number;
  other_tc_to_bc_rate?: number;
  other_tc_to_cc_rate?: number;
  
  ledger_counter_currency?: string;
  ledger_cc_to_bc_rate?: number;
  ledger_tc_to_bc_rate?: number;
  ledger_tc_to_cc_rate?: number;
  
  vat_amount_ledger_counter_currency?: string;
  vat_amount_ledger_cc_to_bc_rate?: number;
  vat_amount_ledger_tc_to_bc_rate?: number;
  vat_amount_ledger_tc_to_cc_rate?: number;
  
  // Base Currency (BC) amounts
  bc_total_amount?: number;
  bc_discount_amount?: number;
  bc_taxable_amount?: number;
  bc_vat_amount?: number;
  bc_freight_charges?: number;
  bc_adjust_amount?: number;
  bc_packing_charges?: number;
  bc_other_charges?: number;
  bc_grand_total?: number;
  bc_bill_wise_total_amount?: number;

  // Transaction Currency (TC) amounts
  tc_total_amount?: number;
  tc_discount_amount?: number;
  tc_taxable_amount?: number;
  tc_vat_amount?: number;
  tc_freight_charges?: number;
  tc_adjust_amount?: number;
  tc_packing_charges?: number;
  tc_other_charges?: number;
  tc_grand_total?: number;
  tc_bill_wise_total_amount?: number;

  ledger?: string;
  cgst_amount_ledger?: string;
  sgst_amount_ledger?: string;
  igst_amount_ledger?: string;
  vat_amount_ledger?: string;
  tcs_amount_ledger?: string;
  adjust_amount_ledger?: string;
  freight_charges_ledger?: string;
  packing_charges_ledger?: string;
  other_charges_ledger?: string;

  default_ledger_object?: Record<string, any>;
  default_cgst_ledger_object?: Record<string, any>;
  default_sgst_ledger_object?: Record<string, any>;
  default_igst_ledger_object?: Record<string, any>;
  default_tcs_ledger_object?: Record<string, any>;
  default_adjust_amount_ledger_object?: Record<string, any>;
  default_vat_amount_ledger_object?: Record<string, any>;
  default_freight_charges_ledger_object?: Record<string, any>;
  default_packing_charges_ledger_object?: Record<string, any>;
  default_other_charges_ledger_object?: Record<string, any>;
  
  default_sales_voucher_object?: Record<string, any>;
  default_select_customer_object?: Record<string, any>;

  credit_note_details?:any=[];
  bill_wise_reference_details?:any=[];


  user_created?:any;

  // domestic keys
  cgst_amount?: number = 0;
  sgst_amount?: number = 0;
  igst_amount?: number = 0;
  tcs_amount?: number = 0;


  is_foreign?:boolean=false;
  description?:any;
  reference_no?:any;

}


export class CreditNoteDetailsModel {
  id?: string;
  product_code:string
  credit_note?: string;

  part_number?: string;
  product_name?: string;
  model?: string;
  brand?: string;
  hsn?: string;
  description?: string;

  shipping_qty?: number;
  unit_price?: number;
  total_amount?: number;
  discount?: number;
  discount_amount?: number;
  final_price?: number;

  taxable_amount?: number;
  tax?: number;
  tax_value?: number;
  total?: number;
  final_total?: number;

  base_unit_price?: number;

  product?: any;
  unit?: string;
  unit_name?: string;
  unit_conversion_ratio?: number;
}
