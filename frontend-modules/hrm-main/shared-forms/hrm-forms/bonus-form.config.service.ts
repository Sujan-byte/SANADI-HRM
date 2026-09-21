import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { BonusDetails, BonusModel } from 'src/app/core/shared/common/model/hrm/bonus.model';
import { BonusDetailsEnum, BonusEnum } from 'src/app/modules/hrm-main/hrm-enum/bonus.enum';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { GradeFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/grade-form.config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { CalenderDateEnum, FilterOptions, MomentDateEnum } from 'src/app/core/shared/common/enum/app.enum';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import * as moment from 'moment';
@Injectable({
  providedIn: 'root',
})
export class BonusFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  //grade create + dropdown 
  private readonly gradeConfig = signal({})
  private readonly gradeForm = inject(GradeFormConfig);
  private gradeList = signal([])
  private readonly bonusItemFooterInitialize = signal([]);
  async onChangegrade(prev, next, formValue, formFields) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${next}`)
        .subscribe((response: any) => {
          formValue.grade_description = response?.grade_description;
          formValue.bonus_details = [];
          this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}?required_fields=${'id,employee_code,first_name,last_name'}&grade=${response.id}&is_active=${true}`)
            .subscribe((res: any) => {
              if (Object.keys(res).length) {
                res?.results.forEach((element: any) => {
                  let tableRowObject = {
                    id: '',
                    employee: '',
                    employee_code: '',
                    first_name: '',
                    management_incentive: 0,
                    variable_incentive: 0,
                    vehicle_maintenance_incentive: 0,
                    accidental_insurance_premium_share: 0,
                    health_insurance_premium_share: 0,
                    bonus_amount: 0

                  }
                  const id = this.generateUniqueId();
                  tableRowObject.id = id;
                  tableRowObject.employee = element.id
                  tableRowObject.employee_code = element.employee_code;
                  tableRowObject.first_name = element.first_name;
                  formValue.bonus_details.push(tableRowObject)
                })
              }
            });
          const processInfo = formFields.find((ele) => ele?.fieldUniqueKey == 'bonus_tab')?.fields.find((ele) => ele?.type == 'table')
          processInfo.dataSource = formValue.bonus_details;
          console.log("formValue", formValue)
          resolve(formValue);
        });
    });

  }
  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }
  setGradeMasterConfig() {
    this.gradeConfig.set({
      pageTitle: this.translate.instant('gradeMaster_TC'),
      dialogData: {},
      dialogConfig: {
        height: '80%',
        width: '100%'
      },
      isShowDialog: true,
    })
  }
  updateDynamicDropdownOptions(response) {
    console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }
  saveDynamicDropdownData(attribute: any, event: any, form: any) {
    return { data: event, attribute: attribute }
  }

  public readonly BonusForm =
    () =>
      (dataFromComponent?: any, initialData?: BonusModel, isEditMode?: boolean, data?: BonusModel) => {
        initialData = new BonusModel();
        let grade_default_object = isEditMode ? data.grade_default_object : {};
        let bonus_details = isEditMode ? data.bonus_details : [];
        initialData.date = isEditMode ? data.date : moment(new Date()).format('DD-MM-YYYY');
        let bonus_months = null
        if (isEditMode) {
          const DateParts = data.date.split('-');
          const fromDate = new Date(DateParts[2], DateParts[1] - 1, DateParts[0]);
          bonus_months = new Date(fromDate);
        }
        if (bonus_details?.length) {
          this.updateTableFooterValues(data)
        }
        else {
          this.setBonusItemFooterInitialize();
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('bonusDetails_TC'),
                fieldUniqueKey: 'bonus_tab',
                fields: [
                  new DropdownField(this.translate, BonusEnum.grade, isEditMode, data, initialData, true, undefined, "grade_code_TC", '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['grade_code', 'grade_description'], 'id')
                    // .addDynamicDialogConfig({
                    //   config: this.gradeConfig(),
                    //   formConfig: this.gradeForm.GradeForm()
                    // })
                    // .saveData(this.saveDynamicDropdownData.bind(this, 'grade'))
                    // .getOptions(this.gradeList)
                    .getOptions(signal([]))
                    .setRequiredFields('id,grade_code,grade_description')
                    .validate(true)
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(grade_default_object)
                    .onChangeOnly(this.onChangegrade.bind(this))
                    .getUrlConfig({
                      post: {
                        url: ServiceUrlConstants.GRADE_CRUD,
                      },
                      get: {
                        url: ServiceUrlConstants.GRADE_CRUD,
                        params: { page_size: 30, is_active: true },
                        filterKeys: [`grade_code__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, BonusEnum.grade_description, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true, 1, 30)
                    .toObject(),
                  new DateField(this.translate, BonusEnum.date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .addFormat("yy-mm-dd")
                    // .validate(true)
                    .onChange(this.onChangeDate.bind(this))
                    .toObject(),
                  new DateField(this.translate, BonusEnum.bonus_months, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .addFormat(CalenderDateEnum.monthYear)
                    .addMomentDateFormat(MomentDateEnum.monthYear)
                    .setMinDateValue(bonus_months)
                    .validate(true)
                    .setView('month')
                    .toObject(),
                  // new InputField(this.translate, BonusEnum.total, isEditMode, data, initialData)
                  // .addFieldWidth('24%')
                  // .isReadOnly(true)
                  // .toObject(),

                  new TableBuilder(this.translate, BonusEnum.bonus_details, '', true)
                    .columnSchema([
                      { name: BonusDetailsEnum.employee_code + "_TC", colWidth: '100px' },
                      { name: BonusDetailsEnum.first_name + "_TC", colWidth: '100px' },
                      { name: BonusDetailsEnum.management_incentive + "_TC", colWidth: '100px' },
                      { name: BonusDetailsEnum.variable_incentive + "_TC", colWidth: '100px' },
                      { name: BonusDetailsEnum.vehicle_maintenance_incentive + "_TC", colWidth: '200px' },
                      { name: BonusDetailsEnum.accidental_insurance_premium_share + "_TC", colWidth: '200px' },
                      { name: BonusDetailsEnum.health_insurance_premium_share + "_TC", colWidth: '200px' },
                      { name: BonusDetailsEnum.bonus_amount + "_TC", colWidth: '200px' },
                    ])

                    .formInitialise<BonusDetails>(new BonusDetails())
                    .formSchema([
                      {
                        name: BonusDetailsEnum.employee_code,
                        type: 'input',
                        readonly: true,
                      },
                      {
                        name: BonusDetailsEnum.first_name,
                        type: 'input',
                        readonly: true,
                      },

                      {
                        name: BonusDetailsEnum.management_incentive,
                        type: 'number',
                        maxFractionDigits: 0,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                      {
                        name: BonusDetailsEnum.variable_incentive,
                        type: 'number',
                        maxFractionDigits: 0,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                      {
                        name: BonusDetailsEnum.vehicle_maintenance_incentive,
                        type: 'number',
                        maxFractionDigits: 0,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                      {
                        name: BonusDetailsEnum.accidental_insurance_premium_share,
                        type: 'number',
                        maxFractionDigits: 0,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                      {
                        name: BonusDetailsEnum.health_insurance_premium_share,
                        type: 'number',
                        maxFractionDigits: 0,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                      {
                        name: BonusDetailsEnum.bonus_amount,
                        type: 'number',
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                        onValueChange: this.onChangeCalculationFields.bind(this),
                        minFractionDigits: 0,
                        maxFractionDigits: 0,
                        readonly: true
                      },
                    ])
                    .getDatasource<Array<BonusDetails>>('id', bonus_details)
                    .enableFooter(true)
                    .footerInitialise(this.bonusItemFooterInitialize())
                    .onDeleteTableRow(this.updateTableFooterValues.bind(this))
                    .setAddButton(true)
                    .build(),
                  new NumberField(this.translate, BonusEnum.total_bonus_amount, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    // .isFieldHidden(true)
                    .toObject(),
                ],
              }
            ])
        ];
      };
  onChangeCalculationFields(value: any, item: BonusDetails, formValue: BonusDetails) {
    // Ensure values are positive numbers, otherwise default to 0
    const getValidNumber = (field: any) => Number(field) > 0 ? Number(field) : 0;

    item.bonus_amount = Number((
      getValidNumber(item.management_incentive) +
      getValidNumber(item.variable_incentive) +
      getValidNumber(item.vehicle_maintenance_incentive) -
      getValidNumber(item.accidental_insurance_premium_share) -
      getValidNumber(item.health_insurance_premium_share)
    ).toFixed(2));

    return item;
  }

  updateTableFooterValues(data: BonusModel) {

    let totalBonus: number = 0;
    let totalManagementIncentive: number = 0;
    let totalVariableIncentive: number = 0;
    let totalVehicleMaintenanceIncentive: number = 0;
    let totalAccidentalInsurancePremiumShare: number = 0;
    let totalHealthInsurancePremiumShare: number = 0;
    const _ = require("lodash");
    _.forEach(data.bonus_details, function (element, key) {
      totalManagementIncentive += Number(element?.management_incentive ?? 0);
      totalVariableIncentive += Number(element?.variable_incentive ?? 0);
      totalVehicleMaintenanceIncentive += Number(element?.vehicle_maintenance_incentive ?? 0);
      totalAccidentalInsurancePremiumShare += Number(element?.accidental_insurance_premium_share ?? 0);
      totalHealthInsurancePremiumShare += Number(element?.health_insurance_premium_share ?? 0);
      totalBonus += Number(element?.bonus_amount ?? 0);
    });
    data.total_bonus_amount = totalBonus || 0;

    const bonusItemFooterInitialize: any = [];
    const bonusItemTableForm = Object.keys(BonusDetailsEnum);
    bonusItemTableForm.forEach((ele, index) => {
      if (index === 0) {
        bonusItemFooterInitialize.push({ name: ' ' }); // Due to checkbox 
        bonusItemFooterInitialize.push({ name: 'Total' });
      }
      else {
        switch (ele) {
          case BonusDetailsEnum.management_incentive:
            bonusItemFooterInitialize.push({ name: totalManagementIncentive.toFixed(2) });
            break;
          case BonusDetailsEnum.variable_incentive:
            bonusItemFooterInitialize.push({ name: totalVariableIncentive.toFixed(2) });
            break;
          case BonusDetailsEnum.vehicle_maintenance_incentive:
            bonusItemFooterInitialize.push({ name: totalVehicleMaintenanceIncentive.toFixed(2) });
            break;
          case BonusDetailsEnum.accidental_insurance_premium_share:
            bonusItemFooterInitialize.push({ name: totalAccidentalInsurancePremiumShare.toFixed(2) });
            break;
          case BonusDetailsEnum.health_insurance_premium_share:
            bonusItemFooterInitialize.push({ name: totalHealthInsurancePremiumShare.toFixed(2) });
            break;
          case BonusDetailsEnum.bonus_amount:
            bonusItemFooterInitialize.push({ name: totalBonus.toFixed(2) });
            break;
          default:
            bonusItemFooterInitialize.push({ name: '' });
        }
      }
    })
    // bonusItemFooterInitialize.push({ name: '' }); // for action buttons to cover
    this.bonusItemFooterInitialize.set(bonusItemFooterInitialize);
    return { form: data, footerInitialize: bonusItemFooterInitialize };
  }

  setBonusItemFooterInitialize() {
    this.bonusItemFooterInitialize.set([{ name: 'Total' }, { name: "" }, { name: "" }, { name: 0 }, { name: 0 }, { name: 0 }, { name: 0 }, { name: 0 }, { name: 0 }])
  }

  onChangeDate(prev, next, formValue, formFields) {
    if (next) {
      const DateParts = formValue.date.split('-');
      const fromDate = new Date(DateParts[2], DateParts[1] - 1, DateParts[0]);
      const bonusMonths = formFields.find((ele) => ele?.fieldUniqueKey == 'bonus_tab')?.fields.find((ele) => ele?.name == 'bonus_months');
      console.log("toDateField", fromDate);
      bonusMonths.minDateValue = new Date(fromDate);
      formValue.bonus_months = null
      return formValue;
    } else {
      return formValue;
    }
  }
}
