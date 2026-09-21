import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

import { pettyCashFundStatusOptions } from 'src/app/core/shared/common/enum/hrm-enum/petty-cash-fund.enum';

@Component({
  selector: 'sanadi-petty-cash-fund',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './petty-cash-fund.component.html',
  styleUrl: './petty-cash-fund.component.scss',
})
export class PettyCashFundComponent {
  private translate = inject(TranslateService);
  private readonly formConfig = inject(FormConfig);

  pettyCashFundConfig = signal({
    formName: 'petty-cash-fund',

    pageTitle: 'Petty Cash Fund',

    tableHeaders: [
      {
        label: 'Fund No',
        field: 'fund_no',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Holder',
        field: 'holder__first_name',
        representationField: 'holder_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Fund Date',
        field: 'fund_date',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.exact },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Opening Balance',
        field: 'opening_balance',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.equal },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Current Balance',
        field: 'current_balance',
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
      //   label: 'Status',
      //   field: 'status',
      //   filterType: 'dropdown',
      //   filterOptions: signal(pettyCashFundStatusOptions),
      //   isFilterRequired: true,
      // },
    ],

    tableBody: [
      'fund_no',
      'holder_name',
      'fund_date',
      'opening_balance',
      'current_balance',
      // 'status',
    ],
    editable: true,

    url: {
      post: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
      get: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
      delete: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
      put: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
    },

    actions: [
      {
        label: '',
        icon: 'pencil',
        getById: true,
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
    },

    dialogData: {},

    dialogConfig: {
      width: '75vw',
      height: '75vh',
      maximizable: true,
    },

    isShowDialog: true,
  });

  pettyCashFundForm = signal<any>(null);

  ngOnInit(): void {
    this.pettyCashFundForm.set(this.formConfig.getForm()['petty-cash-fund']);
  }
}
