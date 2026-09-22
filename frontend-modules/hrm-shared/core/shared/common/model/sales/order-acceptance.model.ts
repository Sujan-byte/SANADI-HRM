import { ProductTypeEnum } from "../../../utils/form-constants.help";

export class OAModel {
    id?: any;
    oa_number?: string;
    type?:any;
    order_type?: string;
    machine?: any;
    date?: any;
    source?: any;

    // PARTY
    customer?: any;
    customer_code?: any;
    trn?:string;
    customer_address?: string;
    customer_email?: string;
    customer_mobile?: string;
    currency?: string;
    payment_terms?: string;
    delivery_terms?: string;
    customer_remarks?: string;
    bill_to_address?: string;
    ship_to_address?: string;
    fax?: string;
    tax_number?: string;
    website?: string;
    region?: string;
    poc_name?: string;
    poc_email?: string;
    poc_mobile?: string;
    poc_department?: string;
    remarks?: string;
    state_code?: string;
    country?: string = '';
    forcast?: string;
    fpo_number?: string;
    customer_fpo_no?: string;
    transportation_mode?: string;
    customer_commercial_id?:string;
    vat_treatment?:string;
    revision_remarks?: string;
    warning?: boolean;
    warning_text?: string;

    //Product Details 
    material_of_construction?: any;
    customer_item_code?: any;
    end_user?: any;
    consultant?: any;

    // CALCULATION 
    total_qty?: number = 0;
    total?: number = 0;
    discount?: number = 0;
    taxable_amount?: number = 0;
    total_amounts?: number = 0;
    vat_amount?: number = 0;
    cgst?: number = 0;
    sgst?: number = 0;
    igst?: number = 0;
    pf?: number = 0;
    pf_amount?: number = 0;
    tcs?: number = 0;
    adjust_amount?: number = 0;
    grand_total?: number = 0;
    prepaid_advance?: number = 0;
    freight_charge?: number = 0;

    // FILE
    file?: any;

    // DELIVERY DETAILS
    ld_clause?: string;
    order_delivery_date?: string;
    mode_of_dispatch?: string;
    dispatch_details?: string;
    port_of_loading?: string;
    port_of_discharge?: string;
    estimated_delivery_date?: string;
    warranty_details?: string;
    prices_validity?: string;
    inspection?: string;
    transit_insurance?: string;
    packing?: string;
    freight?: string;
    delivery_schedule?: any;
    supervision_commission?: string;

    // PAYMENT DETAILS
    abg?: string;
    pbg?: string;
    lc?: string;
    quotation_ids?: any;
    quotation_dates?: string;
    quotation_numbers?: string;
    po_number?: string;
    po_date?: any;
    po_receival_date?: any;
    includes?: string;
    exclusion?: string;
    offer_date?: any;
    offer_number?: string;
    status?: string;
    approval_status?: string;
    user_created?: string = '';
    user_modified?: string = '';
    customer_po_no?: string;
    customer_po_date?: any;

    is_requested?: boolean = false;
    is_issued?: boolean = false;

    // ASSOCIATIONS
    oa_specification_details?: Array<OASpecificationModel> = [];
    oa_contact_details?: Array<OAContactDetailModel> = [];
    oa_bank_details?: Array<OABankModel> = [];
    oa_invoice_details?: Array<OAInvoiceModel> = [];
    oa_payment_terms_details?: Array<OAPaymentTermsModel> = [];
    oa_terms_and_condition?: Array<OATermsConditionModel> = [];
    oa_product_details?: Array<OADetailsModel> = [];
    oa_inclusion_exclusion_details?: Array<OAInclusionExclusionModel> = [];
    oa_file_upload?: Array<any>;

    default_customer_object?: any = {};
    default_payment_object?: any = {};
    default_port_of_discharge_object?: any = {};
    default_machine_object?: any;
    default_region_object?: any = {};
    default_payment_terms?: any = {};
    default_delivery_terms?: any = {};
    default_quotation_object?: any;
    default_ld_clause_object?: any = {};
    default_prices_validity_Object?: any = {};
    default_warranty_details_object?: any = {};
    default_mode_of_dispatch?: any = {};
    default_packing_object?: any = {};
    default_delivery_schedule_object?: any = {};
    default_supervision_commission_object?: any = {};
    default_pbg_object?: any = {};
    

