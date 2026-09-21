import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DepartmentEnum } from 'src/app/core/shared/common/enum/masters_enum/department-enum';
import { DepartmentModel } from 'src/app/core/shared/common/model/masters/department.model';
import { SalaryComponentsEnum } from 'src/app/core/shared/common/enum/masters_enum/salary-components-enum';
import { SalaryComponentsModel } from 'src/app/core/shared/common/model/masters/salary-components.model';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';


@Injectable({
    providedIn: 'root',
})
export class SalaryComponentFormConfig {
    private translate = inject(TranslateService);
    private apiService = inject(ApiService);
    private readonly typeList = signal([
        {
            key: 'Allowance',
            value: 'Allowance'
        },
        {
            key: 'Deduction',
            value: 'Deduction'
        },
    ])
    public readonly SalaryComponentForm =
        () =>
            (dataFromComponent?: any, initialData?: SalaryComponentsModel, isEditMode?: boolean, data?: SalaryComponentsModel) => {
                initialData = new SalaryComponentsModel();
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('components_TC'),
                                fields: [
                                    new DropdownField(this.translate, SalaryComponentsEnum.type, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                        .addFieldWidth('24%')
                                        .addKeyValueLabel('key', 'value')
                                        .getOptions(this.typeList)
                                        .validate(true)
                                        .toObject(),
                                    new InputField(this.translate, SalaryComponentsEnum.component, isEditMode, data, initialData)
                                        .addFieldWidth('48%')
                                        .validate(true, 1, 100)
                                        .toObject(),
                                    new NumberField(this.translate, SalaryComponentsEnum.order, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .validate(true)
                                        .setMinFractionDigits(0)
                                        .setMaxFractionDigits(1)
                                        .toObject(),
                                ],
                            }
                        ])
                ];
            };
}
