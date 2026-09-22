import { Component, Input, OnInit, inject } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'number',
  templateUrl: './number.component.html',
  styleUrls: ['./number.component.scss']
})
export class NumberComponent implements OnInit {
  @Input() field: any = {};
  @Input() form: UntypedFormGroup | any;
  @Input() formFields: any;

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
    let errorText = '';
    if (Object.keys(this.form?.controls[this.field?.name]?.errors)?.length > 0) {
      Object.keys(this.form?.controls[this.field.name].errors).forEach((validation) => {
        if (validation === 'required' && this.field?.labelFunction) {
          errorText += this.translate.instant('formRequiredError_SC', { label: this.dynamicLabel }) + ', ';
        } else if (this.field?.errorText?.hasOwnProperty(validation)) {
          errorText += this.field?.errorText[validation] + ', ';
        }
      })
    }
    return errorText ? errorText : this.field?.errorText ? this.field?.errorText : 'This field is invalid';
  }

  constructor() { }

  ngOnInit(): void {
    this.onValueChanges();
    // console.log('number', this.field);
  }

  onValueChanges() {
    if (typeof (this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          const value = this.field?.onValueChange(prev, next, this.form.value, this.formFields, this.field);
          if (value) {
            this.form.patchValue(value)
          }
        });
    }
  }

  async onChangeHandler($event: any) {
    // console.log("on change dropdowj event", $event?.value);
    if ($event?.value) {
      this.field.value = $event?.value;
      if (typeof (this.field?.onValueChangeOnly) === 'function') {
        const value = await this.field?.onValueChangeOnly($event?.value, this.form.value, this.formFields, this.field);
        // console.log('value', value);
        if (value) {
          this.form.patchValue(value);
        }
      }
    }
    else {
      if (typeof (this.field?.onValueChangeOnly) === 'function') {
        const value = await this.field?.onValueChangeOnly($event?.value, this.form.value, this.formFields, this.field);
        // console.log('value null', value);
        if (value) {
          this.form.patchValue(value);
        }
      }
    }
  }
  disableActionButton(val: Function) {
    return val(this.form.value);
  }
}
