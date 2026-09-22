import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { EmployeeSalaryModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/employee-salary-model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-employee-salary',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.scss'
})
export class EmployeeSalaryComponent {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  employeeSalariesConfig = signal({
    formName: 'employee-salary',
    modelName: 'EmployeeMonthlySalary',
    headerTitleKey: 'document_number',
    pageTitle: this.translate.instant('employeeSalary_TC'),
    tableHeaders: [
      {
        label: 'document_number_TC',
        field: 'document_number',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'source_TC',
        field: 'source',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
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
        representationField: 'first_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'effective_date_TC',
        field: 'effective_date',
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
        label: 'department_TC',
        field: 'employee__department__department_name',
        representationField: 'department_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'designation_TC',
        field: 'employee__designation__designation_name',
        representationField: 'designation_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'net_pay_monthly_TC',
        field: 'net_pay_monthly',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'net_pay_yearly_TC',
        field: 'net_pay_yearly',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Approval Status',
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
    tableBody: ['document_number', 'source', 'employee_code', 'first_name', 'effective_date', 'department_name', 'designation_name', 'net_pay_monthly', 'net_pay_yearly', 'approval_status'],
    editable: true,
    url: {
      post: '/hrm/employeeMonthlySalary/',
      get: '/hrm/employeeMonthlySalary/',
      delete: '/hrm/employeeMonthlySalary/',
      put: '/hrm/employeeMonthlySalary/',
      // get_by_pk: '/hrm/employeeMonthlySalary/get_by_id?id='

    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        // updateData: this.updateDataOnEdit.bind(this),
        getById: true,
        actionType: 'EDIT',
        tooltip: 'Edit',

      },
      {
        label: '',
        icon: 'trash',
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
  });

  employeeSalaryForm = signal(null);

  private readonly employeeSalaryConfig = inject(FormConfig);
  gradeObject: any;

  ngOnInit(): void {
    this.employeeSalaryForm.set(this.employeeSalaryConfig.getForm()['employee-salary'])
  }

  async updateDataOnEdit(formData: any) {
    formData = await this.getEmployeeGradeDetails(formData?.employee, formData);
    // console.log(" await this.getEmployeeGradeDetails(formData?.employee,formData)", formData)
    return formData;
  }
  updateEmployeeDetails(employeeRes, formValue) {
    formValue.department_name = employeeRes?.department_name;
    formValue.designation_name = employeeRes?.designation_name;
    formValue.employee_grade = employeeRes?.grade_code;
    return formValue
  }
  async getEmployeeGradeDetails(next: any, formValue: any) {
    // console.log("next",next,formValue)
    const employeeObject: any = await this.getEmployeeDetails(next);
    // console.log("employeeObject",employeeObject)
    formValue = this.updateEmployeeDetails(employeeObject?.employee_data, formValue);
    if (Object.keys(employeeObject)) {
      // const gradeObject: any = await this.getGrade(employeeObject?.grade);
      if (Object.keys(employeeObject)?.length) {
        this.gradeObject = employeeObject?.grade_data;
        formValue.gradeObject = employeeObject?.grade_data
        formValue = this.filedCaliculation(formValue)
        // console.log("formValue1",formValue.gradeObject)
        return formValue
      }
    }
    return formValue

  }
  async getEmployeeDetails(next: any) {
    return await this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}grade_details/${'?id='}${next}`).toPromise();
  }
  async getGrade(next: any) {
    return await this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${next}`).toPromise();
  }
  filedCaliculation(formValue) {
    const pfEmployer = Number(this.gradeObject?.pf_employer_contribution) || 0
    const esiEmployer = Number(this.gradeObject?.esi_employer_share) || 0
    // console.log("second", pfEmployer, esiEmployer)
    let total_gross_sal = 0
    let gross_basic_pay = 0;
    // First pass: calculate total gross salary and identify the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'Basic Pay') {
        gross_basic_pay = element.monthly || 0;
      }
    });
    formValue?.gross_earnings?.forEach(element => {
      total_gross_sal += element.monthly || 0;
    });
    const isEsiApplicable = total_gross_sal < 21000;
    // console.log("total_gross_sal", total_gross_sal, gross_basic_pay)
    const pf_employer = Number(Math.round((gross_basic_pay * pfEmployer / 100)));
    const isPFApplicable = pf_employer < 1800;
    formValue.pf_employer = isPFApplicable ? Number(pf_employer) : 1800;
    formValue.pf_employer_yearly = Number(Math.round(formValue.pf_employer * 12));
    const esi_employer = isEsiApplicable ? Number((total_gross_sal * esiEmployer / 100)) : 0;
    formValue.esi_employer = Number(Math.round(esi_employer))
    formValue.esi_employer_yearly = isEsiApplicable ? Number((Math.round(esi_employer) * 12)) : 0;
    // console.log("total_gross_sal", Number((total_gross_sal * esiEmployer / 100)), Number(Math.round(esi_employer)), formValue.esi_employer, formValue.esi_employer_yearly)
    const totalGross = Number(total_gross_sal) * 12
    const ctc = Number(Number(totalGross) + Number(formValue?.esi_employer_yearly) + Number(formValue?.pf_employer_yearly));
    formValue.ctc = Number(Math.round(ctc))
    return formValue
  }

}
