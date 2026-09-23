import { CommonModule, formatDate } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as moment from 'moment';
import { MenuItem } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { Table, TableFilterEvent, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from 'src/app/core/services/api.service';
import { TimeSheetDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/attendance.enum';
import { TimeSheetDetails } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/attendance.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { TsMoreOptionsComponent } from '../ts-more-options/ts-more-options.component';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TimeSheetMoreDetailsComponent } from '../time-sheet-more-details/time-sheet-more-details.component';
import { BadgeModule } from 'primeng/badge';
import { ApprovalOptions, BranchTypes, FilterOptions, matchModeOptionsDate } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TagModule } from 'primeng/tag';
import { TimeSheetHistoryComponent } from '../time-sheet-history/time-sheet-history.component';
import { DialogModule } from 'primeng/dialog';
import { TimesheetCalculator } from './time-sheet-calculation-sfic';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { HttpParams } from '@angular/common/http';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { AsficTimesheetCalculator } from './time-sheet-calculation-asfic';
import { ConsolidatedAsficTimesheetCalculator } from './time-sheet-calculation-asfic-consolidated';

@Component({
  selector: 'sanadi-time-sheet-table',
  standalone: true,
  imports: [TableModule, CommonModule, DropdownModule, FormsModule, InputTextModule, ToolbarModule, ButtonModule, CalendarModule,
    AutoCompleteModule, TooltipModule, MenuModule, TieredMenuModule, OverlayPanelModule, TsMoreOptionsComponent, ContextMenuModule, BadgeModule, TagModule, TimeSheetHistoryComponent, DialogModule,NgxPermissionsModule],
  templateUrl: './time-sheet-table.component.html',
  styleUrl: './time-sheet-table.component.scss'
})
export class TimeSheetTableComponent implements OnInit {
  timeSheetDetails: TimeSheetDetails[] = [];
  loading: boolean = false;
  totalTimeSheetRecords: number = 0;
  innerHeight: string = '71.8vh';
  @ViewChild('tb') tb: Table;
  @ViewChild(TsMoreOptionsComponent) tsmoreoptions: TsMoreOptionsComponent;
  page: number = 1;
  selectedEmployee: any;
  suggestions: any[] = [];
  departments = signal([])
  selectedDepartment: any;
  selectedToDate = moment().format('DD-MM-YYYY');
  page_size: number = 50;
  ;
  selectedFromDate;
  aggregateColumns: any;
  overallStatusWiseCount: any;
  attendanceStatusList = signal([])
  clonedTableData: { [s: string]: any } = {};
  items: MenuItem[] = [
    {
      label: 'Custom Filters',
      icon: 'pi pi-filter',
    },
    {
      label: 'Bulk Update',
      icon: 'pi pi-bolt'
    },
    {
      label: 'Consolidated',
      icon: 'pi pi-filter'
    },
    {
      label: 'Breakdown',
      icon: 'pi pi-bolt'
    }
  ]
  selectedEvent: any;
  private customDialog = inject(CustomDialogService)
  private permissionService = inject(NgxPermissionsService)
  contextitems: MenuItem[] = [
    { label: 'Copy', icon: 'pi pi-copy', command: ($event) => { this.copyTextToClipboard() } },
    { label: 'More Details', icon: 'pi pi-eye', command: ($event) => { this.onContextMoreDetails($event) } }
  ];
  conetxtMenuSelectedItem;
  viewTimeSheetHistory: boolean = false;
  private apiService = inject(ApiService)
  private sharedService = inject(SharedService)
  holidayLists: any = []
  branch: any;
  branchType = BranchTypes;
  graceDetails:any=[];
  ngOnInit(): void {
    this.branch = localStorage.getItem('b_id');
    this.getScreenInnerHeight();
    this.getDepartment();
    this.getAttendanceStatusMaster();
    this.getHolidayMasters();
    this.getGraceDetailMasters();
  }

