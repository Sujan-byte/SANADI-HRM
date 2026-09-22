import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ShiftTimingsModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/shift-timings.model';
import { ShiftTimingsEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/shift-timings.enum';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';



@Injectable({
  providedIn: 'root',
})
export class ShiftTimingsFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  public readonly shiftTimingsForm =
    () =>
    (dataFromComponent?:any, initialData?: ShiftTimingsModel, isEditMode?: boolean, data?: ShiftTimingsModel) => {
      initialData = new ShiftTimingsModel();
      return [
        new TabBuilder(this.translate)
        .addTabFields([
          {
            tabHeader: this.translate.instant('shift_timings_TC'),
            fields: [
                new InputField(this.translate, ShiftTimingsEnum.shiftCode, isEditMode, data, initialData)
                .addFieldWidth('24%')
                .validate(true, 1, 100)
                .toObject(),
                new InputField(this.translate, ShiftTimingsEnum.shiftName, isEditMode, data, initialData)
                .addFieldWidth('24%')
                .validate(true, 1, 100)
                .toObject(), 
                new InputField(this.translate, ShiftTimingsEnum.startTime, isEditMode, data, initialData) 
                .addFieldWidth('24%') 
                .toObject(),
                new InputField(this.translate, ShiftTimingsEnum.endTime, isEditMode, data, initialData) 
                .addFieldWidth('24%') 
                .toObject(),
                new InputField(this.translate, ShiftTimingsEnum.halfDayTime, isEditMode, data, initialData) 
                .addFieldWidth('24%')
                .toObject(),
                new InputField(this.translate, ShiftTimingsEnum.lateCheckinThreshold, isEditMode, data, initialData) 
                .addFieldWidth('24%') 
                .toObject(),
                new InputField(this.translate, ShiftTimingsEnum.earlyCheckoutThreshold, isEditMode, data, initialData) 
                .addFieldWidth('24%') 
                .toObject(),
            ],
          }
        ])
      ];
    };
}
