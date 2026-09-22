// import { Component } from '@angular/core';

// @Component({
//   selector: 'sanadi-expense-claim-category',
//   standalone: true,
//   imports: [],
//   templateUrl: './expense-claim-category.component.html',
//   styleUrl: './expense-claim-category.component.scss'
// })
// export class ExpenseClaimCategoryComponent {

// }

import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';

import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-expense-claim-category',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './expense-claim-category.component.html',
  styleUrl: './expense-claim-category.component.scss',
})
export class ExpenseClaimCategoryComponent {

  private translate = inject(TranslateService);
  private readonly formConfig = inject(FormConfig);

  expenseClaimCategoryConfig = signal({
    formName: 'expense-claim-category',

    pageTitle: 'Expense Claim Category',

    tableHeaders: [
      {
        label: 'Code',
        field: 'code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      {
        label: 'Name',
        field: 'name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

      // {
      //   label: 'Requires Receipt',
      //   field: 'requires_receipt',
      //   isFilterRequired: false,
      // },
    ],

    tableBody: [
      'code',
      'name',
      // 'requires_receipt',
    ],

    editable: true,

    url: {
      post: HrmServiceUrlConstants.EXPENSE_CLAIM_CATEGORY_CRUD,
      get: HrmServiceUrlConstants.EXPENSE_CLAIM_CATEGORY_CRUD,
      delete: HrmServiceUrlConstants.EXPENSE_CLAIM_CATEGORY_CRUD,
      put: HrmServiceUrlConstants.EXPENSE_CLAIM_CATEGORY_CRUD,
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
    },

    dialogData: {},

    dialogConfig: {
      width: '55vw',
      height: '55vh',
      maximizable: true,
    },

    isShowDialog: true,
  });

  expenseClaimCategoryForm = signal<any>(null);

  ngOnInit(): void {
    this.expenseClaimCategoryForm.set(
      this.formConfig.getForm()['expense-claim-category']
    );
  }
}