export class BankDetailsFormModel {
  id?: number;

  // BD Details
  bd_number?: string;
  bd_date?: string;
  bd_type?: string;
  reference_no?: string;
  purchase?: number | null;
  sales_order?: string;
  po_no?: string;
  bl_no?: string;
  discount_amount?: number = 0;
  // Beneficiary Info
  party?: any;
  party_name?: string;
  address?: string;
  country?: string;
  line_of_business?: string;
  approval_status?: string;
  approval_remarks?: string;

  // Beneficiary Bank Info
  bank_details?: number | null;
  bank_name?: string;
  bank_address?: string;
  account_name?: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  bank_code?: string;
  currency?: string;
  bank_branch?: string;
  bank_country?: string;

  // Payment Info
  pi_no?: string;
  dxb_pi_no?: string[];
  dxb_pi_no_display?: string = '';
  total_amount_of_pi?: number;
  down_payment_amount?: number;
  amount_payable?: number;
  remaining_balance?: number;
  amount_in_words?: string;
  reason_for_payment?: string;
  coo?: string;
  destination_of_goods?: string;

  // Payment Date & Remarks
  date_of_payment?: string;
  average_price?: number;
  remarks?: string;
  base_revised_fk?: number;
  is_revised?: boolean;

  // File upload
  file?: string;

  purchase_order_no?: any = {};
  default_sales_order_number?: any = {};
  default_bank_object?: any = {};
  default_spi_object?: any = {};
  balance_payable: number = 0;
  gross_amount_spi?: number = 0;
  default_supplier_object?: any = {};
  mode_of_transportation?: string = '';
  bank_details_file_upload?: Array<any>;
  created_by: any;
  created_by_name;

  // SHIPMENT 
  shipment?: any;
  shipment_form_details?: any = {};
  invoice_number?: string;
  warning
  warning_text

}
