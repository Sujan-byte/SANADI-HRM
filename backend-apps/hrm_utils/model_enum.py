from enum import Enum
from django.apps import apps

class ModelEnum(str, Enum):
    # Branch Import
    BRANCH = 'branch.Branch'
    BRANCH_ADDRESS = 'branch.BranchAddress'

    # Master Import
    EMPLOYEE_MASTER = 'hrm_master.EmployeeMaster'

    # Purchase Import
    GRN = 'purchase.GRN'
    PURCHASE_ORDER = 'purchase.PurchaseOrder'
    DELIVERY_CHALLAN = 'purchase.DeliveryChallan'
    DELIVERY_CHALLAN_DETAILS = 'purchase.DeliveryChallanDetails'
    BANK_DETAILS_TT = 'purchase.TTform'

    # sales
    ORDER_ACCEPTANCE_DETAILS = 'sales.OrderAcceptanceDetails'
    ORDER_ACCEPTANCE = 'sales.OrderAcceptance'
    SALES_QUOTATION = 'sales.SalesQuotation'
    SALES_ORDER_COSTING_DETAILS = 'sales.SalesOrderCostingDetails'
    SALES_ORDER_COSTING_COMBINED_DETAILS = 'sales.SalesOrderCostingCombinedDetails'

    # finance
    INVOICE = 'finance.Invoice'
    PROFORMA_INVOICE = 'finance.ProformaInvoice'
    INVOICE_DETAILS = "finance.InvoiceDetails"
    PROFORMA_INVOICE_DETAILS = 'finance.ProformaInvoiceDetails'
    PACKING_LIST = 'finance.PackingListForm'

    # Account Import
    PURCHASE_VOUCHER = 'account.PurchaseVoucher'
    TALLY_LEDGER = 'account.TallyLedger'
    TALLY_BILL_WISE_DETAILS = 'account.TallyBillWiseDetails'


    def get_model(self):
        app_label, model_name = self.value.split(".")
        return apps.get_model(app_label, model_name)

    # Magic: allow ModelEnum.objects
    @property
    def objects(self):
        return self.get_model().objects

    def __str__(self):
        return self.value

    def __repr__(self):
        return self.value
