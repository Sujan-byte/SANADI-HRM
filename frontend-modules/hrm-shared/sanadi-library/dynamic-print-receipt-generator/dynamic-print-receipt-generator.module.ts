import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReceiptFieldBuilderComponent } from './components/receipt-field-builder/receipt-field-builder.component';
import { ReceiptBuilderComponent } from './components/receipt-builder/receipt-builder.component';
import { NgxPrintModule } from 'ngx-print';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialLibModuleModule } from '../../material-lib-module/material-lib-module.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '../flex-layout/module';
import { SalesQuotationPrintComponent } from './print-components/sales-quotation-print/sales-quotation-print.component';
import { SalesOrderProfilePrintComponent } from './print-components/sales-order-profile-print/sales-order-profile-print.component';
import { ServiceQuotationPrintComponent } from './print-components/service-quotation-print/service-quotation-print.component';
import { ServiceOrderProfilePrintComponent } from './print-components/service-order-profile-print/service-order-profile-print.component';
import { InvoicePrintComponent } from './print-components/invoice-print/invoice-print.component';
import { PurchaseOrderPrintComponent } from './print-components/purchase-order-print/purchase-order-print.component';
import { DeliveryChallenPrintComponent } from './print-components/delivery-challen-print/delivery-challen-print.component';
import { CareerLetterPrintComponent } from './print-components/career-letter-print/career-letter-print.component';
import { GrnPrintComponent } from "./print-components/grn-print/grn-print.component";
import { ProformaInvoicePrintComponent } from "./print-components/proforma-invoice-print/proforma-invoice-print.component";
import { EwayBillPrintComponent } from './print-components/eway-bill-print/eway-bill-print.component';
import { DebitNotePrintComponent } from './print-components/debit-note-print/debit-note-print.component';
import { CreditNotePrintComponent } from './print-components/credit-note-print/credit-note-print.component';
import { BankDetailsPrintComponent } from "./print-components/bank-details-print/bank-details-print.component";
import { TtFormPrintComponent } from './print-components/tt-form-print/tt-form-print.component';
import { PackingListPrintComponent } from './print-components/packing-list-print/packing-list-print.component';
import { ShipmentDetailsPrintComponent } from './print-components/shipment-details-print/shipment-details-print.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';




@NgModule({
  declarations: [
    ReceiptFieldBuilderComponent,
    ReceiptBuilderComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    NgxPrintModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialLibModuleModule,
    SalesQuotationPrintComponent,
    SalesOrderProfilePrintComponent,
    ServiceQuotationPrintComponent,
    ServiceOrderProfilePrintComponent,
    InvoicePrintComponent,
    PurchaseOrderPrintComponent,
    DeliveryChallenPrintComponent,
    CareerLetterPrintComponent,
    GrnPrintComponent,
    ProformaInvoicePrintComponent,
    EwayBillPrintComponent,
    DebitNotePrintComponent,
    CreditNotePrintComponent,
    BankDetailsPrintComponent,
    TtFormPrintComponent,
    PackingListPrintComponent,
    ShipmentDetailsPrintComponent,
    NgxExtendedPdfViewerModule
  
],
  exports: [
    ReceiptBuilderComponent,
    ReceiptFieldBuilderComponent,
  ],
  providers: [
    DecimalPipe,
  ]
})
export class DynamicPrintReceiptGeneratorModule { }
