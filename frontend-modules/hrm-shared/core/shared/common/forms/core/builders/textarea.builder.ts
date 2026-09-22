import { ButtonConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class TextBuilder extends FormField {
  override type?: string = 'text';

  // ACTION BUTTON
  private actionButton: Array<ButtonConfig> = [{
    show: false,
    icon: 'pi pi-box',
    toolTip: '',
    tooltipPosition: 'top',
    class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
  }];

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
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

    // this.validation = validation
    // this.errorText = errorText
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

  // char limit
  private maxlength?: number;

  setMaxLength(maxlength: number): this {
    this.maxlength = maxlength;
    return this;
  }

  // rows
  private rows?: number;

  setRows(rows: number): this {
    this.rows = rows;
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
      hidden: this.hidden,
      multiline: true,
      // ACTION BUTTON
      actionButton: this.actionButton,
      maxlength: this.maxlength,
      rows: this.rows,
      validationFunction: this.validationFunction,
      hideFunction: this.hideFunction,
      labelFunction: this.labelFunction,
      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }
}
