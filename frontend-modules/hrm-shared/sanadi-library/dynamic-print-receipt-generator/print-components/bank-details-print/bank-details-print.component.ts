import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BranchBankDetailsModel, BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { BankDetailsFormModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/bank-details-form.model';
import { SalesQuotationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/sales/sales-quotation.model';
import { AuthService } from 'src/app/modules/hrm-shared/core/shared/services/auth.service';

@Component({
  selector: 'sanadi-bank-details-print',
  standalone: true,
  imports: [ CommonModule,],
  templateUrl: './bank-details-print.component.html',
  styleUrl: './bank-details-print.component.scss'
})
export class BankDetailsPrintComponent {

  @Input() field: any = {};
  branchName: string = '';
  branchAddress: string = '';
  branchPhoneNo: string = '';
  branchEmail: string = '';
  branchGst: string = '';
  branchLogo: string = '';
  companyName: string = '';
  quotationObj: SalesQuotationModel;
  branchObject: BranchModel;
  // branchBank: BranchBankDetailsModel;
  bankDetailsObj: BankDetailsFormModel;


  private _authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    this.branchName = localStorage.getItem('branchName');
    this.branchAddress = localStorage.getItem('branchAddress');
    this.branchPhoneNo = localStorage.getItem('branchPhoneNo');
    this.branchEmail = localStorage.getItem('branchEmail');
    this.branchGst = localStorage.getItem('branchGst');
    this.branchLogo = localStorage.getItem('branchLogo');
    this.companyName = localStorage.getItem('companyName');

    this.bankDetailsObj = this.field.value;
    console.log("bankDetailsObj", this.bankDetailsObj);

    // this.branchObject = await this._authService.getBranchByID(localStorage.getItem('b_id'));

    // this.branchBank = this.branchObject?.branch_bank_details?.length ? this.branchObject?.branch_bank_details[0] : {};
  }

  constructor(public sanitizer: DomSanitizer, private _decimalPipe: DecimalPipe) { }

  getTextarea(desc: any) {
    // console.log('getTextarea', desc.split('\n'));
    return desc ? desc.split(/\\n|\n/) : [];
  }

  
  panFromGST(gstin) {
    if (gstin.length === 15) {
      return gstin.substring(2, 12);
    } else {
      return '';
    }
  }

  extractName(data) {
    const match = data.match(/^([^\(]+)\(/);
    return match ? match[1].trim() : '';
  }

  // TO DECIMAL VALUE
  transformDecimal(num) {
    return num ? this._decimalPipe.transform(num, '1.2-2') : "0.00";
  }
  // TO DECIMAL VALUE

  // PRINT TEMPLATE CODES
  convertToHTML(editorData: any): SafeHtml {

    let htmlContent = '';
    // const styles = this?.getStyles(); // Move styles to a separate function
    try {
      if (Object.keys(editorData)?.length > 0) {
        const parsedData = JSON?.parse(editorData);
        // console.log("editorData", parsedData, parsedData?.blocks)
        parsedData?.blocks?.forEach((element: any) => {
          htmlContent += this?.processElement(element);
        });
      }
      return this?.sanitizer?.bypassSecurityTrustHtml(htmlContent);
    }
    catch (error) {
      console?.error('Error converting to HTML:', error);
      return '';
    }
  }

  private processElement(element: any): string {
    let text = element?.data?.text;
    const placeholders: { [key: string]: string } = {
      "[image]": this?.onImageFiled(),
    };
    for (const [placeholder, replacement] of Object?.entries(placeholders)) {
      if (text?.includes(placeholder)) {
        text = text?.replace(placeholder, replacement);
      }
    }
    if (element?.data?.underline) {
      text = `<u>${text}</u>`;
    }

    switch (element?.type) {
      case 'paragraph':
        return `<p class="justify mb-0">${text}</p>`;
      case 'header':
        return `<h${element?.data?.level} class="bold">${text}</h${element?.data?.level}>`;
      case 'list':
        return this?.processList(element);
      case 'table':
        return this?.processTable(element);
      default:
        return text; // Return text for unsupported types
    }
  }

  private processList(element: any): string {
    const listTag = element?.data?.style === 'ordered' ? 'ol' : 'ul';
    const items = element?.data?.items?.map((item: string) =>
      `<li${element?.data?.underline ? '><u>' + item + '</u></li>' : '>' + item + '</li>'}`
    )?.join('');

    return `<${listTag}>${items}</${listTag}>`;
  }

  private processTable(element: any): string {
    let tableHtml = '<table class="table"; style="color: black !important;">';
    element?.data?.content?.forEach((row: string[], rowIndex: number) => {
      tableHtml += '<tr>' + row?.map(cell => {
        const cellTag = rowIndex === 0 && element?.data?.withHeadings ? 'th' : 'td';
        return `<${cellTag}>${cell}</${cellTag}>`;
      })?.join('') + '</tr>';
    });
    tableHtml += '</table>';
    return tableHtml;
  }

  onImageFiled = (): string => {
    return `
        <div style="display: flex; align-items: flex-start; width: 20%; height: 20%;" class="breakPage">
            <img src="../../../../../assets/images/kirthisig.jpg" alt="logo" class="img-fluid" style="width: 80%;">
        </div>
    `;
  };
  // PRINT TEMPLATE CODES

  // generateColSpanForNote(data: SalesQuotationModel) {
  //   let count: number = 0;
  //   let object = { discount: data?.discount, cgst: data?.cgst, igst: data?.igst };
  //   Object.keys(object).forEach((ele: any) => {
  //     if (ele === SalesQuotationEnums.discount && object[ele]) 
  //       count++;
  //     else if ([SalesQuotationEnums.cgst, SalesQuotationEnums.igst].includes(ele) && object[ele]) {
  //       count++;
  //     }
  //   });
  //   // console.log('count', count);
  //   return 5 + count;
  // }

}
