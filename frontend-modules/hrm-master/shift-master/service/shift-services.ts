import { NONE_TYPE } from '@angular/compiler';
import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiService } from 'src/app/core/services/api.service';
import { EmployeeEnum } from 'src/app/core/shared/common/enum/masters_enum/employee-enum';
import { PasswordFormConfig } from 'src/app/core/shared/common/forms/masters-forms/password-form.config.service';
import { DynamicTableModel } from 'src/app/core/shared/common/model/app.model';
import { SecurityUser } from 'src/app/core/shared/common/model/masters/employee.model';
import { ShiftMasterModel } from 'src/app/core/shared/common/model/masters/shift-master.model';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DialogHandlerService } from 'src/app/core/shared/services/dialog-form.service';
import { SharedService } from 'src/app/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  public _dialogHandlerService = inject(DialogHandlerService);
  public _apiService = inject(ApiService);
  private _sharedService = inject(SharedService);
  private _spinner = inject(NgxSpinnerService);
  private translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);


  constructor() { }

  public readonly onSaveFormData =
    (formData: ShiftMasterModel, formFields) => {
      formData.start_time = formData?.start_time ? moment(formData?.start_time).format('HH:mm') : null;
      formData.end_time = formData?.end_time ? moment(formData?.end_time).format('HH:mm') : null;
      formData.grace_period_in = formData?.grace_period_in ? moment(formData?.grace_period_in).format('HH:mm') : null;
      formData.grace_period_out = formData?.grace_period_out ? moment(formData?.grace_period_out).format('HH:mm') : null;
      return formData;
    }

}
