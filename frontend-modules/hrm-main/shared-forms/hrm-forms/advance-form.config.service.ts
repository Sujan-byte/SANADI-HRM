import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { AdvanceEnum } from 'src/app/modules/hrm-main/hrm-enum/advance.enum';
import { AdvanceModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/advance.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { CalenderDateEnum, FilterOptions, MomentDateEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { GlobalMasterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/global-master-from.config.service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';


@Injectable({
  providedIn: 'root',
})
export class AdvanceFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private readonly sharedService = inject(SharedService);

  //globalMaster create + dropdown 
  private readonly globalMasterConfig = signal({})
  private readonly globalMasterForm = inject(GlobalMasterFormConfig);
  private globalList = signal([])

  async onChangeGlobal(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.GLOBAL_MASTER_CRUD}${next}`).subscribe((response: any) => {
        console.log("response", response)

        formValue.employee_type = response?.results

        resolve(formValue);
      })
    })
  }
  //globalMaster delogue
  setGlobalMasterMasterConfig() {
    this.globalMasterConfig.set({
      pageTitle: this.translate.instant('create_advance_type_TC'),
      dialogData: {},
      dialogConfig: {
        height: '40%',
        width: '35%'
      },
      isShowDialog: true,
    })
  }

  public readonly AdvanceForm =
    () =>
      (dataFromComponent?: any, initialData?: AdvanceModel, isEditMode?: boolean, data?: AdvanceModel) => {
        initialData = new AdvanceModel();
        this.setGlobalMasterMasterConfig()
        let default_employee_object = isEditMode ? data.employee_default_object : {};
        let default_global_object = isEditMode ? data.default_global_object : {};
        let loanStartDate=null
        if(isEditMode){
          const DateParts = data.date.split('-');
          const fromDate = new Date(DateParts[2], DateParts[1], DateParts[0]);
          loanStartDate = new Date(fromDate);
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('advanceDetails_TC'),
                fieldUniqueKey: 'advance-tab',
                fields: [
                  new DropdownField(this.translate, AdvanceEnum.employee, isEditMode, data, initialData, true, undefined, "employee_code_TC",'23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['employee_code','first_name','designation_name'], 'id')
                    .getOptions(signal([]))
                    .validate(true)
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(default_employee_object)
                    .onChange(this.onChangeEmployee.bind(this))
                    .setRequiredFields('id,employee_code,first_name')
                    .getUrlConfig({
                      get: {
                        url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                        params: { page_size: 30, is_active: true },
                        filterKeys: [`employee_code__${FilterOptions.iContains}&first_name__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, AdvanceEnum.employee_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DateField(this.translate, AdvanceEnum.date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
            
                    .onChange(this.onChangeDate.bind(this))
                    // .addFormat("yy-mm-dd")
                    .toObject(),
                  new InputField(this.translate, AdvanceEnum.designation, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, AdvanceEnum.department, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DropdownField(this.translate, AdvanceEnum.advance_type, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC',undefined,'21vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabel('name', 'id')
                    .addDynamicDialogConfig({
                      config: this.globalMasterConfig(),
                      isEditMode: true,
                      data: { global_key: 'advance_type' },
                      formConfig: this.globalMasterForm.GlobalMasterForm()
                    })
                    .saveData(this.saveDynamicDropdownData.bind(this, 'advance_type'))
                    .getOptions(this.globalList)
                    .validate(true)
                    .isLazyFilterDropDown(true)
                    .setDefaultObject(default_global_object)
                    .getUrlConfig({
                      post: {
                        url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                      },
                      get: {
                        url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                        params: {
                          page_size: 30, is_active: true, global_key: 'advance_type'
                        },
                      }
                    })
                    .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                    .toObject(),
                  new NumberField(this.translate, AdvanceEnum.advance_amount, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(0)
                    .validate(true)
                    .onChange(this.onChangeAdvanceAmount.bind(this))
                    .toObject(),
                  new NumberField(this.translate, AdvanceEnum.deduction_tenure_months, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(0)
                    .validate(true)
                    .onChange(this.onChangeDeduction.bind(this))
                    .toObject(),
                  new NumberField(this.translate, AdvanceEnum.emi, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(0)
                    .isReadOnly(true)
                    .toObject(),
                  new DateField(this.translate, AdvanceEnum.loan_start_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .addFormat(CalenderDateEnum.monthYear)
                    .addMomentDateFormat(MomentDateEnum.monthYear)
                    .setView('month')
                    // .setMinDateValue(loanStartDate)
                    .validate(true)
                    .toObject(),
                  new NumberField(this.translate, AdvanceEnum.balance_loan_amount, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(0)
                    .isReadOnly(true)
                    .toObject(),
                ],
              }
            ])
        ];
      };

  onChangeEmployee(prev, next, formValue, formFields) {
    if (next) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((res: any) => {
          formValue.employee_name = res?.first_name;
          formValue.department = res?.department_name;
          formValue.designation = res?.designation_name;
          formValue.date = null;
          const dateField = formFields.find((ele)=> ele?.fieldUniqueKey == 'advance-tab')?.fields.find((ele) => ele?.name == 'date');
          if(res?.doj){
            let parts = res?.doj.split('-');
            if(parts.length === 3) {
              let parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
              dateField.minDateValue = new Date(parsedDate);          
            }
          }
          resolve(formValue)
        })
      })
    }
    else {
      return formValue
    }
  }

  updateDynamicDropdownOptions(response) {
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }

  saveDynamicDropdownData(attribute: any, event: any, form: any) {
    console.log("attribute", attribute, event, form)
    return { data: event, attribute: attribute }
  }

  //globalMasterList dropDown update
  updateDynamicGlobalMasterDropdownOptions(response) {
    console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results[0]?.global_value;
      return options;
    }
  }

  onChangeAdvanceAmount(prev, next, formValue, formFields) {
    if (next) {
      console.log("next", next)
      if (formValue.deduction_tenure_months != null || formValue.deduction_tenure_months != "" || formValue.deduction_tenure_months != 0 || formValue.deduction_tenure_months != undefined) {
        formValue.emi = Number(Math.round(formValue.advance_amount / formValue.deduction_tenure_months));
        formValue.balance_loan_amount = next
        formValue.loan_advance = next;
        // console.log("formValue.emi", formValue.loan_advance)
      }
      else {
        formValue.emi = 0;
      }
      return formValue;
    }
    else {
      formValue.advance_amount = "";
      formValue.emi = 0;
      formValue.loan_advance = 0;
      formValue.balance_loan_amount = next
      return formValue
    }
  }

  onChangeDeduction(prev, next, formValue, formFields) {
    console.log("next", next)
    if (next) {
      if (formValue.advance_amount != null && formValue.advance_amount != "" && formValue.advance_amount != undefined && formValue.deduction_tenure_months !== 0) {
        formValue.emi = Number(Math.round(formValue.advance_amount / formValue.deduction_tenure_months));
        formValue.loan_advance = next
      }
      else {
        formValue.emi = 0;
      }
      return formValue;
    }
    else {
      formValue.deduction_tenure_months = '';
      formValue.emi = 0;

      return formValue
    }
  }
  onChangeDate(_prev, _next, formValue, _formFields) {
    return formValue;
  }
}
