import { CommonModule, DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from 'src/app/core/services/api.service';
import { SalesQuotationEnums } from 'src/app/modules/hrm-shared/core/shared/common/enum/sales-enum/sales-quotation-enum';
import { BranchBankDetailsModel, BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { SalesQuotationDetailsModel, SalesQuotationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/sales/sales-quotation.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { foreignOrDomestic } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';

@Component({
  selector: 'sanadi-sales-quotation-print',
  standalone: true,
  imports: [
    CommonModule,
    NgForOf,
    NgIf,
    DatePipe
  ],
  templateUrl: './sales-quotation-print.component.html',
  styleUrls: ['./sales-quotation-print.component.scss']
})
export class SalesQuotationPrintComponent {
  @Input() field: any = {};
  @Input() selectedColorClass: string = 'theme-blue';
  
  salesquotationObj: SalesQuotationModel; // Keep this as the main variable name
  companyLogo: any;
  amountInWords: any;
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
  branchBank: BranchBankDetailsModel;
  companyName: string;
  selectCustomerObject: any;
  removedHsnDuplicateInArray: any[];
  isForeign: boolean = false;
  
  private readonly apiService = inject(ApiService);
  private secureStorage = inject(EncryptedStorageService);

  constructor(
    public sanitizer: DomSanitizer, 
    private _decimalPipe: DecimalPipe
  ) { }

  async ngOnInit(): Promise<void> {
    this.branch_id = await this.secureStorage.getItem('b_id');
    let branchObj: BranchModel = await this.getBranchByID(this.branch_id);
    this.isForeign = foreignOrDomestic() === 'FOREIGN';

    this.branchObj = branchObj;
    this.salesquotationObj = this.field.value; // Fixed: assign to salesquotationObj
    
    this.registeredAddress = this.branchObj?.registered_address || '';
    this.companyLogo = this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email = this.branchObj?.email || '';
    // this.faxNumber = this.branchObj?.fax_number || '';
    this.gstNo = this.branchObj?.gst_no || '';
    this.stateName = this.branchObj?.state_name || '';
    this.cinNo = this.branchObj?.cin_no || '';
    // this.website = this.branchObj?.website || '';
    this.stateCode = this.branchObj?.state_code || '';
    
    this.branchBank = this.branchObj?.branch_bank_details?.length 
      ? this.branchObj?.branch_bank_details[0] 
      : {};
    
    if (this.gstNo && this.gstNo.length >= 15) {
      this.companyPan = this.gstNo.slice(2, 12);
    }

    // Calculate tax amounts
    // if (this.isForeign) {
    //   this.totalTaxAmount = Number((this.salesquotationObj?.vat || 0).toFixed(2)); // Fixed
    // } else {
    //   if (Number(this.salesquotationObj?.igst) != 0) { // Fixed
    //     this.totalTaxAmount = Number((this.salesquotationObj?.igst).toFixed(2)); // Fixed
    //   } else {
    //     this.totalTaxAmount = Number(this.salesquotationObj?.cgst || 0) + Number((this.salesquotationObj?.sgst || 0).toFixed(2)); // Fixed
    //   }
    // }

    // Generate amount in words
    if (this.salesquotationObj?.grand_total) { // Fixed
      this.amountInWords = this.amountInWord(Math?.round(this.salesquotationObj.grand_total || 0)); // Fixed
    }
  }

  // Check if quotation has discount
  hasDiscount(): boolean {
    return this.salesquotationObj?.sales_quotation_details?.some(item => item.discount_amount > 0); // Fixed
  }

  // Check if quotation has tax
  hasTaxValue(): boolean {
    return this.salesquotationObj?.sales_quotation_details?.some(item => item.tax > 0); // Fixed
  }

  // Check if quotation has IGST
  hasIgst(): boolean {
    return Number(this.salesquotationObj?.igst) > 0; // Fixed
  }

  // Calculate total taxable amount
  calculateTaxableTotal(): number {
    return this.salesquotationObj?.sales_quotation_details?.reduce( // Fixed
      (sum, item) => sum + (item.taxable_amount || 0),
      0
    ) || 0;
  }

  // Calculate total discount
  calculateDiscountTotal(): number {
    return this.salesquotationObj?.sales_quotation_details?.reduce( // Fixed
      (sum, item) => sum + (item.discount_amount || 0),
      0
    ) || 0;
  }

  // Calculate total tax
  calculateTaxTotal(): number {
    return this.salesquotationObj?.sales_quotation_details?.reduce( // Fixed
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }

  // Calculate grand total from items
  grandTotalValue(): number {
    if (!this.salesquotationObj?.sales_quotation_details?.length) { // Fixed
      return 0;
    }
    return this.salesquotationObj.sales_quotation_details.reduce((sum, item) => { // Fixed
      const totalAmount = item?.taxable_amount || 0;
      const taxValue = item?.tax_value || 0;
      return sum + (totalAmount + taxValue);
    }, 0);
  }

  // Calculate final price total (rate * quantity)
  calculateFinalPriceTotal(): number {
    return this.salesquotationObj?.sales_quotation_details?.reduce( // Fixed
      (sum, item) => sum + ((item?.unit_price || 0) * (item?.quantity || 0)),
      0
    ) || 0;
  }

  // Calculate total quantity
  calculateTotalQty(): number {
    return this.salesquotationObj?.sales_quotation_details?.reduce( // Fixed
      (sum, item) => sum + (item.quantity || 0),
      0
    ) || 0;
  }

  // Calculate colspan for table
  calculateColspan(): number {
    let colspan = 10;
    if ((this.hasDiscount() == true && this.hasTaxValue() == false) || 
        (this.hasTaxValue() == true && this.hasDiscount() == false)) {
      colspan = 8;
    }
    else if (this.hasTaxValue() == true && this.hasDiscount() == true) {
      colspan = 10;
    }
    else if (this.hasTaxValue() == false && this.hasDiscount() == false) {
      colspan = 5;
    }
    return colspan;
  }

  // Generate amount in words
  amountInWord(number: any) {
    if (number < 0) return false;

    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const currency = this.salesquotationObj?.currency || 'AED'; // Fixed
    
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

  // Format address textarea
  getTextarea(desc: any) {
    if (!desc) return [];
    desc = desc?.replace(/\\n/g, '\n');
    return desc.split('\n');
  }

  // Get empty rows for pagination
  getEmptyRows(): any[] {
    const itemCount = this.salesquotationObj?.sales_quotation_details?.length || 0; // Fixed
    const maxRowsPerPage = 15;
    const emptyRows = Math.max(0, maxRowsPerPage - itemCount);
    return new Array(emptyRows).fill(0);
  }

  // Get branch details
  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`)?.toPromise();
  }

  // Convert decimal for display
  transformDecimal(num) {
    return num ? this._decimalPipe.transform(num, '1.2-2') : "0.00";
  }

  // Extract name from data
  extractName(data) {
    const match = data?.match(/^([^\(]+)\(/);
    return match ? match[1].trim() : data || '';
  }

  // Generate column span for notes
  generateColSpanForNote() {
    let count: number = 0;
    let object = { 
      discount: this.salesquotationObj?.discount, // Fixed
      cgst: this.salesquotationObj?.cgst, // Fixed
      igst: this.salesquotationObj?.igst // Fixed
    };
    
    Object.keys(object).forEach((ele: any) => {
      if (ele === SalesQuotationEnums.discount && object[ele]) 
        count++;
      else if ([SalesQuotationEnums.cgst, SalesQuotationEnums.igst].includes(ele) && object[ele]) {
        count++;
      }
    });
    
    return 5 + count;
  }

  // Process address for display
  processAddress(address: string): string {
    if (address) {
      const addressLines = address.split(/[\n]/);
      return addressLines.join('<br>');
    }
    return '';
  }

  // Get currency - helper method
  getCurrency(): string {
    return this.salesquotationObj?.currency || 'AED'; // Fixed
  }
}