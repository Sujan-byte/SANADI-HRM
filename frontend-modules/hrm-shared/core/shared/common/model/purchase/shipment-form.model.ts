export class Shipmentmodel {
    shipment_no?: string;
    supplier_invoice_no?: any;
    customer_invoice_no?: any;
    sales_order_no?: any;
    purchase_order_no?: string;
    customer_po_no?: string;
    customer_po_date?: any;
    customer_name?: string;
    customer_address?: string;
    remarks?: string;
    eta?: string;
    shipment_status?: string;
    delivery_method?: string;
    forwarder_name?: string;
    forwarder_booking_number?: string;
    freight_charge?: number = 0;
    freight_charge_currency?: number = 0;
    bl_number?: string;
    bl_date?: any;
    departure_date?: any;
    gross_weight?: number = 0;
    actual_time_arrived?: any;
    shipment_remarks?: string;
    approval_status: string;
    approval_remarks?: string;


    // from invoice
    country_of_origin?: string;
    port_of_loading?: string;
    destination?: string;
    net_weight?: number = 0;
    part_of_shipment?: string;
    transportation_terms?: string;
    description_of_packing?: string;
    payment_terms?: string;
    mode_of_transportation?: string;
    delivery_date?: any;
    delivery_terms?: string;



    shipment_supplier_invoice?: any = {};
    shipment_invoice_no?: any = {};
    shipment_sales_order?: any = {};
    default_purchase_order_number?: any;
    default_delivery_terms?: Record<string,any>;
    default_delivery_method_object?: any;

    shipment_list_terms_and_condition?: Array<ShipmentFormTermsAndConditionModel> = [];
    shipment_details?: Array<shipmentDetailsModel>;
    shipment_order_file_upload: Array<any>;
    supplier_invoice_number: any;
    type:any;
    no_of_container:any;
    default_party_object?: any;
    balance_payment_amount?: any;
    invoice_number?: string;
    invoice_date?: any;


}

export class shipmentDetailsModel {
    id?: any;
    shipment?: string;
    item_code?: string;
    part_number?: string;
    product_name?: string;
    brand?: string;
    model?: string;
    description?: string;
    hsn?: string;
    quantity?: number = 0;
    unit?: any = null;
    unit_conversion_ratio?: number = 0;
    unit_name?: string = ''
}

export class ShipmentFormTermsAndConditionModel {
    id?: string;
    shipment?: string;
    term: string;
    description: string;
}