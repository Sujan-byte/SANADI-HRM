import { ItemTypeConstants } from "../../enum/masters_enum/product.enum";
import { BillWiseReferenceDetailsModel } from "../accounts/bill-wise-reference.model";

export class GRNModel {
    id?: number;
    grn_no?: any;
    grn_date?: any;
    due_date?: any;
    source?: 'PO' | 'DC With WorkOrder' | 'Direct' | 'DC' | 'Fixed Asset';
    purchase_order?: any;
    purchase_order_numbers?: any;
    delivery_challan?: any;
    sales_order?: any;
    spi_number?: any;
    dc_no?: string = '';
    supplier?: any;
    address?: any;
    ship_to_address?: any;
    supplier_ref_no?: any;
    invoice_no?: any;
    invoice_date?: any;
    // terms_and_conditions?: any;
    note?: any;
    vehicle_no?: any;
    vehicle_arrival_date?: any;
    vehicle_exit_date?: any;

    total_qty?: number = 0;
    total?: number = 0;
    discount?: number = 0;
    taxable_amount?: number = 0;
    cgst?: number = 0;
    sgst?: number = 0;
    igst?: number = 0;
    tcs?: number = 0;
    adjust_amount?: number = 0;
    grand_total?: number = 0;
    adjust_amount_ledger?: any;
    gst_number?: any;

    state_code?: any;
    country?: any;
    user_created?: string = '';

    prepaid_advance_amount?: number;

    balance_amount?: number;
    paid_amount?: number;

    is_asset?: boolean = false;

    grn_details?: Array<GRNDetailsModel>;
    grn_terms_and_condition?: Array<GRNTermsAndConditionModel>;
    grn_file_upload?: Array<any> = [];
    default_po_object?: any;
    default_party_object?: any;
    default_dc_object?: any;
    default_sales_object?:any;
    default_spi_object?:any;
    currency?: any;
    is_sez?: any;
    supplierName?: string;
    created_by?: any = null;
    created_by_name?: any;
    bill_wise_reference_details?: Array<BillWiseReferenceDetailsModel>;
    bill_wise_total_amount?: number = 0;
    amount_type?: string = 'Cr';  // important for billwise ref
    approval_status?: string;
    approved_once?: boolean = false;
    approval_remarks_replaced?: string = '';
    is_foreign?: boolean;
    vat?: number = 0;

    actual_time_arrived?: string;
    eta?: string;
    shipment_status?: any;
    delivery_method?: any;
    forwarder_name?: string;
    forwarder_booking_number?: string;
    freight_charge?: number;
    freight_charge_currency?: any;
    customer_invoice_number?: string;
    b_l_number?: string;
    b_l_date?: string;                    // e.g. '2025-11-08'
    departure_date?: string;              // e.g. '2025-11-07'
    gross_weight?: number;
    default_shipment_status_object?: any;
    default_delivery_method_object?: any;
    default_freight_charge_currency_object?: any;
    currency_rate:number=0;
    base_currency:string;

}

export class GRNDetailsModel {
    id?: any = null;
    grn?: any = null;
    part_number?: any = '';
    product_name?: any = '';
    hsn?: any = '';
    description?: any = '';
    drawing_number?: string = '';
    item_code?: string = '';
    unit?: any = null;
    unit_name?: string = '';
    unit_conversion_ratio?:number=0;

    po_qty?: number = 0;
    dc_qty?: number = 0;
    received_qty?: number = 0;
    rejected_qty?: number = 0;
    balance_qty?: number = 0;
    total_qty?: number = 0;
    unit_price?: number = 0;
    total_amount?: number = 0;
    discount?: number = 0;
    discount_amount?: number = 0;
    final_price?: number = 0;
    taxable_amount?: number = 0;
    tax?: number = 0;
    tax_value?: number = 0;
    total?: number = 0;

    product?: any = null;
    po_details?: any = null;
    purchase_order?: any;
    dc_details?: any = null;
    wo_details?: any = null;
    sub_products?: any = [];
    project?: any = null;
    project_code?: string = '';
    grn_serial_numbers?: any = [];
    type?: ItemTypeConstants;
    // REPRESENTATION FIELDS
    // dc_id?:any;
    // dc_product_name?:any;
    grn_no?: string = '';
    grn_date?: any = null;
    vendor_name?: string = '';
    product_service?: boolean = false;
    purchase_order_numbers?: string = '';
    base_unit_price:number=0;

    invoice_no?: any;
    invoice_date?: any;
}

export class GrnSubProductModel {
    id?: any;
    grn_details?: any;
    part_number?: any;
    product_name?: any;
    hsn?: any;
    unit?: any;
    quantity?: any;
    total_quantity?: any;
    product?: any;
}

export class GRNTermsAndConditionModel {
    id?: string;
    grn?: string;
    term?: string;
    description?: string;
}

export class GrnSerialNumberModel {
    id?: string;
    grn_details?: string;
    serial_number?: string;
}