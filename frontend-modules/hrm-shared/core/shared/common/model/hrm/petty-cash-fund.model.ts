export class PettyCashFundModel {
  id: any = null;

  fund_no: string = '';

  holder: any = null;
  holder_name: string = '';

  opening_balance: number = 0;
  current_balance: number = 0;

  fund_date: any = null;

  status: string = 'ACTIVE';
  approval_status: string = '';

  remarks: string = '';

  ledger_account: any = null;
  
  ledger_account_name: string = '';

  is_active: boolean = true;
}
