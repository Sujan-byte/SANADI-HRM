export class PettyCashTransactionModel {
  id: any = null;

  fund: any = null;
  fund_no: string = '';

  transaction_type: string = 'CREDIT';
  source_type: string = 'REPLENISHMENT';

  amount: number = 0;

  transaction_date: any = null;

  expense_claim: any = null;
  expense_claim_no: string = '';

  reference: string = '';
  remarks: string = '';

  is_active: boolean = true;
}
