export interface PostingPreviewRow {
  ledger_name: string;
  tc_debit_amount: number;
  tc_credit_amount: number;
  bc_debit_amount: number;
  bc_credit_amount: number;
}

export interface PostingPreviewCurrencyTotals {
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
}

export type PostingPreviewDataSource = 'PREVIEW' | 'ACTUAL';

export interface PostingPreviewResponse {
  data_source: PostingPreviewDataSource;
  base_currency: string;
  transaction_currency: string;
  tc_to_bc_rate: number;
  as_of_date: string | null;
  vch_no: string;
  postings: PostingPreviewRow[];
  totals: {
    transaction_currency: PostingPreviewCurrencyTotals;
    base_currency: PostingPreviewCurrencyTotals;
  };
}
