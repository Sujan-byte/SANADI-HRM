import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

import {
  pettyCashTransactionTypeOptions,
  pettyCashTransactionSourceTypeOptions,
} from 'src/app/core/shared/common/enum/hrm-enum/petty-cash-transaction.enum';

@Component({
  selector: 'sanadi-petty-cash-transaction',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './petty-cash-transaction.component.html',
  styleUrl: './petty-cash-transaction.component.scss',
})
export class PettyCashTransactionComponent {

  private translate = inject(TranslateService);
  private readonly formConfig = inject(FormConfig);

  pettyCashTransactionConfig = signal({
    formName: 'petty-cash-transaction',

    pageTitle: 'Petty Cash Transaction',

    tableHeaders: [
      {
        label: 'Fund',
        field: 'fund__fund_no',
        representationField: 'fund_no',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Holder',
        field: 'fund_holder_name',
        isFilterRequired: false,
      },
      {
        label: 'Transaction Date',
        field: 'transaction_date',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.dateIs },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Type',
        field: 'transaction_type',
        representationField: 'transaction_type_display',
        filterType: 'dropdown',
        filterOptions: signal(pettyCashTransactionTypeOptions),
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Source',
        field: 'source_type',
        representationField: 'source_type_display',
        filterType: 'dropdown',
        filterOptions: signal(pettyCashTransactionSourceTypeOptions),
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Amount',
        field: 'amount',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.equal },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },
      // {
      //   label: 'Reference',
      //   field: 'reference',
      //   matchModeOptions: [
      //     { label: 'Contains', value: FilterOptions.iContains },
      //     { label: 'Equal', value: FilterOptions.iExact },
      //   ],
      //   isFilterRequired: true,
      // },
    ],

 

    tableBody: [
      'fund_no',
      'fund_holder_name',
      'transaction_date',
      'transaction_type_display',
      'source_type_display',
      'amount',
      // 'reference'
    ],

    editable: true,

    url: {
      post: ServiceUrlConstants.PETTY_CASH_TRANSACTION_CRUD,
      get: ServiceUrlConstants.PETTY_CASH_TRANSACTION_CRUD,
      delete: ServiceUrlConstants.PETTY_CASH_TRANSACTION_CRUD,
      put: ServiceUrlConstants.PETTY_CASH_TRANSACTION_CRUD,
    },

    actions: [
      {
        label: '',
        icon: 'pencil',
        actionType: 'EDIT',
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'De-activate',
      },
      {
        label: '',
        icon: 'undo',
        actionType: 'RESTORE',
        tooltip: 'Restore',
      },
    ],

    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true,
      addButton: false,
      newButton: false,
    },

    dialogData: {},

    dialogConfig: {
      width: '65vw',
      height: '65vh',
      maximizable: true,
    },

    isShowDialog: true,
  });

  pettyCashTransactionForm = signal<any>(null);

  ngOnInit(): void {
    this.pettyCashTransactionForm.set(
      this.formConfig.getForm()['petty-cash-transaction']
    );
  }
}
