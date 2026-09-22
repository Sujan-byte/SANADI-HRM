import { CommonModule, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { CreditNoteModel } from 'src/app/modules/hrm-shared/core/shared/common/model/accounts/credit-note.model';
import { BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { QRCodeModule } from 'angularx-qrcode';


@Component({
  selector: 'sanadi-credit-note-print',
  standalone: true,
  imports: [CommonModule, NgForOf, NgIf, DatePipe, QRCodeModule],
  templateUrl: './credit-note-print.component.html',
  styleUrl: './credit-note-print.component.scss'
})
export class CreditNotePrintComponent {
  @Input() field: any = {};
  creditnoteObj: any;

  companyName: string;
  registeredAddress: any;
  gstNo: string;
  stateName: string;
  stateCode: any;
  cinNo: string;

  branchObj: BranchModel;
  branch_id: string;
  private readonly apiService = inject(ApiService);

  companyLogo: any;
  phoneNo: any;
  email: any;
  faxNumber: any;
  website: any;
  companyPan: any;
  selectCustomerObject: any;
  taxAmount: any;
  taxAmountWords: any;
  amountInWords: any;
  netPayWords: string;
  totalTaxAmount: number;
  sgstTotal: number;
  cgstTotal: number;
  removedHsnDuplicateInArray: any[];
  amountInWordsText: string = '';

  

  async ngOnInit(): Promise<void> {
    this.branch_id = localStorage.getItem('b_id');
    this.branchObj = await this.getBranchByID(this.branch_id);

    this.registeredAddress = this.branchObj?.registered_address || '';
    this.companyLogo = this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email = this.branchObj?.email || '';
    this.faxNumber = localStorage.getItem('faxNumber');
    this.gstNo = this.branchObj?.gst_no || '';
    this.stateName = this.branchObj?.state_name || '';
    this.cinNo = this.branchObj?.cin_no || '';
    this.website = this.branchObj?.state_name || '';
    this.stateCode = this.branchObj?.state_code || '';
    if (this.gstNo && this.gstNo.length >= 15) {
      this.companyPan = this.gstNo.slice(2, 12);
    }

    this.creditnoteObj = this.field.value;

    if (Number(this.creditnoteObj.igst) != 0) {
      this.taxAmount = Number((this.creditnoteObj.igst).toFixed(2));
    } else {
      this.taxAmount = Number(this.creditnoteObj.cgst) + Number((this.creditnoteObj.sgst).toFixed(2));
    }

    if (this.taxAmount > 0 || this.amountInWords) {
      this.taxAmountWords = this.amountInWord(Math.round(this.taxAmount || 0));
      this.amountInWords = this.amountInWord(Math.round(this.field?.value?.grand_total || 0));
    }

    if (Number(this.creditnoteObj?.igst) != 0) {
      this.totalTaxAmount = Number(Number(this.creditnoteObj?.igst).toFixed(2));
    } else {
      this.totalTaxAmount = Number((Number(this.creditnoteObj?.cgst) + Number(this.creditnoteObj?.sgst)).toFixed(2));
    }

    this.sgstTotal = this.cgstTotal = this.creditnoteObj?.credit_note_details.reduce((acc, item) => {
      return acc + Number((item?.tax_value / 2).toFixed(2));
    }, 0);
  }

  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`)?.toPromise();
  }

   amountInWord(number: any) {
  if (number === undefined || number === null || isNaN(number)) {
    number = 0;
    console.error("Invalid number provided:", number);
    return '';
  }

  if (number < 0) return '';

  const single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (number === 0) {
    this.netPayWords = 'Zero Rupees only';
    return 'Zero Rupees only';
  }

  function translate(n: any): string {
    let word = "";
    if (n < 10) {
      word = single_digit[n] + ' ';
    } else if (n < 20) {
      word = double_digit[n - 10] + ' ';
    } else if (n < 100) {
      word = below_hundred[Math.floor(n / 10) - 2] + ' ' + translate(n % 10);
    } else if (n < 1000) {
      word = single_digit[Math.floor(n / 100)] + ' Hundred ' + translate(n % 100);
    } else if (n < 100000) {
      word = translate(Math.floor(n / 1000)) + ' Thousand ' + translate(n % 1000);
    } else if (n < 10000000) {
      word = translate(Math.floor(n / 100000)) + ' Lakh ' + translate(n % 100000);
    } else {
      word = translate(Math.floor(n / 10000000)) + ' Crore ' + translate(n % 10000000);
    }
    return word.trim();
  }

  const [integerPart, decimalPartRaw] = number.toString().split('.');
  const integerResult = translate(parseInt(integerPart, 10));

  let decimalResult = '';
  const decimalPart = parseInt((decimalPartRaw || '0').padEnd(2, '0'), 10); // Ensure 2 digits

  if (decimalPart > 0) {
    decimalResult = translate(decimalPart) + ' Paisa';
  }

  const result = `${integerResult} Rupees${decimalResult ? ' and ' + decimalResult : ''} only`;
  this.netPayWords = result;
  return result;
}

  
  getTextarea(desc: any) {
  if (!desc) return [];

  // Replace escaped newlines with actual newlines
  desc = desc.replace(/\\n/g, '\n');

  return desc.split('\n').map(line => {
    line = line.trim();

    // Match lines like: StateName, Code (e.g., Delhi, 07)
    const match = line.match(/^([A-Za-z\s]+),\s*(\d{1,2})$/);
    if (match) {
      const state = match[1].trim();
      const code = match[2].trim();
      return `State Name: ${state}, Code: ${code}`;
    }

    // Keep other lines unchanged
    return line;
  });
}
 igstIsZero(): boolean {
  const igst = this.creditnoteObj?.igst;

  // Safely convert to number
  const igstNum = typeof igst === 'string' ? parseFloat(igst) : igst;

  return !isNaN(igstNum) && igstNum === 0;
}

igstIsNonZero(): boolean {
  const igst = this.creditnoteObj?.igst;

  // Safely convert to number
  const igstNum = typeof igst === 'string' ? parseFloat(igst) : igst;

  return !isNaN(igstNum) && igstNum > 0;
}




  hasDiscount(): boolean {
    return this.creditnoteObj?.credit_note_details.some(item => item.discount_amount > 0);
  }

  hasTaxValue(): boolean {
    return this.creditnoteObj?.credit_note_details.some(item => item.tax > 0);
  }

  calculatefinalPriceTotal(): number {
    return this.creditnoteObj?.credit_note_details.reduce(
      (sum, item) => sum + (item?.unit_price || 0),
      0
    ) || 0;
  }

  calculateDiscountTotal(): number {
    return this.creditnoteObj?.credit_note_details.reduce(
      (sum, item) => sum + (item?.discount_amount || 0),
      0
    ) || 0;
  }

  calculateTaxTotal(): number {
    return this.creditnoteObj?.credit_note_details.reduce(
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }

    grandTotalValue(): number {
    if (!this.creditnoteObj?.credit_note_details?.length) return 0;

    const lineItemTotal = this.creditnoteObj.credit_note_details.reduce((sum, item) => {
      const taxableAmount = Number(item?.taxable_amount || 0);
      const taxValue = Number(item?.tax_value || 0);
      return sum + taxableAmount + taxValue;
    }, 0);

    const adjustAmount = Number(this.creditnoteObj.adjust_amount || 0); // ← pulled from parent object

    const total= lineItemTotal + adjustAmount;
    return Math.ceil(total*10)/10;
}


  calculateColspan(): number {
    let colspan = 10;
    if ((this.hasDiscount() && !this.hasTaxValue()) || (!this.hasDiscount() && this.hasTaxValue())) {
      colspan = 8;
    } else if (this.hasDiscount() || this.hasTaxValue()) {
      colspan = 10;
    } else {
      colspan = 5;
    }
    return colspan;
  }

  getCreditNoteDetailsMode() {
  const groupedTotals: any = {};

  this.creditnoteObj?.credit_note_details?.forEach(ele => {
    const hsn = ele.hsn ?? '';
    const tax = ele.tax ?? '0';
    const taxKey = `${hsn}_${tax}`;

    if (!groupedTotals[taxKey]) {
      groupedTotals[taxKey] = {
        hsn: hsn,
        tax: tax,
        taxable_amount: 0,
        tax_value: 0
      };
    }

    const taxableAmount = typeof ele.taxable_amount === 'number' ? ele.taxable_amount : parseFloat(ele.taxable_amount) || 0;
    const taxValue = typeof ele.tax_value === 'number' ? ele.tax_value : parseFloat(ele.tax_value) || 0;

    groupedTotals[taxKey].taxable_amount += taxableAmount;
    groupedTotals[taxKey].tax_value += taxValue;
  });

  this.removedHsnDuplicateInArray = Object.values(groupedTotals);
  return this.removedHsnDuplicateInArray || [];
}
getTotalTaxAmount(): number {
  const igst = +this.creditnoteObj?.igst || 0;
  const cgst = +this.creditnoteObj?.cgst || 0;
  const sgst = +this.creditnoteObj?.sgst || 0;

  let total = 0;

  if (igst > 0) {
    total = igst;
  } else if (cgst > 0 || sgst > 0) {
    total = cgst + sgst;
  }

  this.totalTaxAmount = total; // store it if needed elsewhere
  this.amountInWordsText = this.amountInWord(total); //  generate in words

  return total;
}

formatDiscount(value: any): string {
      const num = Number(value);
      if (isNaN(num)||num===0) return '';

      // If it has decimals (e.g., 1.25), keep them
      if (!Number.isInteger(num)) {
        return `${num}%`;
      }

      // Else show as integer (e.g., 2)
      return `${num.toFixed(0)}%`;
    }




}
