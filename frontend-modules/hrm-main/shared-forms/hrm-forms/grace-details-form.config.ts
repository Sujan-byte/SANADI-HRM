import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { GraceDetailsModel } from 'src/app/core/shared/common/model/hrm/grace-details.model';
import { GraceDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/grace-details.enum';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';



@Injectable({
  providedIn: 'root',
})
export class GraceDetailsFormConfig {
  private translate = inject(TranslateService);
  private readonly graceDetailType = signal([
    {
      key: 'Normal',
      value: 'Normal'
    },
    {
      key: 'Special',
      value: 'Special'
    }
  ])

  private readonly reporting = signal([
    {
      key: 'Direct',
      value: 'Direct'
    },
    {
      key: 'Indirect',
      value: 'Indirect'
    },
    {
      key: 'All',
      value: 'All'
    }
  ])
  public readonly GraceDetailsForm =
    () =>
      (dataFromComponent?: any, initialData?: GraceDetailsModel, isEditMode?: boolean, data?: GraceDetailsModel) => {
        initialData = new GraceDetailsModel();
        initialData.emp_type = 'All';
        initialData.emp_group = 'All';
        initialData.emp_reporting = 'All';
        let isFromDateHidden = isEditMode?data?.type=='Normal'?true:false:true;
        let isToDateHidden = isEditMode?data?.type=='Normal'?true:false:true;
        let default_emp_type_object = this.getGlobalDefaultObj(isEditMode, data?.emp_type??initialData?.emp_type);
        let default_emp_group_object = this.getGlobalDefaultObj(isEditMode, data?.emp_group??initialData?.emp_group);
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('info_TC'),
                fieldUniqueKey: 'grace-info',
                fields: [
                  {
                    type: 'accordion',
                    multiple: true,
                    accordionStyle: { 'width': '76vw' },
                    fieldUniqueKey: 'accordian-info',
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('generalDetails_TC'),
                        fieldUniqueKey: 'first-accordian-info',
                        selected: true,
                        fields: [
                          new DropdownField(this.translate, GraceDetailsEnum.type, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.graceDetailType)
                            .onChangeOnly(this.onChangeType.bind(this))
                            .toObject(),
                          new DateField(this.translate, GraceDetailsEnum.fromDate, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isFieldHidden(isFromDateHidden)
                            .toObject(),
                          new DateField(this.translate, GraceDetailsEnum.toDate, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isFieldHidden(isToDateHidden)
                            .toObject(),
                          new DropdownField(this.translate, GraceDetailsEnum.empType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('name', 'id')
                            .getOptions(signal([]))
                            .isLazyFilterDropDown(true)
                            .setDefaultObject(default_emp_type_object)
                            .getUrlConfig({
                              get: {
                                url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                params: {
                                  page_size: 30, is_active: true, global_key: 'employee_type'
                                },
                              }
                            })
                            .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                            .toObject(),
                          new DropdownField(this.translate, GraceDetailsEnum.empGroup, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('name', 'id')
                            .getOptions(signal([]))
                            .isLazyFilterDropDown(true)
                            .setDefaultObject(default_emp_group_object)
                            .getUrlConfig({
                              get: {
                                url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                params: {
                                  page_size: 30, is_active: true, global_key: 'employee_group'
                                },
                              }
                            })
                            .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                            .toObject(),
                          new DropdownField(this.translate, GraceDetailsEnum.empReporting, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('24%')
                            .addKeyValueLabel('key', 'value')
                            .getOptions(this.reporting)
                            .toObject(),
                          new DropdownField(this.translate, GraceDetailsEnum.shift, isEditMode, data, initialData, true)
                            .addFieldWidth('24%')
                            .addKeyValueLabelList(['shift_name', 'duration'], 'id')
                                        // .validate(true)
                                        .isLazyFilterDropDown(true)
                                        .setRequiredFields('id,shift_name,duration')
                            .getOptions(signal([]))
                            .setDefaultObject(isEditMode && data?.shift ? { id: data.shift, shift_name: data.shift_name } : {})
                            .getUrlConfig({
                              get: {
                                url: ServiceUrlConstants.SHIFT_MASTER_DURATION,
                                params: { page_size: 30 },
                                filterKeys: ['shift_name__icontains'],
                              }
                            })
                            .bindOption(this.updateShiftDropdownOptions.bind(this))
                            .toObject(),
                          new InputField(this.translate, GraceDetailsEnum.description, isEditMode, data, initialData)
                            .addFieldWidth('49%')
                            .toObject(),

                        ]
                      },
                    ]
                  },
                  {
                    type: 'accordion',
                    multiple: true,
                    accordionStyle: { 'width': '76vw' },
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('workScheduleDetails_TC'),
                        selected: true,
                        fields: [
                          new NumberField(this.translate, GraceDetailsEnum.minWorkMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .setMinFractionDigits(0)
                            .setMaxFractionDigits(0)
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.maxWorkMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.breakTime, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.maxDayOtMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.maxNightOtMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.weeklyOffWorkMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.woBreakTime, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.woMaxDayOtMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.woMaxNightOtMins, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new NumberField(this.translate, GraceDetailsEnum.totalWorkHours, isEditMode, data, initialData)
                            .addFieldWidth('19%')
                            .toObject(),
                          new ToggleBuilder(this.translate, GraceDetailsEnum.lopOnAbsent, isEditMode, data, initialData)
                            .addFieldWidth('49%')
                            .toObject(),

                        ]
                      },
                    ]
                  },



                ],
              }
            ])
        ];
      };

  updateShiftDropdownOptions(response: any) {
    if (response?.results?.length) {
      return response.results;
    }
    return [];
  }

  updateDynamicGlobalMasterDropdownOptions(response) {
    console.log("response", response)
    if (response?.results?.length) {
      let options = (<any>response)?.results[0]?.global_value;
      options.push({'name':'All','id':'All'})

      return options;
    }
    else{
      return [{'name':'All','id':'All'}]
    }
  }

  onChangeType(prev: any, next: any, formValue: any, formFields: any): any {
    const getFieldByUniqueKey = (key: string) =>formFields.find(ele => ele?.fieldUniqueKey === 'grace-info')?.fields.find(ele => ele?.fieldUniqueKey === 'accordian-info')?.fields.find(ele => ele?.fieldUniqueKey === 'first-accordian-info')?.fields.find(ele => ele?.name === key)
    const detailsFieldFromDate = getFieldByUniqueKey(GraceDetailsEnum.fromDate);
    const detailsFieldToDate = getFieldByUniqueKey(GraceDetailsEnum.toDate);
    if (next == 'Special') {
      detailsFieldFromDate.hidden = false;
      detailsFieldToDate.hidden = false;
    } else {
      detailsFieldFromDate.hidden = true;
      detailsFieldToDate.hidden = true;
    }
    return formValue;
  }

  getGlobalDefaultObj(isEditMode, data) {
    if (data) {
        return {
            id: data,
            name: data
        }
    }
    else {
        return {};
    }
}
}
