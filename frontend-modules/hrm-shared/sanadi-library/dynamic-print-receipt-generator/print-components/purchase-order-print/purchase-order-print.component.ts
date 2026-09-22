import { CommonModule, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { PurchaseOrderModel } from 'src/app/modules/hrm-shared/core/shared/common/model/purchase/purchase-order.model';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-purchase-order-print',
  standalone: true,
  imports: [NgForOf, NgIf, CommonModule],
  templateUrl: './purchase-order-print.component.html',
  styleUrl: './purchase-order-print.component.scss'
})
export class PurchaseOrderPrintComponent implements OnInit {
  @Input() field: any = {};
  purchaseOrderObj: PurchaseOrderModel;
  roundOff: number = 0;
  po_grand_total: number = 0;
  companyName: string;
  companyEmail: string;
  companyPhoneNo: string;
  gstNo: string;
  panNo: string;
  cinNo: string;
  registeredAddress: string;
  companyLogo: any;
  poNumber: any;
  factoryAddress: any;
  gstNumber: any;
  customerName: any;
  address1: any;
  address2: any;
  City: any;
  state: any;
  zipCode: any;
  stateCode: any;
  country: any;
  city: string;
  currencyType: string;
  pinCode: string;
  logo: string;
  stateName: string;
  amountInWords: string | boolean;
  netPayWords: string;
  Gst: number;
  state_Code: any;
  supplierAddress: any;
  supplierGst: any;
  supplierPhone: any;
  supplierEmail: any;
  supplierState: any;
  shippingAddress: any;
  shippingState: any;
  supplierpincode: any;
  suppliercity: any;
  supplierName: any;
  defaultTermsAndConditions: { term: string; description: string; }[];
  totalTaxAmount: number = 0;

  createdBy: string = '';
  approvedBy: string = '';
  authorizedBy: string = '';
  stageDetails: any = [];
  
  private readonly secureStorage = inject(EncryptedStorageService);

