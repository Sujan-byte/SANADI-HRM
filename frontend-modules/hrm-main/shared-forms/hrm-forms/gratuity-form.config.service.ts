import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { ToggleBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/toggle.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { FileField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/file.builder';
import { GratuityModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/gratuity.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import * as moment from 'moment';
import { GratuityEnum } from 'src/app/modules/hrm-main/hrm-enum/gratuity.enum';

const GRATUITY_BASE_URL = '/hrm/gratuityEmployeeFrom/';

const TERMINATION_OPTIONS = [
  { label: 'Normal / Resignation',                       value: 'normal'     },
  { label: 'Terminated – Article 44 (Non-Assault)',      value: 'article_44' },
  { label: 'Terminated – Article 54 (Gross Misconduct)', value: 'article_54' },
];

const OVERRIDE_CAP_OPTIONS = [
  { label: 'Use Branch Setting', value: 'inherit' },
  { label: 'Force Cap ON',       value: 'on'      },
  { label: 'Force Cap OFF',      value: 'off'     },
];

const CALCULATION_TYPE_OPTIONS = [
  { label: 'Estimate',             value: 'estimate'           },
  { label: 'Final Separation',     value: 'final_separation'   },
  { label: 'Transfer Settlement',  value: 'transfer_settlement'},
  { label: 'Liability Transfer',   value: 'liability_transfer' },
];

const NOTICE_STATUS_OPTIONS = [
  { label: 'N/A',        value: 'na'        },
  { label: 'Served',     value: 'served'    },
  { label: 'Waived',     value: 'waived'    },
  { label: 'Not Served', value: 'not_served'},
];

@Injectable({
  providedIn: 'root',
})
export class GratuityFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);

  // ── Employee dropdown auto-fill ─────────────────────────────────────────────
  onChangeEmployee(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((response: any) => {
        formValue.employee_name    = response?.first_name;
        formValue.dob              = response?.dob;
        formValue.doc              = response?.doc;
        formValue.mobile_no        = response?.mobile_no;
        formValue.department_name  = response?.department_name;
        formValue.designation_name = response?.designation_name;
        formValue.grade_code       = response?.grade_code;
        resolve(formValue);
      });
    });
  }

  // ── Toggle: Consider Unpaid Leave ──────────────────────────────────────────
  onToggleUnpaidLeave(prev: any, next: boolean, formValue: any) {
    if (!next) {
      return {
        consider_unpaid_leave:    false,
        consider_auto_sync:       false,
        unpaid_leave_days_manual: 0,
        unpaid_leave_days_system: 0,
        unpaid_leave_days_total:  0,
        unpaid_leave_last_synced: null,
      };
    }
    return null;
  }

  // ── Toggle: Consider Auto Sync ─────────────────────────────────────────────
  onToggleAutoSync(prev: any, next: boolean, formValue: any) {
    if (!next) {
      const manual = formValue?.unpaid_leave_days_manual || 0;
      return {
        consider_auto_sync:       false,
        unpaid_leave_days_system: 0,
        unpaid_leave_days_total:  manual,
        unpaid_leave_last_synced: null,
      };
    }
    const id = formValue?.id;
    if (!id) return null;

    return new Promise((resolve) => {
      this.apiService.post(`${GRATUITY_BASE_URL}sync_unpaid_days/`, { id }).subscribe({
        next: (res: any) => {
          const systemDays = res?.unpaid_leave_days_system ?? 0;
          const manual     = formValue?.unpaid_leave_days_manual || 0;
          resolve({
            unpaid_leave_days_system: systemDays,
            unpaid_leave_days_total:  manual + systemDays,
            unpaid_leave_last_synced: res?.unpaid_leave_last_synced ?? null,
          });
        },
        error: () => resolve(null),
      });
    });
  }

  // ── Toggle: Deduct Outstanding Advance ────────────────────────────────────
  onToggleDebtDeduction(prev: any, next: boolean, formValue: any) {
    if (!next) {
      return {
        consider_debt_deduction: false,
        debt_deduction:          0,
        debt_deduction_remark:   '',
      };
    }
    const id = formValue?.id;
    if (!id) return null;

    return new Promise((resolve) => {
      this.apiService.post(`${GRATUITY_BASE_URL}sync_debt/`, { id }).subscribe({
        next: (res: any) => {
          resolve({
            debt_deduction:        res?.debt_deduction        ?? 0,
            debt_deduction_remark: res?.debt_deduction_remark ?? '',
          });
        },
        error: () => resolve(null),
      });
    });
  }

  saveDynamicDropdownData(attribute: any, event: any, form: any) {
    return { data: event, attribute: attribute };
  }

  updateDynamicDropdownOptions(response) {
    if (response?.results?.length) {
      return response.results;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  public readonly GratuityForm =
    () =>
      (dataFromComponent?: any, initialData?: GratuityModel, isEditMode?: boolean, data?: GratuityModel) => {
        initialData = new GratuityModel();
        const default_employee_object = isEditMode ? data?.default_employee_object : {};

        return [
          new TabBuilder(this.translate)
            .addTabFields([

              // ════════════════════════════════════════════════════════════
              // Tab 1: Details
              // ════════════════════════════════════════════════════════════
              {
                tabHeader: this.translate.instant('details_TC'),
                fields: [
                  // Auto-generated form number (read-only)
                  new InputField(this.translate, GratuityEnum.form_number, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  // Calculation type
                  new DropdownField(this.translate, GratuityEnum.calculation_type, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('label', 'value')
                    .getOptions(signal(CALCULATION_TYPE_OPTIONS))
                    .toObject(),

                  new DropdownField(this.translate, GratuityEnum.employee, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('employee_code', 'id')
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .isReadOnly(true)
                    .setDefaultObject(default_employee_object)
                    .onChange(this.onChangeEmployee.bind(this))
                    .getUrlConfig({
                      get: {
                        url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                        params: { page_size: 30, is_active: true },
                        filterKeys: [`employee_code__${FilterOptions.istartsWith}`],
                      },
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),

                  new InputField(this.translate, GratuityEnum.employee_name, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new DateField(this.translate, GratuityEnum.dob, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new DateField(this.translate, GratuityEnum.doc, isEditMode, data, initialData)
                    .addFieldWidth('24%').toObject(),

                  new InputField(this.translate, GratuityEnum.department_name, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new InputField(this.translate, GratuityEnum.designation_name, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new InputField(this.translate, GratuityEnum.grade_code, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new DateField(this.translate, GratuityEnum.dor, isEditMode, data, initialData)
                    .addFieldWidth('24%').toObject(),

                  new DateField(this.translate, GratuityEnum.doj, isEditMode, data, initialData)
                    .addFieldWidth('24%').toObject(),

                  // Read-only basic pay — shown when manual override is OFF
                  new NumberField(this.translate, GratuityEnum.present_basic_pay, isEditMode, data, initialData)
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2)
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !!fv?.basic_salary_manual_override)
                    .toObject(),

                  // Editable basic pay — shown when manual override is ON
                  new NumberField(this.translate, GratuityEnum.present_basic_pay, isEditMode, data, initialData)
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2)
                    .isReadOnly(false)
                    .isHideFunction((fv: any) => !fv?.basic_salary_manual_override)
                    .toObject(),

                  // CharField in DB — InputField preserves exact "3.8767" value
                  new InputField(this.translate, GratuityEnum.service_years, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  // Y/M/D display e.g. "3 yrs 2 mos 15 days"
                  new InputField(this.translate, GratuityEnum.service_years_display, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  // Lifecycle status — selectable by HR
                  new DropdownField(this.translate, GratuityEnum.status, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('label', 'value')
                    .getOptions(signal([
                      { label: 'Draft',          value: 'draft'        },
                      { label: 'Calculated',     value: 'calculated'   },
                      { label: 'Submitted',      value: 'submitted'    },
                      { label: 'Under Review',   value: 'under_review' },
                      { label: 'Approved',       value: 'approved'     },
                      { label: 'Rejected',       value: 'rejected'     },
                      { label: 'Posted',         value: 'posted'       },
                      { label: 'Paid / Settled', value: 'paid'         },
                      { label: 'Reversed',       value: 'reversed'     },
                      { label: 'Cancelled',      value: 'cancelled'    },
                    ]))
                    .toObject(),

                  // Settlement deadline (DOR + 14 days)
                  new DateField(this.translate, GratuityEnum.settlement_due_date, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true).toObject(),

                  new NumberField(this.translate, GratuityEnum.total_gratuity_monthly, isEditMode, data, initialData, 'monthlyGratuityAmount_TC')
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2).isReadOnly(true).toObject(),

                  new NumberField(this.translate, GratuityEnum.total_gratuity_yearly, isEditMode, data, initialData, 'totalGratuityAmount_TC')
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2).isReadOnly(true).toObject(),

                  new NumberField(this.translate, GratuityEnum.net_gratuity_payable, isEditMode, data, initialData)
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2).isReadOnly(true).toObject(),

                  // Pre-forfeiture gross (shown only when Article 54 applied)
                  new NumberField(this.translate, GratuityEnum.gross_gratuity_before_forfeiture, isEditMode, data, initialData)
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2).isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.gratuity_forfeited)
                    .toObject(),

                  // Residual employee debt (shown only when debt exceeds gratuity)
                  new NumberField(this.translate, GratuityEnum.residual_employee_debt, isEditMode, data, initialData)
                    .addFieldWidth('24%').setMinFractionDigits(2).setMaxFractionDigits(2).isReadOnly(true)
                    .isHideFunction((fv: any) => !(fv?.residual_employee_debt > 0))
                    .toObject(),

                  // ── Calculation Breakdown accordion (collapsed by default) ─
                  {
                    type: 'multi-blocks',
                    variant: 'single',
                    headerText: this.translate.instant('calculation_breakdown_TC') || 'Calculation Breakdown',
                    toggleable: true,
                    fieldWidth: '100%',
                    fields: [
                      new TextBuilder(this.translate, GratuityEnum.calculation_remarks, isEditMode, data, initialData)
                        .addFieldWidth('100%')
                        .isReadOnly(true)
                        .setRows(10)
                        .toObject(),
                    ],
                  },
                ],
              },

              // ════════════════════════════════════════════════════════════
              // Tab 2: Gratuity Settings
              // ════════════════════════════════════════════════════════════
              {
                tabHeader: this.translate.instant('gratuitySettings_TC') || 'Gratuity Settings',
                fields: [

                  // ── Row 1: Termination & Cap ──────────────────────────
                  new DropdownField(this.translate, GratuityEnum.termination_reason, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('label', 'value')
                    .getOptions(signal(TERMINATION_OPTIONS))
                    .toObject(),

                  new DropdownField(this.translate, GratuityEnum.notice_completion_status, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('label', 'value')
                    .getOptions(signal(NOTICE_STATUS_OPTIONS))
                    .toObject(),

                  new DropdownField(this.translate, GratuityEnum.override_statutory_cap, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('label', 'value')
                    .getOptions(signal(OVERRIDE_CAP_OPTIONS))
                    .toObject(),

                  // ── Manual Basic Salary Override ──────────────────────
                  new ToggleBuilder(this.translate, GratuityEnum.basic_salary_manual_override, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),

                  // ── Forfeiture Reference (visible only for Article 54) ─
                  new InputField(this.translate, GratuityEnum.forfeiture_ref, isEditMode, data, initialData)
                    .addFieldWidth('49%')
                    .isHideFunction((fv: any) => fv?.termination_reason !== 'article_54')
                    .toObject(),

                  // ── Row 2: Unpaid Leave ───────────────────────────────
                  // Master toggle — always visible
                  new ToggleBuilder(this.translate, GratuityEnum.consider_unpaid_leave, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onToggleUnpaidLeave.bind(this))
                    .toObject(),

                  // Auto-sync toggle — visible only when consider_unpaid_leave ON
                  new ToggleBuilder(this.translate, GratuityEnum.consider_auto_sync, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isHideFunction((fv: any) => !fv?.consider_unpaid_leave)
                    .onChange(this.onToggleAutoSync.bind(this))
                    .toObject(),

                  // Manual days — visible when consider_unpaid_leave ON
                  new NumberField(this.translate, GratuityEnum.unpaid_leave_days_manual, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isHideFunction((fv: any) => !fv?.consider_unpaid_leave)
                    .toObject(),

                  // Total days — visible when consider_unpaid_leave ON
                  new NumberField(this.translate, GratuityEnum.unpaid_leave_days_total, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.consider_unpaid_leave)
                    .toObject(),

                  // ── Row 3: Auto-sync result fields ────────────────────
                  // System days — visible only when BOTH toggles ON
                  new NumberField(this.translate, GratuityEnum.unpaid_leave_days_system, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.consider_unpaid_leave || !fv?.consider_auto_sync)
                    .toObject(),

                  // Last synced — visible only when BOTH toggles ON
                  new DateField(this.translate, GratuityEnum.unpaid_leave_last_synced, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.consider_unpaid_leave || !fv?.consider_auto_sync)
                    .toObject(),

                  // ── Row 4: Debt Deduction ─────────────────────────────
                  // Master toggle — always visible
                  new ToggleBuilder(this.translate, GratuityEnum.consider_debt_deduction, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onToggleDebtDeduction.bind(this))
                    .toObject(),

                  // Advance balance — visible when consider_debt_deduction ON
                  new NumberField(this.translate, GratuityEnum.debt_deduction, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMinFractionDigits(2).setMaxFractionDigits(2)
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.consider_debt_deduction)
                    .toObject(),

                  // Advance references — visible when consider_debt_deduction ON
                  new TextBuilder(this.translate, GratuityEnum.debt_deduction_remark, isEditMode, data, initialData, 'debt_deduction_remark_TC', 'autoFetchAdvances_TC')
                    .addFieldWidth('49%')
                    .isReadOnly(true)
                    .isHideFunction((fv: any) => !fv?.consider_debt_deduction)
                    .toObject(),
                ],
              },

              // ════════════════════════════════════════════════════════════
              // Tab 3: Documents
              // ════════════════════════════════════════════════════════════
              {
                tabHeader: this.translate.instant('documents_TC') || 'Documents',
                fields: [

                  // Resignation letter / termination notice
                  new FileField(this.translate, GratuityEnum.resignation_letter, isEditMode, data, initialData, 'resignation_letter_TC')
                    .addFieldWidth('32%')
                    .setAlignment('center')
                    .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                    .toObject(),

                  // Forfeiture decision document (Article 54) — always shown, contextual
                  new FileField(this.translate, GratuityEnum.forfeiture_document, isEditMode, data, initialData, 'forfeiture_document_TC')
                    .addFieldWidth('32%')
                    .setAlignment('center')
                    .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                    .isHideFunction((fv: any) => fv?.termination_reason !== 'article_54')
                    .toObject(),

                  // General supporting document
                  new FileField(this.translate, GratuityEnum.supporting_document, isEditMode, data, initialData, 'supporting_document_TC')
                    .addFieldWidth('32%')
                    .setAlignment('center')
                    .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                    .toObject(),

                ],
              },

            ])
        ];
      };
}
