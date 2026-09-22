export enum ApprovalOptions {
  NOT_APPROVED = 'NOT_APPROVED',
  APPROVED = 'APPROVED',
  SENT_FOR_REVIEW = 'SENT_FOR_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalStatusEnum {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  SENT_FOR_REVIEW = 'Sent for Review',
  SAVE = 'Save',
}

export const ApprovalType = ['APPROVED', 'REJECTED'];

export enum FilterOptions {
  istartsWith = 'istartswith',
  startsWith = 'startswith',
  iendsWith = 'iendswith',
  endsWith = 'endswith',
  iContains = 'icontains',
  contains = 'contains',
  iExact = 'iexact',
  exact = 'exact',
  gte = 'gte',
  lte = 'lte',
  gt = 'gt',
  lt = 'lt',
  dateIs = 'dateIs',
  equal = ''
}

export enum CalenderDateEnum {
  monthYear = "mm-yy",
}

export enum MomentDateEnum {
  monthYear = "MM-YYYY",
}

export const matchModeOptions = [
  // { label: 'Starts With', value: FilterOptions.istartsWith },
  // { label: 'Ends With', value: FilterOptions.iendsWith },
  { label: 'Contains', value: FilterOptions.iContains },
  // { label: 'Equal', value: FilterOptions.iExact },
];

export const matchModeOptionsLocal = [
  // { label: 'Starts With', value: FilterOptions.startsWith },
  // { label: 'Ends With', value: FilterOptions.endsWith },
  { label: 'Contains', value: FilterOptions.contains },
  // { label: 'Equal', value: FilterOptions.exact },
];

export const matchModeOptionsDate = [
  { label: 'Equal', value: FilterOptions.dateIs },
  { label: 'Less than', value: FilterOptions.lt },
  { label: 'Greater than', value: FilterOptions.gt },
  { label: 'Less than or equal', value: FilterOptions.lte },
  { label: 'Greater than or equal', value: FilterOptions.gte },
];

export const matchModeOptionsNumber = [
  // { label: 'Starts With', value: FilterOptions.istartsWith },
  // { label: 'Ends With', value: FilterOptions.iendsWith },
  // { label: 'Contains', value: FilterOptions.iContains },
  { label: 'Equal', value: FilterOptions.equal },
  { label: 'Less than', value: FilterOptions.lt },
  { label: 'Greater than', value: FilterOptions.gt },
  { label: 'Less than or equal', value: FilterOptions.lte },
  { label: 'Greater than or equal', value: FilterOptions.gte },
];

export enum ExportEnum {
  selectAll = 'select_all',
  fields = 'fields',
  excel = 'excel',
  pdf = 'pdf',

  exportFields = 'export_fields',
  selectedListIds = 'selected_list_ids',
  params = 'params',
}

export enum BranchTypes {
  SFIC = '1',
  ASFIC = '2'
}

export enum StatusEnum {
  OPEN = 'Open',
  PARTIAL = 'Partial',
  CLOSED = 'Closed',
  CANCELLED = 'Cancelled',
  PARTIALLY_CANCELLED = 'Partially Cancelled',
  SEMICLOSED = 'Semi-closed',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked',
}

export enum PartyTypeEnum{
  CUSTOMER = 'Customer',
  VENDOR = 'Vendor'
}

export enum GlobalKeyEnum {
  LD_CLAUSE = 'LD_CLAUSE',
  PRICE_VALIDITY = 'PRICE_VALIDITY',
  PACKING = 'PACKING',
  DELIVERY_SCHEDULE = 'DELIVERY_SCHEDULE',
  SUPERVISION_COMMISSION = 'SUPERVISION_COMMISSION',
  PBG = 'PBG',
  WARRANTY_DETAILS = 'WARRANTY_DETAILS',
  MODE_OF_DISPATCH = 'MODE_OF_DISPATCH',
  PAYMENT_TERMS = 'PAYMENT_TERMS',
  DELIVERY_TERMS = 'DELIVERY_TERMS'
}