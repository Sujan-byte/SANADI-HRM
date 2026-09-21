export enum SalaryHoldEnum {
    employee_ids    = 'employee_ids',
    employee_names  = 'employee_names',
    hold_from_date  = 'hold_from_date',
    hold_to_date    = 'hold_to_date',
    reason          = 'reason',
    remarks         = 'remarks',
    released_on     = 'released_on',
    release_remarks = 'release_remarks',
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


export enum ExpenseClaimAttachmentEnum {
  id = 'id',

  claim = 'claim',
  file = 'file',
  fileName = 'file_name',
  fileUrl = 'file_url',

  isActive = 'is_active',
}