import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { OverlayPanelBuilder, TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { SalaryIncrementModel, SalaryIncrementEarning, SalaryIncrementDeduction } from 'src/app/core/shared/common/model/hrm/salary-increment.model';
import { SalaryIncrementEnum, SalaryIncrementReasonEnum } from 'src/app/modules/hrm-main/hrm-enum/salary-increment.enum';
import { SalaryComponentsModel } from 'src/app/core/shared/common/model/masters/salary-components.model';
import { SalaryComponentsEnum } from 'src/app/core/shared/common/enum/masters_enum/salary-components-enum';

const REASON_OPTIONS = [
  { key: 'Annual Increment',     value: SalaryIncrementReasonEnum.annual_increment     },
  { key: 'Promotion',            value: SalaryIncrementReasonEnum.promotion             },
  { key: 'Performance',          value: SalaryIncrementReasonEnum.performance           },
  { key: 'Market Correction',    value: SalaryIncrementReasonEnum.market_correction     },
  { key: 'Probation Completion', value: SalaryIncrementReasonEnum.probation_completion  },
];

@Injectable({ providedIn: 'root' })
export class SalaryIncrementFormConfig {
  private translate  = inject(TranslateService);
  private apiService = inject(ApiService);

  private readonly earningsFooterInitialize    = signal([]);
  private readonly deductionsFooterInitialize  = signal([]);

  public readonly SalaryIncrementForm =
    () =>
      (dataFromComponent?: any, initialData?: SalaryIncrementModel, isEditMode?: boolean, data?: any) => {
        initialData = new SalaryIncrementModel();

        const defaultEmployeeObject   = isEditMode ? (data.employee_default_object   ?? {}) : {};
        let earnings:   SalaryIncrementEarning[]   = isEditMode ? (data.earnings   ?? []) : [];
        let deductions: SalaryIncrementDeduction[] = isEditMode ? (data.deductions ?? []) : [];

        if (earnings.length) {
          this.updateEarningsFooter({ earnings });
        } else {
          this.earningsFooterInitialize.set([]);
        }

        if (deductions.length) {
          this.updateDeductionsFooter({ deductions });
        } else {
          this.deductionsFooterInitialize.set([]);
        }

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('salary_increment_TC'),
                fieldUniqueKey: 'salary-increment-tab',
                fields: [

                  // Employee picker
                  new DropdownField(this.translate, SalaryIncrementEnum.employee, isEditMode, data, initialData, true, undefined, 'employee_code_TC', '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['employee_code', 'first_name'], 'id')
                    .getOptions(signal([]))
                    .validate(true)
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(defaultEmployeeObject)
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .setRequiredFields('id,employee_code,first_name')
                    .getUrlConfig({
                      get: {
                        url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                        params: { page_size: 30, is_active: true },
                        filterKeys: [`employee_code__${FilterOptions.iContains}&first_name__${FilterOptions.iContains}`],
                      },
                    })
                    .bindOption(this.updateDropdownOptions.bind(this))
                    .toObject(),

                  // Employee code (read-only, populated by onChangeEmployee)
                  new InputField(this.translate, SalaryIncrementEnum.employee_code, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),

                  // Employee name (read-only)
                  new InputField(this.translate, SalaryIncrementEnum.first_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),

                  // Effective date
                  new DateField(this.translate, SalaryIncrementEnum.effective_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
                    .toObject(),

                  // Reason
                  new DropdownField(this.translate, SalaryIncrementEnum.reason, isEditMode, data, initialData, false, undefined, 'reason_TC', undefined)
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['key'], 'value')
                    .getOptions(signal(REASON_OPTIONS))
                    .validate(true)
                    .toObject(),

                  // Earnings table
                  new TableBuilder(this.translate, SalaryIncrementEnum.earnings, '', true)
                    .columnSchema([
                      { name: SalaryIncrementEnum.components            + '_TC', colWidth: '200px' },
                      { name: SalaryIncrementEnum.current_amount        + '_TC', colWidth: '150px' },
                      { name: SalaryIncrementEnum.increment_percentage  + '_TC', colWidth: '150px' },
                      { name: SalaryIncrementEnum.new_amount            + '_TC', colWidth: '150px' },
                    ])
                    .formInitialise<SalaryIncrementEarning>(new SalaryIncrementEarning())
                    .formSchema([
                      { name: SalaryIncrementEnum.components,            type: 'input',  readonly: true },
                      { name: SalaryIncrementEnum.current_amount,        type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0 },
                      { name: SalaryIncrementEnum.increment_percentage,  type: 'number', readonly: false, maxFractionDigits: 2, minFractionDigits: 2,
                        onValueChange: this.onChangeEarningIncrement.bind(this),
                        updateTableFooter: this.onUpdateEarningsFooter.bind(this) },
                      { name: SalaryIncrementEnum.new_amount,            type: 'number', readonly: false, maxFractionDigits: 0, minFractionDigits: 0,
                        onValueChange: this.onChangeEarning.bind(this),
                        updateTableFooter: this.onUpdateEarningsFooter.bind(this) },
                    ])
                    .getDatasource<Array<SalaryIncrementEarning>>('components', earnings)
                    .enableFooter(true)
                    .setTableCaption(true)
                    .setCheckBox(false)
                    .setTableCaptionDialogButton(true)
                    .setTableCaptionDialogButtonLabel('Add Allowance Details')
                    .setField(
                      new OverlayPanelBuilder()
                        .setTableName(SalaryIncrementEnum.earnings)
                        .setOverlayPanelColumnSchema([
                          { name: this.translate.instant(`${SalaryComponentsEnum.component}_TC`), field: SalaryComponentsEnum.component },
                        ])
                        .setOnUpdateRows(this.updateTableRowsEarnings.bind(this))
                        .setOverlayPanelSelectionMode('single')
                        .setOverlayPanelRows(10)
                        .setDialogScrollHeight('55vh')
                        .setOverlayPanelFormInitialise([SalaryComponentsEnum.component])
                        .setOverlayPanelPaginator(true)
                        .setScrollable(true)
                        .setLazy(true)
                        .setFontSize('14px')
                        .setQueryParams({ type: 'Allowance', is_active: true, search_key: SalaryComponentsEnum.component })
                        .setDisabledField('false')
                        .setUrls(ServiceUrlConstants.SALARY_COMPONET_CRUD)
                        .setOverlayDialogConfig({ width: '35vw', height: '75vh' })
                        .build()
                    )
                    .setAddButton(true)
                    .footerInitialise(this.earningsFooterInitialize())
                    .onDeleteTableRow(this.onDeleteEarningRow.bind(this))
                    .setTableWidth('92vw')
                    .build(),

                  // Deductions table
                  new TableBuilder(this.translate, SalaryIncrementEnum.deductions, '', true)
                    .columnSchema([
                      { name: SalaryIncrementEnum.components     + '_TC', colWidth: '200px' },
                      { name: SalaryIncrementEnum.current_amount + '_TC', colWidth: '150px' },
                      { name: SalaryIncrementEnum.new_amount     + '_TC', colWidth: '150px' },
                    ])
                    .formInitialise<SalaryIncrementDeduction>(new SalaryIncrementDeduction())
                    .formSchema([
                      { name: SalaryIncrementEnum.components,     type: 'input',  readonly: true },
                      { name: SalaryIncrementEnum.current_amount, type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0 },
                      { name: SalaryIncrementEnum.new_amount,     type: 'number', readonly: false, maxFractionDigits: 0, minFractionDigits: 0,
                        onValueChange: this.onChangeDeduction.bind(this),
                        updateTableFooter: this.onUpdateDeductionsFooter.bind(this) },
                    ])
                    .getDatasource<Array<SalaryIncrementDeduction>>('components', deductions)
                    .enableFooter(true)
                    .setTableCaption(true)
                    .setCheckBox(false)
                    .setTableCaptionDialogButton(true)
                    .setTableCaptionDialogButtonLabel('Add Deduction Details')
                    .setField(
                      new OverlayPanelBuilder()
                        .setTableName(SalaryIncrementEnum.deductions)
                        .setOverlayPanelColumnSchema([
                          { name: this.translate.instant(`${SalaryComponentsEnum.component}_TC`), field: SalaryComponentsEnum.component },
                        ])
                        .setOnUpdateRows(this.updateTableRowsDeductions.bind(this))
                        .setOverlayPanelSelectionMode('single')
                        .setOverlayPanelRows(10)
                        .setDialogScrollHeight('55vh')
                        .setOverlayPanelFormInitialise([SalaryComponentsEnum.component])
                        .setOverlayPanelPaginator(true)
                        .setScrollable(true)
                        .setLazy(true)
                        .setFontSize('14px')
                        .setQueryParams({ type: 'Deduction', is_active: true, search_key: SalaryComponentsEnum.component })
                        .setDisabledField('false')
                        .setUrls(ServiceUrlConstants.SALARY_COMPONET_CRUD)
                        .setOverlayDialogConfig({ width: '35vw', height: '75vh' })
                        .build()
                    )
                    .setAddButton(true)
                    .footerInitialise(this.deductionsFooterInitialize())
                    .onDeleteTableRow(this.onDeleteDeductionRow.bind(this))
                    .setTableWidth('92vw')
                    .build(),
                ],
              },
            ])
        ];
      };

  // ── Callbacks ──────────────────────────────────────────────────────────────

  updateDropdownOptions(response: any) {
    return response?.results?.length ? response.results : [];
  }

  async onChangeEmployee(prev: any, next: any, formValue: SalaryIncrementModel, formFields: any) {
    if (!next) return formValue;

    let earningRows:   SalaryIncrementEarning[]   = [];
    let deductionRows: SalaryIncrementDeduction[] = [];

    try {
      const res: any = await lastValueFrom(
        this.apiService.get(`/hrm/salaryIncrement/current_salary/?employee=${next}`)
      );
      formValue.employee_code = res?.employee_code ?? '';
      formValue.first_name    = res?.first_name    ?? '';

      earningRows = (res?.gross_earnings ?? []).map((e: any) => ({
        id:             this.generateUniqueId(),
        components:     e.components,
        current_amount: e.monthly ?? 0,
        new_amount:     e.monthly ?? 0,
      }));
      deductionRows = (res?.gross_deductions ?? []).map((e: any) => ({
        id:             this.generateUniqueId(),
        components:     e.components,
        current_amount: e.monthly ?? 0,
        new_amount:     e.monthly ?? 0,
      }));
    } catch (_) {
      // No salary record yet — pre-populate from grade
      try {
        const empRes: any = await lastValueFrom(
          this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`)
        );
        formValue.employee_code = empRes?.employee_code ?? '';
        formValue.first_name    = empRes?.first_name    ?? '';

        if (empRes?.grade) {
          const gradeRes: any = await lastValueFrom(
            this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${empRes.grade}`)
          );
          earningRows = (gradeRes?.grade_gross_earnings ?? []).map((e: any) => ({
            id:             this.generateUniqueId(),
            components:     e.components,
            current_amount: 0,
            new_amount:     e.monthly ?? 0,
          }));
          deductionRows = (gradeRes?.grade_gross_deductions ?? []).map((e: any) => ({
            id:             this.generateUniqueId(),
            components:     e.components,
            current_amount: 0,
            new_amount:     e.monthly ?? 0,
          }));
        }
      } catch (_) { /* silent */ }
    }

    formValue.earnings              = earningRows;
    formValue.deductions            = deductionRows;
    formValue.increment_percentage  = 0;

    const earningsField = this.getTableField(formFields, SalaryIncrementEnum.earnings);
    if (earningsField) {
      earningsField.dataSource       = earningRows;
      this.updateEarningsFooter(formValue);
      earningsField.footerInitialise = this.earningsFooterInitialize();
    }

    const deductionsField = this.getTableField(formFields, SalaryIncrementEnum.deductions);
    if (deductionsField) {
      deductionsField.dataSource       = deductionRows;
      this.updateDeductionsFooter({ deductions: deductionRows });
      deductionsField.footerInitialise = this.deductionsFooterInitialize();
    }

    return formValue;
  }

  // Called when a table row increment_percentage changes: recalculates new_amount for that row
  onChangeEarningIncrement(event: any, item: SalaryIncrementEarning, _formValue: any, _formFields: any) {
    const pct = Number(event?.value ?? event) || 0;
    const newAmount = Math.round(item.current_amount + (item.current_amount * pct / 100));
    return { ...item, increment_percentage: pct, new_amount: newAmount };
  }

  // Called when a table row new_amount changes: (event, item, formValue, formFields)
  onChangeEarning(event: any, item: SalaryIncrementEarning, formValue: any, formFields: any) {
    return { ...item, new_amount: Number(event?.value ?? event) || 0 };
  }

  onUpdateEarningsFooter(_formValue: any, formFields: any) {
    const earningsField = this.getTableField(formFields, SalaryIncrementEnum.earnings);
    const rows: SalaryIncrementEarning[] = earningsField?.dataSource ?? [];
    this.updateEarningsFooter({ earnings: rows });
    return {
      form: {},
      footerInitialize: this.earningsFooterInitialize(),
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getTableField(formFields: any, tableName: string): any {
    const tabFields: any[] = formFields?.find((f: any) => f?.fieldUniqueKey === 'salary-increment-tab')?.fields ?? [];
    return tabFields.find((f: any) => f?.name === tableName);
  }

  private updateDeductionsFooter(formValue: { deductions?: SalaryIncrementDeduction[] }) {
    const rows = formValue.deductions ?? [];
    const totalCurrent = rows.reduce((s, r) => s + (Number(r.current_amount) || 0), 0);
    const totalNew     = rows.reduce((s, r) => s + (Number(r.new_amount)     || 0), 0);
    this.deductionsFooterInitialize.set([
      { name: ' ' },
      { name: 'Total' },
      { name: totalCurrent.toFixed(0) },
      { name: totalNew.toFixed(0)     },
    ]);
  }

  private updateEarningsFooter(formValue: { earnings?: SalaryIncrementEarning[] }) {
    const rows = formValue.earnings ?? [];
    const totalCurrent = rows.reduce((s, r) => s + (Number(r.current_amount) || 0), 0);
    const totalNew     = rows.reduce((s, r) => s + (Number(r.new_amount)     || 0), 0);
    this.earningsFooterInitialize.set([
      { name: ' ' },
      { name: 'Total' },
      { name: totalCurrent.toFixed(0) },
      { name: '' },                        // Increment % column — no total
      { name: totalNew.toFixed(0)     },
    ]);
  }

  // ── Deduction callbacks ────────────────────────────────────────────────────

  onChangeDeduction(event: any, item: SalaryIncrementDeduction, _formValue: any, _formFields: any) {
    return { ...item, new_amount: Number(event?.value ?? event) || 0 };
  }

  onUpdateDeductionsFooter(formValue: any, formFields: any) {
    const deductionsField = this.getTableField(formFields, SalaryIncrementEnum.deductions);
    const rows: SalaryIncrementDeduction[] = deductionsField?.dataSource ?? [];
    this.updateDeductionsFooter({ deductions: rows });
    return {
      form: {},
      footerInitialize: this.deductionsFooterInitialize(),
    };
  }

  updateTableRowsDeductions(rows: SalaryComponentsModel[]): SalaryIncrementDeduction[] {
    return rows.map((row: SalaryComponentsModel) => {
      const item = new SalaryIncrementDeduction();
      item.id             = this.generateUniqueId() as any;
      item.components     = row.component;
      item.current_amount = 0;
      item.new_amount     = 0;
      return item;
    });
  }

  onDeleteDeductionRow(_formValue: any, _item: SalaryIncrementDeduction, formFields: any) {
    const deductionsField = this.getTableField(formFields, SalaryIncrementEnum.deductions);
    const rows: SalaryIncrementDeduction[] = deductionsField?.dataSource ?? [];
    this.updateDeductionsFooter({ deductions: rows });
    return {
      form: {},
      footerInitialize: this.deductionsFooterInitialize(),
    };
  }

  updateTableRowsEarnings(rows: SalaryComponentsModel[]): SalaryIncrementEarning[] {
    return rows.map((row: SalaryComponentsModel) => {
      const item = new SalaryIncrementEarning();
      item.id             = this.generateUniqueId() as any;
      item.components     = row.component;
      item.current_amount = 0;
      item.new_amount     = 0;
      return item;
    });
  }

  onDeleteEarningRow(_formValue: any, _item: SalaryIncrementEarning, formFields: any) {
    const earningsField = this.getTableField(formFields, SalaryIncrementEnum.earnings);
    const rows: SalaryIncrementEarning[] = earningsField?.dataSource ?? [];
    this.updateEarningsFooter({ earnings: rows });
    return {
      form: {},
      footerInitialize: this.earningsFooterInitialize(),
    };
  }

  generateUniqueId(): string {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }
}