  async ngOnInit(): Promise<void> {
    // First load ALL data from secure storage
    await this.loadAllDataFromSecureStorage();
    
    this.purchaseOrderObj = this.field.value;
    this.amountInWords = await this.amountInWord(this.purchaseOrderObj?.grand_total);

    // Parse GST for PAN if needed
    if (this.gstNo && this.gstNo != 'undefined' && this.gstNo.length >= 15) {
      this.panNo = this.gstNo.slice(2, 12);
    }

    console.log('Branch Address from secure storage:', this.registeredAddress);
    console.log('Branch company name from secure storage:', this.companyName);

    const taxValue = Number(Number(this.purchaseOrderObj?.sgst) + Number(this.purchaseOrderObj?.cgst) + Number(this.purchaseOrderObj?.igst));
    this.Gst = Number(taxValue.toFixed(2));
    this.supplierName = this.purchaseOrderObj?.party_name || '';
    this.supplierAddress = this.purchaseOrderObj?.address || '';
    this.supplierGst = this.purchaseOrderObj?.gst_number || '';
    this.supplierPhone = this.purchaseOrderObj?.phone_number || '';
    this.supplierEmail = this.purchaseOrderObj?.email || '';
    this.supplierState = this.purchaseOrderObj?.state || '';
    this.supplierpincode = this.purchaseOrderObj?.state || '';
    this.suppliercity = this.purchaseOrderObj?.suppliercity || '';

    // Shipping Address
    this.shippingAddress = this.purchaseOrderObj?.ship_to_address || this.registeredAddress || '';
    this.shippingState = this.stateName;

    this.createdBy = this.purchaseOrderObj?.created_by_name || '';

    if (Number(this.purchaseOrderObj?.igst) != 0) {
      this.totalTaxAmount = Number(Number(this.purchaseOrderObj?.igst).toFixed(2));
    } else {
      this.totalTaxAmount = Number((Number(this.purchaseOrderObj?.cgst) + Number(this.purchaseOrderObj?.sgst)).toFixed(2));
    }

    const defaultTermsAndConditions = [
      // {
      //   term: '1.CONFIRMATION OF ORDER',
      //   description: 'The confirmation of this order shall constitute the contract and shall be given in writing within four days of receipt of this order failing of which, acceptance will be presumed to have been given to the Supplier.'
      // },
      // {
      //   term: '2.PRICES',
      //   description: 'The prices charged for the materials supplied under the contract shall in no event exceed the lowest price at which the Supplier sells the materials of the identical description to any other party during the period of contract. It is understood that there will be no revision of prices during the period of contract.'
      // },
      // {
      //   term: '3.ACCEPTABILITY OF MATERIALS SUPPLIED AND REJECTIONS',
      //   description: 'All items supplied by the Supplier against this order should be in accordance and in full conformity with our specifications, drawings and samples, if any approved by the Company. All items manufactured by the Supplier according to the Company\'s blueprints drawings/designs/manufacturing data/specifications or information pertaining thereto received shall not be utilized by the Supplier or anyone on the Supplier\'s behalf for the purpose of sale, manufacture or any other purpose.'
      // },
      // {
      //   term: '4.WARRANTY',
      //   description: 'The Supplier warrants that all goods/services to be furnished under this order shall be free from all defects latent or inherent, and faults in materials, workmanship or manufacture. This warranty shall survive inspection of, payment for and acceptance of goods but shall expire (except in respect of complaints notified to the Supplier prior to such date) 12 months after the receipt at the Company\'s Works.'
      // },
      // {
      //   term: '5.INSPECTION AND APPROVAL',
      //   description: 'Materials purchased are subject to the Company\'s inspection and approval at the Company\'s Works, regarding quantity and specifications. No payments shall be made without such approval. The Company\'s inspection does not relieve the Supplier of guarantee or responsibility to furnish satisfactory materials. If all or any of the materials are not of the quality specified or required, they may be either rejected or accepted at a price fixed by the Company. The Company\'s decision as to rejection and the price fixed for acceptance shall be final and binding on the Supplier. The Supplier will be responsible for and liable to replace or repair rejected Items at the Company\'s Option and free of cost to the company within a reasonable time at the place of supply. Materials found defective during the warranty period will also be rejected. The Company reserves the right to deduct the value of rejected materials from the Supplier\'s bills or debit it to the Supplier\'s account and pay for the materials at the contracted price as and when replacements are made. In the event of unreasonable delay on the Supplier\'s part in the replacement of rejected goods, the Company reserves the right to cancel the contract and buy the options from open market and recover the loss if any from the Supplier.'
      // },
      // {
      //   term: '6.COLLECTION OF REJECTED MATERIALS',
      //   description: 'The Supplier will arrange to collect at his cost the rejected Materials within a week from the receipt of such Information. During this period the materials will be stored by the Company at the Supplier\'s risk. If the supplier fails to collect the rejected materials within this period, the Company shall be entitled to dispose it off and remit the proceeds there from to the Supplier after retaining actual disposal costs incurred by the company. The Supplier must correctly account for raw materials or other stores delivered by the company for manufacture of material by this order and in the event of any unaccounted shortfalls or damage the Supplier must reimburse the company with the costs as determined by the Company.'
      // },
      // {
      //   term: '7.DELIVERY',
      //   description: 'Time of Delivery is the essence of this order. In case of delay of execution of this order the Company may:\na. recover from the Supplier by way of liquidated damages a sum of 5% of the price of the items not delivered for a month or part of month or\nb. cancel the contract and / or\nc. Purchase in the open market on the Supplier\'s account and recover the losses or damages suffered from the Supplier. The Company\'s right to cancel the order will be without liability or waiver of any other remedies, if deliveries are not affected as specified herein. All such written delivery authorizations shall be deemed to be incorporated herein and made part thereof. In case the Supplier fails to deliver materials strictly within the delivery schedule and dispatch the same by any costlier mode of transport including by air on their own or on the company\'s request, the entire additional expenditure will have to be borne by the Supplier.'
      // },
      // {
      //   term: '8.INDEMNITY',
      //   description: 'It is expressly understood that the supplier agrees to indemnify the company against injury or damage caused to any other person or property while loading or unloading the goods.'
      // },
      // {
      //   term: '9.PAYMENT TERMS AND SETTLEMENT OF BILLS',
      //   description: 'Supplier\'s bill must be in triplicate and contain:\na. The Company\'s Purchase Order No and Date. (This must be shown on the supply challans, packing lists, invoice packages etc.)\nb. Supplier\'s challan No and date\nc. Place of supply\nd. Sales Tax Regn No in absence of this we accept no responsibility for delay in payment or for short receipt of the materials in transit.\nInvoices must contain such rate & expenses as expressed clearly in the purchase order shall not be payable by the Company.'
      // },
      // {
      //   term: '10.PAYMENT METHODS',
      //   description: 'All Payments shall be made either\na. By acceptance of B/E or Hundi under BMS\nb. A/c Payee Cheque only.\nGoods Dispatched by document through bank will not be accepted unless by Company\'s prior consent. Bank collection Charges if any will be to the Supplier\'s account.'
      // },
      // {
      //   term: '10.INTEREST',
      //   description: 'No Interest will be payable on overdue accounts unless previously agreed upon.'
      // },
      // {
      //   term: '11.LEGAL ASPECTS',
      //   description: 'Acceptance of any of the goods shall not discharge the Supplier from Liability for damages or other legal remedy for breach of conditions or warranty contained herein or implied by law.'
      // },
      // {
      //   term: '12.FORCE MAJEURE',
      //   description: 'The Company will not be in any way liable for non-performance either in whole or in part of any contract for any delay in performance thereof in consequence of strike, shortage of labor or lockout, breakdown or accident to machinery or other accident or whatever nature and all causes of whatsoever nature beyond the company\'s control. Under such circumstances, the Company reserves the right to rescind the contract either in whole or in part.'
      // },
      // {
      //   term: '13.AUTHORIZED ORDERS',
      //   description: 'AI Fhakama TST India Pvt Ltd (The Company) is not responsible for any order placed other than by the Manager or an authorized person.'
      // },
      // {
      //   term: '14.GENERAL',
      //   description: 'a. In the Event of any contradictions between the above conditions of the seller, the buyer\'s condition will prevail.\nb. This contract, shall be deemed to have been made at Sy. No. 53, Lakkenahalli Village, Solur Hobli, Magadi Taluk, Bangalore - 562127, and all suits and proceedings relating to this contract shall be instituted in any court of competent jurisdiction in BANGALORE DISTRICT, KARNATAKA only.\nc. Any dispute or claim arising out of this order/ contract shall be referred for arbitration (and the place of arbitration being the city of BANGALORE DISTRICT, KARNATAKA), in accordance with the rules provided under the Indian arbitration act; 1940.'
      // }
    ];

    this.defaultTermsAndConditions = defaultTermsAndConditions;

    this.stageDetails = await this.getApprovalStageDetails() || [];
    this.getApprovalDetails(this.stageDetails);
  }

