from enum import Enum

PADDING_LENGTHS = {
    'PURCHASE_REQUEST_NUMBERING': 4,
    'MATERIAL_REQUEST_NUMBERING': 4,
    'MATERIAL_ISSUE_NUMBER': 4,
    'MATERIAL_ASSIGN': 4,
    'PROJECT_PLANNING_NUMBERING': 4,
    'PRODUCTION_PLANNING_NUMBERING': 4,
    'PURCHASE_ORDER_NUMBERING': 4,
    'JOURNAL_CODE_NUMBERING': 3,
    'INWARD_PAYMENT_NUMBERING': 3,
    'OUTWARD_PAYMENT_NUMBERING': 3,
    'WORK_ORDER_NUMBERING': 4,
    'PURCHASE_INQUIRY_NUMBERING': 4,
    'ORDER_ACCEPTANCE_NUMBERING': 3,
    'INVOICE_NUMBERING': 4,
    'INVOICE_SERVICE_NUMBERING': 4,
    'GENERAL_PO_NUMBERING': 4,
}
CUSTOM_CODE = {'TA_DA_NUMBER'}
CUSTOM_CODES = {'DEPARTMENT_CODE', 'MANAGING_CENTER_NUMBERING', 'GRADE_MASTER_NUMBERING', 'PROCESS_MASTER_NUMBERING',
                'MACHINE_MASTER_NUMBERING', 'PARTY_CODE', 'SUPPLIER_CODE', 'CUSTOMER_CODE', 'GRADE_CODE',
                'LEDGER_NUMBERING', 'CONTRA_NUMBERING',
                'DESIGNATION_CODE', 'EMPLOYEE_CODE', 'SERVICE_CODE', 'PURCHASE_REQUEST_NUMBERING',
                'PURCHASE_INQUIRY_NUMBERING', 'MATERIAL_REQUEST_NUMBERING',
                'MATERIAL_ISSUE_NUMBER', 'MATERIAL_RETURN_NUMBER', 'MRP_NUMBERING', 'MATERIAL_ASSIGN',
                'PROJECT_PLANNING_NUMBERING',
                'PRODUCTION_PLANNING_NUMBERING', 'MACHINE_BREAKDOWN_REGISTRY', 'MAN_POWER_ACTIVITY_CHART',
                'DC_WORK_ORDER_NUMBERING'}


