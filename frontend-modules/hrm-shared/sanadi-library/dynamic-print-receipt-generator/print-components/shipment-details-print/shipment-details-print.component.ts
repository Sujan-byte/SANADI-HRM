
import { CommonModule, DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from 'src/app/core/services/api.service';
import { OAEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/sales-enum/order-acceptance.enum';
import { BranchBankDetailsModel, BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { foreignOrDomestic } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
import { shipmentDetailsModel, Shipmentmodel } from 'src/app/modules/hrm-shared/core/shared/common/model/purchase/shipment-form.model';
import { ShipmentDetailsEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/purchase-enum/shipment-form.enum';

@Component({
  selector: 'sanadi-shipment-details-print',
  standalone: true,
  imports: [NgForOf, NgIf],
  templateUrl: './shipment-details-print.component.html',
  styleUrl: './shipment-details-print.component.scss'
})
export class ShipmentDetailsPrintComponent {

  @Input() field: any = {};
  @Input() selectedColorClass: string = 'theme-blue';

  shipmentObj : Shipmentmodel;

  packingDetails: any[] = []; 
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
  totalQty: number = 0;
  cgstTotal: number = 0;
  branch_id: string;
  branchObj: BranchModel;
  branchBank: BranchBankDetailsModel;
  companyName: string;
  selectCustomerObject: any;
  removedHsnDuplicateInArray: any[];
  isForeign: boolean = false;
default_invoice_number:any;
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
    this.shipmentObj = this.field.value;
    
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
    this.shipmentObj = this.field.value;
    this.calculateTotalQty();
    
    this.branchBank = this.branchObj?.branch_bank_details?.length 
      ? this.branchObj?.branch_bank_details[0] 
      : {};
    
    if (this.gstNo && this.gstNo.length >= 15) {
      this.companyPan = this.gstNo.slice(2, 12);
    }

  }

  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`)?.toPromise();
  }

  getTextarea(desc: any) {
    if (!desc) return [];
    desc = desc?.replace(/\\n/g, '\n');
    return desc.split('\n');
  }


  calculateTotalQty() {
    this.totalQty = 0;
    if (this.shipmentObj?.shipment_details?.length) {
      this.shipmentObj.shipment_details.forEach(item => {
        this.totalQty += Number(item.quantity) || 0;
      });
    }
  }


}
