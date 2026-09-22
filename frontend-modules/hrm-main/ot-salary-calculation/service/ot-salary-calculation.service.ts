import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { OTSalaryCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/ot-salary-calculation-form.config.service';

@Injectable({
  providedIn: 'root'
})
export class OTSalaryCalculationService {
  baseURL: string = ServiceUrlConstants.BASE_URL;
  private _formConfig = inject(OTSalaryCalculationFormConfig);

  constructor(
    private http: HttpClient,
    private dialogService: DialogService,
    private _sharedService: SharedService,
  ) { }

  public readonly onSaveFormData = async (
    formData: any,
    _formFields: any,
    action: string = 'submit'
  ): Promise<any | null> => {
    // Map frontend filter_*_ids → backend filter_value
    const filterType = formData.filter_type || '';
    if (filterType === 'Individual')  formData.filter_value = formData.filter_employee_ids    || '';
    if (filterType === 'Designation') formData.filter_value = formData.filter_designation_ids || '';
    if (filterType === 'Department')  formData.filter_value = formData.filter_department_ids  || '';

    // selected_columns: store visible cols; sentinel when all hidden
    const cols = this._formConfig.getLastSelectedColumns();
    if (cols !== null) {
      formData.selected_columns = cols.length > 0 ? cols : ['__configured__'];
    }
    return formData;
  }

  getOTEmployees(fromDate: string, toDate: string, bId: string) {
    return this.http.get<any[]>(
      `${this.baseURL}/hrm/otSalaryCalculation/get_ot_employees/?from_date=${fromDate}&to_date=${toDate}&b_id=${bId}`
    );
  }
}