class NumberConstructorConstants(Enum):
    # MASTERS
    CATEGORY_NUMBERING = 'CATEGORY_NUMBERING'
    SUB_CATEGORY_NUMBERING = 'SUB_CATEGORY_NUMBERING'
    DEPARTMENT_CODE = "DEPARTMENT_CODE"
    MANAGING_CENTER_NUMBERING = "MANAGING_CENTER_NUMBERING"
    GRADE_MASTER_NUMBERING = "GRADE_MASTER_NUMBERING"
    GRADE_CODE = "GRADE_CODE"
    PROCESS_MASTER_NUMBERING = "PROCESS_MASTER_NUMBERING"
    MACHINE_MASTER_NUMBERING = "MACHINE_MASTER_NUMBERING"
    DESIGNATION_CODE = "DESIGNATION_CODE"
    EMPLOYEE_CODE = "EMPLOYEE_CODE"
    ALLOWANCE_CODE = "ALLOWANCE_CODE"
    SHIFT_CODE = "SHIFT_CODE"
    PARTY_CODE = "PARTY_CODE"
    SUPPLIER_CODE = "SUPPLIER_CODE"
    CUSTOMER_CODE = "CUSTOMER_CODE"
    VENDOR_CODE = "VENDOR_CODE"
    CUSTOMER_AND_SUPPLIER= "CUSTOMER_AND_SUPPLIER_CODE"
    PRODUCT_CODE = "PRODUCT_CODE"
    ASSET_MASTER = "ASSET_MASTER"
    PROJECT_CODE = "PROJECT_CODE"
    # IDENT_CODE = "IDENT_CODE"
    ITEM_CODE = "ITEM_CODE"
    WEIGHTAGE_AVERAGE = "WEIGHTAGE_AVERAGE"
    IMPORT_CODE = "IMPORT_CODE"
    SERVICE_CODE = "SERVICE_CODE"
    TRUSTEE_CODE = "TRUSTEE_CODE"
    BANKDETAILS_NUMBERING = "BANKDETAILS_NUMBERING"
    INTERBRANCH_TRANSFER_NUMBERING = "INTERBRANCH_TRANSFER_NUMBERING"
    DOCUMENT_TYPE_CODE = "DOCUMENT_TYPE_CODE"


    # PRODUCTION
    MATERIAL_ASSIGN = "MATERIAL_ASSIGN"
    MRP_NUMBERING = "MRP_NUMBERING"
    PROJECT_PLANNING_NUMBERING = "PROJECT_PLANNING_NUMBERING"
    PRODUCTION_PLANNING_NUMBERING = "PRODUCTION_PLANNING_NUMBERING"
    PRODUCTION_ACTIVITY_CHART = "PRODUCTION_ACTIVITY_CHART"
    RAW_MATERIAL_CONSUMPTION = "RAW_MATERIAL_CONSUMPTION"
    PACKING_LIST = "PACKING_LIST"
    PLASMA_MACHINE_DATA_ENTRY = "PLASMA_MACHINE_DATA_ENTRY"
    MACHINE_BREAKDOWN_REGISTRY = "MACHINE_BREAKDOWN_REGISTRY"
    MAN_POWER_ACTIVITY_CHART = "MAN_POWER_ACTIVITY_CHART"

    # hrm
    TA_DA_NUMBER = "TA_DA_NUMBER"
    TRAVEL_PLANNING = "TRAVEL_PLANNING"
    GRATUITY_FORM_NUMBER = "GRATUITY_FORM_NUMBER"
    OT_PAYROLL_NUMBER = "OT_PAYROLL_NUMBER"
    EXPENSE_CLAIM_CATEGORY_CODE = "EXPENSE_CLAIM_CATEGORY_CODE"
    EXPENSE_CLAIM_NUMBER = "EXPENSE_CLAIM_NUMBER"
    PETTY_CASH_FUND_NUMBER = "PETTY_CASH_FUND_NUMBER"

    # SALES
    SALES_INQUIRY_NUMBERING = 'SALES_INQUIRY_NUMBERING'
    OPPORTUNITY_NUMBERING = 'OPPORTUNITY_NUMBERING'
    SALES_QUOTATION_NUMBER = 'SALES_QUOTATION_NUMBER'
    ORDER_ACCEPTANCE_NUMBERING = "ORDER_ACCEPTANCE_NUMBERING"
    FPO_NUMBERING = "FPO_NUMBERING"
    SALES_ORDER_COSTING = "SALES_ORDER_COSTING"

    # INVENTORY
    MATERIAL_REQUEST_NUMBERING = 'MATERIAL_REQUEST_NUMBERING'
    MATERIAL_ISSUE_NUMBER = 'MATERIAL_ISSUE_NUMBER'
    MATERIAL_RETURN_NUMBER = 'MATERIAL_RETURN_NUMBER'
    SHIPMENT_NUMBER = 'SHIPMENT_NUMBER'
    PACKING_LIST_NUMBER = 'PACKING_LIST_NUMBER'

    # PURCHASE
    PURCHASE_REQUEST_NUMBERING = 'PURCHASE_REQUEST_NUMBERING'
    PURCHASE_INQUIRY_NUMBERING = 'PURCHASE_INQUIRY_NUMBERING'
    RFQ_NUMBERING = 'RFQ_NUMBERING'
    WORK_ORDER_NUMBERING = "WORK_ORDER_NUMBERING"
    FIXED_ASSET_NUMBERING = "FIXED_ASSET_NUMBERING"
    PURCHASE_ORDER_NUMBERING = "PURCHASE_ORDER_NUMBERING"
    DELIVERY_CHALLAN_NUMBERING = "DELIVERY_CHALLAN_NUMBERING"
    DC_WORK_ORDER_NUMBERING = "DC_WORK_ORDER_NUMBERING"
    GRN_CODE = "GRN_CODE"
    GENERAL_PO_NUMBERING = "GENERAL_PO_NUMBERING"

    # Service
    SERVICE_INQUIRY_NUMBERING = 'SERVICE_INQUIRY_NUMBERING'
    SERVICE_ORDER_PROFILE_NUMBER = 'SERVICE_ORDER_PROFILE_NUMBER'
    SERVICE_QUOTATION_NUMBERING = 'SERVICE_QUOTATION_NUMBERING'
    CALL_ID_NUMBERING = 'CALL_ID_NUMBERING'
    ASSIGN_ID_NUMBERING = 'ASSIGN_ID_NUMBERING'
    SELF_SERVICE_ASSIGN_ID_NUMBERING = 'SELF_SERVICE_ASSIGN_ID_NUMBERING'

    # Invoice
    PROFORMA_INVOICE_NUMBERING = 'PROFORMA_INVOICE_NUMBERING'
    INVOICE_NUMBERING = 'INVOICE_NUMBERING'
    INVOICE_SERVICE_NUMBERING = 'INVOICE_SERVICE_NUMBERING'
    LEDGER_NUMBERING = 'LEDGER_NUMBERING'
    EXPENSE_NUMBERING = 'EXPENSE_NUMBERING'
    CREDIT_NOTE_NUMBERING = 'CREDIT_NOTE_NUMBERING'
    DEBIT_NOTE_NUMBERING = 'DEBIT_NOTE_NUMBERING'
    JOURNAL_CODE_NUMBERING = 'JOURNAL_CODE_NUMBERING'
    EXCHANGE_GL_JV_NUMBERING = 'EXCHANGE_GL_JV_NUMBERING'

    # VOUCHERS
    INWARD_PAYMENT_NUMBERING = 'INWARD_PAYMENT_NUMBERING'
    OUTWARD_PAYMENT_NUMBERING = 'OUTWARD_PAYMENT_NUMBERING'
    CASH_OUTWARD_PAYMENT_NUMBERING = 'CASH_OUTWARD_PAYMENT_NUMBERING'
    CASH_INWARD_PAYMENT_NUMBERING = 'CASH_INWARD_PAYMENT_NUMBERING'
    CONTRA_NUMBERING = 'CONTRA_NUMBERING'
    BILL_WISE_ORDER_NUMBERING = 'BILL_WISE_ORDER_NUMBERING'
    PURCHASE_VOUCHER_NUMBERING = 'PURCHASE_VOUCHER_NUMBERING'
    SUPPLIER_PROFORMA_INVOICE_NUMBERING = 'SUPPLIER_PROFORMA_INVOICE_NUMBERING'
    TTFORMNUMBERING = 'TT_FORM_NUMBERING'
    SALES_VOUCHER_NUMBERING='SALES_VOUCHER_NUMBERING'
    TREASURY_RECEIPT_NUMBERING = 'TREASURY_RECEIPT_NUMBERING'

    GLOBAL_NUMBERING = 'GLOBAL_NUMBERING'



