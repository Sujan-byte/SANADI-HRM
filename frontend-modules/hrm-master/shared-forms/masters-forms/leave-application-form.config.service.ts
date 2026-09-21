import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { LeaveApplicationModel } from 'src/app/core/shared/common/model/masters/leave-application.model';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { SharedService } from 'src/app/core/shared/services/shared.service';
import { LeaveApplicationEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-application.enum';
import { EmployeeEnum } from 'src/app/core/shared/common/enum/masters_enum/employee-enum';
import * as moment from 'moment';
import { NgxPermissionsService } from 'ngx-permissions';
import { EncryptedStorageService } from 'src/app/core/shared/services/secure-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class LeaveApplicationFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private sharedService = inject(SharedService);
  private permissionService = inject(NgxPermissionsService);
  private readonly secureStorage = inject(EncryptedStorageService);
  private readonly leavedProvidedBy = signal([
    {
      key: 'Company',
      value: 'Company'
    },
    {
      key: 'Self',
      value: 'Self'
    }
  ])
  public readonly LeaveApplicationForm =
    () =>
      (dataFromComponent?: any, initialData?: LeaveApplicationModel, isEditMode?: boolean, data?: LeaveApplicationModel) => {
        initialData = new LeaveApplicationModel();
        let default_employee_object = isEditMode ? data?.employee_default_object : {};

        // Set min dates for date fields if in edit mode
        let minNewLeaveStartDate = null;
        let minNewLeaveEndDate = null;

        // if (isEditMode && data) {
        //     if (data.date_of_joining) {
        //       minNewLeaveStartDate = new Date(data.date_of_joining);
        //     }

        //     if (data.new_leave_start_date) {
        //       minNewLeaveEndDate = new Date(data.new_leave_start_date);
        //     }

        //   }
        if (isEditMode && data) {

          if (data.date_of_joining) {
            const [dd, mm, yyyy] = String(data.date_of_joining).split('-');
            minNewLeaveStartDate = new Date(
              Number(yyyy),
              Number(mm) - 1,
              Number(dd)
            );
          }

          if (data.new_leave_start_date) {
            const [dd, mm, yyyy] = String(data.new_leave_start_date).split('-');
            minNewLeaveEndDate = new Date(
              Number(yyyy),
              Number(mm) - 1,
              Number(dd)
            );
          }
        }

        console.log('minNewLeaveStartDate =', minNewLeaveStartDate);
        console.log('minNewLeaveEndDate =', minNewLeaveEndDate);




        const isReversalInitiator = !(data?.approval_status == 'APPROVED' && this.check_permission("hrm_master.custom_enable_leave_reversal") || this.secureStorage.getItemSync('is_superuser') === 'true')
        isEditMode ? data?.location : initialData.location = this.secureStorage.getItemSync('branchName');
        isEditMode ? data?.leave_eligible_as_on : initialData.leave_eligible_as_on = moment(new Date()).format('DD-MM-YYYY');

        let default_delegated_reviewer_obj = isEditMode ? data.default_delegated_reviewer_object : {};

        const isReveiwer = this.permissionService.getPermission("hrm_master.custom_approval_stage_approver");

        let isDelegatedReveiwerHidden = true
        if (isReveiwer && isEditMode) {
          isDelegatedReveiwerHidden = false
        }
        else {
          isDelegatedReveiwerHidden = true
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('employeeDetails_TC'),
                fieldUniqueKey: 'employee_details_tab',
                fields: [
                  new DropdownField(this.translate, "employee_code", isEditMode, data, initialData, true, undefined, "employee_code_TC")
                    .addFieldWidth('24%')
                    // .addKeyValueLabel("employee_code", 'id',)
                    .addKeyValueLabelList(['employee_code', 'first_name'], 'id')
                    .validate(true)
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .setDefaultObject(data?.employee_default_object || {})
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                        params: { page_size: 30, is_active: true },
                        filterKeys: [`employee_code__${FilterOptions.istartsWith}&first_name__${FilterOptions.iContains}`]
                      }
                    })
                    // .isReadOnly(isEditMode)
                    // FIX: Allow editing if PENDING_APPROVAL or if not approved yet
                    .isReadOnly(isEditMode &&
                      data?.approval_status !== 'PENDING_APPROVAL' &&
                      data?.approval_status !== 'DRAFT' &&
                      data?.approval_status !== 'SAVED'
                    )
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, "employee_name", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "department", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DateField(this.translate, "date_of_joining", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new InputField(this.translate, "home_country_mobile_no", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "local_mobile_no", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  // new InputField(this.translate, "eligible_for_company_ticket", isEditMode, data, initialData)
                  //   .addFieldWidth('24%')
                  //   .isReadOnly(true)
                  //   .toObject(),
                  // new InputField(this.translate, "ticket_period_for", isEditMode, data, initialData)
                  //   .addFieldWidth('24%')
                  //   .isReadOnly(true)
                  //   .toObject(),
                  // // new NumberField(this.translate, "days", isEditMode, data, initialData)
                  // //   .addFieldWidth('24%')
                  // //   .toObject(),
                  // new InputField(this.translate, "travel_sector", isEditMode, data, initialData)
                  //   .addFieldWidth('24%')
                  //   .isReadOnly(true)
                  //   .toObject(),
                  new DateField(this.translate, "leave_eligible_as_on", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new NumberField(this.translate, "leave_days_eligible", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setMaxFractionDigits(2)
                    .setMinFractionDigits(0)
                    .toObject(),
                  new InputField(this.translate, "location", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DropdownField(this.translate, 'ticket_provided_by', isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('key', 'value')
                    .validate(true)
                    .onChangeOnly(this.onChangeTicketProvidedBy.bind(this))
                    .getOptions(this.leavedProvidedBy)
                    .toObject(),
                  new ToggleBuilder(this.translate, 'is_passport_received', isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new ToggleBuilder(this.translate, 'is_reversal', isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isFieldHidden(isReversalInitiator)
                    .toObject(),
                ]
              },
              {
                tabHeader: this.translate.instant('lastLeaveAvailedDetails_TC'),
                fieldUniqueKey: 'last_leave_availed_tab',
                fields: [
                  new DateField(this.translate, "last_leave_start_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new DateField(this.translate, "last_leave_end_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new NumberField(this.translate, "total_leave_days", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DateField(this.translate, "return_to_work_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new DateField(this.translate, "resumed_work_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isDisabled(true)
                    .toObject(),
                  new NumberField(this.translate, "lop_days", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "ticket_period", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "last_ticket_provided_by", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                ]
              },
              {
                tabHeader: this.translate.instant('newLeaveApplicationDetails_TC'),
                fieldUniqueKey: 'new_leave_application_tab',
                fields: [
                  new DateField(this.translate, "new_leave_start_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
                    .setMinDateValue(minNewLeaveStartDate)
                    .onChange(this.onChangeNewLeaveStartDate.bind(this))
                    .isReadOnly(isEditMode && data?.approval_status === 'APPROVED')
                    .toObject(),
                  new DateField(this.translate, "new_leave_end_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
                    .setMinDateValue(minNewLeaveEndDate)
                    .onChange(this.onChangeNewLeaveEndDate.bind(this))
                    .isReadOnly(isEditMode && data?.approval_status === 'APPROVED')
                    .toObject(),
                  new NumberField(this.translate, "leave_days_applied", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .validate(true)
                    .isReadOnly(true)
                    .toObject(),
                  new ToggleBuilder(this.translate, LeaveApplicationEnum.allowBeyondEligible, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                                                    .isReadOnly(data?.approval_status === 'APPROVED')

                    .onChange(this.onChangeAllowBeyondEligible.bind(this))
                    .toObject(),
                  new NumberField(this.translate, LeaveApplicationEnum.lopDaysFromExtension, isEditMode, data, initialData, this.translate.instant('lop_days_from_extension_leave_application_TC'))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setMaxFractionDigits(2)
                    .setMinFractionDigits(0)
                    .isFieldHidden(!(data?.lop_days_from_extension > 0))
                    .toObject(),
                  new DateField(this.translate, "ticket_to_be_issued_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "return_ticket_to_be_issued_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new InputField(this.translate, "emergency_contact_no", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "note", isEditMode, data, initialData)
                    .addFieldWidth('48%')
                    .toObject(),
                ]
              },
              {
                tabHeader: this.translate.instant('approvalDetails_TC'),
                fieldUniqueKey: 'approval_details_tab',
                fields: [
                  // new ToggleBuilder(this.translate, "leave_approved", isEditMode, data, initialData)
                  //   .addFieldWidth('24%')
                  //   .toObject(),
                  new ToggleBuilder(this.translate, "duties_to_be_covered_by_reliver", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "leave_approved_start_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onChangeApproveLeaveStartDate.bind(this))
                    .isReadOnly(isEditMode && data?.approval_status === 'APPROVED')
                    .toObject(),
                  new DateField(this.translate, "leave_approved_end_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onChangeApproveLeaveEndDate.bind(this))
                    .isReadOnly(isEditMode && data?.approval_status === 'APPROVED')
                    .toObject(),
                  new NumberField(this.translate, "leave_approved_days", isEditMode, data, initialData)
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
                  new TextBuilder(this.translate, "note_for_apporval", isEditMode, data, initialData)
                    .addFieldWidth('48%')
                    .toObject(),
                ]
              },
              {
                tabHeader: this.translate.instant('hrAdminCompletionDetails_TC'),
                fieldUniqueKey: 'hr_admin_completion_tab',
                fields: [
                  new DateField(this.translate, "passport_expiry_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "remarks_passport_expiry", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "visa_expiry_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "remarks_visa_expiry", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "eid_expiry_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "remarks_eid_expiry", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "labour_card_expiry_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "remarks_labour_card_expiry", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new DateField(this.translate, "job_loss_insurance_expiry_date", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .toObject(),
                  new TextBuilder(this.translate, "note_by_hr_admin", isEditMode, data, initialData)
                    .addFieldWidth('48%')
                    .toObject(),



                ]
              },
              {
                tabHeader: this.translate.instant('returnToWorkDetails_TC'),
                fieldUniqueKey: 'return_to_work_tab',
                fields: [
                  new DateField(this.translate, "resume_duty_on", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onChangeResumeDutyOn.bind(this))
                    .toObject(),
                  new DateField(this.translate, "was_on_leave_from", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onChangeWasOnLeaveFrom.bind(this))
                    .toObject(),
                  new DateField(this.translate, "was_on_leave_till", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .onChange(this.onChangeWasOnLeaveTill.bind(this))
                    .toObject(),
                  new NumberField(this.translate, "no_of_days", isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, "late_early_days_by", isEditMode, data, initialData, undefined, 'Auto Generated')
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new TextBuilder(this.translate, "return_note", isEditMode, data, initialData)
                    .addFieldWidth('48%')
                    .toObject(),
                ]
              }
            ])
        ];
      };

  updateDynamicDropdownOptions(response) {
    // const user = localStorage.getItem('is_superuser');

    // if (user === 'true') {
    if (response?.results?.length) {
      return response.results;
    }
    // } else {
    //   const default_employee_object = {
    //     id: Number(localStorage.getItem('employeeId')),
    //     employee_code: localStorage.getItem('employeeCode'),
    //     employee_name: localStorage.getItem('employeeName'),
    //     department: localStorage.getItem('employeeDepartment')
    //   };
    //   return [default_employee_object];
    // }

    // return [];
  }

  onChangeEmployee(prev, next, formValue, formFields) {
    if (next) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}/employees_for_leave`).subscribe((res: any) => {
          formValue.employee_name = res?.employee_name;
          formValue.date_of_joining = res?.doj;
          formValue.home_country_mobile_no = res?.home_mobile_number;
          //formValue.local_mobile_no = res?.local_mobile_number;
          formValue.local_mobile_no = res?.local_mobile_no;
          formValue[LeaveApplicationEnum.passportExpiryDate] = res?.[EmployeeEnum.passportExpiryDate]
          formValue[LeaveApplicationEnum.visaExpiryDate] = res?.[EmployeeEnum.visaExpiryDate]
          formValue[LeaveApplicationEnum.eidExpiryDate] = res?.[EmployeeEnum.emiratesIdExpiryDate]
          formValue[LeaveApplicationEnum.labourCardExpiryDate] = res?.[EmployeeEnum.labourCardExpiryDate]
          formValue[LeaveApplicationEnum.jobLossInsuranceExpiryDate] = res?.[EmployeeEnum.jobLossInsuranceExpiryDate]
          formValue.department = res?.department_code;
          formValue.department_id = res?.department;
          const deptField = formFields.find(field => field.key === 'department');
          if (deptField) {
            deptField.setDefaultObject({
              department_name: res.department_name,
              department_code: res.department_code,
              id: res.department
            });
          }
          formValue[LeaveApplicationEnum.ticketPeriodFor] = res?.next_ticket_eligible_period;
          formValue[LeaveApplicationEnum.eligibleForCompanyTicket] = res?.ticket_eligible_month;
          formValue[LeaveApplicationEnum.travelSector] = res?.ticket_sector;
          formValue[LeaveApplicationEnum.leaveDaysEligible] = res?.leave_days_eligible;

          formValue[LeaveApplicationEnum.lastLeaveStartDate] = res?.leave_approved_start_date;
          formValue[LeaveApplicationEnum.lopDays] = res?.lop;
          formValue[LeaveApplicationEnum.lastLeaveEndDate] = res?.leave_approved_end_date;
          formValue[LeaveApplicationEnum.totalLeaveDays] = res?.leave_approved_days;
          formValue[LeaveApplicationEnum.returnToWorkDate] = res?.was_on_leave_till;
          formValue[LeaveApplicationEnum.resumedWorkDate] = res?.resume_duty_on;
          formValue[LeaveApplicationEnum.ticketPeriod] = res?.ticket_period;
          formValue[LeaveApplicationEnum.lastTicketProvidedBy] = res?.ticket_provided_by;

          resolve(formValue);
        });
      });
    }
    return formValue;
  }




  //   onChangeEmployee(prev, next, formValue, formFields) {
  //     if (next) {
  //       return new Promise((resolve) => {
  //         this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((res: any) => {
  //           // Populate employee details from API response
  //           console.log("res",res);
  //           formValue.employee_name = `${res?.first_name || ''} ${res?.last_name || ''}`;
  //           formValue.department = res?.department || '';
  //           formValue.date_of_joining = res?.doj;
  //           formValue.home_country_mobile_no = res?.home_mobile_number;
  //           formValue.local_mobile_no = res?.local_mobile_number;          
  //           formValue.eligible_for_company_ticket = res?.eligible_for_company_ticket;
  //           formValue.ticket_period_for = res?.ticket_period_for;
  //           formValue.travel_sector = res?.travel_sector;
  //           formValue.leave_eligible_as_on = res?.leave_eligible_as_on;
  //           formValue.leave_days_eligible = res?.leave_days_eligible;
  //           formValue.location = res?.location;

  //           // Set min date for new leave start date based on date of joining
  //           if (res?.date_of_joining) {
  //             const date = res?.date_of_joining.split('-');
  //             const dojDate = new Date(date[2], date[1] - 1, date[0]);
  //             const newLeaveStartDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'new_leave_application_tab')?.fields.find((ele) => ele?.name == 'new_leave_start_date');
  //             if (newLeaveStartDateField) {
  //               newLeaveStartDateField.minDateValue = new Date(dojDate);
  //             }
  //           }

  //           resolve(formValue);
  //         });
  //       });
  //     } else {
  //       return formValue;
  //     }
  //   }

  onChangeNewLeaveStartDate(prev, next, formValue, formFields, form) {
    console.log('START DATE CHANGED:', next);

    if (next && next !== prev) {
      const startDateParts = formValue.new_leave_start_date.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);

      // Update min date for end date field
      const endDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'new_leave_application_tab')?.fields.find((ele) => ele?.name == 'new_leave_end_date');
      if (endDateField) {
        endDateField.minDateValue = new Date(startDate);
      }

      // Reset end date and leave days when start date changes
      // formValue.new_leave_end_date = null;
      // formValue.leave_days_applied = 0;
      formValue.leave_approved_start_date = next;
      form.get('leave_approved_start_date')?.setValue(next);
      formValue = this.onChangeApproveLeaveStartDate(0, formValue.leave_approved_start_date, formValue, formFields, form);

      // return formValue;
    }
    // return formValue;
  }

  onChangeAllowBeyondEligible(prev, next, formValue, formFields, form) {
    // Find the LOP days field and toggle its visibility
    const lopField = formFields
      ?.find(t => t?.fieldUniqueKey === 'new_leave_application_tab')?.fields
      ?.find(f => f?.name === LeaveApplicationEnum.lopDaysFromExtension);

    if (next) {
      // Toggle turned ON — show LOP field and recompute if dates are already set
      if (lopField) lopField.hidden = false;
      if (formValue.leave_days_applied) {
        // Use available_leaves (actual balance) not leave_days_eligible (total entitlement)
        const balance = formValue.available_leaves ?? formValue.leave_days_eligible ?? 0;
        const lopDays = Math.max(0, (formValue.leave_days_applied || 0) - balance);
        formValue.lop_days_from_extension = lopDays;
        form?.get('lop_days_from_extension')?.setValue(lopDays);
      }
    } else {
      // Toggle turned OFF — hide LOP field and clear
      if (lopField) lopField.hidden = true;
      formValue.lop_days_from_extension = 0;
      form?.get('lop_days_from_extension')?.setValue(0);
    }
    return formValue;
  }

  onChangeExtendToDate(prev, next, formValue, formFields, form) {
    // Called when user selects a new date in the "Extend To" field (approval tab).
    // Previews LOP days but does NOT change leave_approved_end_date in the form —
    // the backend update() handles the actual extension when the record is saved.
    if (!next) return formValue;

    // Use new_leave_end_date (same value as leave_approved_end_date on approved records)
    const currentEnd = formValue.new_leave_end_date || formValue.leave_approved_end_date;
    if (!currentEnd) return formValue;

    try {
      const [curDay, curMonth, curYear] = currentEnd.split('-').map(Number);
      const [extDay, extMonth, extYear] = next.split('-').map(Number);
      const currentEndDate = new Date(curYear, curMonth - 1, curDay);
      const extendDate = new Date(extYear, extMonth - 1, extDay);

      if (extendDate <= currentEndDate) {
        this.sharedService.handleWarning('Extension date must be after the current leave end date.');
        formValue.extend_to_date = null;
        form?.get('extend_to_date')?.setValue(null);
        return formValue;
      }

      const extendedDays = Math.round((extendDate.getTime() - currentEndDate.getTime()) / (1000 * 3600 * 24));
      // Use available_leaves (actual remaining balance) not leave_days_eligible (total entitlement)
      const available = formValue.available_leaves ?? formValue.leave_days_eligible ?? 0;
      const currentDays = formValue.leave_approved_days ?? 0;
      const newTotalDays = currentDays + extendedDays;
      const lopPreview = Math.max(0, newTotalDays - available);

      // Update LOP preview field
      formValue.lop_days_from_extension = lopPreview;
      form?.get('lop_days_from_extension')?.setValue(lopPreview);

      // Show LOP field if there are excess days
      const lopField = formFields
        ?.find(t => t?.fieldUniqueKey === 'new_leave_application_tab')?.fields
        ?.find(f => f?.name === LeaveApplicationEnum.lopDaysFromExtension);
      if (lopField) lopField.hidden = lopPreview <= 0;

      console.log(`[LeaveExtension] Extend by ${extendedDays} day(s), LOP preview: ${lopPreview}`);
    } catch (e) {
      console.error('[LeaveExtension] onChangeExtendToDate error:', e);
    }

    return formValue;
  }

  onChangeNewLeaveEndDate(prev, next, formValue, formFields, form) {
    console.log('END DATE CHANGED:', next);

    if (formValue.new_leave_start_date && next && next !== prev) {
      // Calculate leave days
      const startDateParts = formValue.new_leave_start_date.split('-');
      const endDateParts = formValue.new_leave_end_date.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);
      const endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 3600 * 24);

      // Update leave days applied
      formValue.leave_days_applied = differenceInDays + 1;
      form.get('leave_days_applied')?.setValue(formValue.leave_days_applied);

      // Check if leave days exceed available balance (not entitlement — use available_leaves)
      const availableBalance = formValue.available_leaves ?? formValue.leave_days_eligible ?? 0;
      if (formValue.leave_days_applied > availableBalance) {
        if (formValue.allow_beyond_eligible) {
          // Beyond eligible is allowed — compute LOP days and show the field
          const lopDays = Math.max(0, formValue.leave_days_applied - availableBalance);
          formValue.lop_days_from_extension = lopDays;
          form.get('lop_days_from_extension')?.setValue(lopDays);
          // Show the LOP days field
          const lopField = formFields
            ?.find(t => t?.fieldUniqueKey === 'new_leave_application_tab')?.fields
            ?.find(f => f?.name === LeaveApplicationEnum.lopDaysFromExtension);
          if (lopField) lopField.hidden = false;
        } else {
          this.sharedService.handleWarning("Applied leave days exceed eligible leave days");
          formValue.new_leave_end_date = null;
          formValue.leave_days_applied = 0;
          form.get('new_leave_end_date')?.setValue(null);
          form.get('leave_days_applied')?.setValue(0);
        }
      } else {
        // Days are within eligible — clear any previously computed LOP
        formValue.lop_days_from_extension = 0;
        form.get('lop_days_from_extension')?.setValue(0);
        const lopField = formFields
          ?.find(t => t?.fieldUniqueKey === 'new_leave_application_tab')?.fields
          ?.find(f => f?.name === LeaveApplicationEnum.lopDaysFromExtension);
        if (lopField && !formValue.allow_beyond_eligible) lopField.hidden = true;
      }

      formValue.leave_approved_end_date = next;
      form.get('leave_approved_end_date')?.setValue(next);
      formValue = this.onChangeApproveLeaveEndDate(0, formValue.leave_approved_end_date, formValue, formFields, form);

      // return formValue;
    }
    // return formValue;
  }

  onChangeApproveLeaveStartDate(prev, next, formValue, formFields, form) {
    if (next && next !== prev) {
      const startDateParts = formValue.leave_approved_start_date.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);

      // Update min date for end date field
      const endDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'approval_details_tab')?.fields.find((ele) => ele?.name == 'leave_approved_start_date');
      if (endDateField) {
        endDateField.minDateValue = new Date(startDate);
      }

      // Reset end date and leave days when start date changes
      formValue.leave_approved_end_date = null;
      formValue.leave_approved_days = 0;
      formValue.was_on_leave_from = next;
      form.get('leave_approved_end_date')?.setValue(null);
      form.get('leave_approved_days')?.setValue(0);
      form.get('was_on_leave_from')?.setValue(next);
      formValue = this.onChangeWasOnLeaveFrom(0, formValue.was_on_leave_from, formValue, formFields, form);
      // return formValue;
    }
    // return formValue;
  }




  onChangeApproveLeaveEndDate(prev, next, formValue, formFields, form) {
    if (formValue.leave_approved_start_date && next && next !== prev) {
      // Calculate leave days
      const startDateParts = formValue.leave_approved_start_date.split('-');
      const endDateParts = formValue.leave_approved_end_date.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);
      const endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 3600 * 24);

      // Update leave days applied
      formValue.leave_approved_days = differenceInDays + 1;
      form.get('leave_approved_days')?.setValue(formValue.leave_approved_days);

      // Check against available balance (not entitlement)
      const availableBalance = formValue.available_leaves ?? formValue.leave_days_eligible ?? 0;
      if (formValue.leave_approved_days > availableBalance) {
        if (formValue.allow_beyond_eligible) {
          // Beyond eligible is allowed — recompute LOP from available balance
          const lopDays = Math.max(0, formValue.leave_approved_days - availableBalance);
          formValue.lop_days_from_extension = lopDays;
          form.get('lop_days_from_extension')?.setValue(lopDays);
        } else {
          this.sharedService.handleWarning("Applied leave days exceed eligible leave days");
          formValue.leave_approved_end_date = null;
          formValue.leave_approved_days = 0;
          form.get('leave_approved_end_date')?.setValue(null);
          form.get('leave_approved_days')?.setValue(0);
        }
      }

      formValue.was_on_leave_till = next;
      form.get('was_on_leave_till')?.setValue(next);
      formValue = this.onChangeWasOnLeaveTill(0, formValue.was_on_leave_till, formValue, formFields, form);

      // return formValue;
    }
    // return formValue;
  }

  onChangeResumeDutyOn(prev, next, formValue, formFields, form) {
    if (formValue.resume_duty_on && formValue.was_on_leave_till) {
      const startDateParts = formValue.resume_duty_on.split('-');
      const endDateParts = formValue.was_on_leave_till.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);
      const endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 3600 * 24);
      formValue.late_early_days_by = differenceInDays + 1;
      form.get('late_early_days_by')?.setValue(formValue.late_early_days_by);

      // return formValue;
    }
    // return formValue;
  }

  onChangeWasOnLeaveFrom(prev, next, formValue, formFields, form) {
    if (next && next !== prev) {
      const startDateParts = formValue.was_on_leave_from.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);

      // Update min date for end date field
      const endDateField = formFields.find((ele) => ele?.fieldUniqueKey == 'return_to_work_tab')?.fields.find((ele) => ele?.name == 'was_on_leave_from');
      if (endDateField) {
        endDateField.minDateValue = new Date(startDate);
      }

      // Reset end date and leave days when start date changes
      formValue.was_on_leave_till = null;
      formValue.no_of_days = 0;
      form.get('was_on_leave_till')?.setValue(null);
      form.get('no_of_days')?.setValue(0);
      // return formValue;
    }
  }

  onChangeWasOnLeaveTill(prev, next, formValue, formFields, form) {
    if (formValue.was_on_leave_from && next && next !== prev) {
      // Calculate leave days
      const startDateParts = formValue.was_on_leave_from.split('-');
      const endDateParts = formValue.was_on_leave_till.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);
      const endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 3600 * 24);

      // Update leave days applied
      formValue.no_of_days = differenceInDays + 1;
      form.get('no_of_days')?.setValue(formValue.no_of_days);
    }
    if (formValue.resume_duty_on && formValue.was_on_leave_till) {
      const startDateParts = formValue.resume_duty_on.split('-');
      const endDateParts = formValue.was_on_leave_till.split('-');
      const startDate = new Date(startDateParts[2], startDateParts[1] - 1, startDateParts[0]);
      const endDate = new Date(endDateParts[2], endDateParts[1] - 1, endDateParts[0]);

      const differenceInMs = endDate.getTime() - startDate.getTime();
      const differenceInDays = differenceInMs / (1000 * 3600 * 24);
      formValue.late_early_days_by = differenceInDays + 1;
      form.get('late_early_days_by')?.setValue(formValue.late_early_days_by);
    }
    // return formValue;
  }

  onChangeTicketProvidedBy(prev, next, formValue, formFields) {
    if (next == "Self") {
      formValue[LeaveApplicationEnum.travelSector] = "";
      formValue[LeaveApplicationEnum.eligibleForCompanyTicket] = "";
      formValue[LeaveApplicationEnum.ticketPeriodFor] = "";
    } else if (next == "Company" && formValue.employee_code) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${formValue.employee_code}/employees_for_leave`).subscribe((res: any) => {
          formValue[LeaveApplicationEnum.travelSector] = res?.ticket_sector;
          formValue[LeaveApplicationEnum.eligibleForCompanyTicket] = res?.ticket_eligible_month;
          formValue[LeaveApplicationEnum.ticketPeriodFor] = res?.next_ticket_eligible_period;
          resolve(formValue);
        })
      })
    }

    return formValue;
  }
  check_permission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }

}
