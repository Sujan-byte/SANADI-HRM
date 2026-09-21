import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';

import {
  PettyCashTransactionEnum,
  pettyCashTransactionTypeOptions,
  pettyCashTransactionSourceTypeOptions,
} from 'src/app/core/shared/common/enum/hrm-enum/petty-cash-transaction.enum';

import { PettyCashTransactionModel } from 'src/app/core/shared/common/model/hrm/petty-cash-transaction.model';

import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Injectable({
  providedIn: 'root',
})
export class PettyCashTransactionFormConfig {
  private translate = inject(TranslateService);

  private readonly transactionTypeOptions = signal(
    pettyCashTransactionTypeOptions,
  );

  private readonly sourceTypeOptions = signal(
    pettyCashTransactionSourceTypeOptions,
  );

  public readonly PettyCashTransactionForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: PettyCashTransactionModel,
      isEditMode?: boolean,
      data?: PettyCashTransactionModel,
    ) => {
      initialData = new PettyCashTransactionModel();

      initialData.transaction_date = isEditMode
        ? data?.transaction_date
        : moment(new Date()).format('DD-MM-YYYY');

      initialData = {
        ...initialData,
        ...(data || {}),
      };

      data = initialData;


      const default_fund_object =
        isEditMode && data?.fund
          ? {
              id: data.fund,
              fund_no: (data as any).fund_no || '',
              // Transaction serializer sends the fund's holder under fund_holder_name —
              // map it onto holder_name, which is what addKeyValueLabelList reads below.
              holder_name: (data as any).fund_holder_name || '',
            }
          : {};
          

      return [
        new TabBuilder(this.translate).addTabFields([
          {
            tabHeader: 'Petty Cash Transaction',
            fieldUniqueKey: 'petty-cash-transaction-details',
            fields: [
              // Fund
              new DropdownField(
                this.translate,
                PettyCashTransactionEnum.fund,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['fund_no', 'holder_name'], 'id')
                // .addKeyValueLabelList(['fund_no'], 'id')
                .setDefaultObject(default_fund_object)
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(false)
                .isReadOnly(isEditMode)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      search_key: 'fund_no',
                    },
                    filterKeys: [`search`],
                  },
                })
                .showClear(true)
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .validate(true)
                .toObject(),

              // Transaction Type
              new DropdownField(
                this.translate,
                PettyCashTransactionEnum.transactionType,
                isEditMode,
                data,
                initialData,
                false,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('label', 'value')
                .getOptions(this.transactionTypeOptions)
                .isReadOnly(isEditMode)
                .validate(true)
                .toObject(),

              // Source Type
              new DropdownField(
                this.translate,
                PettyCashTransactionEnum.sourceType,
                isEditMode,
                data,
                initialData,
                false,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('label', 'value')
                .getOptions(this.sourceTypeOptions)
                .isReadOnly(isEditMode)
                .validate(true)
                .toObject(),

              // Transaction Date
              new DateField(
                this.translate,
                PettyCashTransactionEnum.transactionDate,
                isEditMode,
                data,
                initialData,
                false,
                'Transaction Date',
              )
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),

              // Amount
              new NumberField(
                this.translate,
                PettyCashTransactionEnum.amount,
                isEditMode,
                data,
                initialData,
                'Amount',
              )
                .addFieldWidth('24%')
                .isReadOnly(isEditMode)
                .setMinValue(0.01)
                .toObject(),

              // Reference
              new InputField(
                this.translate,
                PettyCashTransactionEnum.reference,
                isEditMode,
                data,
                initialData,
                'Reference',
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),

              // Remarks
              new TextBuilder(
                this.translate,
                PettyCashTransactionEnum.remarks,
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
