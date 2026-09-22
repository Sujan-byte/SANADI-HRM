import { BillWiseReferenceDetailsModel } from "./bill-wise-reference.model";

export class DebitNoteModel {
  id?: string;
  debit_note_no?: string;
  date?: string;
  due_date?: string;

  purchase_voucher?: string;
  supplier?: string;

  invoice_no?: string;
  invoice_date?: string;

  grn_no?: string;
  grn_date?: string;

  total_qty?: number;
  gst_number?: string;

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
  bc_grand_total?: number;
  bc_bill_wise_total_amount?: number;

  // Transaction Currency (TC) amounts
  tc_total_amount?: number;
  tc_discount_amount?: number;
  tc_taxable_amount?: number;
  tc_vat_amount?: number;
  tc_freight_charges?: number;
  tc_adjust_amount?: number;
  tc_grand_total?: number;
  tc_bill_wise_total_amount?: number;

  ledger?: string;
  cgst_amount_ledger?: string;
  sgst_amount_ledger?: string;
  igst_amount_ledger?: string;
  tcs_amount_ledger?: string;
  adjust_amount_ledger?: string;
  vat_amount_ledger?: string;
  freight_charges_ledger?: string;

  amount_type?: string;
  is_foreign?: boolean;
  description?:any;
  reference_no?:any;
  
  default_ledger_object?: Record<string, any>;
  default_cgst_ledger_object?: Record<string, any>;
  default_sgst_ledger_object?: Record<string, any>;
  default_igst_ledger_object?: Record<string, any>;
  default_tcs_ledger_object?: Record<string, any>;
  default_adjust_amount_ledger_object?: Record<string, any>;
  default_vat_amount_ledger_object?: Record<string, any>;
  default_freight_charges_ledger_object?: Record<string, any>;
  
  default_purchase_voucher_object?: Record<string, any>;
  default_party_object:Record<string, any>;
  
  debit_note_details?:any=[];
  bill_wise_reference_details?:any=[];
  
  // domestic keys
  cgst_amount?: number = 0;
  sgst_amount?: number = 0;
  igst_amount?: number = 0;
  tcs_amount?: number = 0;
  
  user_created: any;
}


export class DebitNoteDetailsModel {
  id?: string;
  part_number?: string;
  product_name?: string;
  product_code?: string;
  hsn?: string;
  description?: string;

  received_qty?: number;
  unit_price?: number;
  total_amount?: number;
  discount?: number;
  discount_amount?: number;
  final_price?: number;
  taxable_amount?: number;
  tax?: number;
  tax_value?: number;
  total?: number;
  base_unit_price?: number;

  product?: string;
  debit_note?: string;

  unit?: string;
  unit_name?: string;
  unit_conversion_ratio?: number;
}
