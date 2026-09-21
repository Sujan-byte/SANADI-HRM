import { Injectable, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiService } from 'src/app/core/services/api.service';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import {
    AllowanceAssignmentEnum,
    AllowanceAssignmentModeEnum,
    AllowanceAssignmentCriteriaEnum,
    AllowanceAssignmentEmployeeEnum,
} from 'src/app/core/shared/common/enum/masters_enum/allowance-assignment-enum';
import {
    AllowanceAssignmentModel,
    AllowanceAssignmentEmployeeModel,
} from 'src/app/core/shared/common/model/masters/allowance-assignment.model';

// Only HR-payroll-applicable types; operational types (per trip, per km, etc.) are not relevant here
const ALLOWANCE_TYPE_OPTIONS = [
    { label: 'Fixed Per Day',  value: 'fixed_per_day'  },
    { label: 'Hourly',         value: 'hourly'         },
    { label: 'Monthly Fixed',  value: 'monthly_fixed'  },
];

// Values that can be auto-populated from allowance master; any other type requires manual selection
const ASSIGNMENT_ALLOWED_TYPES = new Set(['fixed_per_day', 'hourly', 'monthly_fixed']);

const MODE_OPTIONS = [
    { label: 'Manual', value: AllowanceAssignmentModeEnum.manual },
    { label: 'Auto',   value: AllowanceAssignmentModeEnum.auto },
];

const CRITERIA_OPTIONS = [
    { label: 'Individual',  value: AllowanceAssignmentCriteriaEnum.employee_wise },
    { label: 'Designation', value: AllowanceAssignmentCriteriaEnum.designation },
    { label: 'Department',  value: AllowanceAssignmentCriteriaEnum.department },
];

const FILTER_EMP_URL = ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD + 'filter_employees/';

@Injectable({ providedIn: 'root' })
export class AllowanceAssignmentFormConfig {
    private translate            = inject(TranslateService);
    private apiService           = inject(ApiService);
    private _customDialogService = inject(CustomDialogService);
    private _spinner             = inject(NgxSpinnerService);

    // Populated by the lazy dropdown's bindOption callback on first click — used by onChangeAllowance
    allowanceOptions = signal<any[]>([]);

    // Runtime store — persists selected IDs across Generate re-clicks in the same session
    private _selectedEmpIds:   string[] = [];
    private _selectedDesigIds: string[] = [];
    private _selectedDeptIds:  string[] = [];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Find a field by name in the formFields tree.
     * Traverses: tab.fields → accordion (type='accordion') → accordion-section.fields
     */
    private findField(formFields: any[], name: string): any {
        if (!formFields) return null;
        for (const tab of formFields) {
            const result = this._searchFields(tab?.fields || [], name);
            if (result) return result;
        }
        return null;
    }

    private _searchFields(fields: any[], name: string): any {
        if (!fields) return null;
        for (const field of fields) {
            if (field?.name === name) return field;
            // Accordion container
            if (field?.type === 'accordion' && Array.isArray(field?.fields)) {
                for (const section of field.fields) {
                    const inner = this._searchFields(section?.fields || [], name);
                    if (inner) return inner;
                }
            }
            // Legacy accordionFields pattern
            if (Array.isArray(field?.accordionFields)) {
                for (const section of field.accordionFields) {
                    const inner = this._searchFields(section?.fields || [], name);
                    if (inner) return inner;
                }
            }
        }
        return null;
    }

    private async fetchFilteredEmployees(params: {
        filter_criteria:  string;
        employee_ids?:    string;
        designation_ids?: string;
        department_ids?:  string;
        default_amount?:  number;
        default_rate?:    number;
    }): Promise<any[]> {
        const res: any = await firstValueFrom(
            this.apiService.get(FILTER_EMP_URL, { ...params })
        );
        return res || [];
    }

    private updateEmployeeTable(formFields: any[], employees: any[]) {
        const tableField = this.findField(formFields, AllowanceAssignmentEnum.employees);
        if (tableField) tableField.dataSource = [...employees];
    }

