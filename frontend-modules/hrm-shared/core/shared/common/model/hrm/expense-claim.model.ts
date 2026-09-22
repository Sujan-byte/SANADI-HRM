export class ExpenseClaimModel {
  id: any = null;

  // Header
  claim_no: string = '';
  claim_name: string = '';

  claimant: any = null;
  submitted_by: any = null;

  period_from: any = null;
  period_to: any = null;

  business_purpose: string = '';

  paid_by: string = 'OUT_OF_POCKET';

  petty_cash_fund: any = null;
  petty_cash_fund_no: string = '';

  // Advance
  advance_reference: string = '';
  advance_amount: number = 0;

  // Calculated totals
  total_claimed: number = 0;
  net_payable: number = 0;
  excess_to_return: number = 0;

  // Workflow
  status: string = 'DRAFT';
  approval_status: string = '';
  rejection_reason: string = '';

  // Payment
  payment_reference: string = '';
  payment_date: any = null;

  remarks: string = '';

  // Child records
  lines: ExpenseClaimLineModel[] = [];
  attachments: ExpenseClaimAttachmentModel[] = [];

  // Display/helper values
  claimant_name: string = '';
  submitted_by_name: string = '';

  default_claimant_object: any = {};
  default_submitted_by_object: any = {};

  is_active: boolean = true;
}




export class ExpenseClaimLineModel {
  id: any = null;

  claim: any = null;

  expense_date: any = null;

  category: any = null;
  category_name: string = '';

  vendor_name: string = '';
  description: string = '';

  amount: number = 0;

  receipt_attached: boolean = false;

  // Optional dynamic reference
  link_type: any = null;
  link_type_label: string = '';

  linked_content_type: any = null;
  linked_object_id: any = null;
  linked_object_display: string = '';

  is_active: boolean = true;
}


export class ExpenseClaimAttachmentModel {
  id: any = null;

  claim: any = null;

  file: any = null;
  file_name: string = '';
  file_url: string = '';

  is_active: boolean = true;
}