import { ItemTypeConstants } from "../../enum/masters_enum/product.enum";

export class DeliveryChallanModel {
    id?: number;
    dc_no: any;
    dc_date: any;
    source: 'Invoice' | 'Work Order' | 'Direct';
    work_order: any;
    invoice: any;
    type: 'Dispatch' | 'Returnable' | 'Non Returnable' | '';
    customer_po_number: any;
    customer_po_date: any;
    customer: any;
    select_customer: any;
    bill_to_address: any;
    ship_to_address: any;
    fax: any;
    website: any;
    region: any;
    poc_name: any;
    poc_email: any;
    poc_mobile: any;
    remarks: any;
    is_grn?: boolean;
    gst_number?: any;
    delivery_challan_details: Array<DeliveryChallanDetailsModel>;
    delivery_challan_terms_and_condition: Array<DeliveryTermsAndConditionModel>;
    default_sales_op_object: any;
    default_customer_object: any;
    default_work_order_object: any;
    default_invoice_object: any;
    default_select_customer_object: any;

    party_ref_code?: string;
    state_code?: any;
    user_created?: string = '';

    // TRANSPORT INFO
    approx_value?: any;
    transporter_name?: any;
    lr_number?: any;
    vehicle_number?: any;
    delivery_method?: any;
    delivery?: any;
    packing_list?: any;
    insurance_details?: any;
    lc_details?: any;
    note?: any;
    e_way_bill_number?: any;
    e_way_bill_date?: any;
    approval_status?: string;
}

export class DeliveryChallanDetailsModel {
    id?: any;
    dc: any;
    project?: any;
    project_code?: string;
    item_code?: string = '';
    part_number: any;
    product_name: any;
    hsn: any;
    description: any;
    drawing_number?: string = '';
    currency: any;
    qty: any;
    balance_quantity?: number;
    unit: any;
    unit_name: string;
    price: number;
    product: any;
    dc_sub_products?: Array<DeliveryChallanSubProductModel>;
    type?: ItemTypeConstants;
    invoice_details?: any;

    project_details?: any = [];
    project_codes?: string = '';
    product_service?: boolean = false;
}

export class DeliveryChallanSubProductModel {
    id?: any;
    dc_details: any;
    part_number: any;
    product_name: any;
    hsn: any;
    unit: any;
    quantity: any;
    total_quantity: any;
    product: any;
}

export class DeliveryTermsAndConditionModel {
    id?: string;
    dc: string;
    term: string;
    description: string;
}