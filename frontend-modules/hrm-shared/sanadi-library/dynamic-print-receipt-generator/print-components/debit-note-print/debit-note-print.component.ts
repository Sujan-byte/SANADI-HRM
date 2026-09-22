import { CommonModule, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Component,inject,Input } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { DebitNoteModel } from 'src/app/modules/hrm-shared/core/shared/common/model/accounts/debit-note.model';
import { BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-debit-note-print',
  standalone: true,
  imports: [CommonModule,NgForOf,NgIf],
  templateUrl: './debit-note-print.component.html',
  styleUrl: './debit-note-print.component.scss'
})
export class DebitNotePrintComponent {
  @Input() field: any = {};
  debitnoteObj:any;;

  companyName:String;
  registeredAddress:any;
  gstNo:string;
  stateName:string;
  stateCode:any;
  cinNo:string;

  branchObj:BranchModel;
  branch_id:string;
  private readonly apiService = inject(ApiService);
  
  companyLogo:any;
  phoneNo:any;
  email:any;
  faxNumber:any;
  website:any;
  companyPan:any;
  selectCustomerObject:any;
  taxAmount:any;
  taxAmountWords:any;
  amountInWords:any;
  netPayWords:string;
  totalTaxAmount:number;
  sgstTotal:number;
  cgstTotal:number;
  removedHsnDuplicateInArray: any[];

  

  async ngOnInit(): Promise<void> {
    this.branch_id = localStorage.getItem('b_id');
    let branchObj:BranchModel = await this.getBranchByID(this.branch_id);
    this.branchObj = branchObj;

    this.registeredAddress = this.branchObj?.registered_address || ''
    this.companyLogo = this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
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
    this.debitnoteObj = this.field.value;
    // this.selectCustomerObject = this.debitnoteObj?.default_select_customer_object;

    if (Number(this.debitnoteObj.igst) != 0) {
      this.taxAmount = Number((this.debitnoteObj.igst).toFixed(2));
    }
    else {
      this.taxAmount = Number(this.debitnoteObj.cgst) + Number((this.debitnoteObj.sgst).toFixed(2));
    }
    if (this.taxAmount > 0 || this.amountInWords) {
      this.taxAmountWords = this.amountInWord(Math?.round(this.taxAmount || 0));
      this.amountInWords = this.amountInWord(Math?.round(this.field?.value?.grand_total || 0));

    }
    if (Number(this.debitnoteObj?.igst) != 0) {
      this.totalTaxAmount = Number(Number(this.debitnoteObj?.igst).toFixed(2))
    } else {
      this.totalTaxAmount = Number((Number(this.debitnoteObj?.cgst) + Number(this.debitnoteObj?.sgst)).toFixed(2));
    }
    this.sgstTotal = this.cgstTotal = this.debitnoteObj?.debit_note_details.reduce((acc, item) => {
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
    desc = desc?.replace(/\\n/g, '\n');
    return desc
      ? desc.split('\n').map(line => {
          const match = line.match(/^([A-Za-z\s]+),\s*(\d+)$/);
          if (match) {
            const state = match[1].trim();
            const code = match[2].trim();
            return `State Name: ${state}, Code: ${code}`;
          }
          return line;
        })
      : [];
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

  hasDiscount(): boolean {
    return this.debitnoteObj?.debit_note_details.some(item => item.discount_amount > 0);
  }

  hasTaxValue(): boolean {
    return this.debitnoteObj?.debit_note_details.some(item => item.tax > 0);
  }
  
 calculatefinalPriceTotal(): number {
  const total = this.debitnoteObj?.debit_note_details?.reduce(
    (sum, item) => sum + (item?.unit_price || 0),
    0
  ) || 0;

  console.log('Final Price Total:', total);
  return total;
}

  calculateDiscountTotal(): number {
    return this.debitnoteObj?.debit_note_details.reduce(
      (sum, item) => sum + ((item?.discount_amount) || 0),
      0
    ) || 0;
  }

  calculateTaxTotal(): number {
    return this.debitnoteObj?.debit_note_details.reduce(
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }
  grandTotalValue(): number {
  if (!this.debitnoteObj?.debit_note_details?.length) {
    return 0;
  }

  const lineTotal = this.debitnoteObj.debit_note_details.reduce((sum, item) => {
    const taxableAmount = Number(item?.taxable_amount || 0);
    const taxValue = Number(item?.tax_value || 0);
    return sum + taxableAmount + taxValue;
  }, 0);

  const adjustAmount = Number(this.debitnoteObj.adjust_amount || 0); // <- global adjust amount

  const total= lineTotal + adjustAmount;
  return Math.ceil(total*10)/10;
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
  getDebitNoteDetailsMode() {
    const groupedTotals: any = {};

    this.debitnoteObj?.debit_note_details.forEach(ele => {
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


}
