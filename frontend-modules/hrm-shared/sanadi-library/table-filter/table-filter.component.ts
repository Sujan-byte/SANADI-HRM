import { CommonModule, DecimalPipe } from '@angular/common';
import { PermissionCheckService } from 'src/app/modules/hrm-shared/core/shared/services/permission-check.service';
import { Component, EventEmitter, Input, Output, Signal, ViewChild, inject, input, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ColumnFilter, Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { map, switchMap } from 'rxjs';
import { DialogComponent } from './dialog/dialog.component';
import { InputTextModule } from 'primeng/inputtext';
import { DialogFooterComponent } from './dialog/dialog-footer/dialog-footer.component';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ApiService } from 'src/app/core/services/api.service';
import { MenuModule } from 'primeng/menu';
import { FlexLayoutModule } from '../flex-layout/module';
import { Router } from '@angular/router';
import { ProgressKnobComponent } from 'src/app/modules/hrm-shared/core/shared/components/progress-knob/progress-knob.component';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ReceiptBuilderComponent } from '../dynamic-print-receipt-generator/components/receipt-builder/receipt-builder.component';
import { SidebarModule } from 'primeng/sidebar';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { CalendarModule } from 'primeng/calendar';
import * as moment from 'moment';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DialogHeaderComponent } from './dialog/dialog-header/dialog-header.component';
import { cloneDeep } from 'lodash';
import { FormSettingModelComponent } from './form-setting-model/form-setting-model.component';
import { FormModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/form-setting.model';
import { ToastModule } from 'primeng/toast';
import { ActionConfig, ExportModel, TableFilterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { ExportFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/app-forms/export-form.config.service';
import { PrintTemplateService } from '../dynamic-print-receipt-generator/components/services/print-template.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NgxSpinnerService } from 'ngx-spinner';

export interface UpdateConfigModel {
  config: any;
  item: any;
}

@Component({
  selector: 'sanadi-table-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ConfirmPopupModule,
    TranslateModule,
    FlexLayoutModule,
    MenuModule,
    // ProgressKnobComponent,
    ReceiptBuilderComponent,
    SidebarModule,
    CalendarModule,
    TagModule,
    DropdownModule,
    FormSettingModelComponent,
    ToastModule,
    NgxExtendedPdfViewerModule
  ],
  providers: [DialogService, DecimalPipe],
  templateUrl: './table-filter.component.html',
  styleUrl: './table-filter.component.scss',
})
export class TableFilterComponent {
  dataSource = [];
  @Input() config: any;
  formConfig = input<any>([]);
  ref: DynamicDialogRef | undefined;
  page: number = 1;
  filteredColumns: Array<any> = [];
  loading: boolean = false;
  totalRecords: number = 0;
  selectedList: any[] = [];

  apiService = inject(ApiService);
  dialogService = inject(DialogService);
  public _dialogHandlerService = inject(DialogHandlerService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private _sharedService = inject(SharedService);
  private readonly router = inject(Router);
  private _decimalPipe = inject(DecimalPipe);
  private readonly printTemplateService = inject(PrintTemplateService);
  items: MenuItem[];
  isActive: boolean = true;
  showPrintModifier: any;
  receiptBuilderConfig: { type: string, value?: any, disablePrintFunction?: Function, disablePrint?: boolean, dynamicPrint?: boolean, formUrl?: string, copyAs?:string }
  searchText: string = "";
  @ViewChild('filter') columnFilter: ColumnFilter;
  @ViewChild('dt') table: Table;
  @ViewChild('importFileInput') importFileInput: any;

  // IMPORT
  importing: boolean = false;

  // Form Settings
  columnSetting: boolean = false;
  columnSettigFields: any = [];
  formSettigFields: any;
  formId: any = '';
  formObject: FormModel | any = {};
  formFields: any[] = [];
  // PRINT
  printFields = signal([]);
  printConfig = signal({});

  printPdfSrc: any;
  public _spinner = inject(NgxSpinnerService);

  // EXPORT FIELDS
  private readonly exportForm = inject(ExportFormConfig);

  private readonly permissionCheckService = inject(PermissionCheckService);

  constructor() { }

  // Declarative permission gating: a form sets config.exportPermission /
  // action.permission instead of computing disabled state itself. Falls back to the
  // existing config?.disableExport flag for callers still setting that directly.
  isExportDisabled(): boolean {
    if (this.config?.disableExport) return true;
    return this.config?.exportPermission ? !this.permissionCheckService.hasPermission(this.config.exportPermission) : false;
  }

  isActionPermissionDisabled(action: any): boolean {
    return action?.permission ? !this.permissionCheckService.hasPermission(action.permission) : false;
  }

  // IMPORT
  isImportDisabled(): boolean {
    return this.config?.importConfig?.permission ? !this.permissionCheckService.hasPermission(this.config.importConfig.permission) : false;
  }

  triggerImport(fileInput: HTMLInputElement) {
    fileInput.value = '';
    fileInput.click();
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.config?.importConfig?.url) {
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    this.importing = true;
    this.apiService.post(this.config.importConfig.url, formData).subscribe((response: any) => {
      this.importing = false;
      if (!response) {
        return;
      }
      const failedRows = (response.results || []).filter((row: any) => row.status === 'error');
      if (response.created > 0) {
        this.messageService.add({
          key: 'toaster',
          severity: 'success',
          summary: 'Imported',
          detail: `${response.created} of ${response.total} row(s) imported successfully.`,
          life: 5000,
        });
        this.getApiDataByActivatedRoute(this.getCurrentPage());
      }
      if (failedRows.length > 0) {
        const summary = failedRows
          .slice(0, 5)
          .map((row: any) => `Row ${row.row}: ${Object.values(row.errors || {}).join(', ')}`)
          .join(' | ');
        this.messageService.add({
          key: 'toaster',
          severity: 'warn',
          summary: `${failedRows.length} row(s) failed`,
          detail: `${summary}${failedRows.length > 5 ? ' ...' : ''}`,
          life: 10000,
        });
      }
    });
  }

  async ngOnInit() {
    // this.getApiDataByActivatedRoute(this.getCurrentPage());
    this.items = [
      {
        label: 'Active',
        icon: 'pi pi-refresh',
        action: 'Active',
        tooltip: 'Active list',
        command: (event) => {
          this.onClickMenuItem(event);
        },
        disabled: this.config?.toolBarActionConfig?.activeButton === false,
      },
      {
        label: 'InActive',
        icon: 'pi pi-times',
        action: 'Inactive',
        tooltip: 'Inactive list',
        command: (event) => {
          this.onClickMenuItem(event);
        },
        disabled: this.config?.toolBarActionConfig?.inActiveButton === false,
      },
      {
        label: 'Clear',
        icon: 'pi pi-filter',
        action: 'Clear',
        tooltip: 'Clear Filters',
        command: (event) => {
          this.onClickMenuItem(event);
        },
      },
      {
        label: 'Export',
        icon: 'pi pi-upload',
        action: 'Export',
        tooltip: 'Export',
        command: (event) => {
          this.onClickMenuItem(event);
        },
        disabled: this.config?.hideExport,
      },
    ];

    if (this.config?.importConfig) {
      this.items.push({
        label: 'Import',
        icon: 'pi pi-download',
        action: 'Import',
        tooltip: 'Import',
        command: () => {
          this.triggerImport(this.importFileInput?.nativeElement);
        },
        disabled: this.isImportDisabled(),
      });
    }

    if (this.config?.formSettingModel?.show) {
      this.formSettigFields = this.config?.formSettingModel?.formSettingFields || {};
      this.formObject = await this.getFormSetting();
      if (Object.keys(this.formObject)?.length) {
        this.formId = this.formObject?.id;
        this.formSettigFields.dataSource = this.formObject?.form_value;
      }
    }
  }

  async onAction(event: Event, item, action: ActionConfig, actionMenu) {
    if (action.actionType === 'EDIT') {
      // let config = cloneDeep(this.config) issue with loadash and ng2 extended pdf
      const config = { ...this.config };
      if (this.config.isShowDialog) {
        if (action?.getById && item?.id) {
          let resObj = await this.getApiDataByID(item?.id)
          if (typeof action?.updateData === 'function') {
            const result = await action?.updateData(resObj);
            if (result) {
              resObj = result;
            }
          }
          if (action?.onClick && typeof action?.onClick === 'function') {
            action.onClick({ formData: resObj, formFields: this.config.data?.formFields, config: config });
          }

          this.show(resObj, true, config);
        }
        else {
          this.show(item, true);
        }
      }
      else {
        this.router.navigate([`/${this.config.parentRoute}${item.id}`], {
          // queryParams: { 
          //   formName: this.config.formName,
          //   id:item.id
          // },
          state: {
            id: item.id,
            item: item,
            config: this.config
          }
        })
      }
    } else if (action.actionType === 'DELETE') {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: `Are you sure you want to ${action?.tooltip ?? 'Deactivate'}?`,
        icon: 'pi pi-exclamation-triangle',

        accept: () => {
          this.apiService
            .delete(this.config.url.delete, item.id)
            .pipe(
              switchMap((response: any) => {
                console.log("response", response)
                if (response === null) {
                  this.messageService.add({
                    key: 'toaster',
                    severity: 'success',
                    summary: `${action?.tooltip ? action.tooltip + 'd' : 'Deactivated'}`,
                    detail: `Successfully  ${action?.tooltip ? action.tooltip + 'd' : 'Deactivated'} the record`,
                    life: 3000,
                  });
                }
                if (this.dataSource?.length === 1 && this.page > 1) {
                  this.page--
                }
                let queryParams = { ...this.getCurrentPage(), is_active: true }
                if (this.config.params?.get) {
                  const configParams = this.config.params?.get;
                  queryParams = { ...queryParams, ...configParams }
                }
                return this.apiService.get(
                  this.config.url.get,
                  queryParams
                );
              })
            )
            .subscribe((response: any) => {
              // console.log("response in Delete Action", response)
              this.totalRecords = response.count;
              this.dataSource = response.results;
            });
        },
        reject: () => {
          this.messageService.add({
            key: 'toaster',
            severity: 'error',
            summary: 'Rejected',
            detail: 'You have rejected',
            life: 3000,
          });
        },
      });
    } else if (action.actionType === 'PRINT') {
      if (item?.id) {
        this.receiptBuilderConfig = { ...action?.receiptBuilderConfig};
        if (this.receiptBuilderConfig?.dynamicPrint) {
          try {
            await this.loadDynamicTemplate(item?.id, this.receiptBuilderConfig?.formUrl,this.receiptBuilderConfig?.copyAs);
            this.showPrintModifier = true;
          } catch {
            // loadDynamicTemplate already surfaced a toast with the real
            // error - just don't open the (empty) print modifier on failure.
          }
        }
        else {
          const resObj = await this.getApiDataByID(item?.id);
          this.receiptBuilderConfig = { ...this.receiptBuilderConfig, value: resObj };
          this.generateFields();
          this.printConfig.set({
            disabled: this.receiptBuilderConfig?.disablePrintFunction ? this.protectFunction(this.receiptBuilderConfig?.disablePrintFunction, this.receiptBuilderConfig?.value) : this.receiptBuilderConfig?.disablePrint,
          })
          this.showPrintModifier = true;
        }
      }
    } else if (action.actionType === 'RESTORE') {
      if (item?.id) {
        let resObj: any = await this.getApiDataByID(item?.id)
        if (Object.keys(resObj).length) {
          resObj.is_active = true;
          resObj.is_restore = true;   //important for Audit Log

          // check local component service exists
          if (this.config?.localCompService) {
            resObj = await this.config?.localCompService?.onSaveFormData(resObj, [], action.actionType);
          }

          await this.updateApiByID(item?.id, resObj);
          if (this.dataSource?.length === 1 && this.page > 1) {
            this.page--
          }
        }
        this.getApiDataByActivatedRoute(this.getCurrentPage());
      }

    } else if (action?.actionType === 'MENU') {
      actionMenu.toggle(event);
    } else {
      if (typeof (action?.onClick) === 'function') {
        const result = await action?.onClick(event, item, action);
        if (result) {
          this.getApiDataByActivatedRoute(this.getCurrentPage());
        }
      }
    }
  }

  // SHOW FORM DIALOGUE
  async show(item?: any, isEditMode: boolean = false, config: TableFilterFormConfig = this.config) {
    // console.log("config", this.config, this.formConfig());
    // AUTO GENERATED CODE
    if (!isEditMode) {
      if (config?.autoGeneratedCode) {
        const autoGeneratedCode = await this.apiService.post(config?.autoGeneratedCode?.url, config?.autoGeneratedCode?.data).toPromise();
        config.dialogData[config?.autoGeneratedCode?.key] = typeof autoGeneratedCode === 'string' ? autoGeneratedCode : '';
      }
      item = { ...item, ...config?.dialogData };
    }
    if (typeof config?.customShow === 'function') {
      const response = await config?.customShow(item, isEditMode, config);
      if (response) {
        this.isActive = true;
        let queryParams = { ...this.getCurrentPage(), is_active: true }
        if (this.config.params?.get) {
          const configParams = this.config.params?.get;
          queryParams = { ...queryParams, ...configParams }
        }
        this.apiService.get(this.config.url.get, queryParams).subscribe((response: any) => {
          this.totalRecords = response.count;
          this.dataSource = response.results;
        });
      }
      return;
    }
    if (typeof config?.updateConfig === 'function') {
      const updateConfig: UpdateConfigModel = await config?.updateConfig(config, item);
      if ('config' in updateConfig)
        config = updateConfig?.config;
      if ('item' in updateConfig)
        item = updateConfig?.item;
    }
    if (config.isShowDialog) {
      config['dialogService'] = this.dialogService;
      // console.log("form config ", this.formConfig())
      this.ref = this.dialogService.open(DialogComponent, {
        header: config.pageTitle,
        width: config.dialogConfig ? (config.dialogConfig?.width ?? '100%') : '100%',
        height: config.dialogConfig ? (config.dialogConfig?.height ?? '100%') : '100%',
        contentStyle: { overflow: 'auto' },
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw',
        },
        dismissableMask: false,
        appendTo: 'body',
        maximizable: config.dialogConfig ? (config.dialogConfig?.maximizable ?? true) : true,
        closeOnEscape: config?.closeOnEscape ?? true,
        closable: config?.closable ?? true,
        data: {
          config: config,
          form: this.formConfig(),
          item: item,
          old_item: item,
          isEditMode: isEditMode,
          initialData: config.dialogData,
          formSetting: {
            isUpdate: this.formSettigFields?.isUpdate,
            updateFields: this.formSettigFields?.isUpdate ? this.updateFormFields.bind(this) : '',
          }
        },
        templates: {
          footer: config?.isShowFooter ? undefined : DialogFooterComponent,
          header: config.dialogConfig?.headerActions ? DialogHeaderComponent : undefined,
        },
      });
      this.ref.onClose.subscribe((response: any) => {
        if (response) {
          if (typeof config?.dialogueResponse === 'function') {
            config?.dialogueResponse(response);
          }
          if (response) {
            this.isActive = true;
            this.getList();
          }
          if (config?.onCloseGetList) {
            this.getList();
          }
        }
      });
    }
    else {
      this.router.navigate([`/${this.config.parentRoute}`], {
        // queryParams: { 
        //   formName: this.config.formName
        // },
        state: {
          item: item,
          config: this.config
        }
      })
    }

    if (!this.config.dialogConfig || this.config.dialogConfig?.maximizable) {
      this.dialogService.dialogComponentRefMap.forEach(x => {
        x.instance.maximized = true;
      });
    }
  }

  // GET LIST
  getList() {
    let queryParams = { ...this.getCurrentPage(), is_active: true }
    if (this.config.params?.get) {
      const configParams = this.config.params?.get;
      queryParams = { ...queryParams, ...configParams }
    }
    this.apiService.get(this.config.url.get, queryParams).subscribe((response: any) => {
      this.totalRecords = response.count;
      this.dataSource = response.results;
    });
  }

  // This function is triggered when the user navigates to the next page or when triggers column filter in the table.
  nextPage(event: TableLazyLoadEvent) {
    // console.log("filter", event)
    // console.log("event", event)
    // Set loading to true to indicate that data is being loaded.
    this.loading = true;
    // Calculate the current page based on the provided event parameters.
    this.page = event.first / event.rows + 1;
    // Initialize the array to store column filters.
    this.filteredColumns = [];

    // Check if filters are applied in the table event.
    if (event.filters) {
      // Iterate through each filter and add it to the filteredColumns array.
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray;
        if (filter) {
          this.handleFilterColumns(columnName, filter);
        }
      }
    }

    // Server-side sort param (DRF ?ordering=<field> / -<field>) when a sortable
    // column header is clicked; empty object when no sort is active.
    const ordering = this.getOrderingParam(event);

    // Check if any filters are applied.
    if (this.filteredColumns.length > 0) {
      // Merge filters and pagination parameters for the API request.
      const mergedParams = Object.assign({}, ...this.filteredColumns, this.getCurrentPage(), ordering);
      // Make an API request using the merged parameters.
      this.getApiDataByActivatedRoute(mergedParams);
    } else {
      // console.log("layze", event.globalFilter)
      const queryParams = event.globalFilter

        ? { ...this.getCurrentPage(), search: event.globalFilter, ...ordering }
        : { ...this.getCurrentPage(), ...ordering };
      // if (this.page !== 1) {
      this.getApiDataByActivatedRoute(queryParams);
      // }
    }
  }

  // Build the DRF ordering query param from the lazy-load sort event.
  // sortOrder: 1 = ascending (field), -1 = descending (-field).
  private getOrderingParam(event: TableLazyLoadEvent): { ordering?: string } {
    const sortField = event?.sortField;
    if (!sortField || Array.isArray(sortField)) {
      return {};
    }
    return { ordering: event?.sortOrder === -1 ? `-${sortField}` : sortField };
  }

  // Global search for table
  globalSearch(event, dt) {
    dt.filterGlobal(event.target.value);
    // console.log("globalSearch", event.target.value)
  }

  // Fetch data based on the route configuration when no filters are applied.
  getApiDataByActivatedRoute(queryParams: Object) {
    // console.log("getApiDataByActivatedRoute", queryParams)
    this.loading = true;
    if (this.config.params?.get) {
      const configParams = this.config.params?.get;
      queryParams = { ...queryParams, ...configParams }
    }
    queryParams = { ...queryParams, is_active: this.isActive };
    this.apiService
      .get(this.config.url.get, queryParams)
      .subscribe((res: any) => {
        if (res?.results) {
          this.loading = false;
          this.totalRecords = res.count;
          this.dataSource = res.results
        }
      });
  }

  getApiDataByID(id: number) {
    return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .get(`${this.config.url.get_by_pk ?? this.config.url.get}${id}`)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
  }

 getCurrentPage() {
    return {
        page: this.page,
        page_size: 20
    };
}

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }

  checkProtection(action, product) {
    return Object.keys(action.protect).some(key => {
      // console.log("key",key,action.protect[key],product[key],product)
      if (Array.isArray(action.protect[key])) {
        return action.protect[key].includes(product[key]);
      } else if (typeof action.protect[key] === 'string') {
        return product[key] === action.protect[key];
      } else if (typeof action.protect[key] === 'boolean') {
        return product[key] === action.protect[key];
      }
      else {
        return false;
      }
    });
  }

  protectFunction(val: Function, product: any) {
    // console.log('protectFunction', val(product));
    return val(product);
  }

  clearFilters(table: Table) {
    table.clearFilterValues();
    this.filteredColumns = [];
    this.searchText = "";
    this.selectedList = [];
    table.reset();
  }

  generateFields() {
    let printFields = [
      {
        type: this.receiptBuilderConfig?.type,
        value: this.receiptBuilderConfig?.value,
      },
    ]
    this.printFields.set(printFields);
    // console.log('generateFields', this.printFields());
    // return printFields;
  }

  updateApiByID(id: number, data: any) {
    // console.log("config id", this.config, this.ref)
    let key: any;
    if (data instanceof FormData) {
      key = data.get('is_restore');
    } else if (typeof data === 'object' && data !== null) {
      key = data?.is_restore;
    } 

    if (key){
      return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .put(`${this.config.url.get}${id}/?is_restore=${key}`, data)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
    }
    else{
      return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .put(`${this.config.url.get}${id}/`, data)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
    }
  }

  handleFilterColumns(columnName, filterArray) {
    if (filterArray?.length) {
      filterArray.forEach(filter => {
        if (filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            this.filteredColumns.push({
              [modifiedColumnName]: moment(filter.value).format('DD-MM-YYYY'),
            });
          } else {
            let key = '';
            if (filter.matchMode == "exact") {
              key = columnName;
            } else {
              key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            }
            this.filteredColumns.push({ [key]: filter.value });
          }
        }
      });
    }
  }

  // FORM SETTING
  onClickFormSetting(event: any, dt: Table) {
    // console.log('form setting', this.config, this.formObject);
    this.columnSetting = true;
  }

  async close() {
    if (this.formObject?.id) {
      this.formObject = await this.getFormSetting();
      if (Object.keys(this.formObject)?.length) {
        this.formId = this.formObject?.id;
        this.formSettigFields.dataSource = this.formObject?.form_value;
      }
    } else {
      this.formSettigFields.dataSource = this.formSettigFields?.baseDataSource;
    }
    // console.log('close', this.formSettigFields?.baseDataSource, this.formSettigFields?.dataSource, this.formObject?.form_value);
  }

  async saveSetting(event: FormModel) {
    // console.log('saveSetting', event);
    let data: any = {
      id: this.formId ? this.formId : '',
      form_key: this.formSettigFields?.key,
      form_value: event?.form_setting || [],
    }

    this.formObject = await this.saveFormSetting(data);
    this.formId = this.formObject?.id;
    if (Object.keys(this.formObject)?.length) {
      this._sharedService.handleSuccess('Form Setting Saved Succesfully');
    }
    this.columnSetting = false;
  }

  async saveFormSetting(formData: FormModel) {
    if (formData?.id)
      return this.apiService.put(`${this.formSettigFields?.url?.put}${formData?.id}/`, formData).toPromise();
    else
      return this.apiService.post(this.formSettigFields?.url?.post, formData).toPromise();
  }

  selectAll(event: any) {
    // console.log('selectAll', event);
  }

  // SET SETTINGS FIELDS
  getSettingFields() {
    return this.formSettigFields;
  }

  async getFormSetting() {
    const response: any = await this.apiService.get(this.formSettigFields?.url?.get, this.formSettigFields?.params?.get).toPromise();
    return response?.results?.length ? response?.results[0] : {};
  }

  async updateFormFields(formFields: any[]) {
    return await this.formSettigFields?.updateFields(formFields, this.formSettigFields.dataSource);
  }
  // FORM SETTING

  // EXPORT LOGIC
  async export(event: any, table: Table) {
    // console.log('event', event, table);
    // console.log('selectedList', this.selectedList);
    const selectedListIds: any[] = this.selectedList.map((ele: any) => {
      return ele.id
    });
    // console.log('selectedListIds', selectedListIds);
    const exportDialogConfig: Signal<DynamicDialogConfig> = signal({
      pageTitle: 'Export',
      dialogConfig: {
        height: '30%',
        width: '30%'
      },
      isShowDialog: true,
      submitButtonLabel: 'Save',
      customDialog: true,
      dismissableMask: true,
      maximizable: false,
      position: 'top-right',
      isShowFooter: false,
      config: this.config,
      dialogData: {
        selected_list_ids: selectedListIds || [],
        export_fields: this.getExportFields(),
        params: this.generateExportParams(table),
      },
    });
    const dialogResponse: ExportModel = await this._dialogHandlerService.openDialog(exportDialogConfig(), this.exportForm.ExportForm());
    // console.log('dialogResponse', dialogResponse);
  }

  getExportFields() {
    if (this.config?.exportFields?.length) {
      return this.config.exportFields;
    }

    return (this.config?.tableHeaders || [])
      .filter((header: any) => header?.field || header?.representationField)
      .map((header: any, index: number) => ({
        id: index + 1,
        field: header?.representationField || header?.field,
        label: this.translate.instant(header?.label || header?.field),
        ...(header?.fieldType ? { type: header.fieldType } : {}),
      }));
  }

  // GENERATE PARAMS FOR EXPORT
  generateExportParams(table: Table) {
    const filterQuery = this.exportFilter(table.filters);
    const configParams = this.config?.params?.get || {};
    // console.log('configParams', configParams);
    if ('required_fields' in configParams) {
      delete configParams.required_fields;
    }
    // console.log('configParams', configParams);
    return { ...configParams, ...filterQuery, is_active: this.isActive, fileName: this.config?.exportFileName ?? this.config?.pageTitle };
  }

  exportExcel(table: Table) {
    const configParams = this.config.params?.get;
    // console.log("configParams", configParams, this.config, table);
    const filterQuery = this.exportFilter(table.filters);
    const export_fields = {}
    this.config.tableHeaders.forEach((item) => {
      if ('representationField' in item) {
        export_fields[item.representationField] = this.translate.instant(item.label);
      } else {
        export_fields[item.field] = this.translate.instant(item.label);
      }
    })
    // console.log("export_fields", export_fields)
    const queryParams = {
      ...configParams,
      ...filterQuery,
      is_active: this.isActive,
      fileName: this.config?.exportFileName ?? this.config?.pageTitle,
      export_fields: JSON.stringify(export_fields)
    };
    // console.log('filename', this.config?.exportFileName);
    return new Promise((resolve) => {
      this.loading = true;
      this.apiService
        .getFile(`${this.config.url.get}export_excel/`, queryParams)
        .subscribe((res: any) => {
          this.loading = false;
          resolve(res);
        });
    })
  }
