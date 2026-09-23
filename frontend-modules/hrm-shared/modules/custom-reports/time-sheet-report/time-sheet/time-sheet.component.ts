import { HttpClient } from '@angular/common/http';
import { Component, HostListener, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiService } from 'src/app/core/services/api.service';
import { ApprovalOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPrintModule } from 'ngx-print';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimeSheetTableComponent } from '../time-sheet-table/time-sheet-table.component';
@Component({
  selector: 'sanadi-time-sheet',
  standalone: true,
  imports: [DropdownModule, AutoCompleteModule, FormsModule, ButtonModule, CardModule, TableModule, PaginatorModule, ToolbarModule, TabMenuModule, InputTextModule, NgxPrintModule, ContextMenuModule, ProgressBarModule, CommonModule, TimeSheetTableComponent],
  templateUrl: './time-sheet.component.html',
  styleUrl: './time-sheet.component.scss'
})
export class TimeSheetComponent {
  innerHeight: string;
  mainScreenHeight: string;
  conetxtMenuSelectedProduct: any;
  items: MenuItem[] = [
    { label: 'Products', icon: 'pi pi-box', key: ApprovalOptions.PENDING_APPROVAL, command: ($event) => { [this.onChangeTab($event)] } },
    { label: 'History', icon: 'pi pi-history', key: ApprovalOptions.APPROVED, command: ($event) => { [this.onSelectFetchHistory(), this.isHistoryTab = true] } }
  ]
  loading: boolean = false;
  totalRecords: number = 0;
  products = []
  page: any = 1;
  rows: any = 15;
  dataFetchingStatus: string = ApprovalOptions.PENDING_APPROVAL
  searchText: string = undefined;
  approvalOptions: any[] = [
    { label: 'Approved', value: ApprovalOptions.APPROVED },
    { label: 'Pending Approval', value: ApprovalOptions.PENDING_APPROVAL },
    { label: 'Rejected', value: ApprovalOptions.REJECTED }
  ];
  stagesDetails: any = []
  selectedData: any;
  selectedEvent: any;
  remarksRef: DynamicDialogRef | undefined;
  dialogService = inject(DialogService)
  tableScrollHeight: any = '45vh';
  // productDetails: ProductModel;
  progressValue: number = 0;
  successResponse: boolean;
  assemblyHistory = [];
  isHistoryTab: boolean = false;

  constructor(private location: Location, private apiService: ApiService, private sharedService: SharedService, private http: HttpClient) { }

  ngOnInit(): void {
    this.getScreenInnerHeight();
    this.getMainScreenHeight();
    this.getProductDetails();
  }

  getScreenInnerHeight() {
    const viewportHeight = window.innerHeight;
    const percentageHeight = 68.8 + ((viewportHeight - 600) * 0.1);
    const clampedHeight = Math.max(68.8, Math.min(100, percentageHeight));
    let scrollHeight = clampedHeight - 17;
    this.innerHeight = `${clampedHeight}vh`;
    this.tableScrollHeight = `${scrollHeight}vh`;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.getScreenInnerHeight();
    this.getMainScreenHeight();
  }

  getProductDetails() {
    // this.loading = true;
    // let params = { page: this.page, page_size: this.rows, required_fields: 'id,item_name,model,brand,is_serial_number_required', is_serial_number_required: true }
    // if (this.searchText)
    //   params['search'] = this.searchText;
    // this.apiService.get(`${ServiceUrlConstants.PRODUCT_MASTER_CRUD}`, params).subscribe(
    //   (res: any) => {
    //     this.products = res.results;
    //     this.totalRecords = res.count;
    //     this.loading = false;
    //   },
    //   (error) => {
    //     this.loading = false;
    //   }
    // );
  }

  onPageChange(event: any) {
    this.page = event.page + 1;
    this.rows = event.rows;
    this.getProductDetails();
  }

  onChangeTab(event) {
    this.isHistoryTab = false;
    this.selectedData = undefined;
    this.products = [];
    this.page = 1;
    this.getProductDetails();
  }


  globalSearch(event) {
    if (this.isHistoryTab) {

    }
    else {

    }
  }


  checkClearence(event) {
    if (!event?.target.value) {
      this.searchText = "";
      this.getProductDetails();
    }
  }


  goBack() {
    this.location.back();
  }

