import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { GratuityCalculationModel } from 'src/app/core/shared/common/model/hrm/gratuity-calculation.model';
import { GratuityCalculationEnum } from 'src/app/core/shared/common/enum/hrm-enum/gratuity-calculation.enum';



@Injectable({
  providedIn: 'root',
})
export class GratuityCalculationFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  public readonly GratuityCalculationForm =
    () =>
      (dataFromComponent?: any, initialData?: GratuityCalculationModel, isEditMode?: boolean, data?: GratuityCalculationModel) => {
        initialData = new GratuityCalculationModel();
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fields: [
                  new DateField(this.translate, GratuityCalculationEnum.from_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .addFormat("yy-mm-dd")
                    .toObject(),
                  new DateField(this.translate, GratuityCalculationEnum.to_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .addFormat("yy-mm-dd")
                    .toObject(),
                ],
              }
            ])
        ];
      };
}
