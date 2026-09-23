import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from 'src/app/core/services/api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApprovalOptions, BranchTypes, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TimeSheetDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/attendance.enum';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { TimeSheetMoreDetailsComponent } from 'src/app/modules/hrm-shared/modules/custom-reports/time-sheet-report/time-sheet-more-details/time-sheet-more-details.component';
import { ConsolidatedAsficTimesheetCalculator } from 'src/app/modules/hrm-shared/modules/custom-reports/time-sheet-report/time-sheet-table/time-sheet-calculation-asfic-consolidated';
import { TimesheetCalculator } from 'src/app/modules/hrm-shared/modules/custom-reports/time-sheet-report/time-sheet-table/time-sheet-calculation-sfic';

@Component({
  selector: 'sanadi-timesheet-approvals',
  standalone: true,
  imports: [TableModule, CommonModule, DropdownModule, FormsModule, TooltipModule, ButtonModule, InputTextModule, ConfirmPopupModule, ContextMenuModule],
  templateUrl: './timesheet-approvals.component.html',
  styleUrl: './timesheet-approvals.component.scss'
})
export class TimesheetApprovalsComponent implements AfterViewInit {
  timeSheetDetails = signal([]);
  attendanceStatusList = signal([]);
  private apiService = inject(ApiService)
  private sharedService = inject(SharedService)
  private spinner = inject(NgxSpinnerService)
  private readonly secureStorage = inject(EncryptedStorageService);
  loading: boolean = false;
  totalTimeSheetRecords: number = 0;
  holidayLists: any = [];
  clonedTableData: { [s: string]: any } = {};
  confirmationService = inject(ConfirmationService);
  innerHeight: string = '72.8vh';
  @ViewChild('tb') tb: Table;
  contextitems: MenuItem[] = [
    { label: 'Copy', icon: 'pi pi-copy', command: ($event) => { this.copyTextToClipboard() } },
    { label: 'More Details', icon: 'pi pi-eye', command: ($event) => { this.onContextMoreDetails($event) } }
  ];
  selectedEvent: any;
  conetxtMenuSelectedItem;
  graceDetails: any = [];
  private customDialog = inject(CustomDialogService);
  branch: any;
  getTableSchema() {
    return [
      {
        label: 'Employee Name',
        field: TimeSheetDetailsEnum.employeeName,
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
        editable: false
      },
      {
        label: 'Date',
        field: TimeSheetDetailsEnum.conDate,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'In Time',
        field: TimeSheetDetailsEnum.loginTime,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: true,
        type: 'time'
      },
      {
        label: 'Out Time',
        field: TimeSheetDetailsEnum.logoutTime,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: true,
        type: 'time'
      },
      {
        label: 'Work Hrs',
        field: TimeSheetDetailsEnum.conTotalHours,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'Base Hrs',
        field: TimeSheetDetailsEnum.conWorkingTime,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'Status',
        field: TimeSheetDetailsEnum.status,
        matchModeOptions: [
        ],
        isFilterRequired: true,
        editable: true,
        type: 'status',
        filterType: "dropdown",
        filterOptions: signal(this.attendanceStatusList())
      },
      {
        label: 'OT 1',
        field: TimeSheetDetailsEnum.conOtHrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'OT 2',
        field: TimeSheetDetailsEnum.comOt2Hrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'HOT Hrs',
        field: TimeSheetDetailsEnum.conHotHrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'Less Hrs',
        field: TimeSheetDetailsEnum.conLessHrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      },
      {
        label: 'Extra Hrs',
        field: TimeSheetDetailsEnum.conExtraHrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false
      }
    ]
  }


  getAttendanceStatusMaster() {
    this.apiService.get(`${HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD}`).subscribe((res: any) => {
      this.attendanceStatusList.set(res?.results);
    })
  }

  onChangeStatusValue(item) {
    const timeCalculator = new TimesheetCalculator(this.holidayLists, this.graceDetails)
    timeCalculator.onChangeStatus(item);
  }

  getHolidayMasters() {
    this.apiService.get(HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD).subscribe((res: any) => {
      if (res?.results) {
        this.holidayLists = res?.results;
      }
    })
  }