  getMainScreenHeight() {
    const viewportHeight = window.innerHeight;
    const percentageHeight = 85.5 + ((viewportHeight - 600) * 0.1);
    const clampedHeight = Math.max(85.5, Math.min(100, percentageHeight));
    this.mainScreenHeight = `${clampedHeight}vh`;
  }

  async onSelectRow(event) {
    this.stagesDetails = [];
    this.selectedData = event?.data;
  }


  // modified
  saveProductAssembly() {
    this.progressValue = 0;
    let intervalId: any;
    intervalId = this.startProgressBarInterval();
  
  }


  checkApprovalDisabled() {
    return !this.selectedData;
  }


  destroyLocalVariables() {
    this.stagesDetails = [];
    this.setproductDetails();
  }



  onContextMenuSelect(event) {
    this.selectedEvent = event;
  }


  // approval status
  async showRemarks() {
    if (this.stagesDetails?.length <= 0) {
      this.stagesDetails = await this.getApprovalStageDetails();
    }
    // this.remarksRef = this.dialogService.open(RemarksDialogComponent, {
    //   header: 'Approval Stages',
    //   // width: '25rem',
    //   contentStyle: { overflow: 'auto' },
    //   baseZIndex: 10000,
    //   maximizable: false,
    //   position: 'bottom-right',
    //   closable: true,
    //   dismissableMask: true,
    //   data: {
    //     stageDetails: this.deepCopy(this.stagesDetails ?? []),
    //     // formData: this.deepCopy(this.productDetails)
    //   }
    // });

    this.remarksRef.onClose.subscribe((res) => {
      if (res) {
        this.stagesDetails = res?.stageDetails;
        // this.productDetails = res?.formData;
      }
    });
  }

  getApprovalStageDetails() {
    // return new Promise((resolve) => {
    //   const id = this.productDetails.id;
    //   const stageName = this.productDetails.stage_name;
    //   const permissionCode = this.productDetails.approval_permission_code;
    //   this.apiService.get(`${ServiceUrlConstants.INSPECTION_REPORT}${id}`, { approval_stage_detail_fields: 'stage_name,approval_by,modified_date,approval_status,permission_code,comments', required_fields: 'approval_stages', stage_name: stageName, permission_code: JSON.stringify(permissionCode) }).subscribe((res: any) => {
    //     resolve(res?.approval_stages)
    //   })
    // })
  }

  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }


  setproductDetails() {
    // this.productDetails = {
    //   [InspectionReportEnum.inspectionType]: undefined,
    //   [InspectionReportEnum.approvalStatus]: ApprovalOptions.PENDING_APPROVAL
    // };
  }

  getFormDisable() {
    return false;
    // return this.selectedData && this.pav.selectedSerialNumber && !this.pav.isShowingHistory ? false : true;
  }

  onClear() {
    this.destroyLocalVariables();
    this.selectedData = undefined;
    this.conetxtMenuSelectedProduct = undefined;
  }


  getSelectedData() {
    return this.selectedData;
  }


  startProgressBarInterval() {
    this.successResponse = true;
    const intervalId = setInterval(() => {
      this.progressValue = this.progressValue + Math.floor(Math.random() * 10) + 2;
      if (this.progressValue > 100) {
        clearInterval(intervalId);
        this.progressValue = 97;
      }
    }, 300);
    return intervalId;
  }


  onSelectFetchHistory() {
    // this.loading = true;
    // let params = { page: this.page, page_size: this.rows }
    // if (this.searchText)
    //   params['search'] = this.searchText;
    // this.apiService.get(`${PRODUCT_ASSEMBLY_CRUD}`, params).subscribe(
    //   (res: any) => {
    //     this.assemblyHistory = res.results;
    //     this.totalRecords = res.count;
    //     this.loading = false;
    //   },
    //   (error) => {
    //     this.loading = false;
    //   }
    // );
  }


  onSelectProductHistory(event) {
    this.selectedData = event?.data?.selected_product;
    // this.pav.data = event?.data?.assembly_json;
    // this.pav.selectedSerialNumber = event?.data?.serial_number;
    // this.pav.isShowingHistory = true;
    // this.pav.serialNumbers.set([{ id: event?.data?.serial_number, serial_number: event?.data?.sl_number }]);
  }

  checkIsPrintDisabled() {
    // if (this.pav) {
    //   return this.pav.selectedSerialNumber ? false : true;
    // }
    // else {
    //   return true;
    // }
  }
}
