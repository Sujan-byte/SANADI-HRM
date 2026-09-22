export enum OAEnum {
    id = "id",
    oaNumber = "oa_number",
    type = "type",
    orderType = "order_type",
    machine = "machine",
    date = "date",
    source = "source",
    salesQuotation = "sales_quotation",

    // PARTY
    customer = "customer",
    customerCode = "customer_code",
    trn = "trn",
    customerAddress = "customer_address",
    customerEmail = "customer_email",
    customerMobile = "customer_mobile",
    currency = "currency",
    paymentTerms = "payment_terms",
    deliveryTerms = "delivery_terms",
    customerRemarks = "customer_remarks",
    billToAddress = "bill_to_address",
    shipToAddress = "ship_to_address",
    fax = "fax",
    taxNumber = "tax_number",
    website = "website",
    region = "region",
    pocName = "poc_name",
    pocEmail = "poc_email",
    pocMobile = "poc_mobile",
    pocDepartment="poc_department",
    remarks = "remarks",
    stateCode = "state_code",
    country = "country",
    PrepaidAdvance = "prepaid_advance",
    customerPoNumber = "customer_po_no",
    customerPoDate = "customer_po_date",
    transportationMode = 'transportation_mode',
    customerCommercialId = "customer_commercial_id",
    vatTreatment = 'vat_treatment',
    isRevised = "is_revised",
    revisionRemarks = "revision_remarks",


    // CALCULATION
    totalQty = "total_qty",
    total = "total",
    discount = "discount",
    taxableAmount = "taxable_amount",
    totalAmounts = "total_amounts",
    vatAmount = "vat_amount",
    cgst = "cgst",
    sgst = "sgst",
    igst = "igst",
    pf = "pf",
    pfAmount = "pf_amount",
    tcs = "tcs",
    adjustAmount = "adjust_amount",
    grandTotal = "grand_total",
    freightCharge = "freight_charge",
    fpoNumber = "fpo_number",
    customerFpoNo = "customer_fpo_no",

    // FILE
    file = "file",

    // DELIVERY DETAILS
    ldClause = "ld_clause",
    orderDeliveryDate = "order_delivery_date",
    modeOfDispatch = "mode_of_dispatch",
    warrantyDetails = "warranty_details",
    pricesValidity = "prices_validity",
    inspection = "inspection",
    transitInsurance = "transit_insurance",
    packing = "packing",
    freight = "freight",
    deliverySchedule = "delivery_schedule",
    supervisionCommission = "supervision_commission",
    dispatchDetails= "dispatch_details",
    portOfLoading = "port_of_loading",
    portOfDischarge = "port_of_discharge",
    estimatedDeliveryDate = "estimated_delivery_date",
    forcast = "forcast",


    // PAYMENT DETAILS
    abg = "abg",
    pbg = "pbg",
    lc = "lc",
    quotationDates = "quotation_dates",
    quotationNumbers = "quotation_numbers",
    quotationIds = "quotation_ids",
    poNumber = "po_number",
    poDate = "po_date",
    poReceivalDate = "po_receival_date",
    includes = "includes",
    exclusion = "exclusion",
    offerDate = "offer_date",
    offerNumber = "offer_number",
    status = "status",
    approvalStatus = "approval_status",
    userCreated = 'user_created',
    created = 'created',

    // ASSOCIATIONS
    oaSpecificationDetails = "oa_specification_details",
    oaContactDetails = "oa_contact_details",
    oaBankDetails = "oa_bank_details",
    oaInvoiceDetails = "oa_invoice_details",
    oaPaymentTermsDetails = "oa_payment_terms_details",
    oaTermsAndCondition = "oa_terms_and_condition",
    oaProductDetails = "oa_product_details",
    oaInclusionExclusionDetails = "oa_inclusion_exclusion_details",
    oaFileUpload = "oa_file_upload",

    isRequested = 'is_requested',
    isIssued = 'is_issued',

    unitName = "unit_name",
    machineName = "machine_name",
    customerName = "customer_name",
    OACustomerDetailsEnum = "OACustomerDetailsEnum",
    baseReviseFk='base_revised_fk'
}

