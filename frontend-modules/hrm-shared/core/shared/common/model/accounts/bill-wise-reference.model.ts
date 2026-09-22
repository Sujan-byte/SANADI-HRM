export class BillWiseReferenceDetailsModel {
    id?: any;
    form_id?: any;
    type_of_ref?: string = '';
    name?: string = '';
    other_name?: string = '';
    due_date?: any = '';

    amount_type?: string = '';
    bill_date?: any;
    balance_type?: string = '';
    final_balance_type?: string = '';

    ledger_reference?: any = null;
    ledger: any;

    party_cc_to_bc_rate?: number = 1;
    party_tc_to_bc_rate?: number = 1;
    party_tc_to_cc_rate?: number = 1;
    reference_no_key?:string=''
    narration?:string;
    transaction_currency?: string = '';
    base_currency?: string = '';
    party_counter_currency?: string = '';

    tc_to_bc_amount?: number = 0;
    tc_to_bc_balance?: number = 0;
    tc_to_bc_final_balance?: number = 0;

    tc_amount?: number = 0;
    tc_balance?: number = 0;
    tc_final_balance?: number = 0;
    opening_tc_balance?: number = 0;
    opening_bc_balance?: number = 0;


}
export class BillWiseReferenceModel {
    bill_wise_reference_details: Array<BillWiseReferenceDetailsModel>
    vchType: [];
    typeOfRef: [];
    typeOfOptions: [];
    formlabel: any;
    bill_wise_total_amount?: number = 0;
    tc_bill_wise_total_amount?: number = 0;
    bc_bill_wise_total_amount?: number = 0;
    form_code: any = '';
    tally_ledger: any;
    grand_total: any;
    due_date: any;
    finalBalanceType: any;
    form_code_key?: string;
    due_date_key?: string;
    grand_total_key?: string;
    amount_type_key?: string;
    currency_rate_key?: number = 1;
    currency_key?: any;
    reference_no_key?:any;
    narration_key?:any;


}
