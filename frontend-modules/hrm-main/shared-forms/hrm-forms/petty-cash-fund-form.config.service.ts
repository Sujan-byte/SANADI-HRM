import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';

import {
  PettyCashFundEnum,
  pettyCashFundStatusOptions,
} from 'src/app/modules/hrm-main/hrm-enum/petty-cash-fund.enum';

import { PettyCashFundModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/petty-cash-fund.model';

import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Injectable({
  providedIn: 'root',
})
export class PettyCashFundFormConfig {
  private translate = inject(TranslateService);

  private readonly statusOptions = signal(pettyCashFundStatusOptions);

  public readonly PettyCashFundForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: PettyCashFundModel,
      isEditMode?: boolean,
      data?: PettyCashFundModel,
    ) => {
      initialData = new PettyCashFundModel();

      initialData = {
        ...initialData,
        ...(data || {}),
      };

      data = initialData;
      

      const default_holder_object =
        isEditMode && data?.holder
          ? {
              id: data.holder,
              first_name: (data as any).holder_name || '',
              employee_code: (data as any).holder_employee_code || '',
            }
          : {};

      const default_ledger_account_object =
        isEditMode && data?.ledger_account
          ? {
              id: data.ledger_account,
              name: (data as any).ledger_account_name || '',
            }
          : {};

      return [
        new TabBuilder(this.translate).addTabFields([
          {
            tabHeader: 'Petty Cash Fund',
            fieldUniqueKey: 'petty-cash-fund-details',
            fields: [
              // Fund No
              new InputField(
                this.translate,
                PettyCashFundEnum.fundNo,
                isEditMode,
                data,
                initialData,
                'Fund No',
                'Auto Generated',
              )
                .addFieldWidth('24%')
                .isReadOnly(true)
                .toObject(),

              // Holder
              new DropdownField(
                this.translate,
                PettyCashFundEnum.holder,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['first_name', 'employee_code'], 'id')
                .setDefaultObject(default_holder_object)
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(false)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      search_key: 'first_name,employee_code',
                    },
                    filterKeys: [`search`],
                  },
                })
                .showClear(true)
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .validate(true)
                .toObject(),

              // Fund Date
              new DateField(
                this.translate,
                PettyCashFundEnum.fundDate,
                isEditMode,
                data,
                initialData,
                false,
                'Fund Date',
              )
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),

              // Status
              new DropdownField(
                this.translate,
                PettyCashFundEnum.status,
                isEditMode,
                data,
                initialData,
                false,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('label', 'value')
                .getOptions(this.statusOptions)
                .validate(false)
                .isFieldHidden(true)
                .toObject(),

              // Opening Balance
              new NumberField(
                this.translate,
                PettyCashFundEnum.openingBalance,
                isEditMode,
                data,
                initialData,
                'Opening Balance',
              )
                .addFieldWidth('24%')
                .setMinValue(0)
                .toObject(),

              // Current Balance
              new NumberField(
                this.translate,
                PettyCashFundEnum.currentBalance,
                isEditMode,
                data,
                initialData,
                'Current Balance',
                'Auto Calculated',
              )
                .addFieldWidth('24%')
                .isReadOnly(true)
                .toObject(),

              // Ledger Account
              new DropdownField(
                this.translate,
                PettyCashFundEnum.ledgerAccount,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['name'], 'id')
                .setDefaultObject(default_ledger_account_object)
                .getOptions(signal([]))
                // No getUrlConfig — 'account' app (Tally Ledger) isn't part of this
                // HRM-only build, so this stays a plain empty dropdown instead of
                // hitting a route that doesn't exist here.
                .showClear(true)
                .isReadOnly(true)
                .toObject(),

              // Remarks
              new TextBuilder(
                this.translate,
                PettyCashFundEnum.remarks,
                isEditMode,
                data,
                initialData,
                'Remarks',
              )
                .addFieldWidth('48%')
                .validate(false)
                .toObject(),
            ],
          },
        ]),
      ];
    };

  updateDynamicDropdownOptions(response: any) {
    if (response?.results?.length) {
      return response.results;
    }

    return [];
  }
}
