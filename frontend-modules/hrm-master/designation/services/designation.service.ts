import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { DesignationEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/designation.enum';
import { DynamicTableModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { DesignationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/designation.model';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { SelectListComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/select-list/select-list.component';

@Injectable({
  providedIn: 'root'
})
export class DesignationService {

  public translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);
  public _apiService = inject(ApiService);

  constructor() { }

  // DESIGNATION MASTER
  designationConfig = {
    pageTitle: 'Select Designation',
    dialogConfig: {
      width: '40%',
      height: '80%'
    },
  };

  async selectDesignation(formValue: any, object: DynamicTableModel) {
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: this.translate.instant(`${DesignationEnum.designation_code}_TC`), field: DesignationEnum.designation_code },
        { name: this.translate.instant(`${DesignationEnum.designation_name}_TC`), field: DesignationEnum.designation_name },
      ],
      selectionMode: 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: [DesignationEnum.designation_code, DesignationEnum.designation_name],
      paginator: true,
      scrollable: true,
      lazy: true,
      fontSize: '14px',
      queryParams: {
        ...object?.queryParams,
        required_fields: `id,${DesignationEnum.designation_code},${DesignationEnum.designation_name}`,
        search_key: `${DesignationEnum.designation_code},${DesignationEnum.designation_name}`,
      },
      url: `${ServiceUrlConstants.DESIGNATION_CRUD}`,
      tableName: 'table',
      height: '75vh',
      width: '75vw',
    };
    const response: DesignationModel = await this._customDialogService.openDialog(this.designationConfig, SelectListComponent, dynamicObject);
    // console.log('selectDesignation response', response);
    return { selected: response };
  }
}