    machine_name?: string;
    customer_name?: string = '';
    currency_rate:number=0;
    revise_count:number=0;
    is_revised:boolean;
    base_order_acceptance:any;
    revised_po?: number;
    base_revised_fk:any;
    is_finalized?: boolean;

}

export class OADetailsModel {
    id?: any;
    order_acceptance?: any;
    part_number?: any;
    customer_part_number?: string;
    weight?: string;
    product_name?: any;
    hsn?: any;
    model?:any;
    brand?:any;
    description?: any;
    drawing_number?: string;
    quantity?: number = 0;
    unit_price?: number = 0;
    total_amount?: number = 0;
    discount?: number = 0;
    discount_amount?: number = 0;
    final_price?: number = 0;
    taxable_amount?: number = 0;
    tax?: number = 0;
    tax_value?: number = 0;
    total?: number = 0;
    product?: any;
  
    primary_units_name?: string;
    primary_units?: any;
    quotation_details?: any;
    quotation?: any;
    post_inv_rem_qty?: number = 0;
    post_pinv_rem_qty?: number = 0;
    oa_spare_details?: Array<OASpareDetailsModel> = [];
    is_requested?: boolean = false;
    is_issued?: boolean = false;
    // BOM
    item_code?: string = '';
    product_type?: string = '';
    managing_center?: any;
    design?: any;
    ident_no?: string = '';
    project?: any;
    project_code?: string = '';
    unit_symbol?: string = '';
    secondary_unit?: any = null;
    secondary_unit_name?: string = '';
    secondary_unit_symbol?: string = '';
    unit_ratio?: number = 0;
    unit_relationship?: string = '';
    approval_status?: string = '';
    product_service?: boolean = false;
    has_sub_products?: boolean = false;
    application_details?: string = '';
    base_unit_price?:number=0;
    gross_weight?: number = 0;

    //unit dont remove this filed
    unit?: any = null;
    unit_conversion_ratio?:number=0;
    unit_name?:string=''
    post_oa_qty?: number = 0;
}

export class OASpareDetailsModel {
    id?: any = null;
    oa_details?: any = null;
    product?: any = null;
    unit?: any = null;
    quantity?: number = 0;
    total_quantity?: number = 0;
    issued_quantity?: number = 0;

    is_requested?: boolean = false;
    is_issued?: boolean = false;

    item_code?: string = '';
    product_name?: string = '';
    drawing_number?: string = '';
    description?: string = '';
    unit_symbol?: string = '';
    available_quantity?: number = 0;
    remaining_quantity?: number = 0;
    has_sub_products?: boolean = false;
}

export class OATermsConditionModel {
    id?: string;
    order_acceptance?: string;
    term?: string;
    description?: string;
}

export class OAPaymentTermsModel {
    id?: string;
    order_acceptance?: string;
    payment_terms?: string = '';
    percentage?: number = 0;
    amount?: number = 0;
    tentative_date?: any;
}

export class OAInvoiceModel {
    id?: string;
    order_acceptance?: string;
    invoice_number?: string;
    invoice_date?: any;
    file?: any;
}

export class OABankModel {
    id?: string;
    order_acceptance?: string;
    bank_name?: string;
    branch?: string;
    account_number?: string;
    ifsc_code?: string;
}

export class OAContactDetailModel{
    id?: string;
    order_acceptance?: string;
    poc_name?: any;
    poc_email?: any;
    poc_mobile?: any;
    poc_department?: any;
}



export class OASpecificationModel {
    id?: string;
    order_acceptance?: string;
    specification?: string;
    detail1?: string;
    detail2?: string;
    detail3?: string;
    detail1_data?: string;
    detail2_data?: string;
    detail3_data?: string;
}

export class OAInclusionExclusionModel {
    id?: any;
    order_acceptance?: string = '';
    type?: string = '';
    specification?: string = '';
}
