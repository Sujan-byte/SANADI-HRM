from enum import Enum

class SerializerEnum(Enum):
    # Branch Enum
    BRANCH_SERIALIZER = "branch.api.serializers.BranchSerializer"
    BRANCH_ADDRESS_SERIALIZER="branch.api.serializers.BranchAddressSerializer"
    # purchase
    GRN_SERIALIZER = "purchase.api.serializers.GRNSerializer"
    PURCHASE_ORDER_SERIALIZER = "purchase.api.serializers.PurchaseOrderSerializer"
    #sales
    ORDER_ACCEPTANCE_SERIALIZER = "sales.api.serializers.OrderAcceptanceSerializer"

    # finance
    INVOICE_SERIALIZER = "finance.api.serializers.InvoiceSerializer"
    PROFORMA_INVOICE_SERIALIZER = "finance.api.serializers.ProformaInvoiceSerializer"


    # add more serializers here...

    def __call__(self, *args, **kwargs):
        module_name, class_name = self.value.rsplit(".", 1)
        module = __import__(module_name, fromlist=[class_name])
        serializer_class = getattr(module, class_name)
        return serializer_class(*args, **kwargs)