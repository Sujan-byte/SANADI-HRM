import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { GlobalMasterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/global-master-from.config.service';
import { DynamicTableModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { GlobalMasterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/global-master.model';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { CustomDialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/custom-dialog/custom-dialog.component';
import { DynamicTableComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';
import { SelectListComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/select-list/select-list.component';

@Injectable({
  providedIn: 'root'
})
export class GlobalMasterService {

  public translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);
  public _dialogHandlerService = inject(DialogHandlerService);
  public _apiService = inject(ApiService);

  constructor() { }

  // CREATE GLOBAL MASTER
  private readonly globalMasterDialogConfig = signal({});
  private readonly globalMasterForm = inject(GlobalMasterFormConfig);

  setGlobalMasterDialogConfig(pageTitle: any, data: GlobalMasterModel) {
    this.globalMasterDialogConfig.set({
      pageTitle: pageTitle,
      dialogConfig: {
        height: '40%',
        width: '35%'
      },
      isShowDialog: true,
      submitButtonLabel: 'Save',
      customDialog: true,
      dialogData: data
    })
  }

  async createGlobalMaster(formValue: any, object: any = { pageTitle: 'Create', data: {} }, formFields: any = []) {
    this.setGlobalMasterDialogConfig(object?.pageTitle, object?.data);
    const dialogResponse: any = await this._customDialogService.openFormDialog(this.globalMasterDialogConfig(), CustomDialogComponent, this.globalMasterForm.GlobalMasterForm(), object?.data);
    // console.log('createGlobalMaster', dialogResponse);
    const response: any = await this.saveGlobalMaster(dialogResponse, `${ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD}`);
    // console.log('globalMaster', response);
    return { response: response };
  }

  async saveGlobalMaster(formValue: GlobalMasterModel, url: string) {
    return await this._apiService.post(url, formValue).toPromise();
  }

  // SELECT
  async selectGlobalMaster(formValue: any, object: any = { pageTitle: 'Select', data: {} }) {
    const globalMasterConfig = {
      pageTitle: object?.pageTitle,
      dialogConfig: {
        height: '90%',
        width: '35%'
      },
    };

    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: object?.columnHeader, field: 'name', filter: false },
      ],
      // selectionMode: 'single',
      selectionMode: object?.selectionMode || 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: ['name'],
      paginator: true,
      scrollable: true,
      lazy: false,
      fontSize: '14px',
      // queryParams: object?.queryParams || {},
      // url: `${ServiceUrlConstants.GLOBAL_MASTER_CRUD}`,
      tableName: 'table',
      list: await this.getDataByAPI(object?.queryParams || {}),
      selectedArray: object?.selectedArray || [],
      height: '60vh',
      width: '30vw',
      bindOption: this.updateGlobalMasterOptions.bind(this),
    };
    const response: any = await this._customDialogService.openDialog(globalMasterConfig, SelectListComponent, dynamicObject);
    // console.log('selectUnitMasterr response', response);
    return { selected: response };
  }

  async getDataByAPI(queryParams: any) {
    const response = await this._apiService.get(ServiceUrlConstants.GLOBAL_MASTER_CRUD, queryParams).toPromise();
    return this.updateGlobalMasterOptions(response);
  }

  updateGlobalMasterOptions(response: any) {
    if (response?.results?.length) {
      const options = (<any>response)?.results[0]?.global_value;
      return options;
    }
  }

  // MULTIPLE SELECTION
  async addGlobalMaster(formValue: any, object: any = { pageTitle: 'Add', data: {} }) {
    const globalMasterConfig = {
      pageTitle: object?.pageTitle,
      dialogConfig: {
        height: '90%',
        width: '35%'
      },
    };
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: object?.columnHeader, field: 'name', filter: false },
      ],
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: ['name'],
      paginator: true,
      scrollable: true,
      lazy: false,
      fontSize: '14px',
      list: await this.getDataByAPI(object?.queryParams || {}),
      selectedArray: object?.selectedArray || [],
      tableName: 'table',
      bindOption: this.updateGlobalMasterOptions.bind(this),
    };
    const data: any = { field: dynamicObject, tableDataSource: object?.list || [] };
    const response: any = await this._customDialogService.openDialog(globalMasterConfig, DynamicTableComponent, data);
    return response;
  }

  generateString(data = []) {
    return data.map(ele => ele?.id).filter(Boolean).join(',');
  }

  generateArray(text = '') {
    return text ? text.split(',').map(id => ({ id, name: id })) : [];
  }
}
