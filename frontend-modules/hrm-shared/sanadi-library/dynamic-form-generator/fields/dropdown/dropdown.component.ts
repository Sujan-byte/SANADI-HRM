import { AfterViewInit, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { Form, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Dropdown } from 'primeng/dropdown';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Observable, debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs';
import { ApiService } from 'src/app/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { mapValidators } from 'src/app/modules/hrm-shared/core/utils/app.utils';
import { FormFieldUtil } from 'src/app/modules/hrm-shared/core/utils/form-field-utils';

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit, AfterViewInit {
  @ViewChild('op') op: OverlayPanel;
  @ViewChild('dp') dp: Dropdown;
  @Input() field: any = {};
  @Input() form: UntypedFormGroup;
  apiService = inject(ApiService);
  display: boolean = false;
  selectedValue: any;
  loading: boolean;
  tempOptions: any = [];
  @Input() formFields: any;
  private translate = inject(TranslateService);
  private _sharedService = inject(SharedService);


  constructor(private _dialogHandlerService: DialogHandlerService) { }

  get isValid() {
    return this.form?.controls[this.field?.name].valid;
  }
  get inValid() {
    return this.form?.controls[this.field?.name].invalid;
  }
  get isDirty() {
    return this.form?.controls[this.field?.name].dirty;
  }
  get isTouched() {
    return this.form?.controls[this.field?.name].touched;
  }
  get isError() {
    // console.log("error",this.field?.errorText)
    return Object.keys(this.form?.controls[this.field?.name]?.errors)?.length;
  }

  get isReadonly(): boolean {
    if (typeof this.field?.readonlyFunction === 'function') {
      return this.field.readonlyFunction(this.form.value);
    }
    return this.field?.readonly ?? false;
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

  ngOnInit(): void {
    // console.log("dropdown field", this.form?.controls[this.field?.name], this.field)
    this.selectedValue = this.field?.value;
    this.onValueChanges();

    // apply default object if dropdown is from server side
    // if (this.field?.lazyDropdown && this.field?.defaultObject) {
    //   if (Object.keys(this.field?.defaultObject)?.length)
    //     this.applyDefaultObject(this.field?.defaultObject)
    // }
  }

  ngAfterViewInit(): void {
    // console.log("after view in ",this.dp,this.field?.defaultObject)
    if (this.field?.lazyDropdown && this.field?.defaultObject) {
      if (Object.keys(this.field?.defaultObject)?.length)
        this.dp.selectedOption = this.field.defaultObject;
    }
  }

getOptionValue(item: any, optionLabelList: any) {
  // Add null/undefined check for item
  if (!item) {
    return '';
  }
  
  let optionValue = '';
  if (optionLabelList?.length) {
    optionLabelList.forEach((e: any) => {
      // Add safe property access, formatting date keys as DD-MM-YYYY
      optionValue += (this.formatLabelValue(e, item[e]) || '') + ' | ';
    });
    optionValue = optionValue.slice(0, -2);
  } else {
    // Add safe property access with fallback
    optionValue = item[this.field?.optionLabel] || '';
  }
  return optionValue;
}

// Display ISO (YYYY-MM-DD) values of date keys as DD-MM-YYYY in dropdown labels
private formatLabelValue(key: any, value: any): any {
  if (typeof key === 'string' && key.toLowerCase().includes('date') && typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  return value;
}

getDropDownText(itemId: string) {
  // Add null/undefined check for itemId
  if (!itemId) {
    return '--';
  }
  
  let value = itemId;
  
  // Add null check for dp and selectedOption
  if (this.dp?.selectedOption) {
    value = this.getOptionValue(this.dp.selectedOption, this.field.optionLabelList) || itemId;
  } else {
    const selectedOption = this.field?.options?.()?.find((option: any) =>
      this.isSameOptionValue(option?.[this.field?.optionValue], itemId)
    );
    if (selectedOption) {
      value = this.getOptionValue(selectedOption, this.field.optionLabelList) || itemId;
    }
  }
  
  return value;
}

  async onClearHandler($event: any){
    // console.log("event",$event);
      if (typeof (this.field?.onClearFunction) === 'function') {
        const value = await this.field?.onClearFunction($event, this.form.value, this.formFields, this.form);

        if (value) {
          this.form.patchValue(value);
        }
      
    }
  }

  async onChangeHandler($event: any) {
    // console.log("on change dropdowj event", $event)
    if ($event?.value) {
      this.field.value = $event?.value;
      this.resetAndApplyValidation()
      if (typeof (this.field?.onValueChangeOnly) === 'function') {
        const value = await this.field?.onValueChangeOnly($event?.value, $event?.value, this.form.value, this.formFields, this.form, this.field);

        if (value) {
          this.form.patchValue(value);
        }
      }
        }
  }

  onValueChanges() {
    if (typeof (this.field?.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(async ([prev, next]: [any, any]) => {
          // console.log("out patch value dropdown", this.formFields)
          const value = await this.field?.onValueChange(prev, next, this.form.value, this.formFields);

          if (value) {
            this.form.patchValue(value);
          }
        });
    }
  }

showDialog() {
    this.display = true;
    this.field?.getFieldsName(this.field?.name);
    // console.log('check', this.field?.name)
  }


  async saveDialogueData(event: any) {
    if (this.field?.lazyDropdown) {
      const response$: { form: Form, data: any, attribute: any } = await this.field?.saveDialogueData(event, this.form.value, this.formFields);
      const savedRes: any = await this.saveDropdownOptionByAPI(response$?.data);
      // console.log('savedRes', savedRes);
      if (Object.keys(savedRes).length !== 0) {
        this.field.value = savedRes[this.field?.optionValue];
        this._sharedService.handleSuccess(
          this.translate.instant('entityUpdateSuccessTitle_TC', { entity: '' })
        );
        await this.getDropdownOptionByAPI();
        let form = this.form.value;
        if (!response$?.form) {  // form should not send via saved dialogue data if option value depends on saved response.
          form[response$?.attribute] = savedRes[this.field.optionValue];
        } else {
          form = response$?.form;
        }
        this.form.patchValue(form);
      }
      if (typeof (this.field?.savedDataOfDialogue) === 'function') {
        // console.log('diel')
        const result = await this.field?.savedDataOfDialogue(event, savedRes, this.form.value, this.formFields);
        if (result) {
          this.form.patchValue(result);
        }
      }
      this.op.hide();
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
    if (this.field?.variant === "basic") {
      if (typeof (this.field.onFilterChange) === 'function') {
        this.loading = true;
        let list = await this.field?.onFilterChange(event.filter, this.form.value);
        this.field.options = list;
        this.loading = false;
      }
    }
    else {
      if (this.field.lazyDropdown && this.field?.lazyFilterDropdown) {
        // Lazy-filter dropdowns now search on demand (Enter / search button) via
        // runLazySearch(), so the native filter is disabled and this per-keystroke
        // path no longer fires for them. Guarded to avoid any stray API calls.
        return;
      }
    }
  }

  // Server-side search for lazy-filter dropdowns. Triggered explicitly from the
  // dropdown header (Enter key or search button) instead of on every keystroke,
  // so typing no longer floods the API/DB with one request per letter.
  async runLazySearch(term: string) {
    if (!(this.field?.lazyDropdown && this.field?.lazyFilterDropdown)) return;

    const value = (term ?? '').trim();
    // Empty search resets the dropdown to its default first page.
    if (!value) {
      await this.getDropdownOptionByAPI();
      return;
    }

    // Global-master style dropdowns (e.g. customer category, payment terms,
    // delivery terms) load their entire option list in a single response
    // (GlobalMaster.global_value is a JSON array) and the backend exposes no
    // server-side search. For these there is no `searchKey`/`filterKeys`, so a
    // server call would just refetch the same full list and the search box
    // appeared to do nothing. Filter the already-loaded options client-side.
    if (!this.hasServerSearch()) {
      this.filterLoadedOptions(value);
      return;
    }

    this.loading = true;

    const sentParams = { ...this.field?.urlConfig?.get?.params }
    delete sentParams?.page_size;

    // build filter parameters
    let filterKeyValues = { is_active: true, ...sentParams }
    const searchKey = this.field?.urlConfig?.get?.searchKey;
    if (searchKey) {
      // Proper server-side search: the backend's DynamicSearchFilter reads
      // `search` (typed value) + `search_key` (comma-separated field paths)
      // and applies an OR icontains across them, so the DB filters and returns
      // only matches.
      filterKeyValues = { ...filterKeyValues, search: value, search_key: searchKey }
    }
    else if (this.field?.urlConfig?.get?.filterKeys?.length) {
      const filterKeys = this.field?.urlConfig?.get?.filterKeys;
      for (const key in filterKeys) {
        let currentKeyValue = { [filterKeys[key]]: value }
        filterKeyValues = { ...filterKeyValues, ...currentKeyValue }
      }
    }
    let apiUrl = this.field?.urlConfig?.get?.url

    // need required fields then build it.
    if (this.field?.needRequiredFields) {
      const requiredFields = this.buildRequiredFields();
      if (requiredFields)
        apiUrl = `${apiUrl}?required_fields=${requiredFields}`;
    }

    // call API
    this.apiService.get(apiUrl, filterKeyValues).subscribe(async (res) => {
      await this.bindOptions(res)
      this.loading = false;
    })
  }

  onLazySearchInput(term: string) {
    if (!(this.field?.lazyDropdown && this.field?.lazyFilterDropdown)) return;
    if (this.hasServerSearch()) return;

    const value = (term ?? '').trim();
    if (!value) {
      this.field.options.set([...(this.tempOptions ?? [])]);
      return;
    }

    this.filterLoadedOptions(value);
  }

  private hasServerSearch(): boolean {
    return !!this.field?.urlConfig?.get?.searchKey
      || !!this.field?.urlConfig?.get?.filterKeys?.length;
  }

  async onClickDropdown(event) {
    if (this.field?.lazyDropdown) {
      this.field.options.set([]);
      if (this.field?.defaultObject && this.field?.options()?.length == 0) {
        if (Object.keys(this.field?.defaultObject)?.length) {
          const existingObject = this.field?.options().find((obj) =>
            this.isSameOptionValue(obj[this.field?.optionValue], this.field.defaultObject[this.field.optionValue])
          );
          if (!existingObject) {
            this.field?.options().push(this.field.defaultObject);
          }
        }
      }
      await this.getDropdownOptionByAPI();
    }
    // if (typeof (this.field.onClickDropdown) === 'function') {
    //   this.loading = true;
    //   const list = await this.field?.onClickDropdown(event, this.form.value);
    //   this.field.options = list;
    //   this.loading = false;
    // }
  }

  onClickDp(op) {
    if (this.field?.dynamicDialogConfig) {
      this.handleDynamicDialogForm();
    }
    else if (this.field?.hrefButtonConfig) {
      window.open(this.field?.hrefButtonConfig?.url, '_blank');
    }
    else {
      op.toggle(event)
    }
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
      let apiUrl = this.field?.urlConfig?.get?.url

      // need required fields then build it.
      if (this.field?.needRequiredFields) {
        // build required fields
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

  async bindOptions(responseData) {
    if (typeof (this.field.bindOptionList) === 'function') {
      const options = await this.field.bindOptionList(responseData);
      this.field.options.set(options ?? [])
      if (this.field?.defaultObject && this.field?.options()?.length) {
        if (Object.keys(this.field?.defaultObject)?.length) {
          const existingObject = this.field?.options().find((obj) =>
            this.isSameOptionValue(obj[this.field?.optionValue], this.field.defaultObject[this.field.optionValue])
          );
          if (!existingObject) {
            this.field?.options().push(this.field.defaultObject);
          }
        }
      }
      // Keep the full, unfiltered list so client-side search (runLazySearch for
      // dropdowns without server-side search) can filter from it and restore it.
      this.tempOptions = this.field?.options() ? [...this.field.options()] : [];
    }
  }

  // Client-side icontains filter over the already-loaded options. Used by
  // runLazySearch for global-master dropdowns that have no server-side search.
  private filterLoadedOptions(value: string) {
    const term = value.toLowerCase();
    const labelKeys = this.field?.optionLabelList?.length
      ? this.field.optionLabelList
      : [this.field?.optionLabel];

    if (!this.tempOptions?.length && this.field?.options?.()?.length) {
      this.tempOptions = [...this.field.options()];
    }

    const filtered = (this.tempOptions ?? []).filter((item: any) =>
      labelKeys.some((key: string) =>
        String(item?.[key] ?? '').toLowerCase().includes(term)
      )
    );
    this.field.options.set(filtered);
  }

  async handleDynamicDialogForm() {
    const response = await this._dialogHandlerService.openDialog(this.field?.dynamicDialogConfig?.config, this.field?.dynamicDialogConfig?.formConfig, this.field?.dynamicDialogConfig?.isEditMode, this.field?.dynamicDialogConfig?.data)
    if (response) {
      this.saveDialogueData(response);
    }
  }

  buildRequiredFields() {
    if (this.field?.requiredFields) {
      return this.field?.requiredFields;
    }
    else {
      if (this.field?.optionLabelList) {
        return `${this.field.optionLabelList.join(',')},${this.field.optionValue}`;
      }
      else {
        return `${this.field.optionLabel},${this.field.optionValue}`;
      }
    }
  }

  applyDefaultObject(object) {
    // console.log("default object", object)
    const existingObject = this.field?.options().find((obj) =>
      this.isSameOptionValue(obj[this.field?.optionValue], object[this.field.optionValue])
    );
    if (!existingObject) {
      this.field?.options().push(object);
    }
  }

  private isSameOptionValue(left: any, right: any): boolean {
    if (left == null || right == null) {
      return left === right;
    }

    return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
  }

  clearFilter(dropdown: any) {
    dropdown.filterValue = ''; // Clear the filter input
  }

  async loadComponent(event: any) {
    if (typeof (this.field.buttonConfig.onClick) === 'function') {
      await this.field.buttonConfig.onClick(event, this.form.value);
    } 
  }

resetAndApplyValidation() {
  const control = this.form.get(this.field.name);
  if (!control) return;

  control.setErrors(null);
  control.clearValidators();
  control.clearAsyncValidators();

  const validation = { ...(this.field?.validation || {}) };
  delete validation.warning;

  this.field.validation = validation;
  const validators = mapValidators(validation);
  control.setValidators(validators);

  control.updateValueAndValidity({ emitEvent: false });
}
}
