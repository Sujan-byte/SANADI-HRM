import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-salary-hold',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './salary-hold.component.html',
})
export class SalaryHoldComponent {
  private translate = inject(TranslateService);
  private readonly salaryHoldConfig = inject(FormConfig);

  readonly salaryHoldTableConfig = signal({
    formName: 'salary-hold',
    modelName: 'SalaryHold',
    headerTitleKey: 'employee_names',
    pageTitle: 'Employee Salary Hold',
    tableHeaders: [
      {
        label: 'employee_names_TC',
        field: 'employee_names',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'hold_from_date_TC',
        field: 'hold_from_date',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal',                 value: FilterOptions.dateIs },
          { label: 'Less than',             value: FilterOptions.lt     },
          { label: 'Greater than',          value: FilterOptions.gt     },
          { label: 'Less than or equal',    value: FilterOptions.lte    },
          { label: 'Greater than or equal', value: FilterOptions.gte    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'hold_to_date_TC',
        field: 'hold_to_date',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal',                 value: FilterOptions.dateIs },
          { label: 'Less than',             value: FilterOptions.lt     },
          { label: 'Greater than',          value: FilterOptions.gt     },
          { label: 'Less than or equal',    value: FilterOptions.lte    },
          { label: 'Greater than or equal', value: FilterOptions.gte    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'reason_TC',
        field: 'reason',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'released_on_TC',
        field: 'released_on',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal',                 value: FilterOptions.dateIs },
          { label: 'Less than',             value: FilterOptions.lt     },
          { label: 'Greater than',          value: FilterOptions.gt     },
          { label: 'Less than or equal',    value: FilterOptions.lte    },
          { label: 'Greater than or equal', value: FilterOptions.gte    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'remarks_TC',
        field: 'remarks',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'approval_status_TC',
        field: 'approval_status',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
    ],
    tableBody: [
      'employee_names',
      'hold_from_date',
      'hold_to_date',
      'reason',
      'released_on',
      'remarks',
      'approval_status',
    ],
    editable: true,
    params: {
      get: {
        required_fields: 'id,employee_ids,employee_names,hold_from_date,hold_to_date,reason,remarks,released_on,release_remarks,approval_status',
      },
    },
    url: {
      post:   '/hrm/salaryHold/',
      get:    '/hrm/salaryHold/',
      delete: '/hrm/salaryHold/',
      put:    '/hrm/salaryHold/',
    },
    actions: [
      { label: '', icon: 'pencil', getById: true, actionType: 'EDIT',    tooltip: 'Edit'    },
      { label: '', icon: 'trash',                  actionType: 'DELETE',  tooltip: 'Delete'  },
      { label: '', icon: 'undo',                   actionType: 'RESTORE', tooltip: 'Restore' },
      { label: '', icon: 'history',                actionType: 'HISTORY', tooltip: 'History' },
    ],
    toolBarActionConfig: { activeButton: false, inActiveButton: false },
    saveConfig: { disableFunction: () => false },
    dialogData: {},
    isShowDialog: true,
  });

  salaryHoldForm = signal(null);


  ngOnInit(): void {
    this.salaryHoldForm.set(this.salaryHoldConfig.getForm()['salary-hold']);
  }
}