    // ─── onChangeAllowance ────────────────────────────────────────────────────
    // Returns only FLAT fields — never include array fields (patchValue drops silently)

    onChangeAllowance(prev: any, next: any, formValue: any, formFields: any) {
        const selected = this.allowanceOptions().find((a: any) => String(a.id) === String(next));
        if (!selected) return null;
        // Only auto-fill allowance_type if it is one of the 3 HR-applicable types;
        // operational types (per trip, per km, etc.) are not valid here — clear so user picks manually
        const typeValue = ASSIGNMENT_ALLOWED_TYPES.has(selected.allowance_type)
            ? selected.allowance_type
            : '';
        // Directly update field.value on the allowance_type dropdown field so
        // the PrimeNG selectedItem template (which reads field.value, not the reactive form control)
        // reflects the programmatically patched value immediately
        const typeField = this.findField(formFields, AllowanceAssignmentEnum.allowance_type);
        if (typeField) typeField.value = typeValue;
        return {
            allowance_code: selected.allowance_code,
            allowance_name: selected.allowance_name,
            allowance_type: typeValue,
            amount:         selected.unit_rate || 0,
            rate:           selected.unit_rate || 0,
        };
    }

    // ─── onChangeAmount — propagate new amount to every employee row ──────────

    onChangeAmount(prev: any, next: any, formValue: any, formFields: any) {
        const tableField = this.findField(formFields, AllowanceAssignmentEnum.employees);
        if (!tableField?.dataSource?.length) return null;
        const newAmt  = Number(next) || 0;
        const updated = tableField.dataSource.map((row: any) => ({ ...row, amount: newAmt }));
        // Replace array reference so table-field change detection fires
        tableField.dataSource = updated;
        // Sync Angular form control so the new values reach the payload
        return { form: { employees: updated } };
    }

    // ─── onChangeRate — propagate new rate to every employee row ─────────────

    onChangeRate(prev: any, next: any, formValue: any, formFields: any) {
        const tableField = this.findField(formFields, AllowanceAssignmentEnum.employees);
        if (!tableField?.dataSource?.length) return null;
        const newRate = Number(next) || 0;
        const updated = tableField.dataSource.map((row: any) => ({ ...row, rate: newRate }));
        tableField.dataSource = updated;
        return { form: { employees: updated } };
    }

    // ─── onApplyAmount — tableButton: push amount/rate to all rows on demand ────
    // tableButton onClick signature: (event, dataSource, dialogHandlerService, selectedMainArray, { field, formValue, form })
    // return value is passed directly to form.patchValue() — no { form: ... } wrapper

    async onApplyAmount(_event: any, dataSource: any[], _dlg: any, _sel: any, ctx: any): Promise<any> {
        const formValue          = ctx?.formValue || {};
        const field              = ctx?.field;
        const filteredRows: any[] | null = ctx?.filteredValue ?? null;
        const confirmationService        = ctx?.confirmationService;
        if (!dataSource?.length) return null;

        const mode    = formValue?.mode || AllowanceAssignmentModeEnum.manual;
        const newAmt  = Number(formValue?.amount) || 0;
        const newRate = Number(formValue?.rate)   || 0;
        const targetCount = filteredRows ? filteredRows.length : dataSource.length;
        const valueLabel  = mode === AllowanceAssignmentModeEnum.auto
            ? `Rate: ${newRate}`
            : `Amount: ${newAmt}`;

        // Show PrimeNG confirm dialog and wait for user decision
        const confirmed = await new Promise<boolean>((resolve) => {
            if (confirmationService?.confirm) {
                confirmationService.confirm({
                    message: `Apply ${valueLabel} to ${targetCount} employee record${targetCount !== 1 ? 's' : ''}?`,
                    header:  'Apply Amount',
                    icon:    'pi pi-exclamation-triangle',
                    acceptLabel: 'Yes, Apply',
                    rejectLabel: 'Cancel',
                    accept:  () => resolve(true),
                    reject:  () => resolve(false),
                });
            } else {
                resolve(true); // fallback: apply without confirm if service unavailable
            }
        });

        if (!confirmed) return null;

        // Build a Set of filtered employee IDs for fast lookup
        // filteredValue is null when no column filter is active (show all)
        const filteredIds: Set<any> | null = filteredRows
            ? new Set(filteredRows.map((r: any) => r.employee ?? r.employee_code))
            : null;

        const updated = dataSource.map((row: any) => {
            const rowId = row.employee ?? row.employee_code;
            if (filteredIds && !filteredIds.has(rowId)) return row; // not in filter — keep as-is
            return mode === AllowanceAssignmentModeEnum.auto
                ? { ...row, rate: newRate }
                : { ...row, amount: newAmt };
        });

        if (field) field.dataSource = updated;
        return { employees: updated };
    }

