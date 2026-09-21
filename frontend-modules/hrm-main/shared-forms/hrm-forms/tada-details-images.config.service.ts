import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/core/services/api.service';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { FileField } from 'src/app/core/shared/common/forms/core/builders/file.builder';
import { TaDaDetails } from 'src/app/core/shared/common/model/hrm/ta-da.model';
import { CarouselField } from 'src/app/core/shared/common/forms/core/builders/carousel.builder';
import { TaDaDetailsEnum } from 'src/app/core/shared/common/enum/hrm-enum/ta-da.enum';


@Injectable({
    providedIn: 'root',
})
export class tadaDetailsImageFormConfig {
    private translate = inject(TranslateService);
    private apiService = inject(ApiService);

    public readonly tadaDetailsImageForm =
        () =>
            (dataFromComponent?: any, initialData?: TaDaDetails, isEditMode?: boolean, data?: TaDaDetails) => {
                initialData = new TaDaDetails();
                console.log("data",data)
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('upload_TC'),
                                fields: [
                                    new CarouselField(this.translate, TaDaDetailsEnum.tada_details_images, isEditMode, data, initialData, this.translate.instant('upload_TC'))
                                        .toObject(),
                                ]
                            }])
                ];
            };
}
