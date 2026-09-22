import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiService } from 'src/app/core/services/api.service';
import { EmployeeEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/employee-enum';
import { PasswordFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/password-form.config.service';
import { DynamicTableModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { SecurityUser } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/employee.model';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DynamicTableComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';
import { MultiSelectTableComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/multi-select-table/multi-select-table.component';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  public _dialogHandlerService = inject(DialogHandlerService);
  public _apiService = inject(ApiService);
  private _sharedService = inject(SharedService);
  private _spinner = inject(NgxSpinnerService);
  private translate = inject(TranslateService);
  public _customDialogService = inject(CustomDialogService);


  constructor() { }

  public readonly onSaveFormData =
    (formData: FormData, formFields) => {
      console.log("form_data", formData)
      const updatedFormData = new FormData();
      const imageKeys = [EmployeeEnum.profileImage];
      console.log("image keys", imageKeys);
      const accordionImageKeys = [
        { key: 'passport_image', accordionHeader: 'Passport Details' },
        { key: 'passport_image_back', accordionHeader: 'Passport Details' },
        { key: 'visa_image', accordionHeader: 'Visa Details' },
        { key: 'emirates_image', accordionHeader: 'Emirates ID Details' },
        { key: 'emirates_image_back', accordionHeader: 'Emirates ID Details' },
        { key: 'labour_card_image', accordionHeader: 'Labour Card Details' },
        { key: 'fhc_image', accordionHeader: 'Medical health insurance Details' },
        { key: 'insurance_image', accordionHeader: 'Job Loss Insurance Details' },
      ];
      Object.entries(formData).forEach(([key, value]) => {
        if (!(imageKeys.includes(key as EmployeeEnum) || accordionImageKeys.some((ele) => ele?.key == key))) {
          updatedFormData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });

      if (formFields) {
        const appendFiles = (fieldUniqueKey, enumKey) => {
          const field = formFields[0]?.fields
            .find(ele => ele?.fieldUniqueKey === fieldUniqueKey)?.fields
            .find(ele => ele?.name === enumKey);

          if (field) {

            if (field.fileDeleted === true) {
              updatedFormData.append(enumKey, 'null');
              return;
            }

            for (const file of field.selectedFiles || []) {
              updatedFormData.append(enumKey, file);
            }
          }
        };
        // const appendFiles = (fieldUniqueKey, enumKey) => {
        //   const field = formFields[0]?.fields
        //     .find(ele => ele?.fieldUniqueKey === fieldUniqueKey)?.fields
        //     .find(ele => ele?.name === enumKey);
        //   if (field) {
        //     for (const file of field.selectedFiles) {
        //       updatedFormData.append(enumKey, file);
        //     }
        //   }
        // };
        imageKeys.forEach(enumKey => appendFiles('basic-info', enumKey));
        imageKeys.forEach(enumKey => appendFiles('other details', enumKey));


        const appendFile = (fieldUniqueKey, enumKey, accordionHeader) => {
          const field = formFields[0]?.fields.find(ele => ele?.fieldUniqueKey === 'idAndEmploymentDetails');
          const accordion = field?.fields?.find(ele =>
            ele?.fields?.some(fieldItem => fieldItem?.accordionHeader === accordionHeader)
          );
          const accordions = accordion?.fields[0]?.fields?.find(ele => ele?.name === enumKey);

          if (accordions) {

            if (accordions.fileDeleted === true) {
              updatedFormData.append(enumKey, 'null');
              return;
            }

            for (const file of accordions?.selectedFiles || []) {
              updatedFormData.append(enumKey, file);
            }
          }
        };

        // const appendFile = (fieldUniqueKey, enumKey, accordionHeader) => {
        //   const field = formFields[0]?.fields.find(ele => ele?.fieldUniqueKey === 'idAndEmploymentDetails');
        //   const accordion = field?.fields?.find(ele => ele?.fields?.some(fieldItem => fieldItem?.accordionHeader === accordionHeader));
        //   const accordions = accordion?.fields[0]?.fields?.find(ele => ele?.name === enumKey);
        //   if (accordions) {
        //     for (const file of accordions?.selectedFiles) {
        //       updatedFormData.append(enumKey, file);
        //     }
        //   }
        // };
        accordionImageKeys.forEach(enumKey => appendFile('idAndEmploymentDetails', enumKey?.key, enumKey?.accordionHeader));


      }
      console.log("updateform data", updatedFormData);

      return updatedFormData;
    }

  // CREATE Password
  private readonly passwordDialogConfig = signal({});
  private readonly passwordForm = inject(PasswordFormConfig);

  setPasswordDialogConfig(pageTitle: any, data: SecurityUser) {
    this.passwordDialogConfig.set({
      pageTitle: pageTitle,
      dialogConfig: {
        height: '33%',
        width: '50%'
      },
      isShowDialog: true,
      submitButtonLabel: 'Save',
      customDialog: true,
      dialogData: data
    })
  }

  //  async updatePassword(formValue: any, object: any = {}, formFields: any = []) {
  //    this.setPasswordDialogConfig('Reset-Password', object);
  //    const dialogResponse: any = await this._dialogHandlerService.openDialog(this.passwordDialogConfig(), this.passwordForm.PasswordDetailForm());
  //    const response: SecurityUser = await this.savePassword(dialogResponse, `${ServiceUrlConstants.UPDATE_PASSWORD}`);
  //    this._sharedService.handleSuccess(this.translate.instant('entityUpadtedSuccessTitle_TC',{ entity:'Password' }));
  //    return { response: response };
  //  }
  async updatePassword(formValue: any, object: any = {}, formFields: any = []) {
    this.setPasswordDialogConfig('Reset-Password', object);
    const dialogResponse: any = await this._dialogHandlerService.openDialog(this.passwordDialogConfig(), this.passwordForm.PasswordDetailForm());
    this._spinner.show();
    const response: SecurityUser = await this.savePassword(dialogResponse, `${ServiceUrlConstants.UPDATE_PASSWORD}`);
    this._spinner.hide();
    this._sharedService.handleSuccess(this.translate.instant('entityUpadtedSuccessTitle_TC', { entity: 'Password' }));
    return { response: response };
  }
  async savePassword(formValue: SecurityUser, url: string) {
    return this._apiService.post(url, formValue).toPromise();
  }
  employeeConfig = {
    pageTitle: 'Select Employee',
    dialogConfig: {
      width: '50%',
      height: '80%'
    },
  };
  async addEmployee(formValue: any, object: any) {
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: this.translate.instant(`${EmployeeEnum.firstName}_TC`), field: EmployeeEnum.firstName },
        { name: this.translate.instant(`${EmployeeEnum.employeeCode}_TC`), field: EmployeeEnum.firstName },
      ],
      selectionMode: 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: [EmployeeEnum.firstName, EmployeeEnum.employeeCode],
      paginator: true,
      scrollable: true,
      lazy: true,
      fontSize: '14px',
      queryParams: {
        ...object?.query,
        search_key: `${EmployeeEnum.firstName},${EmployeeEnum.employeeCode}`,
      },
      url: `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}`,
      tableName: 'table',
      height: '75vh',
      width: '75vw',
      directSelectedArray: true,
      idsList: object?.idsList || [],
    };
    const data: any = { field: dynamicObject, tableDataSource: [] };
    const response: any = await this._customDialogService.openDialog(this.employeeConfig, DynamicTableComponent, data);
    return { tempArray: response?.tempArray };
  }

  // ADD EMPLOYEE DETAILS (multi-select) — used in PR / PO / GRN employee details
  async addEmployeeDetails(object: DynamicTableModel = {}) {
    const config = {
      pageTitle: object?.pageTitle || 'Add Employee',
      dialogConfig: { width: '80%', height: '80%' },
    };
    const queryParams = {
      is_active: true,
      search_key: `${EmployeeEnum.employeeCode},${EmployeeEnum.firstName},${EmployeeEnum.designationName}`,
    };
    const dynamicObject: DynamicTableModel = {
      columnSchema: [
        { name: this.translate.instant(`${EmployeeEnum.employeeCode}_TC`), field: EmployeeEnum.employeeCode, representation: EmployeeEnum.employeeCode },
        { name: this.translate.instant(`${EmployeeEnum.firstName}_TC`), field: EmployeeEnum.firstName, representation: EmployeeEnum.firstName },
        { name: this.translate.instant(`designation_name_TC`), field: EmployeeEnum.designationName, representation: 'designation_name' },
      ],
      selectionMode: 'single',
      rows: 10,
      scrollHeight: '55vh',
      formInitialise: [
        { key: EmployeeEnum.employeeCode },
        { key: EmployeeEnum.firstName },
        { key: 'designation_name' },
      ],
      paginator: true,
      scrollable: true,
      lazy: true,
      fontSize: '14px',
      queryParams: { ...queryParams, ...object?.queryParams },
      url: object?.url || ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
      tableName: 'table',
      height: '75vh',
      width: '75vw',
      directSelectedArray: true,
      idsList: object?.idsList || [],
    };
    const data: any = { field: dynamicObject, tableDataSource: [] };
    const response: any = await this._customDialogService.openDialog(config, MultiSelectTableComponent, data);
    return { tempArray: response?.tempArray, addedList: response?.addedList };
  }
  // ADD EMPLOYEE DETAILS
}
