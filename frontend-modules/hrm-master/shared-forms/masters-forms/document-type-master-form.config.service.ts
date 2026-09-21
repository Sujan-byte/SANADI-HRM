import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { MultiSelectField } from 'src/app/core/shared/common/forms/core/builders/multiselect.builder';

import { DocumentTypeMasterModel } from 'src/app/core/shared/common/model/masters/document-type-master.model';
import { DocumentTypeMasterEnum } from 'src/app/core/shared/common/enum/masters_enum/document-type-master-enum'; 

@Injectable({ providedIn: 'root' })
export class DocumentTypeMasterFormConfig {
  private translate = inject(TranslateService);

  private alertDaysList = signal([
    { key: '7 Days', value: 7 },
    { key: '15 Days', value: 15 },
    { key: '30 Days', value: 30 },
    { key: '45 Days', value: 45 },
    { key: '60 Days', value: 60 },
    { key: '90 Days', value: 90 },
  ]);

  public readonly DocumentTypeMasterForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: DocumentTypeMasterModel,
      isEditMode?: boolean,
      data?: DocumentTypeMasterModel,
    ) => {
      initialData = {
        ...new DocumentTypeMasterModel(),
        ...data,
        applies_to: data?.applies_to ?? 'Employee',
      };

      return [
        new TabBuilder(this.translate).addTabFields([
          {
            tabHeader: this.translate.instant('documentTypeMaster_TC'),
            fieldUniqueKey: 'document-type-master',

            fields: [
              new InputField(
                this.translate,
                DocumentTypeMasterEnum.docTypeCode,
                isEditMode,
                data,
                initialData,
                undefined,
                'Auto Generated',
              )
                .addFieldWidth('24%')
                .isReadOnly(true)
                .toObject(),

              new InputField(
                this.translate,
                DocumentTypeMasterEnum.docTypeName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(true, 1, 150)
                .toObject(),

              new ToggleBuilder(
                this.translate,
                DocumentTypeMasterEnum.expiryRequired,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('15%')
                .toObject(),

              new MultiSelectField(
                this.translate,
                DocumentTypeMasterEnum.defaultAlertDays,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.alertDaysList)
                .toObject(),

              new TextBuilder(
                this.translate,
                DocumentTypeMasterEnum.remarks,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('49%')
                .validate(false, 0, 500)
                .toObject(),
            ],
          },
        ]),
      ];
    };
}
