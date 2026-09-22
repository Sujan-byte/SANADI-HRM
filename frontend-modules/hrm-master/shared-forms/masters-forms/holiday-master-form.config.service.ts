import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { HolidayMasterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/holiday-master.model';
import { HolidayMasterEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/holiday-master.enum';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';


@Injectable({
  providedIn: 'root',
})
export class HolidayMasterFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  public readonly HolidayMasterForm =
    () =>
    (dataFromComponent?:any, initialData?: HolidayMasterModel, isEditMode?: boolean, data?: HolidayMasterModel) => {
      initialData = new HolidayMasterModel();
      return [
        new TabBuilder(this.translate)
        .addTabFields([
          {
            tabHeader: this.translate.instant('details_TC'),
            fields: [   
                new DateField(this.translate, HolidayMasterEnum.date, isEditMode, data, initialData,false,'From Date')
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),
                new DateField(this.translate, HolidayMasterEnum.toDate, isEditMode, data, initialData,false,'To Date')
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),
                new TextBuilder(this.translate, HolidayMasterEnum.description, isEditMode, data, initialData)
                .addFieldWidth('24%')
                .toObject(),
            ],
          }
        ])
      ];
    };
}
