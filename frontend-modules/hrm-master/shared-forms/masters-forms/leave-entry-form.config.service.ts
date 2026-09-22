import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { ApprovalOptions, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { LeaveEntryEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-entry.enum';
import { LeaveEntryModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-entry.model';
import * as moment from 'moment';
import { ToggleBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/toggle.builder';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { resolve } from 'path';
import { HttpParams } from '@angular/common/http';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { NgxPermissionsService } from 'ngx-permissions';
import { MultiSelectField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/multiselect.builder';
import { FileField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/file.builder';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root',

})
export class leaveEntryConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private sharedService = inject(SharedService);
  private permissionService = inject(NgxPermissionsService);
  private readonly conditionList = signal([
    {
      key: 'Full Day',
      value: 'Full Day'
    },
    {
      key: 'Half Day',
      value: 'Half Day'
    },
  ])

  private readonly travel_or_leave = signal([
    {
      key: 'Leave',
      value: 'Leave'
    },
    {
      key: 'Travel',
      value: 'Travel'
    },
    {
      key: 'Work From Home',
      value: 'Work From Home'
    }
  ])

  private readonly type_of_days = signal([
    { key: 'Working days', value: 'Working_days' },
    { key: 'Calendar days', value: 'Calendar_days' }

  ])

  // private readonly leaveTypeList = signal([])
  // private readonly minDate = signal(null)
  // private readonly maxDate = signal(null)

  private readonly holidayList = signal([])

  public readonly LeaveEntryForm =
    () =>
      (dataFromComponent?: any, initialData?: LeaveEntryModel, isEditMode?: boolean, data?: LeaveEntryModel) => {
        let userId = localStorage.getItem('user_id');
        initialData = new LeaveEntryModel();
        initialData.condition = "Full Day";
        let default_employee_object = isEditMode ? data.employee_default_object : {};
        this.getHolidayMasters();
        // if(isEditMode){
        //   isEditMode.leave_types=="Sick Leave"
        // }
        // let isHiddenLopFiled = false
        // let isHiddenIsCompoffFiled = false
        let leaveTypeHidden = false;
        // if (!isEditMode) {
        //   this.leaveTypeList.set([]);
        // }
        let minFromDate = null;
        let minToDate = null;
        const type_leave = isEditMode ? data?.travel_or_leave == 'Leave' ? 'Leave' : 'Attendance' : 'Leave';
        let available_label = isEditMode ? data?.travel_or_leave == 'Work From Home' ? 'Available Work From Home' : 'Available Leaves' : 'Available Leaves';
        let default_leave_type_object = isEditMode ? data.leave_type_default_object : {};
        let default_delegated_reviewer_obj = isEditMode ? data.default_delegated_reviewer_object : {};
        const isReversalInitiator = !(data?.approval_status == 'APPROVED' && this.check_permission("hrm_master.custom_enable_leave_reversal"))
        const isReveiwer = this.permissionService.getPermission("hrm_master.custom_approval_stage_approver");
        const isInitiator = this.permissionService.getPermission("hrm_master.custom_approval_stage_initiator");

        let isDelegatedReveiwerHidden = true
        if ((isReveiwer || isInitiator) && isEditMode) {
          isDelegatedReveiwerHidden = false
        }
        else {
          isDelegatedReveiwerHidden = true
        }

        if (isEditMode) {
          const DateParts = data?.doj?.split('-');
          const fromDate = new Date(DateParts[2], DateParts[1] - 1, DateParts[0]);
          minFromDate = new Date(fromDate);
          const DateParts1 = data?.from_date.split('-');
          const toDate = new Date(DateParts1[2], DateParts1[1] - 1, DateParts1[0]);
          minToDate = new Date(toDate);
          const formfields = this.LeaveEntryForm()()[0].fields
          const fields = formfields?.find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields.find(ele => ele?.type == 'accordion')
          // isHiddenLopFiled = data.is_lop
          // isHiddenIsCompoffFiled = data.is_comp_off
          // console.log("formfields",formfields)

          // ── Restore lop_days_from_extension if corrupted (zeroed by backend bug) ──
          // When allow_beyond=true and is_paid_beyond=false, always recompute from
          // stored available_leaves and no_of_days so the correct value is sent on save.
          if (data?.[LeaveEntryEnum.allowBeyondEligible] && !data?.[LeaveEntryEnum.isPaidBeyond]) {
            const available = Number(data?.[LeaveEntryEnum.availableLeaves] ?? 0);
            const noOfDays  = Number(data?.['no_of_days'] ?? 0);
            const computed  = Math.max(0, noOfDays - available);
            if (computed > 0 && (!data?.[LeaveEntryEnum.lopDaysFromExtension] || data?.[LeaveEntryEnum.lopDaysFromExtension] === 0)) {
              (data as any)[LeaveEntryEnum.lopDaysFromExtension] = computed;
            }
          }

          this.onChangeEmployee(0, data.employee, data, this.LeaveEntryForm()()[0]?.fields);
          this.editMode(data, fields.fields)
          // this.onChangeIsLop(0, data.is_lop, data, formfields)
          leaveTypeHidden = data?.travel_or_leave == "Work From Home" ? true : false;
        }

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'leave-details',
                fields: [
                  new DropdownField(this.translate, LeaveEntryEnum.travel_or_leave, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('key', 'value')
                    .getOptions(this.travel_or_leave)
                    .onChangeOnly(this.onChangeTravelOrLeave.bind(this))
                    .validate(true)
                    .toObject(),
                  new DropdownField(this.translate, "employee", isEditMode, data, initialData, true, undefined, "employee_code_TC", '23.5vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['employee_code', 'first_name', 'designation_name'], 'id')
                    .validate(true)
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setRequiredFields('id,employee_code,first_name')
                    .setDefaultObject(default_employee_object)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                        params: isInitiator ? { page_size: 30, is_active: true } : { page_size: 30, is_active: true, user__id: userId },
                        filterKeys: [`employee__${FilterOptions.istartsWith}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, "first_name", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "last_name", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "grade", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "designation_name", isEditMode, data, initialData, this.translate.instant("designation_TC"))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DropdownField(this.translate, 'delegated_reviewer', isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
                    .addFieldWidth('24%')
                    // .addKeyValueLabel('employee_code', 'id')
                    .setRequiredFields('id,first_name')
                    .addKeyValueLabel('first_name', 'id')
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    // .validate(true)
                    .isNeedRequiredFields(true)
                    .isFieldHidden(isDelegatedReveiwerHidden)
                    .setDefaultObject(default_delegated_reviewer_obj)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.APP_USER_CRUD}`,
                        params: {
                          page_size: 30,
                          is_active: true,
                          search_key: 'first_name',
                          employee__isnull: false

                        },
                        filterKeys: [`search`],
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .validate(false, 1, 1000)
                    .toObject(),
                  new DateField(this.translate, "doj", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .addFormat("yy-mm-dd")
                    .isReadOnly(true)
                    // .setMaxDateValue(this.minDate)
                    // .setMinDateValue(this.maxDate)
                    .isFieldHidden(true)
                    .toObject(),
                  new MultiSelectField(this.translate, "weekly_off", isEditMode, data, initialData, false, 'select weekly off', '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('name', 'id')
                    .isFieldHidden(true)
                    .getOptions(signal([
                      { name: 'Sunday', id: 'Sunday' },
                      { name: 'Monday', id: 'Monday' },
                      { name: 'Tuesday', id: 'Tuesday' },
                      { name: 'Wednesday', id: 'Wednesday' },
                      { name: 'Thursday', id: 'Thursday' },
                      { name: 'Friday', id: 'Friday' },
                      { name: 'Saturday', id: 'Saturday' },
                    ]))
                    .toObject(),
                  {
                    type: 'accordion',
                    multiple: true,
                    fieldUniqueKey: 'entry-details-accordion',
                    fields: [
                      {
                        accordionHeader: this.translate.instant('entryDetails_TC'),
                        fieldUniqueKey: 'entry-info',
                        selected: true,
                        fields: [
                          // new ToggleBuilder(this.translate, LeaveEntryEnum.isLop, isEditMode, data, initialData)
                          //   .addFieldWidth('24%')
                          //   .isFieldHidden(isHiddenLopFiled == false && isHiddenIsCompoffFiled == true)
                          //   .onChange(this.onChangeIsLop.bind(this))
                          //   .toObject(),
                          // new ToggleBuilder(this.translate, LeaveEntryEnum.isCompOff, isEditMode, data, initialData)
                          //   .addFieldWidth('24%')
                          //   .onChange(this.onChangeIsCompOff.bind(this))
                          //   .isFieldHidden(isHiddenLopFiled == true && isHiddenIsCompoffFiled == false)
                          //   .toObject(),
                          // new DropdownField(this.translate, LeaveEntryEnum.leaveType, isEditMode, data, initialData)
                          //   .addFieldWidth('24%')
                          //   .addKeyValueLabel('leave_type', 'id')
                          //   .onChangeOnly(this.onChangeLeaveType.bind(this))
                          //   .setDefaultObject(default_leave_type_object)
                          //   .getOptions(this.leaveTypeList)
                          //   // .validate(true)
                          //   .isFieldHidden(isHiddenLopFiled == true || isHiddenIsCompoffFiled == true)
                          //   .toObject(),
                          new DropdownField(this.translate, LeaveEntryEnum.leaveType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', type_leave == 'Leave' ? 'leave type' : 'Travel Status')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('status_name', 'id')
                            // .onChangeOnly(this.onChangeAvailableFields.bind(this))
                            .getOptions(signal([]))
                            // .isLazyFilterDropDown(true)
                            .onChangeOnly(this.onChangeLeaveType.bind(this))
                            .isFieldHidden(leaveTypeHidden)
                            .setDefaultObject(default_leave_type_object)
                            .getUrlConfig({
                              get: {
                                url: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
                                params: {
                                  page_size: 30,
                                  is_active: true,
                                  type: type_leave,
                                }
                              }
                            })
                            .isReadOnly(!(type_leave == 'Leave'))
                            .bindOption(this.updateAttendanceStatusDropdownOptions.bind(this))
                            .toObject(),
                          new DropdownField(this.translate, LeaveEntryEnum.typeOfDays, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(signal(this.type_of_days()))
                            .isReadOnly(true)
                            .isFieldHidden(!(type_leave == 'Leave'))
                            .toObject(),
                          new NumberField(this.translate, LeaveEntryEnum.availableLeaves, isEditMode, data, initialData, available_label)
                            .addFieldWidth('24%')
                            .isReadOnly(true)
                            .setMaxFractionDigits(1)
                            .setMinFractionDigits(0)
                            .isFieldHidden(data && (data?.[LeaveEntryEnum.travel_or_leave] === 'Travel'))
                            .toObject(),

                          new DropdownField(this.translate, LeaveEntryEnum.condition, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.conditionList)
                            .onChangeOnly(this.onChangeCondition.bind(this))
                            .validate(true)
                            .toObject(),
                          new DateField(this.translate, LeaveEntryEnum.fromDate, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true)
                            .setMinDateValue(minFromDate)
                            // .addFormat("yy-mm-dd")
                            .onChange(this.onChangeFromDate.bind(this))
                            .toObject(),
                          new DateField(this.translate, LeaveEntryEnum.toDate, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true)
                            .setMinDateValue(minToDate)
                            // .addFormat("yy-mm-dd")
                            .onChange(this.onChangeToDate.bind(this))
                            .toObject(),

                          new NumberField(this.translate, LeaveEntryEnum.noOfDays, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(1)
                            .isReadOnly(true)
                            .toObject(),
                          new NumberField(this.translate, LeaveEntryEnum.holidayDays, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(1)
                            .isReadOnly(true)
                            .isFieldHidden(!(type_leave == 'Leave'))
                            .toObject(),
                          new NumberField(this.translate, LeaveEntryEnum.weeklyOffDays, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(1)
                            .isReadOnly(true)
                            .isFieldHidden(!(type_leave == 'Leave'))
                            .toObject(),
                          // new DateField(this.translate, LeaveEntryEnum.compOffDate, isEditMode, data, initialData)
                          //   .addFieldWidth('30%')
                          //   .variantType('multiple')
                          //   .isFieldHidden(isHiddenLopFiled == true || isHiddenIsCompoffFiled == false)
                          //   .setMinDateValue(null)
                          //   .onChange(this.onChangeCompOffDate.bind(this))
                          //   .toObject(),
                          new TextBuilder(this.translate, LeaveEntryEnum.reason, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true, 1, 500)
                            .toObject(),
                          new TextBuilder(this.translate, LeaveEntryEnum.remarks, isEditMode, data, initialData, this.translate.instant('systemRemarkField_TC'), this.translate.instant('autogeneratedField_TC'))
                            .addFieldWidth('24%')
                            .validate(false, 1, 500)
                            .isReadOnly(true)
                            .toObject(),
                          new ToggleBuilder(this.translate, LeaveEntryEnum.isReversal, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isFieldHidden(isReversalInitiator)
                            .toObject(),
                          new InputField(this.translate, "leave_type_status_code", isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isFieldHidden(true)
                            .toObject(),
                          
                          // is_extension and no_of_days_extended are deprecated — hidden permanently
                          new ToggleBuilder(this.translate, "is_extension", isEditMode, data, initialData)
                                .addFieldWidth('24%')
                                .isFieldHidden(true)
                                .toObject(),

                          new DateField(this.translate, LeaveEntryEnum.extendedToDate, isEditMode, data, initialData)
                              .addFieldWidth('24%')
                              .isReadOnly(false)
                              .onChange(this.onChangeExtendedDays.bind(this))
                              .isFieldHidden(!this.showExtensionFields(data, isEditMode))
                              .toObject(),

                          new NumberField(this.translate, "no_of_days_extended", isEditMode, data, initialData, "Extended Days")
                                .addFieldWidth('24%')
                                .setMaxFractionDigits(1)
                                .isReadOnly(true)
                                .isFieldHidden(true)
                                .toObject(),

                          // Allow Beyond Eligible toggle — visible when travel_or_leave === 'Leave' (create or edit)
                          new ToggleBuilder(this.translate, LeaveEntryEnum.allowBeyondEligible, isEditMode, data, initialData)
                                .addFieldWidth('24%')
                                .isFieldHidden(data?.travel_or_leave !== 'Leave')
                                .isReadOnly(data?.approval_status === 'APPROVED')
                                .onChange(this.onChangeAllowBeyond.bind(this))
                                .toObject(),

                          // Paid/Unpaid toggle — visible only when allow_beyond_eligible is true
                          new ToggleBuilder(this.translate, LeaveEntryEnum.isPaidBeyond, isEditMode, data, initialData)
                                .addFieldWidth('24%')
                                .isFieldHidden(!data?.[LeaveEntryEnum.allowBeyondEligible])
                                .onChange(this.onChangeIsPaidBeyond.bind(this))
                                .toObject(),

                          // LOP days — read-only, visible when allow_beyond=true and is_paid_beyond=false
                          new NumberField(this.translate, LeaveEntryEnum.lopDaysFromExtension, isEditMode, data, initialData, "LOP Days")
                                .addFieldWidth('24%')
                                .setMaxFractionDigits(1)
                                .isReadOnly(true)
                                .isFieldHidden(!(data?.[LeaveEntryEnum.allowBeyondEligible] && !data?.[LeaveEntryEnum.isPaidBeyond]))
                                .toObject(),
                     
                        ]
                      }
                    ]
                  }
                ],
              },
              {
                tabHeader: this.translate.instant('upload_TC'),
                fieldUniqueKey: 'upload',
                fields: [
                  new FileField(this.translate, LeaveEntryEnum.certificate, isEditMode, data, initialData)
                    .addFieldWidth('20%')
                    .setAlignment('center')
                    .toObject(),
                ]
              }
            ])
        ];
      };

      showExtensionFields(data: any, isEditMode: boolean): boolean {
  // Show only for approved leaves in edit mode
  return isEditMode && data?.approval_status === 'APPROVED';
}

onChangeExtendedDays(prev, next, formValue, formFields) {
  // extended_to_date set/cleared — the serializer derives everything from this field.
  // No need to compute no_of_days_extended or set is_extension here.
  return formValue;
}

onChangeAllowBeyond(prev, next, formValue, formFields) {
  const allowBeyond = !!next;

  const findField = (name: string) => formFields
    ?.find(f => f?.fieldUniqueKey === 'leave-details')?.fields
    ?.find(f => f?.fieldUniqueKey === 'entry-details-accordion')?.fields
    ?.find(f => f?.fieldUniqueKey === 'entry-info')?.fields
    ?.find(f => f?.name === name);

  const isPaidBeyondField = findField(LeaveEntryEnum.isPaidBeyond);

  if (isPaidBeyondField) {
    isPaidBeyondField.hidden = !allowBeyond;
  }

  if (!allowBeyond) {
    formValue[LeaveEntryEnum.isPaidBeyond] = false;
    formValue[LeaveEntryEnum.lopDaysFromExtension] = 0;
  }

  // Recompute LOP days now that allow_beyond changed (dates may already be set)
  const noOfDays = Number(formValue[LeaveEntryEnum.noOfDays] ?? 0);
  if (noOfDays > 0) {
    formValue = this._updateLopDays(formValue, noOfDays, formFields);
  }

  return formValue;
}

  onChangeIsPaidBeyond(prev: any, next: any, formValue: any, formFields: any) {
    // When Paid Beyond toggle changes, recompute lop_days_from_extension and show/hide the LOP field.
    // isPaidBeyond=true  → 0 LOP, hide LOP field
    // isPaidBeyond=false → recompute LOP from available_leaves, show LOP field
    const noOfDays = Number(formValue[LeaveEntryEnum.noOfDays] ?? 0);
    formValue = this._updateLopDays(formValue, noOfDays, formFields);
    return formValue;
  }

  updateAttendanceStatusDropdownOptions(response) {
    if (response?.results?.length) {
      // Filter out "Annual Leave" regardless of case
      return response.results.filter(item => {
        const statusName = item.status_name?.toLowerCase();
        return statusName !== "annual leave";
      });
    } else {
      return [];
    }
  }
  // onChangeIsLop(prev, next, formValue, formFields) {
  //   if ((next === true) || (next === false)) {
  //     // console.log("onChangeIsLop", prev, next, formValue.is_lop)
  //     const leave_type = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.leaveType))
  //     const available_leaves = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.availableLeaves))
  //     // const is_comp_off = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.isCompOff))
  //     const comp_off_date = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.compOffDate))
  //     if (next) {
  //       leave_type.hidden = next ? true : false;
  //       available_leaves.hidden = next ? true : false;
  //       // is_comp_off.hidden = next ? true : false;
  //       // comp_off_date.hidden = next ? true : false;
  //       // console.log("if",)
  //     }
  //     else {
  //       leave_type.hidden = false
  //       available_leaves.hidden = false
  //       // is_comp_off.hidden = false
  //       // comp_off_date.hidden = true
  //       // console.log("else",)
  //     }
  //   }
  //   // if(formValue.is_comp_off==false && formValue.is_lop==true){
  //   //   console.log("formValue",formValue)
  //   // }
  //   // available_leaves.validation.required = next ? false  : false;
  //   // available_leaves.readonly = next ? false : true;
  //   // console.log("leave_type", leave_type, available_leaves,next,formValue)
  //   // available_leaves.validation.required=next?true:false;
  //   // leave_type.validation.req=next?false:true;
  // }
  // onChangeIsCompOff(prev, next, formValue, formFields) {
  //   if ((next === true) || (next === false)) {
  //     console.log("onChangeIsCompOff", prev, next, formValue.is_comp_off)
  //     const leave_type = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.leaveType))
  //     const available_leaves = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.availableLeaves))
  //     // const comp_off_date = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.compOffDate))
  //     // const is_lop = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.isLop))
  //     if (next) {
  //       is_lop.hidden = next ? true : false;
  //       leave_type.hidden = next ? true : false;
  //       available_leaves.hidden = next ? true : false;
  //       // comp_off_date.hidden = next ? false : true;
  //       if (formValue.to_date) {
  //         const toDateParts = formValue.to_date.split('-');
  //         // const CompoffToDate = new Date(toDateParts[2], toDateParts[1] - 1, Number(toDateParts[0])+1);
  //         // comp_off_date.minDateValue = new Date(CompoffToDate);
  //       }
  //     } else {
  //       is_lop.hidden = false
  //       leave_type.hidden = false
  //       available_leaves.hidden = false
  //       comp_off_date.hidden = true
  //     }
  //   }

  //}

  updateDynamicDropdownOptions(response: any) {
    if (response?.results?.length) {
      return response.results;
    }
    return [];
  }

  // onChangeAvailableFields(prev,next,formValue,formFields){
  //   let emp_id = formValue.employee
  //   let travel_or_leave = formValue.travel_or_leave
  //   console.log("emp_id",emp_id)
  //   console.log("mnext",next)
  //   console.log("avvvv",formValue)
  // }

  onChangeEmployee(prev, next, formValue, formFields) {
    // console.log("leaveType",formFields,formValue)
    // console.log("next",next);
    if (next) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((res: any) => {
          formValue.first_name = res?.first_name;
          formValue.last_name = res?.last_name;
          formValue.grade = res?.grade_code;
          formValue.designation_name = res?.designation_name;
          formValue.doj = res?.doj;
          formValue.weekly_off = res?.weekly_off;
          if (res?.doj) {
            const date = res?.doj.split('-');
            const dojDate = new Date(date[2], date[1] - 1, date[0]);
            const fromDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields.find((ele) => ele?.fieldUniqueKey == 'entry-details-accordion')?.fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'from_date')
            fromDateField.minDateValue = new Date(dojDate);
          }
          formValue.remarks = null;
          formValue.reason = null;
          // formValue.is_lop = false;
          // formValue.is_comp_off = false;
          formValue.leave_type = "";
          formValue.from_date = null;
          formValue.to_date = null;
          formValue.available_leaves = 0;
          formValue.no_of_days = 0;
          formValue.condition = 'Full Day';
          // Reset condition list to both options until leave type is chosen
          this.conditionList.set([
            { key: 'Full Day', value: 'Full Day' },
            { key: 'Half Day', value: 'Half Day' },
          ]);
          if (formValue.travel_or_leave) {
            formValue = this.onChangeTravelOrLeave(0, formValue.travel_or_leave, formValue, formFields);
            // this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=Work From Home&employee=${formValue.employee}`).subscribe((res: any) => {
            //   formValue.available_leaves = res?.available_leaves;
            // })
          }
          // this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}?leave_master__employee__id=${next}`).subscribe((res1: any) => {
          //   this.leaveTypeList.set(res1?.results);
          // })
          resolve(formValue)
        })
      })
    }
    else {
      return formValue
    }
  }
  // onChangeLeaveType(prev, next, formValue, formFields) {
  //   let emp_id = formValue.employee
  //   let travel_or_leave = formValue.travel_or_leave
  //   var nextValuee;
  //   // console.log("emp_id",emp_id)
  //   console.log("mnext",next)
  //   // console.log("avvvv",formValue)
  //   if (!emp_id){
  //     alert("please select employee code first")
  //   }

  //   if (next && emp_id) {
  //     return new Promise((resolve) => {
  //       this.apiService.get(`${HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD}${next}`)
  //       .subscribe((ress: any) => {
  //         console.log("resss.",ress);
  //         var nextValuee = ress.status_name; 
  //       })
  //       this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}`,{leave_master__employee__id:emp_id,leave_type:nextValuee}).subscribe((res: any) => {
  //         if (travel_or_leave == 'Leave'){
  //           if (res.results == ''){
  //                 formValue.available_leaves = 0;

  //           }
  //           else{

  //             formValue.available_leaves = res.results[0].available_leaves;
  //           }

  //         }
  //         else{
  //           formValue.available_leaves = 100;
  //         }
  //         resolve(formValue)
  //       })
  //     })
  //   } else {
  //     return formValue
  //   }
  // }

  updateSickLeaveCondition(formValue: LeaveEntryModel, formFields: any[]): Promise<LeaveEntryModel> {
    return new Promise((resolve) => {
      const availableLeaveField = formFields
        ?.find(f => f?.fieldUniqueKey === 'leave-details')?.fields
        ?.find(f => f?.fieldUniqueKey === 'entry-details-accordion')?.fields
        ?.find(f => f?.fieldUniqueKey === 'entry-info')?.fields
        ?.find(f => f?.name === LeaveEntryEnum.availableLeaves);

      const requestedDays = formValue.no_of_days || 0;
      const availableLeaves = formValue.available_leaves || 0;

      if (String(formValue.leave_type_status_code) !== '9') {
        if (availableLeaveField) availableLeaveField.hidden = false;
        formValue.remarks = '';
        return resolve(formValue);
      }

      // if (availableLeaveField) availableLeaveField.hidden = true;


      this.apiService.get(
        `${HrmServiceUrlConstants.LEAVE_POLICY_CRUD}?leave_policy__type_of_leave__code=7`
      ).subscribe((response: any) => {
        const priorityOrder = ["Full_pay", "75%_pay", "Half_pay", "35%_pay"];
        const leavePolicy = response.results
          .sort((a, b) => priorityOrder.indexOf(a.full_half_day) - priorityOrder.indexOf(b.full_half_day))
          .map(item => ({ ...item }));

        const totalPolicyDays = leavePolicy.reduce((sum, item) => sum + item.number_of_days, 0);
        let leaveUsed = totalPolicyDays - Number(availableLeaves);

        for (let policy of leavePolicy) {
          if (leaveUsed <= 0) break;
          const used = Math.min(policy.number_of_days, leaveUsed);
          policy.number_of_days -= used;
          leaveUsed -= used;
        }

        // this.apiService.get(
        //   `${ServiceUrlConstants.LEAVE_POLICY_DETAILS_CRUD}?leave_policy__type_of_leave__code=9`
        // ).subscribe((response: any) => {
        //   const priorityOrder = ["Full_pay", "75%_pay", "Half_pay", "35%_pay"];
        //   const leavePolicy = response.results
        //     .sort((a, b) => priorityOrder.indexOf(a.full_half_day) - priorityOrder.indexOf(b.full_half_day))
        //     .map(item => ({ ...item }));

        //   const totalPolicyDays = leavePolicy.reduce((sum, item) => sum + item.number_of_days, 0);
        //   let leaveUsed = totalPolicyDays - Number(availableLeaves);

        //   for (let policy of leavePolicy) {
        //     if (leaveUsed <= 0) break;
        //     const used = Math.min(policy.number_of_days, leaveUsed);
        //     policy.number_of_days -= used;
        //     leaveUsed -= used;
        //   }

        let remainingDays = requestedDays;
        const remarks: string[] = [];

        for (const policy of leavePolicy) {
          if (remainingDays <= 0) break;
          const used = Math.min(policy.number_of_days, remainingDays);
          if (used > 0) {
            const formattedName = policy.full_half_day.replace(/_/g, ' ');
            remarks.push(`• ${used} day${used > 1 ? 's' : ''} from ${formattedName}`);
            remainingDays -= used;
          }
        }

        if (availableLeaves === 0 || remainingDays > 0) {
          formValue.remarks = `You do not have enough available sick leave. You are short by ${remainingDays} day(s).`;
        } else {
          formValue.remarks = `Your sick leave will be deducted as follows:\n${remarks.join('\n')}`;
        }

        console.log("Updated remarks:", formValue.remarks);
        resolve(formValue);
      });
    });
  }

  // onChangeLeaveType(prev, next, formValue, formFields) {
  //   let emp_id = formValue.employee;
  //   let travel_or_leave = formValue.travel_or_leave;

  //   if (!emp_id) {
  //     this.sharedService.handleWarning("Please select employee code first");
  //     return formValue;
  //   }
  //   var statusName

  //   if (next && emp_id) {
  //     return new Promise((resolve) => {
  //       // First API call to get status name
  //       this.apiService.get(`${HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD}${next}/`)
  //         .pipe(
  //           switchMap(async (ress: any) => {
  //             statusName = ress?.status_name;
  //             formValue.leave_type_status_code=ress?.code
  //             // console.log("statusName", statusName)

  //             return  this.apiService.get(
  //               `${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=${statusName}&employee=${formValue.employee}`
  //             );
  //           })
  //         )
  //         .subscribe({
  //           next: async (res: any) => {
  //             console.log("res", res)
  //             formValue.available_leaves = res?.leave_data?.available_leaves || 0.00;
  //             if (res?.type_of_days) {
  //               const typeOfDaysField = formFields.find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields.find((ele) => ele?.fieldUniqueKey == 'entry-details-accordion')?.fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'type_of_days');
  //               typeOfDaysField.value = res?.type_of_days;
  //               formValue.type_of_days = res?.type_of_days;
  //             }
  //              await this.updateSickLeaveCondition(formValue, formFields);
  //             // formValue.leave_type = res?.leave_data?.attendence;
  //             resolve(formValue);
  //           },
  //           error: (err) => {
  //             console.error('API Error:', err);
  //             this.sharedService.handleError('Failed to fetch leave details');
  //             resolve(formValue);
  //           }
  //         });
  //     });
  //   }

  //   return formValue;
  // }
  async onChangeLeaveType(prev, next, formValue, formFields) {
    const emp_id = formValue.employee;

    if (!emp_id) {
      this.sharedService.handleWarning("Please select employee code first");
      return formValue;
    }

    if (next && emp_id) {
      try {
        const ress: any = await firstValueFrom(
          this.apiService.get(`${HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD}${next}/`)
        );

        const statusName = ress?.status_name;
        formValue.leave_type_status_code = ress?.code;

        const res: any = await firstValueFrom(
          this.apiService.get(
            `${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=${statusName}&employee=${formValue.employee}`
          )
        );

        formValue.available_leaves = res?.leave_data?.available_leaves || 0.00;

        // If dates and no_of_days are already set, recompute LOP after available_leaves is updated
        if (formValue.no_of_days > 0) {
          formValue = this._updateLopDays(formValue, Number(formValue.no_of_days), formFields);
        }

        if (res?.type_of_days) {
          const typeOfDaysField = formFields
            .find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields
            .find((ele) => ele?.fieldUniqueKey == 'entry-details-accordion')?.fields
            .find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields
            .find((ele) => ele?.name == 'type_of_days');
          if (typeOfDaysField) {
            typeOfDaysField.value = res?.type_of_days;
          }
          formValue.type_of_days = res?.type_of_days;
        }

        // ── Half day: filter condition dropdown based on leave policy flag ──
        const allowHalfDay = res?.allow_half_day ?? false;
        const conditionField = formFields
          .find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields
          .find((ele) => ele?.fieldUniqueKey == 'entry-details-accordion')?.fields
          .find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields
          .find((ele) => ele?.name == 'condition');

        if (conditionField) {
          if (allowHalfDay) {
            this.conditionList.set([
              { key: 'Full Day', value: 'Full Day' },
              { key: 'Half Day', value: 'Half Day' },
            ]);
          } else {
            this.conditionList.set([
              { key: 'Full Day', value: 'Full Day' },
            ]);
            // Reset to Full Day if Half Day was previously selected
            if (formValue.condition === 'Half Day') {
              formValue.condition = 'Full Day';
              conditionField.value = 'Full Day';
              conditionField.defaultObject = { key: 'Full Day', value: 'Full Day' };
            }
          }
        }

        await this.updateSickLeaveCondition(formValue, formFields);

        return formValue;

      } catch (error) {
        console.error('API Error:', error);
        this.sharedService.handleError('Failed to fetch leave details');
        return formValue;
      }
    }

    return formValue;
  }
  onChangeFromDate(prev, next, formValue, formFields) {
    if (next) {
      const from_date = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'from_date');
      if (from_date.value !== next && next !== '') {
        const fromDateParts = formValue.from_date.split('-');
        const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
        const toDateField = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'to_date');
        toDateField.minDateValue = new Date(fromDate);
        formValue.to_date = null

        return formValue;
      }
    }
    return formValue;
  }
  // onChangeToDate(prev, next, formValue, formFields) {
  //   // console.log("formFields", formFields)
  //   const to_date = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'to_date');
  //   // const comp_off_date = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.compOffDate))
  //   if (formValue.from_date && next !== '') {
  //     const fromDateParts = formValue.from_date.split('-');
  //     const toDateParts = formValue.to_date.split('-');
  //     const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
  //     const toDate = new Date(toDateParts[2], toDateParts[1] - 1, toDateParts[0]);
  //     const differenceInMs = toDate.getTime() - fromDate.getTime();
  //     console.log("differenceInMs", differenceInMs);
  //     const differenceInDays = differenceInMs / (1000 * 3600 * 24);
  //     console.log("differenceInDays", differenceInDays);

  //     // if (formValue.is_lop == false && formValue.is_comp_off == false) {
  //     if (formValue.leave_type == "" || formValue.leave_type == "undefined") {
  //       const conditionobj = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'condition');
  //       conditionobj.value = "";
  //       formValue.condition = "";
  //       conditionobj.defaultObject = null;
  //       this.sharedService.handleWarning("Choose leave type before you proceed with select condition");
  //       return formValue;
  //     }

  //     if (formValue.condition == "Full Day") {
  //       if (formValue.travel_or_leave != 'Travel' && Number(differenceInDays + 1) > Number(formValue.available_leaves)) {
  //         this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
  //         formValue.to_date = null;
  //         return formValue;
  //       } else {
  //         formValue.no_of_days = differenceInDays + 1;
  //       }
  //     } else if (formValue.condition == "Half Day") {
  //       if (differenceInDays == 0) {
  //         if (formValue.travel_or_leave != 'Travel' && Number(formValue.available_leaves) < 0.5) {
  //           this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
  //           formValue.to_date = null;
  //           return formValue;
  //         }
  //         formValue.no_of_days = 0.5;
  //       } else {
  //         if (formValue.travel_or_leave != 'Travel' && Number(formValue.available_leaves) < Number(differenceInDays + 0.5)) {
  //           this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
  //           formValue.to_date = null;
  //           return formValue;
  //         }
  //         formValue.no_of_days = differenceInDays + 0.5;
  //       }
  //     }
  //     // formValue.comp_off_date = null
  //     return formValue;
  //   }
  // }
  onChangeCompOffDate(prev, next, formValue, formFields) {
    // console.log("formFields", next, formValue)
    let from_date = []
    // const fromDateParts = formValue.from_date.split('-');
    // const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
    // const comp_off_date = formFields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'comp_off_date');
    // comp_off_date.minDateValue = new Date(fromDate);

  }

  onChangeTravelOrLeave(prev, next, formValue, formFields) {
    if (next) {
      const accordion = formFields.find((ele) => ele.fieldUniqueKey == "leave-details")
        .fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion")
        .fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')

      const leaveTypeField = formFields.find((ele) => ele.fieldUniqueKey == "leave-details")
        .fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion")
        .fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')
        ?.fields.find((ele => ele?.name == LeaveEntryEnum.leaveType));

      const availableLeavesField = formFields.find((ele) => ele.fieldUniqueKey == "leave-details")
        .fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion")
        .fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')
        ?.fields.find((ele => ele?.name == LeaveEntryEnum.availableLeaves));

      const typeOfDaysField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.typeOfDays));
      const holidayDaysField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.holidayDays));
      const weeklyOffDaysField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.weeklyOffDays));
      const allowBeyondField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.allowBeyondEligible));
      const isPaidBeyondField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.isPaidBeyond));
      const lopDaysField = accordion?.fields.find((ele => ele?.name == LeaveEntryEnum.lopDaysFromExtension));

      // Update the URL parameters based on selection
      if (next === 'Travel') {
        leaveTypeField.hidden = false;
        leaveTypeField.readonly = true;
        availableLeavesField.label = "Available Leaves";
        leaveTypeField.urlConfig.get.params.type = 'Attendance';
        leaveTypeField.label = 'Travel Status'
        leaveTypeField.placeholder = 'Select Travel Status'
        availableLeavesField.hidden = true;
        typeOfDaysField.hidden = true;
        holidayDaysField.hidden = true;
        weeklyOffDaysField.hidden = true;
        if (allowBeyondField) allowBeyondField.hidden = true;
        if (isPaidBeyondField) isPaidBeyondField.hidden = true;
        if (lopDaysField) lopDaysField.hidden = true;
        if (formValue.employee) {
          return new Promise((resolve) => {
            this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=duty&employee=${formValue.employee}`).subscribe((res: any) => {
              formValue.leave_type = res?.attendence;
              leaveTypeField.value = res?.attendence;
              leaveTypeField.options = signal([{
                status_name: res?.status_name,
                id: res?.attendence
              }]);
              formValue.type_of_days = 'Working_days';
              resolve(formValue);
            })
          })
        }

      } else if (next === 'Leave') {
        leaveTypeField.hidden = false;
        leaveTypeField.readonly = false;
        leaveTypeField.urlConfig.get.params.type = 'Leave';
        availableLeavesField.label = "Available Leaves";
        availableLeavesField.hidden = false;
        leaveTypeField.label = 'Leave Type';
        leaveTypeField.placeholder = 'Select Leave Type';
        leaveTypeField.value = null;
        formValue.leave_type = null;
        leaveTypeField.options = signal([]);
        typeOfDaysField.hidden = false;
        holidayDaysField.hidden = false;
        weeklyOffDaysField.hidden = false;
        if (allowBeyondField) allowBeyondField.hidden = false;
        // is_paid_beyond and lop_days remain driven by allow_beyond toggle state

      } else if (next === 'Work From Home') {
        leaveTypeField.hidden = true;
        leaveTypeField.readonly = false;
        availableLeavesField.hidden = false;
        availableLeavesField.label = "Available Work From Home";
        typeOfDaysField.hidden = true;
        holidayDaysField.hidden = true;
        weeklyOffDaysField.hidden = true;
        if (allowBeyondField) allowBeyondField.hidden = true;
        if (isPaidBeyondField) isPaidBeyondField.hidden = true;
        if (lopDaysField) lopDaysField.hidden = true;
        if (formValue.employee) {
          return new Promise((resolve) => {
            this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=Work From Home&employee=${formValue.employee}`).subscribe((res: any) => {
              formValue.available_leaves = res?.leave_data?.available_leaves;
              formValue.leave_type = res?.attendence;
              formValue.type_of_days = 'Working_days';
              resolve(formValue);
            })
          })
        }
      }


      // Reset the leave_type value
      // formValue.leave_type = "";

      // Refresh the dropdown options
      // this.apiService.get(HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD, {
      //   params: leaveTypeField.urlConfig.get.params
      // }).subscribe((response) => {
      //   leaveTypeField.options = this.updateAttendanceStatusDropdownOptions(response);
      // });
    }

    return formValue;
  }

  onChangeCondition(prev, next, formValue, formFields) {
    if (next) {
      if (formValue.to_date && formValue.from_date) {
        formValue = this.onChangeToDate(0, formValue.to_date, formValue, formFields);
        return formValue;
      }
    } else {
      return formValue;
    }
  }
  editMode(data, formFields) {
    // console.log("formFields", formFields)
    // const fields = formFields?.find((ele) => ele?.fieldUniqueKey == 'leave-details')?.fields.find(ele => ele?.type == 'accordion')
    const from_date = formFields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'from_date');
    const toDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'to_date');
    // const comp_off_date = formFields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele => ele?.name == LeaveEntryEnum.compOffDate))
    const fromDateParts = data.from_date;
    const toDateParts = data.from_date;
    const fromDate = new Date(fromDateParts[2], fromDateParts[1] - 1, fromDateParts[0]);
    // const CompoffToDates = new Date(toDateParts[2], toDateParts[1] - 1, Number(toDateParts[0]) + 1);
    if (from_date) {
      toDateField.minDateValue = new Date(fromDate);
    }
    if (toDateField) {
      // comp_off_date.minDateValue = new Date(CompoffToDates);
    }
    // console.log("fields.from_date", comp_off_date, fromDate, CompoffToDates)


  }

  getAvailableLeaves(formValue, statusName) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}get_available_leaves_from_leave_type/?status_name=${statusName}&employee=${formValue.employee}`).subscribe((res: any) => {
        resolve(res);
      })
    })
  }


  check_permission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }

  checkOnlyHoliday(punchInDate: Date): boolean {
    const isHoliday = this.holidayList().some(holiday => {
      // Manually parse the date in DD-MM-YYYY format
      const [day, month, year] = holiday.date.split('-').map(Number);
      const [toDay, toMonth, toYear] = holiday.to_date.split('-').map(Number);

      // Create Date objects correctly with (year, month-1, day)
      const holidayFrom = new Date(year, month - 1, day);
      const holidayTo = new Date(toYear, toMonth - 1, toDay);
      return punchInDate >= holidayFrom && punchInDate <= holidayTo;
    });

    return isHoliday;
  }

  checkIfWeeklyOff(punchInDate: Date, weeklyOff: any): boolean {
    try {
      console.log("weekly off", weeklyOff)
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
      "monday": 1,
      "tuesday": 2,
      "wednesday": 3,
      "thursday": 4,
      "friday": 5,
      "saturday": 6,
      "sunday": 0
    };
    return dayMap[dayName.toLowerCase()] ?? -1;
  }

  getHolidayMasters() {
    this.apiService.get(HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD, { approval_status: ApprovalOptions.APPROVED }).subscribe((res: any) => {
      if (res?.results) {
        this.holidayList.set(res?.results);
      }
    })
  }

  onChangeToDate(prev, next, formValue, formFields) {
    if (formValue.from_date && next !== '') {
      // if (formValue.leave_type == "" || formValue.leave_type == "undefined") {
      //   const conditionobj = formFields.find((ele) => ele.fieldUniqueKey == "leave-details").fields.find((ele) => ele.fieldUniqueKey == "entry-details-accordion").fields.find((ele) => ele?.fieldUniqueKey == 'entry-info')?.fields.find((ele) => ele?.name == 'condition');
      //   conditionobj.value = "";
      //   formValue.condition = "";
      //   conditionobj.defaultObject = null;
      //   this.sharedService.handleWarning("Choose leave type before you proceed with select condition");
      //   return formValue;

      // }
      const [fromDay, fromMonth, fromYear] = formValue.from_date.split('-').map(Number);
      const [toDay, toMonth, toYear] = formValue.to_date.split('-').map(Number);
      const fromDate = new Date(fromYear, fromMonth - 1, fromDay);
      const toDate = new Date(toYear, toMonth - 1, toDay);
      let currentDate = new Date(fromDate);
      let differenceInDays = 0;
      let holidayDays = 0;
      let weeklyOffDays = 0;
      while (currentDate <= toDate) {
        if (formValue.type_of_days == "Working_days") {
          if (this.checkIfWeeklyOff(currentDate, formValue?.weekly_off)) {
            weeklyOffDays = weeklyOffDays + 1;
          } else if (this.checkOnlyHoliday(currentDate)) {
            holidayDays = holidayDays + 1;
          }
        }
        differenceInDays = differenceInDays + 1;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log("currentDate", differenceInDays, weeklyOffDays, holidayDays)
      let noOfDays = Number(differenceInDays) - Number(weeklyOffDays) - Number(holidayDays)
      if (formValue.condition == "Full Day") {
        if (formValue.travel_or_leave != 'Travel' && !formValue[LeaveEntryEnum.allowBeyondEligible] && Number(noOfDays) > Number(formValue.available_leaves)) {
          this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
          formValue.to_date = null;
          return formValue;
        } else {
          formValue.no_of_days = Number(noOfDays);
          formValue.holiday_days = Number(holidayDays);
          formValue.weekly_off_days = Number(weeklyOffDays);
          formValue = this._updateLopDays(formValue, Number(noOfDays), formFields);
        }
      } else if (formValue.condition == "Half Day") {
        if (noOfDays == 0) {
          if (formValue.travel_or_leave != 'Travel' && !formValue[LeaveEntryEnum.allowBeyondEligible] && Number(formValue.available_leaves) < 0.5) {
            this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
            formValue.to_date = null;
            return formValue;
          }
          formValue.no_of_days = 0.5;
          formValue.holiday_days = Number(holidayDays);
          formValue.weekly_off_days = Number(weeklyOffDays);
          formValue = this._updateLopDays(formValue, 0.5, formFields);
        } else {
          if (formValue.travel_or_leave != 'Travel' && !formValue[LeaveEntryEnum.allowBeyondEligible] && Number(formValue.available_leaves) < Number(noOfDays - 0.5)) {
            this.sharedService.handleWarning("Applying No. of days should be less than available leaves")
            formValue.to_date = null;
            return formValue;
          }
          formValue.no_of_days = noOfDays - 0.5;
          formValue.holiday_days = Number(holidayDays);
          formValue.weekly_off_days = Number(weeklyOffDays);
          formValue = this._updateLopDays(formValue, noOfDays - 0.5, formFields);
        }
      }
      return formValue;
    }
  }

  /** Recompute lop_days_from_extension client-side whenever no_of_days changes. */
  private _updateLopDays(formValue: any, noOfDays: number, formFields: any): any {
    const allowBeyond = !!formValue[LeaveEntryEnum.allowBeyondEligible];
    const isPaidBeyond = !!formValue[LeaveEntryEnum.isPaidBeyond];

    const lopDaysField = formFields
      ?.find(f => f?.fieldUniqueKey === 'leave-details')?.fields
      ?.find(f => f?.fieldUniqueKey === 'entry-details-accordion')?.fields
      ?.find(f => f?.fieldUniqueKey === 'entry-info')?.fields
      ?.find(f => f?.name === LeaveEntryEnum.lopDaysFromExtension);

    if (allowBeyond && !isPaidBeyond) {
      const available = Number(formValue[LeaveEntryEnum.availableLeaves] ?? 0);
      const lop = Math.max(0, noOfDays - available);
      formValue[LeaveEntryEnum.lopDaysFromExtension] = lop;
      if (lopDaysField) {
        lopDaysField.value = lop;
        lopDaysField.hidden = false;
      }
    } else {
      formValue[LeaveEntryEnum.lopDaysFromExtension] = 0;
      if (lopDaysField) {
        lopDaysField.value = 0;
        lopDaysField.hidden = true;
      }
    }

    return formValue;
  }

}