class InvoiceTypeConstants(Enum):
    SALES_INVOICE = 'Sales Invoice'
    COMMISSION_INVOICE = 'Commission Invoice'
    SERVICE_INVOICE = 'Service Invoice'
    AMC_INVOICE = 'AMC Invoice'
    DIRECT = 'Direct'
    Proforma_Invoice = 'Proforma Invoice'
    Order_Acceptance = 'Order Acceptance'


class MessageTypeConstants(Enum):
    SMS = 'SMS'
    WHATSAPP = 'WHATSAPP'


class ServiceProviderConstants(Enum):
    TWILIO = 'twilio'
    FAST2SMS = 'fast2sms'


class SMSTypeConstants(Enum):
    SMS = 'SMS'
    OTP = 'OTP'


class ApprovalConstants(Enum):
    NOT_APPROVED = 'Not Approved'
    APPROVED = 'Approved'
    PENDING_APPROVAL = 'Pending Approval'
    REJECTED = 'Rejected'
    CANCELLED = 'Cancelled'



# EDITOR TEMPLATE CONSTANTS
class EditorTypeConstants(Enum):
    SERVICE_QUOTATION = 'Service Quotation'
    SALES_QUOTATION = 'Sales Quotation'
    CAREER_LETTER = 'Career Letter'


