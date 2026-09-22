import { Component, HostListener, ViewChild, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AttendanceImportModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/attendance.model';
import { MaterialLibModuleModule } from 'src/app/modules/hrm-shared/material-lib-module/material-lib-module.module';
import { DynamicFormGeneratorModule } from 'src/app/modules/hrm-shared/sanadi-library/dynamic-form-generator/dynamic-form-generator.module';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import * as XLSX from 'xlsx';
import { ColumnFilter, Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import * as moment from 'moment';
import { FileUpload } from 'primeng/fileupload';
import { FlexLayoutModule } from 'src/app/modules/hrm-shared/sanadi-library/flex-layout/module';
import { Location } from '@angular/common';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { routes } from 'src/app/app.routes';
import { ActivatedRoute, Router } from '@angular/router';
import { DataImportService } from './service/data-import.service';
import { stringify } from 'querystring';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
@Component({
  selector: 'sanadi-data-import',
  standalone: true,
  imports: [TableFilterComponent, MaterialLibModuleModule,InputTextModule, TranslateModule, FlexLayoutModule, FormsModule,
    TableModule,DropdownModule],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.scss'
})
export class DataImportComponent {
  private translate = inject(TranslateService);
  private location = inject(Location);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChild('fileUploader', { static: false }) fileUploader: FileUpload;
  @ViewChild('tb') tb: Table;
  fileSelected: any = '';
  formFields: any = [];
  showdataImportFormModifier: boolean = true;
  columns: any = [];
  totalRecords = 0;
  page: number = 1;
  loading: boolean;
  searchText: any;
  searchText1: any;
  list_per_page: any;
  isToggleActive: boolean = true;
  matchModeOptions: any = 'Contains';
  selectedFilterOption: any;
  options = [];
  filteredColumns: any = [];
  progressValue: number = 0;
  successResponse: boolean;
  // private attendanceImportService:LocalCompServiceConfig = inject(AttendanceImportService);

  excelDataImportedList = [];
  selectedData = [];
  importedDataLoading: boolean = false;
  uploadedFiles = [];
  uploadProgressValue: number = 0;
  uploadSuccessResponse: boolean;
  uploading: boolean = false;

  dataTableFormInitialize: any;

  dataTableColumnSchema: { name: string; field: string; }[];
  limit = 100;
  totalImportedRecords: any = 0;
  dataTableLazy: boolean = false;
  isVirtualScrollable: boolean = true;
  dataTableSearchText: any = '';
  tempFilterdColumnsList: any = [];
  tempImportedGlobalSerachList: any = [];
  visibleDataTable: boolean = true;
  dataImportForm: AttendanceImportModel | any = {};
  dataTableForm: any = [];
  innerHeight: string='80vh';
  
  ngOnInit(): void {
    this.getScreenInnerHeight();
    let param = this.location.getState();
    if (param['id']) {
      console.log("param['id']", param['id'])
      this._dataImportService.getDataImportById(param['id']).subscribe((response) => {
        this.excelDataImportedList = response.attendance_details
        this.dataImportForm = response
        console.log("dataImportForm", this.dataImportForm)
      })
    }

    this.setdataImportFormFields();
    this.setDataTableFormInitialize();
    this.setDataTableColumnSchema();
  }

  constructor(private _sharedService: SharedService, private route: ActivatedRoute,
    private _dataImportService: DataImportService, private http: HttpClient
  ) { 
    // this.getScreenInnerHeight();
  }
  statusOptions = [
    { label: 'Absent', value: 'Absent' },
    { label: 'Half Leave', value: 'Half Leave' },
    { label: 'Present', value: 'Present' }
];

 public disableNavigation(event: any) {
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowDown' || event.key == 'ArrowUp'
      || event.key == 'Down' || event.key == 'Up' || event.key == 'Left' || event.key == 'Right') {
      event.stopPropagation();
    }
  }
  setDataTableFormInitialize() {
    this.dataTableFormInitialize = [
      { name: 'date', field: 'date' },
      { name: 'Employee Code', field: 'employee_code' },
      { name: 'Employee Name', field: 'employee_name' },
      { name: 'Login Time', field: 'login_time' },
      { name: 'Logout Time', field: 'logout_time' },
      { name: 'Working Time', field: 'working_time' },
      { name: 'Status', field: 'status' },
      { name: 'Action', field: 'Action', filter: false},
    ];
  }

  setdataImportFormFields() {
    this.formFields = [
      {
        type: 'text',
        name: 'importCode',
        label: this.translate.instant('importCode_TC'),
        placeholder: this.translate.instant('autoGenerate_TC', { label: this.translate.instant('importCode_TC') }),
        value: this.dataImportForm.importCode,
        readonly: true
      }
    ];

  }

  saveRow(rowData: any) {
    // Logic to save the row data
    console.log('Row data saved:', rowData);
    this._dataImportService.updateDataImportDetails(rowData).subscribe(
      (response) => {
        console.log("rsponse on dave", response)
        if (Object.keys(response).length != 0) {
          this._sharedService.handleSuccess(
            this.translate.instant('entityUpdateSuccessTitle_TC', { entity:response.date })
          );
        }
        else {
        }
      }
    )
  } 
  getFields() {
    return this.formFields;
  }

  goToBackLocation() {
    this.visibleDataTable = true;
    this.dataTableSearchText = '';
    this.tempFilterdColumnsList = [];
    this.tempImportedGlobalSerachList = [];
    this.excelDataImportedList = [];
    this.progressValue = 0;
    this.dataImportForm = {};
    this.setdataImportFormFields();
    this.location.back()
  }

  getTitleModifier() {
    return this.translate.instant('dataImport_TC')
  }

  onImport() {
    const intervalId = setInterval(() => {
      this.progressValue = this.progressValue + Math.floor(Math.random() * 10) + 1;
      if (this.progressValue > 100) {
        clearInterval(intervalId);
        this.progressValue = 97;
      }
    }, 700);
    // this._dataImportService.getImportFile().subscribe((response) => {
    //   console.log("resffgh",response)
    //   if (Object.keys(response).length != 0) {
    //     // if (response.results && response.results.length > 0) {
    //     this.dataImportForm = { ...response };
    //     console.log("dataImportForm",this.dataImportForm)
    //     // }
    //     this.successResponse = true;
    //     clearInterval(intervalId);
    //     this.progressValue = 100;
    //     this._sharedService.handleSuccess(
    //       this.translate.instant('entityUpdateSuccessTitle_TC', { entity: this.dataImportForm.fileName })
    //     );
    //     setTimeout(() => {
    //       this.visibleDataTable = false;
    //       setTimeout(() => this.visibleDataTable = true, 0);
    //       this.getDataImportFormList(this.page);
    //     }, 1000)
    //   }
    //   else {
    //     clearInterval(intervalId);
    //     this.successResponse = false;
    //   }
    // })
  }

  getDataTableColumnSchema() {
    // this.http.get('assets/appJson/dataImportFile.json').subscribe(
    //   list => {
    //     console.log("list", list['dataTableColumnSchema'])
    //     this.dataTableFormInitialize = list['dataTableColumnSchema'].map(element => element?.formField);
    //     this.dataTableColumnSchema = list['dataTableColumnSchema'];
    //     console.log("list", list['dataTableColumnSchema'])
    //   }
    // )
  }

  setDataTableColumnSchema() {
    this.getDataTableColumnSchema();
  }


  // ----------------File Importing Started-------------------

  // importedDataGlobalSearch(event: any, tb: any) {
  //   return tb.filterGlobal(event.target.value, 'contains');
  // }

  onUpload(uploader: FileUpload) {
    console.log("event", uploader.files)
    if (uploader.files.length) {
      this.dataImportForm.fileName = uploader.files[0].name;
      this.dataImportForm.fileSelected = uploader.files[0];
      this.saveDataImportForm(this.dataImportForm)
    }
    else {
      this._sharedService.handleWarning(this.translate.instant('pleaseChooseFile_TC'))
    }
    console.log("data import form", this.dataImportForm)
    // this.dataImportForm.fileName=uploader.file
  }

  saveDataImportForm(dataImportForm: AttendanceImportModel) {
    const intervalId = setInterval(() => {
      this.progressValue = this.progressValue + Math.floor(Math.random() * 10) + 1;
      if (this.progressValue > 100) {
        clearInterval(intervalId);
        this.progressValue = 97;
      }
    }, 700);
    const formData = new FormData();
    formData.append("import_code", dataImportForm?.importCode);
    formData.append("file_name", dataImportForm?.fileName);
    formData.append("import_file", dataImportForm.fileSelected)
    if (this.dataImportForm?.id) {
      formData.append("id", this.dataImportForm?.id);
    }
    this._dataImportService.dataImportModifier(formData).subscribe(
      (response) => {
        console.log("rsponse on dave", response)
        if (Object.keys(response).length != 0) {
          this.excelDataImportedList = response.attendance_details
          this.dataImportForm = { ...response };
          this.successResponse = true;
          clearInterval(intervalId);
          this.progressValue = 100;
          this._sharedService.handleSuccess(
            this.translate.instant('entityUpdateSuccessTitle_TC', { entity: this.dataImportForm.fileName })
          );
          setTimeout(() => {
            this.visibleDataTable = false;
            setTimeout(() => this.visibleDataTable = true, 0);
            this.location.back()
          }, 1000)
        }
        else {
          clearInterval(intervalId);
          this.successResponse = false;
        }
      }
    )
  }

  removeFile(uploader: FileUpload) {
    uploader.files = [];
    // this.dataImportForm.file = [];
    // this.dataImportForm.fileSelected = [];
  }

  getDataImportDetails(id, offset, limit, event) {
    // this._dataImportService.getDataImportDetailsListByVirtualScrollMultiQuery(id, offset, limit).subscribe((res) => {
    //   if (res) {
    //     const newArray = [...this.excelDataImportedList];
    //     newArray.splice(event.first, event.rows, ...res.data);
    //     this.excelDataImportedList = newArray;
    //     console.log("excel imported list", this.excelDataImportedList)
    //     this.totalImportedRecords = res.total_count;
    //     this.importedDataLoading = false;
    //   }
    // })
    this._dataImportService.getDataImportById(id).subscribe((response) => {
      this.excelDataImportedList = response.attendance_details
      this.dataImportForm = response
      console.log("dataImportForm", this.dataImportForm)
    })
  }
  globalSearch(event, dt) {
    dt.filterGlobal(event.target.value, 'contains');
    console.log("globalSearch",event.target.value)
  }
  
  loadLazyData(event: TableLazyLoadEvent) {
    console.log("event", event)
    let filteredColumns = [];
    if (event.filters) {
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray[0];
        if (filter && filter.value) {
          filteredColumns.push({ [columnName]: filter.value });
        }
      }
    }
    if (filteredColumns.length > 0) {
      if (event.rows == this.limit) {
        event.rows += this.limit;
      }
      this.onFilterByColumn(event, filteredColumns);
    }
    else if (event.globalFilter != undefined && event.globalFilter != '') {
      if (event.rows == this.limit) {
        event.rows += this.limit;
      }
      this.getDataImportGlobalSearch(event.globalFilter, event);
    }
    else {
      console.log("data form", this.dataImportForm)
      if (this.dataImportForm.id) {
        if (event.rows == this.limit) {
          event.rows += this.limit;
        }
        if (this.tempFilterdColumnsList.length || this.tempImportedGlobalSerachList.length) {
          this.excelDataImportedList = [];
          this.tempFilterdColumnsList = [];
          this.tempImportedGlobalSerachList = [];
        }
        // this.importedDataLoading = true;
        event.rows = event.first + event.rows;
        console.log("id",this.dataImportForm.id)
        this.getDataImportDetails(this.dataImportForm.id, event.first, event.rows, event);
      }
    }
  }
  // loadLazyData(event: TableLazyLoadEvent) {
  //   console.log("event", event);
  //   console.log("layze", event.globalFilter)
  //   let filteredColumns = [];
  //   let search = '';

  //   // Check if filters exist and process them
  //   if (event.filters) {
  //     for (const [columnName, filterArray] of Object.entries(event.filters)) {
  //       const filter = filterArray[0];
  //       if (filter && filter.value) {
  //         filteredColumns.push({ [columnName]: filter.value });
  //       }
  //     }
  //   }
  //   // Check if filteredColumns exist, no need for extra check
  //   if (filteredColumns.length > 0) {
  //     this.onFilterByColumn(event, filteredColumns);
  //   } else {
  //     // Handle other cases
  //     console.log("data form", this.dataImportForm);
  //     if (this.dataImportForm) {
  //       if (event.rows === this.limit) {
  //         event.rows += this.limit;
  //       }
  //       if (this.tempFilterdColumnsList.length || this.tempImportedGlobalSerachList.length) {
  //         this.excelDataImportedList = [];
  //         this.tempFilterdColumnsList = [];
  //         this.tempImportedGlobalSerachList = [];
  //       }
  //       else if (event.globalFilter != undefined && event.globalFilter != '') {
  //         if (event.rows == this.limit) {
  //           event.rows += this.limit;
  //         }
  //         this.getDataImportGlobalSearch(event.globalFilter, event);
  //         console.log("getDataImportGlobalSearch form", event.globalFilter, event);
  //       }
  //       event.rows = event.first + event.rows;
  //       console.log("id",this.dataImportForm.id)
  //       this.getDataImportDetails(this.dataImportForm.id, event.first, event.rows, event);
  //     }
  //   }
  // }

  dataTableClear(table: Table) {
    console.log("table", table, table.filters)
    this.dataTableSearchText = '';
    table.clearState();
    table.clearState()
    table.clear();
  }

  onFilterByColumn(event, filteredColumns) {
    if (this.dataImportForm) {
      event.rows = event.first + event.rows;
      const mergedParams = Object.assign({}, ...filteredColumns);
      console.log("mergedParams, event.first, event.rows, this.dataImportForm.id", mergedParams, event.first, event.rows, this.dataImportForm.id)

      this._dataImportService.getDataImportDetailsListByMultipleParameters(mergedParams, event.first, event.rows, this.dataImportForm.id).subscribe((response) => {
        if (response) {
          this.importedDataLoading = false;
          const newArray = [...this.tempFilterdColumnsList];
          newArray.splice(event.first, event.rows, ...response.data);
          this.tempFilterdColumnsList = newArray;
          this.excelDataImportedList = this.tempFilterdColumnsList;
        }
      })
    }
  }

  getDataImportGlobalSearch(key: any, event) {
    if (this.dataImportForm) {
      event.rows = event.first + event.rows;
      this._dataImportService.getDataImportGlobalSearchList(key, this.dataImportForm.id, event.first, event.rows).subscribe((res) => {
        if (res) {
          const newArray = [...this.tempImportedGlobalSerachList];
          newArray.splice(event.first, event.rows, ...res.data);
          this.tempImportedGlobalSerachList = newArray;
          this.totalImportedRecords = res.total_count;
          this.excelDataImportedList = this.tempImportedGlobalSerachList;
          this.importedDataLoading = false;
        }
      })
    }

  }

  // globalSearch(event, dt) {
  //   dt.filterGlobal(event.target.value);
  //   console.log("globalSearch",event.target.value)
  // }
  getScreenInnerHeight(){
    this.innerHeight = window.innerHeight* 0.8 + 'px';
    // console.log("dt",this.tb,this,this.innerHeight)
    if(this.tb){
      this.tb.scrollHeight=this.innerHeight;
      this.tb.resetScrollTop();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.getScreenInnerHeight();
  }

}
