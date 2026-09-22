

import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';

@Component({
  selector: 'sanadi-expense-claim',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './expense-claim.component.html',
  styleUrl: './expense-claim.component.scss',
})



export class ExpenseClaimComponent {

  private translate = inject(TranslateService);
  private readonly formConfig = inject(FormConfig);

  expenseClaimConfig = signal({
    formName: 'expense-claim',

    pageTitle: 'Expense Claim',


    tableHeaders: [
  {
    label: 'Claim No',
    field: 'claim_no',
    matchModeOptions: [
      { label: 'Starts With', value: FilterOptions.istartsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      { label: 'Equal', value: FilterOptions.iExact },
    ],
    isFilterRequired: true,
  },

  {
    label: 'Claimant',
    field: 'claimant__first_name',
    representationField: 'claimant_name',
    matchModeOptions: [
      { label: 'Starts With', value: FilterOptions.istartsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      { label: 'Equal', value: FilterOptions.iExact },
    ],
    isFilterRequired: true,
  },

  {
    label: 'Period From',
    field: 'period_from',
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
    label: 'Period To',
    field: 'period_to',
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
    label: 'Total Claimed',
    field: 'total_claimed',
    matchModeOptions: [
      { label: 'Equal', value: FilterOptions.equal },
      { label: 'Less than', value: FilterOptions.lt },
      { label: 'Greater than', value: FilterOptions.gt },
      { label: 'Less than or equal', value: FilterOptions.lte },
      { label: 'Greater than or equal', value: FilterOptions.gte },
    ],
    isFilterRequired: true,
  },
],

    tableBody: [
      'claim_no',
      'claimant_name',
      'period_from',
      'period_to',
      'total_claimed',
      // 'status',
    ],

    editable: true,

    url: {
      post: HrmServiceUrlConstants.EXPENSE_CLAIM_CRUD,
      get: HrmServiceUrlConstants.EXPENSE_CLAIM_CRUD,
      delete: HrmServiceUrlConstants.EXPENSE_CLAIM_CRUD,
      put: HrmServiceUrlConstants.EXPENSE_CLAIM_CRUD,
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
      {
        label: '',
        icon: 'print',
        actionType: 'PRINT',
        receiptBuilderConfig: {
          type: 'expense-claim',
          dynamicPrint: true,
          formUrl: HrmServiceUrlConstants.EXPENSE_CLAIM_CRUD,
        },
        tooltip: 'Print',
      },
    ],

    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true,
    },

    dialogData: {},

    dialogConfig: {
      width: '90vw',
      height: '90vh',
      maximizable: true,
    },

    isShowDialog: true,
  });

  expenseClaimForm = signal<any>(null);

  ngOnInit(): void {
    this.expenseClaimForm.set(
      this.formConfig.getForm()['expense-claim']
    );
  }
}