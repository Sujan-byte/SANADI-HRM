export enum ProductEnum {
    productService = 'product_service',
    productDepartment = 'product_department',
    productType = 'product_type',
    category = 'category',
    subCategory = 'sub_category',
    itemName = 'item_name',
    itemCode = 'item_code',
    partNumber = 'part_number',
    customerPartNumber = 'customer_part_number',
    hsn = 'hsn',
    make = 'make',
    drawingNumber = 'drawing_number',

    unit = 'unit',
    unitName = 'unit_name',
    unitSymbol = 'unit_symbol',
    baseCurrency='base_currency',
    // secondaryUnit = 'secondary_unit',
    // unitRatio = 'unit_ratio',
    // unitRelationship = 'unit_relationship',
    grossWeight = 'gross_weight',
    netWeight = 'net_weight',

    managingCenter = 'managing_center',
    description = 'description',
    valuationMethod = 'valuation_method',

    purchasePrice = 'purchase_price',
    serviceCharge = 'service_charge',
    taxType = 'tax_type',
    tax = 'tax',
    salesMargin = 'sales_margin',
    salesPrice = 'sales_price',
    weight = 'weight',
    obQty = 'ob_qty',
    obUnitPrice = 'ob_unit_price',
    obValue = 'ob_value',
    minStock = 'min_stock',
    moq = 'moq',
    basicStockValue = 'basic_stock_value',
    availableQuantity = 'available_quantity',
    temporaryavailable = 'temporary_available',
    totalStock = 'total_stock',
    scrapQuantity = 'scrap_quantity',
    secondaryUom = 'secondary_uom',

    file = 'file',

    productDetails = 'product_details',
    productFileUpload = 'product_file_upload',
    productInquiryDetails = "product_inquiry_details",

    created = 'created',
    modified = 'modified',
    userCreated = 'user_created',
    userModified = 'user_modified',
    ipAddress = 'ip_address',
    bId = 'b_id',
    guid = 'guid',
    isActive = 'is_active',

    // ASSET
    type = 'type',
    assetType = 'asset_type',
    lifeCycle = 'life_cycle',
    depreciationMethod = 'depreciation_method',
    depreciationPercentage = 'depreciation_percentage',
    assetValue = 'asset_value',
    custodian = 'custodian',

    // BOM
    design = "design",
    identNo = "ident_no",
    project = "project",
    projectCode = "project_code",

    categoryName = 'category_name',
    subCategoryName = 'sub_category_name',
    managingCenterName = 'managing_center_name',
    managingCenterCode = 'managing_center_code',

    // Extra filed added
    model = 'model',
    brand = 'brand',
    unitValue = 'unit_value',
    salesPriceDisc = 'sales_price_disc',
    tds = 'tds',


    //purchase
    purchaseDate = "purchase_date",
    purchaseCapitalisationDate = "purchase_capitalisation_date",
    purchaseInvoiceNumber = "purchase_invoice_number",
    purchaseInvoiceDate = "purchase_invoice_date",
    purchaseCost = "purchase_cost",
    purchaseVatAmount = "purchase_vat_amount",
    purchaseTotalCost = "purchase_total_cost",

    // sales
    salesSalesDate = "sales_sales_date",
    salesInvoiceNumber = "sales_invoice_number",
    salesInvoiceDate = "sales_invoice_date",
    salesSalesValue = "sales_sales_value",
    salesVatAmount = "sales_vat_amount",
    salesTotalSalesValue = "sales_total_sales_value",

    department ="department",
    vendor = "vendor",
    purchaseTrustee = "purchase_trustee",
    salesCustomer = "sales_customer",
    salesTrustee = "sales_trustee",

    productNature = "product_nature",
    selectOption = "select_option",
    brands = "brands",
    models = "model_name",
    selectOptions = "select_options",


    productServiceName = 'product_service_name',


    mrp = 'mrp',
    mrpDiscountSale = 'mrp_disc_sale',
    mrpDiscountWholesale = 'mrp_disc_wholesale',

    wholesalePrice = 'wholesale_price',
    wholesaleTaxType = 'wholesale_tax_type',
    wholesaleQuantity = 'wholesale_qty',

    purchaseTaxType = 'purchase_tax_type',

    salesTaxType = 'sales_tax_type',
    salesPriceDiscountType = 'sales_price_disc_type',
    isProductEdit = 'is_product_edit',
    customerDescription='customer_description',
    supplierDescription='supplier_description',

    productStatus = 'product_status',
    dimensions = 'dimensions',
    serialNumber = 'serial_number',
    alternateItem = 'alternate_item',
    safetyStockLevel = 'safety_stock_level',
    movingAveragePrice = 'moving_average_price',
    comments = 'comments',

}

export enum ProductDetailsEnum {
    product = 'product',
    subProduct = 'sub_product',
    itemName = 'item_name',
    partNumber = 'part_number',
    drawingNumber = 'drawing_number',
    quantity = 'quantity',
    unit = 'unit',
    managingCenter = 'managing_center',

    // newest UOM
    noOfPrimaryUnits = 'no_primary_units',
    noOfSecondaryUnits = 'no_secondary_units',
    primaryUnits = 'primary_units',
    secondaryUnits = 'secondary_units',

    subProducts = 'sub_products',
    unitName = 'unit_name',
    managingCenterName = 'managing_center_name',
}

export enum ProductInquiryEnum {
    id = "id",
    product = "product",
    supplier = "supplier",
    inquiryDate = "inquiry_date",
    purchaseInquiry = "purchase_inquiry",
    price = "price",

    partyName = "party_name",
    partyCode = "party_code",
    purchaseInquiryNumber = "purchase_inquiry_number",
}

export enum SerialNumberEnum {
    product = 'product',
    serialNumber = 'serial_number',
    sold = 'sold',
    grnStatus = 'grn_status',
    invoiceStatus = 'invoice_status',
    grn = 'grn',
    invoice = 'invoice',
    productName = 'product_name',
    grnNo = 'grn_no',
    invoiceNo = 'invoice_no',
    warrantyStatus = "warranty_status",
    // ASSET
    expiryDate = "expiry_date",
    inServiceDate = "in_service_date",
    deliveryDate = "delivery_date",
    assetPurchaseDate = "asset_purchase_date",
    assetManufacturingDate = "asset_manufacturing_date",
    assetManufacturer = "asset_manufacturer",
    depreciationStartDate = "depreciation_start_date",
}

export enum ItemTypeConstants {
    PRODUCT = 'Product',
    ASSET = 'Asset'
}

export enum ProductMasterDetailsEnum {
    product = 'product',
    date = 'date',
    fromType = 'from_type',
    openingQuantity = 'opening_quantity',
    obQtyPrev = 'ob_qty_prev',
    obQty = 'ob_qty',
    obQtyNow = 'ob_qty_now',
    inwardQty = 'inward_qty',
    outwardQty = 'outward_qty',
    availableIn = 'available_in',
    availableOut = 'available_out',
    availablePrev = 'available_prev',
    availableNow = 'available_now',
    transactionQtyPrev = 'transaction_qty_prev',
    transactionQtyNow = 'transaction_qty_now',
    closingQuantity = 'closing_quantity',
    remarks = 'remarks',
    outUnitPrice = 'out_unit_price',
    outItemValue = 'out_item_value',
    inUnitPrice = 'in_unit_price',
    inItemValue = 'in_item_value',
    oldPurchasePrice = 'old_purchase_price',
    newPurchasePrice = 'new_purchase_price',
    openingStockValue = 'opening_stock_value',
    closingStockValue = 'closing_stock_value'
}