export enum OADetailsEnum {
    id = "id",
    partNumber = "part_number",
    customerPartNumber = "customer_part_number",
    weight = "weight",
    productName = "product_name",
    hsn = "hsn",
    model = "model",
    brand = "brand",
    description = "description",
    drawingNumber = "drawing_number",
    unitName = "unit_name",

    quantity = "quantity",
    unitPrice = "unit_price",
    totalAmount = "total_amount",
    discount = "discount",
    discountAmount = "discount_amount",
    finalPrice = "final_price",
    taxableAmount = "taxable_amount",
    tax = "tax",
    taxValue = "tax_value",
    total = "total",

    material_of_construction = 'material_construction',
    customer_item_code = 'customer_item_code',
    end_user = 'end_user_project',
    consultant = 'consultant',

    product = "product",
    unit = "unit",
    primaryUnits = 'primary_units',
    primaryUnitsName = 'primary_units_name',
    orderAcceptance = "order_acceptance",
    quotation_details = "quotation_details",
    quotation = "quotation",
    oaSpareDetails = 'oa_spare_details',

    isRequested = 'is_requested',
    isIssued = 'is_issued',
    // BOM
    itemCode = "item_code",
    productType = "product_type",
    managingCenter = "managing_center",
    design = "design",
    identNo = "ident_no",
    project = "project",
    projectCode = "project_code",
    unitSymbol = "unit_symbol",
    secondaryUnit = "secondary_unit",
    secondaryUnitName = "secondary_unit_name",
    secondaryUnitSymbol = "secondary_unit_symbol",
    unitRatio = "unit_ratio",
    unitRelationship = "unit_relationship",
    approvalStatus = "approval_status",
    productService = 'product_service',
    hasSubProducts = 'has_sub_products',    
    applicationDetails = 'application_details',
    vatValue="vat_value",
    grossWeight = "gross_weight",
    uom='uom',
}

export enum OASpareDetailsEnum {
    id = "id",
    oaDetails = 'oa_details',
    product = 'product',
    unit = 'unit',
    quantity = 'quantity',
    totalQuantity = 'total_quantity',
    issuedQuantity = 'issued_quantity',
    
    isRequested = 'is_requested',
    isIssued = 'is_issued',
    
    itemCode = "item_code",
    productName = "product_name",
    drawingNumber = "drawing_number",
    description = "description",
    unitSymbol = 'unit_symbol',
    availableQuantity = 'available_quantity',
    remainingQuantity = 'remaining_quantity',
    hasSubProducts = 'has_sub_products', 
}

export enum OATermsConditionEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    term = "term",
    description = "description"
}

export enum OAPaymentTermsEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    paymentTerms = "payment_terms",
    percentage = "percentage",
    amount = "amount",
    tentativeDate = "tentative_date"
}

export enum OAInvoiceEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    invoiceNumber = "invoice_number",
    invoiceDate = "invoice_date",
    file = "file"
}

export enum OABankEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    bankName = "bank_name",
    branch = "branch",
    accountNumber = "account_number",
    ifscCode = "ifsc_code"
}

export enum OASpecificationEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    specification = "specification",
    detail1 = "detail1",
    detail2 = "detail2",
    detail3 = "detail3",
    detail1Data = "detail1_data",
    detail2Data = "detail2_data",
    detail3Data = "detail3_data"
}

export enum OACustomerDetailsEnum{
    id = "id",
    orderAcceptance = "order_acceptance",
    pocName = "poc_name",
    pocEmail = "poc_email",
    pocMobile = "poc_mobile",
    pocDepartment = "poc_department"
}

export enum OAInclusionExclusionEnum {
    id = "id",
    orderAcceptance = "order_acceptance",
    type = "type",
    specification = "specification",
}
