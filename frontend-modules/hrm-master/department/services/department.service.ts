import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/core/services/api.service';
import { DepartmentEnum } from 'src/app/core/shared/common/enum/masters_enum/department-enum';
import { DynamicTableModel } from 'src/app/core/shared/common/model/app.model';
import { DepartmentModel } from 'src/app/core/shared/common/model/masters/department.model';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { SelectListComponent } from 'src/app/sanadi-library/sanadi-components/select-list/select-list.component';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  public translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);
  public _apiService = inject(ApiService);

  constructor() { }

  // DEPARTMENT MASTER
  departmentConfig = {
    pageTitle: 'Select Department',
    dialogConfig: {
      width: '40%',
      height: '80%'
    },
  };

  async selectDepartment(formValue: any, object: DynamicTableModel) {
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: this.translate.instant(`${DepartmentEnum.department_code}_TC`), field: DepartmentEnum.department_code },
        { name: this.translate.instant(`${DepartmentEnum.department_name}_TC`), field: DepartmentEnum.department_name },
      ],
      selectionMode: 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: [DepartmentEnum.department_code, DepartmentEnum.department_name],
      paginator: true,
      scrollable: true,
      lazy: true,
      fontSize: '14px',
      queryParams: { 
        ...object?.queryParams, 
        required_fields: `id,${DepartmentEnum.department_code},${DepartmentEnum.department_name}`,
        search_key: `${DepartmentEnum.department_code},${DepartmentEnum.department_name}`,
      },
      url: `${ServiceUrlConstants.DEPARTMENT_CRUD}`,
      tableName: 'table',
      height: '75vh',
      width: '75vw',
    };
    const response: DepartmentModel = await this._customDialogService.openDialog(this.departmentConfig, SelectListComponent, dynamicObject);
    // console.log('selectDepartment response', response);
    return { selected: response };
  }
}