  getTimeSheetDetailsByParams(params) {
    this.apiService.get(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}get_time_sheet`, params).subscribe((response: any) => {
      if (response) {
        this.timeSheetDetails = response?.data?.results;
        this.totalTimeSheetRecords = response?.data?.count;
        this.loading = false;
        this.aggregateColumns = response?.aggregate_columns;
        this.overallStatusWiseCount = response?.overall_status_wise_count
      }
    })
  }

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
        matchModeOptions: matchModeOptionsDate,
        isFilterRequired: true,
        filterType: 'date',
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
        label: 'Break Hrs',
        field: TimeSheetDetailsEnum.convertedBreakHrs,
        matchModeOptions: [
        ],
        isFilterRequired: false,
        editable: false,
        show:this.checkBreakColRequired(),
        // command: (item,index) => 

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

  getScreenInnerHeight() {
    const viewportHeight = window.innerHeight;
    const percentageHeight = 72 + ((viewportHeight - 600) * 0.1);
    const clampedHeight = Math.max(72, Math.min(100, percentageHeight));
    this.innerHeight = `${clampedHeight}vh`;
  }

  async nextPage(event: TableLazyLoadEvent, tb: Table) {
    console.log("event rows", event)
    this.page = event.first / event.rows + 1;
    this.page_size = event?.rows;
    const filteredColumns = [];
    if (tb.filters) {
      for (const [columnName, filterArray] of Object.entries(tb.filters)) {
        const filter = filterArray[0];
        if (filter && filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            filteredColumns.push({
              [modifiedColumnName]: moment(filter.value).format('DD-MM-YYYY'),
            });
          }
          else {
            const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            filteredColumns.push({ [key]: filter.value });
          }
        }
      }
    }
    if (filteredColumns.length > 0) {
      const mergedParams = Object.assign({}, ...filteredColumns);
      this.getTimeSheetDetailsByParams(this.handleParams({ ...mergedParams, page: this.page, page_size: event?.rows }));
    }
    else {
      const localParams = event.globalFilter
        ? this.handleParams({ page: this.page, search: event.globalFilter, page_size: event?.rows })
        : this.handleParams({ page: this.page, page_size: event?.rows });
      this.getTimeSheetDetailsByParams({ ...localParams });
    }
  }

  public disableNavigation(event: any) {
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowDown' || event.key == 'ArrowUp'
      || event.key == 'Down' || event.key == 'Up' || event.key == 'Left' || event.key == 'Right') {
      event.stopPropagation();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.getScreenInnerHeight();
  }

  handleSearch(event: AutoCompleteCompleteEvent) {
    const value = event.query;
    this.apiService.get(ServiceUrlConstants.EMPLOYEE_MASTER_CRUD, {
      search_key: "first_name,employee_code",
      search: value,
      required_fields: "id,first_name,employee_code,department,employee_card_number,reporting"
    }).subscribe((res: any) => {
      this.suggestions = res?.results;
    })
  }

  handleSelect(event) {
    this.selectedDepartment = event?.value?.department;
    console.log("employee type",this.selectedEmployee);
    this.tsmoreoptions.selectedEmployeeReportingType = this.selectedEmployee?.reporting||'All';
    if(this.tsmoreoptions.selectedEmployeeReportingType=='Direct'){
      this.tsmoreoptions.timeSheetTypes[1].hide=false;
    }
    else{
    this.tsmoreoptions.timeSheetTypes[1].hide=true;
    this.tsmoreoptions.selectedType='C'
    }

  }

  onSelectDate(type, event) {
    console.log("event date", event)
    const formattedDate = moment(event).format('DD-MM-YYYY');
    if (type == 'from') {
      this.selectedFromDate = formattedDate;
    }
    else {
      this.selectedToDate = formattedDate;
    }
  }

  handleApply() {
    this.loading = true;
    // console.log("flters", this.tb)
    this.hasFiltersGetData(this.tb);

  }

  handleParams(params) {
    if (this.selectedFromDate) {
      params['date__gte'] = this.selectedFromDate;
    }
    if (this.selectedToDate) {
      params['date__lte'] = this.selectedToDate;
    }
    if (this.selectedEmployee) {
      params['employee_code'] = this.selectedEmployee?.employee_code;
    }
    else if (this.selectedDepartment) {
      params['department'] = this.selectedDepartment;
    }

    if (this.tsmoreoptions.selectedEmployeeGroup) {
      params['employee_group'] = this.tsmoreoptions.selectedEmployeeGroup;
    }
    if (this.tsmoreoptions.selectedEmployeeType) {
      params['employee_type'] = this.tsmoreoptions.selectedEmployeeType;
    }

    if (this.tsmoreoptions.selectedType) {
      params['time_sheet_type'] = this.tsmoreoptions.selectedType;
    }

    if (this.tsmoreoptions.selectedEmployeeReportingType!=='All') {
      params['reporting'] = this.tsmoreoptions.selectedEmployeeReportingType;
    }

    params['is_processed'] = this.tsmoreoptions.isProcessed;

    return params
  }

  getDepartment() {
    this.apiService.get(ServiceUrlConstants.DEPARTMENT_CRUD).subscribe((res: any) => {
      this.departments.set(res?.results);
    })
  }

  dataTableClear() {
    this.tb.clearState();
    this.tb.clear();
  }

  clearFilters() {
    this.selectedDepartment = undefined;
    this.selectedToDate = moment().format('DD-MM-YYYY');
    this.selectedFromDate = undefined;
    this.aggregateColumns = {};
    this.overallStatusWiseCount = 0;
    this.timeSheetDetails = [];
    this.totalTimeSheetRecords = 0;
    this.page = 1;
    this.selectedEmployee = undefined;
    this.dataTableClear();
  }

  async exportToExcel() {
    const exportFields = {};
    this.getTableSchema().forEach((item) => {
      if(item?.show??true){
        exportFields[item.field] = item.label;
      }

    })
    const filterQuery: any = this.exportFilter(this.tb.filters);
    let queryParams = {
      ...filterQuery,
      export_fields: JSON.stringify(exportFields),
      fileName: await this.getFileName()
    };
    queryParams = this.handleParams(queryParams);

    return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .getFile(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}time_sheet_export_excel/`, queryParams)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
  }

  exportFilter(filters) {
    const columnFilters = {};
    for (const [columnName, filterArray] of Object.entries(filters)) {
      const filter = filterArray[0];
        if (filter && filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            columnFilters[modifiedColumnName]= moment(filter.value).format('DD-MM-YYYY');
          }
          else {
            const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            columnFilters[key]= filter.value;
          }
        }
      // const filter = filterArray[0];
      // if (filter && filter.value !== null) {
      //   const filterKey = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
      //   columnFilters[filterKey] = filter.value;
      // }
    }
    return columnFilters;
  }

  async getFileName(): Promise<string> {
    if (this.selectedEmployee) {
      return this.selectedEmployee?.first_name;
    } else if (this.selectedDepartment) {
      const departmentName: any = await this.getDepartmentNameById(this.selectedDepartment);
      return departmentName;
    } else {
      return "";
    }
  }

  getDepartmentNameById(id) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.DEPARTMENT_CRUD}${id}`).subscribe((res: any) => {
        resolve(res?.department_name);
      })
    })
  }

  getAttendanceStatusMaster() {
    this.apiService.get(`${HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD}`).subscribe((res: any) => {
      this.attendanceStatusList.set(res?.results);
    })
  }

  async onRowEditSave(item) {
    // if (this.branch == BranchTypes.ASFIC) {
    //   this.onRowSaveForBreakHrCal(item);
    // }
    // else{
    await this.updateAttendanceDetails(item);
    // }
  }

  onRowEditCancel(item, index) {
    // if (this.branch == BranchTypes.ASFIC) {
    //        this.onRowCancelForAsfic(item, index);
    // }
    // else{
      this.timeSheetDetails[index] = this.clonedTableData[item.id];
      delete this.clonedTableData[item.id];
      item.editing = false;
    // }
  }

  onChangeCellValue(event, item, field) {
    if (!this.clonedTableData[item.id]) {
      this.clonedTableData[item.id] = { ...item };
    }
    item[field] = event.target.value;
    item.editing = true;
  }

  updateAttendanceDetails(item) {
    return new Promise((resolve) => {
      let params = new HttpParams();

      if (this.check_permission('hrm_main.custom_can_approve_timesheet')) {
        item.approval_status = ApprovalOptions.APPROVED;
      }
      else {
        params = new HttpParams().set('time_sheet_editing', true)
      }
      delete item?.editing;
      this.apiService.put(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}${item?.id}/`, item, params).subscribe((res) => {
        console.log("res", res)
        item.editing = false;
        const pageParams = { page: 1, page_size: this.page_size }
        this.handleParams(pageParams);
        this.loading = true;
        this.getFooterDetailsByParams(pageParams);
        this.sharedService.handleSuccess('Saved Successfully!')

      })
    })
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

  cloneDropdownRow(item) {
    if (!this.clonedTableData[item.id]) {
      this.clonedTableData[item.id] = { ...item };
    }
    item.editing = true;
  }

  onClearDepartment() {
    this.selectedEmployee = undefined;
    this.timeSheetDetails = [];
    this.dataTableClear();
  }

  async exportToPdf() {
    const exportFields = {};
    this.getTableSchema().forEach((item) => {
      if(item?.show??true){
        exportFields[item.field] = item.label;
      }

    })
    const filterQuery: any = this.exportFilter(this.tb.filters);
    let queryParams = {
      ...filterQuery,
      export_fields: JSON.stringify(exportFields),
      fileName: await this.getFileName()
    };
    queryParams = this.handleParams(queryParams);

    return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .getFile(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}time_sheet_export_pdf/`, queryParams)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
  }

  onChangeTime(event, item, field,index) {

    console.log("event", event.target.value)
    if (!this.clonedTableData[item.id]) {
      this.clonedTableData[item.id] = { ...item };
    }
    item[field] = event.target.value || '00:00';
    item.editing = true;
    let timeCalculator;

    // if(this.branch == BranchTypes.ASFIC){
    //   const is_consolidated = ['19', '18', '11', '17',19,18,11,17].includes(item.status);
    //   if((this.tsmoreoptions.selectedType=='C'&& this.tsmoreoptions.selectedEmployeeReportingType!='Direct')||is_consolidated){
    //     timeCalculator = new ConsolidatedAsficTimesheetCalculator(this.holidayLists,this.graceDetails);
    //     timeCalculator.calculateTimeSheetRowData(item,this.timeSheetDetails,this.clonedTableData);
    //   }
    //   else{
    //     timeCalculator = new AsficTimesheetCalculator(this.holidayLists,this.graceDetails);
    //     const filteredTimeSheetList=timeCalculator.getFilteredTimeSheetList(item, this.timeSheetDetails);
    //     timeCalculator.calculateTimeSheetRowData(item,this.timeSheetDetails,this.clonedTableData,index,filteredTimeSheetList);
    //   }
    // }
    // else {
      timeCalculator = new TimesheetCalculator(this.holidayLists,this.graceDetails)
      timeCalculator.calculateTimeSheetRowData(item, this.timeSheetDetails);
    // }
  }

  copyTextToClipboard() {
    const targetElement = this.selectedEvent.originalEvent.target;

    if (targetElement && targetElement.textContent) {
      navigator.clipboard.writeText(targetElement.textContent)
        .then(() => console.log('Copied successfully'))
        .catch((err) => console.error('Failed to copy: ', err));
    }
  }

  onContextMoreDetails(event) {
    this.openMoreDetailsDialog();
  }

  onContextMenuSelect(event) {
    this.selectedEvent = event;
  }


  async openMoreDetailsDialog() {
    if(this.conetxtMenuSelectedItem?.[TimeSheetDetailsEnum.status]!='-1'){
     const res:any=await this.customDialog.openDialog({ dialogConfig: { width: '50vw', height: '80vh' }, showHeader: false }, TimeSheetMoreDetailsComponent, this.conetxtMenuSelectedItem)
     console.log("res",res);
     if(res){
      if (!this.clonedTableData[res.id]) {
        this.clonedTableData[res.id] = { ...res };
      }    }
    }
    else{
      this.sharedService.handleWarning('More details not available for break records!')
    }
  }

  checkFilterApplied() {
    return this.tsmoreoptions && (this.tsmoreoptions.selectedEmployeeType || this.tsmoreoptions.selectedEmployeeGroup || this.tsmoreoptions.selectedType == 'B' || this.tsmoreoptions.selectedEmployeeReportingType !== 'All');
  }

  onFilter(event: TableFilterEvent) {
    this.page=1;
    const filteredColumns = [];
    if (event.filters) {
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray[0];
        if (filter && filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            filteredColumns.push({
              [modifiedColumnName]: moment(filter.value).format('DD-MM-YYYY'),
            });
          }
          else {
            const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            filteredColumns.push({ [key]: filter.value });
          }
        }
      }
    }
    if (filteredColumns.length > 0) {
      const mergedParams = Object.assign({}, ...filteredColumns);
      this.getTimeSheetDetailsByParams(this.handleParams({ ...mergedParams, page: this.page, page_size: this.page_size }));
    }
    else {

      const localParams = this.handleParams({ page: this.page, page_size: this.page_size });
      this.getTimeSheetDetailsByParams({ ...localParams });
    }

  }

  onChangeStatus(event, tb) {
    console.log("event and tvb", tb, event)
  }


  onClickHistory($event) {
    this.viewTimeSheetHistory = true;
    const ref = this.customDialog.openDialog({ dialogConfig: { width: '87vw', height: '65vh' }, showHeader: false }, TimeSheetHistoryComponent, {})

  }

  onHideTimeSheetHistory() {
    this.viewTimeSheetHistory = false;
  }

  getHolidayMasters() {
    this.apiService.get(HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD,{approval_status:ApprovalOptions.APPROVED}).subscribe((res: any) => {
      if (res?.results) {
        this.holidayLists = res?.results;
      }
    })
  }

  
  getGraceDetailMasters() {
    this.apiService.get(HrmServiceUrlConstants.GRACE_DETAIL_CRUD).subscribe((res: any) => {
      if (res?.results) {
        this.graceDetails = res?.results;
      }
    })
  }

   checkIsProcessed(type, item) {
    if (type == 'status' && item?.[TimeSheetDetailsEnum.status] == '-1') {
      return true;
    }
    // else if(this.branch==BranchTypes.ASFIC&& this.tsmoreoptions.selectedEmployeeReportingType=='All'){
    //    return true;
    // }
    else{
      const canEdit =  this.check_permission('hrm_main.custom_can_edit_timesheet');
      // console.log("can edit",canEdit)
      return !canEdit;
    }
    // return this.tsmoreoptions.isProcessed ?? false;
  }

  // checkIsProcessed(type,item) {
  //   if(type=='status'&&item?.[TimeSheetDetailsEnum.status]=='-1'){
  //     return true;
  //   }
  //   else if(type=='time'&&item?.[TimeSheetDetailsEnum.status]!='-1'&&this.branch==BranchTypes.ASFIC){
  //     return true;
  //   }
  //   else{
  //     return this.tsmoreoptions.isProcessed ?? false;
  //   }
  // }

  getFooterDetailsByParams(params) {
    this.apiService.get(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}get_time_sheet`, params).subscribe((response: any) => {
      if (response) {
        this.loading = false;
        this.aggregateColumns = response?.aggregate_columns;
        this.overallStatusWiseCount = response?.overall_status_wise_count
      }
    })
  }

  onChangeStatusValue(item) {
    let timeCalculator;
    // if (BranchTypes.ASFIC) {
    //   timeCalculator = new AsficTimesheetCalculator(this.holidayLists,this.graceDetails);
    //   timeCalculator.onChangeStatus(item,this.timeSheetDetails);
    // }
    // else {
      timeCalculator = new TimesheetCalculator(this.holidayLists,this.graceDetails);
      timeCalculator.onChangeStatus(item);
    // }
  }

  check_permission(permission): boolean {
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }

  getTableScrollHeight(): string {
    const viewportHeight = window.innerHeight;

    const minHeight = 50;
    const maxHeight = 80;

    const baseHeight = 88;

    const dynamicHeight = (baseHeight * viewportHeight) / (window.screen.height);

    const clampedHeight = Math.min(maxHeight, Math.max(minHeight, dynamicHeight));

    // console.log("scroll height", clampedHeight, dynamicHeight);
    return `${clampedHeight}vh`;
  }

  hasFiltersGetData(tb: Table) {
    this.page=1;
    const filteredColumns = [];
    if (this.tb?.filters) {
      for (const [columnName, filterArray] of Object.entries(tb.filters)) {
        const filter = filterArray[0];
        if (filter && filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            filteredColumns.push({
              [modifiedColumnName]: moment(filter.value).format('DD-MM-YYYY'),
            });
          }
          else {
            const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            filteredColumns.push({ [key]: filter.value });
          }
        }
      }
    }
    if (filteredColumns.length > 0) {
      const mergedParams = Object.assign({}, ...filteredColumns);
      this.getTimeSheetDetailsByParams(this.handleParams({ ...mergedParams, page: this.page, page_size: this.page_size }));
    }
    else {
      this.dataTableClear();
      const params = { page: this.page, page_size: this.page_size }
      this.handleParams(params);
      this.getTimeSheetDetailsByParams(params);
    }
  }

