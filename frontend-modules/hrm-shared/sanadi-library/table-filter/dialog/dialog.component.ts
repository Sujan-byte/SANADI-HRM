import { Component, inject, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormConfigService } from 'src/app/modules/hrm-shared/core/services/form-config.service';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { DynamicFormGeneratorModule } from '../../dynamic-form-generator/dynamic-form-generator.module';
import { FormObserver } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/form-observer';
import { FormBuilderComponent } from '../../dynamic-form-generator/components/form-builder/form-builder.component';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { ValidationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';

@Component({
  selector: 'sanadi-dialog',
  standalone: true,
  imports: [DynamicFormGeneratorModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  showAppSettingsModifier: boolean = false;

  formFields: any = [];

  private translate = inject(TranslateService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private formConfig = inject(FormConfigService);
  private formConfig2 = inject(FormConfig);
  private readonly formObserver = inject(FormObserver);
  @ViewChild(FormBuilderComponent) formBuilder: FormBuilderComponent;

  ngOnInit(): void {
    // console.log('DialogComponent', this.config);
    this.setAppSettingsFields();
  }

  async setAppSettingsFields() {
    const formFields = this.config.data.form;
    // this.formConfig2.getForm()[this.config.data.config.formName];
    if (typeof formFields === "function") {
      if (this.config.data.isEditMode) {
        this.formFields = formFields({ config: this.config, ref: this.ref }, null, true, this.config.data.item, this.ref);
      } else {
        this.formFields = formFields({ config: this.config, ref: this.ref }, this.config.data?.initialData, false, this.config.data?.initialData);
      }
      // console.log("comes here default data",this.config.data)
      // console.log('formFields', this.formFields);
    }
    if (this.config?.data?.formSetting && Object.keys(this.config?.data?.formSetting).length) {
      this.formFields = this.config?.data?.formSetting?.isUpdate ? await this.config?.data?.formSetting?.updateFields(this.formFields) : this.formFields;
      // console.log('come here', this.formFields);
    }
  }

  getFields() {
    return this.formFields;
  }

  onValueChange(formResponse: any) {
    // console.log("onValueChange", formResponse);
    const item = this.config.data.item;
    this.config.data['form'] = formResponse.data;
    if (formResponse?.data) {
      this.config.data.item = { ...item, ...formResponse.data.data };
    }
    this.config.data.formFields = this.formFields;
    if (this.formBuilder) {
      this.setFormFields(this.formFields, this.formBuilder.form);
    }
  }

  onTabChange(res: any) {
    this.config.data['tabConfig'] = res;
  }

  setFormFields(formFields, form) {
    for (let f of formFields) {
      if (
        f?.type === 'fieldset' ||
        f?.type === 'card' ||
        f?.type === 'multi-blocks' ||
        f?.type === 'accordion'
      ) {
        for (let f1 of f?.fields) {
          // console.log("f1",f1)
          if (f1?.type === 'boolean' && f1?.type !== 'fieldset') {
            f1?.validationFunction ? this.updateValidation(f1, form) : '';
          } else {
            if (f1?.type != 'checkbox' && f1?.type !== 'fieldset') {
              f1?.validationFunction ? this.updateValidation(f1, form) : '';
            } else if (f1?.type === 'fieldset' || f1?.type === 'accordion') {
              for (let f2 of f1?.fields) {
                if (f2?.type === 'boolean') {
                  f2?.validationFunction ? this.updateValidation(f2, form) : '';
                } else {
                  if (f2?.type != 'checkbox') {
                    f2?.validationFunction ? this.updateValidation(f2, form) : '';
                  }
                }
              }
            }
          }
        }
      } else if (f?.type === 'boolean') {
        f?.validationFunction ? this.updateValidation(f, form) : '';
      } else {
        if (f?.name && f?.type != 'checkbox') {
          f?.validationFunction ? this.updateValidation(f, form) : '';
        }
      }
      if (f?.type === 'tab') {
        for (let f1 of f?.fields) {
          for (let f2 of f1?.fields) {
            if (f2?.type === 'boolean' && f2?.type !== 'fieldset') {
              if (f2?.name) {
                f2?.validationFunction ? this.updateValidation(f2, form) : '';
              }
            } else {
              if (f2?.name) {
                if (f2?.subForm) {
                  let subFieldsCtrls: any = {};
                  if (f2?.subForm?.length > 0) {
                    for (let sub of f2?.subForm) {
                      sub?.validationFunction ? this.updateValidation(sub, form) : '';
                    }
                  }
                  f2?.validationFunction ? this.updateValidation(f2, form) : '';
                } else {
                  if (f2?.type != 'checkbox' && f2?.type !== 'fieldset') {
                    f2?.validationFunction ? this.updateValidation(f2, form) : '';
                  }
                }
              }
              if (f2?.type === 'accordion') {
                for (let sub of f2?.fields) {
                  for (let accord of sub?.fields) {
                    if (accord?.type === 'multi-blocks') {
                      for (let multiblock of accord?.fields) {
                        multiblock?.validationFunction ? this.updateValidation(multiblock, form) : '';
                      }
                    } else {
                      accord?.validationFunction ? this.updateValidation(accord, form) : '';
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  updateValidation(field: any, form: any) {
    const control = form.get(field?.name);
    if (!control) return;

    control.setErrors(null);
    control.clearValidators();
    control.clearAsyncValidators();

    if (field?.validationFunction && typeof field.validationFunction === 'function') {
      const isHiddenField = field?.hidden || field?.hideFunction && field?.hideFunction(form?.value);
      const validation: ValidationModel = isHiddenField ? { ...field.validationFunction(form?.value) } : { ...field.validation, ...field.validationFunction(form?.value) };
      const validationObj = this.getValidateObject(validation, field);

      field.validation = {
        ...(field.validation || {}),
        ...(validationObj?.validationObj || {})
      };

      field.errorText = {
        ...(field.errorText || {}),
        ...(validationObj?.errorObj || {})
      };

      if (validationObj?.formValidators?.length) {
        control.setValidators(validationObj.formValidators);
      }
    }

    control.updateValueAndValidity({ emitEvent: false });
    this.updateFormValidity(form);
  }

  getValidateObject(validation: ValidationModel, field: any) {
    let validationObj: any = {};
    let errorObj = {
      required: '',
      minlength: '',
      maxlength: '',
      pattern: '',
    };
    const formValidators = [];

    if (('required' in validation) && validation['required']) {
      validationObj.required = validation['required'];
      errorObj.required = this.translate.instant('formRequiredError_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.required);
    }
    if (('minLength' in validation) && validation['minLength']) {
      validationObj.minlength = validation['minLength'];
      errorObj.minlength = this.translate.instant('formMinLengthError_SC', {
        label: this.translate.instant(field?.label),
        char: this.translate.instant(validation['minLength'] ? validation['minLength'].toString() : ''),
      });
      formValidators.push(Validators.minLength(validation['minLength']));
    }
    if (('maxLength' in validation) && validation['maxLength']) {
      validationObj.maxlength = validation['maxLength'];
      errorObj.maxlength = this.translate.instant('formMaxLengthError_SC', {
        label: this.translate.instant(field?.label),
        char: this.translate.instant(validation['maxLength'] ? validation['maxLength'].toString() : ''),
      });
      formValidators.push(Validators.maxLength(validation['maxLength']));
    }
    if (('isEmail' in validation) && validation['isEmail']) {
      validationObj.pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      errorObj.pattern = this.translate.instant('formEmailError_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.pattern(validationObj.pattern));
    }
    if (('password' in validation) && validation['password']) {
      validationObj.pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      errorObj.pattern = this.translate.instant('formPasswordError_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.pattern(validationObj.pattern));
    }
    if (('isGST' in validation) && validation['isGST']) {
      validationObj.pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      errorObj.pattern = this.translate.instant('formGstError_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.pattern(validationObj.pattern));
    }
    if (('isPhoneNumber' in validation) && validation['isPhoneNumber']) {
      validationObj.pattern = /^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}?\)?)[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})?$/;
      errorObj.pattern = this.translate.instant('formPhoneNumber_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.pattern(validationObj.pattern));
    }
    if (('isHsn' in validation) && validation['isHsn']) {
      validationObj.pattern = /^\d{8}$/;
      errorObj.pattern = this.translate.instant('formHsnError_SC', {
        label: this.translate.instant(field?.label),
      });
      formValidators.push(Validators.pattern(validationObj.pattern));
    }
    if (('warning' in validation) && validation['warning']) {
      formValidators.push(() => ({ warning: true }));
    }
    return { validationObj: validationObj, errorObj: errorObj, formValidators: formValidators || [] };
  }

  updateFormValidity(form: UntypedFormGroup) {
    let hasError = Object.values(form.controls).some(control => control.invalid);

    if (hasError) {
      form.setErrors({ invalid: true });
      this.config.data.form.isFormValid = true;
    } else {
      form.setErrors(null);
      this.config.data.form.isFormValid = false;
    }
  }

}