exportFilter(filters: any) {
  const columnFilters: any = {};

  for (const [columnName, filterArray] of Object.entries(filters)) {

    const filter: any = Array.isArray(filterArray) ? filterArray[0] : filterArray;
    let filterKey: string;

    // Global search
    if (columnName === 'global' && filter?.value != null) {
      columnFilters['search'] = filter.value;
    }

    // Column filters
    else if (filter && filter.value != null) {

      // Date filter
      if (filter.value instanceof Date) {

        filterKey =
          filter.matchMode === FilterOptions.dateIs
            ? columnName
            : `${columnName}__${filter.matchMode?.toLowerCase()}`;

        columnFilters[filterKey] =
          moment(filter.value).format('DD-MM-YYYY'); // change to YYYY-MM-DD if backend needs
      }

      // Non-date filter
      else {

        if (filter.matchMode === 'exact') {
          filterKey = columnName;
        } else {
          filterKey = filter.matchMode
            ? `${columnName}__${filter.matchMode.toLowerCase()}`
            : columnName;
        }

        columnFilters[filterKey] = filter.value;
      }
    }
  }

  return columnFilters;
}
  // exportFilter(filters) {
  //   const columnFilters = {};

  //   for (const [columnName, filterArray] of Object.entries(filters)) {
  //     // console.log("filterArray", filterArray, columnName)
  //     const filter = filterArray[0];
  //     if (columnName === 'global' && filterArray['value'] !== null) {
  //       columnFilters['search'] = filterArray['value'];
  //     }
  //     else if (filter && filter.value !== null) {
  //       const filterKey = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
  //       columnFilters[filterKey] = filter.value;
  //     }
  //   }

  //   // console.log("this.filteredColumns", columnFilters);
  //   return columnFilters;
  // }

  isString(value: any): boolean {
    return typeof value === 'string';
  }

  displayNumber(num, format: string, locale: string) {
    if (format) {
      return this._decimalPipe.transform(num, format, locale || 'en-US');
    }
    return num;
  }

  // SET MENUITEM
  setMenuItem(item, action: any) {
    return (action?.menuItems || [])?.map(m => ({
      ...m,
      command: (event) => this.onMenuAction(event, item, action, m.subAction),
      label: m.labelFunction ? this.protectFunction(m?.labelFunction, item) : m?.label,
      icon: m.iconFunction ? this.protectFunction(m?.iconFunction, item) : m?.icon,
      tooltipFunction: m.tooltipFunction ? this.protectFunction(m?.tooltipFunction, item) : m?.tooltip,
      disabled: m?.disabledFunction ? this.protectFunction(m?.disabledFunction, item) : m?.disabled,
    }));
  }

  async onMenuAction(event: Event, item, action, subAction?: string) {
    // console.log('Sub-action:', subAction, item, action);
    if (subAction) {
      if (typeof action?.onClick === 'function') {
        const result = await action?.onClick(event, item, action, subAction);
        if (result) {
          this.getApiDataByActivatedRoute(this.getCurrentPage());
        }
      }
    }
  }

  onClickMenuItem(event: any) {
    // console.log('onClickMenuItem', event);
    const action = event?.item;
    if (action?.action === 'Active') {
      this.page = 1;
      this.isActive = true;
      this.dataSource = [];
      this.getApiDataByActivatedRoute(this.getCurrentPage());
    } else if (action?.action === 'Inactive') {
      this.page = 1;
      this.isActive = false;
      this.dataSource = [];
      this.getApiDataByActivatedRoute(this.getCurrentPage());
    } else if (action?.action === 'Clear') {
      this.clearFilters(this.table);
    } else if (action?.action === 'Export') {
      this.export(false, this.table)
    }
  }

  async loadDynamicTemplate(id, url,copyAs:any) {
    return new Promise((resolve, reject) => {
      this._spinner.show();
      this.printTemplateService.renderTemplate(id, url,copyAs).subscribe({
        next: (blob) => {
          this._spinner.hide();
          if (this.printPdfSrc) {
            URL.revokeObjectURL(this.printPdfSrc);
          }
          this.printPdfSrc = URL.createObjectURL(blob);
          resolve(blob);
        },
        error: async (err) => {
          this._spinner.hide();
          // The backend returns a JSON error (e.g. {"detail": "Template not found"})
          // but renderTemplate() requests responseType: 'blob', so the error body
          // arrives as a Blob too - read it back out to show the real message.
          let detail = 'Unable to generate the print preview.';
          if (err?.error instanceof Blob) {
            try {
              const text = await err.error.text();
              detail = JSON.parse(text)?.detail || detail;
            } catch {
              // keep the generic message if the error body isn't JSON
            }
          } else if (err?.error?.detail) {
            detail = err.error.detail;
          }
          this.messageService.add({
            key: 'toaster',
            severity: 'error',
            summary: 'Print failed',
            detail,
            life: 6000,
          });
          reject(err);
        },
      });
    })


  }



}
