import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DropdownField } from '../core/builders/dropdown.builder';
import { SecurityUser } from '../../model/masters/employee.model';
import { SecurityUserEnum } from '../../enum/masters_enum/employee-enum';
import { PasswordField } from '../core/builders/password.builder';

const list: any = [
]

@Injectable({
    providedIn: 'root',
})
export class PasswordFormConfig {
    private translate = inject(TranslateService);

    public readonly PasswordDetailForm =
        () =>
            (dataFromComponent?: any, initialData?: SecurityUser, isEditMode?: boolean, data?: SecurityUser) => {
                initialData = new SecurityUser();
                initialData.employee = data?.employee;
                return [
                    new PasswordField(this.translate, SecurityUserEnum.password, isEditMode, data, initialData)
                        .addFieldWidth('24%')
                        .validate(true,1,16,false,true)
                        .toObject(),
                    new DropdownField(this.translate, SecurityUserEnum.employee, isEditMode, data, initialData)
                        .addFieldWidth('24%')
                        .addKeyValueLabel('id', 'id')
                        .getOptions(signal([]))
                        .isFieldHidden(true)
                        .toObject(),
                ];
            };
}
