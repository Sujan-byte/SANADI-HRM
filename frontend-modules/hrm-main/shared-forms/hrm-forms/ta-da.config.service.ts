import { Injectable, ViewChild, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { OverlayPanelBuilder, TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { NumberField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/number.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ApprovalType, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import * as moment from 'moment';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { TaDaDetails, TaDaModel, TravelPlanningLogDetailsModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/ta-da.model';
import { TaDaDetailsEnum, TaDaEnum, TravelPlanningLogDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/ta-da.enum';
import { CustomDialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/custom-dialog/custom-dialog.component';
import { tadaDetailsImageFormConfig } from './tada-details-images.config.service';
import { MultiSelectField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/multiselect.builder';
import { TaDaService } from 'src/app/modules/hrm-main/ta-da/services/ta-da.service';
import { FormField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/form-builder';
import { TravelPlanningModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/travel-planning.model';
import { TableDynamicBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table-dynamic.builder';
import { TravelPlanningLogEnum } from 'src/app/modules/hrm-main/hrm-enum/travel-planning-log.enum';
import { TravelPlanningLogModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/travel-planning-log.model';
import { TableDynamicComponent } from 'src/app/modules/hrm-shared/sanadi-library/dynamic-form-generator/fields/table-dynamic/table-dynamic.component';
import { filter } from 'rxjs';
import { TravelPlanningEnum } from 'src/app/modules/hrm-main/hrm-enum/travel-planning.enum';


@Injectable({
  providedIn: 'root',
})
export class taDaFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private readonly dynamicDialogConfig = signal({})
  private readonly sharedService = inject(SharedService);
  private _customDialogService = inject(CustomDialogService);
  private readonly tadaDetailsImageFormConfig = inject(tadaDetailsImageFormConfig);
  private _taDaService = inject(TaDaService);
  private readonly tadaItemFooterInitialize = signal([]);

  defaultDocumentsDetails: any = [];
  travelPlanningIds: any = [];

  public readonly taDaForm =
    () =>
      (dataFromComponent?: any, initialData?: TaDaModel, isEditMode?: boolean, data?: TaDaModel) => {
        initialData = new TaDaModel();
        this.defaultDocumentsDetails = [
          { id: `${this.generateUniqueId()}+A`, expense_name: 'Travel Expenses' },
          { id: `${this.generateUniqueId()}+A`, expense_name: 'Food Expenses' },
          { id: `${this.generateUniqueId()}+A`, expense_name: 'Hotel Expenses' },
          { id: `${this.generateUniqueId()}+A`, expense_name: 'Other Expenses' },
        ];
        const tada_details = isEditMode ? data?.tada_details ?? this.defaultDocumentsDetails : data?.tada_details ?? this.defaultDocumentsDetails;
        // let tada_details = isEditMode ? data.tada_details : [];
        const travelPlanningLogDetails = isEditMode ? data?.travel_planning_log_details ?? [] : data?.travel_planning_log_details ?? [];
        let employee_default_object = isEditMode ? data.employee_default_object : {};
        this.travelPlanningIds = data?.travel_planning || [];
        // initialData.call_attended_date = isEditMode ? data?.call_attended_date : moment(new Date()).format('DD-MM-YYYY');
        if (tada_details?.length) {
          this.updateTableFooterValues(data)
        }
        else {
          this.setTadaItemFooterInitialize();
        }
        let isDropDowon = false;
        const user = localStorage.getItem('is_superuser');
        if (user == 'true') {
          isDropDowon = false
        }
        else {
          const default_employee_objects = {
            id: Number(localStorage.getItem('employeeId')),
            employee_code: localStorage.getItem('employeeCode'),
            first_name: localStorage.getItem('employeeFirstName'),
            designation_name: localStorage.getItem('employeeDesignationName')
          }
          employee_default_object = default_employee_objects || {}
          initialData.employee = localStorage.getItem('employeeId')
          isDropDowon = true;
        }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('TravelAllowanceDearnessAllowance_TC'),
                fieldUniqueKey: 'expense-details',
                fields: [
                  new InputField(this.translate, TaDaEnum.tada_number, isEditMode, data, initialData, undefined, this.translate.instant('autogeneratedField_TC'))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new DropdownField(this.translate, TaDaEnum.employee, isEditMode, data, initialData, true, undefined, undefined, '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['first_name', 'employee_code'], 'id')
                    .getOptions(signal([]))
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .validate(true)
                    .isReadOnly(isDropDowon)
                    .setDefaultObject(employee_default_object)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
                        params: {
                          page_size: 30,
                          is_active: true,
                          //   party_type__in: filterPartyType.toString()
                        },
                        // filterKeys: [`party_name__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, TaDaEnum.employee_first_name, isEditMode, data, initialData, undefined)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, TaDaEnum.employee_designation_name, isEditMode, data, initialData, this.translate.instant('designation_name_TC'))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, TaDaEnum.employee_department_name, isEditMode, data, initialData, this.translate.instant('department_name_TC'))
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new TableBuilder(this.translate, TaDaEnum.tada_details, '', true)
                    .columnSchema([
                      { name: TaDaDetailsEnum.expense_name + "_TC", colWidth: '150px' },
                      { name: TaDaDetailsEnum.from_date + "_TC", colWidth: '150px' },
                      { name: TaDaDetailsEnum.to_date + "_TC", colWidth: '150px' },
                      { name: TaDaDetailsEnum.cost + "_TC", colWidth: '150px' },
                    ])
                    .formInitialise<TaDaDetails>(new TaDaDetails())
                    .formSchema([
                      {
                        name: TaDaDetailsEnum.expense_name,
                        type: 'input'
                      },
                      {
                        name: TaDaDetailsEnum.from_date,
                        type: 'date',
                        format: 'DD-MM-YYYY',
                      },
                      {
                        name: TaDaDetailsEnum.to_date,
                        type: 'date',
                        format: 'DD-MM-YYYY',
                      },
                      {
                        name: TaDaDetailsEnum.cost,
                        type: 'number',
                        maxFractionDigits: 2,
                        minFractionDigits: 0,
                        onValueChange: this.onChangeCost.bind(this),
                        updateTableFooter: this.updateTableFooterValues.bind(this),
                      },
                    ])
                    .getDatasource<Array<TaDaDetails>>('id', tada_details)
                    .enableFooter(true)
                    .setAddButton(false)
                    .setTableCaptionLabel("TA/DA Details")
                    .setTableCaption(true)
                    // .setTableWidth('100vw')
                    .footerInitialise(this.tadaItemFooterInitialize())
                    .onDeleteTableRow(this.updateTableFooterValues.bind(this))
                    .actionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-upload',
                        toolTip: 'Upload Document',
                        tooltipPosition: 'top',
                        class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
                        onClick: this.onClickViewDetails.bind(this),
                      }
                    ])
                    .build(),
                  new NumberField(this.translate, TaDaEnum.total_cost, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setMaxFractionDigits(2)
                    .setMinFractionDigits(0)
                    .isReadOnly(true)
                    .toObject(),
                ],
              },
              {
                tabHeader: this.translate.instant('travel_planning_details_TC'),
                fieldUniqueKey: 'travel_planning-tab',
                fields: [
                  new TextBuilder(this.translate, TaDaEnum.travel_planning_numbers, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .actionButtonConfig([
                      {
                        show: true,
                        icon: 'pi pi-send',
                        toolTip: 'Select Travel Planning',
                        tooltipPosition: 'top',
                        class: 'p-button-help p-button-sm',
                        isDisableFunction: true,
                        disableFunction: (formValue: TaDaModel) => !formValue?.employee,
                        onClick: this.onClickTravelPlanning.bind(this),
                      },
                    ])
                    .isReadOnly(true)
                    .toObject(),
                  new MultiSelectField(this.translate, TaDaEnum.travel_planning, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .addKeyValueLabel('name', 'id')
                    .getOptions(signal([]))
                    .isFieldHidden(true)
                    .toObject(),
                  new TableDynamicBuilder(this.translate, 'travel_log_details', '', true)
                    .setTableCaption(true)
                    .setSearchHide(true)
                    .setTableCaptionLabel('Travel Log Details')
                    .columnSchema([
                      { name: TravelPlanningEnum.place_name + "_TC", field:'travel_planning__place_name', colWidth: '150px', hidefilterColumn:true},
                      { name: TravelPlanningLogDetailsEnum.checkin_date + "_TC", field: TravelPlanningLogDetailsEnum.checkin_date, colWidth: '150px', hidefilterColumn:true},
                      { name: TravelPlanningLogDetailsEnum.checkin_time + "_TC", field: TravelPlanningLogDetailsEnum.checkin_time, colWidth: '150px', hidefilterColumn:true},
                      { name: TravelPlanningLogDetailsEnum.checkin_location + "_TC", field: TravelPlanningLogDetailsEnum.checkin_location, colWidth: '200px', hidefilterColumn:true },
                      { name: TravelPlanningLogDetailsEnum.checkin_photo + "_TC", field: TravelPlanningLogDetailsEnum.checkin_photo, colWidth: '230px', hidefilterColumn:true },
                      { name: TravelPlanningLogDetailsEnum.checkout_date + "_TC", field: TravelPlanningLogDetailsEnum.checkout_date, colWidth: '150px', hidefilterColumn:true},
                      { name: TravelPlanningLogDetailsEnum.checkout_time + "_TC", field: TravelPlanningLogDetailsEnum.checkout_time, colWidth: '150px', hidefilterColumn:true},
                      { name: TravelPlanningLogDetailsEnum.checkout_location + "_TC", field: TravelPlanningLogDetailsEnum.checkout_location, colWidth: '200px', hidefilterColumn:true },
                      { name: TravelPlanningLogDetailsEnum.total_log_time + "_TC", field: TravelPlanningLogDetailsEnum.total_log_time, colWidth: '150px', hidefilterColumn:true },
                      { name: TravelPlanningLogDetailsEnum.checkout_photo + "_TC", field: TravelPlanningLogDetailsEnum.checkout_photo, colWidth: '230px', hidefilterColumn:true },
                    ])
                    .formInitialise<TravelPlanningLogDetailsModel>(new TravelPlanningLogDetailsModel())
                    .formSchema([
                      {
                        type: 'input',
                        name: TravelPlanningEnum.place_name,
                        readonly: true
                      },
                      {
                        type: 'date',
                        name: TravelPlanningLogDetailsEnum.checkin_date,
                        readonly: true
                      },
                      {
                        type: 'input',
                        name: TravelPlanningLogDetailsEnum.checkin_time,
                        readonly: true
                      },
                      {
                        type: 'textArea',
                        name: TravelPlanningLogDetailsEnum.checkin_location,
                        readonly: true
                      },
                      {
                        type: 'file',
                        name: TravelPlanningLogDetailsEnum.checkin_photo,
                        // path: '/media/hrm/tada/',
                        readonly: true
                      },
                      {
                        type: 'date',
                        name: TravelPlanningLogDetailsEnum.checkout_date,
                        readonly: true
                      },
                      {
                        type: 'input',
                        name: TravelPlanningLogDetailsEnum.checkout_time,
                        readonly: true
                      },
                      {
                        type: 'textArea',
                        name: TravelPlanningLogDetailsEnum.checkout_location,
                        readonly: true
                      },
                      {
                        type: 'input',
                        name: TravelPlanningLogDetailsEnum.total_log_time,
                        readonly: true
                      },
                      {
                        type: 'file',
                        name: TravelPlanningLogDetailsEnum.checkout_photo,
                        // path: '/media/hrm/tada/',
                        readonly: true
                      },
                    ])
                    .tableRowsCount(10)
                    .getDatasource<Array<TravelPlanningLogDetailsModel>>('id', travelPlanningLogDetails)
                    .setScrollable(true)
                    .setLazy(this.travelPlanningIds?.length ? true : false)
                    .setQueryParams({ is_active: true, travel_planning__in: this.travelPlanningIds.toString() })
                    .setUrls(`${ServiceUrlConstants.TRAVEL_PLANNING_LOG_CRUD}`)
                    .build(),
                ]
              },
            ])
        ];
      };

  updateDynamicDropdownOptions(response) {
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }


  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  onChangeEmployee(prev, next, formValue, formFields) {
    if (next) {
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((res: any) => {
          formValue.employee_first_name = res?.first_name;
          formValue.employee_department_name = res?.department_name;
          formValue.employee_designation_name = res?.designation_name;
          resolve(formValue)
        })
      })
    }
    else {
      return formValue
    }
  }

  updateTableFooterValues(data: TaDaModel) {
    // console.log("data update table footer", data)
    let totalCost: number = 0;

    const _ = require("lodash");
    _.forEach(data.tada_details, function (element: TaDaDetails, key) {
      totalCost += Number(element?.cost ?? 0);
    });

    const tadaItemFooterInitialize: any = [];
    const tadaItemTableForm = Object.values(TaDaDetailsEnum);
    tadaItemTableForm.forEach((ele, index) => {
      // console.log("ele", ele, index)
      if (index === 0) {
        tadaItemFooterInitialize.push({ name: 'Total' });
      }
      else {
        switch (ele) {
          case TaDaDetailsEnum.cost:
            tadaItemFooterInitialize.push({ name: totalCost.toFixed(2) });
            break;
          default:
            tadaItemFooterInitialize.push({ name: '' });
        }
      }
    })

    data.total_cost = Number((totalCost).toFixed(2)) || 0;

    // tadaItemFooterInitialize.push({ name: '' }); // for action buttons to cover
    this.tadaItemFooterInitialize.set(tadaItemFooterInitialize);
    // console.log("data", data.total_cost, tadaItemFooterInitialize)
    return { form: data, footerInitialize: tadaItemFooterInitialize };
  }

  setTadaItemFooterInitialize() {
    this.tadaItemFooterInitialize.set([{ name: 'Total' }, { name: "" }, { name: "" }, { name: "" }, { name: 0 }])
  }

  onChangeCost(value: any, item: TaDaDetails, formValue: any) {
    if(item.cost === null || item.cost === '' || item.cost === isNaN){
      item.cost = 0;
    }
    // console.log("value", value, item.cost)
    item.cost = Number((item.cost).toFixed(2));
    return item;
  }

  async onClickViewDetails(item: TaDaDetails, dataSource: any, index: any, formValue: TaDaModel, rowField: any, formFields: any, dialogHandlerService: DialogHandlerService) {
    this.setDynamicDialogProductImageConfig();
    const response: any = await this._customDialogService.openFormDialog(this.dynamicDialogConfig(), CustomDialogComponent, this.tadaDetailsImageFormConfig.tadaDetailsImageForm(), item);
    // const response: any = await dialogHandlerService.openDialog(this.dynamicDialogConfig(), this.tadaDetailsImageFormConfig.tadaDetailsImageForm(), true, item);
    item.tada_details_images = response?.tada_details_images?.map((ele) => {
      ele.tada_details_images = ele?.file;
      return ele;
    });
    Object.assign(
      dataSource.filter((e) => e.id === item.id)[0],
      item
    );
  }
  setDynamicDialogProductImageConfig() {
    this.dynamicDialogConfig.set({
      pageTitle: this.translate.instant('upload_TC'),
      dialogData: {},
      dialogConfig: {
        height: '88vh',
        width: '88vw'
      },
      isShowDialog: true,
      submitButtonLabel: 'Close',
      customDialog: true,
      // isFooter: true,
      hideCancelButton:true,
      // hideSaveButton:true,
      closable: false
      //   localCompService: this.productImageService,
    })
  }

  // ON CLICK TRAVEL PLANNING
  async onClickTravelPlanning(formValue: TaDaModel, field: any, formFields: any) {
    const query = { employee: formValue.employee };
    const response = await this._taDaService.addTravelPlanning(formValue, { query: query, idsList: formValue?.travel_planning || [] });
    // console.log("response", response);
    const travelPlanningList: TaDaModel[] = response?.tempArray || [];

    let travelPlanningNumbers: string[] = [];
    let travelPlanningIds: string[] = [];

    const _ = require("lodash");
    _.forEach(travelPlanningList, (element: TravelPlanningModel) => {
      travelPlanningNumbers.push(element?.plan_number || '');
      travelPlanningIds.push(element?.id);
    });

    formValue.travel_planning_numbers = travelPlanningNumbers.join(', ');
    formValue.travel_planning = travelPlanningIds;

    // let travelPlanningDetails: any = await this.travelPlanningDetailsByIds(travelPlanningIds);
    //  this.apiService.get(`${ServiceUrlConstants.TRAVEL_PLANNING_LOG_CRUD}`, {
    //   travel_planning__in: travelPlanningIds.toString(),
    // });
    // travelPlanningDetails = travelPlanningDetails?.results || [];
    const travelPlanningLogField = formFields.find((ele) => ele?.fieldUniqueKey == 'travel_planning-tab')?.fields.find((ele) => ele?.type == 'table-dynamic');
    // console.log("travelPlanningDetails", travelPlanningLogField,travelPlanningIds.toString());
    travelPlanningLogField.queryParams['travel_planning__in'] = travelPlanningIds.toString();
    travelPlanningLogField.lazy = travelPlanningIds?.length ? true : false;
    travelPlanningLogField.list = [];
    if (travelPlanningIds?.length) {
      this.sharedService.sendTrigger('table-dynamic');
    }
    // console.log("dataSource", details.dataSource, formValue.travel_planning_log_details)

    return formValue;
  }

  // async travelPlanningDetailsByIds(ids: any) {
  //   return this.apiService.get(`${ServiceUrlConstants.TRAVEL_PLANNING_LOG_CRUD}`, {
  //     travel_planning__in: ids.toString(),
  //   }).toPromise();
  // }

}
