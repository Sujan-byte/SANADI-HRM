export enum PettyCashTransactionEnum {
  id = 'id',

  fund = 'fund',
  fundNo = 'fund_no',

  transactionType = 'transaction_type',
  sourceType = 'source_type',

  amount = 'amount',

  transactionDate = 'transaction_date',

  expenseClaim = 'expense_claim',
  expenseClaimNo = 'expense_claim_no',

  reference = 'reference',
  remarks = 'remarks',

  isActive = 'is_active',
}


export const pettyCashTransactionTypeOptions = [
  {
    label: 'Credit',
    value: 'CREDIT',
  },
  {
    label: 'Debit',
    value: 'DEBIT',
  },
];


export const pettyCashTransactionSourceTypeOptions = [
  {
    label: 'Opening',
    value: 'OPENING',
  },
  {
    label: 'Replenishment',
    value: 'REPLENISHMENT',
  },
  {
    label: 'Expense Claim',
    value: 'EXPENSE_CLAIM',
  },
];
