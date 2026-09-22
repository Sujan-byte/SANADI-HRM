import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';

@Component({
  selector: 'password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.scss']
})
export class PasswordComponent implements OnInit {

  @Input() field:any = {};
  @Input() form:FormGroup | any;
  @Input() formFields: any;
  toggleMask: boolean = true;
  showEyeIcon: boolean = true;
  display: boolean = false;
  loading: boolean;
  @Input() formRefreshObject: any;
  get isValid() { 
    return this.form?.controls[this.field.name]?.valid;
  }

  get inValid() { 
    return this.form?.controls[this.field.name]?.invalid;
  }

  get isDirty() { 
    return this.form?.controls[this.field.name]?.dirty;
  }

  get isTouched() { 
    return this.form?.controls[this.field.name]?.touched;
  }
  async onClickCreateButton(){
    if (typeof (this.field.onClickCreateButton) === 'function') {
      this.loading = true;
      const list = await this.field?.onClickCreateButton(false, this.form.value);
      this.field.options = list;
      this.loading = false;
    } else {
      this.display = true;
    }
  }
  get isError() { 
    return Object.keys(this.form?.controls[this.field?.name]?.errors)?.length;
  }

  showDialog(event: any) {
    if (typeof (this.field.onDialogueButtonClick) === 'function') {
      this.field?.onDialogueButtonClick(event, this.form.value, this.field?.name);
    }
    this.display = true;
    if (typeof (this.field.getFieldsName) === 'function') {
      this.field?.getFieldsName(this.field?.name);
    }
    // console.log('check', this.field?.name)
  }

  get errorText() {
    let errorText = '';
    if (Object.keys(this.form?.controls[this.field?.name]?.errors)?.length > 0) {
      Object.keys(this.form?.controls[this.field.name]?.errors).forEach((validation) => {
        if(this.field?.errorText?.hasOwnProperty(validation)) {
          errorText += this.field?.errorText[validation];
        }
      })
      if (errorText?.length > 0) {
        errorText += ', ';
      }
      // errorText += 'Must contain at least one number and one uppercase and lowercase letter and one special character, and at least 8 characters';
      
    }
    return errorText ? errorText : this.field?.errorText ? this.field?.errorText['pattern'] : 'Must contain at least one number and one uppercase and lowercase letter and one special character, and at least 8 characters';
    // return errorText;
  }

  constructor() { }

  ngOnInit(): void {
    console.log('ng on it password');
    this.onValueChanges();
  }

  onValueChanges() {
    if (typeof(this.field.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(([prev, next]: [any, any]) => {
          const value = this.field?.onValueChange(prev, next, this.form.value);
          if(value) {
            this.form.patchValue(value)
          }
        });
    }
  }

  toggleIcon() {
    if (!this.field.disableIcon)
      this.showEyeIcon = !this.showEyeIcon
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

}
