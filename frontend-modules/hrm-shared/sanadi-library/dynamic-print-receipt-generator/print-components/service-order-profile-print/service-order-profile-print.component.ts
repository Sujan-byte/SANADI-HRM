import { NgForOf, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'sanadi-service-order-profile-print',
  standalone: true,
  imports: [NgForOf, NgIf],
  templateUrl: './service-order-profile-print.component.html',
  styleUrl: './service-order-profile-print.component.scss'
})
export class ServiceOrderProfilePrintComponent {
  @Input() field: any = {};
  companyLogo: any;
  serviceOrderProfileObj: any;
  taxAmount: any = 0;


  ngOnInit(): void{
this.companyLogo = localStorage.getItem('companyLogo');
this.serviceOrderProfileObj = this.field.value;

console.log("serviceOrderProfileObj", this.serviceOrderProfileObj);


for(let item of (this.serviceOrderProfileObj.service_order_profile_details || [] )){
  this.taxAmount = (Number(this.taxAmount)+Number(item?.tax_value).toFixed(2));
}

  }

  getTextarea(desc: any) {
    console.log('getTextarea', desc.split('\n'));
    return desc ? desc.split('\n') : []; 
  }


}
