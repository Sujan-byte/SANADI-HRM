import { CommonModule, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { InvoiceModel } from 'src/app/modules/hrm-shared/core/shared/common/model/finance/invoice.model';
import { BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { EwayBillPrintComponent } from '../eway-bill-print/eway-bill-print.component';
import { QRCodeModule } from 'angularx-qrcode';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { foreignOrDomestic } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
@Component({
  selector: 'sanadi-invoice-print',
  standalone: true,
  imports: [NgForOf, NgIf, QRCodeModule, DatePipe, EwayBillPrintComponent, CommonModule],
  templateUrl: './invoice-print.component.html',
  styleUrl: './invoice-print.component.scss'
})
export class InvoicePrintComponent {
  @Input() field: any = {};
  @Input() selectedColorClass: string = 'theme-blue';
  
  invoiceObj: InvoiceModel;
  companyLogo: any;
  amountInWords: any;
  taxAmount: any;
  taxAmountWords: any;
  taxAmountRound: any;
  netPayWords: string;
  registeredAddress: any;
  phoneNo: any;
  email: any;
  faxNumber: string;
  website: string;
  gstNo: string;
  stateName: string;
  stateCode: any;
  cinNo: string;
  totalTaxAmount: number = 0;
  companyPan: any;
  sgstTotal: number = 0;
  cgstTotal: number = 0;
  branch_id: string;
  branchObj: BranchModel;
  private readonly apiService = inject(ApiService);
  companyName: string;
  selectCustomerObject: any;
  removedHsnDuplicateInArray: any[];
  isForeign: boolean = false;
  secureStorage = inject(EncryptedStorageService);
  async ngOnInit(): Promise<void> {
    this.branch_id = await this.secureStorage.getItem('b_id');
    let branchObj: BranchModel = await this.getBranchByID(this.branch_id);
    this.isForeign = foreignOrDomestic() === 'FOREIGN'

    this.branchObj = branchObj;

    this.registeredAddress = this.branchObj?.registered_address || ''
    this.companyLogo = this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
    // console.log("purchaseOrderObj.grand_total",this.purchaseOrderObj.grand_total)
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email = this.branchObj?.email || ''
    this.faxNumber = localStorage.getItem('faxNumber');
    this.gstNo = this.branchObj?.gst_no || '';
    this.stateName = this.branchObj?.state_name || ''

    this.cinNo = this.branchObj?.cin_no || ''
    this.website = this.branchObj?.state_name || ''
    this.stateCode = this.branchObj?.state_code || ''
    if (this.gstNo != 'undefined' && this.gstNo.length >= 15) {
      this.companyPan = this.gstNo.slice(2, 12);
    }
    this.invoiceObj = this.field.value;
    this.selectCustomerObject = this.invoiceObj?.default_select_customer_object;
    if (this.isForeign) {
      this.taxAmount = Number((this.invoiceObj.vat).toFixed(2));
    }
    else {
      if (Number(this.invoiceObj.igst) != 0) {
        this.taxAmount = Number((this.invoiceObj.igst).toFixed(2));
      }
      else {
        this.taxAmount = Number(this.invoiceObj.cgst) + Number((this.invoiceObj.sgst).toFixed(2));
      }
    }

    if (this.taxAmount > 0 || this.amountInWords) {
      this.taxAmountWords = this.amountInWord(Math?.round(this.taxAmount || 0));
      this.amountInWords = this.amountInWord(Math?.round(this.field?.value?.grand_total || 0));

    }
    if (Number(this.invoiceObj?.igst) != 0) {
      this.totalTaxAmount = Number(Number(this.invoiceObj?.igst).toFixed(2))
    } else {
      this.totalTaxAmount = Number((Number(this.invoiceObj?.cgst) + Number(this.invoiceObj?.sgst)).toFixed(2));
    }
    this.sgstTotal = this.cgstTotal = this.invoiceObj?.invoice_details.reduce((acc, item) => {
      return acc + Number((item?.tax_value / 2).toFixed(2));
    }, 0);
  }

  getInvoiceDetailsMode() {
    const groupedTotals: any = {};

    this.invoiceObj.invoice_details.forEach(ele => {
      const key = `${ele.hsn}_${ele.tax}`;

      if (!groupedTotals[key]) {
        groupedTotals[key] = {
          hsn: ele.hsn,
          tax: ele.tax,
          taxable_amount: 0,
          tax_value: 0
        };
      }

      groupedTotals[key].taxable_amount += ele.taxable_amount || 0;
      groupedTotals[key].tax_value += ele.tax_value || 0;
    });

    this.removedHsnDuplicateInArray = Object.values(groupedTotals);

    return this.removedHsnDuplicateInArray || [];
  }

  hasDiscount(): boolean {
    return this.invoiceObj?.invoice_details.some(item => item.discount_amount > 0);
  }

  hasTaxValue(): boolean {
    return this.invoiceObj?.invoice_details.some(item => item.tax > 0);
  }

  grandTotalValue(): number {
    if (!this.invoiceObj?.invoice_details?.length) {
      return 0;
    }
    return this.invoiceObj.invoice_details.reduce((sum, item) => {
      const totalAmount = item?.taxable_amount || 0;
      // const discountAmount = item?.discount_amount || 0;
      const taxValue = item?.tax_value || 0;
      return sum + (totalAmount + taxValue);
    }, 0);
  }

  calculateColspan(): number {
    let colspan = 10;
    if ((this.hasDiscount() == true && this.hasTaxValue() == false) || (this.hasTaxValue() == true && this.hasDiscount() == false)) {
      colspan = 8;
    }
    else if (this.hasTaxValue() == true || this.hasDiscount() == true) {
      colspan = 10;
    }
    else if (this.hasTaxValue() == false || this.hasDiscount() == false) {
      colspan = 5;
    }
    return colspan;
  }

  calculatefinalPriceTotal(): number {
    return this.invoiceObj?.invoice_details.reduce(
      (sum, item) => sum + ((item?.unit_price) || 0),
      0
    ) || 0;
  }
  calculateDiscountTotal(): number {
    return this.invoiceObj?.invoice_details.reduce(
      (sum, item) => sum + ((item?.discount_amount) || 0),
      0
    ) || 0;
  }

  calculateTaxTotal(): number {
    return this.invoiceObj?.invoice_details.reduce(
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }
  amountInWord(number: any) {
    let currency = this.invoiceObj?.cpi_currency || 'AED';
    console.log("currency", number, currency);
        console.log("field", this.field,this.selectedColorClass);

    if (number < 0) return false;

    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const currencyWords: { [key: string]: { unit: string, subunit: string } } = {
      'INR': { unit: 'Rupees', subunit: 'Paisa' },
      'USD': { unit: 'Dollars', subunit: 'Cents' },
      'EUR': { unit: 'Euros', subunit: 'Cents' },
      'JPY': { unit: 'Yen', subunit: '' },
      'GBP': { unit: 'Pounds', subunit: 'Pence' },
      'HKD': { unit: 'Hong Kong Dollars', subunit: 'Cents' },
      'CHF': { unit: 'Swiss Francs', subunit: 'Rappen' },
      'SEK': { unit: 'Kronor', subunit: 'Ore' },
      'TRY': { unit: 'Lira', subunit: 'Kurus' },
      'SAR': { unit: 'Saudi Riyals', subunit: 'Halalas' },
      'AED': { unit: 'Dirhams', subunit: 'Fils' },
      'BHD': { unit: 'Bahraini Dinars', subunit: 'Fils' }
    };

    if (!currencyWords[currency]) {
      return "Currency not supported";
    }

    const { unit, subunit } = currencyWords[currency];

    if (number === 0) {
      return `Zero ${unit} and Zero ${subunit} only`;
    }

    function translate(n: number): string {
      let word = "";
      if (n < 10) {
        word = single_digit[n] + ' ';
      } else if (n < 20) {
        word = double_digit[n - 10] + ' ';
      } else if (n < 100) {
        word = below_hundred[Math?.floor(n / 10) - 2] + ' ' + translate(n % 10);
      } else if (n < 1000) {
        word = single_digit[Math?.floor(n / 100)] + ' Hundred ' + translate(n % 100);
      } else if (n < 1000000) {
        word = translate(Math?.floor(n / 1000)) + ' Thousand ' + translate(n % 1000);
      } else if (n < 1000000000) {
        word = translate(Math?.floor(n / 1000000)) + ' Million ' + translate(n % 1000000);
      } else {
        word = translate(Math?.floor(n / 1000000000)) + ' Billion ' + translate(n % 1000000000);
      }
      return word;
    }

    const [integerPart, decimalPart] = number?.toString()?.split('.');

    const integerResult = translate(parseInt(integerPart, 10));
    const decimalResult = decimalPart && parseInt(decimalPart, 10) > 0
      ? `${translate(parseInt(decimalPart, 10))} ${subunit}`
      : `Zero ${subunit}`;

    return `${integerResult.trim()} ${unit} and ${decimalResult} only`.trim();
  }

  getTextarea(desc: any) {
    desc = desc?.replace(/\\n/g, '\n');
    // console.log("desc", desc)
    return desc ? desc?.split('\n') : [];
  }

  processAddress(address: string): string {
    console.log("processAddress", address);
    if (address) {
      // Split by both comma and newline
      const addressLines = address.split(/[\n]/);
      return addressLines.join('<br>');
    }
    return '';
  }

  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`)?.toPromise();
  }

}
