import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { AdvanceService } from './services/advance.service';

@Component({
  selector: 'sanadi-advance',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './advance.component.html',
  styleUrl: './advance.component.scss'
})
export class AdvanceComponent {
  private translate = inject(TranslateService);
  private advanceService:LocalCompServiceConfig = inject(AdvanceService);
  private readonly advanceRequiredFields = signal('id,advance_amount,deduction_tenure_months,balance_loan_amount,approval_status')
  advancesConfig = signal({
    formName: 'advance',
    modelName: 'Advance',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('advance_TC'),
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee__employee_code',
        representationField: 'employee_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'first_name_TC',
        field: 'employee__first_name',
        representationField: 'employee_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'advance_amount_TC',
        field: 'advance_amount',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'deduction_tenure_months_TC',
        field: 'deduction_tenure_months',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'balance_loan_amount_TC',
        field: 'balance_loan_amount',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'approval_status_TC',
        field: 'approval_status',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

    ],
    tableBody: ['employee_code', 'employee_name','advance_amount','deduction_tenure_months','balance_loan_amount','status'],
    editable: true,
    params:{
      get:{required_fields:this.advanceRequiredFields()}
    },
    url: {
      post: '/hrm/advance/',
      get: '/hrm/advance/',
      delete: '/hrm/advance/',
      put: '/hrm/advance/',
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById:true,
        actionType: 'EDIT',
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'Delete',
        protect:{approval_status:ApprovalOptions.APPROVED},
      },
      {
        label: '',
        icon: 'undo',
        actionType: 'RESTORE',
        tooltip: 'Restore',
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },
    ],
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false
    },
    dialogData: {},
    isShowDialog: true,
    localCompService:this.advanceService
  });

  advanceForm = signal(null);

  private readonly advanceConfig = inject(FormConfig);

  ngOnInit(): void {
    this.advanceForm.set(this.advanceConfig.getForm()['advance'])
  }
}
