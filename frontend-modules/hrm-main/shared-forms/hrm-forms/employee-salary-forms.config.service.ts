import { Injectable, inject, signal } from '@angular/core';
import { forEach } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { EmployeeSalaryModel, GrossDeductions, GrossEarnings } from 'src/app/core/shared/common/model/hrm/employee-salary-model';
import { EmployeeSalaryEnum, GrossDeductionsEnum, GrossEarningsEnum } from 'src/app/core/shared/common/enum/hrm-enum/employee-salary-enum';
import { OverlayPanelBuilder, TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { SharedService } from 'src/app/core/shared/services/shared.service';
import { elements } from 'chart.js';
import { startWith } from 'rxjs';
import { EmployeeModel } from 'src/app/core/shared/common/model/masters/employee.model';
import { SalaryComponentsModel } from 'src/app/core/shared/common/model/masters/salary-components.model';
import { SalaryComponentsEnum } from 'src/app/core/shared/common/enum/masters_enum/salary-components-enum';
@Injectable({
  providedIn: 'root',
})
export class EmployeeSalaryFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private _sharedService = inject(SharedService)
  private readonly grossEarningsFooterInitialize = signal([]);
  private readonly grossDeductionsFooterInitialize = signal([]);
  fixedGrossEarningList: any = signal([])
  fixedGrossDeductionsList: any = signal([])
  deductionMonthlyTotal: number = 0;
  grossMonthlyTotal: number = 0;
  deductionYearlyTotal: number = 0;
  grossYearlyTotal: number = 0;
  gradeObject: any;
  public readonly EmployeeSalaryForm =
    () =>
      (dataFromComponent?: any, initialData?: EmployeeSalaryModel, isEditMode?: boolean, data?: any) => {
        initialData = new EmployeeSalaryModel();
        let default_employee_object = isEditMode ? data.employee_default_object : {};
        let backend_gross_deductions = isEditMode ? data.gross_deductions : [];
        let backend_gross_earnings = isEditMode ? data.gross_earnings : [];
        let pf_employer_contribution
        let esi_employer_contribution
        // console.log("initialData", data)

        if (isEditMode) {
          // this.onChangeEmployee(0, data.employee, data, this.EmployeeSalaryForm()()[0].fields);
          pf_employer_contribution = `PF Employer Monthly (${data?.pf_employer_contribution})%`
          esi_employer_contribution = `ESI Employer Monthly (${data?.esi_employer_share})%`
          this.gradeObject = data?.gradeObject
          console.log("this.gradeObject", this.gradeObject)
          this.getEmployeeGradeDetails(data?.employee, data)
        }
        // console.log("first")
        let gross_earnings = isEditMode ? data?.gross_earnings : this.fixedGrossEarningList();
        let gross_deductions = isEditMode ? data?.gross_deductions : this.fixedGrossDeductionsList();
        if (backend_gross_deductions.length || backend_gross_earnings.length) {
          // console.log("data in",data);
          this.updateGrossEarningsTableFooterValues(data);
          this.updateGrossDeductionsTableFooterValues(data);
        }
        else {
          this.setGrossEarningsFooterInitialize();
          this.setGrossDeductionsFooterInitialize();
          this.deductionMonthlyTotal = 0;
          this.grossMonthlyTotal = 0;
          this.deductionYearlyTotal = 0;
          this.grossYearlyTotal = 0;
          this.gradeObject = ''
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'sal-info',
                fields: [
                  new DropdownField(this.translate, EmployeeSalaryEnum.employee, isEditMode, data, initialData, true, undefined, "employee_code_TC", '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['employee_code', 'first_name', 'designation_name'], 'id')
                    .getOptions(signal([]))
                    .validate(true)
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(default_employee_object)
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .setRequiredFields('id,employee_code,first_name')
                    .getUrlConfig({
                      get: {
                        url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                        params: { page_size: 30, is_active: true, is_sal_created: false },
                        filterKeys: [`employee_code__${FilterOptions.iContains}&first_name__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, EmployeeSalaryEnum.department_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, EmployeeSalaryEnum.designation_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, EmployeeSalaryEnum.employee_grade, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DateField(this.translate, EmployeeSalaryEnum.effective_date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
                    .toObject(),
                  new NumberField(this.translate, EmployeeSalaryEnum.initial_gratuity, isEditMode, data, initialData)
                    .addFieldWidth('24%').isFieldHidden(true)
                    .toObject(),
                  {
                    type: 'accordion',
                    multiple: true,
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('grossEarnings_TC'),
                        fieldUniqueKey: 'gross-earnings',
                        selected: true,
                        fields: [
                          new TableBuilder(this.translate, EmployeeSalaryEnum.gross_earnings, '', true)
                            .columnSchema([
                              { name: GrossEarningsEnum.components + "_TC", colWidth: '200px' },
                              { name: GrossEarningsEnum.monthly + "_TC", colWidth: '200px' },
                              { name: GrossEarningsEnum.yearly + "_TC", colWidth: '200px' },
                            ])
                            .formInitialise<GrossEarnings>(new GrossEarnings())
                            .formSchema([
                              {
                                name: GrossEarningsEnum.components,
                                type: 'input',
                              },
                              {
                                name: GrossEarningsEnum.monthly,
                                type: 'number',
                                onValueChange: this.onChangeGrossEarningsMonthlyCalculationFields.bind(this),
                                updateTableFooter: this.updateGrossEarningsTableFooterValues.bind(this),
                                minFractionDigits: 0,
                                maxFractionDigits: 0,
                              },
                              {
                                name: GrossEarningsEnum.yearly,
                                type: 'number',
                                // readonly: true,
                                onValueChange: this.onChangeGrossEarningsYearlyCalculationFields.bind(this),
                                updateTableFooter: this.updateGrossEarningsTableFooterValues.bind(this),
                                minFractionDigits: 0,
                                maxFractionDigits: 0,
                              },
                            ])
                            .getDatasource<Array<GrossEarnings>>('id', gross_earnings)
                            .enableFooter(true)
                            .setTableWidth('90vw')
                            .setTableCaption(true)
                            .setCheckBox(false)
                            .setTableCaptionDialogButton(true)
                            .setTableCaptionDialogButtonLabel("Add Allowance Details")
                            .setField(
                              new OverlayPanelBuilder()
                                .setTableName(EmployeeSalaryEnum.gross_earnings)
                                .setOverlayPanelColumnSchema([
                                  { name: this.translate.instant(`${SalaryComponentsEnum.component}_TC`), field: SalaryComponentsEnum.component },

                                ])
                                .setOnUpdateRows(this.updateTableRowsEarnings.bind(this))
                                .setOverlayPanelSelectionMode('single')
                                .setOverlayPanelRows(10)
                                .setDialogScrollHeight('55vh')
                                .setOverlayPanelFormInitialise([SalaryComponentsEnum.component])
                                .setOverlayPanelPaginator(true)
                                .setScrollable(true)
                                .setLazy(true)
                                .setFontSize('14px')
                                .setQueryParams({
                                  type: 'Allowance',
                                  is_active: true,
                                  search_key: `${SalaryComponentsEnum.component}`,
                                })
                                .setDisabledField('false')
                                // .setOverlayPanelSelectedArray(this.selectedJobCardList)
                                .setUrls(`${ServiceUrlConstants.SALARY_COMPONET_CRUD}`)
                                .setOverlayDialogConfig({ width: '35vw', height: '75vh' })
                                .build()
                            )
                            .setAddButton(true)
                            .footerInitialise(this.grossEarningsFooterInitialize())
                            .onDeleteTableRow(this.onDeleteGrossTableRows.bind(this))

                            .setTableWidth('92vw')
                            .build(),
                        ]
                      },
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('grossDeductions_TC'),
                        fieldUniqueKey: 'gross-deductions',
                        selected: true,
                        fields: [
                          new TableBuilder(this.translate, EmployeeSalaryEnum.gross_deductions, '', true)
                            .columnSchema([
                              { name: GrossDeductionsEnum.components + "_TC", colWidth: '200px' },
                              { name: GrossDeductionsEnum.monthly + "_TC", colWidth: '200px' },
                              { name: GrossDeductionsEnum.yearly + "_TC", colWidth: '200px' },
                            ])
                            .formInitialise<GrossDeductions>(new GrossDeductions())
                            .formSchema([
                              {
                                name: GrossDeductionsEnum.components,
                                type: 'input'
                              },
                              {
                                name: GrossDeductionsEnum.monthly,
                                type: 'number',
                                onValueChange: this.onChangeGrossMonthlyDeductionsCalculationFields.bind(this),
                                updateTableFooter: this.updateGrossDeductionsTableFooterValues.bind(this),
                                maxFractionDigits: 0,
                                minFractionDigits: 0,
                              },
                              {
                                name: GrossDeductionsEnum.yearly,
                                type: 'number',
                                onValueChange: this.onChangeGrossYearlyDeductionsCalculationFields.bind(this),
                                updateTableFooter: this.updateGrossDeductionsTableFooterValues.bind(this),
                                maxFractionDigits: 0,
                                minFractionDigits: 0,
                              },
                            ])
                            .getDatasource<Array<GrossDeductions>>('id', gross_deductions)
                            .enableFooter(true)
                            .setTableWidth('90vw')
                            .setTableCaption(true)
                            .setCheckBox(false)
                            .setTableCaptionDialogButton(true)
                            .setTableCaptionDialogButtonLabel("Add Deduction Details")
                            .setField(
                              new OverlayPanelBuilder()
                                .setTableName(EmployeeSalaryEnum.gross_deductions)
                                .setOverlayPanelColumnSchema([
                                  { name: this.translate.instant(`${SalaryComponentsEnum.component}_TC`), field: SalaryComponentsEnum.component },

                                ])
                                .setOnUpdateRows(this.updateTableRowsDeduction.bind(this))
                                .setOverlayPanelSelectionMode('single')
                                .setOverlayPanelRows(10)
                                .setDialogScrollHeight('55vh')
                                .setOverlayPanelFormInitialise([SalaryComponentsEnum.component])
                                .setOverlayPanelPaginator(true)
                                .setScrollable(true)
                                .setLazy(true)
                                .setFontSize('14px')
                                .setQueryParams({
                                  type: 'Deduction',
                                  is_active: true,
                                  search_key: `${SalaryComponentsEnum.component}`,
                                })
                                .setDisabledField('false')
                                // .setOverlayPanelSelectedArray(this.selectedJobCardList)
                                .setUrls(`${ServiceUrlConstants.SALARY_COMPONET_CRUD}`)
                                .setOverlayDialogConfig({ width: '35vw', height: '75vh' })
                                .build()
                            )
                            .setAddButton(true)
                            .footerInitialise(this.grossDeductionsFooterInitialize())
                            .onDeleteTableRow(this.onDeleteGrossTableRows.bind(this))

                            .build(),
                        ]
                      },
                    ]
                  },
                  // new NumberField(this.translate, EmployeeSalaryEnum.pf_employer, isEditMode, data, initialData, pf_employer_contribution)
                  //   .addFieldWidth('24%').isReadOnly(true)
                  //   .toObject(),
                  // new NumberField(this.translate, EmployeeSalaryEnum.pf_employer_yearly, isEditMode, data, initialData)
                  //   .addFieldWidth('24%').isReadOnly(true)
                  //   .toObject(),
                  // new NumberField(this.translate, EmployeeSalaryEnum.esi_employer, isEditMode, data, initialData, esi_employer_contribution)
                  //   .addFieldWidth('24%').isReadOnly(true)
                  //   .toObject(),
                  // new NumberField(this.translate, EmployeeSalaryEnum.esi_employer_yearly, isEditMode, data, initialData)
                  //   .addFieldWidth('24%').isReadOnly(true)
                  //   .toObject(),
                  new NumberField(this.translate, EmployeeSalaryEnum.net_pay_monthly, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true)
                    .toObject(),
                  new NumberField(this.translate, EmployeeSalaryEnum.net_pay_yearly, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true)
                    .toObject(),
                  new NumberField(this.translate, EmployeeSalaryEnum.ctc, isEditMode, data, initialData)
                    .addFieldWidth('24%').isReadOnly(true)
                    .isFieldHidden(true)
                    .toObject(),
                  new NumberField(this.translate, EmployeeSalaryEnum.variable_pay, isEditMode, data, initialData)
                    .addFieldWidth('24%').isFieldHidden(true)
                    .toObject(),
                ]
              },
            ])
        ];
      };
  filedCaliculation(formValue) {
    const pfEmployer = Number(this.gradeObject?.pf_employer_contribution) || 0
    const esiEmployer = Number(this.gradeObject?.esi_employer_share) || 0
    // console.log("second", pfEmployer, esiEmployer)
    let total_gross_sal = 0
    let gross_basic_pay = 0;
    // First pass: calculate total gross salary and identify the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'Basic Pay') {
        gross_basic_pay = element.monthly || 0;
      }
    });
    formValue?.gross_earnings?.forEach(element => {
      total_gross_sal += element.monthly || 0;
    });
    const isEsiApplicable = total_gross_sal < 21000;
    // console.log("total_gross_sal", total_gross_sal, gross_basic_pay)
    const pf_employer = Number(Math.round((gross_basic_pay * pfEmployer / 100)));
    const isPFApplicable = pf_employer < 1800;
    formValue.pf_employer = isPFApplicable ? Number(pf_employer) : 1800;
    formValue.pf_employer_yearly = Number(Math.round(formValue.pf_employer * 12));
    const esi_employer = isEsiApplicable ? Number((total_gross_sal * esiEmployer / 100)) : 0;
    formValue.esi_employer = Number(Math.round(esi_employer))
    formValue.esi_employer_yearly = isEsiApplicable ? Number((Math.round(esi_employer) * 12)) : 0;
    // console.log("total_gross_sal", Number((total_gross_sal * esiEmployer / 100)), Number(Math.round(esi_employer)), formValue.esi_employer, formValue.esi_employer_yearly)
    const totalGross = Number(total_gross_sal) * 12
    const ctc = Number(Number(totalGross) + Number(formValue?.esi_employer_yearly) + Number(formValue?.pf_employer_yearly));
    formValue.ctc = Number(Math.round(ctc))
    return formValue
  }
  updateDynamicDropdownOptions(response) {
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }

  updateGrossEarningsTableFooterValues(data: EmployeeSalaryModel, formFields = []) {
    let monthlyTotal: number = 0;
    let yearlyTotal: number = 0;
    forEach(data?.gross_earnings, function (element, key) {
      monthlyTotal += Number(Math.round(element?.monthly) ?? 0);
      yearlyTotal += Number(Math.round(element?.yearly) ?? 0);
    });
    // console.log("EmployeeSalaryModel", data, monthlyTotal, yearlyTotal);
    this.grossMonthlyTotal = Math.round(monthlyTotal) || 0
    this.grossYearlyTotal = Math.round(yearlyTotal) || 0
    const net_pay_monthly = Number(Math.round(Number(this.grossMonthlyTotal) - Number(this.deductionMonthlyTotal))) || 0
    data.net_pay_monthly = Math.round(net_pay_monthly)
    data.net_pay_yearly = Number(Math.round(net_pay_monthly) * 12)
    // console.log("net_pay_monthly", net_pay_monthly)
    const grossEarningsFooterInitialize: any = [];
    const grossEarningsTableForm = Object.keys(GrossEarningsEnum);
    grossEarningsTableForm.forEach((ele, index) => {
      if (index === 0) {
        grossEarningsFooterInitialize.push({ name: ' ' }); // Due to checkbox 
        grossEarningsFooterInitialize.push({ name: 'Gross Salary' });
      }
      else {
        switch (ele) {
          case GrossEarningsEnum.monthly:
            grossEarningsFooterInitialize.push({ name: monthlyTotal });
            break;
          case GrossEarningsEnum.yearly:
            grossEarningsFooterInitialize.push({ name: yearlyTotal });
            break;
          default:
            grossEarningsFooterInitialize.push({ name: '' });
        }
      }
    })
    // grossEarningsFooterInitialize.push({ name: '' }); // for action buttons to cover
    this.grossEarningsFooterInitialize.set(grossEarningsFooterInitialize);
    if (formFields?.length > 0)
      this.setFooterGrossEarningsInitializeFormFields(formFields);
    return { form: data, footerInitialize: grossEarningsFooterInitialize };
  }
  setGrossEarningsFooterInitialize() {
    this.grossEarningsFooterInitialize.set([{ name: 'Gross Salary' }, { name: "" }, { name: 0 }, { name: 0 }])
  }
  onChangeGrossEarningsMonthlyCalculationFields(value, item: GrossEarnings, formValue: EmployeeSalaryModel, formFields) {
    const pfContributionRate = Number(this.gradeObject?.pf_employee_contribution) || 0
    const esiContributionRate = Number(this.gradeObject?.esi_employee_share) || 0
    const pfEmployer = Number(this.gradeObject?.pf_employer_contribution) || 0
    const esiEmployer = Number(this.gradeObject?.esi_employer_share) || 0
    let basic_pay = 0
    let total_gross_sal = 0
    const monthly = +(item?.monthly ?? 0);
    const yearly = monthly * 12;
    let gross_basic_pay = 0;
    // First pass: calculate total gross salary and identify the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'Basic Pay') {
        gross_basic_pay = element.monthly || 0;
      }
    });
    // Second pass: update the HRA based on the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'HRA') {
        const monthly = Number(gross_basic_pay * 40 / 100);
        element.monthly = Number(Math.round(monthly))
        element.yearly = Number(Math.round(monthly) * 12);
      }
      total_gross_sal += element.monthly || 0;
    });
    item.monthly = Number(Math.round(monthly));
    item.yearly = Number(Math.round(yearly));
    basic_pay = Number(Math.round(monthly));
    formValue?.gross_deductions?.forEach(element => {
      if (item.components === 'Basic Pay') {
        // console.log("pfEmployer", pfEmployer)
        const pf_employer = Number(Math.round((basic_pay * pfEmployer / 100)));
        const isPFApplicable = pf_employer < 1800;
        formValue.pf_employer = isPFApplicable ? Number(pf_employer) : 1800;
        formValue.pf_employer_yearly = Number(Math.round(formValue.pf_employer * 12));
        if (element.components.startsWith('PF')) {
          const monthly = Number(Math.round(basic_pay * pfContributionRate / 100));
          element.monthly = Number(Math.round(monthly))
          element.yearly = Number(Math.round(monthly * 12))
        }
      }
      //esi_employer caliculations
      const isEsiApplicable = total_gross_sal < 21000;
      if (element.components.startsWith('ESI')) {
        const monthly = isEsiApplicable ? Number((Math.round(total_gross_sal * esiContributionRate / 100))) : 0;
        element.monthly = Number(monthly)
        element.yearly = isEsiApplicable ? Number(Math.round(monthly * 12)) : 0;
      }
      // Total esi_employer caliculations
      const esi_employer = isEsiApplicable ? Number((total_gross_sal * esiEmployer / 100)) : 0;
      formValue.esi_employer = Number(Math.round(esi_employer))
      formValue.esi_employer_yearly = isEsiApplicable ? Number((Math.round(esi_employer) * 12)) : 0;
      // console.log("total_gross_sal", formValue.esi_employer, formValue.esi_employer_yearly)
      const totalGross = Number(total_gross_sal) * 12
      const ctc = Number(Number(totalGross) + Number(formValue?.esi_employer_yearly) + Number(formValue?.pf_employer_yearly));
      formValue.ctc = Number(Math.round(ctc))
    });
    // Update formValue gross_deductions with PF contributions
    this.updateGrossDeductionsTableFooterValues(formValue, formFields)
    this.updateGrossEarningsTableFooterValues(formValue, formFields)
    return item;
  }
  onChangeGrossEarningsYearlyCalculationFields(value, item: GrossEarnings, formValue: EmployeeSalaryModel, formFields) {
    const pfContributionRate = Number(this.gradeObject?.pf_employee_contribution) || 0
    const esiContributionRate = Number(this.gradeObject?.esi_employee_share) || 0
    const pfEmployer = Number(this.gradeObject?.pf_employer_contribution) || 0
    const esiEmployer = Number(this.gradeObject?.esi_employer_share) || 0
    let basic_pay = 0
    let total_gross_sal = 0
    const yearly = (item?.yearly ?? 0);
    const monthly = (Math.round(yearly / 12) ?? 0);
    let gross_basic_pay = 0;
    // First pass: calculate total gross salary and identify the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'Basic Pay') {
        gross_basic_pay = (Math.round(element.yearly / 12) ?? 0) || 0;
      }
    });
    // Second pass: update the HRA based on the basic pay
    formValue?.gross_earnings?.forEach(element => {
      if (element.components === 'HRA') {
        const monthly = Number(gross_basic_pay * 40 / 100);
        element.monthly = Number(Math.round(monthly))
        element.yearly = Number(Math.round(monthly) * 12);
      }
      total_gross_sal += element.monthly || 0;
    });
    item.monthly = Number(Math.round(monthly));
    item.yearly = Number(Math.round(yearly));
    basic_pay = Number(Math.round(monthly));
    formValue?.gross_deductions?.forEach(element => {
      if (item.components === 'Basic Pay') {
        // console.log("pfEmployer", pfEmployer)
        const pf_employer = Number(Math.round((basic_pay * pfEmployer / 100)));
        const isPFApplicable = pf_employer < 1800;
        formValue.pf_employer = isPFApplicable ? Number(pf_employer) : 1800;
        formValue.pf_employer_yearly = Number(Math.round(formValue.pf_employer * 12));
        if (element.components.startsWith('PF')) {
          const monthly = Number(Math.round(basic_pay * pfContributionRate / 100));
          element.monthly = Number(Math.round(monthly))
          element.yearly = Number(Math.round(monthly * 12))
        }
      }
      //esi_employer caliculations
      const isEsiApplicable = total_gross_sal < 21000;
      if (element.components.startsWith('ESI')) {
        const monthly = isEsiApplicable ? Number((Math.round(total_gross_sal * esiContributionRate / 100))) : 0;
        element.monthly = Number(monthly)
        element.yearly = isEsiApplicable ? Number(Math.round(monthly * 12)) : 0;
      }
      // Total esi_employer caliculations
      const esi_employer = isEsiApplicable ? Number((total_gross_sal * esiEmployer / 100)) : 0;
      formValue.esi_employer = Number(Math.round(esi_employer))
      formValue.esi_employer_yearly = isEsiApplicable ? Number((Math.round(esi_employer) * 12)) : 0;
      // console.log("total_gross_sal", formValue.esi_employer, formValue.esi_employer_yearly)
      const totalGross = Number(total_gross_sal) * 12
      const ctc = Number(Number(totalGross) + Number(formValue?.esi_employer_yearly) + Number(formValue?.pf_employer_yearly));
      formValue.ctc = Number(Math.round(ctc))
    });
    // Update formValue gross_deductions with PF contributions
    this.updateGrossDeductionsTableFooterValues(formValue, formFields)
    this.updateGrossEarningsTableFooterValues(formValue, formFields)
    return item;
  }
  updateGrossDeductionsTableFooterValues(data: EmployeeSalaryModel, formFields = []) {
    let deductionMonthlyTotal: number = 0;
    let deductionyearlyTotal: number = 0;
    // console.log("data", data);
    forEach(data?.gross_deductions, function (element, key) {
      deductionMonthlyTotal += Number(Math.round(element?.monthly) ?? 0);
      deductionyearlyTotal += Number(Math.round(element?.yearly) ?? 0);
    });
    this.deductionMonthlyTotal = Number(Math.round(deductionMonthlyTotal)) || 0
    this.deductionYearlyTotal = Number(Math.round(deductionyearlyTotal)) || 0
    const net_pay_monthly = Number(Math.round(Number(this.grossMonthlyTotal) - Number(this.deductionMonthlyTotal)))
    data.net_pay_monthly = Math.round(net_pay_monthly)
    data.net_pay_yearly = Number(Math.round(net_pay_monthly) * 12)
    const grossDeductionsFooterInitialize: any = [];
    const grossDeductionsTableForm = Object.keys(GrossDeductionsEnum);
    grossDeductionsTableForm.forEach((ele, index) => {
      if (index === 0) {
        grossDeductionsFooterInitialize.push({ name: ' ' }); // Due to checkbox 
        grossDeductionsFooterInitialize.push({ name: 'Gross Deduction' });
      }
      else {
        switch (ele) {
          case GrossDeductionsEnum.monthly:
            grossDeductionsFooterInitialize.push({ name: deductionMonthlyTotal });
            break;
          case GrossDeductionsEnum.yearly:
            grossDeductionsFooterInitialize.push({ name: deductionyearlyTotal });
            break;
          default:
            grossDeductionsFooterInitialize.push({ name: '' });
        }
      }
    })
    // grossDeductionsFooterInitialize.push({ name: '' }); // for action buttons to cover
    this.grossDeductionsFooterInitialize.set(grossDeductionsFooterInitialize);
    // if form fields comes as parameter then below code works
    if (formFields?.length > 0)
      this.setFooterInitializeFormFields(formFields);
    return { form: data, footerInitialize: grossDeductionsFooterInitialize };
  }
  setGrossDeductionsFooterInitialize() {
    this.grossDeductionsFooterInitialize.set([{ name: 'Gross Deduction' }, { name: "" }, { name: 0 }, { name: 0 }])
  }
  onChangeGrossMonthlyDeductionsCalculationFields(value, item: GrossDeductions, formValue: EmployeeSalaryModel) {
    const monthly = +(item?.monthly ?? 0);
    const yearly = +(item?.monthly * 12 || 0);
    item.monthly = Number(Math.round(monthly));
    item.yearly = Number((Math.round(yearly)));
    return item;
  }
  onChangeGrossYearlyDeductionsCalculationFields(value, item: GrossDeductions, formValue: EmployeeSalaryModel) {
    const yearly = +(item?.yearly ?? 0);
    const monthly = +(yearly / 12 || 0);
    item.monthly = Number(Math.round(monthly));
    item.yearly = Number((Math.round(yearly)));
    return item;
  }
  // footer initialize forcefully.
  setFooterInitializeFormFields(formFields) {
    const deductionTable = formFields.find((ele) => ele?.fieldUniqueKey == 'sal-info')?.fields.find((ele => ele?.type == "accordion"))?.fields?.find((ele) => ele?.fieldUniqueKey == 'gross-deductions')?.fields.find((ele => ele?.type == 'table'));
    // this.updateDeductions(deductionTable)
    deductionTable.footerInitialise = this.grossDeductionsFooterInitialize()
    // console.log("setFooterGrossEarningsInitializeFormFields", deductionTable)
  }
  setFooterGrossEarningsInitializeFormFields(formFields) {
    const grossEarningsTable = formFields.find((ele) => ele?.fieldUniqueKey == 'sal-info')?.fields.find((ele => ele?.type == "accordion"))?.fields?.find((ele) => ele?.fieldUniqueKey == 'gross-earnings')?.fields.find((ele => ele?.type == 'table'));
    grossEarningsTable.footerInitialise = this.grossEarningsFooterInitialize()
    // console.log("setFooterGrossEarningsInitializeFormFields", grossEarningsTable)
  }
  onChangeEmployee(prev, next, formValue, formFields) {
    if (!next) {
      return formValue;
    }
    return new Promise((resolve, reject) => {
      this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe({
        next: (employeeRes: any) => {
          // console.log("employeeRes", employeeRes)
          this.updateEmployeeDetails(employeeRes, formValue);
          this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${employeeRes?.grade}`).subscribe({
            next: (gradeRes: any) => {
              this.gradeObject = gradeRes;
              const salInfoField = this.getField(formFields, 'sal-info', 'accordion');
              const grossEarningsTable = this.getField(salInfoField.fields, 'gross-earnings', 'table');
              const deductionTable = this.getField(salInfoField.fields, 'gross-deductions', 'table');
              // On create: populate tables from grade earnings/deductions
              if (!grossEarningsTable.dataSource?.length) {
                const gradeEarnings = (gradeRes.grade_gross_earnings || []).map((e: any) => ({
                  id: this.generateUniqueId(),
                  components: e.components,
                  monthly: e.monthly || 0,
                  yearly: e.yearly || 0,
                  salary_component: e.salary_component,
                  table_row_id: e.table_row_id || 0,
                }));
                grossEarningsTable.dataSource = gradeEarnings;
                formValue.gross_earnings = gradeEarnings;
              }
              if (!deductionTable.dataSource?.length) {
                const gradeDeductions = (gradeRes.grade_gross_deductions || []).map((d: any) => ({
                  id: this.generateUniqueId(),
                  components: d.components,
                  monthly: d.monthly || 0,
                  yearly: d.yearly || 0,
                  salary_component: d.salary_component,
                  table_row_id: d.table_row_id || 0,
                }));
                deductionTable.dataSource = gradeDeductions;
                formValue.gross_deductions = gradeDeductions;
              }
              this.updateGrossEarnings(formValue);
              this.updateDeducation(formValue);
              this.updateFormFields(formFields);
              this.updateGrossEarningsTableFooterValues(formValue, formFields);
              this.updateGrossDeductionsTableFooterValues(formValue, formFields);
              this.onChangeGrossEarningsMonthlyCalculationFields(0, formValue.gross_earnings, formValue, formFields)
              resolve(formValue);
            },
            error: (err) => {
              console.error('Error fetching grade details', err);
              reject(err);
            }
          });
        },
        error: (err) => {
          console.error('Error fetching employee details', err);
          reject(err);
        }
      });
    });
  }
  updateEmployeeDetails(employeeRes, formValue) {
    formValue.department_name = employeeRes?.department_name;
    formValue.designation_name = employeeRes?.designation_name;
    formValue.employee_grade = employeeRes?.grade_code;
  }
  updateGrossEarnings(formValue) {
    formValue.gross_earnings.forEach(element => {
      switch (element.components) {
        case 'Conveyance Allowance':
          this.setAllowance(element, this.gradeObject?.conveyance_allowance);
          break;
        case 'Children Education Allowance':
          this.setAllowance(element, this.gradeObject?.children_education_allowance);
          break;
        case 'Children Hostel Allowances':
          this.setAllowance(element, this.gradeObject?.children_hostel_allowances);
          break;
        case 'CCA':
          this.setAllowance(element, this.gradeObject?.cca);
          break;
      }
    });
  }
  updateDeducation(formValue) {
    formValue.gross_deductions.forEach(element => {
      // console.log("element.components1", element.components)
      if (element.components.startsWith('ESI')) {
        // console.log("element.components2", element.components)
        this.setAllowance(element, this.gradeObject?.esi_employee_share);
        // esiComponents.push(element);  // Append to the list
      }
    });
  }
  setAllowance(element, allowance) {
    element.monthly = Math.round(Number(allowance)) || 0;
    element.yearly = Math.round(Number(Number(allowance) * 12)) || 0;
  }
  updateFormFields(formFields) {
    const salInfoField = this.getField(formFields, 'sal-info', 'accordion');
    const deductionTable = this.getField(salInfoField.fields, 'gross-deductions', 'table');
    const grossEarningsTable = this.getField(salInfoField.fields, 'gross-earnings', 'table');
    // console.log("salInfoField", salInfoField, deductionTable, grossEarningsTable)
    this.updateLabels(formFields);
    this.updateDeductions(deductionTable);
  }
  updateLabels(formFields) {
    const salInfoField = this.getField(formFields, 'sal-info');
    // const pfEmployerField = salInfoField.fields.find((ele => ele?.name == EmployeeSalaryEnum.pf_employer))
    // const esiEmployerField = salInfoField.fields.find((ele => ele?.name == EmployeeSalaryEnum.esi_employer))
    // esiEmployerField.label = `ESI Employer Monthly(${this.gradeObject?.esi_employer_share})%`;
    // pfEmployerField.label = `PF Employer Monthly (${this.gradeObject?.pf_employer_contribution})%`;
  }
  updateDeductions(deductionTable) {
    const pfField = deductionTable.dataSource?.find(ele => ele?.components === 'PF');
    const esiField = deductionTable.dataSource?.find(ele => ele?.components === 'ESI');
    // console.log("deductionTable", deductionTable)
    if (pfField) {
      pfField.components = `PF (${this.gradeObject?.pf_employee_contribution})%`;
    }
    if (esiField) {
      esiField.components = `ESI (${this.gradeObject?.esi_employee_share})%`;
    }
  }
  getField(fields, uniqueKey, type = null) {
    const field = fields.find(ele => ele?.fieldUniqueKey === uniqueKey);
    return type ? field.fields.find(ele => ele?.type === type) : field;
  }
  async getEmployeeGradeDetails(next: any, formValue: EmployeeSalaryModel) {
    const employeeObject: any = await this.getEmployeeDetails(next);
    if (Object.keys(employeeObject)?.length) {
      if (employeeObject?.grade) {
        const gradeObject: any = await this.getGrade(employeeObject?.grade);
        if (Object.keys(gradeObject)?.length) {
          this.gradeObject = gradeObject;
        }
      }
    }
  }
  async getEmployeeDetails(next: any) {
    return await this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).toPromise();
  }
  async getGrade(next: any) {
    return await this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${next}`).toPromise();
  }
  onDeleteGrossTableRows(formValue, item, formFields) {
    // console.log("on delete gross earning", formValue, formFields, item)
    formValue?.gross_earnings.forEach((ele) => {
      this.onChangeGrossEarningsMonthlyCalculationFields(0, ele, formValue, formFields);
    })
    return { form: formValue };
  }
  // TABLE ADD Deduction
  updateTableRowsDeduction(rows: SalaryComponentsModel[]) {
    // console.log('updateTableRows', rows);
    return rows.map((row: SalaryComponentsModel) => {
      // console.log("row on selection", row)
      let GradeDeductionDetailsItem: GrossEarnings = new GrossEarnings();
      GradeDeductionDetailsItem.id = this.generateUniqueId();
      GradeDeductionDetailsItem.table_row_id = row.id;
      GradeDeductionDetailsItem.components = row.component;
      GradeDeductionDetailsItem.monthly = 0;
      GradeDeductionDetailsItem.yearly = 0;
      GradeDeductionDetailsItem.salary_component = row.id;
      return GradeDeductionDetailsItem
    })
  }

  // TABLE ADD Earnings
  updateTableRowsEarnings(rows: SalaryComponentsModel[]) {
    // console.log('updateTableRows', rows);
    return rows.map((row: SalaryComponentsModel) => {
      // console.log("row on selection", row)
      let GradeEarningsDetailsItem: GrossDeductions = new GrossDeductions();
      GradeEarningsDetailsItem.id = this.generateUniqueId();
      GradeEarningsDetailsItem.table_row_id = row.id;
      GradeEarningsDetailsItem.components = row.component;
      GradeEarningsDetailsItem.monthly = 0;
      GradeEarningsDetailsItem.yearly = 0;
      GradeEarningsDetailsItem.salary_component = row.id;
      return GradeEarningsDetailsItem
    })
  }
  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

}
