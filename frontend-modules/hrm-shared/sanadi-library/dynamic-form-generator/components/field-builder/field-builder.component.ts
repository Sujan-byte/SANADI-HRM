import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'dynamic-field-builder',
  templateUrl: './field-builder.component.html',
  styleUrls: ['./field-builder.component.scss'],
})
export class FieldBuilderComponent implements OnInit {
  @Input() field: any;
  @Input() form: any;
  @Input() formFields: any;
  get isValid() {
    return this.form.controls[this.field.name].valid;
  }
  get isDirty() {
    return this.form.controls[this.field.name].dirty;
  }

  ngOnInit(): void {
    // console.log("form", this.form);
    // console.log("field", this.field);
  }

  hideFields(val: Function) {
    // console.log('hidefiels', formValue, val(formValue))
    return val(this.form.value);
  }
}
