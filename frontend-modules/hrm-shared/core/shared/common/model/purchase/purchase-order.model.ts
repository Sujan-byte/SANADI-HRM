import * as exp from "constants";
import { ItemTypeConstants } from "../../enum/masters_enum/product.enum";
import { OrderTypeEnum } from "../../../utils/form-constants.help";
import { StatusEnum } from "../../enum/app.enum";
import { AnyNsRecord } from "dns";

export class PurchaseOrderModel {
    id?: any;
    type?: OrderTypeEnum.PURCHASE_ORDER | OrderTypeEnum.WORK_ORDER | OrderTypeEnum.FIXED_ASSET | OrderTypeEnum.GENERAL_ORDER ;
    form_code?: string;
    form_date?: any;
    source?: 'Purchase Indent' | 'Direct'   | OrderTypeEnum.SALES_ORDER;

    purchase_request?: any;
    purchase_request_numbers?: string;

    supplier?: any;
    address?: string;
    ship_to_address?: string;
    bill_to_address?: string;
    bank_address?: string;
    supplier_ref_no?: string;
    po_reference?: string = '';
    email?: string = '';
    phone_number?: string = '';

    currency?: string;
    delivery_terms?: string;
    delivery_method?: string;
    delivery_date?: any;
    transportation_scope?: string = '';
    payment_terms?: any;
    remarks?: any;
    state_code?: string = '';
    country?: string = '';
    gst_number?: string = '';

    poc_name?: string = '';
    poc_email?: string = '';
    poc_mobile?: string = '';
    poc_department?: string = '';

    total_quantity?: number = 0;
    vat_amount?: number = 0;
    total?: number = 0;
    discount?: number = 0;
    taxable_amount?: number = 0;
    cgst?: number = 0;
    sgst?: number = 0;
    igst?: number = 0;
    tcs?: number = 0;
    processing_charges?: number = 0;
    loading_charges?: number = 0;
    packing_charges?: number = 0;
    forwarding_charges?: number = 0;
    freight_charges?: number = 0;
    spi_freight_other_charges?: number = 0;
    insurance?: number = 0;
    adjust_amount?: number = 0;
    grand_total?: number = 0;
    advance?: number = 0;
    balance_amount?: number = 0;

    is_revised?: boolean;
    revise_count?: any;
    base_purchase_order?: any;
    no_balance?: boolean;
    is_grn?: boolean;
    approval_status?: any;
    approval_stage_status?: string = '';
    status?: StatusEnum; //'Open' | 'Partial' | 'Closed' | 'Cancelled' | 'Blocked'
    cancel_remarks?: string = '';

    is_asset?: boolean = false;
    user_created?: string = '';

    purchase_order_details?: Array<PurchaseOrderDetailsModel> = [];
    purchase_order_terms_and_condition?: Array<PurchaseOrderTermsAndConditionModel> = [];
    purchase_order_file_upload?: Array<any> = [];

    default_party_object?: any;
    default_currency_object?: any;
    default_payment_terms_object?: any;
    default_sales_order_number?: any;
    default_delivery_terms_object?: any;
    default_delivery_method_object?: any;
    default_transportation_scope_object?: any = {};
    // EXTRA
    base_revise_count?: any;
    revised_po?: number;
    revising_purchase_order?: boolean;
    created_by?: any = null;
    created_by_name?: string = '';
    party_name?: string = '';
    supplierAddress?: string = '';
    state?: string = '';
    suppliercity?: string = '';
    supplierStateCode?: string = '';
    project_codes?: string = '';
    stage_name?: string = '';
    approval_permission_code?: any = [];
    form_code_copy?: string = '';
    approval_remarks_replaced?: string = '';
    sales_orders_numbers?: any = null;
    salesOrderNumber?: string; 
    PoNumber?: string;
    PoDate?: string; 
    customerPoNumber?: string;
    customerPoDate?: string; // representation key dont remove important for grn

    port_of_loading?: string;
    port_of_discharge?: string;
    comments?: string;

    spi_no?: string;
    spi_date?: any;
    spi_validity_date?: any;
    spi_delivery_date?: any;
    coo?: string;
    supplier_first_name?: string = '';
    fpo_number?: string;
    customer_fpo_no?: string;
    eta_date?: any;
    mode_of_shipment?: any;
    currency_rate?: number = 1;
    company_po_no?: string;
    company_po_date?: any;
    warning?:any;
    warning_text?:any;
    base_revised_fk?:any;
    is_finalized?: boolean;
}

export class PurchaseOrderDetailsModel {
    id?: any;
    purchase_order?: any;
    project?: any;
    project_code?: string;
    item_code?: string = '';
    part_number?: any;
    customer_part_number?: string;
    weight?: string;
    product_name?: any;
    hsn?: any;
    description?: any;
    product_specification?: string = '';
    drawing_number?: string = '';
    machining_process?: string = '';
    required_date?: string = '';

    requested_quantity?: number = 0;
    quantity?: number = 0;
    order_quantity?: string;
    balance_quantity?: number = 0;
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
    purchase_request_detail?: any;
    purchase_request?: any;
    type?: ItemTypeConstants;
    purchase_work_order_details?: Array<WordkOrderDetailsModel>;
    is_asset?: boolean = false;
    total_quantity?: number = 0;
    process_details?: any = [];
    remaining_requested_quantity?: number = 0;
    product_service?: boolean = false;
    frieght_charge?: number = 0;
    sales_orders_numbers?: string;
    brand?: string;
    model?: string;
    base_unit_price?: number = 0;
    unit?: any;
    unit_name?: any;
    unit_conversion_ratio?:number=0;
    spi_unit_price?:number=0
    order_acceptance_details?:any;
    post_po_qty?: number = 0;
}

export class PurchaseOrderTermsAndConditionModel {
    id?: string;
    purchase_order?: string;
    term: string;
    description: string;
}

export class WordkOrderDetailsModel {
    id?: any;
    purchase_details?: any;
    project?: any;
    project_code?: string;
    item_code?: string = '';
    part_number?: any;
    product_name?: string;
    hsn?: any;
    description?: any;
    product_specification?: string = '';
    drawing_number?: string = '';
    machining_process?: string = '';
    required_date?: string = '';
    unit?: any;
    unit_name?: any;
    product?; any;
    tableRowId?: any;
}