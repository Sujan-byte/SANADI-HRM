import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { LeaveMasterDetails, LeaveMasterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-master.model';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { LeaveMasterDetailsEnum, LeaveMasterEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-master.enum';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { EmployeeEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/employee-enum';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { LeaveBreakupFormConfig } from './leave-break-up.config.service';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { AvailedLeaveInfoComponent } from 'src/app/modules/hrm-master/leave-master/availed-leave-info/availed-leave-info.component';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { CustomDialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/custom-dialog/custom-dialog.component';


@Injectable({
  providedIn: 'root',
})
export class LeaveMasterFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private _customDialogService = inject(CustomDialogService);
  private readonly leaveDetailsFooterInitialize = signal([]);
  viewButtonConfig = signal({
    pageTitle: this.translate.instant('leaveBreakup_TC'),
    // url: {
    //     put: '/service/service-quotation-stages/'
    // },
    dialogConfig: {
        // height: '75%',
        width: '64%',
    },
    isShowDialog: true,
    customDialog: false,
    isFooter: false,
});
private readonly leaveBreakupConfig = inject(LeaveBreakupFormConfig);

  public readonly LeaveMasterForm =
    () =>
      (dataFromComponent?: any, initialData?: LeaveMasterModel, isEditMode?: boolean, data?: LeaveMasterModel) => {
        initialData = new LeaveMasterModel();
        let leave_master_details = isEditMode ? data.leave_master_details : [];
        leave_master_details = localStorage.getItem('is_superuser')==='true' ? leave_master_details : leave_master_details.filter(item => item.leave_type !== 'Sick Leave');
        let default_employee_object = isEditMode ? data.employee_default_object : {};
        if (leave_master_details?.length) {
          this.updateTableFooterValues(data)
        }
        else {
          this.setLeaveMasterItemFooterInitialize();
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('leaveMaster_TC'),
                fieldUniqueKey: 'leave_master_tab',
                fields: [
                  new DropdownField(this.translate, "employee", isEditMode, data, initialData, true, undefined, "employee_code_TC")
                    .addFieldWidth('24%')
                    // .addKeyValueLabelList(['employee_code', 'first_name'], 'id')
                    .addKeyValueLabel("employee_code",'id')
                    .validate(true)
                    // .onChange(this.onChangeEmployee.bind(this))
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(default_employee_object)
                    .isReadOnlyField(true)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                        params: { page_size: 30, is_active: true },
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
                  new DateField(this.translate, EmployeeEnum.doj, isEditMode, data, initialData)
                                                          .addFieldWidth('24%')
                                                          .isReadOnly(true)
                                                          .isDisabled(true)
                                                          .toObject(),
                  new TableBuilder(this.translate, LeaveMasterEnum.leave_master_details, '', true)
                    .columnSchema([
                      { name: LeaveMasterDetailsEnum.financialYear + "_TC", colWidth: '100px',filter:true },
                      { name: LeaveMasterDetailsEnum.leave_type + "_TC", colWidth: '100px',filter:true },
                      { name: LeaveMasterDetailsEnum.opening_balance + "_TC", colWidth: '100px' },
                      { name: LeaveMasterDetailsEnum.allocated_leaves + "__TC", colWidth: '100px' },
                      { name: LeaveMasterDetailsEnum.utilized_leaves + "__TC", colWidth: '100px' },
                      { name: LeaveMasterDetailsEnum.available_leaves + "__TC", colWidth: '100px' },
                      { name: LeaveMasterDetailsEnum.carry_forward_days + "_TC", colWidth: '100px' },
                      { name: LeaveMasterDetailsEnum.lapse_days + "_TC", colWidth: '100px' }
                    ])
                    .formInitialise<LeaveMasterDetails>(new LeaveMasterDetails())
                    .formSchema([
                      {
                        name: LeaveMasterDetailsEnum.financialYear,
                        type: 'input',
                        readonly:true
                      },
                      {
                        name: LeaveMasterDetailsEnum.leave_type,
                        type: 'input',
                        readonly:true
                      },
                      {
                        name: LeaveMasterDetailsEnum.opening_balance,
                        type: 'input',
                        readonly:true
                      },
                      {
                        name: LeaveMasterDetailsEnum.allocated_leaves,
                        type: 'number',
                        onValueChange: this.onChangeLeaveCalculationFields.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                      },
                      {
                        name: LeaveMasterDetailsEnum.utilized_leaves,
                        type: 'number',
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                        readonly: true
                      },
                      {
                        name: LeaveMasterDetailsEnum.available_leaves,
                        type: 'number',
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                        readonly: true
                      },
                      {
                        name: LeaveMasterDetailsEnum.carry_forward_days,
                        type: 'number',
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                        readonly: true
                      },
                      {
                        name: LeaveMasterDetailsEnum.lapse_days,
                        type: 'number',
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                        readonly: true
                      }
                    ])
                    .getDatasource<Array<LeaveMasterDetails>>('id', leave_master_details)
                    .setTableCaption(true)
                    .enableFooter(true)
                    .buttonStates(true,true,true,false,false,false)
                    .footerInitialise(this.leaveDetailsFooterInitialize())
                    .onDeleteTableRow(this.updateTableFooterValues.bind(this))
                    .isHiddenAddButton(true)
                    .setExportTableData(true)
                    .customExportTableFunction(this.customExportTableFunction.bind(this))
                    .onClickView(this.onClickView.bind(this))
                    .actionButtonConfig([
                      {
                          show: true,
                          icon: 'pi pi-exclamation-circle',
                          toolTip: 'Availed Leave Info',
                          tooltipPosition: 'top',
                          class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
                          onClick: this.onClickViewAvailedLeaveDetails.bind(this),
                      },
                    ])
                    .build(),
                  new NumberField(this.translate, LeaveMasterEnum.total_allocated_leaves, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(1)
                    .isFieldHidden(true)
                    .toObject(),
                  new NumberField(this.translate, LeaveMasterEnum.total_utilized_leaves, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(1)
                    .isFieldHidden(true)
                    .toObject(),
                  new NumberField(this.translate, LeaveMasterEnum.total_available_leaves, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setMinFractionDigits(0)
                    .setMaxFractionDigits(1)
                    .isFieldHidden(true)
                    .toObject(),
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

  onChangeEmployee(prev, next, formValue, formFields) {
    if (next) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((res: any) => {
          formValue.first_name = res?.first_name;
          formValue.last_name = res?.last_name;
          formValue.leave_master_details = [];
          this.apiService.get(`${ServiceUrlConstants.GRADE_CRUD}${res?.grade}`).subscribe((res1: any) => {
            // formValue.leave_master_details = res1?.leave_details;
            // const processInfo = formFields.find((ele) => ele?.fieldUniqueKey == 'leave_master_tab')?.fields.find((ele) => ele?.type == 'table')
            // processInfo.dataSource = formValue.leave_master_details;
            res1?.leave_details.forEach((element: any) => {
              let tableRowObject = {
                id: '',
                leave_type:'',
                number_of_leaves: '',
              }
              const id = this.generateUniqueId();
              tableRowObject.id = id;
              tableRowObject.leave_type = element.leave_type;
              tableRowObject.number_of_leaves = element.number_of_leaves;
              formValue.leave_master_details.push(tableRowObject);
            })
            console.log("formvalue",formValue);
            const processInfo = formFields.find((ele) => ele?.fieldUniqueKey == 'leave_master_tab')?.fields.find((ele) => ele?.type == 'table')
            processInfo.dataSource = formValue.leave_master_details;
          })
          resolve(formValue)
        })
      })
    }
    else {
      return formValue
    }
  }

  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  updateTableFooterValues(data: LeaveMasterModel) {

    let total_allocated_leaves: number = 0;
    let total_utilized_leaves: number = 0;
    let total_available_leaves: number = 0;
    for (const element of (data.leave_master_details ?? [])) {
      total_allocated_leaves += Number(element?.allocated_leaves ?? 0);
      total_utilized_leaves += Number(element?.utilized_leaves ?? 0);
      total_available_leaves += Number(element?.available_leaves ?? 0);
    }
    // data.total_allocated_leaves = total_allocated_leaves || 0;
    // data.total_utilized_leaves = total_utilized_leaves || 0;
    // data.total_available_leaves = total_available_leaves || 0
    const leaveDetailsFooterInitialize: any = [];
    const bonusItemTableForm = Object.keys(LeaveMasterDetailsEnum);
    bonusItemTableForm.forEach((ele, index) => {
      if (index === 0) {
        leaveDetailsFooterInitialize.push({ name: ' ' }); // Due to checkbox 
        leaveDetailsFooterInitialize.push({ name: 'Total' });
      }
      else {
        switch (ele) {
          case LeaveMasterDetailsEnum.allocated_leaves:
            leaveDetailsFooterInitialize.push({ name: total_allocated_leaves.toFixed(2) });
            break;
          case LeaveMasterDetailsEnum.utilized_leaves:
            leaveDetailsFooterInitialize.push({ name: total_utilized_leaves.toFixed(2) });
              break;
          case LeaveMasterDetailsEnum.available_leaves:
            leaveDetailsFooterInitialize.push({ name: total_available_leaves.toFixed(2) });
              break;
          default:
            leaveDetailsFooterInitialize.push({ name: '' });
        }
      }
    })
    // bonusItemFooterInitialize.push({ name: '' }); // for action buttons to cover
    this.leaveDetailsFooterInitialize.set(leaveDetailsFooterInitialize);
    return { form: data, footerInitialize: leaveDetailsFooterInitialize };
  }

  setLeaveMasterItemFooterInitialize() {
    this.leaveDetailsFooterInitialize.set([{ name: 'Total' }, { name: 0 }, { name: 0 }, { name: 0 }])
  }

  onChangeLeaveCalculationFields(event, item: LeaveMasterDetails, formValue: LeaveMasterModel) {
    item.available_leaves = Number(item.allocated_leaves)-Number(item.utilized_leaves);
    return item;
  }

  async onClickView(item, index, tableValue, formValue, dialogHandlerService){
    const updatedViewButtonConfig = signal({
      ...this.viewButtonConfig(),
      pageTitle: `${this.translate.instant('leaveBreakup_TC')} - ${item.leave_type}`, 
  });
  const response: any = await this._customDialogService.openFormDialog(updatedViewButtonConfig(), CustomDialogComponent, this.leaveBreakupConfig.LeaveBreakupDetailForm(), item?.breakup_details);
    // dialogHandlerService.openDialog(updatedViewButtonConfig(), this.leaveBreakupConfig.LeaveBreakupDetailForm(), true, item?.breakup_details);
  }

  async onClickViewAvailedLeaveDetails(item: LeaveMasterDetails, dataSource: any, index: any, formValue: LeaveMasterModel, rowField: any, formFields: any, dialogHandlerService: DialogHandlerService){
    const config = {
      pageTitle: 'Availed Leave Info',
      dialogConfig: {
        width: '42.7%',
        height: '80%',
        maximizable: false
      },
      // closeOnEscape: false,
      // closable: false,
    };
    item['employee']= formValue.employee
    console.log("item",item)
    this._customDialogService.openDialog(config, AvailedLeaveInfoComponent, item);
  }

  customExportTableFunction(formValue: LeaveMasterModel){
    const queryParams = {
      employee: formValue.employee,
      fileName: 'Leave Report Year Wise Summary'
    }
    return new Promise((resolve) => {
      this.apiService
        .getFile(`${HrmServiceUrlConstants.LEAVE_MASTER_CRUD}export_custom_excel/`, queryParams)
        .subscribe((res: any) => {
          resolve(res);
        });
    })
  }
}
