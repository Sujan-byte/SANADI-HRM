import { CommonModule, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { Mode, TransactionType } from 'src/app/modules/hrm-shared/core/shared/common/enum/finance-enum/invoice.enum';
import { InvoiceModel } from 'src/app/modules/hrm-shared/core/shared/common/model/finance/invoice.model';
import { BranchModel } from 'src/app/modules/hrm-shared/core/shared/common/model/admin/branch.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-eway-bill-print',
  standalone: true,
  imports: [DatePipe, QRCodeModule, NgForOf, NgIf, CommonModule],
  templateUrl: './eway-bill-print.component.html',
  styleUrl: './eway-bill-print.component.scss'
})
export class EwayBillPrintComponent {
  @Input() invoiceData: InvoiceModel;
  registeredAddress: any;
  phoneNo: any;
  email: any;
  faxNumber: string;
  website: string;
  gstNo: string;
  stateName: string;
  stateCode: string;
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
  getInvoiceMode(mode) {
    return Mode[mode];
  }

  getTransactionType(type) {
    return TransactionType[type];
  }
  async ngOnInit(): Promise<void> {
    this.branch_id = localStorage.getItem('b_id');
    let branchObj: BranchModel = await this.getBranchByID(this.branch_id);
    this.branchObj = branchObj;
    this.companyName = this.branchObj?.branch_name || '';
    this.registeredAddress = this.branchObj?.registered_address || ''
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email = this.branchObj?.email || ''
    this.state = this.branchObj?.state_name || ''
    this.gstNo = this.branchObj?.gst_no || '';
    if (this.gstNo != 'undefined' && this.gstNo.length >= 15) {
      this.panNo = this.gstNo.slice(2, 12);
    }
    this.stateCode = this.branchObj?.state_code;

  }
  getTaxRate(item) {
    if (this.invoiceData?.is_interstate) {
      return item?.igst_rate ? `${item.igst_rate}` : '';
    } else {
      const cgst = item?.cgst_rate;
      const sgst = item?.sgst_rate;
      if (cgst || sgst) {
        return `${cgst || 0} + ${sgst || 0}`;
      }
      return '';
    }
  }
  async getBranchByID(id: any) {
    return await this.apiService.get(`${ServiceUrlConstants.BRANCH_CRUD}${id}`).toPromise();
  }
  getTextarea(desc: any) {
    if (!desc) {
      return []; // Return an empty array if desc is null or undefined
    }
    desc = desc.replace(/\\n/g, '\n');
    return desc.split('\n');
  }

}
