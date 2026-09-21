import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { lastValueFrom } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';
import { OtAllowanceBreakdownDialogComponent } from 'src/app/modules/hrm-main/ot-salary-calculation/ot-allowance-breakdown-dialog/ot-allowance-breakdown-dialog.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { OTSalaryCalculationModel, OTEmployeeList } from 'src/app/core/shared/common/model/hrm/ot-salary-calculation.model';
import {
  OTSalaryCalculationEnum,
  OTEmployeeListEnum,
  otPayrollTypeList,
  otFilterTypeList,
} from 'src/app/core/shared/common/enum/hrm-enum/ot-salary-calculation.enum';

// Only Allowance is selectable (computed by backend; user may want to hide it)
const SELECTABLE_COLUMNS = [
  { id: OTEmployeeListEnum.allowance, name: 'Allowance' },
];

@Injectable({ providedIn: 'root' })
export class OTSalaryCalculationFormConfig {
  private translate            = inject(TranslateService);
  private apiService           = inject(ApiService);
  private _customDialogService = inject(CustomDialogService);
  public  _spinner             = inject(NgxSpinnerService);

  // ── Signal-based option lists ─────────────────────────────────────────────
  private readonly selectionModeList = signal([
    { key: 'Month',      value: 'month'      },
    { key: 'Date Range', value: 'date_range' },
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

  private readonly payrollTypeList = signal(otPayrollTypeList);
  private readonly filterTypeList  = signal(otFilterTypeList);

  // Last selected (visible) columns — updated by onSelectColumns, read by onSaveFormData.
  _lastSelectedColumns: string[] | null = null;

  getLastSelectedColumns(): string[] | null { return this._lastSelectedColumns; }

  // ── Form Builder ──────────────────────────────────────────────────────────

  public readonly OTSalaryCalculationForm =
    () =>
      (dataFromComponent?: any, initialData?: OTSalaryCalculationModel, isEditMode?: boolean, data?: OTSalaryCalculationModel) => {
        initialData = new OTSalaryCalculationModel();

        const ot_employee_list = isEditMode ? (data?.ot_employee_list || []) : [];
        const currentMode      = isEditMode ? (data?.selection_mode || 'month') : 'month';
        const isMonthMode      = currentMode === 'month';
        const savedFilterType  = isEditMode ? (data?.filter_type || '') : '';

        // Restore saved column visibility. selected_columns stores VISIBLE column IDs.
        // [] = never configured → default all visible.
        // ['__configured__'] = explicitly configured with all hidden → nothing visible.
        // ['allowance', ...] = those specific columns are visible.
        const rawSaved: string[] = isEditMode ? (data?.selected_columns || []) : [];
        const savedCols: string[] = rawSaved.length
          ? rawSaved.filter(c => c !== '__configured__')   // strip sentinel; result may be []
          : SELECTABLE_COLUMNS.map(c => c.id);             // never saved → all visible
        this._lastSelectedColumns = rawSaved.length ? savedCols : null;
        const isColVisible = (colId: string) => savedCols.includes(colId);

        // Which filter picker is visible on load in edit mode
        const pickerVisible = (type: string) =>
          (data?.payroll_type === 'All') && savedFilterType === type;

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'ot-salary-tab',
                fields: [

                  // ── Auto-generated payroll number ─────────────────────────
                  new InputField(this.translate, OTSalaryCalculationEnum.ot_payroll_number, isEditMode, data, initialData, undefined, this.translate.instant('autogeneratedField_TC'))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),

                  // ── Payroll Type ──────────────────────────────────────────
                  new DropdownField(this.translate, OTSalaryCalculationEnum.payroll_type, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .variantType('basic')
                    .addKeyValueLabel('label', 'value')
                    .isNeedFilter(false)
                    .getOptions(this.payrollTypeList)
                    .onChangeOnly(this.onChangePayrollType.bind(this))
                    .toObject(),

                  // ── Selection Mode ────────────────────────────────────────
                  new DropdownField(this.translate, OTSalaryCalculationEnum.selection_mode, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('key', 'value')
                    .isNeedFilter(false)
                    .getOptions(this.selectionModeList)
                    .onChangeOnly(this.onChangeSelectionMode.bind(this))
                    .toObject(),

                  // ── Month picker (month mode only) ────────────────────────
                  new DropdownField(this.translate, OTSalaryCalculationEnum.month, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('key', 'value')
                    .validate(false)
                    .isFieldHidden(!isMonthMode)
                    .isNeedFilter(false)
                    .getOptions(this.monthList)
                    .onChangeOnly(this.onChangeMonth.bind(this))
                    .toObject(),

                  // ── From Date (date-range mode only) ──────────────────────
                  new DateField(this.translate, OTSalaryCalculationEnum.from_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(!isMonthMode)
                    .setMinDateValue(null)
                    .isFieldHidden(isMonthMode)
                    .onChange(this.onChangeFromDate.bind(this))
                    .toObject(),

                  // ── To Date (date-range mode only) ────────────────────────
                  new DateField(this.translate, OTSalaryCalculationEnum.to_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(!isMonthMode)
                    .isFieldHidden(isMonthMode)
                    .onChange(this.onChangeToDate.bind(this))
                    .onSelect(this.onSelectToDate.bind(this))
                    .toObject(),

                  // ── Filter Type (All path only) ───────────────────────────
                  new DropdownField(this.translate, OTSalaryCalculationEnum.filter_type, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .variantType('basic')
                    .addKeyValueLabel('label', 'value')
                    .isNeedFilter(false)
                    .getOptions(this.filterTypeList)
                    .onChangeOnly(this.onChangeFilterType.bind(this))
                    .isFieldHidden(data?.payroll_type !== 'All')
                    .toObject(),

                  // ── Individual picker ─────────────────────────────────────
                  new TextBuilder(this.translate, OTSalaryCalculationEnum.filter_employee, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('40%')
                    .isReadOnly(true)
                    .isFieldHidden(!pickerVisible('Individual'))
                    .actionButtonConfig([{
                      show: true,
                      icon: 'pi pi-users',
                      toolTip: 'Select Employees',
                      tooltipPosition: 'top',
                      class: 'p-button-help p-button-sm',
                      onClick: (fv: OTSalaryCalculationModel, field: any, formFields: any) =>
                        this.onClickPickerEmployee(fv, field, formFields),
                    }])
                    .toObject(),

                  // ── Designation picker ────────────────────────────────────
                  new TextBuilder(this.translate, OTSalaryCalculationEnum.filter_designation, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('40%')
                    .isReadOnly(true)
                    .isFieldHidden(!pickerVisible('Designation'))
                    .actionButtonConfig([{
                      show: true,
                      icon: 'pi pi-briefcase',
                      toolTip: 'Select Designation',
                      tooltipPosition: 'top',
                      class: 'p-button-help p-button-sm',
                      onClick: (fv: OTSalaryCalculationModel, field: any, formFields: any) =>
                        this.onClickPickerDesignation(fv, field, formFields),
                    }])
                    .toObject(),

                  // ── Department picker ─────────────────────────────────────
                  new TextBuilder(this.translate, OTSalaryCalculationEnum.filter_department, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('40%')
                    .isReadOnly(true)
                    .isFieldHidden(!pickerVisible('Department'))
                    .actionButtonConfig([{
                      show: true,
                      icon: 'pi pi-building',
                      toolTip: 'Select Department',
                      tooltipPosition: 'top',
                      class: 'p-button-help p-button-sm',
                      onClick: (fv: OTSalaryCalculationModel, field: any, formFields: any) =>
                        this.onClickPickerDepartment(fv, field, formFields),
                    }])
                    .toObject(),

                  // ── Hidden ID fields ──────────────────────────────────────
                  new InputField(this.translate, OTSalaryCalculationEnum.filter_employee_ids,    isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  new InputField(this.translate, OTSalaryCalculationEnum.filter_designation_ids, isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  new InputField(this.translate, OTSalaryCalculationEnum.filter_department_ids,  isEditMode, data, initialData).isFieldHidden(true).toObject(),
                  // ── Employee table ────────────────────────────────────────
                  new TableBuilder(this.translate, OTSalaryCalculationEnum.ot_employee_list, '', true)
                    .setTableCaption(true)
                    .setTableCaptionLabel('')
                    .enableGlobalSearch([
                      OTEmployeeListEnum.employee_code,
                      OTEmployeeListEnum.first_name,
                      OTEmployeeListEnum.last_name,
                      OTEmployeeListEnum.designation,
                      OTEmployeeListEnum.department,
                    ])
                    .captionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-refresh',
                        label: 'Generate',
                        toolTip: 'Fetch OT employees for selected period',
                        tooltipPosition: 'top',
                        onClick: async (formValue: OTSalaryCalculationModel, tableField: any, formFields: any) => {
                          return await this.fetchOTEmployees(formValue, formFields);
                        },
                      },
                      {
                        show: true,
                        icon: 'pi pi-table',
                        label: 'Select Columns',
                        toolTip: 'Choose columns to display',
                        tooltipPosition: 'top',
                        onClick: (formValue: OTSalaryCalculationModel, tableField: any, formFields: any) =>
                          this.onSelectColumns(formValue, tableField, formFields),
                      },
                      {
                        show: true,
                        icon: 'pi pi-file-excel',
                        label: 'Export XLSX',
                        toolTip: 'Export to Excel',
                        tooltipPosition: 'top',
                        hidden: !isEditMode || !data?.id,
                        onClick: (formValue: OTSalaryCalculationModel, tableField: any) =>
                          this.onExportExcel(data?.id, formValue, tableField),
                      },
                    ])
                    .columnSchema([
                      { name: OTEmployeeListEnum.employee_code  + '_TC', field: OTEmployeeListEnum.employee_code,  frozen: true, filter: true },
                      { name: OTEmployeeListEnum.first_name     + '_TC', field: OTEmployeeListEnum.first_name,     frozen: true, filter: true },
                      { name: OTEmployeeListEnum.last_name      + '_TC', field: OTEmployeeListEnum.last_name,      filter: true },
                      { name: OTEmployeeListEnum.designation    + '_TC', field: OTEmployeeListEnum.designation,    filter: true },
                      { name: OTEmployeeListEnum.department     + '_TC', field: OTEmployeeListEnum.department,     filter: true },
                      { name: OTEmployeeListEnum.gross_salary   + '_TC', field: OTEmployeeListEnum.gross_salary   },
                      { name: OTEmployeeListEnum.total_ot_hours + '_TC', field: OTEmployeeListEnum.total_ot_hours },
                      { name: OTEmployeeListEnum.hourly_rate    + '_TC', field: OTEmployeeListEnum.hourly_rate    },
                      { name: OTEmployeeListEnum.ot_amount      + '_TC', field: OTEmployeeListEnum.ot_amount      },
                      { name: OTEmployeeListEnum.allowance      + '_TC', field: OTEmployeeListEnum.allowance,      hidden: !isColVisible(OTEmployeeListEnum.allowance) },
                      { name: OTEmployeeListEnum.deduction      + '_TC', field: OTEmployeeListEnum.deduction      },
                      { name: OTEmployeeListEnum.net_ot_amount  + '_TC', field: OTEmployeeListEnum.net_ot_amount  },
                    ])
                    .formInitialise<OTEmployeeList>(new OTEmployeeList())
                    .formSchema([
                      { name: OTEmployeeListEnum.employee_code,  type: 'input',  readonly: true, frozen: true, left: 0 },
                      { name: OTEmployeeListEnum.first_name,     type: 'input',  readonly: true, frozen: true, left: 0 },
                      { name: OTEmployeeListEnum.last_name,      type: 'input',  readonly: true },
                      { name: OTEmployeeListEnum.designation,    type: 'input',  readonly: true },
                      { name: OTEmployeeListEnum.department,     type: 'input',  readonly: true },
                      { name: OTEmployeeListEnum.gross_salary,   type: 'number', readonly: true, maxFractionDigits: 2, minFractionDigits: 0 },
                      { name: OTEmployeeListEnum.total_ot_hours, type: 'number', readonly: true, maxFractionDigits: 2, minFractionDigits: 0 },
                      { name: OTEmployeeListEnum.hourly_rate,    type: 'number', readonly: true, maxFractionDigits: 4, minFractionDigits: 0 },
                      { name: OTEmployeeListEnum.ot_amount,      type: 'number', readonly: true, maxFractionDigits: 2, minFractionDigits: 0 },
                      { name: OTEmployeeListEnum.allowance,      type: 'number', readonly: true, maxFractionDigits: 2, minFractionDigits: 0, hidden: !isColVisible(OTEmployeeListEnum.allowance) },
                      { name: OTEmployeeListEnum.deduction,           type: 'number', maxFractionDigits: 2, minFractionDigits: 0, onValueChange: this.onChangeFields.bind(this) },
                      { name: OTEmployeeListEnum.net_ot_amount,       type: 'number', readonly: true, maxFractionDigits: 2, minFractionDigits: 0 },
                      { name: OTEmployeeListEnum.allowance_breakdown,  type: 'input',  hidden: true },
                    ])
                    .getDatasource<Array<OTEmployeeList>>('id', ot_employee_list)
                    .actionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-list',
                        toolTip: 'Allowance Breakdown',
                        tooltipPosition: 'top',
                        class: 'p-button-outlined p-button-rounded p-button-secondary p-button-sm',
                        hiddenFunction: (row: OTEmployeeList) => {
                          const allowanceHidden = !(this._lastSelectedColumns ?? [SELECTABLE_COLUMNS[0].id]).includes(OTEmployeeListEnum.allowance);
                          return !row?.allowance_breakdown?.length || allowanceHidden;
                        },
                        onClick: (row: OTEmployeeList, _ds: any, _i: number, fv: OTSalaryCalculationModel, tableField: any) => this.openAllowanceBreakdown(row, fv, tableField),
                      },
                    ])
                    .enableFooter(true)
                    .setAddButton(true)
                    .tableRowsCount(10)
                    .build(),
                ],
              },
            ])
        ];
      };

  // ── Event handlers ────────────────────────────────────────────────────────

  onChangeFields(event: any, item: OTEmployeeList, formValue: OTSalaryCalculationModel, _formFields?: any, _form?: any, _tableField?: any) {
    const allowanceHidden = !(this._lastSelectedColumns ?? [SELECTABLE_COLUMNS[0].id]).includes(OTEmployeeListEnum.allowance);
    const allowance = allowanceHidden ? 0 : Number(item.allowance || 0);
    item.net_ot_amount = Number(
      (Number(item.ot_amount) + allowance - Number(item.deduction || 0)).toFixed(2)
    );
    return item;
  }

  onChangePayrollType(prev: any, next: any, formValue: OTSalaryCalculationModel, formFields: any, form?: any) {
    if (!next) return formValue;
    // Hide filter type and all pickers when switching away from All
    const filterTypeField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.filter_type);
    if (filterTypeField) filterTypeField.hidden = (next !== 'All');
    this._hideAllPickerFields(formFields);
    this._clearFilterFields(formValue, formFields, form);
    formValue.filter_type = '';
    this.clearTable(formValue, formFields, form);
    return formValue;
  }

  onChangeSelectionMode(prev: any, next: string, formValue: OTSalaryCalculationModel, formFields: any) {
    if (!next) return formValue;
    const isMonth = next === 'month';

    const monthField    = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.month);
    const fromDateField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.from_date);
    const toDateField   = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.to_date);

    if (monthField)    monthField.hidden    = !isMonth;
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

  onChangeMonth(prev: any, next: number, formValue: OTSalaryCalculationModel, formFields: any, _form?: any) {
    if (!next) return formValue;
    const year  = new Date().getFullYear();
    const m     = Number(next);
    const pad   = (n: number) => String(n).padStart(2, '0');
    const first = new Date(year, m - 1, 1);
    const last  = new Date(year, m, 0);
    const fromStr = `${pad(first.getDate())}-${pad(first.getMonth() + 1)}-${first.getFullYear()}`;
    const toStr   = `${pad(last.getDate())}-${pad(last.getMonth() + 1)}-${last.getFullYear()}`;

    // Update field objects so the date picker UI reflects the value
    const fromField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.from_date);
    const toField   = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.to_date);
    if (fromField) fromField.value = fromStr;
    if (toField)   toField.value   = toStr;

    // Set on formValue — this object is returned and then passed to form.patchValue()
    // by the dropdown handler, so these values will land in the form controls.
    formValue.from_date = fromStr as any;
    formValue.to_date   = toStr as any;
    this.clearTable(formValue, formFields);
    return formValue;
  }

  onChangeFilterType(prev: any, next: string, formValue: OTSalaryCalculationModel, formFields: any, form?: any) {
    // Hide all pickers first, then show only the matching one
    this._hideAllPickerFields(formFields);
    this._clearFilterFields(formValue, formFields, form);

    const PICKER_MAP: Record<string, OTSalaryCalculationEnum> = {
      Individual:  OTSalaryCalculationEnum.filter_employee,
      Designation: OTSalaryCalculationEnum.filter_designation,
      Department:  OTSalaryCalculationEnum.filter_department,
    };

    if (next && PICKER_MAP[next]) {
      const targetField = this._getTabField(formFields, (f: any) => f?.name === PICKER_MAP[next]);
      if (targetField) targetField.hidden = false;
    }

    this.clearTable(formValue, formFields, form);
    return formValue;
  }

  onChangeFromDate(prev: any, next: any, formValue: OTSalaryCalculationModel, formFields: any, form?: any) {
    // Only react when in date-range mode — in month mode, from_date is set
    // programmatically by onChangeMonth and to_date must not be wiped.
    if (next && formValue.selection_mode === 'date_range') {
      const parts = next.toString().split('-');
      if (parts?.length === 3) {
        const toDateField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.to_date);
        if (toDateField) toDateField.minDateValue = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
      formValue.to_date = null;
      this.clearTable(formValue, formFields, form);
    }
    return formValue;
  }

  onChangeToDate(_prev: any, next: any, formValue: OTSalaryCalculationModel, formFields: any, _form?: any) {
    if (next && formValue.from_date) {
      this.clearTable(formValue, formFields);
    }
    return formValue;
  }

  onSelectToDate(toDate: string, formValue: OTSalaryCalculationModel, _formFields: any) {
    if (toDate) {
      formValue.to_date = toDate as any;
    }
    return formValue;
  }

  // ── Picker: Individual ────────────────────────────────────────────────────

  async onClickPickerEmployee(formValue: OTSalaryCalculationModel, _field: any, formFields: any) {
    const pickerField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.filter_employee);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_employee_ids) {
      pickerField._selectedIds = formValue.filter_employee_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    this._spinner.show();
    let allEmployees: any[] = [];
    try {
      const r: any = await lastValueFrom(this.apiService.get('/master/allowance-assignment/filter_employees/', { filter_criteria: 'employee_wise' }));
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
          paginator: true, scrollable: true, lazy: false,
          list,
          selectedArray: list.filter((e: any) => existing.includes(e.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_employee     = selected.map((s: any) => `${s.employee_code} - ${s.employee_name}`).join(', ');
    formValue.filter_employee_ids = selected.map((s: any) => s.id).join(',');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);

    await this.fetchOTEmployees(formValue, formFields);
    return formValue;
  }

  // ── Picker: Designation ───────────────────────────────────────────────────

  async onClickPickerDesignation(formValue: OTSalaryCalculationModel, _field: any, formFields: any) {
    const pickerField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.filter_designation);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_designation_ids) {
      pickerField._selectedIds = formValue.filter_designation_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    this._spinner.show();
    let raw: any;
    try {
      raw = await lastValueFrom(
        this.apiService.get(`${ServiceUrlConstants.DESIGNATION_CRUD}`, { is_active: true, required_fields: 'id,designation_code,designation_name' })
      );
    } catch (e) { console.error('Designation fetch error', e); } finally { this._spinner.hide(); }
    const allDesignations: any[] = raw?.results || (Array.isArray(raw) ? raw : []);

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
          rows: 15, scrollHeight: '55vh',
          formInitialise: ['name'],
          paginator: true, scrollable: true, lazy: false,
          list,
          selectedArray: list.filter((d: any) => existing.includes(d.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_designation     = selected.map((s: any) => s.name).join(', ');
    formValue.filter_designation_ids = selected.map((s: any) => s.id).join(',');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);

    await this.fetchOTEmployees(formValue, formFields);
    return formValue;
  }

  // ── Picker: Department ────────────────────────────────────────────────────

  async onClickPickerDepartment(formValue: OTSalaryCalculationModel, _field: any, formFields: any) {
    const pickerField = this._getTabField(formFields, (f: any) => f?.name === OTSalaryCalculationEnum.filter_department);
    if (pickerField && !pickerField._selectedIds?.length && formValue.filter_department_ids) {
      pickerField._selectedIds = formValue.filter_department_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    const existing: string[] = pickerField?._selectedIds || [];

    this._spinner.show();
    let rawDept: any;
    try {
      rawDept = await lastValueFrom(
        this.apiService.get(`${ServiceUrlConstants.DEPARTMENT_CRUD}`, { is_active: true, required_fields: 'id,department_code,department_name' })
      );
    } catch (e) { console.error('Department fetch error', e); } finally { this._spinner.hide(); }
    const allDepartments: any[] = rawDept?.results || (Array.isArray(rawDept) ? rawDept : []);

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
          rows: 15, scrollHeight: '55vh',
          formInitialise: ['name'],
          paginator: true, scrollable: true, lazy: false,
          list,
          selectedArray: list.filter((d: any) => existing.includes(d.id)),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.filter_department     = selected.map((s: any) => s.name).join(', ');
    formValue.filter_department_ids = selected.map((s: any) => s.id).join(',');
    if (pickerField) pickerField._selectedIds = selected.map((s: any) => s.id);

    await this.fetchOTEmployees(formValue, formFields);
    return formValue;
  }

  // ── Column selector ───────────────────────────────────────────────────────

  async onSelectColumns(_formValue: OTSalaryCalculationModel, tableField: any, _formFields?: any) {
    const currentVisible = new Set(
      (tableField?.columnSchema || []).filter((c: any) => !c.hidden).map((c: any) => c.field)
    );
    const list = SELECTABLE_COLUMNS.map(col => ({ ...col, _preselected: currentVisible.has(col.id) }));

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Columns', dialogConfig: { height: '50%', width: '30%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [{ name: 'Column', field: 'name', filter: false }],
          rows: SELECTABLE_COLUMNS.length + 1, scrollHeight: '30vh',
          formInitialise: ['name'],
          paginator: true, scrollable: true, lazy: false,
          list, selectedArray: list.filter(c => c._preselected),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return;

    const selected: any[]  = response?.tempArray || [];
    const selectedIds = new Set(selected.map((s: any) => s.id));

    for (const col of (tableField?.columnSchema || [])) {
      if (SELECTABLE_COLUMNS.some(c => c.id === col.field)) col.hidden = !selectedIds.has(col.field);
    }
    for (const cell of (tableField?.formSchema || [])) {
      if (SELECTABLE_COLUMNS.some(c => c.id === cell.name)) cell.hidden = !selectedIds.has(cell.name);
    }

    // Save VISIBLE column IDs (same pattern as payroll register).
    const cols = Array.from(selectedIds);
    this._lastSelectedColumns = cols;

    // Recompute net_ot_amount for every row based on new allowance visibility
    const allowanceHidden = !selectedIds.has(OTEmployeeListEnum.allowance);
    for (const row of (tableField?.dataSource || [])) {
      const allowance = allowanceHidden ? 0 : Number(row.allowance || 0);
      row.net_ot_amount = Number(
        (Number(row.ot_amount) + allowance - Number(row.deduction || 0)).toFixed(2)
      );
    }
    // Trigger table refresh
    if (tableField) tableField.dataSource = [...(tableField.dataSource || [])];
  }

  // ── Allowance Breakdown popup ─────────────────────────────────────────────

  async openAllowanceBreakdown(row: OTEmployeeList, _formValue?: OTSalaryCalculationModel, tableField?: any): Promise<any> {
    const allowanceHidden = !(this._lastSelectedColumns ?? [SELECTABLE_COLUMNS[0].id]).includes(OTEmployeeListEnum.allowance);
    await this._customDialogService.openDialog(
      {
        pageTitle: `Allowance Breakdown — ${row.employee_code || ''} ${row.first_name || ''}`.trim(),
        dialogConfig: { width: '500px', height: 'auto' },
      },
      OtAllowanceBreakdownDialogComponent,
      { row, allowanceHidden },
    );
    return null;
  }

  // ── Data fetch ────────────────────────────────────────────────────────────

  async fetchOTEmployees(formValue: OTSalaryCalculationModel, formFields: any, _form?: any): Promise<void> {
    if (!formValue.from_date || !formValue.to_date) return;
    this._spinner.show();
    try {
      const payrollType = formValue.payroll_type || 'Operations';
      const params: Record<string, any> = {
        from_date:    formValue.from_date,
        to_date:      formValue.to_date,
        payroll_type: payrollType,
      };

      if (payrollType === 'All') {
        const filterType = formValue.filter_type || '';
        if (filterType === 'Individual'  && formValue.filter_employee_ids) {
          params['filter_type']  = 'Individual';
          params['filter_value'] = formValue.filter_employee_ids;
        } else if (filterType === 'Designation' && formValue.filter_designation_ids) {
          params['filter_type']  = 'Designation';
          params['filter_value'] = formValue.filter_designation_ids;
        } else if (filterType === 'Department' && formValue.filter_department_ids) {
          params['filter_type']  = 'Department';
          params['filter_value'] = formValue.filter_department_ids;
        }
      }

      const response: any = await lastValueFrom(
        this.apiService.get('/hrm/otSalaryCalculation/get_ot_employees/', params)
      );
      const employeeList: OTEmployeeList[] = Array.isArray(response) ? response : [];

      // Recompute net_ot_amount based on current column visibility
      const allowanceHidden = !(this._lastSelectedColumns ?? SELECTABLE_COLUMNS.map(c => c.id))
        .includes(OTEmployeeListEnum.allowance);
      for (const row of employeeList) {
        const allowance = allowanceHidden ? 0 : Number(row.allowance || 0);
        row.net_ot_amount = Number((Number(row.ot_amount) + allowance - Number(row.deduction || 0)).toFixed(2));
      }

      formValue.ot_employee_list = employeeList;
      const tableField = this._getTabField(formFields, (f: any) => f?.type === 'table');
      if (tableField) { tableField.dataSource = [...employeeList]; tableField.value = [...employeeList]; }
      return { form: { ot_employee_list: employeeList } } as any;
    } finally {
      this._spinner.hide();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  clearTable(formValue: OTSalaryCalculationModel, formFields: any, form?: any) {
    formValue.ot_employee_list = [];
    const tableField = this._getTabField(formFields, (f: any) => f?.type === 'table');
    if (tableField) { tableField.dataSource = []; tableField.value = []; }
    if (form?.get('ot_employee_list')) form.get('ot_employee_list').setValue([]);
  }

  private _hideAllPickerFields(formFields: any) {
    const pickerNames = [
      OTSalaryCalculationEnum.filter_employee,
      OTSalaryCalculationEnum.filter_designation,
      OTSalaryCalculationEnum.filter_department,
    ];
    for (const name of pickerNames) {
      const f = this._getTabField(formFields, (field: any) => field?.name === name);
      if (f) { f.hidden = true; f._selectedIds = []; }
    }
  }

  private _clearFilterFields(formValue: OTSalaryCalculationModel, formFields: any, form?: any) {
    formValue.filter_employee        = '';
    formValue.filter_employee_ids    = '';
    formValue.filter_designation     = '';
    formValue.filter_designation_ids = '';
    formValue.filter_department      = '';
    formValue.filter_department_ids  = '';
    if (form) {
      [OTSalaryCalculationEnum.filter_employee_ids, OTSalaryCalculationEnum.filter_designation_ids,
       OTSalaryCalculationEnum.filter_department_ids].forEach(k => {
        if (form.get(k)) form.get(k).setValue('');
      });
    }
  }

  private _getTabField(formFields: any, predicate: (f: any) => boolean): any {
    return formFields
      ?.find((f: any) => f?.fieldUniqueKey === 'ot-salary-tab')
      ?.fields?.find(predicate);
  }

  async onExportExcel(id: any, _formValue: OTSalaryCalculationModel, tableField: any): Promise<void> {
    if (!id) return;

    // Build fields list from visible columns in the table schema
    const visibleFields: string[] = (tableField?.columnSchema || [])
      .filter((col: any) => !col.hidden && col.field)
      .map((col: any) => col.field as string);

    const fields = visibleFields.length ? visibleFields.join(',') : '';
    await this._downloadExport(id, fields, `OT_Payroll_${id}.xlsx`);
  }

  private async _downloadExport(id: any, fields: string, filename: string): Promise<void> {
    const b_id = localStorage.getItem('b_id') || '';
    const token = localStorage.getItem('accessToken') || '';
    const base = ServiceUrlConstants.BASE_URL.replace(/\/$/, '');
    const hostname = window.location.hostname;
    const match = hostname.match(/(.*?)\./);
    const client = match ? match[1] : '';
    const clientPrefix = client ? `${client}/` : '';
    const url = `${base}/${clientPrefix}hrm/otSalaryCalculation/${id}/export_ot_excel/?b_id=${b_id}&fields=${encodeURIComponent(fields)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    } catch (_e) {
      // silently ignore network errors
    }
  }
}