  // Method to load ALL data from secure storage
  async loadAllDataFromSecureStorage(): Promise<void> {
    try {
      // Get all data in parallel
      const results = await Promise.all([
        this.secureStorage.getItem('branchaddress'),
        this.secureStorage.getItem('branchlogo'),
        this.secureStorage.getItem('branchName'),
        this.secureStorage.getItem('branchEmail'),
        this.secureStorage.getItem('branchPhoneNo'),
        this.secureStorage.getItem('branchGst'),
        this.secureStorage.getItem('branchCountry'),
        this.secureStorage.getItem('branchPinCode'),
        this.secureStorage.getItem('branchState'),
        this.secureStorage.getItem('stateCode'),
        this.secureStorage.getItem('branchCity'),
        this.secureStorage.getItem('branchCinCode')
      ]) as (string | null)[];

      // Assign all values
      this.registeredAddress = results[0] || '';
      this.companyLogo = results[1] || '';
      this.logo = results[1] || '';
      this.companyName = results[2] || '';
      this.companyEmail = results[3] || '';
      this.companyPhoneNo = results[4] || '';
      this.gstNo = results[5] || '';
      this.country = results[6] || '';
      this.pinCode = results[7] || '';
      this.stateName = results[8] || '';
      this.stateCode = results[9] || '';
      this.city = results[10] || '';
      this.cinNo = results[11] || '';

      console.log('All data loaded from secure storage successfully');
      
    } catch (error) {
      console.error('Error loading data from secure storage:', error);
      
      // Initialize all to empty strings
      this.registeredAddress = '';
      this.companyLogo = '';
      this.logo = '';
      this.companyName = '';
      this.companyEmail = '';
      this.companyPhoneNo = '';
      this.gstNo = '';
      this.country = '';
      this.pinCode = '';
      this.stateName = '';
      this.stateCode = '';
      this.city = '';
      this.cinNo = '';
    }
  }