// ************** ASFIC CODE STARTS ********* // 

onRowCancelForAsfic(item, index) {
  const timeCalculator = new AsficTimesheetCalculator(this.holidayLists,this.graceDetails);
  const filteredTimeSheetList = timeCalculator.getFilteredTimeSheetList(item, this.timeSheetDetails);


  if (item?.[TimeSheetDetailsEnum.status] !== '-1' && this.tsmoreoptions.selectedType=='B') {
    if (filteredTimeSheetList?.length > 1) {
      const timeSheetIndexMap = new Map(this.timeSheetDetails.map((row, i) => [row.id, i]));

      filteredTimeSheetList.forEach((ele) => {
        if (ele?.editing && ele?.id !== item?.id) {
          const rowIndex = timeSheetIndexMap.get(ele.id);
          if (rowIndex !== undefined) {
            this.timeSheetDetails[rowIndex] = this.clonedTableData[ele.id];
            ele.editing = false;
            timeCalculator.calculateTimeSheetRowData(
              this.timeSheetDetails[rowIndex],
              this.timeSheetDetails,
              this.clonedTableData,
              index,
              filteredTimeSheetList
            );
            delete this.clonedTableData[ele.id];
          }
        }
      });
    }
    else{
      this.timeSheetDetails[index] = this.clonedTableData[item.id];
      delete this.clonedTableData[item.id];
      item.editing = false;
    }
  } else {
    const is_consolidated = ['19', '18', '11', '17',19,18,11,17].includes(item.status);
   if ((this.tsmoreoptions.selectedType=='C'&& this.tsmoreoptions.selectedEmployeeReportingType!='Direct')||is_consolidated){
    this.timeSheetDetails[index] = this.clonedTableData[item.id];
    delete this.clonedTableData[item.id];
    item.editing = false;
    }
    else{
      this.timeSheetDetails[index] = this.clonedTableData[item.id];
      item.editing = false;
      timeCalculator.calculateTimeSheetRowData(
        this.timeSheetDetails[index],
        this.timeSheetDetails,
        this.clonedTableData,
        index,
        filteredTimeSheetList
      );
      delete this.clonedTableData[item.id];
    }
  }
}