class ItemTypeConstants(Enum):
    PRODUCT = 'Product'
    ASSET = 'Asset'
    
    
class ProductTypeConstants(Enum):
    MACHINES = 'Machines'
    SPARES = 'Spares'
    SERVICES = 'Services'


class StatusConstants(Enum):
    OPEN = 'Open'
    PARTIAL = 'Partial'
    CLOSED = 'Closed'
    CANCELLED = 'Cancelled'
    SEMICLOSED = 'Semi-closed'
    DONE = 'Done'
    PENDING = 'Pending'
    COMPLETED = 'Completed'
    BLOCKED = 'Blocked'
    
    
class ProductionTypeConstants(Enum):
    FABRICATION = 'Fabrication'
    ASSEMBLY = 'Assembly'
    PAINTING_PACKING = 'Painting & Packing'
    
    
class InspectionTypeConstants(Enum):
    INSPECTION = 'Inspection'
    REINSPECTION = 'Reinspection'

class PartyTypeConstants(Enum):
    CUSTOMER = 'Customer'
    SUPPLIER = 'Supplier'
    CUSTOMER_AND_SUPPLIER = 'Customer and Supplier'
    Trustee = 'Trustee'

class ModeofJournalConstants(Enum):
    GENERAL_JV = 'General JV'
    SETTLEMENT_JV = 'Settlement JV'
    EXCHANGE_JV = 'Exchange JV'

class ModeofExpenseConstants(Enum):
    GENERAL_EXPENSE = 'General Expense'
    BILL_EXPENSE = 'Bill Expense'

class VchTypeConstants(Enum):
    LEDGER = 'Ledger'
    PURCHASE = 'Purchase'
    SALES = 'Sales'
    EXPENSE = 'Expense'
    RECEIPT = 'Receipt'
    PAYMENT = 'Payment'
    CONTRA = 'Contra'
    CREDIT_NOTE = 'Credit Note'
    DEBIT_NOTE = 'Debit Note'
    JOURNAL = 'Journal'
    BRS = 'BRS'
    OPENING_BRS = 'Opening BRS'


# System Group Access Excluded App labels
EXCLUDED_APP_LABELS = ['admin', 'tenant', 'customdblogger', 'contenttypes', 'sessions', 'sequences', 'tally_sync',
                       'notifications', 'einvoice', 'design','production', 'forex', 'inventory', 'print_management',
    'hrm_main','django_apscheduler', 'license', 'branch', 'reportengine']

# Models whose permission must stay assignable in System Group Access even though their
# whole app is excluded above (see PermissionViewSet.filter_content_types). Pair with a
# MODEL_REMAP entry below to file the box under a different tab instead of giving the
# excluded app its own tab back.
INCLUDED_MODELS_OVERRIDE = {
    "reportengine.reportenginemodel",
}

