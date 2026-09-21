import { Injectable, ViewChild, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { CareerLetterModel } from 'src/app/core/shared/common/model/hrm/career-letter.model';
import { CareerLetterEnum } from 'src/app/core/shared/common/enum/hrm-enum/career-letter.enum';
import { GlobalMasterFormConfig } from 'src/app/core/shared/common/forms/masters-forms/global-master-from.config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { EditorJSBuilder } from 'src/app/core/shared/common/forms/core/builders/editor.builder';
import { EditorJsComponent } from 'src/app/sanadi-library/dynamic-form-generator/fields/editor-js/editor-js.component';
import { EditorService } from 'src/app/modules/masters/editor/service/editor-services';
import { ToggleBuilder } from 'src/app/core/shared/common/forms/core/builders/toggle.builder';
import { CarouselField } from 'src/app/core/shared/common/forms/core/builders/carousel.builder';



@Injectable({
  providedIn: 'root',
})
export class CareerLetterFormConfig {
  @ViewChild('editorjs') editor: HTMLElement;
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private editorService = inject(EditorService);

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
  //globalMasterList dropDown update
  updateDynamicGlobalMasterDropdownOptions(response) {
    console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results[0]?.global_value;
      return options;
    }
  }
  //globalMaster delogue
  setGlobalMasterMasterConfig() {
    this.globalMasterConfig.set({
      pageTitle: this.translate.instant('createData_TC'),
      dialogData: {},
      dialogConfig: {
        height: '40%',
        width: '35%'
      },
      isShowDialog: true,
    })
  }

  onChangeEmployee(prev, next, formValue: CareerLetterModel) {


    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${next}`).subscribe((response: any) => {
        formValue.first_name = response?.first_name
        formValue.last_name = response?.last_name
        formValue.email = response?.email
        formValue.mobile_no = response?.home_mobile_number
        formValue.employee_code = response?.employee_code
        formValue.title = response?.title
        formValue.employee_designation = response?.designation_name
        formValue.department_name = response?.department_name
        formValue.doj = response.doj

        if (formValue?.date && formValue?.doj) {
          const dojString = this.formatToString(formValue.doj);
          const dateString = this.formatToString(formValue.date);

          const yearOfService = this.calculateYearsOfService(dojString, dateString);
          formValue['years_of_service'] = yearOfService; // Add to formValue
          console.log("Years of Service: ", yearOfService);
        }

        console.log("THe formValue onChange employee is:", formValue)
        resolve(formValue);
      })
    })
  }



  saveDynamicDropdownData(attribute: any, event: any, form: any) {
    return { data: event, attribute: attribute }
  }

  updateDynamicDropdownOptions(response) {
    console.log("response", response)
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }

  public readonly CareerLetterForm =
    () =>
      (dataFromComponent?: any, initialData?: CareerLetterModel, isEditMode?: boolean, data?: CareerLetterModel) => {
        initialData = new CareerLetterModel();
        this.setGlobalMasterMasterConfig()
        if (initialData) {
          initialData.is_header_footer = true
        }
        let default_global_object = isEditMode ? data.default_global_object : {};
        let default_subject_object = isEditMode ? data.default_subject_object : {};
        let default_employee_object = isEditMode ? data.default_employee_object : {};
        let default_editor_for_object = isEditMode ? data?.default_editor_for_object : {};

        // if(isEditMode){
        //   data.subject_template = JSON.parse(data?.subject_template) || {}
        // }
        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'career-tab',
                fields: [
                  new DateField(this.translate, CareerLetterEnum.date, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true)
                    // .addFormat("yy-mm-dd")
                    .toObject(),


                  new DropdownField(this.translate, CareerLetterEnum.editor, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                    .addFieldWidth('24%')
                    .getOptions(signal([]))
                    .validate(true)
                    .setDefaultObject(default_editor_for_object)
                    .addKeyValueLabelList(['editor_type_name', 'subject'], 'id')
                    // .addKeyValueLabel('editor_type_name', 'id')
                    .onChangeOnly(this.onChangeEditorTypes.bind(this))
                    // .isFieldHidden(isTemplete)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.EDITOR_CURD}`,
                        params: {
                          page_size: 30,
                          is_active: true,
                          search_key: 'subject,config_editor__editor_type',
                          config_editor__editor_type: 'Career Letter',
                        },
                        filterKeys: [`search`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.subject, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isFieldHidden(true)
                    .isReadOnly(true)
                    .toObject(),
                  // new DropdownField(this.translate, CareerLetterEnum.subject, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
                  //   .addFieldWidth('24%')
                  //   .addKeyValueLabel('name', 'id')
                  //   .validate(true)
                  //   .addDynamicDialogConfig({
                  //     config: this.globalMasterConfig(),
                  //     isEditMode: true,
                  //     data: { global_key: 'career_letter_subject', label: 'subject' },
                  //     formConfig: this.globalMasterForm.GlobalMasterForm()
                  //   })
                  //   .saveData(this.saveDynamicDropdownData.bind(this, 'subject'))
                  //   .getOptions(this.globalList)
                  //   .isLazyFilterDropDown(true)
                  //   .setDefaultObject(default_subject_object)
                  //   .getUrlConfig({
                  //     post: {
                  //       url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  //     },
                  //     get: {
                  //       url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                  //       params: {
                  //         page_size: 30, is_active: true, global_key: 'career_letter_subject'
                  //       },
                  //     }
                  //   })
                  //   .onChangeOnly(this.onGlobalMasterTemplate.bind(this))
                  //   .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                  //   .toObject(),
                  // new DropdownField(this.translate, CareerLetterEnum.career_latter_type, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
                  //   .addFieldWidth('24%')
                  //   .addKeyValueLabel('name', 'id')
                  //   .addDynamicDialogConfig({
                  //     config: this.globalMasterConfig(),
                  //     isEditMode: true,
                  //     data: { global_key: 'career_latter_type' },
                  //     formConfig: this.globalMasterForm.GlobalMasterForm()
                  //   })
                  //   .saveData(this.saveDynamicDropdownData.bind(this, 'career_latter_type'))
                  //   .getOptions(this.globalList)
                  //   .isLazyFilterDropDown(true)
                  //   .validate(true)
                  //   .setDefaultObject(default_global_object)
                  //   .getUrlConfig({
                  //     post: {
                  //       url: ServiceUrlConstants.ACTION_GLOBAL_MASTER_CRUD,
                  //     },
                  //     get: {
                  //       url: ServiceUrlConstants.GLOBAL_MASTER_CRUD,
                  //       params: {
                  //         page_size: 30, is_active: true, global_key: 'career_latter_type'
                  //       },
                  //     }
                  //   })
                  //   .bindOption(this.updateDynamicGlobalMasterDropdownOptions.bind(this))
                  //   .toObject(),
                  new DropdownField(this.translate, CareerLetterEnum.employee, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['employee_code', 'first_name', 'designation_name'], 'id')
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .validate(false)
                    .setRequiredFields('id,employee_code,first_name')
                    .setDefaultObject(default_employee_object)
                    .onChangeOnly(this.onChangeEmployee.bind(this))
                    .getUrlConfig({
                      get: {
                        url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                        params: { page_size: 30, is_active: true },
                        // filterKeys: [`employee_code__${FilterOptions.istartsWith}`]
                        filterKeys: [
                          `employee__employee_code${FilterOptions.istartsWith}`,
                          `designation__designation_name${FilterOptions.istartsWith}`,
                          `employee__first_name${FilterOptions.istartsWith}`
                        ]

                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.first_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.last_name, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.email, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.mobile_no, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .isReadOnly(true)
                    .toObject(),

                  new InputField(this.translate, CareerLetterEnum.years_of_service, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.employeeName, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => !(formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.passPort, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => !(formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.Nationality, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .isReadOnly(true)
                    .setIsHiddenFunction(true)
                    .setHideFields((formValue: CareerLetterModel) => !(formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.employeeCode, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isFieldHidden(true)
                    // .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),

                  new InputField(this.translate, CareerLetterEnum.tittle, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isFieldHidden(true)
                    // .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new InputField(this.translate, CareerLetterEnum.departmentName, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isFieldHidden(true)
                    .toObject(),

                  new InputField(this.translate, CareerLetterEnum.employeeDesignation, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isReadOnly(true)
                    .isFieldHidden(true)
                    // .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new ToggleBuilder(this.translate, CareerLetterEnum.isHeaderFooter, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    // .isReadOnly(true)
                    // .isFieldHidden(true)
                    // .setHideFields((formValue: CareerLetterModel) => (formValue?.subject == 'Offer Letter'))
                    .toObject(),
                  new EditorJSBuilder(this.translate, CareerLetterEnum.subject_template, isEditMode, data, initialData)
                    // .onChange(this.onChangeTemplate.bind(this))
                    .isButtonVisible(true)
                    .refresh(this.onRefresh.bind(this))

                    .toObject(),
                  new DateField(this.translate, CareerLetterEnum.doj, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .isFieldHidden(true)
                    .validate(false)
                    // .addFormat("yy-mm-dd")
                    .toObject(),
                ],
              },
              {
                tabHeader: "Upload Documents",
                fieldUniqueKey: 'file-upload',
                fields: [
                  new CarouselField(this.translate, 'career_letter_images', isEditMode, data, initialData, 'Upload Image')
                    .toObject()
                ]
              },
            ])
        ];
      };

  onGlobalMasterTemplate(prev, next, formValue, formFields) {
    if (next) {
      const employee = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'employee');
      const subject = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'subject');
      const first_name = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'first_name');
      const last_name = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'last_name');
      const email = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'email');
      const mobile_no = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'mobile_no');
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.GLOBAL_MASTER_CRUD}get_global_master_by_json_value/?global_value=${next}&global_key=career_letter_subject`).subscribe((res: any) => {
          if (res) {
            if (subject.value == 'Offer Letter') {
              employee.hidden = true
              first_name.hidden = true
              last_name.hidden = true
              email.hidden = true
              mobile_no.hidden = true
            }
            else {
              employee.hidden = false
              first_name.hidden = false
              last_name.hidden = false
              email.hidden = false
              mobile_no.hidden = false
            }
            formValue.subject_template = res || {};
            const editorJSField = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'subject_template');
            console.log("res", res)
            if (formValue.subject_template) {
              editorJSField.editor.render(formValue.subject_template);
            }
            else {
              editorJSField.editor.render({});
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
  async onChangeEditorTypes(prev: any, next: any, formValue: CareerLetterModel, formFields: any) {
    if (next) {
      const employee = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'employee');
      const subject = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'subject');
      const first_name = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'first_name');
      const last_name = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'last_name');
      const email = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'email');
      const mobile_no = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'mobile_no');
      return new Promise((resolve) => {
        this.apiService.get(`${ServiceUrlConstants.EDITOR_CURD}${next}`).subscribe((res: any) => {
          if (res) {
            console.log("res", res)
            formValue.subject = res?.subject
            if (res?.subject == 'Offer Letter') {
              employee.hidden = true
              first_name.hidden = true
              last_name.hidden = true
              email.hidden = true
              mobile_no.hidden = true
            }
            else {
              employee.hidden = false
              first_name.hidden = false
              last_name.hidden = false
              email.hidden = false
              mobile_no.hidden = false
            }
            formValue.subject_template = res?.editor_template || {};
            const editorJSField = formFields.find((ele) => ele?.fieldUniqueKey == 'career-tab')?.fields.find((ele) => ele?.name == 'subject_template');
            console.log("res", res)
            if (formValue.subject_template) {
              editorJSField.editor.render(formValue.subject_template);
            }
            else {
              editorJSField.editor.render({});
            }

          }
          resolve(formValue)
        })
      })
    }
    // formValue = await this.editorService?.onChangeEditorTypes(0, formValue?.editor, formValue, formFields, 'Refresh',formValue?.first_name);
    return formValue;
  }
  // onChangeTemplate(prev, next, formValue, formFields){
  //   if(next){
  //     console.log("comes on value changes",next,formValue)
  //     return formValue
  //   }
  // }

  // Converts Date or string to "dd-mm-yyyy" string safely
  formatToString(value: any): string {
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return value; // Already a string like "10-11-2025"
  }

  // Calculates full years between two dates
  calculateYearsOfService(doj: string, currentDate: string): number {
    const [d1, m1, y1] = doj.split('-').map(Number);
    const [d2, m2, y2] = currentDate.split('-').map(Number);

    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);

    let years = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    const d = end.getDate() - start.getDate();

    // Adjust if the anniversary hasn't been reached yet
    if (m < 0 || (m === 0 && d < 0)) {
      years--;
    }

    return years;
  }





  async onRefresh(event, formValue, formFields) {

    console.log(" formValue onRefresh is:", formValue)
    formValue = await this.editorService?.onChangeEditorTypes(0, formValue?.editor, formValue, formFields, 'Refresh', formValue?.first_name);
    return formValue;
  }
}
