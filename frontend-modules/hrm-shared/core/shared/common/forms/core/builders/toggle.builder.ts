import { FormField } from '../form-builder';

export class ToggleBuilder extends FormField {
  override type?: string = 'boolean';
  onValueChange: Function;
  onClickValue: Function;
  onValueChangeOnly: Function;

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
    label?: any,
    validation?: { required?: boolean },
    errorText?: { required?: string }
  ) {
    super(translate);
    this.name = name;
    this.label = label ?? `${name}_TC`;
    this.isEditMode = isEditMode;
    this.data = data;
    this.defaultData = defaultData;
    this.value = this.getValue();
  }

  private getValue(): any {
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }
  onChangeOnly(onValueChangeOnly: Function) {
    this.onValueChangeOnly = onValueChangeOnly.bind(this);
    return this;
  }
  onClick(onClickValue: Function) {
    // console.log("Toggle Builder on change triggers");
    this.onClickValue = onClickValue.bind(this);
    return this;
  }

  onChange(onValueChange: Function) {
    // console.log("Toggle Builder on change triggers");
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  triggerChange(value: boolean, formFields: any) {
    if (this.onValueChange) {
      this.onValueChange(value, formFields);
    }
  }

  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      placeholder: this.translate.instant('formPlaceholder_SC', {
        label: this.translate.instant(this.label),
      }),
      value: this.value,
      validation: this.validation,
      errorText: this.errorText,
      fieldWidth: this.fieldWidth,
      onValueChange: this.onValueChange,
      readonly: this.readonly,
      hidden: this.hidden,
      onClickValue: this.onClickValue,
      onValueChangeOnly: this.onValueChangeOnly,

      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }
}