# Single source of truth for which forms get Export/Print permissions in System Group
# Access - add a "app_label.model": {"export": bool, "print": bool} entry here to add a
# new form; a post_migrate signal (security/signals/print_export_permissions_signals.py)
# creates the matching `custom_export_<model>`/`custom_print_<model>` Permission rows
# automatically on the next `migrate`, no per-model migration needed. Only add a model
# once its form actually has a live Export/Print feature to gate - see the sales entries
# for the reference pilot (Sales Order/Sales Order Costing only have Export live today;
# Print is listed too so the checkbox is ready once that feature is added there).
PRINT_EXPORT_MODELS = {
    "sales.salesquotation": {"export": True, "print": True},
    "sales.orderacceptance": {"export": True, "print": True},
    "sales.salesordercosting": {"export": True, "print": True},

    # Master
    "master.unitmaster": {"export": True, "print": False},
    "master.categorymaster": {"export": True, "print": False},
    "master.subcategorymaster": {"export": True, "print": False},
    "hrm_master.department": {"export": True, "print": False},
    "hrm_master.designation": {"export": True, "print": False},
    "hrm_master.employeemaster": {"export": True, "print": False},
    "master.partymaster": {"export": True, "print": False},
    "master.trusteemaster": {"export": True, "print": False},
    "master.productmaster": {"export": True, "print": False},
    "master.interbranchtransfer": {"export": True, "print": False},
    "master.termsconditions": {"export": True, "print": False},
    "master.bankdetailsform": {"export": True, "print": True},

    # Purchase / Treasury
    "purchase.purchaseorder": {"export": True, "print": True},
    "purchase.supplierproformainvoice": {"export": True, "print": False},
    "purchase.grn": {"export": True, "print": False},
    "purchase.shipmentform": {"export": True, "print": False},
    "purchase.ttform": {"export": True, "print": True},
    "purchase.treasuryreceipt": {"export": True, "print": False},

    # CPI, Invoice & PL Issuance (Finance)
    "finance.proformainvoice": {"export": True, "print": True},
    "finance.invoice": {"export": True, "print": True},
    "finance.packinglistform": {"export": True, "print": True},

    # Accounting
    "account.tallysyncgroups": {"export": True, "print": False},
    "account.tallyledger": {"export": True, "print": False},
    "account.purchasevoucher": {"export": True, "print": False},
    "account.salesvoucher": {"export": True, "print": False},
    "account.inwardpayment": {"export": True, "print": False},
    "account.outwardpayment": {"export": True, "print": False},
    "account.creditnote": {"export": True, "print": False},
    "account.debitnote": {"export": True, "print": False},
    "account.expenseentry": {"export": True, "print": False},
    "account.contra": {"export": True, "print": False},
    "account.journalentry": {"export": True, "print": False},
    "account.brs": {"export": True, "print": False},

    # Accounting Report / Consolidated Accounting Report - these already exist as
    # view-only marker models (see account/models.py); Export here covers each report's
    # Excel/PDF download buttons (a custom mechanism per report page, not the shared
    # table-filter component - Day Book is the one exception that does use it). No entry
    # gets "print": True - the only print-looking icons found are actually mislabeled PDF
    # export buttons, not real print. Stock Summary / Stock Item History have no
    # export or print mechanism at all, so they're intentionally left out entirely.
    "account.chartofaccountsreportaccess": {"export": True, "print": False},
    "account.accountreportsheetaccess": {"export": True, "print": False},
    "account.brsreportsheetaccess": {"export": True, "print": False},
    "account.daybookreportaccess": {"export": True, "print": False},
    "account.trialbalancereportaccess": {"export": True, "print": False},
    "account.profitlossreportaccess": {"export": True, "print": False},
    "account.balancesheetreportaccess": {"export": True, "print": False},
    "account.exchangegainlossreportaccess": {"export": True, "print": False},
    "account.consolidatedbranchwiseledgersummaryreportaccess": {"export": True, "print": False},
    "account.consolidatedaccountreportsheetaccess": {"export": True, "print": False},
    "account.consolidateddaybookreportaccess": {"export": True, "print": False},
    "account.consolidatedtrialbalancereportaccess": {"export": True, "print": False},
    "account.consolidatedprofitlossreportaccess": {"export": True, "print": False},
    "account.consolidatedbalancesheetreportaccess": {"export": True, "print": False},
    "account.consolidatedbranchwisestockreportaccess": {"export": True, "print": False},
}

MANUAL_APPS = [
    {
        "app_label": "inventory",
        "models": [
            "inventory.grn",
            "inventory.deliverychall",
            "inventory.shipmentform",
        ]
    }
]


