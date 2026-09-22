export class packingListModel {
    packing_list_no?: string;
    packing_date?: any;
    packing_commercial_invoice?: string;
    proforma_invoice?: any;
    pi_no?: string;
    pi_date?: any;
    sales_order_no?: string;
    sales_order_number?: any;
    customer_name?: string;
    customer_address?: string;
    customer_phone?: string;
    country_of_origin?: string;
    port_of_loading?: string;
    destination?: string;
    net_weight?: number = 0;
    gross_weight?: number = 0;
    part_of_shipment?: string;
    transportation_terms?: string;
    description_of_packing?: string;
    payment_terms?: string;
    mode_of_transportation?: string;
    cpi_currency?: string;
    delivery_terms?: string;
    delivery_date?: any;
    packing_remarks?: string;
    total_gross_weight?: number = 0;
    pallet_bags?: string;
    total_pallet_bags?: number = 0;
    package_type_details?: string;
    measurement_details?: string;
    packing_details?: Array<PackingListDetailsModel>;
    packing_terms_and_condition?: Array<PackingListTermsConditions>;
    packing_file_upload?: Array<any>;
    customer_commercial_id?:string;
    //approval_status?: string;

    // DEFAULT OBJECTS
    default_invoice_number?: any = {};
    default_sales_order_number?: any = {};
    default_delivery_terms_object?: any;
    default_proforma_invoice_object?: Record<string, any>;
    default_payment_object?: Record<string, any>;

    gross_weights?: number = 0;
    pallets_bag_carton_selections?: number = 0;


}

export class PackingListDetailsModel {
    packing_list?: string;
    item_code?: string;
    part_number?: string;
    product_name?: string;
    brand?: string;
    model?: string;
    description?: string;
    hsn?: string;
    quantity?: number = 0;
    gross_weights?: number = 0;
    pallets_bag_carton_selections?: number = 0;

    unit?: any = null;
    unit_conversion_ratio?: number = 0;
    unit_name?: string = ''
}


export class PackingListTermsConditions {
    id?: any;
    packing_list?: string;
    term?: string;
    description?: string;
}