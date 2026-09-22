import { FormField } from "../form-builder";

export class EditorJSBuilder extends FormField {
  override type?: string = 'editor-js';
  onValueChange: Function;
  onRefresh: Function;
  buttonVisible: boolean = false;

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

  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }

  refresh(onRefresh: Function) {
    this.onRefresh = onRefresh.bind(this);
    return this;
  }

  isButtonVisible(buttonVisible: boolean) {
    this.buttonVisible = buttonVisible;
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
      onValueChange: this.onValueChange,
      editor: undefined,
      onRefresh: this.onRefresh,
      buttonVisible: this.buttonVisible,
    };
  }

}