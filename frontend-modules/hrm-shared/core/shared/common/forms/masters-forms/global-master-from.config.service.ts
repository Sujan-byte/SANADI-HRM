import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from '../core/builders/input.builder';
import { TabBuilder } from '../core/builders/tab.builder';
import { TextBuilder } from '../core/builders/textarea.builder';
import { GlobalMasterModel } from '../../model/masters/global-master.model';



@Injectable({
    providedIn: 'root',
})
export class GlobalMasterFormConfig {
    private translate = inject(TranslateService);

    public readonly GlobalMasterForm =
        () =>
            (dataFromComponent?: any, initialData?: GlobalMasterModel, isEditMode?: boolean, data?: GlobalMasterModel) => {
                initialData = new GlobalMasterModel();
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('details_TC'),
                                fields: [
                                    new InputField(this.translate, "global_value", isEditMode, data, initialData, data?.label ? data?.label + "_TC" : data.global_key + "_TC").addFieldWidth('35%')
                                        .validate(true, 1, 200)
                                        .toObject(),
                                    new InputField(this.translate, "global_key", isEditMode, data, initialData).addFieldWidth('4%').isFieldHidden(true)
                                        .toObject(),

                                ],
                            }
                        ])
                ];
            };
}