    // ─── onChangeMode ─────────────────────────────────────────────────────────

    onChangeMode(prev: any, next: string, formValue: any, formFields: any, form?: any) {
        const isManual    = next === AllowanceAssignmentModeEnum.manual;
        const amountField = this.findField(formFields, AllowanceAssignmentEnum.amount);
        const rateField   = this.findField(formFields, AllowanceAssignmentEnum.rate);
        if (amountField) amountField.hidden = !isManual;
        if (rateField)   rateField.hidden   =  isManual;
        // Toggle to_date required on the reactive form control directly
        // (mutating field.validation alone has no effect after form build)
        if (form) {
            const toDateCtrl = form.get(AllowanceAssignmentEnum.to_date);
            if (toDateCtrl) {
                if (isManual) {
                    toDateCtrl.setValidators([Validators.required]);
                } else {
                    toDateCtrl.clearValidators();
                }
                toDateCtrl.updateValueAndValidity();
            }
        }
        // When switching to auto, clear to_date so it doesn't force a value
        return isManual ? null : { to_date: '' };
    }

    // ─── onChangeFilterCriteria ───────────────────────────────────────────────

    onChangeFilterCriteria(prev: any, next: string, formValue: any, formFields: any) {
        // Clear selection store on criteria change
        this._selectedEmpIds   = [];
        this._selectedDesigIds = [];
        this._selectedDeptIds  = [];

        // Clear employee table
        const tableField = this.findField(formFields, AllowanceAssignmentEnum.employees);
        if (tableField) tableField.dataSource = [];

        // Patch flat fields to clear stored IDs
        return {
            filter_designation_ids: '',
            filter_department_ids:  '',
        };
    }

    // ─── Generate button — opens the right picker by criteria ─────────────────

    private async onClickGenerate(formValue: any, tableField: any, formFields: any): Promise<any> {
        const criteria = formValue.filter_criteria;
        if (!criteria) return null;

        let employees: any[] | null = null;

        if (criteria === AllowanceAssignmentCriteriaEnum.employee_wise) {
            employees = await this._pickEmployees(formValue, formFields);

        } else if (criteria === AllowanceAssignmentCriteriaEnum.designation) {
            employees = await this._pickDesignation(formValue, formFields);

        } else if (criteria === AllowanceAssignmentCriteriaEnum.department) {
            employees = await this._pickDepartment(formValue, formFields);
        }

        // Sync the Angular form control so the payload contains the employee rows
        if (employees !== null) {
            return { form: { employees } };
        }
        return null;
    }

    // ── Individual picker ──────────────────────────────────────────────────────

