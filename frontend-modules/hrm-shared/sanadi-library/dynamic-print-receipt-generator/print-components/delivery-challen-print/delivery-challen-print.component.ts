import { NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { DeliveryChallanDetailsModel, DeliveryChallanModel } from 'src/app/modules/hrm-shared/core/shared/common/model/purchase/delivery-challan.model';
import { GRNDetailsModel, GRNModel } from 'src/app/modules/hrm-shared/core/shared/common/model/purchase/grn.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-delivery-challen-print',
  standalone: true,
  imports: [NgForOf, NgIf],
  templateUrl: './delivery-challen-print.component.html',
  styleUrl: './delivery-challen-print.component.scss'
})
export class DeliveryChallenPrintComponent {
  @Input() field: any = {};
  deliverChallenObj: any;
  companyLogo: any;
  serialNumbers: string = '';

  companyName: string;
  email: string;
  phoneNo: string;
  state: string;
  stateCode: string;
  gst: string;
  website: string;
  netPayWords: string;
  totalTaxAmount: any;
  pan: string;
  address: string;
  fax: string;
  branch_id: any;
  private readonly apiService = inject(ApiService);
  branchObj: any;


  async ngOnInit(): Promise<void> {
    this.branch_id = localStorage.getItem('b_id');
    let getbranchObj: BranchModel = await this.getBranchByID(this.branch_id);
    console.log("getbranchObj", getbranchObj);
    this.branchObj = getbranchObj;
    this.companyLogo =this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
    this.address = this.branchObj?.registered_address || ''
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email =  this.branchObj?.email || ''
    this.state = this.branchObj?.state_name || ''
    this.gst =  this.branchObj?.gst_no || '';
    // this.pan = localStorage.getItem('panNo');
    this.stateCode =  this.branchObj?.state_code;
    // this.fax = localStorage.getItem('faxNumber');
    // this.website = localStorage.getItem('website')
    // this.companyLogo = localStorage.getItem('companyLogo');
    // this.companyName = localStorage.getItem('companyName');
    // this.address = localStorage.getItem('branchAddress');
    // this.phoneNo = localStorage.getItem('phoneNo');
    // this.email = localStorage.getItem('email');
    // this.state = localStorage.getItem('stateName');
    // this.gst = localStorage.getItem('gstNo');
    // this.pan = localStorage.getItem('panNo');
    // this.stateCode = localStorage.getItem('stateCode');
    // this.fax = localStorage.getItem('faxNumber');
    // this.website = localStorage.getItem('website')

    if (this.field.value?.dc_print) {
      console.log("inside if")
      // this.deliverChallenObj = this.generateDeliveryChallan(this.field.value);
      console.log("this.deliverChallenObj if", this.deliverChallenObj)
    } else {
      this.deliverChallenObj = this.field.value;
      console.log("this.deliverChallenObj else", this.deliverChallenObj)
    }
    console.log("deliverChallenObj", this.deliverChallenObj);

  }

  // Function to process and format the serial numbers
  getSerialNumbers(serialNumbersArray: any[]): string {
    if (serialNumbersArray && Array.isArray(serialNumbersArray) && serialNumbersArray.length > 0) {
      // Map the serial number field and join them with commas
      return serialNumbersArray.map(sn => sn.serial_number).join(', ');
    }
    return '';  // Return an empty string if no serial numbers are found
  }


  getTextarea(address: any) {
    console.log("address text area", address)

    address = address.replace(/\\n/g, '\n');
    return address ? address.split('\n') : [];
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
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`).toPromise();
  }

}
