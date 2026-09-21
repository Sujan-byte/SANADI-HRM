export enum PettyCashFundEnum {
  id = 'id',

  fundNo = 'fund_no',

  holder = 'holder',
  holderName = 'holder_name',

  openingBalance = 'opening_balance',
  currentBalance = 'current_balance',

  fundDate = 'fund_date',

  status = 'status',
  approvalStatus = 'approval_status',

  remarks = 'remarks',

  ledgerAccount = 'ledger_account',

  isActive = 'is_active',
}


export const pettyCashFundStatusOptions = [
  {
    label: 'Active',
    value: 'ACTIVE',
  },
  {
    label: 'Suspended',
    value: 'SUSPENDED',
  },
  {
    label: 'Closed',
    value: 'CLOSED',
  },
];
