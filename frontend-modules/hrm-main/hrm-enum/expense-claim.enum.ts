export enum ExpenseClaimEnum {
  id = 'id',

  // Header
  claimNo = 'claim_no',
  claimName = 'claim_name',

  claimant = 'claimant',
  submittedBy = 'submitted_by',

  periodFrom = 'period_from',
  periodTo = 'period_to',

  businessPurpose = 'business_purpose',

  paidBy = 'paid_by',

  pettyCashFund = 'petty_cash_fund',
  pettyCashFundNo = 'petty_cash_fund_no',

  advanceReference = 'advance_reference',
  advanceAmount = 'advance_amount',

  // Totals
  totalClaimed = 'total_claimed',
  netPayable = 'net_payable',
  excessToReturn = 'excess_to_return',

  // Workflow
  status = 'status',
  approvalStatus = 'approval_status',
  rejectionReason = 'rejection_reason',

  // Payment
  paymentReference = 'payment_reference',
  paymentDate = 'payment_date',

  remarks = 'remarks',

  // Child data returned by serializer
  lines = 'lines',
  attachments = 'attachments',

  // Display objects / serializer helper values
  claimantName = 'claimant_name',
  submittedByName = 'submitted_by_name',

  defaultClaimantObject = 'default_claimant_object',
  defaultSubmittedByObject = 'default_submitted_by_object',

  isActive = 'is_active',
}


export enum ExpenseClaimLineEnum {
  id = 'id',

  claim = 'claim',

  expenseDate = 'expense_date',

  category = 'category',
  categoryName = 'category_name',

  vendorName = 'vendor_name',

  description = 'description',

  amount = 'amount',

  receiptAttached = 'receipt_attached',

  linkType = 'link_type',
  linkTypeLabel = 'link_type_label',

  linkedContentType = 'linked_content_type',

  linkedObjectId = 'linked_object_id',

  linkedObjectDisplay = 'linked_object_display',

  isActive = 'is_active',
}


export const expenseClaimPaidByOptions = [
  {
    label: 'Out of Pocket',
    value: 'OUT_OF_POCKET',
  },
  {
    label: 'Cash Advance',
    value: 'CASH_ADVANCE',
  },
  {
    label: 'Company Card',
    value: 'COMPANY_CARD',
  },
  {
    label: 'Petty Cash',
    value: 'PETTY_CASH',
  },
];