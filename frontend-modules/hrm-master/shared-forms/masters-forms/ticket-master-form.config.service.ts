import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { TicketMasterDetails, TicketMasterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/ticket-master.model';
import { TicketHistoryDetailsEnum, TicketMasterEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/ticket-master.enum';
import { GlobalMasterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/global-master-from.config.service';


@Injectable({
    providedIn: 'root',
})
export class TicketMasterFormConfig {
    private translate = inject(TranslateService);
    private MONTHS = signal([
        {"id": "January", "name": "January"},
        {"id": "February", "name": "February"},
        {"id": "March", "name": "March"},
        {"id": "April", "name": "April"},
        {"id": "May", "name": "May"},
        {"id": "June", "name": "June"},
        {"id": "July", "name": "July"},
        {"id": "August", "name": "August"},
        {"id": "September", "name": "September"},
        {"id": "October", "name": "October"},
        {"id": "November", "name": "November"},
        {"id": "December", "name": "December"}
    ])
    private readonly globalMasterForm = inject(GlobalMasterFormConfig);
    private readonly globalMasterConfig = signal({})
    
    public readonly TicketMasterForm =
        () =>
            (dataFromComponent?: any, initialData?: TicketMasterModel, isEditMode?: boolean, data?: TicketMasterModel) => {
                initialData = new TicketMasterModel();
                let default_employee_object = isEditMode ? data.employee_default_object : {};
                let default_ticket_sector_object = this.getGlobalDefaultObj(isEditMode, data?.ticket_sector);
                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('TicketMaster_TC'),
                                fieldUniqueKey: 'ticket-master-tab',
                                fields: [
                                    new DropdownField(this.translate, TicketMasterEnum.employee, isEditMode, data, initialData, true, undefined, "employee_code_TC")
                                    .addFieldWidth('24%')
                                    .addKeyValueLabelList(['employee_code', 'first_name'], 'id')
                                    .validate(true)
                                    .getOptions(signal([]))
                                    .isLazyFilterDropDown(true)
                                    .isNeedRequiredFields(true)
                                    .setDefaultObject(default_employee_object)
                                    .getUrlConfig({
                                      get: {
                                        url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                                        params: { page_size: 30, is_active: true },
                                        filterKeys: [`employee__${FilterOptions.istartsWith}`]
                                      }
                                    })
                                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                                    .toObject(),
                                    new DropdownField(this.translate, TicketMasterEnum.ticket_sector, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                                                                            .addFieldWidth('24%')
                                                                            .addKeyValueLabel('name', 'id')
                                                                            .addDynamicDialogConfig({
                                                                                config: this.globalMasterConfig(),
                                                                                isEditMode: true,
                                                                                data: { global_key: 'ticket_sector' },
                                                                                formConfig: this.globalMasterForm.GlobalMasterForm()
                                                                            })
                                                                            .saveData(this.saveDynamicDropdownData.bind(this, 'ticket_sector'))
                                                                            .getOptions(signal([]))
                                                                            .isLazyFilterDropDown(true)
                                                                            .setDefaultObject(default_ticket_sector_object)
                                                                            .getUrlConfig({
                                                                                post: {
                                                                                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                                                                                },
                                                                                get: {
                                                                                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                                                                                    params: {
                                                                                        page_size: 30, is_active: true, global_key: 'ticket_sector'
                                                                                    },
                                                                                }
                                                                            })
                                                                            .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                                                                            .toObject(),
                                    new DropdownField(this.translate, TicketMasterEnum.ticket_eligible_month, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                                                                            .addFieldWidth('24%')
                                                                            .addKeyValueLabel('id', 'name')
                                                                            .getOptions(this.MONTHS)
                                                                            .toObject(),
                                    new InputField(this.translate, TicketMasterEnum.last_ticket_availed, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .toObject(),
                                    new InputField(this.translate, TicketMasterEnum.next_ticket_eligible_period, isEditMode, data, initialData)
                                        .addFieldWidth('24%')
                                        .toObject(),

                                    new TableBuilder(this.translate, TicketMasterEnum.ticket_histories, 'Ticket History', true)
                                        .columnSchema([
                                            { name: TicketHistoryDetailsEnum.availed_date + "_TC", colWidth: '200px' },
                                            { name: TicketHistoryDetailsEnum.last_ticket_sector + "_TC", colWidth: '200px' },
                                            { name: TicketHistoryDetailsEnum.last_ticket_eligible_month + "_TC", colWidth: '200px' },
                                            { name: TicketHistoryDetailsEnum.last_ticket_availed + "_TC", colWidth: '200px' }
                                        ])
                                        .formInitialise<TicketMasterDetails>(new TicketMasterDetails())
                                        .formSchema([
                                            {
                                                name: TicketHistoryDetailsEnum.availed_date,
                                                type: 'input',
                                                readonly: true
                                            },
                                            {
                                                name: TicketHistoryDetailsEnum.last_ticket_sector,
                                                type: 'input',
                                                readonly: true
                                            },
                                            {
                                                name: TicketHistoryDetailsEnum.last_ticket_eligible_month,
                                                type: 'input',
                                                readonly: true
                                            },
                                            {
                                                name: TicketHistoryDetailsEnum.last_ticket_availed,
                                                type: 'input',
                                                readonly: true
                                            },
                                        ])
                                        .getDatasource<Array<TicketMasterDetails>>('id', data?.[TicketMasterEnum.ticket_histories]||[])
                                        .isHiddenAddButton(true)
                                        .buttonStates(true,true)
                                        .build()
                                ]
                            }
                        ])
                ];
            };

    updateDynamicDropdownOptions(response) {
        if (response?.results?.length) {
            const options = (<any>response)?.results;
            return options;
        }
    }

    updateDynamicGlobalMasterDropdownOptions(response) {
        console.log("response", response)
        if (response?.results?.length) {
            const options = (<any>response)?.results[0]?.global_value;
            return options;
        }
    }

    saveDynamicDropdownData(attribute: any, event: any, form: any) {
        console.log("attribute", attribute, event, form)
        return { data: event, attribute: attribute }
    }

    getGlobalDefaultObj(isEditMode, data) {
        if (isEditMode) {
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