# ----- 1. Unwanted models -----
UNWANTED_MODELS = {
"account.exchangegainloss",
"account.expenseentrydetails",
"account.expenseentrybillwisedetails",
"account.inwardpaymentbillwisedetails",
"account.inwardpaymentdetails",
"account.inwardpaymentdetailsbillwisedetails",
"account.journalentrybillwisedetails",
"account.journalentryledgerdetails",
"account.journalentryledgerdetailsbillwisedetails",
"account.ledgerbillwisedetails",
"account.outwardpaymentbillwisedetails",
"account.outwardpaymentdetails",
"account.outwardpaymentdetailsbillwisedetails",
"account.outwardpaymentmultipleledgerbillwisedetails",
"account.outwardpaymentmultipleledgerdetails",
"account.proformainvoicedetails",
"account.proformainvoicepocdetails",
"account.proformainvoiceserialnumber",
"account.proformainvoicesubproduct",
"account.proformainvoicetermsandcondition",
"account.purchasevoucherbillwisedetails",
"account.purchasevoucherdetails",
"account.salesvoucherbillwisedetails",
"account.salesvoucherdetails",
"account.tallybillwisedetails",
"account.tallydaybook",
"account.tallyledgerdetails",
"account.trackbillwisedetails",
"account.creditnotedetails",
"account.debitnotebillwisedetails",
"account.debitnotedetails",
"account.invoicebillwisedetails",
"account.contradetails",
"account.creditnotebillwisedetails",
"account.creditnotebillwisedetails",
"account.creditnotedetails",
"account.ledgervariant",
"account.postingpreviewmaster",

"master.bankdetails",

"master.appsettings",
"master.bankdetailsformapprovalstages",
"master.categorymasterdetails",
"master.contactdetail",
"master.editor",
"hrm_master.employeedocumentsdetails",
"master.employeenomineedetails",
"master.globalmaster",
"hrm_master.grade",
"master.grademaster",
"hrm_master.holidaymaster",
"hrm_master.leavedetails",
"hrm_master.leaveentry",
"hrm_master.leavemaster",
"hrm_master.leavemasterdetails",
"master.licdetails",
"master.machinemaster",
"master.machinemasterdetails",
"master.managingcentermaster",
"master.partyfileupload",
"hrm_master.previousemploymentdetails",
"master.processmaster",
"master.productdetails",
"master.productmasterdetails",
"master.productmasterfileupload",
"master.productmasterinquiry",
"hrm_master.professionaltaxslab",
"master.projectdetails",
"master.projectmaster",
"master.serialnumber",
"hrm_master.shifttimings",
"master.unitmasterdetails",
"master.subprocessmaster",
"master.shiptoaddress",
"master.remarksdetails",
"master.productvariant",
"master.bankdetailsfileupload",
"master.interbranchtransferdetails",
"master.interbranchtransfertrack",

"sales.contactregister",
"sales.orderacceptancedetails",
"sales.orderacceptanceinvoice",
"sales.orderacceptancepaymentterms",
"sales.orderacceptancesparedetails",
"sales.orderacceptancetermsandcondition",
"sales.orderofacceptancebank",
"sales.orderofacceptancefileupload",
"sales.orderofacceptancespecification",
"sales.packingshippingitem",
"sales.pocdetail",
"sales.quotationtermsandcondition",
"sales.salesinquiry",
"sales.salesquotationdetails",
"sales.salesquotationfollowdetails",
"sales.salesquotationpaymentterms",
"sales.salesquotationstages",
"sales.inquiryproductdetails",
"sales.inquiryfollowupdetails",
"sales.salesquotationfileupload",
"sales.basesalesordercostingdetails",
"sales.salesordercostingdetails",
"sales.salesordercostingfileupload",
"sales.salesordercostingcombineddetails",
"sales.inclusionexclusion",
"sales.oacontactdetails",
"sales.packingmaster",
"purchase.deliverychallan",
"purchase.deliverychallandetails",
"purchase.deliverychallantermsandcondition",
"purchase.grnapprovalstages",
"purchase.grnbillwisedetails",
"purchase.grndetails",
"purchase.grnfileupload",
"purchase.grnserialnumber",
"purchase.grntermsandcondition",
"purchase.inquirytechnicalspecificationfiles",
"purchase.inquiryvendorfiles",
"purchase.purchaseinquiry",
"purchase.purchaseinquirydetails",
"purchase.purchaseinquiryvendordetails",
"purchase.purchaseorderapprovalstages",
"purchase.purchaseorderdetails",
"purchase.purchaseorderfileupload",
"purchase.purchaseordertermsandcondition",
"purchase.purchaserequest",
"purchase.purchaserequestdetails",
"purchase.shipmentformtermsconditions",
"purchase.shipmentformdetails",
"purchase.supplierproformainvoicedetails",
"purchase.supplierproformainvoicefileupload",
"purchase.supplierproformainvoicetermsandcondition",
"purchase.workorderdetails",
"purchase.ttformdetails",
"purchase.ttformfileupload",
"purchase.shipmentfileupload",
"purchase.treasuryrecieptfileupload",
"finance.packinglistdetails",
"finance.packinglisttermsconditions",
"finance.proformainvoiceapprovalstages",
"finance.proformainvoicedetails",
"finance.proformainvoicepocdetails",
"finance.proformainvoiceserialnumber",
"finance.proformainvoicesubproduct",
"finance.proformainvoicetermsandcondition",
"finance.invoiceapprovalstages",
"finance.invoicebillwisedetails",
"finance.invoicedetails",
"finance.invoicepocdetails",
"finance.invoiceserialnumber",
"finance.invoicesubproduct",
"finance.invoicetermsandcondition",
"branch.branchaddress",
"branch.branchbankdetails",
"branch.branchuser",
"branch.branchworkingdays",

}

