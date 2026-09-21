import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { OTSalaryCalculationService } from './service/ot-salary-calculation.service';

@Component({
  selector: 'sanadi-ot-salary-calculation',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './ot-salary-calculation.component.html',
  styleUrl: './ot-salary-calculation.component.scss'
})
export class OTSalaryCalculationComponent {
  private translate = inject(TranslateService);
  private otSalaryCalculation: LocalCompServiceConfig = inject(OTSalaryCalculationService);

  private readonly requiredFields = signal('id,ot_payroll_number,from_date,to_date,month,selection_mode,payroll_type,filter_type,filter_value,approval_status,user_created,ot_employee_list,selected_columns');

  otSalaryCalculationsConfig = signal({
    formName: 'ot-salary-calculation',
    modelName: 'OTSalaryCalculation',
    headerTitleKey: 'ot_payroll_number',
    pageTitle: 'OT Payroll Register',
    tableHeaders: [
      {
        label: 'ot_payroll_number_TC',
        field: 'ot_payroll_number',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'from_date_TC',
        field: 'from_date',
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
        label: 'to_date_TC',
        field: 'to_date',
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
        label: 'payroll_type_TC',
        field: 'payroll_type',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'created_by_TC',
        field: 'user_created',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
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
    tableBody: ['ot_payroll_number', 'from_date', 'to_date', 'payroll_type', 'user_created', 'status'],
    editable: true,
    params: {
      get: { required_fields: this.requiredFields() }
    },
    url: {
      post: '/hrm/otSalaryCalculation/',
      get: '/hrm/otSalaryCalculation/',
      delete: '/hrm/otSalaryCalculation/',
      put: '/hrm/otSalaryCalculation/',
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
        protect: { approval_status: ApprovalOptions.APPROVED },
        actionType: 'DELETE',
        tooltip: 'Delete',
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
    localCompService: this.otSalaryCalculation,
  });

  otSalaryCalculationForm = signal(null);

  private readonly formConfig = inject(FormConfig);

  ngOnInit(): void {
    this.otSalaryCalculationForm.set(this.formConfig.getForm()['ot-salary-calculation']);
  }
}
