import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
export class FormFieldModel {
  type: string;
  name: string;
  label: string;
  placeholder: string;
  value: any;
  validation: any;
  errorText: any;

  constructor(
    type: string,
    name: string,
    label: string,
    placeholder: string,
    value: any,
    validation?: any,
    errorText?: any
  ) {
    this.type = type;
    this.name = name;
    this.label = label;
    this.placeholder = placeholder;
    this.value = value;
    this.validation = validation;
    this.errorText = errorText;
  }
}