# ----- 2. Model Remap Definition -----
MODEL_REMAP = {
    "master.formsettings": {
        "app_label": "security",
        "model": "App key settings"
    },
    "reportengine.reportenginemodel": {
        "app_label": "security",
        "model": "Report Menu Access"
    },
    "sales.salesquotation": {
        "app_label": "sales",
        "model": "Forecast Sales Order"
    },
"sales.orderacceptance": {
        "app_label": "sales",
        "model": "Sales Order"
    },
"sales.salesordercosting": {
        "app_label": "sales",
        "model": "Sales Order Costing"
    },
"account.outwardpayment": {
        "app_label": "account",
        "model": "Payment"
    },
"account.inwardpayment": {
        "app_label": "account",
        "model": "Receipt"
    },
"account.tallyledger": {
        "app_label": "account",
        "model": "Ledger"
    },
"account.purchasevoucher": {
        "app_label": "account",
        "model": "Purchase Voucher"
    },
"account.salesvoucher": {
        "app_label": "account",
        "model": "Sales Voucher"
    },
"account.creditnote": {
        "app_label": "account",
        "model": "Credit Note"
    },
"account.debitnote": {
        "app_label": "account",
        "model": "Debit Note"
    },
"account.expenseentry": {
        "app_label": "account",
        "model": "Expense Entry"
    },
"account.contra": {
        "app_label": "account",
        "model": "Contra Entry"
    },
"account.journalentry": {
        "app_label": "account",
        "model": "Journal Entry"
    },
"account.brs": {
        "app_label": "account",
        "model": "Opening BRS Entry"
    },
    "purchase.ttform": {
        "app_label": "treasury",
        "model": "Bank Details TT & Payment"
    },
    "purchase.treasuryreceipt": {
        "app_label": "treasury",
        "model": "Treasury Receipt"
    },
"purchase.purchaseorder": {
        "app_label": "purchase",
        "model": "Purchase Order (OTS)"
    },
"purchase.supplierproformainvoice": {
        "app_label": "purchase",
        "model": "Supplier Proforma Invoice"
    },
"purchase.shipmentform": {
        "app_label": "purchase",
        "model": "Shipment"
    },
"master.bankdetailsform": {
        "app_label": "purchase",
        "model": "Bank Details Form"
    },
"master.unitmaster": {
        "app_label": "master",
        "model": "UOM"
    },
"master.categorymaster": {
        "app_label": "master",
        "model": "Category Master"
    },
"master.subcategorymaster": {
        "app_label": "master",
        "model": "Sub Category Master"
    },
"hrm_master.employeemaster": {
        "app_label": "master",
        "model": "Employee"
    },
"master.trusteemaster": {
        "app_label": "master",
        "model": "Trustee Master"
    },
"master.productmaster": {
        "app_label": "master",
        "model": "Product Master"
    },
"master.interbranchtransfer": {
        "app_label": "master",
        "model": "Inter Branch Transfer Form"
    },
"master.termsconditions": {
        "app_label": "master",
        "model": "Terms & Conditions"
    },
"master.partymaster": {
        "app_label": "master",
        "model": "Customer Master / Supplier Master"
    },
"account.chartofaccountsreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Chart of Accounts"
    },
