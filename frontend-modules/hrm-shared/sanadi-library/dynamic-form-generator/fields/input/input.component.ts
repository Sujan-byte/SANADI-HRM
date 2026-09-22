import { Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';
import { ParamtersConfig, ReturnConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';

@Component({
  selector: 'sanadi-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  @Input() rows: any;
  @Input() dataSource: any = [];
  @Input() formFields: any[] = [];
  display: boolean = false;

  private translate = inject(TranslateService);

  get isValid() {
    return this.form?.controls[this.field.name].valid;
  }
  get inValid() {
    return this.form?.controls[this.field.name].invalid;
  }
  get isDirty() {
    return this.form?.controls[this.field.name].dirty;
  }
  get isTouched() {
    return this.form?.controls[this.field.name].touched;
  }
  get isError() {
    return Object.keys(this.form?.controls[this.field?.name]?.errors)?.length;
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
    let errorTexts = '';
    if (Object.keys(this.form?.controls[this.field?.name]?.errors)?.length > 0) {
      Object.keys(this.form?.controls[this.field.name].errors).forEach((validation) => {
        if (validation === 'required' && this.field?.labelFunction) {
          errorTexts += this.translate.instant('formRequiredError_SC', { label: this.dynamicLabel });
        } else if (this.field?.errorText?.hasOwnProperty(validation)) {
          if (!errorTexts) {
            errorTexts += this.field?.errorText[validation]
          } else {
            errorTexts += ' , ' + this.field?.errorText[validation]
          }
        }
      })
    }
    return errorTexts ? errorTexts : this.field?.errorText ? this.field?.errorText : 'This field is invalid';
  }

  constructor() { }

  ngOnInit(): void {
    this.onValueChanges();

    // addEventListener('opendialog', ()=>{
    // })
  }

  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          const value = this.field?.onValueChange(prev, next, this.form.value);
          if (value) {
            this.form.patchValue(value)
          }
        });
    }
  }

  showDialog() {
    this.display = true;
    this.field?.getFieldsName(this.field?.name)
    // console.log('check', this.field?.name)
  }

  saveDialogueData(event: any) {
    this.field?.saveDialogueData(event);
    this.display = true;
  }

  onSuffixActionGroupByClick() {
    const value = this.field?.onSuffixActionGroupByClick(this.form.value);
    if (value) {
      this.form.patchValue(value)
    }
  }

  // @View
  onClickDp(op, type) {
    op.toggle(event)
  }

  // ON CLICK ACTION BUTTON
  async onClickActionButton(event: any, field: any, action: any) {
    // console.log('onClickActionButton', field, action);
    if (typeof (action?.onClick) === 'function') {
      const result = await action?.onClick(this.form.value, field, this.formFields);
      if (result) {
        this.updateFormValue(result);
      }
    }
  }

  disableActionButton(val: Function) {
    // console.log('disableActionButton', val);
    return val(this.form.value);
  }

  updateFormValue(formValue: any) {
    this.form.patchValue(formValue);
  }

  async onClickInput(event: any) {
    if (typeof (this.field?.onClick) === 'function') {
      const result = await this.field?.onClick(this.form.value, this.field, this.formFields,this.form);
      if (result) {
        this.updateFormValue(result);
      }
    }
  }

  // this.form.value, this.field, this.formFields
  // ON INPUT
  async onInput(event: any) {
    // console.log('onInput', event);
    if (typeof (this.field?.onInput) === 'function') {
      const result: ReturnConfig  = await this.field?.onInput({
        current: event?.data,
        next: event?.target?.value,
        formValue: this.form.value,
        field: this.field,
        formFields: this.formFields,
        form: this.form,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
    }
  }

}
