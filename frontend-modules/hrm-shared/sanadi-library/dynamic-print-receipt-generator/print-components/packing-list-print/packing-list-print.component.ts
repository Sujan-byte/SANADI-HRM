import { packingListModel } from 'src/app/modules/hrm-shared/core/shared/common/model/accounts/packing-list.model';
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
  selector: 'sanadi-packing-list-print',
  standalone: true,
  imports: [ CommonModule, DecimalPipe  ],
  templateUrl: './packing-list-print.component.html',
  styleUrl: './packing-list-print.component.scss'
})
export class PackingListPrintComponent {
  @Input() field: any = {};
  @Input() selectedColorClass: string = 'theme-blue';

  packinglistObj: any; // Changed to any to handle conversion
  packingDetails: any[] = []; // New array for packing details
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
  totalPallets: number = 0;
  totalGrossWeight: number = 0;
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
    
    // Convert field.value to packing list format
    this.packinglistObj = this.field.value;
    
    // Convert oa_product_details to packing_details
    if (this.packinglistObj?.oa_product_details) {
      this.packingDetails = this.convertToPackingDetails(this.packinglistObj.oa_product_details);
    }
    
    this.registeredAddress = this.branchObj?.registered_address || '';
    this.companyLogo = this.branchObj?.images || '';
    this.companyName = this.branchObj?.branch_name || '';
    this.phoneNo = this.branchObj?.phone_no || '';
    this.email = this.branchObj?.email || '';
    this.gstNo = this.branchObj?.gst_no || '';
    this.stateName = this.branchObj?.state_name || '';
    this.cinNo = this.branchObj?.cin_no || '';
    this.stateCode = this.branchObj?.state_code || '';
    this.packinglistObj = this.field.value;
    this.calculatePackingQty();
    this.calculateGrossWeight();
    
    this.branchBank = this.branchObj?.branch_bank_details?.length 
      ? this.branchObj?.branch_bank_details[0] 
      : {};
    
    if (this.gstNo && this.gstNo.length >= 15) {
      this.companyPan = this.gstNo.slice(2, 12);
    }

    // Generate amount in words
    if (this.packinglistObj?.grand_total) {
      this.amountInWords = this.amountInWord(Math?.round(this.packinglistObj.grand_total || 0));
    }
  }

  // Convert OA product details to packing details
  convertToPackingDetails(oaDetails: any[]): any[] {
    if (!oaDetails) return [];
    
    return oaDetails.map(item => {
      // Customize this mapping based on your packing list model structure
      return {
        sr_no: item.sr_no || '',
        product_name: item.product_name || '',
        hsn_code: item.hsn_code || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        unit_price: item.unit_price || 0,
        taxable_amount: item.taxable_amount || 0,
        discount_amount: item.discount_amount || 0,
        discount_percentage: item.discount_percentage || 0,
        tax_percentage: item.tax_percentage || 0,
        tax_value: item.tax_value || 0,
        total_amount: item.total_amount || 0,
        
        // Packing list specific fields (add if needed):
        packed_quantity: item.packed_quantity || item.quantity || 0, // Default to full quantity
        remaining_quantity: item.remaining_quantity || 0,
        package_type: item.package_type || '',
        package_weight: item.package_weight || 0,
        dimensions: item.dimensions || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || ''
      };
    });
  }

  // Update all methods to use packingDetails
  hasDiscount(): boolean {
    return this.packingDetails?.some(item => item.discount_amount > 0);
  }

  hasTaxValue(): boolean {
    return this.packingDetails?.some(item => item.tax > 0);
  }

  hasIgst(): boolean {
    return Number(this.packinglistObj?.igst) > 0;
  }

  calculateTaxableTotal(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.taxable_amount || 0),
      0
    ) || 0;
  }

  calculateDiscountTotal(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.discount_amount || 0),
      0
    ) || 0;
  }

  calculateTaxTotal(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.tax_value || 0),
      0
    ) || 0;
  }

  grandTotalValue(): number {
    if (!this.packingDetails?.length) {
      return 0;
    }
    return this.packingDetails.reduce((sum, item) => {
      const totalAmount = item?.taxable_amount || 0;
      const taxValue = item?.tax_value || 0;
      return sum + (totalAmount + taxValue);
    }, 0);
  }

  calculateFinalPriceTotal(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + ((item?.unit_price || 0) * (item?.quantity || 0)),
      0
    ) || 0;
  }

  calculateTotalQty(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    ) || 0;
  }

  calculatePackingQty() {
    this.totalPallets = 0;
    if (this.packinglistObj?.packing_details?.length) {
      this.packinglistObj.packing_details.forEach(item => {
        this.totalPallets += Number(item.pallets_bag_carton_selections) || 0;
      });
    }
  }

  calculateGrossWeight() {
    this.totalGrossWeight = 0;
    if (this.packinglistObj?.packing_details?.length) {
      this.packinglistObj.packing_details.forEach(item => {
        this.totalGrossWeight += Number(item.gross_weights) || 0;
      });
    }
  }

  // Calculate total packed quantity
  calculateTotalPackedQty(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.packed_quantity || 0),
      0
    ) || 0;
  }

  // Calculate total remaining quantity
  calculateTotalRemainingQty(): number {
    return this.packingDetails?.reduce(
      (sum, item) => sum + (item.remaining_quantity || 0),
      0
    ) || 0;
  }

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

  // Generate amount in words (keep as is)
  amountInWord(number: any) {
    // ... (keep existing code)
  }

  // Format address textarea
  getTextarea(desc: any) {
    if (!desc) return [];
    desc = desc?.replace(/\\n/g, '\n');
    return desc.split('\n');
  }

  // Get empty rows for pagination
  getEmptyRows(): any[] {
    const itemCount = this.packingDetails?.length || 0; // Updated
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
      discount: this.packinglistObj?.discount, // Updated
      cgst: this.packinglistObj?.cgst, // Updated
      igst: this.packinglistObj?.igst // Updated
    };
    
    Object.keys(object).forEach((ele: any) => {
      if (ele === OAEnum.discount && object[ele]) 
        count++;
      else if ([OAEnum.cgst, OAEnum.igst].includes(ele) && object[ele]) {
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
}