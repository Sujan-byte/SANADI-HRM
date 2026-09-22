import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormConfigService } from 'src/app/modules/hrm-shared/core/services/form-config.service';
import { FormObserver } from 'src/app/modules/hrm-shared/core/shared/common/forms/core/form-observer';
import { DynamicFormGeneratorModule } from 'src/app/modules/hrm-shared/sanadi-library/dynamic-form-generator/dynamic-form-generator.module';

@Component({
  selector: 'sanadi-custom-dialog',
  standalone: true,
  imports: [DynamicFormGeneratorModule],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.scss'
})
export class CustomDialogComponent {
  showAppSettingsModifier: boolean = false;

  formFields: any = [];

  private translate = inject(TranslateService);
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private formConfig = inject(FormConfigService);
  private readonly formObserver = inject(FormObserver);

  ngOnInit(): void {
    this.setAppSettingsFields();
  }
  async setAppSettingsFields() {
    const formFields = this.config?.data?.form;
    // this.formConfig2.getForm()[this.config.data.config.formName];
    if (typeof formFields === "function") {
      // if (this.config.data.isEditMode) {
      this.formFields = formFields(this.config?.data?.config?.dropdownOptions, null, true, this.config?.data?.data);
      // } else {
      //   this.formFields = formFields(this.config.data.config.dropdownOptions, this.config.data?.initialData, false, this.config.data?.initialData);
      // }
      // console.log("comes here default data",this.config.data)
    }
    if (this.config?.data?.formSetting && Object.keys(this.config?.data?.formSetting)?.length) {
      this.formFields = this.config?.data?.formSetting?.isUpdate ? await this.config?.data?.formSetting?.updateFields(this.formFields) : this.formFields;
      // console.log('come here', this.formFields);
    }
  }

  getFields() {
    return this.formFields;
  }

  onValueChange(formResponse: any) {
    // console.log("form re", formResponse)
    const item = this.config.data.item;
    this.config.data['form'] = formResponse.data;
    if (formResponse?.data) {
      this.config.data.item = { ...item, ...formResponse.data.data };
    }
    this.config.data.formFields = this.formFields;
  }

  onTabChange(res: any) {
    this.config.data['tabConfig'] = res;
  }
}
