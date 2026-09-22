import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { MessageService } from 'primeng/api';
import { SalaryIncrementService } from './salary-increment.service';

@Component({
  selector: 'sanadi-salary-increment',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './salary-increment.component.html',
  providers: [MessageService],
})
export class SalaryIncrementComponent {
  private translate = inject(TranslateService);
  private readonly apiService = inject(ApiService);
  private readonly salaryIncrementConfig = inject(FormConfig);
  private readonly localCompService: LocalCompServiceConfig = inject(SalaryIncrementService);
  private readonly messageService = inject(MessageService);

  readonly salaryIncrementTableConfig = signal({
    formName: 'salary-increment',
    modelName: 'EmployeeMonthlySalary',
    headerTitleKey: 'document_number',
    pageTitle: this.translate.instant('salary_increment_TC'),
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
        label: 'employee_code_TC',
        field: 'employee_code',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'employee_name_TC',
        field: 'employee_name',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
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
        label: 'reason_TC',
        field: 'reason',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: false,
      },
      {
        label: 'current_gross_TC',
        field: 'current_gross',
        matchModeOptions: [
          { label: 'Equal',             value: FilterOptions.iExact },
          { label: 'Less than',         value: FilterOptions.lt     },
          { label: 'Greater than',      value: FilterOptions.gt     },
        ],
        isFilterRequired: false,
      },
      {
        label: 'new_gross_TC',
        field: 'new_gross',
        matchModeOptions: [
          { label: 'Equal',             value: FilterOptions.iExact },
          { label: 'Less than',         value: FilterOptions.lt     },
          { label: 'Greater than',      value: FilterOptions.gt     },
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
      'document_number',
      'employee_code',
      'employee_name',
      'effective_date',
      'reason',
      'current_gross',
      'new_gross',
      'approval_status',
    ],
    editable: true,
    params: {
      get: {
        required_fields: 'id,employee,employee_code,employee_name,effective_date,reason,current_gross,new_gross,approval_status,document_number',
      },
    },
    url: {
      post:   '/hrm/salaryIncrement/',
      get:    '/hrm/salaryIncrement/',
      delete: '/hrm/salaryIncrement/',
      put:    '/hrm/salaryIncrement/',
    },
    actions: [
      { label: '', icon: 'pencil', getById: true, actionType: 'EDIT',    tooltip: 'Edit',    updateData: this.updateDataOnEdit.bind(this) },
      { label: '', icon: 'trash',                  actionType: 'DELETE',  tooltip: 'Delete'  },
      { label: '', icon: 'undo',                   actionType: 'RESTORE', tooltip: 'Restore' },
      { label: '', icon: 'history',                actionType: 'HISTORY', tooltip: 'History' },
      // { label: '', icon: 'check',                  actionType: 'APPROVE', tooltip: 'Approve', onClick: this.onApprove.bind(this) },
    ],
    toolBarActionConfig: { activeButton: false, inActiveButton: false },
    localCompService: this.localCompService,
    saveConfig: { disableFunction: () => false },
    dialogData: {},
    isShowDialog: true,
  });

  salaryIncrementForm = signal(null);

  ngOnInit(): void {
    this.salaryIncrementForm.set(this.salaryIncrementConfig.getForm()['salary-increment']);
  }

  async updateDataOnEdit(formData: any) {
    if (!formData) return formData;

    const genId = () => Math.floor(1000000000000 + Math.random() * 9000) + 'A';

    // Fetch previous salary to display correct current_amount alongside new_amount
    let prevSalary: any = null;
    if (formData.employee) {
      try {
        const excludeParam = formData.id ? `&exclude_id=${formData.id}` : '';
        prevSalary = await lastValueFrom(
          this.apiService.get(`/hrm/salaryIncrement/current_salary/?employee=${formData.employee}${excludeParam}`)
        );
      } catch { /* no prior salary */ }
    }
    const prevEarningsMap: Record<string, number> = {};
    const prevDeductionsMap: Record<string, number> = {};
    (prevSalary?.gross_earnings ?? []).forEach((e: any) => { prevEarningsMap[e.components] = e.monthly ?? 0; });
    (prevSalary?.gross_deductions ?? []).forEach((e: any) => { prevDeductionsMap[e.components] = e.monthly ?? 0; });

    const calcPct = (cur: number, nw: number) =>
      cur > 0 ? Math.round(((nw - cur) / cur) * 10000) / 100 : 0;

    let earnings = (formData.gross_earnings ?? []).map((e: any) => {
      const current_amount = prevEarningsMap[e.components] ?? (e.monthly ?? 0);
      const new_amount     = e.monthly ?? 0;
      return { id: e.id, components: e.components, current_amount, new_amount,
               increment_percentage: calcPct(current_amount, new_amount) };
    });
    let deductions = (formData.gross_deductions ?? []).map((e: any) => {
      const current_amount = prevDeductionsMap[e.components] ?? (e.monthly ?? 0);
      const new_amount     = e.monthly ?? 0;
      return { id: e.id, components: e.components, current_amount, new_amount,
               increment_percentage: calcPct(current_amount, new_amount) };
    });

    // If no earnings linked to this SI yet (record pre-dates the fix), seed from the fetched salary
    if (earnings.length === 0 && prevSalary) {
      earnings = (prevSalary.gross_earnings ?? []).map((e: any) => ({
        id:             genId(),
        components:     e.components,
        current_amount: e.monthly ?? 0,
        new_amount:     e.monthly ?? 0,
      }));
      deductions = (prevSalary.gross_deductions ?? []).map((e: any) => ({
        id:             genId(),
        components:     e.components,
        current_amount: e.monthly ?? 0,
        new_amount:     e.monthly ?? 0,
      }));
    }

    formData.earnings   = earnings;
    formData.deductions = deductions;
    formData.employee_default_object = formData.employee_default_object ?? {};
    return formData;
  }

  // async onApprove(_event: Event, item: any) {
  //   if (!item?.id) return null;
  //   try {
  //     await lastValueFrom(this.apiService.post(`/hrm/salaryIncrement/${item.id}/approve/`, {}));
  //     this.messageService.add({
  //       key: 'toaster', severity: 'success', summary: 'Approved',
  //       detail: 'Salary increment approved successfully', life: 3000,
  //     });
  //     return { success: true };
  //   } catch {
  //     this.messageService.add({
  //       key: 'toaster', severity: 'error', summary: 'Error',
  //       detail: 'Failed to approve salary increment', life: 3000,
  //     });
  //     return null;
  //   }
  // }
}
