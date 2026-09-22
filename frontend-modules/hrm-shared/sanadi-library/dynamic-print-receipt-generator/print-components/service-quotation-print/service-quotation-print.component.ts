import { NgForOf, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { generateAddress } from 'src/app/modules/hrm-shared/core/shared/services/generate.address';

@Component({
  selector: 'sanadi-service-quotation-print',
  standalone: true,
  imports: [NgForOf, NgIf],
  templateUrl: './service-quotation-print.component.html',
  styleUrl: './service-quotation-print.component.scss'
})
export class ServiceQuotationPrintComponent {
  @Input() field: any = {};
  companyName: any;
  address: any;
  phoneNo: any;
  email: any;
  companyLogo: any;
  companyLogo1: any;
  companyLogo2: any;
  servicequotationObj: any;
  customerAddressHtml: string;
  taxAmount: any;


  ngOnInit(): void {
    this.companyName = localStorage.getItem('companyName');
    this.address = localStorage.getItem('address');
    this.phoneNo = localStorage.getItem('phoneNo');
    this.email = localStorage.getItem('email');
    this.companyLogo = localStorage.getItem('companyLogo');
    this.companyLogo1 = localStorage.getItem('companyLogo1');
    this.companyLogo2 = localStorage.getItem('companyLogo2');
    this.servicequotationObj = this.field.value;
    console.log("servicequotationObj", this.servicequotationObj);

    this.servicequotationObj.customer_full_address = generateAddress({
      name: this.servicequotationObj.customer_name,
      address: this.servicequotationObj.bill_to_address,
    });



    // Construct the HTML string for customer address
    this.customerAddressHtml = this.servicequotationObj.customer_full_address.replace(/\n/g, '<br>');

    if (Number(this.servicequotationObj.igst) != 0) {
      this.taxAmount =  Number(Number(this.servicequotationObj.igst).toFixed(2));
    }
    else {
      this.taxAmount = Number(this.servicequotationObj.cgst) + Number(Number(this.servicequotationObj.sgst).toFixed(2));
    }



  }

  getTextarea(desc: any) {
    console.log('getTextarea', desc.split('\n'));
    return desc ? desc.split('\n') : []; 
  }


}