"account.accountreportsheetaccess": {
        "app_label": "__accounting_report__",
        "model": "Account Report Sheet"
    },
"account.brsreportsheetaccess": {
        "app_label": "__accounting_report__",
        "model": "BRS Report Sheet"
    },
"account.daybookreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Day Book"
    },
"account.trialbalancereportaccess": {
        "app_label": "__accounting_report__",
        "model": "Trial Balance Report"
    },
"account.profitlossreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Profit & Loss A/c Report"
    },
"account.balancesheetreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Balance Sheet"
    },
"account.exchangegainlossreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Exchange Gain / Loss Report"
    },
"account.stocksummaryreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Stock Summary"
    },
"account.stockitemhistoryreportaccess": {
        "app_label": "__accounting_report__",
        "model": "Stock Item History Report"
    },
"account.consolidatedbranchwiseledgersummaryreportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Branch Wise Ledger Summary Report"
    },
"account.consolidatedaccountreportsheetaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Account Report Sheet"
    },
"account.consolidateddaybookreportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Day Book"
    },
"account.consolidatedtrialbalancereportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Trial Balance Report"
    },
"account.consolidatedprofitlossreportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Profit & Loss A/c Report"
    },
"account.consolidatedbalancesheetreportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Balance Sheet"
    },
"account.consolidatedbranchwisestockreportaccess": {
        "app_label": "__consolidated_accounting_report__",
        "model": "Branch Wise Stock Report"
    },
}

# ----- 3. Model Order Definition -----
# Position of each model's box within its tab in System Group Access, mirroring the order
# menu-list.component.ts lists the equivalent sidebar item under that section. Keyed by the
# real (pre-remap) "app_label.model", same convention as MODEL_REMAP above. Only tabs where
# box order needs to be pinned are listed here; any model without an entry keeps the
# previous alphabetical-by-name fallback (see PermissionViewSet.get_permission_list).
MODEL_ORDER = {
    # Master tab
    "master.unitmaster": 1,
    "master.categorymaster": 2,
    "master.subcategorymaster": 3,
    "hrm_master.department": 4,
    "hrm_master.designation": 5,
    "hrm_master.employeemaster": 6,
    "master.partymaster": 7,
    "master.trusteemaster": 8,
    "master.productmaster": 9,
    "master.interbranchtransfer": 10,
    "master.termsconditions": 11,

    # Accounting tab
    "account.tallysyncgroups": 1,
    "account.tallyledger": 2,
    "account.purchasevoucher": 3,
    "account.salesvoucher": 4,
    "account.inwardpayment": 5,
    "account.outwardpayment": 6,
    "account.creditnote": 7,
    "account.debitnote": 8,
    "account.expenseentry": 9,
    "account.contra": 10,
    "account.journalentry": 11,
    "account.brs": 12,

    # Accounting Report tab
    "account.chartofaccountsreportaccess": 1,
    "account.accountreportsheetaccess": 2,
    "account.brsreportsheetaccess": 3,
    "account.daybookreportaccess": 4,
    "account.trialbalancereportaccess": 5,
    "account.profitlossreportaccess": 6,
    "account.balancesheetreportaccess": 7,
    "account.exchangegainlossreportaccess": 8,
    "account.stocksummaryreportaccess": 9,
    "account.stockitemhistoryreportaccess": 10,

    # Consolidated Accounting Report tab
    "account.consolidatedbranchwiseledgersummaryreportaccess": 1,
    "account.consolidatedaccountreportsheetaccess": 2,
    "account.consolidateddaybookreportaccess": 3,
    "account.consolidatedtrialbalancereportaccess": 4,
    "account.consolidatedprofitlossreportaccess": 5,
    "account.consolidatedbalancesheetreportaccess": 6,
    "account.consolidatedbranchwisestockreportaccess": 7,
}
