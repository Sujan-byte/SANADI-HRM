import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions, matchModeOptions, matchModeOptionsDate } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';

@Component({
  selector: 'app-allowance-register',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './allowance-register.component.html',
  styleUrls: ['./allowance-register.component.scss'],
})
export class AllowanceRegisterComponent {
  private translate = inject(TranslateService);

  allowanceRegisterConfig = signal<any>({
    formName:  'allowance-register',
    pageTitle: this.translate.instant('allowanceRegister_TC') || 'Allowance Register',
    tableHeaders: [
      {
        label: this.translate.instant('employeeCode_TC') || 'Emp Code',
        field: 'employee_code',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('employeeName_TC') || 'Employee Name',
        field: 'employee_name',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('designation_TC') || 'Designation',
        field: 'designation_name',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('department_TC') || 'Department',
        field: 'department_name',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('allowanceCode_TC') || 'Allowance Code',
        field: 'allowance_code',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('allowanceName_TC') || 'Allowance Name',
        field: 'allowance_name',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('allowanceType_TC') || 'Type',
        field: 'allowance_type',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('mode_TC') || 'Mode',
        field: 'mode',
        matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('amount_TC') || 'Amount',
        field: 'amount',
        isFilterRequired: false,
      },
      {
        label: this.translate.instant('fromDate_TC') || 'From Date',
        field: 'from_date',
        type: 'date',
        defaultMatchMode: FilterOptions.gte,
        matchModeOptions: matchModeOptionsDate,
        isFilterRequired: true,
      },
      {
        label: this.translate.instant('toDate_TC') || 'To Date',
        field: 'to_date',
        type: 'date',
        defaultMatchMode: FilterOptions.lte,
        matchModeOptions: matchModeOptionsDate,
        isFilterRequired: true,
      },
    ],
    tableBody: [
      'employee_code',
      'employee_name',
      'designation_name',
      'department_name',
      'allowance_code',
      'allowance_name',
      'allowance_type',
      {
        field: 'mode',
        updateValue: (row: any) => {
          const val = row?.mode;
          return val === 'manual' ? 'Manual' : val === 'auto' ? 'Auto' : val || '';
        },
      },
      'amount_display',
      'from_date',
      'to_date',
    ],
    editable: false,
    isShowDialog: false,
    url: {
      get:    `${HrmServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}register/`,
      post:   HrmServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD,
      put:    HrmServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD,
      delete: HrmServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD,
    },
    toolBarActionConfig: {
      newButton:      false,
      activeButton:   true,
      inActiveButton: true,
      exportButton:   true,
    },
    actions: [],
    dialogData: {},
  });
}
