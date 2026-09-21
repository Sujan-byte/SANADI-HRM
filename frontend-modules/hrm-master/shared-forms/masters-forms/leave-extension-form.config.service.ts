import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { SharedService } from 'src/app/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { LeaveExtensionModel } from 'src/app/core/shared/common/model/masters/leave-extension.model';
import { LeaveExtensionEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-extension.enum';

@Injectable({
    providedIn: 'root',
})
export class LeaveExtensionFormConfig {
    private translate = inject(TranslateService);
    private sharedService = inject(SharedService);

    public readonly LeaveExtensionForm =
        () =>
        (dataFromComponent?: any, initialData?: LeaveExtensionModel, isEditMode?: boolean, data?: LeaveExtensionModel) => {

            // `data` = existing record (edit) or dialogData/modifiedData (new)
            // `dataFromComponent` = { config, ref } from DialogComponent — NOT the pre-populated data
            const context: any = data ?? {};


            // Min date for extended_to_date = day after current leave end
            const minExtendDate = context?.current_end_date
                ? (() => {
                    const p = String(context.current_end_date).split('-');
                    return new Date(+p[2], +p[1] - 1, +p[0] + 1);
                })()
                : null;

            // For new records: InputField.getValue() uses defaultData[name] when !isEditMode.
            // So for display fields we must pass context as defaultData too.
            // For editable input fields, initialData stays empty so they start blank.
            const displayData = isEditMode ? new LeaveExtensionModel() : context;
            initialData = new LeaveExtensionModel();

            let default_employee_object = context?.employee_default_object ?? {};
            let default_delegated_reviewer_object = context?.default_delegated_reviewer_object ?? {};

            return [
                new TabBuilder(this.translate)
                    .addTabFields([
                        {
                            tabHeader: this.translate.instant('leaveExtensionDetails_TC'),
                            fieldUniqueKey: 'leave_extension_tab',
                            fields: [
                                // ── Parent leave info (read-only, pre-populated) ───────────
                                // Pass context as both data AND defaultData so getValue() works
                                // for both new (!isEditMode → uses defaultData) and edit (isEditMode → uses data)
                                new InputField(this.translate, LeaveExtensionEnum.employeeName, isEditMode, context, displayData)
                                    .addFieldWidth('24%')
                                    .isReadOnly(true)
                                    .toObject(),

                                new DateField(this.translate, LeaveExtensionEnum.currentEndDate, isEditMode, context, displayData, undefined, 'Current End Date')
                                    .addFieldWidth('24%')
                                    .isReadOnly(true)
                                    .toObject(),

                                new NumberField(this.translate, LeaveExtensionEnum.availableLeaves, isEditMode, context, displayData, this.translate.instant('available_leaves_TC'))
                                    .addFieldWidth('24%')
                                    .isReadOnly(true)
                                    .setMaxFractionDigits(2)
                                    .setMinFractionDigits(0)
                                    .toObject(),

                                new NumberField(this.translate, LeaveExtensionEnum.lopDays, isEditMode, context, displayData, this.translate.instant('lop_days_TC'))
                                    .addFieldWidth('24%')
                                    .isReadOnly(true)
                                    .setMaxFractionDigits(2)
                                    .setMinFractionDigits(0)
                                    .isFieldHidden(!(context?.lop_days > 0))
                                    .toObject(),

                                // ── Extension input ───────────────────────────────────────
                                new DateField(this.translate, LeaveExtensionEnum.extendedToDate, isEditMode, data, initialData, undefined, 'Extend To Date')
                                    .addFieldWidth('24%')
                                    .validate(true)
                                    .setMinDateValue(minExtendDate)
                                    .onChange(this.onChangeExtendedToDate.bind(this))
                                    .toObject(),

                                new NumberField(this.translate, LeaveExtensionEnum.extensionDays, isEditMode, data, initialData)
                                    .addFieldWidth('24%')
                                    .isReadOnly(true)
                                    .setMaxFractionDigits(1)
                                    .setMinFractionDigits(0)
                                    .toObject(),

                                new ToggleBuilder(this.translate, LeaveExtensionEnum.allowBeyondEligible, isEditMode, data, initialData)
                                    .addFieldWidth('24%')
                                                                    .isReadOnly(data?.approval_status === 'APPROVED')

                                    .onChange(this.onChangeAllowBeyond.bind(this))
                                    .toObject(),

                                // is_paid_beyond: visible only when allow_beyond_eligible is true
                                new ToggleBuilder(this.translate, LeaveExtensionEnum.isPaidBeyond, isEditMode, data, initialData)
                                    .addFieldWidth('24%')
                                    .isFieldHidden(!context?.[LeaveExtensionEnum.allowBeyondEligible] && !data?.[LeaveExtensionEnum.allowBeyondEligible])
                                    .toObject(),

                                new TextBuilder(this.translate, LeaveExtensionEnum.reason, isEditMode, data, initialData, 'reason_TC')
                                    .addFieldWidth('48%')
                                    .validate(true, 1, 500)
                                    .toObject(),

                                // ── Reviewer (hidden — auto-set from leave application's delegated_reviewer) ──
                                new DropdownField(this.translate, LeaveExtensionEnum.delegatedReviewer, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
                                    .addFieldWidth('24%')
                                    .setRequiredFields('id,first_name')
                                    .addKeyValueLabel('first_name', 'id')
                                    .getOptions(signal([]))
                                    .isLazyFilterDropDown(true)
                                    .isNeedRequiredFields(true)
                                    .isFieldHidden(true)
                                    .setDefaultObject(default_delegated_reviewer_object)
                                    .getUrlConfig({
                                        get: {
                                            url: ServiceUrlConstants.APP_USER_CRUD,
                                            params: { page_size: 30, is_active: true },
                                            filterKeys: [`search`],
                                        }
                                    })
                                    .bindOption(this.updateDropdownOptions.bind(this))
                                    .toObject(),

                                // ── Hidden FKs — pre-populated from parent ─────────────────
                                new NumberField(this.translate, LeaveExtensionEnum.employee, isEditMode, context, displayData)
                                    .addFieldWidth('24%')
                                    .isFieldHidden(true)
                                    .toObject(),

                                new NumberField(this.translate, LeaveExtensionEnum.leaveApplication, isEditMode, context, displayData)
                                    .addFieldWidth('24%')
                                    .isFieldHidden(true)
                                    .toObject(),

                                new NumberField(this.translate, LeaveExtensionEnum.leaveEntry, isEditMode, context, displayData)
                                    .addFieldWidth('24%')
                                    .isFieldHidden(true)
                                    .toObject(),
                            ]
                        }
                    ])
            ];
        };

    // ── onChange handlers ─────────────────────────────────────────────────────

    onChangeExtendedToDate(prev: any, next: any, formValue: any, formFields: any, form: any) {
        if (!next || !formValue.current_end_date) return formValue;

        try {
            const [curD, curM, curY] = String(formValue.current_end_date).split('-').map(Number);
            const [extD, extM, extY] = String(next).split('-').map(Number);
            const currentEnd = new Date(curY, curM - 1, curD);
            const extDate    = new Date(extY, extM - 1, extD);

            if (extDate <= currentEnd) {
                this.sharedService.handleWarning('Extension date must be after the current leave end date.');
                formValue.extended_to_date = null;
                form?.get(LeaveExtensionEnum.extendedToDate)?.setValue(null);
                return formValue;
            }

            const extDays = Math.round((extDate.getTime() - currentEnd.getTime()) / (1000 * 3600 * 24));
            const available = Number(formValue.available_leaves ?? 0);

            // Block if extension days exceed available balance and allow_beyond_eligible is off
            if (extDays > available && !formValue.allow_beyond_eligible) {
                this.sharedService.handleWarning(
                    `Extension days (${extDays}) exceed available leave balance (${available}). Enable "Allow Beyond Available Leaves" to proceed.`
                );
                formValue.extended_to_date = null;
                formValue.extension_days   = 0;
                form?.get(LeaveExtensionEnum.extendedToDate)?.setValue(null);
                form?.get(LeaveExtensionEnum.extensionDays)?.setValue(0);
                return formValue;
            }

            formValue.extension_days = extDays;
            form?.get(LeaveExtensionEnum.extensionDays)?.setValue(extDays);

            // Compute LOP if allowed beyond
            const lopField = formFields
                ?.find((t: any) => t?.fieldUniqueKey === 'leave_extension_tab')?.fields
                ?.find((f: any) => f?.name === LeaveExtensionEnum.lopDays);

            if (formValue.allow_beyond_eligible && extDays > available) {
                const lop = extDays - available;
                formValue.lop_days = lop;
                form?.get(LeaveExtensionEnum.lopDays)?.setValue(lop);
                if (lopField) lopField.hidden = false;
            } else {
                formValue.lop_days = 0;
                form?.get(LeaveExtensionEnum.lopDays)?.setValue(0);
                if (lopField) lopField.hidden = true;
            }
        } catch (e) {
            console.error('[LeaveExtension] onChangeExtendedToDate error:', e);
        }

        return formValue;
    }

    onChangeAllowBeyond(prev: any, next: any, formValue: any, formFields: any, form: any) {
        const tabFields = formFields
            ?.find((t: any) => t?.fieldUniqueKey === 'leave_extension_tab')?.fields;

        const lopField       = tabFields?.find((f: any) => f?.name === LeaveExtensionEnum.lopDays);
        const isPaidBeyondField = tabFields?.find((f: any) => f?.name === LeaveExtensionEnum.isPaidBeyond);

        const available  = Number(formValue.available_leaves ?? 0);
        const extDays    = Number(formValue.extension_days ?? 0);
        const beyondBalance = extDays > available;

        if (!next && beyondBalance) {
            // Toggle turned OFF but date already set beyond balance — reset the date
            this.sharedService.handleWarning(
                `Extension days (${extDays}) exceed available leave balance (${available}). Enable "Allow Beyond Available Leaves" to proceed.`
            );
            formValue.extended_to_date = null;
            formValue.extension_days   = 0;
            formValue.lop_days         = 0;
            formValue.is_paid_beyond   = false;
            form?.get(LeaveExtensionEnum.extendedToDate)?.setValue(null);
            form?.get(LeaveExtensionEnum.extensionDays)?.setValue(0);
            form?.get(LeaveExtensionEnum.lopDays)?.setValue(0);
            if (lopField) lopField.hidden = true;
            if (isPaidBeyondField) isPaidBeyondField.hidden = true;
            return formValue;
        }

        // Show/hide is_paid_beyond based on allow_beyond state
        if (isPaidBeyondField) {
            isPaidBeyondField.hidden = !next;
        }

        if (next && beyondBalance) {
            // Toggle turned ON — compute LOP (shown only when is_paid_beyond=false)
            const lop = extDays - available;
            formValue.lop_days = lop;
            form?.get(LeaveExtensionEnum.lopDays)?.setValue(lop);
            if (lopField) lopField.hidden = formValue.is_paid_beyond || lop <= 0;
        } else {
            // Within balance or toggle off — no LOP
            formValue.lop_days = 0;
            form?.get(LeaveExtensionEnum.lopDays)?.setValue(0);
            if (lopField) lopField.hidden = true;
        }
        return formValue;
    }

    updateDropdownOptions(response: any) {
        return response?.results ?? [];
    }
}
