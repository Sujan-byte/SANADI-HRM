import { Injectable, inject, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { EmployeeList, SalaryCalculationModel } from 'src/app/core/shared/common/model/hrm/salary-calculation.model';
import { EmployeeListEnum, SalaryCalculationEnum } from 'src/app/core/shared/common/enum/hrm-enum/salary-calculation.enum';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { GlobalMasterService } from 'src/app/modules/masters/global-master/services/global-master.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';
import { SalaryPreviewDialogComponent } from 'src/app/modules/hrm-main/salary-calculation/salary-preview-dialog/salary-preview-dialog.component';

const FILTER_CRITERIA = [
  { key: 'All',           value: 'none'          },
  { key: 'Employee Wise', value: 'employee_wise'  },
  { key: 'Employee Type', value: 'employee_type'  },
  { key: 'Designation',   value: 'designation'    },
  { key: 'Department',    value: 'department'     },
  { key: 'Sponsor',       value: 'sponsor'        },
];

// Maps filter_criteria value → which picker field name to show
const CRITERIA_FIELD_MAP: Record<string, SalaryCalculationEnum> = {
  employee_wise: SalaryCalculationEnum.filter_employee,
  employee_type: SalaryCalculationEnum.filter_employee_type,
  designation:   SalaryCalculationEnum.filter_designation,
  department:    SalaryCalculationEnum.filter_department,
  sponsor:       SalaryCalculationEnum.filter_sponsor,
};

const SELECTABLE_COLUMNS = [
  { id: EmployeeListEnum.employee_code,   name: 'Employee Code'    },
  { id: EmployeeListEnum.first_name,      name: 'First Name'       },
  { id: EmployeeListEnum.last_name,       name: 'Last Name'        },
  { id: EmployeeListEnum.employee_type,   name: 'Employee Type'    },
  { id: EmployeeListEnum.department,      name: 'Department'       },
  { id: EmployeeListEnum.designation,     name: 'Designation'      },
  { id: EmployeeListEnum.sponsors,        name: 'Sponsor'          },
  { id: EmployeeListEnum.working_days,    name: 'Working Days'     },
  { id: EmployeeListEnum.no_of_days,      name: 'Payable Days'     },
  { id: EmployeeListEnum.leave_days,      name: 'Leave Days'       },
  { id: EmployeeListEnum.basic,           name: 'Basic'            },
  { id: EmployeeListEnum.variable,        name: 'Variable'         },
  { id: EmployeeListEnum.gross_pay,       name: 'Gross Pay'        },
  { id: EmployeeListEnum.ot,              name: 'OT'               },
  { id: EmployeeListEnum.bonus,           name: 'Bonus'            },
  { id: EmployeeListEnum.other_incentive, name: 'Other Incentives' },
  { id: EmployeeListEnum.lop_amount,      name: 'LOP Amount'       },
  { id: EmployeeListEnum.earned,          name: 'Earned'           },
  { id: EmployeeListEnum.arrears,         name: 'Arrears'          },
  { id: EmployeeListEnum.advance_emi,     name: 'Advance EMI'      },
  { id: EmployeeListEnum.advance_balance, name: 'Advance Balance'  },
  { id: EmployeeListEnum.deductions_pay,    name: 'Deduction Pay'    },
  { id: EmployeeListEnum.other_allowances, name: 'Other Allowances' },
  { id: EmployeeListEnum.net_pay,          name: 'Net Pay'          },
  { id: EmployeeListEnum.salary_status,   name: 'Status'           },
  { id: EmployeeListEnum.remarks,         name: 'Remarks'          },
];

const DEFAULT_VISIBLE = new Set([
  EmployeeListEnum.employee_code,
  EmployeeListEnum.first_name,
  EmployeeListEnum.department,
  EmployeeListEnum.no_of_days,
  EmployeeListEnum.basic,
  EmployeeListEnum.variable,
  EmployeeListEnum.gross_pay,
  EmployeeListEnum.lop_amount,
  EmployeeListEnum.deductions_pay,
  EmployeeListEnum.net_pay,
  EmployeeListEnum.salary_status,
]);

@Injectable({ providedIn: 'root' })
export class SalaryCalculationFormConfig {
  private translate                                        = inject(TranslateService);
  private apiService                                       = inject(ApiService);
  private _globalMasterService                             = inject(GlobalMasterService);
  private _customDialogService: CustomDialogService        = inject(CustomDialogService);
  public  _spinner                                         = inject(NgxSpinnerService);

  // Persists the last column selection across new-record opens (singleton service)
  private _lastSelectedColumns: string[] | null = null;
  private _lastSelectedColumnsFetched = false;

  getLastSelectedColumns(): string[] | null {
    return this._lastSelectedColumns;
  }

  async fetchLastSelectedColumns(): Promise<void> {
    if (this._lastSelectedColumnsFetched) return;
    this._lastSelectedColumnsFetched = true;
    try {
      const res: any = await lastValueFrom(
        this.apiService.get('/hrm/salaryCalculation/', { required_fields: 'selected_columns', page_size: 1, ordering: '-modified' })
      );
      const last = (res?.results || res || [])[0];
      if (last?.selected_columns?.length) {
        this._lastSelectedColumns = last.selected_columns;
      }
    } catch { /* fall back to DEFAULT_VISIBLE */ }
  }

  private readonly selectionModeList = signal([
    { key: 'Date Range', value: 'date_range' },
    { key: 'Month',      value: 'month'      },
  ]);

  private readonly monthList = signal([
    { key: 'January',   value: 1  },
    { key: 'February',  value: 2  },
    { key: 'March',     value: 3  },
    { key: 'April',     value: 4  },
    { key: 'May',       value: 5  },
    { key: 'June',      value: 6  },
    { key: 'July',      value: 7  },
    { key: 'August',    value: 8  },
    { key: 'September', value: 9  },
    { key: 'October',   value: 10 },
    { key: 'November',  value: 11 },
    { key: 'December',  value: 12 },
  ]);

  private readonly filterCriteriaList = signal(FILTER_CRITERIA);

  private readonly salaryStatusList = signal([
    { key: 'Processing', value: 'processing' },
    { key: 'Processed',  value: 'processed'  },
    { key: 'Hold',       value: 'hold'       },
    { key: 'Rejected',   value: 'rejected'   },
  ]);

  // ─── Form Builder ─────────────────────────────────────────────────────────────

  public readonly SalaryCalculationForm =
    () =>
      (dataFromComponent?: any, initialData?: SalaryCalculationModel, isEditMode?: boolean, data?: SalaryCalculationModel) => {
        initialData = new SalaryCalculationModel();
        // Run flattenAllowanceDetails in edit mode so numeric fields (no_of_days, working_days, etc.)
        // are always proper JS numbers — backend returns them as strings (e.g. "22.00") which causes
        // p-inputNumber to emit null on initial render and zeroes out the save payload.
        const employee_list: EmployeeList[] = isEditMode
          ? this.flattenAllowanceDetails(data.employee_list || [])
          : [];

        const savedCols: string[] = isEditMode
          ? (data?.selected_columns?.length ? data.selected_columns : Array.from(DEFAULT_VISIBLE))
          : (this._lastSelectedColumns ?? Array.from(DEFAULT_VISIBLE));
        const isHidden = (field: string) => !savedCols.includes(field);

        // Default mode is month for new records; for edit mode restore from saved value
        const currentMode     = isEditMode ? (data?.selection_mode || 'month') : 'month';
        const isMonthMode     = currentMode === 'month';
        const savedCriteria   = isEditMode ? (data?.filter_criteria || 'none') : 'none';

        // Which picker field is visible on load (edit mode restore)
        const pickerVisible = (fieldName: SalaryCalculationEnum) =>
          savedCriteria !== 'none' && CRITERIA_FIELD_MAP[savedCriteria] === fieldName;

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'salary-tab',
                fields: [

                  // ── Accordion block ────────────────────────────────────────
                  <any>{
                    type: 'accordion',
                    fieldUniqueKey: 'salary-main-accordion',
                    multiple: true,
                    fields: [

                      // ── Accordion 1: Salary Period ─────────────────────────
                      // @ts-ignore
                      {
                        accordionHeader: 'Salary Period',
                        selected: true,
                        fieldUniqueKey: 'salary-period-acc',
                        fields: [

                          new InputField(this.translate, SalaryCalculationEnum.salary_number, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isReadOnly(true)
                            .toObject(),

                          new DropdownField(this.translate, SalaryCalculationEnum.selection_mode, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .validate(true)
                            .onChangeOnly(this.onChangeSelectionMode.bind(this))
                            .getOptions(this.selectionModeList)
                            .toObject(),

                          // Month — hidden by default (date_range is default)
                          new DropdownField(this.translate, SalaryCalculationEnum.month, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .validate(false)
                            .isFieldHidden(!isMonthMode)
                            .onChangeOnly(this.onChangeMonth.bind(this))
                            .getOptions(this.monthList)
                            .toObject(),

                          // From Date — visible in date-range mode only
                          new DateField(this.translate, SalaryCalculationEnum.from_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(!isMonthMode)
                            .setMinDateValue(null)
                            .isFieldHidden(isMonthMode)
                            .onChange(this.onChangeFromDate.bind(this))
                            .toObject(),

                          // To Date — visible in date-range mode only
                          new DateField(this.translate, SalaryCalculationEnum.to_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(!isMonthMode)
                            .isFieldHidden(isMonthMode)
                            .onChange(this.onChangeToDate.bind(this))
                            .toObject(),
                        ],
                      },

                      // ── Accordion 2: Filter Criteria ───────────────────────
                      // @ts-ignore
                      {
                        accordionHeader: 'Filter Criteria',
                        selected: true,
                        fieldUniqueKey: 'salary-filter-acc',
                        fields: [

                          new DropdownField(this.translate, SalaryCalculationEnum.filter_criteria, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .validate(false)
                            .onChangeOnly(this.onChangeFilterCriteria.bind(this))
                            .getOptions(this.filterCriteriaList)
                            .toObject(),

                          // Employee Wise picker
                          new TextBuilder(this.translate, SalaryCalculationEnum.filter_employee, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .isFieldHidden(!pickerVisible(SalaryCalculationEnum.filter_employee))
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-users',
                              toolTip: 'Select Employees',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryCalculationModel, field: any, formFields: any) =>
                                this.onClickPickerEmployee(formValue, field, formFields),
                            }])
                            .toObject(),

                          // Employee Type picker
                          new TextBuilder(this.translate, SalaryCalculationEnum.filter_employee_type, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .isFieldHidden(!pickerVisible(SalaryCalculationEnum.filter_employee_type))
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-send',
                              toolTip: 'Select Employee Type',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryCalculationModel, field: any, formFields: any) =>
                                this.onClickPickerEmployeeType(formValue, field, formFields),
                            }])
                            .toObject(),

                          // Designation picker
                          new TextBuilder(this.translate, SalaryCalculationEnum.filter_designation, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .isFieldHidden(!pickerVisible(SalaryCalculationEnum.filter_designation))
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-briefcase',
                              toolTip: 'Select Designation',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryCalculationModel, field: any, formFields: any) =>
                                this.onClickPickerDesignation(formValue, field, formFields),
                            }])
                            .toObject(),

                          // Department picker
                          new TextBuilder(this.translate, SalaryCalculationEnum.filter_department, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .isFieldHidden(!pickerVisible(SalaryCalculationEnum.filter_department))
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-building',
                              toolTip: 'Select Department',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryCalculationModel, field: any, formFields: any) =>
                                this.onClickPickerDepartment(formValue, field, formFields),
                            }])
                            .toObject(),

                          // Sponsor picker
                          new TextBuilder(this.translate, SalaryCalculationEnum.filter_sponsor, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .isFieldHidden(!pickerVisible(SalaryCalculationEnum.filter_sponsor))
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-id-card',
                              toolTip: 'Select Sponsor',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryCalculationModel, field: any, formFields: any) =>
                                this.onClickPickerSponsor(formValue, field, formFields),
                            }])
                            .toObject(),

                          // Exclude absent employees (payable days = 0) toggle
                          new ToggleBuilder(this.translate, SalaryCalculationEnum.exclude_zero_payable_days, isEditMode, data, initialData, 'exclude_zero_payable_days_TC')
                            .toObject(),
                        ],
                      },
                    ],
                  },

                  // ── Hidden ID fields (must be registered so they are included in form payload) ──
                  new InputField(this.translate, SalaryCalculationEnum.filter_employee_ids, isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  new InputField(this.translate, SalaryCalculationEnum.filter_designation_ids, isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  new InputField(this.translate, SalaryCalculationEnum.filter_department_ids, isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  // Hidden field — keeps selected_columns in formValue so openSalaryPreview can read it
                  new InputField(this.translate, SalaryCalculationEnum.selected_columns, isEditMode, data, initialData).isFieldHidden(true).toObject(),

                  // ── Employee Table ──────────────────────────────────────────

                  new TableBuilder(this.translate, SalaryCalculationEnum.employee_list, '', true)
                    .setTableCaption(true)
                    .setTableCaptionLabel('')
                    .enableGlobalSearch([
                      EmployeeListEnum.employee_code,
                      EmployeeListEnum.first_name,
                      EmployeeListEnum.last_name,
                      EmployeeListEnum.employee_type,
                      EmployeeListEnum.department,
                      EmployeeListEnum.designation,
                    ])
                    .captionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-refresh',
                        label: 'Clear & Generate',
                        toolTip: 'Clear and regenerate table data',
                        tooltipPosition: 'top',
                        onClick: async (formValue: SalaryCalculationModel, tableField: any, formFields: any) => {
                          this._spinner.show();
                          try {
                            const criteria = formValue.filter_criteria;
                            const FILTER_KEY_MAP: Record<string, { key: string; getValue: () => string }> = {
                              employee_wise: { key: 'employee',     getValue: () => formValue.filter_employee_ids || '' },
                              employee_type: { key: 'employee_type', getValue: () => formValue.filter_employee_type || '' },
                              designation:   { key: 'designation',  getValue: () => formValue.filter_designation_ids || '' },
                              department:    { key: 'department',   getValue: () => formValue.filter_department_ids || '' },
                              sponsor:       { key: 'sponsor',      getValue: () => {
                                const pickerField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.filter_sponsor);
                                return (pickerField?._selectedIds || []).join(',');
                              }},
                            };
                            const mapped = criteria ? FILTER_KEY_MAP[criteria] : null;
                            const filterKey   = mapped?.key ?? '';
                            const filterValue = mapped?.getValue() ?? '';
                            const employees = await this.loadEmployeesByFilter(formValue, filterKey, filterValue);
                            this.setTableData(formValue, formFields, employees);
                            // Patch the Angular form control so the save payload picks up the new employee_list
                            return { form: { employee_list: formValue.employee_list } };
                          } finally {
                            this._spinner.hide();
                          }
                        },
                      },
                      {
                        show: true,
                        icon: 'pi pi-table',
                        label: 'Select Columns',
                        toolTip: 'Choose columns to display',
                        tooltipPosition: 'top',
                        onClick: (formValue: SalaryCalculationModel, tableField: any, formFields: any, extras: any) =>
                          this.onSelectColumns(formValue, tableField, extras?.form),
                      },
                      {
                        show: isEditMode,
                        icon: 'pi pi-file-excel',
                        label: 'Export XLSX',
                        toolTip: 'Export to Excel',
                        tooltipPosition: 'top',
                        onClick: (formValue: SalaryCalculationModel, tableField: any) =>
                          this.onExportExcel(data?.id, formValue, tableField),
                      },
                      {
                        show: isEditMode,
                        icon: 'pi pi-file-pdf',
                        label: 'Export PDF',
                        toolTip: 'Export to PDF',
                        tooltipPosition: 'top',
                        onClick: (formValue: SalaryCalculationModel, tableField: any) =>
                          this.onExportPdf(data?.id, formValue, tableField),
                      },
                    ])
                    .actionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-calculator',
                        toolTip: 'Salary Breakdown',
                        tooltipPosition: 'top',
                        class: 'p-button-outlined p-button-rounded p-button-secondary p-button-sm',
                        onClick: (row: EmployeeList, dataSource: any, index: number, formValue: SalaryCalculationModel, tableField: any) =>
                          this.openSalaryPreview(row, formValue, tableField),
                      },
                    ])
                    .columnSchema([
                      { name: EmployeeListEnum.employee_code   + '_TC', field: EmployeeListEnum.employee_code,   frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.employee_code)   },
                      { name: EmployeeListEnum.first_name      + '_TC', field: EmployeeListEnum.first_name,      frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.first_name)      },
                      { name: EmployeeListEnum.last_name       + '_TC', field: EmployeeListEnum.last_name,       frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.last_name)       },
                      { name: EmployeeListEnum.employee_type   + '_TC', field: EmployeeListEnum.employee_type,   frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.employee_type)   },
                      { name: EmployeeListEnum.department       + '_TC', field: EmployeeListEnum.department,      frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.department)       },
                      { name: EmployeeListEnum.designation      + '_TC', field: EmployeeListEnum.designation,     frozen: true, filter: true, hidden: isHidden(EmployeeListEnum.designation)      },
                      { name: EmployeeListEnum.sponsors        + '_TC', field: EmployeeListEnum.sponsors,        filter: true,               hidden: isHidden(EmployeeListEnum.sponsors)        },
                      { name: EmployeeListEnum.working_days    + '_TC', field: EmployeeListEnum.working_days,    colWidth: '110px',          hidden: isHidden(EmployeeListEnum.working_days)    },
                      { name: EmployeeListEnum.no_of_days      + '_TC', field: EmployeeListEnum.no_of_days,      colWidth: '100px',          hidden: isHidden(EmployeeListEnum.no_of_days)      },
                      { name: EmployeeListEnum.leave_days      + '_TC', field: EmployeeListEnum.leave_days,      colWidth: '100px',          hidden: isHidden(EmployeeListEnum.leave_days)      },
                      { name: EmployeeListEnum.basic           + '_TC', field: EmployeeListEnum.basic,                                       hidden: isHidden(EmployeeListEnum.basic)           },
                      { name: EmployeeListEnum.variable        + '_TC', field: EmployeeListEnum.variable,                                    hidden: isHidden(EmployeeListEnum.variable)        },
                      { name: EmployeeListEnum.gross_pay       + '_TC', field: EmployeeListEnum.gross_pay,                                   hidden: isHidden(EmployeeListEnum.gross_pay)       },
                      { name: EmployeeListEnum.ot              + '_TC', field: EmployeeListEnum.ot,                                          hidden: isHidden(EmployeeListEnum.ot)              },
                      { name: EmployeeListEnum.other_expense   + '_TC', field: EmployeeListEnum.other_expense,                               hidden: true                                      },
                      { name: EmployeeListEnum.other_incentive + '_TC', field: EmployeeListEnum.other_incentive,                             hidden: isHidden(EmployeeListEnum.other_incentive) },
                      { name: EmployeeListEnum.bonus           + '_TC', field: EmployeeListEnum.bonus,                                       hidden: isHidden(EmployeeListEnum.bonus)           },
                      { name: EmployeeListEnum.advance         + '_TC', field: EmployeeListEnum.advance,                                     hidden: true                                      },
                      { name: EmployeeListEnum.advance_emi     + '_TC', field: EmployeeListEnum.advance_emi,                                 hidden: isHidden(EmployeeListEnum.advance_emi)     },
                      { name: EmployeeListEnum.tds             + '_TC', field: EmployeeListEnum.tds,                                         hidden: true                                      },
                      { name: EmployeeListEnum.income_tax      + '_TC', field: EmployeeListEnum.income_tax,                                  hidden: true                                      },
                      { name: EmployeeListEnum.lop_amount      + '_TC', field: EmployeeListEnum.lop_amount,                                  hidden: isHidden(EmployeeListEnum.lop_amount)      },
                      { name: EmployeeListEnum.earned          + '_TC', field: EmployeeListEnum.earned,                                      hidden: isHidden(EmployeeListEnum.earned)          },
                      { name: EmployeeListEnum.arrears         + '_TC', field: EmployeeListEnum.arrears,                                     hidden: isHidden(EmployeeListEnum.arrears)         },
                      { name: EmployeeListEnum.advance_balance + '_TC', field: EmployeeListEnum.advance_balance,                             hidden: isHidden(EmployeeListEnum.advance_balance) },
                      { name: EmployeeListEnum.deductions_pay    + '_TC', field: EmployeeListEnum.deductions_pay,                                hidden: isHidden(EmployeeListEnum.deductions_pay)    },
                      { name: EmployeeListEnum.other_allowances  + '_TC', field: EmployeeListEnum.other_allowances,                              hidden: isHidden(EmployeeListEnum.other_allowances)   },
                      { name: EmployeeListEnum.net_pay           + '_TC', field: EmployeeListEnum.net_pay,                                     hidden: isHidden(EmployeeListEnum.net_pay)           },
                      { name: EmployeeListEnum.salary_status   + '_TC', field: EmployeeListEnum.salary_status,  filter: true,               hidden: isHidden(EmployeeListEnum.salary_status)   },
                      { name: EmployeeListEnum.remarks         + '_TC', field: EmployeeListEnum.remarks,                                     hidden: isHidden(EmployeeListEnum.remarks)         },
                    ])
                    .formInitialise<EmployeeList>(new EmployeeList())
                    .formSchema([
                      { name: EmployeeListEnum.employee_code,            type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.employee_code)   },
                      { name: EmployeeListEnum.first_name,               type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.first_name)      },
                      { name: EmployeeListEnum.last_name,                type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.last_name)       },
                      { name: EmployeeListEnum.employee_type,            type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.employee_type)   },
                      { name: EmployeeListEnum.department,               type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.department)      },
                      { name: EmployeeListEnum.designation,              type: 'input',  readonly: true, frozen: true, left: 0, hidden: isHidden(EmployeeListEnum.designation)     },
                      { name: EmployeeListEnum.sponsors,                 type: 'input',  readonly: true,              hidden: isHidden(EmployeeListEnum.sponsors)        },
                      { name: EmployeeListEnum.working_days,             type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.working_days)    },
                      { name: EmployeeListEnum.no_of_days,               type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.no_of_days)      },
                      { name: EmployeeListEnum.leave_days,               type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.leave_days)      },
                      { name: EmployeeListEnum.basic,                    type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.basic)           },
                      { name: EmployeeListEnum.variable,                 type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.variable)        },
                      { name: EmployeeListEnum.gross_pay,                type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.gross_pay)       },
                      { name: EmployeeListEnum.ot,                       type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.ot)              },
                      { name: EmployeeListEnum.other_expense,            type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: true                                      },
                      { name: EmployeeListEnum.other_incentive,          type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.other_incentive) },
                      { name: EmployeeListEnum.bonus,                    type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.bonus)           },
                      { name: EmployeeListEnum.advance,                  type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: true                                      },
                      { name: EmployeeListEnum.advance_emi,              type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.advance_emi)     },
                      { name: EmployeeListEnum.tds,                      type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: true                                      },
                      { name: EmployeeListEnum.income_tax,               type: 'number', onValueChange: this.onChangeFields.bind(this), maxFractionDigits: 0, minFractionDigits: 0, hidden: true                                      },
                      { name: EmployeeListEnum.lop_amount,               type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.lop_amount)      },
                      { name: EmployeeListEnum.earned,                   type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.earned)          },
                      { name: EmployeeListEnum.arrears,                  type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.arrears)         },
                      { name: EmployeeListEnum.advance_balance,          type: 'number', readonly: true,  maxFractionDigits: 2, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.advance_balance) },
                      { name: EmployeeListEnum.deductions_pay,           type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.deductions_pay)    },
                      { name: EmployeeListEnum.other_allowances,         type: 'number', readonly: true,  maxFractionDigits: 2, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.other_allowances)   },
                      { name: EmployeeListEnum.net_pay,                  type: 'number', readonly: true,  maxFractionDigits: 0, minFractionDigits: 0, hidden: isHidden(EmployeeListEnum.net_pay)           },
                      { name: EmployeeListEnum.allowance_details,        type: 'input',  hidden: true },
                      { name: EmployeeListEnum.deduction_details,        type: 'input',  hidden: true },
                      { name: EmployeeListEnum.employer_pf_contribution, type: 'number', hidden: true },
                      { name: EmployeeListEnum.salary_breakdown,         type: 'input',  hidden: true },
                      { name: EmployeeListEnum.salary_status, type: 'dropdown', optionLabel: 'key', optionValue: 'value', options: this.salaryStatusList(), hidden: isHidden(EmployeeListEnum.salary_status) },
                      { name: EmployeeListEnum.remarks,       type: 'input',  hidden: isHidden(EmployeeListEnum.remarks) },
                    ])
                    .getDatasource<Array<EmployeeList>>('id', employee_list)
                    .enableFooter(true)
                    .setAddButton(true)
                    .tableRowsCount(10)
                    .build(),
                ],
              },
            ])
        ];
      };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private getTabField(formFields: any, matcher: (f: any) => boolean) {
    const tabFields: any[] = formFields
      ?.find((f: any) => f?.fieldUniqueKey === 'salary-tab')
      ?.fields || [];

    // Search top-level fields first
    const topLevel = tabFields.find(matcher);
    if (topLevel) return topLevel;

    // Search inside accordion panels
    const accordion = tabFields.find((f: any) => f?.type === 'accordion');
    if (!accordion) return undefined;
    for (const panel of (accordion.fields || [])) {
      const found = (panel.fields || []).find(matcher);
      if (found) return found;
    }
    return undefined;
  }

  private getAllPickerFieldNames(): SalaryCalculationEnum[] {
    return [
      SalaryCalculationEnum.filter_employee,
      SalaryCalculationEnum.filter_employee_type,
      SalaryCalculationEnum.filter_designation,
      SalaryCalculationEnum.filter_department,
      SalaryCalculationEnum.filter_sponsor,
    ];
  }

  private clearTable(formValue: SalaryCalculationModel, formFields: any) {
    formValue.employee_list = [];
    const tableField = this.getTabField(formFields, (f: any) => f?.type === 'table');
    if (tableField) tableField.dataSource = [];
  }

  private flattenAllowanceDetails(list: any[]): EmployeeList[] {
    return list.map(row => {
      const details: Record<string, number> = row.allowance_details || {};
      // Prefer values sent directly by backend; fall back to allowance_details dict for saved records
      let basic: number, variable: number;
      if (row.basic != null) {
        basic    = Number(row.basic);
        variable = Number(row.variable);
      } else {
        basic = Object.entries(details)
          .filter(([k]) => k.toLowerCase().includes('basic'))
          .reduce((sum, [, v]) => sum + Number(v || 0), 0);
        variable = Object.entries(details)
          .filter(([k]) => !k.toLowerCase().includes('basic'))
          .reduce((sum, [, v]) => sum + Number(v || 0), 0);
      }
      return {
        ...row,
        basic,
        variable,
        no_of_days:   Number(row.no_of_days   ?? 0),
        working_days: Number(row.working_days  ?? 0),
        leave_days:   Number(row.leave_days    ?? 0),
      };
    });
  }

  private setTableData(formValue: SalaryCalculationModel, formFields: any, list: any[]) {
    const flattened = this.flattenAllowanceDetails(list);
    formValue.employee_list = flattened;
    this.recomputeAllRows(formValue);
    const tableField = this.getTabField(formFields, (f: any) => f?.type === 'table');
    // Use formValue.employee_list (post-recompute) so table renders mutated earned/net_pay values
    if (tableField) tableField.dataSource = [...formValue.employee_list];
  }

  // ─── Selection Mode ───────────────────────────────────────────────────────────

  onChangeSelectionMode(prev: any, next: string, formValue: SalaryCalculationModel, formFields: any) {
    if (!next) return formValue;
    const isMonth = next === 'month';

    const monthField    = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.month);
    const fromDateField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.from_date);
    const toDateField   = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.to_date);

    if (monthField)    monthField.hidden   = !isMonth;

    if (fromDateField) {
      fromDateField.hidden = isMonth;
      if (fromDateField.validation) fromDateField.validation.required = !isMonth;
    }
    if (toDateField) {
      toDateField.hidden = isMonth;
      if (toDateField.validation) toDateField.validation.required = !isMonth;
    }

    formValue.from_date = null;
    formValue.to_date   = null;
    formValue.month     = null;
    this.clearTable(formValue, formFields);
    return formValue;
  }

  onChangeMonth(prev: any, next: number, formValue: SalaryCalculationModel, formFields: any) {
    if (!next) return formValue;
    const year  = new Date().getFullYear();
    const m     = Number(next);
    const pad   = (n: number) => String(n).padStart(2, '0');
    const first = new Date(year, m - 1, 1);
    const last  = new Date(year, m, 0);
    formValue.from_date = `${pad(first.getDate())}-${pad(first.getMonth() + 1)}-${first.getFullYear()}` as any;
    formValue.to_date   = `${pad(last.getDate())}-${pad(last.getMonth() + 1)}-${last.getFullYear()}` as any;
    this.clearTable(formValue, formFields);
    return formValue;
  }

  // ─── Filter Criteria ──────────────────────────────────────────────────────────

  async onChangeFilterCriteria(prev: any, next: string, formValue: SalaryCalculationModel, formFields: any, form?: any) {
    // Hide all picker fields and clear their stored IDs
    for (const fieldName of this.getAllPickerFieldNames()) {
      const f = this.getTabField(formFields, (f: any) => f?.name === fieldName);
      if (f) { f.hidden = true; f._selectedIds = []; }
    }
    // Clear all picker values
    formValue.filter_employee         = null;
    formValue.filter_employee_ids     = null;
    formValue.filter_employee_type    = null;
    formValue.filter_designation      = null;
    formValue.filter_designation_ids  = null;
    formValue.filter_department       = null;
    formValue.filter_department_ids   = null;
    formValue.filter_sponsor          = null;

    // Show the relevant picker
    if (next && next !== 'none' && CRITERIA_FIELD_MAP[next]) {
      const targetField = this.getTabField(formFields, (f: any) => f?.name === CRITERIA_FIELD_MAP[next]);
      if (targetField) targetField.hidden = false;
    }

    this.clearTable(formValue, formFields);

    // None = all employees — load immediately without a picker
    if (next === 'none' || !next) {
      this._spinner.show();
      try {
        const employees = await this.loadEmployeesByFilter(formValue, '', '');
        const flattened = this.flattenAllowanceDetails(employees);
        formValue.employee_list = flattened;
        this.recomputeAllRows(formValue);
        const tableField = this.getTabField(formFields, (f: any) => f?.type === 'table');
        if (tableField) tableField.dataSource = [...formValue.employee_list];
        if (form) form.patchValue({ employee_list: formValue.employee_list });
      } finally {
        this._spinner.hide();
      }
    }

    return formValue;
  }

  // ─── Picker: Employee Wise ────────────────────────────────────────────────────

  async onClickPickerEmployee(formValue: SalaryCalculationModel, field: any, formFields: any) {
    const pickerField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.filter_employee);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_employee_ids) {
      pickerField._selectedIds = formValue.filter_employee_ids.toString().split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    // Use the same fast filter_employees endpoint as allowance-assignment:
    // it uses .only() server-side — returns only 5 fields, much faster than full employee master
    this._spinner.show();
    let allEmployees: any[] = [];
    try {
      const r: any = await lastValueFrom(
        this.apiService.get('/master/allowance-assignment/filter_employees/', { filter_criteria: 'employee_wise' })
      );
      allEmployees = r || [];
    } finally {
      this._spinner.hide();
    }

    const list = allEmployees.map((e: any) => ({
      id:               String(e.employee),
      employee_code:    e.employee_code    || '',
      employee_name:    e.employee_name    || '',
      designation_name: e.designation_name || '',
      department_name:  e.department_name  || '',
    }));

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Employees', dialogConfig: { height: '80%', width: '55%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [
            { name: 'Code',        field: 'employee_code',    filter: true },
            { name: 'Name',        field: 'employee_name',    filter: true },
            { name: 'Designation', field: 'designation_name', filter: true },
            { name: 'Department',  field: 'department_name',  filter: true },
          ],
          rows: 15,
          scrollHeight: '55vh',
          formInitialise: ['employee_code', 'employee_name', 'designation_name', 'department_name'],
          paginator: true,
          scrollable: true,
          lazy: false,
          list,
          selectedArray: list.filter((e: any) => existing.includes(e.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_employee = selected.map((s: any) => `${s.employee_code} - ${s.employee_name}`).join(', ');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);
    formValue.filter_employee_ids = selected.map((s: any) => s.id).join(',');

    this._spinner.show();
    try {
      const employees = await this.loadEmployeesByFilter(formValue, 'employee', formValue.filter_employee_ids);
      this.setTableData(formValue, formFields, employees);
    } finally {
      this._spinner.hide();
    }
    return formValue;
  }

  // ─── Picker: Employee Type ────────────────────────────────────────────────────

  async onClickPickerEmployeeType(formValue: SalaryCalculationModel, field: any, formFields: any) {
    const selectedArray = this._globalMasterService.generateArray(formValue?.filter_employee_type || '');
    const response = await this._globalMasterService.addGlobalMaster(formValue, {
      queryParams:    { is_active: true, global_key: 'employee_type' },
      pageTitle:      'Select Employee Type',
      columnHeader:   'Employee Type',
      selectedArray,
    });
    if (!response) return formValue;

    formValue.filter_employee_type = this._globalMasterService.generateString(response?.tempArray || []);

    this._spinner.show();
    try {
      const employees = await this.loadEmployeesByFilter(formValue, 'employee_type', formValue.filter_employee_type);
      this.setTableData(formValue, formFields, employees);
    } finally {
      this._spinner.hide();
    }
    return formValue;
  }

  // ─── Picker: Designation ──────────────────────────────────────────────────────

  async onClickPickerDesignation(formValue: SalaryCalculationModel, field: any, formFields: any) {
    const pickerField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.filter_designation);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_designation_ids) {
      pickerField._selectedIds = formValue.filter_designation_ids.toString().split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    const allDesignations: any[] = await this.apiService
      .get(`${ServiceUrlConstants.DESIGNATION_CRUD}`, { is_active: true, required_fields: 'id,designation_code,designation_name' })
      .toPromise()
      .then((r: any) => r?.results || r || []);

    const list = allDesignations.map((d: any) => ({
      id:   String(d.id),
      name: `${d.designation_code} - ${d.designation_name}`,
    }));

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Designation', dialogConfig: { height: '80%', width: '40%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [{ name: 'Designation', field: 'name', filter: true }],
          rows: 15,
          scrollHeight: '55vh',
          formInitialise: ['name'],
          paginator: true,
          scrollable: true,
          lazy: false,
          list,
          selectedArray: list.filter((d: any) => existing.includes(d.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_designation = selected.map((s: any) => s.name).join(', ');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);
    formValue.filter_designation_ids = selected.map((s: any) => s.id).join(',');

    this._spinner.show();
    try {
      const employees = await this.loadEmployeesByFilter(formValue, 'designation', formValue.filter_designation_ids);
      this.setTableData(formValue, formFields, employees);
    } finally {
      this._spinner.hide();
    }
    return formValue;
  }

  // ─── Picker: Department ───────────────────────────────────────────────────────

  async onClickPickerDepartment(formValue: SalaryCalculationModel, field: any, formFields: any) {
    const pickerField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.filter_department);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_department_ids) {
      pickerField._selectedIds = formValue.filter_department_ids.toString().split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    const allDepartments: any[] = await this.apiService
      .get(`${ServiceUrlConstants.DEPARTMENT_CRUD}`, { is_active: true, required_fields: 'id,department_code,department_name' })
      .toPromise()
      .then((r: any) => r?.results || r || []);

    const list = allDepartments.map((d: any) => ({
      id:   String(d.id),
      name: `${d.department_code} - ${d.department_name}`,
    }));

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Department', dialogConfig: { height: '80%', width: '40%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [{ name: 'Department', field: 'name', filter: true }],
          rows: 15,
          scrollHeight: '55vh',
          formInitialise: ['name'],
          paginator: true,
          scrollable: true,
          lazy: false,
          list,
          selectedArray: list.filter((d: any) => existing.includes(d.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_department = selected.map((s: any) => s.name).join(', ');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);
    formValue.filter_department_ids = selected.map((s: any) => s.id).join(',');

    this._spinner.show();
    try {
      const employees = await this.loadEmployeesByFilter(formValue, 'department', formValue.filter_department_ids);
      this.setTableData(formValue, formFields, employees);
    } finally {
      this._spinner.hide();
    }
    return formValue;
  }

  // ─── Picker: Sponsor ──────────────────────────────────────────────────────────

  async onClickPickerSponsor(formValue: SalaryCalculationModel, _field: any, formFields: any) {
    const pickerField = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.filter_sponsor);

    const allSponsors: any[] = await this.apiService
      .get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`, { is_active: true, required_fields: 'sponsors', page_size: 9999 })
      .toPromise()
      .then((r: any) => {
        const results: any[] = r?.results || r || [];
        const unique = [...new Set(
          results
            .flatMap((e: any) => (e.sponsors || '').split(/[\n]+/))
            .map((s: string) => s.trim())
            .filter((s: string) => s)
        )].sort();
        return unique.map((s: string) => ({ id: s, name: s }));
      });

    const existing: string[] = (formValue.filter_sponsor || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Sponsor', dialogConfig: { height: '80%', width: '40%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [{ name: 'Sponsor', field: 'name', filter: true }],
          rows: 15,
          scrollHeight: '55vh',
          formInitialise: ['name'],
          paginator: true,
          scrollable: true,
          lazy: false,
          list: allSponsors,
          selectedArray: allSponsors.filter((s: any) => existing.includes(s.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_sponsor = selected.map((s: any) => s.name).join(', ');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);

    this._spinner.show();
    try {
      const employees = await this.loadEmployeesByFilter(formValue, 'sponsor', selected.map((s: any) => s.id).join(','));
      this.setTableData(formValue, formFields, employees);
    } finally {
      this._spinner.hide();
    }
    return formValue;
  }

  // ─── API: Load Employees ──────────────────────────────────────────────────────

  private async loadEmployeesByFilter(formValue: SalaryCalculationModel, filterKey: string, filterValue: string): Promise<EmployeeList[]> {
    const { from_date, to_date, month, selection_mode } = formValue;
    const isMonthMode = selection_mode === 'month' || (!selection_mode && month);
    let url = `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}employee_salary/?`;
    if (filterKey && filterValue) {
      url += `${filterKey}=${encodeURIComponent(filterValue)}&`;
    }
    if (isMonthMode && month) {
      url += `month=${month}`;
    } else {
      url += `from_date=${from_date}&to_date=${to_date}`;
    }
    // Pass exclude_zero_payable flag (default true = exclude fully-absent employees)
    const excludeZero = formValue.exclude_zero_payable_days !== false;
    url += `&exclude_zero_payable=${excludeZero}`;
    return this.apiService.get(url).toPromise().then((r: any) => r || []);
  }

  // ─── Column Selector ──────────────────────────────────────────────────────────

  async onSelectColumns(formValue: SalaryCalculationModel, tableField: any, form?: any) {
    const currentVisible = new Set(
      (tableField?.columnSchema || [])
        .filter((c: any) => !c.hidden)
        .map((c: any) => c.field)
    );

    const list = SELECTABLE_COLUMNS.map(col => ({
      ...col,
      _preselected: currentVisible.has(col.id),
    }));

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Columns', dialogConfig: { height: '70%', width: '35%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [{ name: 'Column', field: 'name', filter: false }],
          rows: SELECTABLE_COLUMNS.length + 1,
          scrollHeight: '45vh',
          formInitialise: ['name'],
          paginator: true,
          scrollable: true,
          lazy: false,
          list,
          selectedArray: list.filter(c => c._preselected),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return;

    const selected: any[] = response?.tempArray || [];
    const selectedIds = new Set(selected.map((s: any) => s.id));

    for (const col of (tableField?.columnSchema || [])) {
      if (SELECTABLE_COLUMNS.some(c => c.id === col.field)) col.hidden = !selectedIds.has(col.field);
    }
    for (const cell of (tableField?.formSchema || [])) {
      if (SELECTABLE_COLUMNS.some(c => c.id === cell.name)) cell.hidden = !selectedIds.has(cell.name);
    }
    const cols = Array.from(selectedIds);
    formValue.selected_columns = cols as any;
    this._lastSelectedColumns = cols;
    // Patch reactive form control so formValue.selected_columns is always current
    if (form) form.patchValue({ selected_columns: cols });

    // Recompute all rows based on newly selected columns and refresh table
    this.recomputeAllRows(formValue);
    if (tableField) tableField.dataSource = [...formValue.employee_list];
  }

  private recomputeAllRows(formValue: SalaryCalculationModel) {
    if (!formValue?.employee_list?.length) return;
    // If no columns selected yet, use DEFAULT_VISIBLE so calculation isn't skipped
    const effectiveFormValue = formValue?.selected_columns?.length
      ? formValue
      : { ...formValue, selected_columns: Array.from(DEFAULT_VISIBLE) as any };
    // Spread each item to create new references so Angular detects the changes
    formValue.employee_list = formValue.employee_list.map(item => {
      const copy = { ...item } as any;
      this.onChangeFields(null, copy, effectiveFormValue);
      return copy;
    });
  }

  // ─── Salary Breakdown Preview ─────────────────────────────────────────────────

  async openSalaryPreview(row: EmployeeList, formValue?: SalaryCalculationModel, _tableField?: any): Promise<any> {
    const cols = new Set((formValue as any)?.selected_columns || []);
    const otherAllowancesVisible = !cols.size || cols.has(EmployeeListEnum.other_allowances);
    const updated: any = await this._customDialogService.openDialog(
      {
        pageTitle: `Salary Breakdown — ${row.employee_code || ''} ${row.first_name || ''}`.trim(),
        dialogConfig: { width: '780px', height: 'auto' },
      },
      SalaryPreviewDialogComponent,
      { row, otherAllowancesVisible, selectedColumns: Array.from(cols) },
    );

    if (!updated) return null;   // user closed without applying

    // Recompute earned / net_pay / deductions_pay on the updated row
    this.onChangeFields(null, updated, formValue || {} as any);

    // Return { tableValue: updated } so table-field.component's onClickActionButton
    // calls updateTableValue() which does Object.assign on the matching dataSource row by id
    return { tableValue: updated };
  }

  // ─── Row Field Change ─────────────────────────────────────────────────────────

  onChangeFields(event: any, item: EmployeeList, formValue: SalaryCalculationModel) {
    const cols = new Set(formValue?.selected_columns || []);
    const isVisible = (col: string) => !cols.size || cols.has(col);

    // gross_pay = base salary only (OT and bonus shown separately)
    item.gross_pay = Math.round(Number(item.base_gross_amount));

    // earned = gross_earnings + (ot if visible) + (bonus if visible) + (other_incentive if visible) + (other_expense if visible) + (other_allowances if visible) - lop_amount
    const ot               = isVisible(EmployeeListEnum.ot)               ? Number(item.ot)               : 0;
    const bonus            = isVisible(EmployeeListEnum.bonus)            ? Number(item.bonus)            : 0;
    const otherIncentive   = isVisible(EmployeeListEnum.other_incentive)  ? Number(item.other_incentive)  : 0;
    const otherExpense     = isVisible(EmployeeListEnum.other_expense)    ? Number(item.other_expense)    : 0;
    const otherAllowances  = isVisible(EmployeeListEnum.other_allowances) ? Number(item.other_allowances) : 0;
    item.earned = Math.max(0, Math.round(Number(item.base_gross_amount) + ot + bonus + otherIncentive + otherExpense + otherAllowances - Number(item.lop_amount)));

    // deductions_pay = base deductions + (advance_emi if visible)
    const advanceEmi    = isVisible(EmployeeListEnum.advance_emi) ? Number(item.advance_emi) : 0;
    item.deductions_pay = Math.round(Number(item.base_deductions_amount) + advanceEmi);

    const arrears  = isVisible(EmployeeListEnum.arrears) ? Number(item.arrears) : 0;
    item.net_pay = Math.round(item.earned - item.deductions_pay + arrears);
    // Note: other_allowances is already factored into item.earned above
    return item;
  }

  onChangeFromDate(prev: any, next: any, formValue: SalaryCalculationModel, formFields: any) {
    if (next) {
      const parts    = formValue.from_date.toString().split('-');
      const fromDate = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      const toField  = this.getTabField(formFields, (f: any) => f?.name === SalaryCalculationEnum.to_date);
      if (toField) toField.minDateValue = new Date(fromDate);
      formValue.to_date = null;
    }
    return formValue;
  }

  onChangeToDate(prev: any, next: any, formValue: SalaryCalculationModel, formFields: any) {
    return formValue;
  }

  // ─── Export Helpers ───────────────────────────────────────────────────────────

  private getVisibleColumns(tableField: any): { header: string; field: string }[] {
    return (tableField?.columnSchema || [])
      .filter((c: any) => !c.hidden)
      .map((c: any) => ({
        header: c.name.replace('_TC', '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        field:  c.field,
      }));
  }

  private async _downloadExport(id: any, fields: string, ext: 'excel' | 'pdf', filename: string) {
    const b_id   = localStorage.getItem('b_id') || '';
    const token  = localStorage.getItem('accessToken') || '';
    const base   = ServiceUrlConstants.BASE_URL.replace(/\/$/, '');

    // Replicate the JWT interceptor's client-prefix injection
    const hostname = window.location.hostname;
    const match    = hostname.match(/(.*?)\./);
    const client   = match ? match[1] : '';
    const clientPrefix = client ? `${client}/` : '';

    const url = `${base}/${clientPrefix}hrm/salaryCalculation/${id}/export_salary_${ext}/?b_id=${b_id}&fields=${fields}`;
    const response = await fetch(url, {
      method:  'GET',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    });
    if (!response.ok) return;
    const blob   = await response.blob();
    const anchor = document.createElement('a');
    anchor.href  = URL.createObjectURL(blob);
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async onExportExcel(id: any, formValue: SalaryCalculationModel, tableField: any) {
    const fields = this.getExportFields(formValue, tableField);
    await this._downloadExport(id, fields, 'excel',
      `Salary_${formValue.salary_number || 'Sheet'}.xlsx`);
  }

  async onExportPdf(id: any, formValue: SalaryCalculationModel, tableField: any) {
    const fields = this.getExportFields(formValue, tableField);
    await this._downloadExport(id, fields, 'pdf',
      `Salary_${formValue.salary_number || 'Sheet'}.pdf`);
  }

  private getExportFields(formValue: SalaryCalculationModel, tableField: any): string {
    // Prefer live column schema visible state
    const visible = this.getVisibleColumns(tableField).map(c => c.field);
    if (visible.length) return visible.join(',');
    // Fall back to saved columns on the record
    if (formValue?.selected_columns?.length) return formValue.selected_columns.join(',');
    // Last resort: last selected columns cache
    if (this._lastSelectedColumns?.length) return this._lastSelectedColumns.join(',');
    return Array.from(DEFAULT_VISIBLE).join(',');
  }
}
