import { GRNDetailsModel, GRNModel } from 'src/app/modules/hrm-shared/core/shared/common/model/purchase/grn.model';
import { CommonModule, DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { OAEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/sales-enum/order-acceptance.enum';
import { BranchBankDetailsModel, BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { foreignOrDomestic } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
@Component({
  selector: 'sanadi-grn-print',
  standalone: true,
  imports: [NgForOf, NgIf, CommonModule],
  templateUrl: './grn-print.component.html',
  styleUrl: './grn-print.component.scss'
})
export class GrnPrintComponent {
  @Input() field: any = {};
  @Input() selectedColorClass: string = 'theme-blue';
  companyLogo: any;
  registeredAddress: any;
  phoneNo: any;
  email: any;
  faxNumber: string;
  website: string;
  gstNo: string;
  stateName: string;
  stateCode: string;
  netPayWords: string;
  grnObj: GRNModel;
  companyName: string;
  totalTaxAmount: number = 0;
  private readonly apiService = inject(ApiService);
  grn_details: any[];
  cinNo: string;
  companyPan: string;
  branch_id: string;
  branchObj: any;
  address: string;
  state: string;
  gst: string;
  panNo: string;
default_party_object:any;


  private secureStorage = inject(EncryptedStorageService);
  isForeign: boolean;
  branchBank: any;

  constructor(
    public sanitizer: DomSanitizer, 
    private _decimalPipe: DecimalPipe
  ) { }

  async ngOnInit(): Promise<void> {
    this.branch_id = await this.secureStorage.getItem('b_id');
    let branchObj: BranchModel = await this.getBranchByID(this.branch_id);
    this.isForeign = foreignOrDomestic() === 'FOREIGN';

    this.branchObj = branchObj;
    this.grnObj = this.field.value;
    
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

    // console.log("purchaseOrderObj", localStorage.getItem('branchAddress'), this.purchaseOrderObj, this.registeredAddress);
    if (Number(this.grnObj?.igst) != 0) {
      this.totalTaxAmount = Number(Number(this.grnObj?.igst).toFixed(2))
    } else {
      this.totalTaxAmount = Number((Number(this.grnObj?.cgst) + Number(this.grnObj?.sgst)).toFixed(2));
    }
    if (this.grnObj?.grn_details) {
      // console.log("Original quotation_details:", this.accountsQuotationObj.accounts_quotation_details);
      this.grn_details = this.filterDetails(this.grnObj.grn_details);
      // console.log("Filtered details:", this.quotation_details);
    } else {
      // console.error("accountsQuotationObj or accounts_quotation_details is not defined");
    }
  }

  filterDetails(details: any[]): any[] {
    return details.filter(detail => detail.spare_type !== 'Internal');
  }
  
  getTextarea(desc: any) {
    if (!desc) {
      return []; // Return an empty array if desc is null or undefined
    }
    desc = desc.replace(/\\n/g, '\n');
    return desc.split('\n');
  }

  // amountInWord(number: any) {
  //   // let currency = this.grnObj?.currency;
  //   // console.log("currency", currency);

  //   if (number < 0) return false;

  //   let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  //   let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  //   let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  //   const currencyWords: { [key: string]: { unit: string, subunit: string } } = {
  //     'INR': { unit: 'Rupees', subunit: 'Paisa' },
  //     'USD': { unit: 'Dollars', subunit: 'Cents' },
  //     'EUR': { unit: 'Euros', subunit: 'Cents' },
  //     'JPY': { unit: 'Yen', subunit: '' },
  //     'GBP': { unit: 'Pounds', subunit: 'Pence' },
  //     'HKD': { unit: 'Hong Kong Dollars', subunit: 'Cents' },
  //     'CHF': { unit: 'Swiss Francs', subunit: 'Rappen' },
  //     'SEK': { unit: 'Kronor', subunit: 'Ore' },
  //     'TRY': { unit: 'Lira', subunit: 'Kurus' }
  //   };

    // if (!currencyWords[currency]) {
    //   return "Currency not supported";
    // }

  //   // const { unit, subunit } = currencyWords[currency];

  //   // if (number === 0) {
  //   //   return `Zero ${unit} and Zero ${subunit} only`;
  //   // }

  //   function translate(n: number): string {
  //     let word = "";
  //     let rem: any;
  //     if (n < 10) {
  //       word = single_digit[n] + ' ';
  //     } else if (n < 20) {
  //       word = double_digit[n - 10] + ' ';
  //     } else if (n < 100) {
  //       rem = translate(n % 10);
  //       word = below_hundred[Math.floor(n / 10) - 2] + ' ' + rem;
  //     } else if (n < 1000) {
  //       word = single_digit[Math.floor(n / 100)] + ' Hundred ' + translate(n % 100);
  //     } else if (n < 100000) {
  //       word = translate(Math.floor(n / 1000)) + ' Thousand ' + translate(n % 1000);
  //     } else if (n < 10000000) {
  //       word = translate(Math.floor(n / 100000)) + ' Lakh ' + translate(n % 100000);
  //     } else {
  //       word = translate(Math.floor(n / 10000000)) + ' Crore ' + translate(n % 10000000);
  //     }
  //     return word;
  //   }

  //   const [integerPart, decimalPart] = number.toString().split('.');

  //   const integerResult = translate(parseInt(integerPart, 10));
  //   const decimalResult = decimalPart && parseInt(decimalPart, 10) > 0
  //     ? `${translate(parseInt(decimalPart, 10))} ${subunit}`
  //     : `Zero ${subunit}`;

  //   const result = `${integerResult.trim()} ${unit} and ${decimalResult} only`.trim();

  //   return result;
  // }

  amountInWord(number: any) {
    // console.log("console", number)
    if (number < 0) return false;

    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (number === 0) {
      this.netPayWords = 'Zero Rupees and Zero Paisa only';
      return 'Zero Rupees and Zero Paisa only';
    }

    if (number) {
      function translate(n: any) {
        let word = "";
        let rem: any;
        if (n < 10) {
          word = single_digit[n] + ' ';
        } else if (n < 20) {
          word = double_digit[n - 10] + ' ';
        } else if (n < 100) {
          rem = translate(n % 10);
          word = below_hundred[(n - n % 10) / 10 - 2] + ' ' + rem;
        } else if (n < 1000) {
          word = single_digit[Math.trunc(n / 100)] + ' Hundred ' + translate(n % 100);
        } else if (n < 100000) {
          word = translate(Math.trunc(n / 1000)) + ' Thousand ' + translate(n % 1000);
        } else if (n < 10000000) {
          word = translate(Math.trunc(n / 100000)) + ' Lakh ' + translate(n % 100000);
        } else {
          word = translate(Math.trunc(n / 10000000)) + ' Crore ' + translate(n % 10000000);
        }
        return word;
      }

      // Split the number into integer and decimal parts
      const [integerPart, decimalPart] = number?.toString()?.split('.');

      // Translate the integer part
      const integerResult = translate(parseInt(integerPart, 10));

      // Translate the decimal part if it exists
      const decimalResult = decimalPart ? `${translate(parseInt(decimalPart, 10))} Paisa` : 'Zero Paisa';

      // Combine the results
      const result = `${integerResult.trim()} Rupees and ${decimalResult} only`.trim();

      this.netPayWords = result;
      return result;
    }
    else {
      return 0
    }
  }

  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`).toPromise();
  }

  processAddress(address: string): string {
    // console.log("address",address)
    if (!address) {
      return ''; // Return an empty string if address is null or undefined
    }
    const addressLines = address.split(/[\n]/);
    return addressLines.join('<br>');
  }

  
  calculateColspan(): number {
    let colspan = 13;
    if ((this.hasDiscount() == true && this.hasTaxValue() == false) || 
        (this.hasTaxValue() == true && this.hasDiscount() == false)) {
      colspan = 11;
    }
    else if (this.hasTaxValue() == true && this.hasDiscount() == true) {
      colspan = 10;
    }
    else if (this.hasTaxValue() == false && this.hasDiscount() == false) {
      colspan = 5;
    }
    return colspan;
  }


 hasDiscount(): boolean {
    return this.grnObj?.grn_details?.some(item => item.discount_amount > 0);
  }

  hasTaxValue(): boolean {
    return this.grnObj?.grn_details?.some(item => item.tax > 0);
  }


    calculateFinalPriceTotal(): number {
    return this.grnObj?.grn_details?.reduce(
      (sum, item) => sum + ((item?.unit_price || 0) * (item?.received_qty || 0)),
      0
    ) || 0;
  }


  calculateTaxTotal(): number {
    return this.grnObj?.grn_details?.reduce(
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }

    grandTotalValue(): number {
    if (!this.grnObj?.grn_details?.length) {
      return 0;
    }
    return this.grnObj.grn_details.reduce((sum, item) => {
      const totalAmount = item?.taxable_amount || 0;
      const taxValue = item?.tax_value || 0;
      return sum + (totalAmount + taxValue);
    }, 0);
  }

  calculateGrandTotalColspan(): number {
    // Base colspan logic same as your original
    let colspan = 13;
    
    if ((this.hasDiscount() && !this.hasTaxValue()) || 
        (!this.hasDiscount() && this.hasTaxValue())) {
        colspan = 10;
    }
    else if (this.hasTaxValue() && this.hasDiscount()) {
        colspan = 12;
    }
    else if (!this.hasTaxValue() && !this.hasDiscount()) {
        colspan = 8;
    }
    
    // For "Grand Total" label cell, use the calculated colspan
    // The actual total value will be in the next cell
    return colspan;
}

}
