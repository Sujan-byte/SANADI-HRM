import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { ToggleBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/toggle.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { ApprovalOptions, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { LeaveReversalModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-reversal.model';
import { LeaveReversalEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-reversal-enum';

@Injectable({
    providedIn: 'root',
})
export class LeaveReversalConfig {  // ✅ Changed to PascalCase
    private translate = inject(TranslateService);
    private apiService = inject(ApiService);
    private sharedService = inject(SharedService);
    private permissionService = inject(NgxPermissionsService);
    
    private readonly holidayList = signal([]);
    
    private readonly travel_or_leave = signal([
        { key: 'Leave', value: 'Leave' },
        { key: 'Travel', value: 'Travel' },
        { key: 'Work From Home', value: 'Work From Home' }
    ]);
    
    private readonly conditionList = signal([
        { key: 'Full Day', value: 'Full Day' },
        { key: 'Half Day', value: 'Half Day' }
    ]);
    
    private readonly type_of_days = signal([
        { key: 'Working days', value: 'Working_days' },
        { key: 'Calendar days', value: 'Calendar_days' }
    ]);

    public readonly LeaveReversalForm = () =>
        (dataFromComponent?: any, initialData?: LeaveReversalModel, isEditMode?: boolean, data?: LeaveReversalModel) => {
            let userId = localStorage.getItem('user_id');
            initialData = new LeaveReversalModel();
            
            let default_employee_object = isEditMode ? data?.employee_default_object : {};
            let leaveTypeHidden = false;
            
            this.getHolidayMasters();
            
            // Constrain reversal dates to be within the original leave's date range
            let minFromDate = isEditMode && data?.from_date
                ? (() => { const [d,m,y] = data.from_date.split('-').map(Number); return new Date(y,m-1,d); })()
                : null;
            let maxFromDate = isEditMode && data?.to_date
                ? (() => { const [d,m,y] = data.to_date.split('-').map(Number); return new Date(y,m-1,d); })()
                : null;
            let minToDate = minFromDate;
            let maxToDate = maxFromDate;
            
            const type_leave = isEditMode ? (data?.travel_or_leave == 'Leave' ? 'Leave' : 'Attendance') : 'Leave';
            let default_leave_type_object = isEditMode ? data?.leave_type_default_object : {};
            let default_delegated_reviewer_obj = isEditMode ? data?.default_delegated_reviewer_obj : {};
            let default_initiator_reviewer_obj = isEditMode ? data?.default_initiator_reviewer_obj : {};
            
            const isReveiwer = this.permissionService.getPermission("hrm_master.custom_approval_stage_approver");
            const isInitiator = this.permissionService.getPermission("hrm_master.custom_approval_stage_HR");
            
            console.log("isReveiwer", isReveiwer, isInitiator, data);
            
            let isDelegatedReveiwerHidden = true;
            if ((isReveiwer || isInitiator) && isEditMode) {
                isDelegatedReveiwerHidden = false;
            }
            
            if (isEditMode) {
                leaveTypeHidden = data?.travel_or_leave == "Work From Home";
            }

            // Toggle only makes sense for Working_days leaves —
            // Calendar_days already excluded holidays when leave was raised.
            const isIncludeHolidaysHidden = !(isEditMode && data?.type_of_days === 'Working_days');

            return [
                new TabBuilder(this.translate)
                    .addTabFields([
                        {
                            tabHeader: this.translate.instant('leaveReversalDetails_TC'),
                            fieldUniqueKey: 'leave-details',
                            fields: [
                                {
                                    type: 'accordion',
                                    multiple: true,
                                    fieldUniqueKey: 'entry-details-accordion',
                                    fields: [
                                        {
                                            // @ts-ignore  // ✅ Added ts-ignore like LeavePolicyFormConfig
                                            accordionHeader: this.translate.instant('leaveDetails_TC'),
                                            fieldUniqueKey: 'entry-info',
                                            selected: true,
                                            fields: [
                                                new DropdownField(this.translate, LeaveReversalEnum.travel_or_leave, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC', 'type_TC')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('key', 'value')
                                                    .getOptions(this.travel_or_leave)
                                                    .validate(true)
                                                    .isReadOnly(true)
                                                    .toObject(),
                                                    
                                                new DropdownField(this.translate, "employee", isEditMode, data, initialData, true, undefined, "employee_code_TC", '23.5vw')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabelList(['employee_code', 'first_name', 'designation_name'], 'id')
                                                    .validate(true)
                                                    .getOptions(signal([]))
                                                    .isLazyFilterDropDown(true)
                                                    .isNeedRequiredFields(true)
                                                    .setRequiredFields('id,employee_code,first_name')
                                                    .setDefaultObject(default_employee_object)
                                                    .getUrlConfig({
                                                        get: {
                                                            url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                                                            params: isInitiator ? 
                                                                { page_size: 30, is_active: true } : 
                                                                { page_size: 30, is_active: true, user__id: userId },
                                                            filterKeys: [`employee__${FilterOptions.istartsWith}`]
                                                        }
                                                    })
                                                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                                                    .isReadOnly(true)
                                                    .toObject(),
                                                    
                                                new DropdownField(this.translate, LeaveReversalEnum.leaveType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', type_leave == 'Leave' ? 'leave type' : 'Travel Status')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('status_name', 'id')
                                                    .getOptions(signal([]))
                                                    .isFieldHidden(leaveTypeHidden)
                                                    .setDefaultObject(default_leave_type_object)
                                                    .getUrlConfig({
                                                        get: {
                                                            url: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
                                                            params: {
                                                                page_size: 30,
                                                                is_active: true,
                                                                type: type_leave
                                                            }
                                                        }
                                                    })
                                                    .isReadOnly(true)
                                                    .bindOption(this.updateAttendanceStatusDropdownOptions.bind(this))
                                                    .toObject(),
                                                    
                                                new DropdownField(this.translate, LeaveReversalEnum.typeOfDays, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('key', 'value')
                                                    .getOptions(signal(this.type_of_days()))
                                                    .isReadOnly(true)
                                                    .isFieldHidden(!(type_leave == 'Leave'))
                                                    .toObject(),
                                                    
                                                new DateField(this.translate, LeaveReversalEnum.fromDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(true)
                                                    .isDisabled(true)
                                                    .setMinDateValue(minFromDate)
                                                    .toObject(),
                                                    
                                                new DateField(this.translate, LeaveReversalEnum.toDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(true)
                                                    .isDisabled(true)
                                                    .setMinDateValue(minToDate)
                                                    .toObject(),
                                                    
                                                new DropdownField(this.translate, LeaveReversalEnum.condition, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('key', 'value')
                                                    .getOptions(this.conditionList)
                                                    .validate(true)
                                                    .toObject(),
                                                    
                                                new NumberField(this.translate, LeaveReversalEnum.noOfDays, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .setMinFractionDigits(0)
                                                    .setMaxFractionDigits(1)
                                                    .isReadOnly(true)
                                                    .toObject(),
                                                    
                                                new NumberField(this.translate, LeaveReversalEnum.balanceNoOfDays, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .setMinFractionDigits(0)
                                                    .setMaxFractionDigits(1)
                                                    .isReadOnly(true)
                                                    .toObject(),
                                                    
                                                new TextBuilder(this.translate, LeaveReversalEnum.reason, isEditMode, data, initialData, 'leaveReason_TC')
                                                    .addFieldWidth('24%')
                                                    .isReadOnly(true)
                                                    .validate(false, 1, 500)
                                                    .toObject(),
                                            ]
                                        },
                                        {
                                            // @ts-ignore  // ✅ Added ts-ignore like LeavePolicyFormConfig
                                            accordionHeader: this.translate.instant('reversalInfo_TC'),
                                            fieldUniqueKey: 'reverse_entry-info',
                                            selected: true,
                                            fields: [
                                                new DateField(this.translate, LeaveReversalEnum.reverseFromDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(true)
                                                    .onChange(this.onChangeFromDate.bind(this))
                                                    .setMinDateValue(minFromDate)
                                                    .setMaxDateValue(maxFromDate)
                                                    .toObject(),

                                                new DateField(this.translate, LeaveReversalEnum.reverseToDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(true)
                                                    .onChange(this.onChangeToDate.bind(this))
                                                    .setMinDateValue(minToDate)
                                                    .setMaxDateValue(maxToDate)
                                                    .toObject(),
                                                    
                                                new NumberField(this.translate, LeaveReversalEnum.reverseNoOfDays, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .setMinFractionDigits(0)
                                                    .setMaxFractionDigits(1)
                                                    .isReadOnly(true)
                                                    .toObject(),

                                                new ToggleBuilder(this.translate, LeaveReversalEnum.includeHolidays, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .isFieldHidden(isIncludeHolidaysHidden)
                                                    .onChange(this.onChangeIncludeHolidays.bind(this))
                                                    .toObject(),

                                                new TextBuilder(this.translate, LeaveReversalEnum.reasonForReversal, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(true, 1, 500)
                                                    .toObject(),

                                                new DropdownField(this.translate, 'initiator_reviewer', isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
                                                    .addFieldWidth('24%')
                                                    .setRequiredFields('id,first_name')
                                                    .addKeyValueLabel('first_name', 'id')
                                                    .getOptions(signal([]))
                                                    .isLazyFilterDropDown(true)
                                                    .validate(true)
                                                    .isNeedRequiredFields(true)
                                                    .setDefaultObject(default_initiator_reviewer_obj)
                                                    .getUrlConfig({
                                                        get: {
                                                            url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                                                            params: isInitiator ? 
                                                                { page_size: 30, is_active: true, groups__name: 'HR' } : 
                                                                { page_size: 30, is_active: true },
                                                            filterKeys: [`employee__${FilterOptions.istartsWith}`]
                                                        }
                                                    })
                                                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                                                    .toObject(),
                                                    
                                                new DropdownField(this.translate, 'delegated_reviewer', isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
                                                    .addFieldWidth('24%')
                                                    .setRequiredFields('id,first_name')
                                                    .addKeyValueLabel('first_name', 'id')
                                                    .getOptions(signal([]))
                                                    .isLazyFilterDropDown(true)
                                                    .isNeedRequiredFields(true)
                                                    .isFieldHidden(isDelegatedReveiwerHidden)
                                                    .setDefaultObject(default_delegated_reviewer_obj)
                                                    .getUrlConfig({
                                                        get: {
                                                            // url: `${ServiceUrlConstants.APP_USER_CRUD}`,
                                                            url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                                                            params: {
                                                                page_size: 30,
                                                                is_active: true,
                                                                // search_key: 'first_name',
                                                                // employee__isnull: false,
                                                                groups__name: 'Approver'
                                                            },
                                                            // filterKeys: [`search`]
                                                            filterKeys: [`employee__${FilterOptions.istartsWith}`]
                                                        }
                                                    })
                                                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                                                    .validate(false, 1, 1000)
                                                    .toObject(),
                                                    
                                                new NumberField(this.translate, LeaveReversalEnum.weeklyOff, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .setMinFractionDigits(0)
                                                    .setMaxFractionDigits(1)
                                                    .isReadOnly(true)
                                                    .isFieldHidden(true)
                                                    .toObject(),
                                                    
                                                new NumberField(this.translate, LeaveReversalEnum.leaveEntry, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .isFieldHidden(true)
                                                    .toObject(),

                                                new NumberField(this.translate, LeaveReversalEnum.leaveApplication, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .isFieldHidden(true)
                                                    .toObject(),
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ])
            ];
        };

    // ... rest of your methods remain the same ...
    updateAttendanceStatusDropdownOptions(response: any) {
        if (response?.results?.length) {
            return response.results;
        }
        return [];
    }

    updateDynamicDropdownOptions(response: any) {
        if (response?.results?.length) {
            return response.results;
        }
        return [];
    }

    check_permission(permission: string): boolean {
        return !!this.permissionService.getPermission(permission);
    }

    onChangeToDate(prev: any, next: any, formValue: any, formFields: any) {
        if (formValue.reverse_from_date && next !== '') {
            const [fromDay, fromMonth, fromYear] = formValue.reverse_from_date?.split('-').map(Number);
            const [toDay, toMonth, toYear] = formValue.reverse_to_date?.split('-').map(Number);
            const fromDate = new Date(fromYear, fromMonth - 1, fromDay);
            const toDate = new Date(toYear, toMonth - 1, toDay);
            let currentDate = new Date(fromDate);
            let excludedDays = 0;
            const includeHolidays = !!formValue?.include_holidays;

            while (currentDate <= toDate) {
                if (formValue?.type_of_days === 'Working_days') {
                    if (this.checkIfWeeklyOff(currentDate, formValue?.weekly_off)) {
                        // Weekly-offs are never charged — always exclude
                        excludedDays++;
                    } else if (!includeHolidays && this.checkOnlyHoliday(currentDate)) {
                        // include_holidays OFF → holidays were NOT charged → exclude
                        // include_holidays ON  → holidays WERE charged (declared after leave) → include
                        excludedDays++;
                    }
                }
                // Calendar_days: straight count, no exclusions
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // +1 so same-day (from==to) is 1, not 0
            const diffMs = toDate.getTime() - fromDate.getTime();
            const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
            formValue.reverse_no_of_days = Math.max(0, totalDays - excludedDays);

            if (formValue.reverse_no_of_days === 0) {
                formValue.reverse_to_date = null;
                this.sharedService.handleWarning(
                    "No chargeable leave days in the selected range — the dates are all weekly-offs or holidays that were not counted when the leave was raised."
                );
                return formValue;
            }

            const hasLeaveRef = (formValue.leave_entry != null && formValue.leave_entry !== '')
                || (formValue.leave_application != null && formValue.leave_application !== '');
            if (hasLeaveRef) {
                if (formValue.reverse_no_of_days > formValue.balance_no_of_days) {
                    formValue.reverse_no_of_days = 0;
                    formValue.reverse_to_date = null;
                    this.sharedService.handleWarning(
                        "Leave details: balance number of days cannot be less than the leave reversal number of days."
                    );
                }
            }

            return formValue;
        }
        return formValue;
    }

    onChangeFromDate(prev: any, next: any, formValue: any, formFields: any) {
        if (next) {
            const from_date = formFields
                .find((ele: any) => ele.fieldUniqueKey == "leave-details")
                ?.fields.find((ele: any) => ele.fieldUniqueKey == "entry-details-accordion")
                ?.fields.find((ele: any) => ele?.fieldUniqueKey == 'reverse_entry-info')
                ?.fields.find((ele: any) => ele?.name == 'reverse_from_date');
                
            if (from_date?.value !== next && next !== '') {
                const fromDateParts = formValue.reverse_from_date.split('-');
                const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
                const toDateField = formFields
                    .find((ele: any) => ele.fieldUniqueKey == "leave-details")
                    ?.fields.find((ele: any) => ele.fieldUniqueKey == "entry-details-accordion")
                    ?.fields.find((ele: any) => ele?.fieldUniqueKey == 'reverse_entry-info')
                    ?.fields.find((ele: any) => ele?.name == 'reverse_to_date');
                    
                if (toDateField) {
                    toDateField.minDateValue = new Date(fromDate);
                }
                formValue.reverse_to_date = null;
            }
        }
        return formValue;
    }

    onChangeIncludeHolidays(prev: any, next: any, formValue: any, formFields: any) {
        // When the toggle changes, recalculate reverse_no_of_days with updated holiday inclusion
        if (formValue.reverse_from_date && formValue.reverse_to_date) {
            return this.onChangeToDate(prev, formValue.reverse_to_date, formValue, formFields);
        }
        return formValue;
    }

    checkIfWeeklyOff(punchInDate: Date, weeklyOff: any): boolean {
        try {
            const weeklyOffDays: string[] = Array.isArray(weeklyOff) ? weeklyOff : JSON.parse(weeklyOff);
            if (!weeklyOffDays || weeklyOffDays.length === 0) {
                return punchInDate.getDay() === 0;
            }
            const punchInWeekday = punchInDate.getDay();
            for (const dayName of weeklyOffDays) {
                if (punchInWeekday === this.dayNameToWeekday(dayName)) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Invalid weekly_off format. Expected a JSON-like array string.");
            return punchInDate.getDay() === 0;
        }
    }

    dayNameToWeekday(dayName: string): number {
        const dayMap: { [key: string]: number } = {
            "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4,
            "friday": 5, "saturday": 6, "sunday": 0
        };
        return dayMap[dayName.toLowerCase()] ?? -1;
    }

    checkOnlyHoliday(punchInDate: Date): boolean {
        const isHoliday = this.holidayList().some(holiday => {
            const [day, month, year] = holiday.date.split('-').map(Number);
            const [toDay, toMonth, toYear] = holiday.to_date.split('-').map(Number);
            const holidayFrom = new Date(year, month - 1, day);
            const holidayTo = new Date(toYear, toMonth - 1, toDay);
            return punchInDate >= holidayFrom && punchInDate <= holidayTo;
        });
        return isHoliday;
    }

    getHolidayMasters() {
        this.apiService.get(HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD, { approval_status: ApprovalOptions.APPROVED })
            .subscribe((res: any) => {
                if (res?.results) {
                    this.holidayList.set(res?.results);
                }
            });
    }
}