    private async _pickEmployees(formValue: any, formFields: any): Promise<any[] | null> {
        // Use filter_employees endpoint — it uses .only() so only 5 fields are fetched, much faster
        this._spinner.show();
        let list: any[] = [];
        try {
            list = await this.fetchFilteredEmployees({
                filter_criteria: AllowanceAssignmentCriteriaEnum.employee_wise,
                // no employee_ids → returns ALL active employees with minimal fields
            });
            // Remap table_id → id for the picker dialog's selection tracking
            list = list.map((e: any) => ({
                id:               e.employee,
                employee_code:    e.employee_code,
                employee_name:    e.employee_name,
                designation_name: e.designation_name,
                department_name:  e.department_name,
            }));
        } finally { this._spinner.hide(); }

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
                    rows: 15, scrollHeight: '55vh',
                    formInitialise: ['employee_code', 'employee_name', 'designation_name', 'department_name'],
                    paginator: true, scrollable: true, lazy: false,
                    list,
                    selectedArray: list.filter((e: any) => this._selectedEmpIds.includes(e.id)),
                    tableName: 'table',
                },
                tableDataSource: [],
            }
        );
        if (!response) return null;

        const selected: any[] = response?.tempArray || [];
        this._selectedEmpIds = selected.map((s: any) => s.id);

        if (selected.length) {
            this._spinner.show();
            try {
                const employees = await this.fetchFilteredEmployees({
                    filter_criteria: AllowanceAssignmentCriteriaEnum.employee_wise,
                    employee_ids:    this._selectedEmpIds.join(','),
                    default_amount:  Number(formValue.amount) || 0,
                    default_rate:    Number(formValue.rate)   || 0,
                });
                this.updateEmployeeTable(formFields, employees);
                return employees;
            } finally { this._spinner.hide(); }
        }
        return null;
    }

    // ── Designation picker ─────────────────────────────────────────────────────

    private async _pickDesignation(formValue: any, formFields: any): Promise<any[] | null> {
        this._spinner.show();
        let all: any[] = [];
        try {
            all = await firstValueFrom(
                this.apiService.get(ServiceUrlConstants.DESIGNATION_CRUD, { is_active: true })
            ).then((r: any) => r?.results || r || []);
        } finally { this._spinner.hide(); }

        const list = all.map((d: any) => ({
            id:   String(d.id),
            name: `${d.designation_code || ''} - ${d.designation_name}`.trim(),
        }));

        const response: any = await this._customDialogService.openDialog(
            { pageTitle: 'Select Designation', dialogConfig: { height: '80%', width: '40%' } },
            DynamicTableComponent,
            {
                field: {
                    columnSchema: [{ name: 'Designation', field: 'name', filter: true }],
                    rows: 15, scrollHeight: '55vh', formInitialise: ['name'],
                    paginator: true, scrollable: true, lazy: false,
                    list,
                    selectedArray: list.filter((d: any) => this._selectedDesigIds.includes(d.id)),
                    tableName: 'table',
                },
                tableDataSource: [],
            }
        );
        if (!response) return null;

        const selected: any[] = response?.tempArray || [];
        this._selectedDesigIds = selected.map((s: any) => s.id);
        const ids = this._selectedDesigIds.join(',');

        const idField = this.findField(formFields, AllowanceAssignmentEnum.filter_designation_ids);
        if (idField) idField.value = ids;

        if (selected.length) {
            this._spinner.show();
            try {
                const employees = await this.fetchFilteredEmployees({
                    filter_criteria: AllowanceAssignmentCriteriaEnum.designation,
                    designation_ids: ids,
                    default_amount:  Number(formValue.amount) || 0,
                    default_rate:    Number(formValue.rate)   || 0,
                });
                this.updateEmployeeTable(formFields, employees);
                return employees;
            } finally { this._spinner.hide(); }
        }
        return null;
    }

    // ── Department picker ──────────────────────────────────────────────────────

    private async _pickDepartment(formValue: any, formFields: any): Promise<any[] | null> {
        this._spinner.show();
        let all: any[] = [];
        try {
            all = await firstValueFrom(
                this.apiService.get(ServiceUrlConstants.DEPARTMENT_CRUD, { is_active: true })
            ).then((r: any) => r?.results || r || []);
        } finally { this._spinner.hide(); }

        const list = all.map((d: any) => ({
            id:   String(d.id),
            name: `${d.department_code || ''} - ${d.department_name}`.trim(),
        }));

        const response: any = await this._customDialogService.openDialog(
            { pageTitle: 'Select Department', dialogConfig: { height: '80%', width: '40%' } },
            DynamicTableComponent,
            {
                field: {
                    columnSchema: [{ name: 'Department', field: 'name', filter: true }],
                    rows: 15, scrollHeight: '55vh', formInitialise: ['name'],
                    paginator: true, scrollable: true, lazy: false,
                    list,
                    selectedArray: list.filter((d: any) => this._selectedDeptIds.includes(d.id)),
                    tableName: 'table',
                },
                tableDataSource: [],
            }
        );
        if (!response) return null;

        const selected: any[] = response?.tempArray || [];
        this._selectedDeptIds = selected.map((s: any) => s.id);
        const ids = this._selectedDeptIds.join(',');

        const idField = this.findField(formFields, AllowanceAssignmentEnum.filter_department_ids);
        if (idField) idField.value = ids;

        if (selected.length) {
            this._spinner.show();
            try {
                const employees = await this.fetchFilteredEmployees({
                    filter_criteria: AllowanceAssignmentCriteriaEnum.department,
                    department_ids:  ids,
                    default_amount:  Number(formValue.amount) || 0,
                    default_rate:    Number(formValue.rate)   || 0,
                });
                this.updateEmployeeTable(formFields, employees);
                return employees;
            } finally { this._spinner.hide(); }
        }
        return null;
    }

    // ─── Seed runtime store from edit-mode data ───────────────────────────────

    seedEditState(data: any, employees: any[]) {
        this._selectedEmpIds   = employees.map((e: any) => String(e.employee)).filter(Boolean);
        this._selectedDesigIds = data?.filter_designation_ids
            ? String(data.filter_designation_ids).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        this._selectedDeptIds  = data?.filter_department_ids
            ? String(data.filter_department_ids).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
    }

    resetSelectionStore() {
        this._selectedEmpIds   = [];
        this._selectedDesigIds = [];
        this._selectedDeptIds  = [];
    }

    // ─── Form Builder ─────────────────────────────────────────────────────────
    //
    // Layout (single tab):
    //   Accordion "Allowance Details"
    //     allowance | mode | amount/rate | from_date | to_date
    //   Filter Criteria dropdown
    //   Employee table — Generate button in caption opens picker by criteria

    public readonly AllowanceAssignmentForm =
        () =>
        (dataFromComponent?: any, initialData?: AllowanceAssignmentModel, isEditMode?: boolean, data?: AllowanceAssignmentModel) => {
            if (!initialData) initialData = new AllowanceAssignmentModel();

            // For new records: clear picker so previous record's selections don't bleed in.
            // For edit records: seedEditState() is called BEFORE the form factory (in updateConfig),
            // so we must NOT reset here — the seeded values are already correct.
            if (!isEditMode) this.resetSelectionStore();

            const currentMode = isEditMode ? (data?.mode || 'manual') : 'manual';
            const isManual    = currentMode === AllowanceAssignmentModeEnum.manual;

            const existingEmployees: AllowanceAssignmentEmployeeModel[] = isEditMode
                ? (data as any)?.employees || []
                : [];

            // ── Accordion: Allowance Details ───────────────────────────────────
            const allowanceDetailsAccordion: any = {
                type:           'accordion',
                fieldUniqueKey: 'aa-main-accordion',
                multiple:       true,
                fields: [
                    {
                        accordionHeader: this.translate.instant('allowanceDetails_TC') || 'Allowance Details',
                        selected:        true,
                        fieldUniqueKey:  'aa-details-acc',
                        fields: [

                            new DropdownField(
                                this.translate, AllowanceAssignmentEnum.allowance,
                                isEditMode, data, initialData, true,
                            )
                                .addFieldWidth('65%')
                                .addKeyValueLabel('label', 'id')
                                .getOptions(signal([]))
                                .isLazyFilterDropDown(true)
                                .getUrlConfig({
                                    get: {
                                        url: '/master/allowance-master/',
                                        params: { page_size: 100, is_active: true },
                                        filterKeys: ['search'],
                                    },
                                })
                                .bindOption((res: any) => {
                                    const list: any[] = res?.results || res || [];
                                    const mapped = list.map((a: any) => ({
                                        id:             a.id,
                                        label:          `${a.allowance_code} - ${a.allowance_name}`,
                                        allowance_code: a.allowance_code || '',
                                        allowance_name: a.allowance_name || '',
                                        allowance_type: a.allowance_type || '',
                                        unit_rate:      Number(a.unit_rate) || 0,
                                    }));
                                    // Sync signal so onChangeAllowance can look up the selected item
                                    this.allowanceOptions.set(mapped);
                                    return mapped;
                                })
                                .setDefaultObject(isEditMode ? (data?.allowance_default_object || {}) : {})
                                .validate(true)
                                .onChangeOnly(this.onChangeAllowance.bind(this))
                                .toObject(),

                            new DropdownField(
                                this.translate, AllowanceAssignmentEnum.mode,
                                isEditMode, data, initialData, false,
                            )
                                .addFieldWidth('32%')
                                .addKeyValueLabel('label', 'value')
                                .getOptions(signal(MODE_OPTIONS))
                                .validate(true)
                                .onChangeOnly(this.onChangeMode.bind(this))
                                .toObject(),

                            // Hidden — copied from allowance master on selection
                            new InputField(this.translate, AllowanceAssignmentEnum.allowance_code, isEditMode, data, initialData)
                                .isFieldHidden(true).toObject(),
                            new InputField(this.translate, AllowanceAssignmentEnum.allowance_name, isEditMode, data, initialData)
                                .isFieldHidden(true).toObject(),

                            // Allowance Type — pre-filled from master on allowance selection, but user can override
                            new DropdownField(
                                this.translate, AllowanceAssignmentEnum.allowance_type,
                                isEditMode, data, initialData, false,
                            )
                                .addFieldWidth('32%')
                                .addKeyValueLabel('label', 'value')
                                .getOptions(signal(ALLOWANCE_TYPE_OPTIONS))
                                .validate(true)
                                .toObject(),

                            // Amount (Manual mode only) — changes propagate to all employee rows
                            new NumberField(this.translate, AllowanceAssignmentEnum.amount, isEditMode, data, initialData)
                                .addFieldWidth('32%')
                                .setMinFractionDigits(2).setMaxFractionDigits(2)
                                .isFieldHidden(!isManual)
                                .onChangeOnly(this.onChangeAmount.bind(this))
                                .toObject(),

                            // Rate (Auto mode only) — changes propagate to all employee rows
                            new NumberField(this.translate, AllowanceAssignmentEnum.rate, isEditMode, data, initialData)
                                .addFieldWidth('32%')
                                .setMinFractionDigits(2).setMaxFractionDigits(2)
                                .isFieldHidden(isManual)
                                .onChangeOnly(this.onChangeRate.bind(this))
                                .toObject(),

                            new DateField(this.translate, AllowanceAssignmentEnum.from_date, isEditMode, data, initialData)
                                .addFieldWidth('32%').validate(true).toObject(),
                            // to_date is mandatory for manual mode (fixed period), optional for auto (open-ended)
                            new DateField(this.translate, AllowanceAssignmentEnum.to_date, isEditMode, data, initialData)
                                .addFieldWidth('32%').validate(isManual).toObject(),
                        ],
                    },
                ],
            };

            return [
                new TabBuilder(this.translate)
                    .addTabFields([
                        {
                            tabHeader:      this.translate.instant('allocationInfo_TC'),
                            fieldUniqueKey: 'assignment-tab',
                            fields: [

                                // ── Accordion ──────────────────────────────────
                                allowanceDetailsAccordion,

                                // ── Filter Criteria ────────────────────────────
                                // Default to 'employee_wise' (Individual) on new records
                                new DropdownField(
                                    this.translate, AllowanceAssignmentEnum.filter_criteria,
                                    isEditMode,
                                    isEditMode ? data : { filter_criteria: AllowanceAssignmentCriteriaEnum.employee_wise },
                                    { ...(initialData || {}), filter_criteria: AllowanceAssignmentCriteriaEnum.employee_wise },
                                    false,
                                )
                                    .addFieldWidth('32%')
                                    .addKeyValueLabel('label', 'value')
                                    .getOptions(signal(CRITERIA_OPTIONS))
                                    .onChangeOnly(this.onChangeFilterCriteria.bind(this))
                                    .toObject(),

                                // Hidden: id = batch_id — survives form.value merge so footer uses PUT in edit mode
                                new InputField(this.translate, 'id', isEditMode, data, initialData)
                                    .isFieldHidden(true).toObject(),
                                new InputField(this.translate, AllowanceAssignmentEnum.batch_id, isEditMode, data, initialData)
                                    .isFieldHidden(true).toObject(),

                                // Hidden: stores ID strings for payload & re-generate
                                new InputField(this.translate, AllowanceAssignmentEnum.filter_designation_ids, isEditMode, data, initialData)
                                    .isFieldHidden(true).toObject(),
                                new InputField(this.translate, AllowanceAssignmentEnum.filter_department_ids, isEditMode, data, initialData)
                                    .isFieldHidden(true).toObject(),

                                // ── Employee table — Generate + Export in caption ──
                                new TableBuilder(this.translate, AllowanceAssignmentEnum.employees, '', true)
                                    .columnSchema([
                                        { name: this.translate.instant('employeeCode_TC'), field: AllowanceAssignmentEmployeeEnum.employee_code,    colWidth: '120px', filter: true },
                                        { name: this.translate.instant('employeeName_TC'), field: AllowanceAssignmentEmployeeEnum.employee_name,    colWidth: '180px', filter: true },
                                        { name: this.translate.instant('designation_TC'),  field: AllowanceAssignmentEmployeeEnum.designation_name, colWidth: '150px', filter: true },
                                        { name: this.translate.instant('department_TC'),   field: AllowanceAssignmentEmployeeEnum.department_name,  colWidth: '150px', filter: true },
                                        { name: this.translate.instant('amount_TC'),       field: AllowanceAssignmentEmployeeEnum.amount,           colWidth: '110px' },
                                        { name: this.translate.instant('remark_TC'),       field: AllowanceAssignmentEmployeeEnum.remark,           colWidth: '200px' },
                                    ])
                                    .formInitialise<AllowanceAssignmentEmployeeModel>(new AllowanceAssignmentEmployeeModel())
                                    .formSchema([
                                        { name: AllowanceAssignmentEmployeeEnum.employee_code,    type: 'input',    readonly: true  },
                                        { name: AllowanceAssignmentEmployeeEnum.employee_name,    type: 'input',    readonly: true  },
                                        { name: AllowanceAssignmentEmployeeEnum.designation_name, type: 'input',    readonly: true  },
                                        { name: AllowanceAssignmentEmployeeEnum.department_name,  type: 'input',    readonly: true  },
                                        { name: AllowanceAssignmentEmployeeEnum.amount,           type: 'number',   minFractionDigits: 2, maxFractionDigits: 2, readonly: false },
                                        { name: AllowanceAssignmentEmployeeEnum.remark,           type: 'textArea', rows: 1, readonly: false },
                                        { name: AllowanceAssignmentEmployeeEnum.employee,         type: 'input',    hidden: true    },
                                    ])
                                    .getDatasource<AllowanceAssignmentEmployeeModel[]>('employee', existingEmployees)
                                    .setTableCaption(true)
                                    .setTableCaptionLabel('Employees')
                                    .setExportTableData(true)
                                    .captionButtonConfig([
                                        {
                                            show:            true,
                                            icon:            'pi pi-users',
                                            label:           'Select & Generate',
                                            toolTip:         'Select filter and load employees',
                                            tooltipPosition: 'top',
                                            onClick: (fv: any, tf: any, ff: any) => this.onClickGenerate(fv, tf, ff),
                                        },
                                    ])
                                    .tableButtonConfig([
                                        {
                                            show:            true,
                                            icon:            'pi pi-refresh',
                                            label:           'Apply Amount',
                                            toolTip:         'Apply current amount to all employee rows',
                                            tooltipPosition: 'top',
                                            onClick: (ev: any, ds: any, dlg: any, sel: any, ctx: any) =>
                                                this.onApplyAmount(ev, ds, dlg, sel, ctx),
                                        },
                                    ])
                                    .setAddButton(false)
                                    .tableRowsCount(10)
                                    .buttonStates(false, false, false, false, false, true)
                                    .build()
                            ],
                        },
                    ]),
            ];
        };
}
