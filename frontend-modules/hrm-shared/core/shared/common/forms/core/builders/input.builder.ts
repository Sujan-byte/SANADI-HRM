import { WritableSignal } from '@angular/core';
import { ButtonConfig, ParamtersConfig, ReturnConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class InputField extends FormField {
  getOptions(productTypeSignal: WritableSignal<{ key: string; value: string; }[]>) {
    throw new Error('Method not implemented.');
  }
  override type?: string = 'input';

  // ACTION BUTTON
  private actionButton: Array<ButtonConfig> = [{
    show: false,
    icon: 'pi pi-box',
    toolTip: '',
    tooltipPosition: 'top',
    class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
  }];

  private clickFunction: Function;
  private inputFunction: Function;

  private isHiddenFunction: boolean;
  private hideFields: (formValue) => boolean;
  private inputTypeValue: string = 'text';

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData?: any,
    label?: any,
    placeholder?: any,
    validation?: { required?: boolean; minlength?: number },
    errorText?: { required?: string; minlength?: string }
  ) {
    super(translate);

    this.name = name;
    this.label = label ?? `${name}_TC`;
    this.isEditMode = isEditMode;
    this.data = data;
    this.defaultData = defaultData;
    this.value = this.getValue();
    this.placeholder = placeholder;
    this.validation = validation
    this.errorText = errorText
  }

  private getValue(): any {
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }

  // addFieldWidth(fieldWidth:string){
  //   this.fieldWidth = fieldWidth;
  //   return this;
  // }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }

  // ACTION BUTTON
  actionButtonConfig(actionButton: Array<ButtonConfig>) {
    this.actionButton = actionButton;
    return this;
  }

  onClick(clickFunction: Function) {
    this.clickFunction = clickFunction;
    return this;
  }

  onInput(inputFunction: Function) {
    this.inputFunction = inputFunction;
    return this;
  }

  setIsHiddenFunction(isHidden: boolean): this {
    this.isHiddenFunction = isHidden;
    return this;
  }

  setHideFields(hideFields: (formValue) => boolean): this {
    this.hideFields = hideFields;
    return this;
  }

  inputType(type: string) {
    this.inputTypeValue = type;
    return this;
  }

  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      placeholder: this.translate.instant(this.placeholder ?? 'formPlaceholder_SC', {
        label: this.translate.instant(this.label),
      }),
      value: this.value,
      validation: this.validation,
      errorText: this.errorText,
      fieldWidth: this.fieldWidth,
      readonly: this.readonly,
      variant: this.variant,
      hidden: this.hidden,
      // ACTION BUTTON
      actionButton: this.actionButton,
      onClick: this.clickFunction,
      onInput: this.inputFunction,
      inputType: this.inputTypeValue,

      //Hidde Fields
      isHiddenFunction: this.isHiddenFunction,
      hideFunction: this.hideFunction,
      hideFields: this.hideFields,
      validationFunction: this.validationFunction,

      labelFunction: this.labelFunction,
      readonlyFunction: this.readonlyFunction,

      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }

}
