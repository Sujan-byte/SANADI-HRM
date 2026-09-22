import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from '../core/builders/input.builder';
import { TabBuilder } from '../core/builders/tab.builder';
import { GlobalMasterModel, GlobalValueModel } from '../../model/masters/global-master.model';
import { TableBuilder } from '../core/builders/table.builder';
import { GlobalMasterEnum } from '../../enum/masters_enum/global-master-enum';
import { AppUtils } from 'src/app/modules/hrm-shared/core/utils/app.utils';



@Injectable({
    providedIn: 'root',
})
export class GlobalMasterMainFormConfig {
    private appUtils = inject(AppUtils);
    private translate = inject(TranslateService);
    public readonly GlobalMasterMainForm =
        () =>
            (dataFromComponent?: any, initialData?: GlobalMasterModel, isEditMode?: boolean, data?: GlobalMasterModel) => {
                initialData = new GlobalMasterModel();
                let globalValue = isEditMode?data?.global_value:[];
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('details_TC'),
                                fields: [
                                    new InputField(this.translate, GlobalMasterEnum.global_key, isEditMode, data, initialData).addFieldWidth('24%').isReadOnly(true)
                                        .toObject(),
                                    new TableBuilder(this.translate, GlobalMasterEnum.global_value)
                                        .columnSchema([
                                            'name'
                                        ])

                                        .formInitialise<GlobalValueModel>(new GlobalValueModel())
                                        .formSchema([
                                            {
                                                name: "name",
                                                type: 'input'
                                            }
                                        ])
                                        .getDatasource<Array<GlobalValueModel>>('id', globalValue)
                                        .setTableWidth('55vw')
                                        .buttonStates(false,!this.appUtils.checkIsSuperUser() )
                                        .setTableScrollHeight('58vh')
                                        .build()

                                ],
                            }
                        ])
                ];
            };

      checkIsSuperUser() {
        const isSuperUser = JSON.parse(localStorage.getItem('is_superuser'));
        return isSuperUser;
    }
}