  onChangeTime(event, item, field) {
    let timeCalculator;
    if (this.branch == BranchTypes.ASFIC && item?.reporting == 'Direct') {
      this.sharedService.handleWarning(
        'Direct employee timesheets cannot be edited here. Please use the timesheet module.'
      );
      return;
    }
    else{
      if (!this.clonedTableData[item.id]) {
        this.clonedTableData[item.id] = { ...item };
      }
      item[field] = event.target.value || '00:00';
      if (this.branch == BranchTypes.ASFIC) {
        timeCalculator = new ConsolidatedAsficTimesheetCalculator(this.holidayLists, this.graceDetails);
        timeCalculator.calculateTimeSheetRowData(item, this.timeSheetDetails, this.clonedTableData);
      }
      else {
        timeCalculator = new TimesheetCalculator(this.holidayLists, this.graceDetails)
        timeCalculator.calculateTimeSheetRowData(item);
      }
      item.editing = true;
    }
  }

  cloneDropdownRow(item) {
    if (!this.clonedTableData[item.id]) {
      this.clonedTableData[item.id] = { ...item };
    }
    item.editing = true;
  }

  public disableNavigation(event: any) {
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowDown' || event.key == 'ArrowUp'
      || event.key == 'Down' || event.key == 'Up' || event.key == 'Left' || event.key == 'Right') {
      event.stopPropagation();
    }
  }

  onChangeCellValue(event, item, field) {
    if (!this.clonedTableData[item.id]) {
      this.clonedTableData[item.id] = { ...item };
    }
    item[field] = event.target.value;
    item.editing = true;
  }


  getStatusText(value) {
    if (this.attendanceStatusList()?.length) {
      const statusObj = this.attendanceStatusList().find((ele) => ele?.code == value);
      return statusObj?.status_name;
    }
    else {
      return "";
    }

  }

  async onRowEditSave(item) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to Approve`,
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        item.editing = false;
        await this.updateAttendanceDetails(item);
      },
      reject: () => {
      },
    });
  }

  updateAttendanceDetails(item) {
    return new Promise((resolve) => {
      item.edited_data = null;
      item.approval_status = ApprovalOptions.APPROVED;
      this.apiService.put(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}${item?.id}/`, item).subscribe((res) => {
        this.getTimesheetPendingApprovals();
        this.sharedService.handleSuccess('Saved Successfully!')

      })
    })
  }


  onRowEditCancel(item, index) {
    this.timeSheetDetails()[index] = this.clonedTableData[item.id];
    delete this.clonedTableData[item.id];
    item.editing = false;
  }

  getTimesheetPendingApprovals() {
    const params = { time_sheet: true, approval_time_sheet: true }
    this.apiService.get(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}get_time_sheet`, params).subscribe({
      next: (res: any) => {
        this.timeSheetDetails.set(res)
        this.totalTimeSheetRecords = res?.length;
        this.spinner.hide();
      },
      error: () => this.spinner.hide()
    })
  }

  getGraceDetailMasters() {
    this.apiService.get(HrmServiceUrlConstants.GRACE_DETAIL_CRUD).subscribe((res: any) => {
      if (res?.results) {
        this.graceDetails = res?.results;
      }
    })
  }

  async ngAfterViewInit(): Promise<void> {
    this.spinner.show();
    this.branch = await this.secureStorage.getItem('b_id');
    this.getHolidayMasters();
    this.getAttendanceStatusMaster();
    this.getTimesheetPendingApprovals();
    this.getScreenInnerHeight();
    this.getGraceDetailMasters();
  }


  getScreenInnerHeight() {
    this.innerHeight = window.innerHeight * 0.74 + 'px';
    if (this.tb) {
      this.tb.scrollHeight = this.innerHeight;
      this.tb.resetScrollTop();
    }
  }


  copyTextToClipboard() {
    const targetElement = this.selectedEvent.originalEvent.target;

    if (targetElement && targetElement.textContent) {
      navigator.clipboard.writeText(targetElement.textContent)
        .then(() => {})
        .catch((err) => console.error('Failed to copy: ', err));
    }
  }

  onContextMoreDetails(event) {
    this.openMoreDetailsDialog();
  }

  onContextMenuSelect(event) {
    this.selectedEvent = event;
  }


  openMoreDetailsDialog() {
    if (this.conetxtMenuSelectedItem?.[TimeSheetDetailsEnum.status] != '-1') {
      this.customDialog.openDialog({ dialogConfig: { width: '50vw', height: '80vh' }, showHeader: false }, TimeSheetMoreDetailsComponent, this.conetxtMenuSelectedItem)
    }
    else {
      this.sharedService.handleWarning('More details not available for break records!')
    }
  }

}
