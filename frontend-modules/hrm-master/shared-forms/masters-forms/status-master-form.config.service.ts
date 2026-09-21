import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { StatusMasterModel } from 'src/app/core/shared/common/model/masters/status-master.model';
import { StatusMasterEnum } from 'src/app/core/shared/common/enum/masters_enum/status-master-enum';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';


@Injectable({
    providedIn: 'root',
})
export class StatusMasterFormConfig {
    private translate = inject(TranslateService);
    private readonly statusType = signal([
        {
            key: 'Attendance',
            value: 'Attendance'
        },
        {
            key: 'Leave',
            value: 'Leave'
        }
    ]);
    public readonly StatusMasterForm =
        () =>
            (dataFromComponent?: any, initialData?: StatusMasterModel, isEditMode?: boolean, data?: StatusMasterModel) => {
                initialData = new StatusMasterModel();
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('info_TC'),
                                fields: [
                                    new InputField(this.translate, StatusMasterEnum.code, isEditMode, data, initialData)
                                    .addFieldWidth('48%')
                                    .isReadOnly(isEditMode)
                                    .toObject(),
                                new InputField(this.translate, StatusMasterEnum.statusName, isEditMode, data, initialData)
                                    .addFieldWidth('48%')
                                    .validate(true, 1, 100)
                                    .toObject(),
                                new TextBuilder(this.translate, StatusMasterEnum.description, isEditMode, data, initialData)
                                    .addFieldWidth('48%')
                                    .toObject(),
                                new DropdownField(this.translate, StatusMasterEnum.type, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                    .addFieldWidth('48%')
                                    .addKeyValueLabel('key', 'value')
                                    .getOptions(this.statusType)
                                    .validate(true)
                                    .toObject(),
                                new ToggleBuilder(this.translate, StatusMasterEnum.isPaid, isEditMode, data, initialData)
                                    .addFieldWidth('48%')
                                    .toObject(),
                                ]
                            },

                        ])
                ]
            };
}
