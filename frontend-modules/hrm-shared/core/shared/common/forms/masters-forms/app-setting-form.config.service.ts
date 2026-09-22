import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from '../core/builders/input.builder';
import { TabBuilder } from '../core/builders/tab.builder';
import { TextBuilder } from '../core/builders/textarea.builder';
import { AppSettingModel } from '../../model/masters/app-setting.model';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';


@Injectable({
  providedIn: 'root',
})
export class AppSettingFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  public readonly AppSettingForm =
    () =>
    (dataFromComponent?:any, initialData?: AppSettingModel, isEditMode?: boolean, data?: AppSettingModel) => {
      initialData = new AppSettingModel();
      return [
        new TabBuilder(this.translate)
        .addTabFields([
          {
            tabHeader: this.translate.instant('appSettingDetails_TC'),
            fields: [
                new InputField(this.translate,"app_key",isEditMode,data,initialData)
                .addFieldWidth('48%')
                .validate(true,0,50)
                .toObject(),
                new InputField(this.translate,"app_value",isEditMode,data,initialData)
                .addFieldWidth('48%')
                .validate(true,0,500)
                .toObject(),   
            ],
          }
        ])
      ];
    };
}
