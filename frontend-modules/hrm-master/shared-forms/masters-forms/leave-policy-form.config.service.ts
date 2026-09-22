import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { LeavePolicyModel, LeavePolicyDetailModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-policy.model';
import { LeavePolicyEnum, LeavePolicyDetailEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-policy.enum';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { ToggleBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/toggle.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';


@Injectable({
  providedIn: 'root',
})
export class LeavePolicyFormConfig {
  private translate = inject(TranslateService);

  private readonly employeeReportingOptions = signal([
    { key: 'Direct', value: 'Direct' },
    { key: 'Indirect', value: 'Indirect' },
    { key: 'All', value: 'All' }
  ]);

  private readonly type_of_days = signal([
    { key: 'Working days', value: 'Working_days' },
    { key: 'Calendar days', value: 'Calendar_days' },
  ]);

  private readonly year_month_options = signal([
    { key: 'Month', value: 'Month' },
    { key: 'Year', value: 'Year' },
  ]);

  private readonly pay_on_options = signal([
    { key: 'Gross Pay', value: 'gross' },
    { key: 'Basic Pay', value: 'basic' },
  ]);

  private readonly fy_start_month_options = signal([
    { key: 'January   (Jan – Dec)', value: 1  },
    { key: 'February  (Feb – Jan)', value: 2  },
    { key: 'March     (Mar – Feb)', value: 3  },
    { key: 'April     (Apr – Mar)', value: 4  },
    { key: 'May       (May – Apr)', value: 5  },
    { key: 'June      (Jun – May)', value: 6  },
    { key: 'July      (Jul – Jun)', value: 7  },
    { key: 'August    (Aug – Jul)', value: 8  },
    { key: 'September (Sep – Aug)', value: 9  },
    { key: 'October   (Oct – Sep)', value: 10 },
    { key: 'November  (Nov – Oct)', value: 11 },
    { key: 'December  (Dec – Nov)', value: 12 },
  ]);

  public readonly LeavePolicyForm =
    () =>
      (dataFromComponent?: any, initialData?: LeavePolicyModel, isEditMode?: boolean, data?: LeavePolicyModel) => {
        initialData = new LeavePolicyModel();
        initialData.employee_type           = 'All';
        initialData.employee_group          = 'All';
        initialData.employee_reporting      = 'All';
        initialData.type_of_days            = 'Calendar days';
        initialData.lop_on_overstay         = true;
        initialData.fy_start_month          = 1;
        initialData.year_month              = 'Month';
        initialData.pay_on                  = 'gross';

        // In create mode auto-populate one default row; edit mode loads saved rows.
        // The string id triggers the serializer's "create new" branch (numeric/UUID = update existing).
        const defaultDetailRow: LeavePolicyDetailModel = {
          id: String(Math.floor(1000000000000 + Math.random() * 9000000000000)) + 'A',
          pay_percentage: 100,
          number_of_days: 0,
          leave_policy: null,
        };
        let leave_policy_details = isEditMode ? (data.leave_policy_details || []) : [defaultDetailRow];

        let defaultEmpTypeObject    = this.getGlobalDefaultObj(isEditMode, data?.employee_type    ?? initialData?.employee_type);
        let defaultEmpGroupObject   = this.getGlobalDefaultObj(isEditMode, data?.employee_group   ?? initialData?.employee_group);
        let defaultTypeOfLeaveObject = this.getLeaveDefaultObj(isEditMode, data ?? initialData);

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('leavePolicyInfo_TC'),
                fieldUniqueKey: 'leave-policy-info',
                fields: [

                  // ── Accordion 1: General Details ────────────────────────────
                  {
                    type: 'accordion',
                    multiple: true,
                    accordionStyle: { width: '76vw' },
                    fieldUniqueKey: 'one-accordion-info',
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('generalDetails_TC'),
                        fieldUniqueKey: 'first-accordion-info',
                        selected: true,
                        fields: [
                          new DropdownField(this.translate, LeavePolicyEnum.employee_type, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('name', 'id')
                            .getOptions(signal([]))
                            .isLazyFilterDropDown(true)
                            .setDefaultObject(defaultEmpTypeObject)
                            .getUrlConfig({
                              get: {
                                url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                params: { page_size: 30, is_active: true, global_key: 'employee_type' }
                              }
                            })
                            .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.employee_group, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('name', 'id')
                            .getOptions(signal([]))
                            .isLazyFilterDropDown(true)
                            .setDefaultObject(defaultEmpGroupObject)
                            .getUrlConfig({
                              get: {
                                url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                params: { page_size: 30, is_active: true, global_key: 'employee_group' }
                              }
                            })
                            .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.employee_reporting, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.employeeReportingOptions)
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.type_of_leave, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('status_name', 'id')
                            .getOptions(signal([]))
                            .isLazyFilterDropDown(true)
                            .setDefaultObject(defaultTypeOfLeaveObject)
                            .getUrlConfig({
                              get: {
                                url: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
                                params: { page_size: 30, is_active: true, type: 'Leave' }
                              }
                            })
                            .bindOption(this.updateAttendanceStatusDropdownOptions.bind(this))
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.type_of_days, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(signal(this.type_of_days()))
                            .validate(true)
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.pay_on, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.pay_on_options)
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.min_stretch_days, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(1)
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.max_stretch_days, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(1)
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.year_to_year_carry, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .onChange(this.onChangeToggle.bind(this))
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.carry_threshold_value, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(2)
                            .isFieldHidden(isEditMode ? (data?.year_to_year_carry ? false : true) : true)
                            .toObject(),
                        ]
                      },
                    ]
                  },

                  // ── Accordion 2: Policy Rules ───────────────────────────────
                  {
                    type: 'accordion',
                    multiple: true,
                    accordionStyle: { width: '76vw' },
                    fieldUniqueKey: 'two-accordion-info',
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('policyRules_TC'),
                        fieldUniqueKey: 'second-accordion-info',
                        selected: false,
                        fields: [
                          new DateField(this.translate, LeavePolicyEnum.effective_from, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new DateField(this.translate, LeavePolicyEnum.effective_to, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.eligible_after_days, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(0)
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.backdated_days_limit, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(0)
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.allow_advance_leave, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.allow_half_day, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.require_document, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .onChange(this.onChangeRequireDocument.bind(this))
                            .toObject(),

                          new NumberField(this.translate, LeavePolicyEnum.require_document_after_days, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(0)
                            .isFieldHidden(isEditMode ? (data?.require_document ? false : true) : true)
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.lop_on_overstay, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.lop_on_weekly_off_after_leave, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new ToggleBuilder(this.translate, LeavePolicyEnum.prorate_on_join, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.year_month, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.year_month_options)
                            .toObject(),

                          new DropdownField(this.translate, LeavePolicyEnum.fy_start_month, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.fy_start_month_options)
                            .toObject(),
                        ]
                      },
                    ]
                  },

                  // ── Accordion 3: Leave Policy Details (child table) ─────────
                  {
                    type: 'accordion',
                    multiple: true,
                    accordionStyle: { width: '76vw' },
                    fieldUniqueKey: 'accordion-info',
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('leavePolicyDetails_TC'),
                        selected: true,
                        fields: [
                          new TableBuilder(this.translate, LeavePolicyEnum.leave_policy_details, '', true)
                            .columnSchema([
                              { name: 'Pay %',          colWidth: '120px' },
                              { name: 'Number of Days', colWidth: '120px' },
                            ])
                            .formInitialise<LeavePolicyDetailModel>(new LeavePolicyDetailModel())
                            .formSchema([
                              {
                                name: LeavePolicyDetailEnum.pay_percentage,
                                type: 'number',
                                minFractionDigits: 0,
                                maxFractionDigits: 2,
                                validation: { required: true },
                              },
                              {
                                name: LeavePolicyDetailEnum.number_of_days,
                                type: 'number',
                                minFractionDigits: 0,
                                maxFractionDigits: 1,
                                validation: { required: true },
                              },
                            ])
                            .getDatasource<Array<LeavePolicyDetailModel>>('id', leave_policy_details)
                            .enableFooter(true)
                            .setAddButton(true)
                            .buttonStates(false, true)
                            .setTableWidth('72vw')
                            .build(),
                        ]
                      }
                    ]
                  }

                ],
              }
            ])
        ];
      };

  // ── Dropdown option transformers ──────────────────────────────────────────

  updateDynamicGlobalMasterDropdownOptions(response) {
    if (response?.results?.length) {
      const options = (<any>response)?.results[0]?.global_value;
      options.push({ name: 'All', id: 'All' });
      return options;
    } else {
      return [{ name: 'All', id: 'All' }];
    }
  }

  updateAttendanceStatusDropdownOptions(response) {
    if (response?.results?.length) {
      return response.results
        .filter(item => item.type === 'Leave')
        .map(item => ({
          id: item.id,
          status_name: item.status_name,
        }));
    } else {
      return [];
    }
  }

  // ── Default object helpers ────────────────────────────────────────────────

  getGlobalDefaultObj(isEditMode, data) {
    if (data) {
      return { id: data, name: data };
    } else {
      return {};
    }
  }

  getLeaveDefaultObj(isEditMode, data) {
    if (data) {
      return { id: data.leave_type, status_name: data.leave_typeee };
    } else {
      return {};
    }
  }

  // ── onChange handlers ─────────────────────────────────────────────────────

  /** Show/hide carry_threshold_value based on year_to_year_carry toggle */
  onChangeToggle(_prev: any, next: any, formValue: any, formFields: any): any {
    const getFieldByUniqueKey = (key: string, name?: string, fields = formFields): any => {
      for (const field of fields) {
        if (field?.fieldUniqueKey === key && !name) {
          return field;
        }
        if (field?.fieldUniqueKey === key && name && field.fields) {
          const found = field.fields.find((f: any) => f?.name === name);
          if (found) return found;
        }
        if (field?.fields?.length) {
          const result = getFieldByUniqueKey(key, name, field.fields);
          if (result) return result;
        }
      }
      return null;
    };

    const carryField = getFieldByUniqueKey('first-accordion-info', LeavePolicyEnum.carry_threshold_value, formFields);
    if (next) {
      if (carryField) carryField.hidden = false;
    } else {
      if (carryField) carryField.hidden = true;
      formValue[LeavePolicyEnum.carry_threshold_value] = 0;
    }
    return formValue;
  }

  /** Show/hide require_document_after_days based on require_document toggle */
  onChangeRequireDocument(_prev: any, next: any, formValue: any, formFields: any): any {
    const getFieldByUniqueKey = (key: string, name?: string, fields = formFields): any => {
      for (const field of fields) {
        if (field?.fieldUniqueKey === key && !name) {
          return field;
        }
        if (field?.fieldUniqueKey === key && name && field.fields) {
          const found = field.fields.find((f: any) => f?.name === name);
          if (found) return found;
        }
        if (field?.fields?.length) {
          const result = getFieldByUniqueKey(key, name, field.fields);
          if (result) return result;
        }
      }
      return null;
    };

    const docDaysField = getFieldByUniqueKey('second-accordion-info', LeavePolicyEnum.require_document_after_days, formFields);
    if (next) {
      if (docDaysField) docDaysField.hidden = false;
    } else {
      if (docDaysField) docDaysField.hidden = true;
      formValue[LeavePolicyEnum.require_document_after_days] = 0;
    }
    return formValue;
  }
}