onRowSaveForBreakHrCal(item){
  const timeCalculator = new AsficTimesheetCalculator(this.holidayLists,this.graceDetails);
  const filteredTimeSheetList=timeCalculator.getFilteredTimeSheetList(item,this.timeSheetDetails);
  return new Promise((resolve) => {
    let params = new HttpParams();

    if (this.check_permission('hrm_main.custom_can_approve_timesheet')) {
      item.approval_status = ApprovalOptions.APPROVED;
    }
    else {
      params = new HttpParams().set('time_sheet_editing', true)
      params = params.set('is_processed', this.tsmoreoptions.isProcessed);
    }
    filteredTimeSheetList.forEach((ele)=>{
      delete ele.editing
    })
    this.apiService.post(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}bulk-update-time-sheet/`, filteredTimeSheetList, params).subscribe((res) => {
      console.log("res", res)
      filteredTimeSheetList.forEach((ele)=>{
        ele.editing =false;
      })
      const params = { page: 1, page_size: this.page_size }
      this.handleParams(params);
      this.loading = true;
      this.getFooterDetailsByParams(params);
      this.sharedService.handleSuccess('Saved Successfully!')

    })
  })
}


checkBreakColRequired(){
  return this.branch==BranchTypes.ASFIC&&this.tsmoreoptions?.selectedEmployeeReportingType=='Direct';
}

downloadImportTemplate() {
  this.apiService.getFile(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}timesheet_import_template/`, {
    fileName: 'timesheet_import_template',
    dontUseCurrentDate: true
  }).subscribe();
}

onImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const formData = new FormData();
  formData.append('file', file);
  if (this.branch) {
    formData.append('b_id', this.branch);
  }

  this.loading = true;
  this.apiService.post(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}import_timesheet/`, formData).subscribe({
    next: (res: any) => {
      this.loading = false;
      this.sharedService.handleSuccess(res?.message || 'Import successful!');
      input.value = '';
      const params = { page: this.page, page_size: this.page_size };
      this.handleParams(params);
      this.getTimeSheetDetailsByParams(params);
    },
    error: (err) => {
      this.loading = false;
      this.sharedService.handleError(err?.error?.error || 'Import failed.');
      input.value = '';
    }
  });
}

}
