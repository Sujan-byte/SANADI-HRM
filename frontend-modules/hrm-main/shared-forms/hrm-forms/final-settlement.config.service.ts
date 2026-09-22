import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { GratuityModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/gratuity.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import * as moment from 'moment';
import { FinalSettlementAllowanceEnum, FinalSettlementDeductionsEnum, FinalSettlementEnum } from 'src/app/modules/hrm-main/hrm-enum/final-settlement-enum';
import { FinalSettlementAllowance, FinalSettlementDeductions, FinalSettlementModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/final-settlement.model';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';



@Injectable({
    providedIn: 'root',
})
export class finalSettlementConfig {
    private translate = inject(TranslateService);
    private apiService = inject(ApiService);
    private readonly allowanceFooterInitialize = signal([]);
    private readonly DeductionsFooterInitialize = signal([]);
    fixedGrossEarningList: any = signal([])
    fixedGrossDeductionsList: any = signal([])
    private readonly noticePeriodList = signal([
        {
            key: 'Given',
            value: 'Given'
        },
        {
            key: 'Not Given',
            value: 'not Given'
        }
    ]);
    private readonly relievingCertificateList = signal([
        {
            key: 'Yes',
            value: 'Yes'
        },
        {
            key: 'No',
            value: 'No'
        }
    ]);
    // Employee onchange
    onChangeEmployee(prev, next, formValue, formFields) {
        const deductionTable = formFields
            .find(ele => ele?.fieldUniqueKey === 'final-sal-info')?.fields
            .find(ele => ele?.type === "accordion")?.fields
            .find(ele => ele?.fieldUniqueKey === 'final-gross-deductions')?.fields
            .find(ele => ele?.type === 'table');

        return new Promise((resolve) => {
            this.apiService.get(`${ServiceUrlConstants.FINAL_SETTLEMENT_CRUD}/employee_final_settlement?employee=${next}`).subscribe((response: any) => {
                if (response) {
                    formValue.gross_Salary_Payable_days = 0
                    // Set employee details in formValue
                    formValue.employee_name = response.employee_details?.first_name || '';
                    formValue.dob = response.employee_details?.dob || null;
                    formValue.doc = response.employee_details?.doc || null;
                    formValue.doj = response.employee_details?.doj || null;
                    formValue.dor = response.employee_details?.dor || null;
                    formValue.mobile_no = response.employee_details?.mobile_no || '';
                    formValue.department_name = response.employee_details?.department__department_name || '';
                    formValue.designation_name = response.employee_details?.designation__designation_name || '';
                    formValue.grade_code = response.employee_details?.grade__grade_code || '';

                    formValue.gross_salary_month = response.employee_allowance_montly_sum || 0;
                    formValue.net_salary_month = response.net_Amount_monthly || 0;
                    formValue.final_settlement_deduction = response.employee_deduction_details || [];
                    formValue.copy_final_settlement_deduction = response.employee_deduction_details || [];
                    let updateTable = this.updateGrossDeductionsTableFooterValues(formValue);
                    if (deductionTable) {
                        deductionTable.dataSource = formValue?.final_settlement_deduction || [];
                        deductionTable.footerInitialise = updateTable.footerInitialize;
                    }
                    if (formValue.dor)
                        // Call onChangedor method
                        this.onChangedor(prev, formValue.dor, formValue, []);
                }
                resolve(formValue);
            });
        });

    }

    saveDynamicDropdownData(attribute: any, event: any, form: any) {
        return { data: event, attribute: attribute }
    }

    updateDynamicDropdownOptions(response) {
        if (response?.results?.length) {
            const options = (<any>response)?.results;
            return options;
        }
    }

    onChangedor(prev, next, formValue, formFields) {
        const dor = formFields.find((ele) => ele.fieldUniqueKey == 'final-sal-info')?.fields.find((ele) => ele?.name == 'dor');
        let total_experience = formFields.find((ele) => ele.fieldUniqueKey == 'final-sal-info')?.fields.find((ele) => ele?.name == 'total_experience');
        if (dor?.value !== next && next !== '') {
            // console.log("dor", dor, total_experience)
            if (formValue.dor && formValue.doj) {
                const doj = moment(formValue.doj, 'DD-MM-YYYY');
                const dor = moment(formValue.dor, 'DD-MM-YYYY');
                const years = dor.diff(doj, 'years');
                doj.add(years, 'years');
                const months = dor.diff(doj, 'months');
                doj.add(months, 'months');
                const days = dor.diff(doj, 'days');
                formValue.total_experience = `${years} Year(s) ${months} Month(s) ${days} Day(s)`;
                this.onChangeGrossSalaryPayableDays(prev, formValue.gross_salary_payable_days, formValue, formFields)
                return formValue;
            }
        }

    }

    onChangeDateOfResignationLtrReceived(prev, next, formValue, formFields) {
        const date_of_resignation_lt_received = formFields.find((ele) => ele.fieldUniqueKey == 'final-sal-info')?.fields.find((ele) => ele?.name == 'date_of_resignation_lt_received');
        if (date_of_resignation_lt_received?.value !== next && next !== '') {
            let dorDate = new Date(next.split('-').reverse().join('-')); // Assuming next is in DD-MM-YYYY format
            dorDate.setMonth(dorDate.getMonth() + 1);
            const formattedDate = dorDate.toLocaleDateString('en-GB').replace(/\//g, '-');
            formValue.dor = formattedDate;
            this.onChangedor(prev, formValue.dor, formValue, formFields)
            return formValue;
        }
    }

    generateUniqueId() {
        return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
    }


    onChangeGrossSalaryPayableDays(prev, next, formValue: FinalSettlementModel, formFields) {
        // Find the deduction table fields
        const deductionTable = formFields
            ?.find(ele => ele?.fieldUniqueKey === 'final-sal-info')?.fields
            ?.find(ele => ele?.type === "accordion")?.fields
            ?.find(ele => ele?.fieldUniqueKey === 'final-gross-deductions')?.fields
            ?.find(ele => ele?.type === 'table');

        // Handle invalid or zero 'next' values
        if (!next || isNaN(next) || next <= 0 || next == null) {
            formValue.final_settlement_deduction = [...(formValue?.copy_final_settlement_deduction || [])];
            if (deductionTable) {
                deductionTable.dataSource = [...(formValue?.copy_final_settlement_deduction || [])];
                const updatedTable = this.updateGrossDeductionsTableFooterValues(formValue);
                deductionTable.footerInitialise = updatedTable?.footerInitialize;
            } else {
                this.updateGrossDeductionsTableFooterValues(formValue);
            }
            return formValue;
        }

        // Process valid 'next' values
        if (!isNaN(next) && next) {
            const dor = moment(formValue?.dor, 'DD-MM-YYYY');
            if (!dor.isValid()) {
                console.error('Invalid date format for dor');
                return formValue;
            }

            const daysInMonth = dor.daysInMonth();
            const grossSalaryMonth = Number(formValue.gross_salary_month || 0);
            const grossAmountPerDay = daysInMonth > 0 ? (grossSalaryMonth / daysInMonth) : 0;

            // Update gross salary payable amount
            formValue.gross_salary_payable_amount = Math.round(grossAmountPerDay * next) || 0;

            // Create a new array based on copy_final_settlement_deduction and update its values
            const updatedDeductions = (formValue?.copy_final_settlement_deduction || []).map(element => {
                if (element.components === 'Salary Advance') {
                    // Skip calculation for 'Salary Advance' component
                    return { ...element };
                }
                const amountPerDay = daysInMonth > 0 ? (Number(element.monthly || 0) / daysInMonth) : 0;
                return {
                    ...element,
                    monthly: Math.round(amountPerDay * next),
                };
            });

            // Update the deductions in formValue
            formValue.final_settlement_deduction = updatedDeductions;

            // Update deduction table
            if (deductionTable) {
                deductionTable.dataSource = [...updatedDeductions];
                const updatedTable = this.updateGrossDeductionsTableFooterValues(formValue);
                deductionTable.footerInitialise = updatedTable?.footerInitialize;
            }
        }

        return formValue;
    }




    public readonly finalSettlementForm =
        () =>
            (dataFromComponent?: any, initialData?: FinalSettlementModel, isEditMode?: boolean, data?: FinalSettlementModel) => {
                initialData = new FinalSettlementModel();
                let default_employee_object = isEditMode ? data.default_employee_object : {};
                let final_settlement_allowance = isEditMode ? data?.final_settlement_allowance : [];
                let final_settlement_deduction = isEditMode ? data?.final_settlement_deduction : [];
                console.log("final_settlement_allowance", final_settlement_allowance, final_settlement_deduction)
                if (final_settlement_allowance?.length) {
                    this.updateGrossAllowanceTableFooterValues(data)
                }
                else {
                    this.setAllowanceFooterInitialize();
                }
                if (final_settlement_deduction?.length) {
                    this.updateGrossDeductionsTableFooterValues(data)
                }
                else {
                    this.setDeductionsFooterInitialize();
                }
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('details_TC'),
                                fieldUniqueKey: 'final-sal-info',
                                fields: [
                                    new DropdownField(this.translate, FinalSettlementEnum.employee, isEditMode, data, initialData, true, undefined, "employee_code_TC", '23vw')
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
                                                params: { page_size: 30, is_active: true },
                                                filterKeys: [`employee_code__${FilterOptions.iContains}&first_name__${FilterOptions.iContains}`]
                                            }
                                        })
                                        .bindOption(this.updateDynamicDropdownOptions.bind(this))
                                        .toObject(),
                                    new DateField(this.translate, FinalSettlementEnum.dob, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        // .addFormat("yy-mm-dd")
                                        .isReadOnly(true)
                                        .toObject(),

                                    new DateField(this.translate, FinalSettlementEnum.doj, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        .toObject(),
                                    new InputField(this.translate, FinalSettlementEnum.department_name, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        .toObject(),
                                    new InputField(this.translate, FinalSettlementEnum.copy_final_settlement_deduction, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        .isFieldHidden(true)
                                        .toObject(),

                                    new InputField(this.translate, FinalSettlementEnum.designation_name, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        .toObject(),
                                    new InputField(this.translate, FinalSettlementEnum.grade_code, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .isReadOnly(true)
                                        .toObject(),
                                    new DateField(this.translate, FinalSettlementEnum.date_of_resignation_lt_received, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .onChange(this.onChangeDateOfResignationLtrReceived.bind(this))
                                        .toObject(),
                                    new DateField(this.translate, FinalSettlementEnum.dor, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .onChange(this.onChangedor.bind(this))
                                        .toObject(),
                                    new DropdownField(this.translate, FinalSettlementEnum.notice_period, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                        .addFieldWidth('24%')
                                        .addKeyValueLabel('key', 'value')
                                        .getOptions(this.noticePeriodList)
                                        .toObject(),
                                    new InputField(this.translate, FinalSettlementEnum.total_experience, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .toObject(),
                                    new DropdownField(this.translate, FinalSettlementEnum.relieving_certificate, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                        .addFieldWidth('24%')
                                        .addKeyValueLabel('key', 'value')
                                        .getOptions(this.relievingCertificateList)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.gross_salary_month, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMinFractionDigits(0)
                                        .setMaxFractionDigits(2)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.net_salary_month, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMinFractionDigits(0)
                                        .setMaxFractionDigits(2)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.earned_leaves_balance, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMinFractionDigits(0)
                                        .setMaxFractionDigits(2)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.gross_salary_payable_days, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .onChangeOnly(this.onChangeGrossSalaryPayableDays.bind(this))
                                        .setMaxFractionDigits(0)
                                        .setMaxFractionDigits(0)

                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.gross_salary_payable_amount, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMaxFractionDigits(0)
                                        .setMaxFractionDigits(0)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.total_payable_amount, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMaxFractionDigits(0)
                                        .setMaxFractionDigits(0)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.allowance_total, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMaxFractionDigits(0)
                                        .setMaxFractionDigits(0)
                                        .isFieldHidden(true)
                                        .toObject(),
                                    new NumberField(this.translate, FinalSettlementEnum.deduction_total, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .setMaxFractionDigits(0)
                                        .setMaxFractionDigits(0)
                                        .isFieldHidden(true)
                                        .toObject(),
                                    {
                                        type: 'accordion',
                                        multiple: true,
                                        fields: [
                                            {
                                                // @ts-ignore
                                                accordionHeader: this.translate.instant('deductions_TC'),
                                                fieldUniqueKey: 'final-gross-deductions',
                                                selected: true,
                                                fields: [
                                                    new TableBuilder(this.translate, FinalSettlementEnum.final_settlement_deduction, '', true)
                                                        .columnSchema([
                                                            { name: FinalSettlementDeductionsEnum.components + "_TC", colWidth: '200px' },
                                                            { name: FinalSettlementDeductionsEnum.monthly + "_TC", colWidth: '200px' },
                                                        ])
                                                        .formInitialise<FinalSettlementDeductions>(new FinalSettlementDeductions())
                                                        .formSchema([
                                                            {
                                                                name: FinalSettlementDeductionsEnum.components,
                                                                type: 'input'
                                                            },
                                                            {
                                                                name: FinalSettlementDeductionsEnum.monthly,
                                                                type: 'number',
                                                                onValueChange: this.onChangeMonthlyDeductionsCalculationFields.bind(this),
                                                                updateTableFooter: this.updateGrossDeductionsTableFooterValues.bind(this),
                                                                maxFractionDigits: 0,
                                                                minFractionDigits: 0,
                                                            },

                                                        ])
                                                        .getDatasource<Array<FinalSettlementDeductions>>('id', final_settlement_deduction)
                                                        .enableFooter(true)
                                                        .footerInitialise(this.DeductionsFooterInitialize())
                                                        .onDeleteTableRow(this.updateGrossDeductionsTableFooterValues.bind(this))
                                                        .setAddButton(false)
                                                        .setTableWidth('92vw')
                                                        .build(),
                                                ]
                                            },
                                            {
                                                // @ts-ignore
                                                accordionHeader: this.translate.instant('additionAllowance_TC'),
                                                fieldUniqueKey: 'final-gross-earnings',
                                                selected: true,
                                                fields: [
                                                    new TableBuilder(this.translate, FinalSettlementEnum.final_settlement_allowance, '', true)
                                                        .columnSchema([
                                                            { name: FinalSettlementAllowanceEnum.components + "_TC", colWidth: '200px' },
                                                            { name: FinalSettlementAllowanceEnum.monthly + "_TC", colWidth: '200px' },

                                                        ])
                                                        .formInitialise<FinalSettlementAllowance>(new FinalSettlementAllowance())
                                                        .formSchema([
                                                            {
                                                                name: FinalSettlementAllowanceEnum.components,
                                                                type: 'input',
                                                            },
                                                            {
                                                                name: FinalSettlementAllowanceEnum.monthly,
                                                                type: 'number',
                                                                onValueChange: this.onChangeMonthlyAllowanceCalculationFields.bind(this),
                                                                updateTableFooter: this.updateGrossAllowanceTableFooterValues.bind(this),
                                                                minFractionDigits: 0,
                                                                maxFractionDigits: 0,
                                                            },

                                                        ])
                                                        .getDatasource<Array<FinalSettlementAllowance>>('id', final_settlement_allowance)
                                                        .enableFooter(true)
                                                        .footerInitialise(this.allowanceFooterInitialize())
                                                        .onDeleteTableRow(this.updateGrossAllowanceTableFooterValues.bind(this))
                                                        .setAddButton(false)
                                                        .setTableWidth('92vw')
                                                        .build(),
                                                ]
                                            },

                                        ]
                                    },

                                ],
                            }
                        ])
                ];
            };
    setDeductionsFooterInitialize() {
        this.DeductionsFooterInitialize.set([{ name: 'Gross Deduction' }, { name: "" }, { name: 0 }])
    }
    setAllowanceFooterInitialize() {
        this.allowanceFooterInitialize.set([{ name: 'Gross Allowance' }, { name: "" }, { name: 0 }])
    }
    onChangeMonthlyDeductionsCalculationFields(value, item: FinalSettlementDeductions, formValue: FinalSettlementModel) {
        const monthly = (item?.monthly ?? 0);
        item.monthly = Number(Math.round(monthly));
        return item;
    }
    updateGrossDeductionsTableFooterValues(data: FinalSettlementModel) {
        let deductionMonthlyTotal: number = 0;
        const _ = require("lodash");
        _.forEach(data.final_settlement_deduction, function (element: FinalSettlementAllowance, key) {
            deductionMonthlyTotal += Number(element?.monthly ?? 0);
        });
        const DeductionsFooterInitialize: any = [];
        const finalSettlementForm = Object.values(FinalSettlementDeductionsEnum);

        finalSettlementForm.forEach((ele, index) => {
            if (index === 0) {
                DeductionsFooterInitialize.push({ name: 'Total' });
            }
            else {
                switch (ele) {
                    case FinalSettlementDeductionsEnum.monthly:
                        DeductionsFooterInitialize.push({ name: deductionMonthlyTotal });
                        break;
                    default:
                        // console.log("ele", ele);
                        DeductionsFooterInitialize.push({ name: '' });
                }
            }
        })

        data.deduction_total = deductionMonthlyTotal
        data.total_payable_amount = Math.round(Number(data.gross_salary_payable_amount || 0) - Number(data.deduction_total));
        DeductionsFooterInitialize.push({ name: '' });
        this.DeductionsFooterInitialize.set(DeductionsFooterInitialize);
        console.log("deduction_total", data, data.total_payable_amount, deductionMonthlyTotal)
        return { form: data, footerInitialize: DeductionsFooterInitialize };
    }

    onChangeMonthlyAllowanceCalculationFields(value, item: FinalSettlementDeductions, formValue: FinalSettlementModel) {
        const monthly = (item?.monthly ?? 0);
        item.monthly = Number(Math.round(monthly));
        return item;
    }

    updateGrossAllowanceTableFooterValues(data: FinalSettlementModel) {
        let allowanceMonthlyTotal: number = 0;
        const _ = require("lodash");
        _.forEach(data.final_settlement_allowance, function (element: FinalSettlementAllowance, key) {
            allowanceMonthlyTotal += Number(element?.monthly ?? 0);
        });
        const allowanceMonthlyTotalInitialize: any = [];
        const finalSettlementForm = Object.values(FinalSettlementAllowanceEnum);

        finalSettlementForm.forEach((ele, index) => {
            if (index === 0) {
                allowanceMonthlyTotalInitialize.push({ name: 'Total' });
            }
            else {
                switch (ele) {
                    case FinalSettlementAllowanceEnum.monthly:
                        allowanceMonthlyTotalInitialize.push({ name: allowanceMonthlyTotal });
                        break;
                    default:
                        // console.log("ele", ele);
                        allowanceMonthlyTotalInitialize.push({ name: '' });
                }
            }
        })
        data.allowance_total = allowanceMonthlyTotal
        allowanceMonthlyTotalInitialize.push({ name: '' });
        this.allowanceFooterInitialize.set(allowanceMonthlyTotalInitialize);
        return { form: data, footerInitialize: allowanceMonthlyTotalInitialize };
    }
}