  // Alternative: Load data individually (simpler but slower)
  async loadDataIndividually(): Promise<void> {
    try {
      this.registeredAddress = await this.secureStorage.getItem('branchaddress') as string || '';
      this.companyLogo = await this.secureStorage.getItem('branchlogo') as string || '';
      this.logo = this.companyLogo;
      this.companyName = await this.secureStorage.getItem('branchName') as string || '';
      this.companyEmail = await this.secureStorage.getItem('branchEmail') as string || '';
      this.companyPhoneNo = await this.secureStorage.getItem('branchPhoneNo') as string || '';
      this.gstNo = await this.secureStorage.getItem('branchGst') as string || '';
      this.country = await this.secureStorage.getItem('branchCountry') as string || '';
      this.pinCode = await this.secureStorage.getItem('branchPinCode') as string || '';
      this.stateName = await this.secureStorage.getItem('branchState') as string || '';
      this.stateCode = await this.secureStorage.getItem('stateCode') as string || '';
      this.city = await this.secureStorage.getItem('branchCity') as string || '';
      this.cinNo = await this.secureStorage.getItem('branchCinCode') as string || '';
      
    } catch (error) {
      console.error('Error loading data individually:', error);
      // Initialize all to empty
      this.registeredAddress = '';
      this.companyLogo = '';
      this.logo = '';
      this.companyName = '';
      this.companyEmail = '';
      this.companyPhoneNo = '';
      this.gstNo = '';
      this.country = '';
      this.pinCode = '';
      this.stateName = '';
      this.stateCode = '';
      this.city = '';
      this.cinNo = '';
    }
  }

  constructor(private _decimalPipe: DecimalPipe, private apiService: ApiService) { }

  getTextarea(desc: any) {
    desc = desc.replace(/\\n/g, '\n');
    return desc ? desc.split('\n') : [];
  }

  amountInWord(number: any) {
    if (number < 0) return false;

    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (number === 0) {
      this.netPayWords = 'Zero Rupees and Zero Paisa only';
      return 'Zero Rupees and Zero Paisa only';
    }

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
    const [integerPart, decimalPart] = number.toString().split('.');
    const integerResult = translate(parseInt(integerPart, 10));
    const decimalResult = decimalPart ? `${translate(parseInt(decimalPart, 10))} Paisa` : 'Zero Paisa';
    const result = `${integerResult.trim()} Rupees and ${decimalResult} only`.trim();
    this.netPayWords = result;
    return result;
  }

  // TO DECIMAL VALUE
  transformDecimal(num) {
    return num ? this._decimalPipe.transform(num, '1.2-2') : "0.00";
  }

  getApprovalStageDetails() {
    return new Promise((resolve) => {
      const id = this.purchaseOrderObj?.id;
      const permissionCode = this.purchaseOrderObj?.approval_permission_code;
      this.apiService.get(`${ServiceUrlConstants.PURCHASE_ORDER_CRUD}${id}`, {
        approval_stage_detail_fields: 'stage_name,approval_by,modified_date,approval_status,permission_code,comments',
        required_fields: 'approval_stages',
        permission_code: JSON.stringify(permissionCode)
      }).subscribe((res: any) => {
        resolve(res?.approval_stages)
      })
    })
  }

  getApprovalDetails(data: any = []) {
    const managing_director = data.filter((ele) => ele?.permission_code === 'custom_approval_stage_po_managing_director');
    const manager = data.filter((ele) => ele?.permission_code === 'custom_approval_stage_po_manager');
    
    if (manager?.length) {
      this.approvedBy = manager[0]?.approval_by ? manager[0]?.approval_by : this.approvedBy;
    }
    if (managing_director?.length) {
      this.authorizedBy = managing_director[0]?.approval_by ? managing_director[0]?.approval_by : this.authorizedBy;
      if (!manager?.length) {
        this.approvedBy = managing_director[0]?.approval_by ? managing_director[0]?.approval_by : this.authorizedBy;
      }
    }
  }

  getLowerCase(address) {
    if (address) {
      if (address.toLowerCase().includes('gstin/uin')) {
        return address;
      }
      return address.toLowerCase();
    }
    return "";
  }
}