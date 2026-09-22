import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { FileField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/file.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DisciplinaryActionEnum } from 'src/app/modules/hrm-main/hrm-enum/disciplinary-action.enum';
import { DisciplinaryActionModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/disciplinary-action.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { GlobalMasterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/global-master-from.config.service';

@Injectable({
    providedIn: 'root',
})
export class DisciplinaryActionFormConfig {
    private translate         = inject(TranslateService);
    private permissionService = inject(NgxPermissionsService);
    private globalMasterForm  = inject(GlobalMasterFormConfig);

    // Config for the "create violation type" inline dialog
    private readonly globalMasterConfig = signal({
        dialogData: {},
        dialogConfig: { height: '40%', width: '35%' },
        isShowDialog: true,
    });

    // Reusable signal for the violation-type dropdown options
    private violationList = signal([]);

    private readonly penaltyTypes = signal([
        { key: 'Verbal Warning',           value: 'verbal_warning'  },
        { key: 'Written Warning',          value: 'written_warning' },
        { key: 'Show Cause Notice',        value: 'show_cause'      },
        { key: 'Pay Deduction',            value: 'pay_deduction'   },
        { key: 'Suspension Without Pay',   value: 'suspension'      },
        { key: 'Termination',              value: 'termination'     },
    ]);

    public readonly DisciplinaryActionForm =
        () =>
        (dataFromComponent?: any, initialData?: DisciplinaryActionModel, isEditMode?: boolean, data?: DisciplinaryActionModel) => {
            initialData = new DisciplinaryActionModel();
            const userId = localStorage.getItem('user_id');
            const isHR = !!this.permissionService.getPermission('hrm_main.custom_can_approve_disciplinary_action');

            const defaultEmployee = isEditMode && data?.employee
                ? { id: data.employee, employee_code: data.employee_code, first_name: data.employee_name }
                : {};

            // Default object for violation_type create+dropdown (stored as name string)
            const defaultViolationType = isEditMode && data?.violation_type
                ? { name: data.violation_type }
                : {};

            // Show date range only for pay-affecting penalties
            const affectsPay = isEditMode
                ? ['pay_deduction', 'suspension'].includes(data?.penalty_type)
                : false;

            return [
                new TabBuilder(this.translate)
                    .addTabFields([
                        {
                            tabHeader: this.translate.instant('disciplinaryAction_TC'),
                            fieldUniqueKey: 'da-tab',
                            fields: [
                                {
                                    type: 'accordion',
                                    multiple: true,
                                    accordionStyle: { 'width': '100%' },
                                    fieldUniqueKey: 'da-accordion',
                                    fields: [
                                        {
                                            // @ts-ignore
                                            accordionHeader: this.translate.instant('generalDetails_TC'),
                                            fieldUniqueKey: 'da-general',
                                            selected: true,
                                            fields: [
                                                new InputField(this.translate, DisciplinaryActionEnum.referenceNo, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .isReadOnly(true)
                                                    .toObject(),

                                                new DropdownField(this.translate, DisciplinaryActionEnum.employee, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', 'employee_code_TC', '23.5vw')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabelList(['employee_code', 'first_name'], 'id')
                                                    .validate(true)
                                                    .getOptions(signal([]))
                                                    .isLazyFilterDropDown(true)
                                                    .isNeedRequiredFields(true)
                                                    .setRequiredFields('id,employee_code,first_name')
                                                    .setDefaultObject(defaultEmployee)
                                                    .getUrlConfig({
                                                        get: {
                                                            url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                                                            params: isHR
                                                                ? { page_size: 30, is_active: true }
                                                                : { page_size: 30, is_active: true, user__id: userId },
                                                            filterKeys: [`employee__${FilterOptions.istartsWith}`],
                                                        }
                                                    })
                                                    .bindOption(this.updateDropdownOptions.bind(this))
                                                    .toObject(),

                                                // Violation Type — create + dropdown (same pattern as employee_type)
                                                new DropdownField(this.translate, DisciplinaryActionEnum.violationType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', 'violationType_TC')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('name', 'name')
                                                    .validate(false)
                                                    .addDynamicDialogConfig({
                                                        config: this.globalMasterConfig(),
                                                        isEditMode: true,
                                                        data: { global_key: 'violation_type', label: 'violationType' },
                                                        formConfig: this.globalMasterForm.GlobalMasterForm()
                                                    })
                                                    .saveData(this.saveViolationTypeData.bind(this))
                                                    .getOptions(this.violationList)
                                                    .isLazyFilterDropDown(true)
                                                    .setDefaultObject(defaultViolationType)
                                                    .getUrlConfig({
                                                        post: {
                                                            url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                                                        },
                                                        get: {
                                                            url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                                            params: {
                                                                page_size: 30, is_active: true, global_key: 'violation_type'
                                                            },
                                                        }
                                                    })
                                                    .bindOption(this.updateViolationTypeOptions.bind(this))
                                                    .toObject(),

                                                new DropdownField(this.translate, DisciplinaryActionEnum.penaltyType, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC', 'penaltyType_TC')
                                                    .addFieldWidth('24%')
                                                    .addKeyValueLabel('key', 'value')
                                                    .validate(true)
                                                    .getOptions(this.penaltyTypes)
                                                    .onChangeOnly(this.onChangePenaltyType.bind(this))
                                                    .toObject(),

                                                new DateField(this.translate, DisciplinaryActionEnum.fromDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(false)
                                                    .isFieldHidden(!affectsPay)
                                                    .toObject(),

                                                new DateField(this.translate, DisciplinaryActionEnum.toDate, isEditMode, data, initialData)
                                                    .addFieldWidth('24%')
                                                    .validate(false)
                                                    .isFieldHidden(!affectsPay)
                                                    .toObject(),

                                                new FileField(this.translate, DisciplinaryActionEnum.attachment, isEditMode, data, initialData, 'supportingDocument_TC')
                                                    .addFieldWidth('49%')
                                                    .toObject(),

                                                new TextBuilder(this.translate, DisciplinaryActionEnum.description, isEditMode, data, initialData, 'description_TC')
                                                    .addFieldWidth('99%')
                                                    .validate(false, 1, 1000)
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

    onChangePenaltyType(prev: any, next: any, formValue: any, formFields: any): any {
        const affectsPay = ['pay_deduction', 'suspension'].includes(next);
        const getField = (name: string) =>
            formFields
                ?.find(f => f?.fieldUniqueKey === 'da-tab')
                ?.fields?.find(f => f?.fieldUniqueKey === 'da-accordion')
                ?.fields?.find(f => f?.fieldUniqueKey === 'da-general')
                ?.fields?.find(f => f?.name === name);

        const fromField = getField(DisciplinaryActionEnum.fromDate);
        const toField   = getField(DisciplinaryActionEnum.toDate);
        if (fromField) fromField.hidden = !affectsPay;
        if (toField)   toField.hidden   = !affectsPay;
        if (!affectsPay) {
            formValue[DisciplinaryActionEnum.fromDate] = null;
            formValue[DisciplinaryActionEnum.toDate]   = null;
        }
        return formValue;
    }

    saveViolationTypeData(event: any, form: any) {
        return { data: event, attribute: 'violation_type' };
    }

    updateDropdownOptions(response: any) {
        return response?.results ?? [];
    }

    updateViolationTypeOptions(response: any) {
        if (response?.results?.length) {
            return response.results[0]?.global_value ?? [];
        }
        return [];
    }
}
