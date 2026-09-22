import { Component, ViewChild, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { SalaryCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/salary-calculation-form.config.service';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { SalaryCalculationService } from './service/salary-calculation.service';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { Router } from '@angular/router';
import { ReportListService } from 'src/app/modules/hrm-shared/modules/report-engine/modules/report-list/services/report-list.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ConsolidatedPayslipComponent } from './consolidated-payslip/consolidated-payslip.component';

@Component({
  selector: 'sanadi-salary-calculation',
  standalone: true,
  imports: [TableFilterComponent],
  providers: [DialogService],
  templateUrl: './salary-calculation.component.html',
  styleUrl: './salary-calculation.component.scss'
})
export class SalaryCalculationComponent {
  private translate = inject(TranslateService);
  private router = inject(Router);
  private salaryCalculation:LocalCompServiceConfig = inject(SalaryCalculationService);
  private reportListService = inject(ReportListService);
  private dialogService = inject(DialogService);

  private readonly salaryCalculationRequiredFields = signal('id,salary_number,selection_mode,month,from_date,to_date,filter_criteria,approval_status,user_created,modified')

  private readonly selectionModeMap: Record<string, string> = {
    month: 'Month', date_range: 'Date Range', custom: 'Custom',
  };
  private readonly filterCriteriaMap: Record<string, string> = {
    none: 'All', employee_wise: 'Employee Wise', employee_type: 'Employee Type',
    designation: 'Designation', department: 'Department', sponsor: 'Sponsor',
  };
  salaryCalculationsConfig = signal({
    formName: 'salary-calculation',
    modelName: 'SalaryCalculation',
    headerTitleKey: 'salary_number',
    pageTitle: this.translate.instant('salaryCalculation_TC'),
    tableHeaders: [
      {
        label: 'salary_number_TC',
        field: 'salary_number',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
      {
        label: 'selection_mode_TC',
        field: 'selection_mode',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
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
        label: 'filter_criteria_TC',
        field: 'filter_criteria',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
      {
        label: 'approval_status_TC',
        field: 'approval_status',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'user_created_TC',
        field: 'user_created',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
      {
        label: 'modified_TC',
        field: 'modified',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
    ],
    tableBody: [
      'salary_number',
      { key: 'selection_mode', updateValue: (row: any) => this.selectionModeMap[row.selection_mode] ?? row.selection_mode },
      'from_date',
      'to_date',
      { key: 'filter_criteria', updateValue: (row: any) => this.filterCriteriaMap[row.filter_criteria] ?? row.filter_criteria },
      'approval_status',
      'user_created',
      'modified',
    ],
    editable: true,
    params:{
      get:{required_fields:this.salaryCalculationRequiredFields()}
    },
    url: {
      post: '/hrm/salaryCalculation/',
      get: '/hrm/salaryCalculation/',
      delete: '/hrm/salaryCalculation/',
      put: '/hrm/salaryCalculation/',
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
        protect:{approval_status:ApprovalOptions.APPROVED},
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
    captionButton: [
      {
        show: true,
        icon: 'file',
        label: 'Download Payroll Register',
        toolTip: 'View consolidated payslips for approved salary records',
        actionType: 'CONSOLIDATED_PAYSLIP',
        onClick: () => this.openConsolidatedPayslip(),
      },
    ],
    dialogData: {},
    isShowDialog: true,
    localCompService:this.salaryCalculation
  });

  salaryCalculationForm = signal(null);

  private readonly salaryCalculationConfig = inject(FormConfig);
  private readonly salaryCalcFormConfig    = inject(SalaryCalculationFormConfig);
  
  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  accept() {
      this.confirmPopup.accept();
  }

  reject() {
      this.confirmPopup.reject();
  }
  ngOnInit(): void {
    this.salaryCalculationForm.set(this.salaryCalculationConfig.getForm()['salary-calculation']);
    this.salaryCalcFormConfig.fetchLastSelectedColumns();
  }
    onClick(_event: any, item: any, action: any) {
    const reportName = action?.reportName || 'EMPLOYEE SALARY REPORT';

    const format = (d: any): string | null => {
      if (!d) return null;
      if (d instanceof Date) {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
      }
      if (typeof d === 'string') {
        const parts = d.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return d;
      }
      return null;
    };

    const fromDate = format(item?.from_date || item?.fromDate || item?.from);
    const toDate = format(item?.to_date || item?.toDate || item?.to);

    this.reportListService.getReports().subscribe((res: any) => {
      const reports: any[] = res?.results || [];
      const found = reports.find(r => r.report_name?.toUpperCase() === reportName.toUpperCase());
      this.router.navigateByUrl('/app/report/viewer', {
        state: {
          report_id: found?.id ?? null,
          report_name: reportName,
          from_date: fromDate,
          to_date: toDate,
          from_date_formats: found?.from_date_formats || 'dd-mm-yy',
          to_date_formats: found?.to_date_formats || 'dd-mm-yy',
          filter_columns: found?.filter_columns,
          global_filter_columns: found?.global_filter_columns,
          custom_print: found?.custom_print,
          as_on_date_range: found?.as_on_date_range,
          is_dynamic_columns: found?.is_dynamic_columns,
          dynamic_filters: found?.dynamic_filters,
          span_columns: found?.span_columns,
          auto_apply: !!(found?.id && fromDate && toDate),
        }
      });
    });
  }

  openConsolidatedPayslip(): void {
    this.dialogService.open(ConsolidatedPayslipComponent, {
      header: 'Download Payroll Register',
      width: '90vw',
      height: '85vh',
      contentStyle: { overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
      appendTo: 'body',
      maximizable: true,
      modal: true,
      dismissableMask: false,
      closeOnEscape: true,
    });
  }
}
