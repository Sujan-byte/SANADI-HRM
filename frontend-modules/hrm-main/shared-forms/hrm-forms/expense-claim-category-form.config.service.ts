import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';

import { ExpenseClaimCategoryEnum } from 'src/app/core/shared/common/enum/hrm-enum/expense-claim-category.enum';
import { ExpenseClaimCategoryModel } from 'src/app/core/shared/common/model/hrm/expense-claim-category.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseClaimCategoryFormConfig {
  private translate = inject(TranslateService);

  private buildAccordion(header: string, fields: any[]) {
    return {
      type: 'accordion',
      multiple: true,
      fieldWidth: '100%',
      accordionStyle: {
        width: '100%',
        display: 'block',
      },
      fields: [
        {
          accordionHeader: header,
          selected: true,
          fieldWidth: '100%',
          fields,
        } as any,
      ],
    } as any;
  }

  public readonly ExpenseClaimCategoryForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: ExpenseClaimCategoryModel,
      isEditMode?: boolean,
      data?: ExpenseClaimCategoryModel,
    ) => {
      initialData = new ExpenseClaimCategoryModel();

      return [
        new TabBuilder(this.translate)
          .addTabFields([
            {
              tabHeader: 'Expense Claim Category',
              fields: [
                this.buildAccordion(
                  'Expense Claim Category Details',
                  [
                    new InputField(
                      this.translate,
                      ExpenseClaimCategoryEnum.code,
                      isEditMode,
                      data,
                      initialData,
                      'Code',
                      'Auto Generated',
                    )
                      .addFieldWidth('48%')
                      .isReadOnly(true)
                      .toObject(),

                    new InputField(
                      this.translate,
                      ExpenseClaimCategoryEnum.name,
                      isEditMode,
                      data,
                      initialData,
                    )
                      .addFieldWidth('48%')
                      .validate(true, 1, 100)
                      .toObject(),

                    new ToggleBuilder(
                      this.translate,
                      ExpenseClaimCategoryEnum.requiresReceipt,
                      isEditMode,
                      data,
                      initialData,
                    )
                      .addFieldWidth('48%')
                      .toObject(),
                  ],
                ),
              ],
            },
          ])
      ];
    };
}