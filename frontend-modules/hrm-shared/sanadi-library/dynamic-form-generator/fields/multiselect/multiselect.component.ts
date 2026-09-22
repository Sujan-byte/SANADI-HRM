import { Component, Input, OnInit, inject } from '@angular/core';
import { Form, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { debug } from 'console';
import { MultiSelectRemoveEvent } from 'primeng/multiselect';
import { Observable, debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';

interface FormObject {
  options: any,
  formValue: any
}

@Component({
  selector: 'app-multiselect',
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss']
})
export class MultiselectComponent implements OnInit {

  selecteddata: any = [
  ]
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  private translate = inject(TranslateService);
  private _sharedService = inject(SharedService);
  private apiService = inject(ApiService);
  @Input() formFields: any;
  loading: boolean = false;
  get isValid() {

    return this.form?.controls[this.field.name].valid;
  }
  get isDirty() {
    return this.form?.controls[this.field.name].dirty;
  }

  get dynamicLabel(): string {
    if (this.field?.labelFunction) {
      return this.field.labelFunction(this.form.value);
    }
    return this.field?.label ?? '';
  }

  get dynamicPlaceholder(): string {
    if (this.field?.labelFunction) {
      return this.translate.instant('formPlaceholder_SC', { label: this.dynamicLabel });
    }
    return this.field?.placeholder ?? '';
  }

  get errorText() {
    let errorText = '';
    if (Object.keys(this.form?.controls[this.field?.name]?.errors)?.length > 0) {
      Object.keys(this.form?.controls[this.field.name].errors).forEach((validation) => {
        if (validation === 'required' && this.field?.labelFunction) {
          errorText += this.translate.instant('formRequiredError_SC', { label: this.dynamicLabel }) + ' ';
        } else if (this.field?.errorText?.hasOwnProperty(validation)) {
          errorText += this.field?.errorText[validation] + ' ';
        }
      })
    }
    return errorText ? errorText : this.field?.errorText ? this.field?.errorText : 'This field is invalid';
  }
  constructor(private _dialogHandlerService: DialogHandlerService) { }

  ngOnInit(): void {
    this.selecteddata = this.field.value;
    // console.log("on multiselect ng on init",this.field)

    if (this.field?.defaultObject?.length) {
      this.field.options.set(this.field?.defaultObject);
    }

    this.onValueChanges();

  }

  onSelect() {
    this.field.value = this.selecteddata;
    this.form.get(this.field.name).setValue(this.selecteddata);

    // console.log("selected data",event)
    // console.log("selected data1",this.selecteddata)
  }

  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(async ([prev, next]: [any, any]) => {
          console.log("this.formFields", this.formFields)
          const value = await this.field?.onValueChange(prev, next, this.form.value, this.formFields);
          console.log('values form', value);
          if (value) {
            this.form.patchValue(value);
          }
        });
    }
  }

  onClick(event: any) {
    if (typeof (this.field.onClick) === 'function') {
      this.field.onClick(event, this.form?.controls[this.field.name].value, this.form.value);
    }
  }

  async onRemove(event: any) {
    console.log('event mlutiselect remove', event);
    if (typeof (this.field.onRemove) === 'function') {
      const formValue = await this.field.onRemove(event, this.form.get(this.field?.name).value, this.form.value, this.formFields);
      if (formValue) {
        if (Object.keys(formValue)?.length) {
          this.form.patchValue(formValue);
        }
      }
    }
  }

  getSelectedItemsLabel(selectedItems: any[]) {
    console.log("on selected label", selectedItems)
    return ''
    // if (selectedItems.length === 0) {
    //   return "Select a column";
    // } else if (selectedItems.length === 1) {
    //   return selectedItems[0][this.field?.optionLabel];
    // } else {
    //   return selectedItems.map(item => item[this.field?.optionLabel]).join(", ");
    // }
  }

  async saveDialogueData(event: any) {
    if (this.field?.lazyDropdown) {
      const response$: { form: Form, data: any, attribute: any } = await this.field?.saveDialogueData(event, this.form.value);
      const savedRes = await this.saveDropdownOptionByAPI(response$?.data);
      console.log("saved ref", savedRes)
      if (Object.keys(savedRes).length > 0) {
        this._sharedService.handleSuccess(
          this.translate.instant('entityUpdateSuccessTitle_TC', { entity: '' })
        );
      }
      await this.getDropdownOptionByAPI();
      let form = this.form.value;
      if (!response$?.form) {  // form should not send via saved dialogue data if option value depends on saved response.
        form[response$?.attribute] = savedRes[this.field.optionValue];
      } else {
        form = response$?.form;
      }
      this.form.patchValue(form);
      // this.op.hide();
    }
    else {
      let response$ = <Observable<any>>this.field?.saveDialogueData(event, this.form.value);
      response$.subscribe((res) => {
        this.field?.options?.update((option) => {
          option.push(res[this.field.name])
          return option
        })
        this.form.patchValue(res);
      })
    }

  }

  handleDialogue(event: any) {
    this.field.closeDialogueEvent(event, this.form.value);
    return event;
  }

  async onFilterChangeHandler(event) { // get the searched keyword from the event object
    // console.log("event filter value", event.filter)
    if (typeof (this.field.onFilterChange) === 'function') {
      // this.loading = true;
      let list = await this.field?.onFilterChange(event.filter, this.form.value);
      this.field.options = list;
      // this.loading = false;
    }
  }

  async onClickMultiselect(event) {
    // console.log("multiselect instance",event)
    if (this.field?.lazyDropdown) {
      await this.getDropdownOptionByAPI();
    }
  }

  formSubFields = []

  onClickDp() {
    if (this.field?.dynamicDialogConfig) {
      this.handleDynamicDialogForm();
    }
    else if (this.field?.hrefButtonConfig) {
      window.open(this.field?.hrefButtonConfig?.url, '_blank');
    }
    // else{
    //   op.toggle(event)
    // }
  }

  async saveDropdownOptionByAPI(data) {
    return new Promise((resolve) => {
      this.apiService
        .post(this.field?.urlConfig?.post?.url, data, this.field?.urlConfig?.post?.params).subscribe((res) => {
          resolve(res)
        })

    })
  }

  async getDropdownOptionByAPI() {
    return new Promise((resolve) => {
      this.loading = true;
      let apiUrl = this.field?.urlConfig?.get?.url;

      if (this.field?.needRequiredFields) {
        const requiredFields = this.buildRequiredFields();
        if (requiredFields)
          apiUrl = `${apiUrl}?required_fields=${requiredFields}`
      }

      this.apiService
        .get(apiUrl, this.field?.urlConfig?.get?.params).subscribe(async (response: any) => {
          this.loading = false;
          await this.bindOptions(response);
          resolve(response);
        })
    })
  }

  buildRequiredFields() {
    if (this.field?.requiredFields) {
      return this.field?.requiredFields;
    }
    else {
      return `${this.field.optionLabel},${this.field.optionValue}`
    }
  }

  async bindOptions(responseData) {
    if (typeof (this.field.bindOptionList) === 'function') {
      const options = await this.field.bindOptionList(responseData);
      this.field.options.set(options)
    }
  }

  async handleDynamicDialogForm() {
    const response = await this._dialogHandlerService.openDialog(this.field?.dynamicDialogConfig?.config, this.field?.dynamicDialogConfig?.formConfig, this.field?.urlConfig)
    if (response) {
      this.saveDialogueData(response);
    }

  }

  async onPanelHide() {
    // console.log('onPanelHide');
    if (typeof (this.field.onPanelHide) === 'function') {
      const formObject: FormObject = await this.field.onPanelHide(this.form.get(this.field?.name).value, this.form.value, this.formFields);
      if ('options' in formObject) {
        this.field?.options.set(formObject?.options);
      }
      if ('formValue' in formObject) {
        console.log('formObject', formObject?.formValue)
        this.form.patchValue(formObject?.formValue);
      }
    }
  }

}
