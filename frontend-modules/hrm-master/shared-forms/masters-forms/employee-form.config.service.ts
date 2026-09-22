import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/tab.builder';
import { TextBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/textarea.builder';
import { ApiService } from 'src/app/core/services/api.service';
import {
  EmployeeDocumentsTableModel,
  EmployeeModel,
  LicDetails,
  PreviousEmploymentDetails,
} from 'src/app/modules/hrm-shared/core/shared/common/model/masters/employee.model';
import {
  EmployeeEnum,
  PreviousEmploymentDetailsEnum,
} from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/employee-enum';
import { Dropdown } from 'primeng/dropdown';
import { DropdownField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DateField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/date.builder';
import { TableBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';
import { DesignationFormConfig } from './designation-form.config.service';
import { DepartmentFormConfig } from './department-form.config.service';
import { GradeFormConfig } from './grade-form.config.service';
import * as moment from 'moment';
import { FileField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/file.builder';
import { GlobalMasterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/forms/masters-forms/global-master-from.config.service';
import { ToggleBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/toggle.builder';
import { PasswordField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/password.builder';
import { CheckboxBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/checkbox.builder';
import { EmployeeService } from 'src/app/modules/hrm-master/employee/services/employee.service';
import { GapField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/gap.builder';
import { MultiSelectField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/multiselect.builder';
import { HttpHeaders } from '@angular/common/http';
import { country } from 'src/app/modules/hrm-shared/core/shared/state/country';
import { get } from 'http';
import { updatePermissionsForRole } from 'src/app/modules/hrm-shared/core/shared/services/filed-readonly-permissions';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { GlobalMasterService } from 'src/app/modules/hrm-shared/modules/masters/global-master/services/global-master.service';
import { GlobalMasterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/global-master.model';
import { CarouselField } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/carousel.builder';
import { bindCallback } from 'rxjs';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { OverlayPanelBuilder } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/builders/table.builder';

@Injectable({
  providedIn: 'root',
})
export class EmployeeFormConfig {
  private translate = inject(TranslateService);
  private empService = inject(EmployeeService);
  private apiService = inject(ApiService);
  private _globalMasterService = inject(GlobalMasterService);
  private sharedService = inject(SharedService);
  private authorityIssuerList: any[] = [];

  isIssueHelthType = true;

  // add authority issuer while adding doc or updating doc
  // Disabled: was backed by the now-removed master.PartyMaster (this HRM-only
  // build has no Party/vendor module). Re-enable once a Party master is wired in.
  private loadAuthorityIssuers(): void {
    return;
  }

  //departmnt create + dropdown
  private readonly departmentConfig = signal({});
  private countryList = signal(country);
  private readonly departmentForm = inject(DepartmentFormConfig);
  private departmentList = signal([]);
  employeeId: any = '';
  async onChangeDepartment(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.DEPARTMENT_CRUD}${next}`)
        .subscribe((response: any) => {
          formValue.department_name = response?.department_name;
          resolve(formValue);
        });
    });
  }
  //department delogue
  setDepartmentMasterConfig() {
    this.departmentConfig.set({
      pageTitle: this.translate.instant('departmentMaster_TC'),
      dialogData: {},
      dialogConfig: {
        height: '80%',
        width: '100%',
      },
      isShowDialog: true,
    });
  }

  //designation create + dropdown
  private readonly designationConfig = signal({});
  private readonly designationForm = inject(DesignationFormConfig);
  private designationList = signal([]);
  async onChangeDesignation(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.DESIGNATION_CRUD}${next}`)
        .subscribe((response: any) => {
          formValue.designation_name = response?.designation_name;
          resolve(formValue);
        });
    });
  }
  setDesignationMasterConfig() {
    this.designationConfig.set({
      pageTitle: this.translate.instant('designationMaster_TC'),
      dialogData: {},
      dialogConfig: {
        height: '80%',
        width: '100%',
      },
      isShowDialog: true,
    });
  }
  //grade create + dropdown
  private readonly gradeConfig = signal({});
  private readonly gradeForm = inject(GradeFormConfig);
  private gradeList = signal([]);
  defaultDocumentsDetails: any = [];
  async onChangegrade(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.GRADE_CRUD}${next}`)
        .subscribe((response: any) => {
          formValue.grade_name = response?.grade_name;
          resolve(formValue);
        });
    });
  }
  setGradeMasterConfig() {
    this.gradeConfig.set({
      pageTitle: this.translate.instant('gradeMaster_TC'),
      dialogData: {},
      dialogConfig: {
        height: '80%',
        width: '100%',
      },
      isShowDialog: true,
    });
  }

  //globalMaster create + dropdown
  private readonly globalMasterConfig = signal({});
  private readonly globalMasterForm = inject(GlobalMasterFormConfig);
  private globalList = signal([]);
  private SecondoryList = signal([]);
  private TertiaryList = signal([]);
  private QuaternaryList = signal([]);

  async onChangeGlobal(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.GLOBAL_MASTER_CRUD}${next}`)
        .subscribe((response: any) => {
          // console.log("response", response)

          formValue.employee_type = response?.results;

          resolve(formValue);
        });
    });
  }
  async globalLists() {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.GLOBAL_MASTER_CRUD}`)
        .subscribe((response: any) => {
          resolve(response);
        });
    });
  }
  //globalMaster delogue
  setGlobalMasterMasterConfig() {
    this.globalMasterConfig.set({
      // pageTitle: this.translate.instant('create_employee_type_TC'),
      dialogData: {},
      dialogConfig: {
        height: '40%',
        width: '35%',
      },
      isShowDialog: true,
    });
  }
  private readonly shiftList = signal([
    {
      key: '8 Hours',
      value: '8 Hours',
    },
    {
      key: '10 Hours',
      value: '10 Hours',
    },
  ]);
  private readonly titleList = signal([
    {
      key: 'Mr',
      value: 'Mr',
    },
    {
      key: 'Mrs',
      value: 'Mrs',
    },
    {
      key: 'Ms',
      value: 'Ms',
    },
    {
      key: 'Sri',
      value: 'Sri',
    },
    {
      key: 'Smt',
      value: 'Smt',
    },
    {
      key: 'Dr',
      value: 'Dr',
    },
  ]);
  private readonly maritalStatusList = signal([
    {
      key: 'Married',
      value: 'Married',
    },
    {
      key: 'Unmarried',
      value: 'Unmarried',
    },
    {
      key: 'Divorced',
      value: 'Divorced',
    },
  ]);
  private readonly genderList = signal([
    {
      key: 'Male',
      value: 'Male',
    },
    {
      key: 'Female',
      value: 'Female',
    },
  ]);

  private readonly paymentMethodList = signal([
    { key: 'WPS', value: 'WPS' },
    { key: 'Cash', value: 'Cash' },
  ]);

  private readonly accountTypeList = signal([
    { key: 'C3Pay Card', value: 'C3Pay Card' },
    { key: 'Bank Account', value: 'Bank Account' },
  ]);

  private readonly eligibleMP = signal([
    {
      key: 'Maternity Leave',
      value: 'Maternity Leave',
    },
    {
      key: 'Paternity Leave',
      value: 'Paternity Leave',
    },
  ]);

  private readonly reporting = signal([
    {
      key: 'Direct',
      value: 'Direct',
    },
    {
      key: 'Indirect',
      value: 'Indirect',
    },
  ]);
  private readonly bloodGroupList = signal([
    {
      key: 'A+',
      value: 'A+',
    },
    {
      key: 'A-',
      value: 'A-',
    },
    {
      key: 'B+',
      value: 'B+',
    },
    {
      key: 'B-',
      value: 'B-',
    },
    {
      key: 'AB+',
      value: 'AB+',
    },
    {
      key: 'AB-',
      value: 'AB-',
    },
    {
      key: 'O+',
      value: 'O+',
    },
    {
      key: 'O-',
      value: 'O-',
    },
  ]);
  private readonly yesOrNOList = signal([
    {
      key: 'Yes',
      value: 'Yes',
    },
    {
      key: 'No',
      value: 'No',
    },
  ]);
  private readonly religionTypeList = signal([
    {
      key: 'Hinduism',
      value: 'Hinduism',
    },
    {
      key: 'Christianity',
      value: 'Christianity',
    },
    {
      key: 'Islam',
      value: 'Islam',
    },
    {
      key: 'Sikhism',
      value: 'Sikhism',
    },
    {
      key: 'Buddhism',
      value: 'Buddhism',
    },
    {
      key: 'Judaism',
      value: 'Judaism',
    },
    {
      key: 'Zoroastrianism',
      value: 'Zoroastrianism',
    },
    {
      key: "BahÃ¡'Ã­ Faith",
      value: "BahÃ¡'Ã­ Faith",
    },
    {
      key: 'Shinto',
      value: 'Shinto',
    },
    {
      key: 'Taoism',
      value: 'Taoism',
    },
    {
      key: 'Confucianism',
      value: 'Confucianism',
    },
    {
      key: 'Atheism',
      value: 'Atheism',
    },
    {
      key: 'Agnosticism',
      value: 'Agnosticism',
    },
    {
      key: 'Other',
      value: 'Other',
    },
  ]);

  private readonly residentTypeList = signal([
    {
      key: 'Local',
      value: 'Local',
    },
    {
      key: 'Resident',
      value: 'Resident',
    },
    {
      key: 'GCC Resident',
      value: 'GCC Resident',
    },
  ]);
  // private readonly OperatorTypeList = signal ([
  //     {
  //     key: 'Excavator Operator',
  //     value: 'Excavator Operator',
  //     },
  //     {
  //         key: 'Crane Operator',
  //         value: 'Crane Operator',
  //     },
  //     {
  //         key: 'Low-Bed Trailer Driver',
  //         value: 'Low-Bed Trailer Driver',
  //     },
  //     {
  //         key: 'Forklift Operator',
  //         value: 'Forklift Operator',
  //     },

  //       {
  //         key: 'Bulldozer Operator',
  //         value: 'Bulldozer Operator',
  //     },

  //     {
  //         key: 'Other',
  //         value: 'Other',
  //     },
  // ])
  private readonly NomineRelationList = signal([
    {
      key: 'Father',
      value: 'Father',
    },
    {
      key: 'Mother',
      value: 'Mother',
    },
    {
      key: 'Spouse',
      value: 'Spouse',
    },
    {
      key: 'Children',
      value: 'Children',
    },
    {
      key: 'Guardian',
      value: 'Guardian',
    },
  ]);

  getCurrentHost(): string {
    const currentHost = window.location.origin;
    return currentHost;
  }

  addHrefButtonConfig(path: string): any {
    const currentHost = this.getCurrentHost();
    const url = currentHost + path; // Replace '/path/to/your/resource' with your actual resource path
    const hrefButtonConfig = {
      url: url,
      hrefButtonIcon: 'pi pi-external-link',
    };
    return hrefButtonConfig;
  }

  updateDynamicDropdownOptions(response) {
    // console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }

  //globalMasterList dropDown update
  updateDynamicGlobalMasterDropdownOptions(response) {
    // console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results[0]?.global_value;
      return options;
    }
  }
  async onChangeFirstAuthorityEmployee(prev, next, formValue) {
    // console.log("next", next)
    if (next) {
      return new Promise((resolve) => {
        const headers = new HttpHeaders().set('X-Skip-BID', 'true');
        this.apiService
          .get(
            `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`,
            {},
            headers,
          )
          .subscribe((response: any) => {
            formValue.report_authority_first_name = response?.first_name;
            formValue.report_authority_last_name = response?.last_name;
            resolve(formValue);
          });
      });
    } else {
      return formValue;
    }
  }

  async onChangeSecondAuthorityEmployee(prev, next, formValue) {
    return new Promise((resolve) => {
      this.apiService
        .get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`)
        .subscribe((response: any) => {
          formValue.second_report_authority_first_name = response?.first_name;
          formValue.second_report_authority_last_name = response?.last_name;
          resolve(formValue);
        });
    });
  }

  onChangedoj(prev, next, formValue, formFields) {
    // console.log("form", formFields)
    const doj = formFields
      .find((ele) => ele.fieldUniqueKey == 'basic-info')
      .fields.find((ele) => ele?.name == 'doj');
    // console.log("doj", doj)
    // moment(formValue.from_date).format('YYYY-MM-DD') !== moment(next).format('YYYY-MM-DD') && next !== ''
    if (doj.value !== next && next !== '') {
      const dojParts = formValue.doj.split('-');
      const dojDate = new Date(dojParts[2], dojParts[1] - 1, dojParts[0]);
      const dorField = formFields
        .find((ele) => ele.fieldUniqueKey == 'basic-info')
        .fields.find((ele) => ele?.name == 'dor');
      dorField.minDateValue = new Date(dojDate);
      return formValue;
    }
  }

  saveDynamicDropdownData(attribute: any, event: any, form: any) {
    // console.log("attribute", attribute, event, form)
    return { data: event, attribute: attribute };
  }
  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }
  public readonly EmployeeForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: EmployeeModel,
      isEditMode?: boolean,
      data?: EmployeeModel,
    ) => {
      this.loadAuthorityIssuers();
      // console.log('EmployeeForm', initialData, data);
      // this.defaultDocumentsDetails = [
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Driverâ€™s License*' },
      // { id: `${this.generateUniqueId()}+A`, document_name: 'Passport' },
      // { id: `${this.generateUniqueId()}+A`, document_name: 'Emirates ID / Visa' },
      // { id: `${this.generateUniqueId()}+A`, document_name: 'Work Permit No' },
      // { id: `${this.generateUniqueId()}+A`, document_name: 'Driver Health Insurance' },
      // not needed
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'ADSD' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'H2S' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Basic First Aid' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Basic Fire Fighting' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'TBOSIET' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Induction' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'H2S OPITO' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Civil Defense Training' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'Medical Fitness' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'RFID' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'CICPA' },
      //     { id: `${this.generateUniqueId()}+A`, document_name: 'TCC' },
      // ];
      // const employeeDocumentsDetails = isEditMode ? data?.employee_documents_details ?? this.defaultDocumentsDetails : data?.employee_documents_details ?? this.defaultDocumentsDetails;
      this.defaultDocumentsDetails = [];
      const employeeDocumentsDetails = data?.employee_documents_details?.length
        ? data.employee_documents_details
        : [];

      // if (this.check_permission('sales.custom_approval_stage_executive')) {
      //     this.updatePermissions({ role: 'stage_executive' });
      // }
      initialData = new EmployeeModel();
      this.setDepartmentMasterConfig();
      this.setDesignationMasterConfig();
      this.setGradeMasterConfig();
      this.setGlobalMasterMasterConfig();
      this.globalList();
      this.SecondoryList();
      this.TertiaryList();
      this.QuaternaryList();
      let autofetch_ocr_passport = localStorage.getItem('autoFetch');
      // console.log("autofetch_ocr_passport",autofetch_ocr_passport);

      let branch_default_object = isEditMode
        ? {
            id: data?.branch?.id,
            branch_name: data?.branch?.branch_name,
          }
        : {};

      let default_main_group_object = isEditMode
        ? data.default_main_group_object
        : {};
      let default_department_object = isEditMode
        ? data.department_default_object
        : {};
      let default_designation_object = isEditMode
        ? data.designation_default_object
        : {};
      let grade_default_object = isEditMode ? data.grade_default_object : {};
      let prev_company_employee_list = isEditMode
        ? data.previous_employments
        : [];
      let default_first_reporting_authority_object = isEditMode
        ? data.default_first_reporting_authority_object
        : {};
      let default_second_reporting_authority_object = isEditMode
        ? data.default_second_reporting_authority_object
        : {};
      let default_global_object = isEditMode ? data.default_global_object : {};
      let default_detailed_employee_type_object = this.getGlobalDefaultObj(
        isEditMode,
        data?.detailed_employee_type,
      );
      // let default_branch_master_object = this.getGlobalDefaultObj(isEditMode, data?.detailed_employee_type);

      let default_count_by_level_object = this.getGlobalDefaultObj(
        isEditMode,
        data?.count_by_level,
      );
      let default_sponsor_object = this.getGlobalDefaultObj(
        isEditMode,
        data?.sponsors,
      );

      let default_operator_object = isEditMode
        ? data.default_operator_object
        : {};
      let default_technician_object = isEditMode
        ? data.default_technician_object
        : {};
      let default_employee_group_object = this.getGlobalDefaultObj(
        isEditMode,
        data?.employee_group,
      );
      let default_shift_obj = this.getShiftDefaultObj(isEditMode, data);
      // const  = isEditMode?JSON.parse(data?.weekly_off):'';
      // console.log("weekly off", data)
      initialData.is_exchange_number = false;
      initialData.system_user = false;
      if (isEditMode) {
        const formfields = this.EmployeeForm()()[0].fields;
        // const fields = formfields?.find((ele) => ele?.fieldUniqueKey == 'employee-details')?.fields.find(ele => ele?.type == 'accordion')
        const getFieldByUniqueKey = (key: string, name: string) =>
          formfields
            .find((ele) => ele?.fieldUniqueKey === key)
            ?.fields.find((ele) => ele?.name === name);
        const detailsFieldSet = getFieldByUniqueKey(
          'employee-details',
          EmployeeEnum.userPassword,
        );
        // console.log("enployee", detailsFieldSet)
      }

      // const fields = formfields?.find((ele) => ele?.fieldUniqueKey == 'employee-details')?.fields.find(ele => ele?.type == 'accordion')
      let is_exchange_number_flag = isEditMode
        ? data?.is_exchange_number === true
          ? false
          : true
        : true;
      let isWpsPayment = isEditMode ? data?.payment_method === 'WPS' : false;
      let isBankAccount = isEditMode
        ? data?.account_type === 'Bank Account'
        : false;
      let selectuserDropdownHiddeFlag =
        data?.system_user === true ? false : true;
      this.employeeId = isEditMode ? data.id : '';
      let selectoperator = data?.operator_driver === true ? false : true;
      let selectTechnician = data?.mechanic_technician === true ? false : true;
      const globalList = data?.globalList;
      const SecondoryList = data?.SecondoryList;
      const TertiaryList = data?.TertiaryList;
      const QuaternaryList = data?.QuaternaryList;
      console.log('globalList', data, initialData);
      let default_shift_object = isEditMode ? data.shift_category_object : {};

      // let selectuserDropdownHiddeFlag = isEditMode ? (data?.system_user === true): false;

      let minDojDate = null;
      let minDorDate = null;
      if (isEditMode) {
        if (data?.doj) {
          const DateParts = data?.doj?.split('-');
          const dojDate = new Date(
            DateParts[2],
            DateParts[1] - 1,
            DateParts[0],
          );
          minDojDate = new Date(dojDate);
        }
        if (data?.dor) {
          const DateParts1 = data?.dor.split('-');
          const dorDate = new Date(
            DateParts1[2],
            DateParts1[1] - 1,
            DateParts1[0],
          );
          minDorDate = new Date(dorDate);
        }
      }

      return [
        new TabBuilder(this.translate).addTabFields([
          {
            tabHeader: this.translate.instant('employeeDetails_TC'),
            fieldUniqueKey: 'employee-details',
            fields: [
              // new InputField(this.translate, EmployeeEnum.employeeCode, isEditMode, data, initialData)
              //     .addFieldWidth('24%')
              //     .validate(true, 1, 100)
              //     // .isReadOnly(true)
              //     .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.employeeCode,
                isEditMode,
                data,
                initialData,
                undefined,
                this.translate.instant('autogeneratedField_TC'),
              )
                .addFieldWidth('24%')
                .isReadOnly(true)
                .validate(false, 2, 100)
                .toObject(),
              // new InputField(this.translate, EmployeeEnum.employeeCardNumber, isEditMode, data, initialData)
              //     .addFieldWidth('24%')
              //     .validate(false, 1, 20)
              //     .toObject(),
              // new InputField(this.translate, EmployeeEnum.biometricKey, isEditMode, data, initialData)
              //     .addFieldWidth('24%')
              //     .validate(false, 1, 20)
              //     .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.title,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .validate(true)
                .getOptions(this.titleList)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.firstName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(true, 1, 100)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.lastName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.branch_master, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')

              //  new branch dropdown (using the actual Branch model)
              new DropdownField(
                this.translate,
                'branch',
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('branch_name', 'id')
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(true)
                .setDefaultObject(branch_default_object)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.BRANCH_CRUD,
                    params: { page_size: 30, is_active: true },
                    filterKeys: [`branch_name__${FilterOptions.iContains}`],
                  },
                })
                .bindOption((response: any) => {
                  console.log('Branch API response:', response);
                  // Return ALL branches for the dropdown options
                  return response?.results || [];
                })
                .onChange(this.onBranchChange.bind(this))
                .toObject(),

              // new DropdownField(this.translate, EmployeeEnum.branch_master, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('name', 'id')
              //     .addDynamicDialogConfig({
              //         config: this.globalMasterConfig(),
              //         isEditMode: true,
              //         data: { global_key: 'branch_master' },
              //         formConfig: this.globalMasterForm.GlobalMasterForm()
              //     })
              //     .saveData(this.saveDynamicDropdownData.bind(this, 'branch_master'))
              //     .getOptions(this.globalList)
              //     .isLazyFilterDropDown(true)
              //     .setDefaultObject(default_branch_master_object)
              //     .getUrlConfig({
              //         post: {
              //             url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
              //         },
              //         get: {
              //             url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
              //             params: {
              //                 page_size: 30, is_active: true, global_key: 'branch_master'
              //             },
              //         }
              //     })
              //     .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
              //     .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.sponsors, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.sponsors,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .addDynamicDialogConfig({
                  config: this.globalMasterConfig(),
                  isEditMode: true,
                  data: { global_key: 'sponsors' },
                  formConfig: this.globalMasterForm.GlobalMasterForm(),
                })
                .saveData(this.saveDynamicDropdownData.bind(this, 'sponsors'))
                .getOptions(this.globalList)
                .isLazyFilterDropDown(true)
                .setDefaultObject(default_sponsor_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      global_key: 'sponsors',
                    },
                  },
                })
                .bindOption(
                  this.updateDynamicGlobalMasterDropdownOptions.bind(this),
                )
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.fatherName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.motherName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.employeeType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.employeeType,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .addDynamicDialogConfig({
                  config: this.globalMasterConfig(),
                  isEditMode: true,
                  data: { global_key: 'employee_type' },
                  formConfig: this.globalMasterForm.GlobalMasterForm(),
                })
                .saveData(
                  this.saveDynamicDropdownData.bind(this, 'employee_type'),
                )
                .getOptions(this.globalList)
                .isLazyFilterDropDown(true)
                .validate(true)
                .setDefaultObject(default_global_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      global_key: 'employee_type',
                    },
                  },
                })
                .bindOption(
                  this.updateDynamicGlobalMasterDropdownOptions.bind(this),
                )
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.detailedEmployeeType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              // new DropdownField(this.translate, EmployeeEnum.detailedEmployeeType, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('name', 'id')
              //     .addDynamicDialogConfig({
              //         config: this.globalMasterConfig(),
              //         isEditMode: true,
              //         data: { global_key: 'detailed_employee_type' },
              //         formConfig: this.globalMasterForm.GlobalMasterForm()
              //     })
              //     .saveData(this.saveDynamicDropdownData.bind(this, 'detailed_employee_type'))
              //     .getOptions(this.globalList)
              //     .isLazyFilterDropDown(true)
              //     .setDefaultObject(default_detailed_employee_type_object)
              //     .getUrlConfig({
              //         post: {
              //             url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
              //         },
              //         get: {
              //             url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
              //             params: {
              //                 page_size: 30, is_active: true, global_key: 'detailed_employee_type'
              //             },
              //         }
              //     })
              //     .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
              //     .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.countByLevel, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              // new DropdownField(this.translate, EmployeeEnum.countByLevel, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('name', 'id')
              //     .addDynamicDialogConfig({
              //         config: this.globalMasterConfig(),
              //         isEditMode: true,
              //         data: { global_key: 'count_by_level' },
              //         formConfig: this.globalMasterForm.GlobalMasterForm()
              //     })
              //     .saveData(this.saveDynamicDropdownData.bind(this, 'count_by_level'))
              //     .getOptions(this.globalList)
              //     .isLazyFilterDropDown(true)
              //     .setDefaultObject(default_count_by_level_object)
              //     .getUrlConfig({
              //         post: {
              //             url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
              //         },
              //         get: {
              //             url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
              //             params: {
              //                 page_size: 30, is_active: true, global_key: 'count_by_level'
              //             },
              //         }
              //     })
              //     .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
              //     .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.department, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.department,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('department_name', 'id')
                .addDynamicDialogConfig({
                  config: this.departmentConfig(),
                  formConfig: this.departmentForm.departmentForm(),
                })
                .saveData(this.saveDynamicDropdownData.bind(this, 'department'))
                .getOptions(this.departmentList)
                .validate(true)
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(true)
                .setDefaultObject(default_department_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.DEPARTMENT_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.DEPARTMENT_CRUD,
                    params: { page_size: 30, is_active: true },
                    filterKeys: [`department_name__${FilterOptions.iContains}`],
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.designation, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.designation,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('designation_name', 'id')
                .addDynamicDialogConfig({
                  config: this.designationConfig(),
                  formConfig: this.designationForm.DesignationForm(),
                })
                .saveData(
                  this.saveDynamicDropdownData.bind(this, 'designation'),
                )
                .getOptions(this.designationList)
                .validate(true)
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(true)
                .setDefaultObject(default_designation_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.DESIGNATION_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.DESIGNATION_CRUD,
                    params: { page_size: 30, is_active: true },
                    filterKeys: [
                      `designation_name__${FilterOptions.iContains}`,
                    ],
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.grade, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.grade,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                // .addKeyValueLabel('grade_description', 'id')
                .addKeyValueLabelList(['grade_code', 'grade_description'], 'id')
                .addDynamicDialogConfig({
                  config: this.gradeConfig(),
                  formConfig: this.gradeForm.GradeForm(),
                })
                .saveData(this.saveDynamicDropdownData.bind(this, 'grade'))
                .getOptions(this.gradeList)
                // .validate(true)
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(true)
                .setDefaultObject(grade_default_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.GRADE_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GRADE_CRUD,
                    params: { page_size: 30, is_active: true },
                    filterKeys: [
                      `grade_description__${FilterOptions.iContains}`,
                    ],
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),

              new DropdownField(
                this.translate,
                EmployeeEnum.shift_details,
                isEditMode,
                data,
                initialData,
                true,
                undefined,
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['shift_name', 'duration'], 'id')
                // .validate(true)
                .isLazyFilterDropDown(true)
                .setRequiredFields('id,shift_name,duration')
                .isNeedRequiredFields(true)
                .getOptions(signal([]))
                // .onChangeOnly(this.onChangeShiftDetia.bind(this))
                // .validate(false)
                // .isHideFunction((formValue: ProjectMasterModel) => formValue?.loa_number)
                .onChange(this.onChangeShiftDetails.bind(this))
                .setDefaultObject(default_shift_object)
                .getUrlConfig({
                  get: {
                    url: `${HrmServiceUrlConstants.SHIFT_MASTER_DURATION}`,
                    params: { page_size: 30, is_active: true },
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.default_shift_new,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false)
                .isReadOnly(true)
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.default_shift_new, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('key', 'value')
              //     .validate(false)
              //     .getOptions(this.shiftList)
              //     .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.defaultShift, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '24vw')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('shift_name', 'id')
              //     .getOptions(signal([]))
              //     // .validate(true)
              //     .isLazyFilterDropDown(true)
              //     .isNeedRequiredFields(true)
              //     .setDefaultObject(default_shift_obj)
              //     .getUrlConfig({
              //         get: {
              //             url: ServiceUrlConstants.SHIFT_MASTER_CRUD,
              //             params: { page_size: 30, is_active: true },
              //             filterKeys: [`shift_name__${FilterOptions.iContains}`]
              //         }
              //     })
              //     .bindOption(this.updateDynamicDropdownOptions.bind(this))
              //     .toObject(),
              // new InputField(this.translate, EmployeeEnum.weeklyOff, isEditMode, data, initialData)
              //     .addFieldWidth('24%')
              //     .validate(false, 1, 100)
              //     .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.employeeGroup, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.employeeGroup,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .addDynamicDialogConfig({
                  config: this.globalMasterConfig(),
                  isEditMode: true,
                  data: { global_key: 'employee_group' },
                  formConfig: this.globalMasterForm.GlobalMasterForm(),
                })
                .saveData(
                  this.saveDynamicDropdownData.bind(this, 'employee_group'),
                )
                .getOptions(this.globalList)
                .isLazyFilterDropDown(true)
                .setDefaultObject(default_employee_group_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      global_key: 'employee_group',
                    },
                  },
                })
                .bindOption(
                  this.updateDynamicGlobalMasterDropdownOptions.bind(this),
                )
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.sponsors, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              //     .addFieldWidth('24%')
              //     .addKeyValueLabel('name', 'id')
              //     .addDynamicDialogConfig({
              //         config: this.globalMasterConfig(),
              //         isEditMode: true,
              //         data: { global_key: 'sponsors' },
              //         formConfig: this.globalMasterForm.GlobalMasterForm()
              //     })
              //     .saveData(this.saveDynamicDropdownData.bind(this, 'sponsors'))
              //     .getOptions(this.globalList)
              //     .isLazyFilterDropDown(true)
              //     .setDefaultObject(default_sponsor_object)
              //     .getUrlConfig({
              //         post: {
              //             url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
              //         },
              //         get: {
              //             url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
              //             params: {
              //                 page_size: 30, is_active: true, global_key: 'sponsors'
              //             },
              //         }
              //     })
              //     .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
              //     .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.reporting,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.reporting)
                .toObject(),

              new DropdownField(
                this.translate,
                EmployeeEnum.nationality,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .getOptions(signal([]))
                .variantType('basic')
                .addKeyValueLabel('country', 'country')
                .getOptions(this.countryList)
                // .onChangeOnly(this.onChangeHandler.bind(this))
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.deviceId,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.firstReportingAuthority, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.firstReportingAuthority,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                // .addKeyValueLabel('employee_code', 'id')
                .setRequiredFields('id,employee_code,first_name')
                .addKeyValueLabelList(
                  ['employee_code', 'first_name', 'designation_name'],
                  'id',
                )
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                // .validate(true)
                .isNeedRequiredFields(true)
                .setDefaultObject(default_first_reporting_authority_object)
                .onChange(this.onChangeFirstAuthorityEmployee.bind(this))
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                    params: { page_size: 30, is_active: true },
                    filterKeys: [
                      `employee_code__${FilterOptions.iContains}}&first_name__${FilterOptions.iContains}`,
                    ],
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .validate(false, 1, 1000)
                .toObject(),

              // new DropdownField(this.translate, EmployeeEnum.secondReportAuthority, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '23vw')
              //     .addFieldWidth('24%')
              //     // .addKeyValueLabel('employee_code', 'id')
              //     .addKeyValueLabelList(['employee_code', 'first_name', 'designation_name'], 'id')
              //     .getOptions(signal([]))
              //     .isLazyFilterDropDown(true)
              //     .isNeedRequiredFields(true)
              //     .validate(false, 1, 1000)
              //     // .validate(true)
              //     .setRequiredFields('id,employee_code,first_name')
              //     .setDefaultObject(default_second_reporting_authority_object)
              //     .onChange(this.onChangeSecondAuthorityEmployee.bind(this))
              //     .getUrlConfig({
              //         get: {
              //             url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
              //             params: { page_size: 30, is_active: true },
              //             filterKeys: [`employee_code__${FilterOptions.iContains}}&first_name__${FilterOptions.iContains}`]
              //         }
              //     })
              //     .bindOption(this.updateDynamicDropdownOptions.bind(this))
              //     .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.reportingAuthorityFirstName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .isFieldHidden(true)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.reportAuthorityLastName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .isFieldHidden(true)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.secondReportAuthorityFirstName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .isFieldHidden(true)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.secondReportAuthorityLastName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .isFieldHidden(true)
                .toObject(),
              new MultiSelectField(
                this.translate,
                EmployeeEnum.weeklyOff,
                isEditMode,
                data,
                initialData,
                false,
                'select weekly off',
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .getOptions(
                  signal([
                    { name: 'Sunday', id: 'Sunday' },
                    { name: 'Monday', id: 'Monday' },
                    { name: 'Tuesday', id: 'Tuesday' },
                    { name: 'Wednesday', id: 'Wednesday' },
                    { name: 'Thursday', id: 'Thursday' },
                    { name: 'Friday', id: 'Friday' },
                    { name: 'Saturday', id: 'Saturday' },
                  ]),
                )
                .toObject(),

              new ToggleBuilder(
                this.translate,
                'is_emirati',
                isEditMode,
                data,
                initialData,
                'Is Emirati',
              )
                .addFieldWidth('10%')
                .toObject(),

              new ToggleBuilder(
                this.translate,
                EmployeeEnum.autoPunch,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('10%')
                .toObject(),
              new ToggleBuilder(
                this.translate,
                EmployeeEnum.otRequired,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('10%')
                .toObject(),
              new ToggleBuilder(
                this.translate,
                EmployeeEnum.is_under_leave,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('10%')
                .toObject(),
              new ToggleBuilder(
                this.translate,
                EmployeeEnum.systemUser,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('10%')
                .onChange(this.onChangeToggle.bind(this))
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.groups,
                isEditMode,
                data,
                initialData,
                true,
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(true)
                .isFieldHidden(selectuserDropdownHiddeFlag)
                .setDefaultObject(default_main_group_object)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.Group,
                    params: {
                      page_size: 30,
                      is_active: true,
                      system_user: true,
                    },
                    filterKeys: [`name__${FilterOptions.iContains}`],
                  },
                })
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),
              new PasswordField(
                this.translate,
                EmployeeEnum.userPassword,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isReadOnly(isEditMode && data?.[EmployeeEnum.userPassword])
                .isFieldHidden(selectuserDropdownHiddeFlag)
                .actionButtonConfig([
                  {
                    show: isEditMode,
                    icon: 'pi pi-plus',
                    toolTip: 'Update Password',
                    tooltipPosition: 'top',
                    class: 'p-button-help p-button-sm',
                    isDisableFunction: true,
                    disableFunction: (formValue: EmployeeModel) =>
                      !formValue.system_user,
                    onClick: this.onClickUpdatePassword.bind(this),
                  },
                ])
                .toObject(),

              new TextBuilder(
                this.translate,
                EmployeeEnum.note,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('48%')
                .setMaxLength(500)
                .toObject(),
            ],
          },
          {
            tabHeader: this.translate.instant('basicDetails_TC'),
            fieldUniqueKey: 'basic-info',
            fields: [
              // basicDetalis
              new DateField(
                this.translate,
                EmployeeEnum.dob,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(true)
                // .addFormat("yy-mm-dd")
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.doj,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                // .addFormat("yy-mm-dd")
                .onChange(this.onChangedoj.bind(this))
                // .validate(true)
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.doc,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.dor,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .setMinDateValue(minDorDate)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.localMobileNumber,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 0, 15, false, false, false, true)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.homeMobileNumber,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 0, 15, false, false, false, true)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.email,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .setValidationFunction((formValue: EmployeeModel) =>
                  !formValue?.system_user ? {} : { required: true },
                )
                // .validate(false)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.maritalStatus,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.maritalStatusList)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.gender,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.genderList)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.isEligibleMorP,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.eligibleMP)
                .showClear(true)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.bloodGroup,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.bloodGroupList)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.postalCode,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 10)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.religion,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.religionTypeList)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.license_number,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.resident,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.residentTypeList)
                .toObject(),
              new TextBuilder(
                this.translate,
                EmployeeEnum.address,
                isEditMode,
                data,
                initialData,
              )
                // .validate(false, 2, 500)
                .addFieldWidth('24%')
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.permit_number,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.issue_date_of_license,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false)
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.expiry_date_of_license,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.cicpa_number,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.cicpa_name,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.cicpa_location,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .toObject(),
              new DateField(
                this.translate,
                EmployeeEnum.cicpa_expiry_date,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false)
                .toObject(),
            ],
          },
          {
            tabHeader: this.translate.instant(
              'operatorMechanicClassification_TC',
            ),
            fieldUniqueKey: 'Operator-Mechanic-Classification',
            hidden: true,
            fields: [
              // {
              //     type: 'accordion',
              //     multiple: true,
              //     accordionStyle: { 'width': '90vw' },
              //     fields: [
              //         {
              //             // @ts-ignore
              //             accordionHeader: this.translate.instant('operator_technician_TC'),
              //             selected: true,
              //             fields: [

              new ToggleBuilder(
                this.translate,
                'operator_driver',
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('10%')
                .onChange(this.onchangeToggleOperator.bind(this))
                .validate(false)
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.operator_type, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.operator_type,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .isFieldHidden(selectoperator)
                .addDynamicDialogConfig({
                  config: this.globalMasterConfig(),
                  isEditMode: true,
                  data: { global_key: 'operator_type' },
                  formConfig: this.globalMasterForm.GlobalMasterForm(),
                })
                .saveData(
                  this.saveDynamicDropdownData.bind(this, 'operator_type'),
                )
                .getOptions(this.globalList)
                .isLazyFilterDropDown(true)
                .setDefaultObject(default_operator_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      global_key: 'operator_type',
                    },
                  },
                })
                .bindOption(
                  this.updateDynamicGlobalMasterDropdownOptions.bind(this),
                )
                .toObject(),
              // new DropdownField(this.translate, EmployeeEnum.operator_type, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
              //     .addFieldWidth('18%')
              //     .addKeyValueLabel('key', 'value')
              //     .isFieldHidden(selectoperator)
              //     .getOptions(this.OperatorTypeList)
              //     .toObject(),
              new ToggleBuilder(
                this.translate,
                'mechanic_technician',
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('14%')
                .onChange(this.onchangeToggleTechnician.bind(this))
                .validate(false)
                .toObject(),

              // new DropdownField(this.translate, EmployeeEnum.technician_type, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
              new DropdownField(
                this.translate,
                EmployeeEnum.technician_type,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('name', 'id')
                .isFieldHidden(selectTechnician)
                .addDynamicDialogConfig({
                  config: this.globalMasterConfig(),
                  isEditMode: true,
                  data: { global_key: 'technician_type' },
                  formConfig: this.globalMasterForm.GlobalMasterForm(),
                })
                .saveData(
                  this.saveDynamicDropdownData.bind(this, 'technician_type'),
                )
                .getOptions(this.globalList)
                .isLazyFilterDropDown(true)
                .setDefaultObject(default_technician_object)
                .getUrlConfig({
                  post: {
                    url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  },
                  get: {
                    url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      global_key: 'technician_type',
                    },
                  },
                })
                .bindOption(
                  this.updateDynamicGlobalMasterDropdownOptions.bind(this),
                )
                .toObject(),

              //             ]
              //         },
              //     ]
              // },

              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '95vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant('techincal_TC'),
                    selected: true,
                    fields: [
                      new CheckboxBuilder(
                        this.translate,
                        'primary_equipment_specialization',
                        isEditMode,
                        data,
                        initialData,
                        'Primary Skills',
                        this.globalList(),
                      )
                        .isaddButton(true)
                        .getOptions(globalList)
                        .addDynamicDialogConfig({
                          config: this.globalMasterConfig(),
                          isEditMode: true,
                          data: {
                            global_key: 'primary_equipment_specialization',
                          },
                          formConfig: this.globalMasterForm.GlobalMasterForm(),
                        })
                        .saveData(
                          this.saveDynamicDropdownData.bind(
                            this,
                            'primary_equipment_specialization',
                          ),
                        )
                        .getUrlConfig({
                          post: {
                            url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                          },
                          get: {
                            url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                            params: {
                              page_size: 30,
                              is_active: true,
                              global_key: 'primary_equipment_specialization',
                            },
                          },
                        })
                        .bindOption(
                          this.updateDynamicGlobalMasterDropdownOptions.bind(
                            this,
                          ),
                        )
                        .onChange((prev, next, formValues) => null)
                        .toObject(),
                      new CheckboxBuilder(
                        this.translate,
                        'secondary_equipment_specialization',
                        isEditMode,
                        data,
                        initialData,
                        'Secondary Skills',
                        this.globalList(),
                      )
                        .isaddButton(true)
                        .getOptions(SecondoryList)
                        .addDynamicDialogConfig({
                          config: this.globalMasterConfig(),
                          isEditMode: true,
                          data: {
                            global_key: 'secondary_equipment_specialization',
                          },
                          formConfig: this.globalMasterForm.GlobalMasterForm(),
                        })
                        .saveData(
                          this.saveDynamicDropdownData.bind(
                            this,
                            'secondary_equipment_specialization',
                          ),
                        )
                        .getUrlConfig({
                          post: {
                            url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                          },
                          get: {
                            url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                            params: {
                              page_size: 30,
                              is_active: true,
                              global_key: 'secondary_equipment_specialization',
                            },
                          },
                        })
                        .bindOption(
                          this.updateDynamicGlobalMasterDropdownOptions.bind(
                            this,
                          ),
                        )
                        .onChange((prev, next, formValues) => null)
                        .toObject(),
                      new CheckboxBuilder(
                        this.translate,
                        'tertiary_equipment_specialization',
                        isEditMode,
                        data,
                        initialData,
                        'Tertiary Skills',
                        this.globalList(),
                      )
                        .isaddButton(true)
                        .getOptions(TertiaryList)
                        .addDynamicDialogConfig({
                          config: this.globalMasterConfig(),
                          isEditMode: true,
                          data: {
                            global_key: 'tertiary_equipment_specialization',
                          },
                          formConfig: this.globalMasterForm.GlobalMasterForm(),
                        })
                        .saveData(
                          this.saveDynamicDropdownData.bind(
                            this,
                            'tertiary_equipment_specialization',
                          ),
                        )
                        .getUrlConfig({
                          post: {
                            url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                          },
                          get: {
                            url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                            params: {
                              page_size: 30,
                              is_active: true,
                              global_key: 'tertiary_equipment_specialization',
                            },
                          },
                        })
                        .bindOption(
                          this.updateDynamicGlobalMasterDropdownOptions.bind(
                            this,
                          ),
                        )
                        .onChange((prev, next, formValues) => null)
                        .toObject(),
                      new CheckboxBuilder(
                        this.translate,
                        'quaternary_equipment_specialization',
                        isEditMode,
                        data,
                        initialData,
                        'Quaternary Skills',
                        this.globalList(),
                      )
                        .isaddButton(true)
                        .getOptions(QuaternaryList)
                        .addDynamicDialogConfig({
                          config: this.globalMasterConfig(),
                          isEditMode: true,
                          data: {
                            global_key: 'quaternary_equipment_specialization',
                          },
                          formConfig: this.globalMasterForm.GlobalMasterForm(),
                        })
                        .saveData(
                          this.saveDynamicDropdownData.bind(
                            this,
                            'quaternary_equipment_specialization',
                          ),
                        )
                        .getUrlConfig({
                          post: {
                            url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                          },
                          get: {
                            url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                            params: {
                              page_size: 30,
                              is_active: true,
                              global_key: 'quaternary_equipment_specialization',
                            },
                          },
                        })
                        .bindOption(
                          this.updateDynamicGlobalMasterDropdownOptions.bind(
                            this,
                          ),
                        )
                        .onChange((prev, next, formValues) => null)
                        .toObject(),
                      new ToggleBuilder(
                        this.translate,
                        'employee_status_is_active',
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('24%')
                        .validate(false)
                        .toObject(),
                    ],
                  },
                ],
              },
            ],
          },
          {
            tabHeader: this.translate.instant('idAndEmploymentDetails'),
            fieldUniqueKey: 'idAndEmploymentDetails',
            fields: [
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader:
                      this.translate.instant('passportDetails_TC'),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.passportNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.passportIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.passportExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      // new FileField(this.translate, EmployeeEnum.passportImage, isEditMode, data, initialData, 'File_TC')
                      //     .setAlignment('center')
                      //     .onUploadFile(this.PassPortPhotoUploadAutoFetch.bind(this))
                      //     .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                      //     .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.passportImage,
                        isEditMode,
                        data,
                        initialData,
                        'Front Side',
                      )
                        .setAlignment('center')
                        .onUploadFile(
                          this.PassPortPhotoUploadAutoFetch.bind(this),
                        )
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),

                      new FileField(
                        this.translate,
                        EmployeeEnum.passportImageBack,
                        isEditMode,
                        data,
                        initialData,
                        'Back Side',
                      )
                        .setAlignment('center')
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant('visaDetails_TC'),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.visaNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.visaIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.visaExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                        false,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.visaImage,
                        isEditMode,
                        data,
                        initialData,
                        'File_TC',
                      )
                        .setAlignment('center')
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant(
                      'emiratesIdDetails_TC',
                    ),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.emiratesIdNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.emiratesIdIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.emiratesIdExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.emiratesImage,
                        isEditMode,
                        data,
                        initialData,
                        'Front Side',
                      )
                        .setAlignment('center')
                        .onUploadFile(
                          this.profileUploadFrontEmirates.bind(this),
                        )
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.emiratesImageBack,
                        isEditMode,
                        data,
                        initialData,
                        'Back Side',
                      )
                        .setAlignment('center')
                        // .onUploadFile(this.profileUploadFrontEmirates.bind(this))
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant(
                      'labourCardDetails_TC',
                    ),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.labourCardNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.labourCardIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.labourCardExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.labourcardImage,
                        isEditMode,
                        data,
                        initialData,
                        'File_TC',
                      )
                        .setAlignment('center')
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant('fhcDetails_TC'),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.fhcNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.fhcIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.fhcExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.FHCImage,
                        isEditMode,
                        data,
                        initialData,
                        'File_TC',
                      )
                        .setAlignment('center')
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              {
                type: 'accordion',
                multiple: true,
                accordionStyle: { width: '47vw' },
                fields: [
                  {
                    // @ts-ignore
                    accordionHeader: this.translate.instant(
                      'jobLossInsuranceDetails_TC',
                    ),
                    selected: true,
                    fields: [
                      new InputField(
                        this.translate,
                        EmployeeEnum.jobLossInsuranceNo,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .validate(false, 1, 100)
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.jobLossInsuranceIssueDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new DateField(
                        this.translate,
                        EmployeeEnum.jobLossInsuranceExpiryDate,
                        isEditMode,
                        data,
                        initialData,
                      )
                        .addFieldWidth('32%')
                        .toObject(),
                      new FileField(
                        this.translate,
                        EmployeeEnum.insuranceImage,
                        isEditMode,
                        data,
                        initialData,
                        'File_TC',
                      )
                        .setAlignment('center')
                        .acceptFileType('.jpg,.png,.jpeg,.webp,.pdf')
                        .toObject(),
                    ],
                  },
                ],
              },
              new TableBuilder(
                this.translate,
                EmployeeEnum.employeeDocumentDetails,
                undefined,
                true,
              )
                .setTableScrollHeight('calc(100vh - 180px)')
                .columnSchema([
                  {
                    field: 'document_name',
                    name: 'document_name_TC',
                    colWidth: '160px',
                  },
                  // { field: 'version', name: 'version_TC', colWidth: '80px' }, // no matching field on EmployeeDocumentsDetails yet
                  {
                    field: 'document_number',
                    name: 'documents_no_TC',
                    colWidth: '120px',
                  },
                  // {
                  //     field: 'authority_issuer',
                  //     name: 'vendor_name_TC',
                  //     colWidth: '180px'
                  // }, // no matching field on EmployeeDocumentsDetails yet
                  {
                    field: 'issue_date',
                    name: 'documents_issued_date_TC',
                    colWidth: '130px',
                  },
                  {
                    field: 'document_valid_upto',
                    name: 'document_valid_upto_expiry_TC',
                    colWidth: '130px',
                  },
                  // { field: 'days_to_expiry', name: 'days_to_expiry_TC', colWidth: '120px' }, // no matching field on EmployeeDocumentsDetails yet
                  // { field: 'document_status', name: 'status_TC', colWidth: '100px' }, // no matching field on EmployeeDocumentsDetails yet
                  { field: 'document', name: 'document_TC', colWidth: '120px' },
                  // { field: 'remarks', name: 'remarks_TC', colWidth: '160px' }, // no matching field on EmployeeDocumentsDetails yet
                  // { field: 'uploaded_by', name: 'uploaded_by_TC', colWidth: '130px' }, // no matching field on EmployeeDocumentsDetails yet
                  // { field: 'uploaded_date', name: 'uploaded_date_TC', colWidth: '130px' }, // no matching field on EmployeeDocumentsDetails yet
                ])
                .actionButtonConfig([
                  {
                    show: true,
                    icon: 'pi pi-eye',
                    toolTip: 'View',
                    tooltipPosition: 'top',
                    class:
                      'p-button-outlined p-button-rounded p-button-help p-button-sm',
                    onClick: this.onchangeView.bind(this),
                  },
                ])
                .formInitialise<EmployeeDocumentsTableModel>(
                  new EmployeeDocumentsTableModel(),
                )
                .formSchema([
                  {
                    name: 'employee_document',
                    type: 'input',
                    hidden: true,
                  },
                  {
                    name: 'equipment_document',
                    type: 'input',
                    hidden: true,
                  },
                  {
                    name: 'document_type_master',
                    type: 'input',
                    hidden: true,
                  },
                  {
                    name: 'document_type',
                    type: 'input',
                    hidden: true,
                  },
                  //   {
                  //     name: 'document_name',
                  //     type: 'input',
                  //     textcase: true,
                  //   },
                  {
                    name: 'document_name',
                    type: 'input',
                    textcase: true,
                    readonly: true,
                  },
                  // { name: 'version', type: 'input', readonly: true }, // no matching field on EmployeeDocumentsDetails yet
                  {
                    name: 'document_number',
                    type: 'input',
                  },
                  // { // no matching field on EmployeeDocumentsDetails yet
                  //     name: 'authority_issuer',
                  //     type: 'dropdown',
                  //     options: this.authorityIssuerList,
                  //     optionLabel: 'party_name',
                  //     optionValue: 'id',
                  //     placeholder: this.translate.instant('select_vendor_name_SC'),
                  //     showClear: true,
                  //     required: false,
                  //     truncate: true
                  // },
                  {
                    name: 'issue_date',
                    type: 'date',
                  },
                  {
                    name: 'document_valid_upto',
                    type: 'date',
                  },
                  // { name: 'days_to_expiry', type: 'input', readonly: true }, // no matching field on EmployeeDocumentsDetails yet
                  // { name: 'document_status', type: 'input', readonly: true }, // no matching field on EmployeeDocumentsDetails yet
                  {
                    type: 'file',
                    name: 'document',
                    path: '/media/equipment_documents/document/',
                  },
                  // { name: 'remarks', type: 'textArea' }, // no matching field on EmployeeDocumentsDetails yet
                  // { name: 'uploaded_by', type: 'input', readonly: true }, // no matching field on EmployeeDocumentsDetails yet
                  // { name: 'uploaded_date', type: 'date', readonly: true }, // no matching field on EmployeeDocumentsDetails yet
                ])
                .getDatasource<Array<EmployeeDocumentsTableModel>>(
                  'id',
                  employeeDocumentsDetails,
                )
                .isHiddenAddButton(true)
                .setTableCaption(true)
                .setTableWidth('95vw')
                .setTableCaptionDialogButton(true)
                .setTableCaptionDialogButtonLabel('Add Document')
                .buttonStates(false, false, false, false, false, true)

                .setField(
                  new OverlayPanelBuilder()
                    .setTableName(EmployeeEnum.employeeDocumentDetails)

                    .setOverlayPanelColumnSchema([
                      {
                        name: 'document_code_TC',
                        field: 'doc_type_code',
                      },
                      {
                        name: 'document_name_TC',
                        field: 'doc_type_name',
                      },
                      {
                        name: 'applies_to_TC',
                        field: 'applies_to',
                      },
                    ])

                    .setOverlayPanelSelectionMode('multiple')

                    .setOverlayPanelRows(10)

                    .setOnUpdateRows(this.updateDocumentRows.bind(this))

                    .setDialogScrollHeight('58vh')

                    .setOverlayPanelFormInitialise([
                      'doc_type_code',
                      'doc_type_name',
                      'applies_to',
                    ])

                    .setOverlayPanelPaginator(true)
                    .setScrollable(true)
                    .setLazy(true)
                    .setFontSize('14px')

                    .setQueryParams({
                      is_active: true,
                      applies_to: 'Employee',
                    })

                    .setDisabledField('false')
                    .setOverlayPanelSelectedArray([])

                    .setUrls(HrmServiceUrlConstants.DOCUMENT_TYPE_MASTER_CRUD)

                    .setOverlayDialogConfig({
                      width: '70vw',
                      height: '70vh',
                    })

                    .build(),
                )

                .build(),
              // .getDatasource<Array<EmployeeDocumentsTableModel>>('id', employeeDocumentsDetails)
              // .setTableCaption(true)
              // .setTableWidth('95vw')
              // .buttonStates(false, false, false, false, false, true)
              // .build(),
            ],
          },
          {
            tabHeader: this.translate.instant('previousEmploymentDetails_TC'),
            fields: [
              new TableBuilder(this.translate, EmployeeEnum.previousEmployments)
                .columnSchema([
                  PreviousEmploymentDetailsEnum.companyName + '_TC',
                  PreviousEmploymentDetailsEnum.designation + '_TC',
                  PreviousEmploymentDetailsEnum.location + '_TC',
                  PreviousEmploymentDetailsEnum.joinedDate + '_TC',
                  PreviousEmploymentDetailsEnum.resignedDate + '_TC',
                ])
                // .formInitialise<PlanningSheetDetails>(new PlanningSheetDetails())
                .formSchema([
                  {
                    name: PreviousEmploymentDetailsEnum.companyName,
                    type: 'input',
                  },
                  {
                    name: PreviousEmploymentDetailsEnum.designation,
                    type: 'input',
                  },
                  {
                    name: PreviousEmploymentDetailsEnum.location,
                    type: 'input',
                  },
                  {
                    name: PreviousEmploymentDetailsEnum.joinedDate,
                    type: 'date',
                  },
                  {
                    name: PreviousEmploymentDetailsEnum.resignedDate,
                    type: 'date',
                  },
                ])
                .getDatasource<Array<PreviousEmploymentDetails>>(
                  'id',
                  prev_company_employee_list,
                )
                .setTableCaption(true)
                .setExportTableData(false)
                .build(),
            ],
          },
          {
            tabHeader: this.translate.instant('salaryPaymentInfo_TC'),
            fieldUniqueKey: 'salary-payment-info',
            fields: [
              new InputField(
                this.translate,
                EmployeeEnum.wpsEstablishmentId,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),

              new DropdownField(
                this.translate,
                EmployeeEnum.paymentMethod,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.paymentMethodList)
                .onChange(this.onChangePaymentMethod.bind(this))
                .toObject(),

              new DropdownField(
                this.translate,
                EmployeeEnum.accountType,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.accountTypeList)
                .isFieldHidden(!isWpsPayment)
                .onChange(this.onChangeAccountType.bind(this))
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.bankName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(!(isWpsPayment && isBankAccount))
                .validate(false, 1, 50)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.accountNumber,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(!(isWpsPayment && isBankAccount))
                .validate(false, 1, 20)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.swiftCode,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(!(isWpsPayment && isBankAccount))
                .validate(false, 1, 50)
                .toObject(),

              new InputField(
                this.translate,
                EmployeeEnum.bankRoutingNo,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(!(isWpsPayment && isBankAccount))
                .validate(false, 1, 50)
                .toObject(),

              new ToggleBuilder(
                this.translate,
                EmployeeEnum.is_exchange_number,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(!(isWpsPayment && isBankAccount))
                .onChange(this.onChangeToggleExchangeNumber.bind(this))
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.ibanNo,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .isFieldHidden(
                  !(isWpsPayment && isBankAccount) || !is_exchange_number_flag,
                )
                .validate(false, 1, 50)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.exchange_number,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 50)
                .isFieldHidden(
                  !(isWpsPayment && isBankAccount) || is_exchange_number_flag,
                )
                .toObject(),
            ],
          },
          {
            tabHeader: this.translate.instant('otherDetails_TC'),
            fieldUniqueKey: 'other details',
            fields: [
              new InputField(
                this.translate,
                EmployeeEnum.payout,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 30)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.nomineeName,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 30)
                .toObject(),
              new InputField(
                this.translate,
                EmployeeEnum.nomineeMobileNumber,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 0, 15, false, false, false, true)
                .toObject(),
              new DropdownField(
                this.translate,
                EmployeeEnum.nomineeRelationship,
                isEditMode,
                data,
                initialData,
                undefined,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('key', 'value')
                .getOptions(this.NomineRelationList)
                .toObject(),

              new InputField(
                this.translate,
                'agent_id',
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .validate(false, 1, 15)
                .toObject(),

              new FileField(
                this.translate,
                EmployeeEnum.profileImage,
                isEditMode,
                data,
                initialData,
              )
                .addFieldWidth('24%')
                .setAlignment('center')
                .toObject(),
            ],
          },
          {
            tabHeader: 'Upload Documents',
            fieldUniqueKey: 'file-upload',
            fields: [
              new CarouselField(
                this.translate,
                'employee_letter_images',
                isEditMode,
                data,
                initialData,
                'Upload Image',
              ).toObject(),
            ],
          },
          // {
          //     tabHeader: this.translate.instant('employee_documents_TC'),
          //     fieldUniqueKey: 'employee-documents',
          //     fields: [
          //         new TableBuilder(this.translate, EmployeeEnum.employeeDocumentDetails, undefined)
          //             .setTableScrollHeight('calc(100vh - 180px)')
          //             .columnSchema([
          //                 'document_name_TC',
          //                 'document_TC',
          //                 'documents_no_TC',
          //                 'documents_issued_date_TC',
          //                 'document_valid_upto_expiry_TC',
          //             ])
          //               .actionButtonConfig([
          //                 {
          //                     show: true,
          //                     icon: 'pi pi-eye',
          //                     toolTip: 'View',
          //                     tooltipPosition: 'top',
          //                     class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
          //                     onClick: this.onchangeView.bind(this),

          //                 }
          //             ])

          //             .formInitialise<EmployeeDocumentsTableModel>(new EmployeeDocumentsTableModel())
          //             .formSchema([
          //                 {
          //                     name: 'document_name',
          //                     type: 'input',
          //                     // readonly: true
          //                 },
          //                 {
          //                     type: 'file',
          //                     name: 'document',
          //                     path: '/media/employee_documents/document/',
          //                 },
          //                 {
          //                     name: 'document_number',
          //                     type: 'input'
          //                 },
          //                 {
          //                     name: 'issue_date',
          //                     type: 'date'
          //                 },
          //                 {
          //                     name: 'document_valid_upto',
          //                     type: 'date'
          //                 },
          //             ])
          //             .getDatasource<Array<EmployeeDocumentsTableModel>>('id', employeeDocumentsDetails)
          //             // .isHiddenAddButton(true)
          //             // .buttonStates(true, false, false, false, true)
          //             .build(),
          //     ]

          // },
        ]),
      ];
    };

  onChangeToggleExchangeNumber(
    prev: any,
    next: any,
    formValue: any,
    formFields: any,
  ): any {
    const getFieldByUniqueKey = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const ExchangeDetails = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.exchange_number,
    );
    const Iban_details = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.ibanNo,
    );
    // console.log("next", next);
    // console.log("iban_details", Iban_details);
    // console.log("ExchangeDetails", ExchangeDetails);
    if (next) {
      Iban_details.hidden = true;
      ExchangeDetails.hidden = false;
    } else {
      Iban_details.hidden = false;
      ExchangeDetails.hidden = true;
      formValue.exchange_number = null;
    }
    return formValue;
  }

  onChangePaymentMethod(
    prev: any,
    next: any,
    formValue: any,
    formFields: any,
  ): any {
    const getFieldByUniqueKey = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const accountTypeField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.accountType,
    );
    const bankNameField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.bankName,
    );
    const accountNumberField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.accountNumber,
    );
    const swiftCodeField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.swiftCode,
    );
    const routingField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.bankRoutingNo,
    );
    const isExchangeToggleField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.is_exchange_number,
    );
    const ibanField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.ibanNo,
    );
    const exchangeNumberField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.exchange_number,
    );

    if (next === 'WPS') {
      accountTypeField.hidden = false;
    } else {
      accountTypeField.hidden = true;
      bankNameField.hidden = true;
      accountNumberField.hidden = true;
      swiftCodeField.hidden = true;
      routingField.hidden = true;
      isExchangeToggleField.hidden = true;
      ibanField.hidden = true;
      exchangeNumberField.hidden = true;
      formValue.account_type = null;
      formValue.bank_name = null;
      formValue.account_number = null;
      formValue.swift_code = null;
      formValue.bank_routing_no = null;
      formValue.iban_no = null;
      formValue.exchange_number = null;
    }
    return formValue;
  }

  onChangeAccountType(
    prev: any,
    next: any,
    formValue: any,
    formFields: any,
  ): any {
    const getFieldByUniqueKey = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const bankNameField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.bankName,
    );
    const accountNumberField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.accountNumber,
    );
    const swiftCodeField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.swiftCode,
    );
    const routingField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.bankRoutingNo,
    );
    const isExchangeToggleField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.is_exchange_number,
    );
    const ibanField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.ibanNo,
    );
    const exchangeNumberField = getFieldByUniqueKey(
      'salary-payment-info',
      EmployeeEnum.exchange_number,
    );

    if (next === 'Bank Account') {
      bankNameField.hidden = false;
      accountNumberField.hidden = false;
      swiftCodeField.hidden = false;
      routingField.hidden = false;
      isExchangeToggleField.hidden = false;
      ibanField.hidden = !formValue?.is_exchange_number;
      exchangeNumberField.hidden = !!formValue?.is_exchange_number;
    } else {
      bankNameField.hidden = true;
      accountNumberField.hidden = true;
      swiftCodeField.hidden = true;
      routingField.hidden = true;
      isExchangeToggleField.hidden = true;
      ibanField.hidden = true;
      exchangeNumberField.hidden = true;
      formValue.bank_name = null;
      formValue.account_number = null;
      formValue.swift_code = null;
      formValue.bank_routing_no = null;
      formValue.iban_no = null;
      formValue.exchange_number = null;
    }
    return formValue;
  }

  async onBranchChange(prev: any, next: any, formValue: any, formFields: any) {
    // Extract the branch ID
    const branchId = next?.id ?? next;

    // Handle API call only when branch is selected (not when cleared)
    if (branchId) {
      return new Promise((resolve) => {
        this.apiService
          .get(`${ServiceUrlConstants.BRANCH_CRUD}${branchId}/`)
          .subscribe((res: any) => {
            resolve(formValue);
          });
      });
    }

    return formValue;
  }

  async createPaymentTerms(
    formValue: EmployeeModel,
    field: any,
    formFields: any,
  ) {
    const paymentTerms = await this._globalMasterService.createGlobalMaster(
      formValue,
      {
        pageTitle: 'Create Certificates',
        data: { global_key: 'employee_certificate' },
      },
    );
    const response: GlobalMasterModel = paymentTerms?.response;
    // console.log('response', response);
    if (Object.keys(response)?.length) {
      formValue.employee_documents_details.push({
        id: this.generateUniqueId(),
        document_name: response?.name,
      });
    }
    return { form: formValue };
  }
  PassPortPhotoUploadAutoFetch(
    event: any,
    field: any,
    form: UntypedFormGroup,
    formValue: any,
  ) {
    //   console.log("event", event);
    //   console.log("field", field);
    //   console.log("formValue", formValue);
    const autoFetch = localStorage.getItem('autoFetch') === 'true';

    if (!autoFetch) {
      console.log(
        'Auto-fetch is disabled. OCR processing skipped for passport.',
      );
      return;
    }

    const file = event?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    this.apiService
      .post(
        `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}passport_image/`,
        formData,
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const extract_data = response.data;
            console.log('Extract_data', extract_data);

            const formatDateToDDMMYYYY = (dateStr: string): string => {
              if (!dateStr || typeof dateStr !== 'string') return '';
              const parts = dateStr.split(/[/\-]/);
              if (parts.length === 3) {
                const [d, m, y] = parts;
                return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
              }
              return dateStr;
            };

            const passport_no = extract_data?.passport_number || '';
            const passport_issue_date = formatDateToDDMMYYYY(
              extract_data?.issue_date || '',
            );
            const passport_expiry_date = formatDateToDDMMYYYY(
              extract_data?.expiry_date || '',
            );

            // âœ… Use ENUM KEYS (field names), NOT data values
            const passportNoKey = EmployeeEnum.passportNo; // "passport_no"
            const passportIssueDateKey = EmployeeEnum.passportIssueDate; // "passport_issue_date"
            const passportExpiryDateKey = EmployeeEnum.passportExpiryDate; // "passport_expiry_date"

            // Update formValue (data model)
            formValue[passportNoKey] = passport_no;
            formValue[passportIssueDateKey] = passport_issue_date;
            formValue[passportExpiryDateKey] = passport_expiry_date;

            // Update FormGroup (UI controls)
            if (form) {
              form.get(passportNoKey)?.setValue(passport_no);
              form.get(passportIssueDateKey)?.setValue(passport_issue_date);
              form.get(passportExpiryDateKey)?.setValue(passport_expiry_date);
            }

            console.log('Passport fields updated:', {
              passport_no,
              passport_issue_date,
              passport_expiry_date,
            });
          }
        },
        error: (err) => {
          console.error('Passport upload failed:', err);
        },
      });
  }
  profileUploadFrontEmirates(
    event: any,
    field: any,
    form: UntypedFormGroup,
    formValue: any,
  ) {
    const autoFetch = localStorage.getItem('autoFetch') === 'true';

    if (!autoFetch) {
      console.log(
        'Auto-fetch is disabled. OCR processing skipped for emirates.',
      );
      return;
    }

    const file = event?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('side', 'front');

    this.apiService
      .post(
        `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}emirates_image/`,
        formData,
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success) {
            const extractedData = response.data || response;
            const idNumber =
              extractedData?.id_number || response?.id_number || '';
            const formatDateToDDMMYYYY = (dateStr: string): string => {
              if (!dateStr || typeof dateStr !== 'string') return '';
              // Handle both "DD/MM/YYYY" and already "DD-MM-YYYY"
              const parts = dateStr.split(/[/\-]/); // split on / or -
              if (parts.length === 3) {
                const [d, m, y] = parts;
                return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
              }
              return dateStr; // fallback
            };

            const issuingDate = formatDateToDDMMYYYY(
              extractedData?.issuing_date || response?.issuing_date || '',
            );
            const expiryDate = formatDateToDDMMYYYY(
              extractedData?.expiry_date || response?.expiry_date || '',
            );

            // Use enum keys (snake_case)
            const idKey = EmployeeEnum.emiratesIdNo; // "emirates_id_no"
            const issueKey = EmployeeEnum.emiratesIdIssueDate; // "emirates_id_issue_date"
            const expiryKey = EmployeeEnum.emiratesIdExpiryDate; // "emirates_id_expiry_date"

            // Update formValue
            formValue[idKey] = idNumber;
            formValue[issueKey] = issuingDate;
            formValue[expiryKey] = expiryDate;

            // Update FormGroup controls (triggers UI update)
            if (form) {
              form.get(idKey)?.setValue(idNumber);
              form.get(issueKey)?.setValue(issuingDate);
              form.get(expiryKey)?.setValue(expiryDate);
            }
          }
        },
        error: (err) => {
          console.error('Emirates upload failed:', err);
        },
      });
  }

  async onClickPaymentTerms(
    event: any,
    tableValue: EmployeeDocumentsTableModel,
    formValue: EmployeeModel,
  ) {
    const queryParams = { is_active: true, global_key: 'employee_certificate' };
    const response = await this._globalMasterService.selectGlobalMaster(
      formValue,
      { queryParams: queryParams, pageTitle: 'Select Certificates' },
    );
    // console.log('onClickUnit', response);
    const unitMasterObject = response?.selected;
    tableValue.document_name = unitMasterObject?.name;
    return { tableValue: tableValue };
  }

  onChangeToggle(prev: any, next: any, formValue: any, formFields: any): any {
    const getFieldByUniqueKey = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const detailsFieldSet = getFieldByUniqueKey(
      'employee-details',
      EmployeeEnum.groups,
    );
    const detailsFieldSets = getFieldByUniqueKey(
      'employee-details',
      EmployeeEnum.userPassword,
    );

    if (next) {
      detailsFieldSet.hidden = false;
      detailsFieldSets.hidden = false;
    } else {
      detailsFieldSet.hidden = true;
      detailsFieldSets.hidden = true;
      formValue.groups = null;
      formValue.user_password = null;
    }
    return formValue;
  }
  onchangeToggleTechnician(
    prev: any,
    next: any,
    formValue: any,
    formFields: any,
  ) {
    const getField = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const detailsfieldsets = getField(
      'Operator-Mechanic-Classification',
      EmployeeEnum.technician_type,
    );
    if (next) {
      detailsfieldsets.hidden = false;
    } else {
      detailsfieldsets.hidden = true;
      formValue.technician_type = null;
    }
    return formValue;
  }
  onchangeToggleOperator(
    prev: any,
    next: any,
    formValue: any,
    formFields: any,
  ) {
    const getField = (key: string, name: string) =>
      formFields
        .find((ele) => ele?.fieldUniqueKey === key)
        ?.fields.find((ele) => ele?.name === name);
    const detailsfieldsets = getField(
      'Operator-Mechanic-Classification',
      EmployeeEnum.operator_type,
    );
    if (next) {
      detailsfieldsets.hidden = false;
    } else {
      detailsfieldsets.hidden = true;
      formValue.operator_type = null;
    }
    return formValue;
  }
  async onClickUpdatePassword(
    formValue: EmployeeModel,
    field: any,
    formFields: any,
  ) {
    const dialogData = { employee: this.employeeId || '' };
    const response = await this.empService.updatePassword(
      formValue,
      dialogData,
    );
    formValue.user_password = response?.response;
    return formValue;
  }

  // onchangeView(formValue: EmployeeDocumentsTableModel) {
  //     const fileUrl = formValue?.document;
  //     if (!fileUrl || typeof fileUrl !== 'string') {
  //         console.error('No valid document URL found.');
  //         return;
  //     }

  //     const fileName = fileUrl.split('/').pop() || 'downloaded_file';
  //     const fileExtension = fileName.split('.').pop()?.toLowerCase();

  //     const newTab = window.open('', '_blank', 'width=800,height=600');
  //     if (!newTab) {
  //         alert('Popup blocked. Please allow popups for this website.');
  //         return;
  //     }

  //     if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
  //         newTab.document.body.innerHTML = `
  //       <img src="${fileUrl}" style="max-width: 100%; height: auto; margin: auto; display: block;" />
  //       <br><center><a href="${fileUrl}" download="${fileName}">Download</a></center>
  //     `;
  //     } else if (fileExtension === 'pdf') {
  //         newTab.document.body.innerHTML = `
  //       <embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">
  //       <br><center><a href="${fileUrl}" download="${fileName}">Download PDF</a></center>
  //     `;
  //     } else {
  //         newTab.document.body.innerHTML = `
  //       <p>Preview not available for this file type: ${fileExtension?.toUpperCase()}</p>
  //       <br><center><a href="${fileUrl}" download="${fileName}">Download File</a></center>
  //     `;
  //     }
  // }

  // updated preview doc before save
  onchangeView(formValue: EmployeeDocumentsTableModel) {
    const fileData: any = formValue?.document;

    if (
      !fileData ||
      (typeof fileData === 'object' && Object.keys(fileData).length === 0)
    ) {
      this.sharedService.handleWarning('No file available');
      return;
    }

    let fileUrl = '';
    let fileName = 'downloaded_file';
    let fileExtension = '';

    // CASE 1: direct File object
    if (fileData instanceof File) {
      fileName = fileData.name;
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      fileUrl = URL.createObjectURL(fileData);
    }

    // CASE 2: table file object before save
    else if (fileData?.file instanceof File) {
      fileName = fileData.file.name;
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      fileUrl = URL.createObjectURL(fileData.file);
    }

    // CASE 3: base64 object before save
    else if (
      typeof fileData?.file === 'string' &&
      fileData.file.startsWith('data:')
    ) {
      fileUrl = fileData.file;
      fileName = fileData.file_name || 'uploaded_file';
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    }

    // CASE 4: saved URL after save
    else if (typeof fileData === 'string') {
      fileUrl = fileData;
      fileName = fileUrl.split('/').pop() || 'downloaded_file';
      fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    } else {
      console.error('Invalid document format:', fileData);
      this.sharedService.handleWarning('Invalid document format');
      return;
    }

    const newTab = window.open(
      '',
      '_blank',
      'width=800,height=600,scrollbars=yes,resizable=yes',
    );

    if (!newTab) {
      this.sharedService.handleWarning('Popup blocked. Please allow popups.');
      return;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
      newTab.document.body.innerHTML = `
    <img src="${fileUrl}" style="max-width:100%; height:auto; margin:auto; display:block;" />
    <br><center><a href="${fileUrl}" download="${fileName}">Download</a></center>
  `;
    } else if (fileExtension === 'pdf') {
      newTab.document.body.innerHTML = `
    <embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">
    <br><center><a href="${fileUrl}" download="${fileName}">Download PDF</a></center>
  `;
    } else {
      newTab.document.body.innerHTML = `
      <p>Preview not available for ${fileExtension}</p>
      <a href="${fileUrl}" download="${fileName}">Download File</a>
    `;
    }
  }

  getGlobalDefaultObj(isEditMode, data) {
    if (isEditMode) {
      return {
        id: data,
        name: data,
      };
    } else {
      return {};
    }
  }

  getShiftDefaultObj(isEditMode, data) {
    if (isEditMode) {
      return {
        id: data?.[EmployeeEnum.defaultShift],
        shift_name: data?.[EmployeeEnum.defaultShiftName],
      };
    } else {
      return {};
    }
  }
  async onChangeShiftDetails(prev, next, formValue) {
    console.log('onChangeShiftDetails called:');
    console.log('  prev:', prev);
    console.log('  next:', next);
    console.log('  typeof next:', typeof next);

    if (next) {
      // next is just the ID (number), need to fetch the full object
      return new Promise((resolve) => {
        this.apiService
          .get(`${HrmServiceUrlConstants.SHIFT_MASTER_DURATION}${next}/`)
          .subscribe({
            next: (response: any) => {
              console.log('Shift details response:', response);
              formValue.default_shift_new = response?.duration || '';
              resolve(formValue);
            },
            error: (err) => {
              console.error('Failed to fetch shift details:', err);
              formValue.default_shift_new = '';
              resolve(formValue);
            },
          });
      });
    } else {
      formValue.default_shift_new = null;
      return formValue;
    }
  }

  async updateDocumentRows(rows: any[], dataSource: any[] = []) {
    const normalize = (value: any) =>
      String(value || '')
        .trim()
        .toLowerCase();

    const result = (dataSource || []).filter(
      (doc: any) =>
        normalize(doc?.document_name) || doc?.document || doc?.document_number,
    );

    for (const row of rows || []) {
      const docName = String(row?.doc_type_name || '').trim();
      if (!docName) continue;

      const alreadyExists = result.some(
        (doc: any) => normalize(doc?.document_name) === normalize(docName),
      );

      if (alreadyExists) continue;

      result.push({
        id: this.generateUniqueId(),
        equipment_document: null,
        employee_document: null,
        document_type_master: row.id || null,
        document_type: row.doc_type_code || '',
        document_name: docName,
        version: 1,

        authority_issuer: null,

        document: null,
        document_number: '',
        issue_date: null,
        document_valid_upto: null,
        days_to_expiry: '',
        document_status: '',
        remarks: '',
        uploaded_by: '',
        uploaded_date: null,
      } as any);
    }

    return result;
  }
}
