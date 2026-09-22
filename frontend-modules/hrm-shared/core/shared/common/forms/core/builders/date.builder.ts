import { FormField } from '../form-builder';

export class DateField extends FormField {
  override type?: string = 'date';
  onValueChange: Function;
  format: string;
  timeOnly: boolean = false;
  momentformat: string;
  view: string = 'date';
  minDateValue: any;
  selectionMode: any;
  maxDateValue: any;
  disabled: boolean = false;
  showTime: boolean = false;
  showClearIcon: boolean = true;
  onSelectDate: Function;
  private isHiddenFunction: boolean;
  private hideFields: (formValue) => boolean;
  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
    timeOnly?: boolean,
    label?: any,
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
    this.timeOnly = timeOnly;

    // this.validation = validation
    // this.errorText = errorText
  }

  private getValue(): any {
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }
  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }
  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  addFormat(format: string) {
    this.format = format;
    return this;
  }

  addMomentDateFormat(format: string) {
    this.momentformat = format;
    return this;
  }

  setView(view: string) {
    this.view = view;
    return this;
  }

  setMinDateValue(minDateValue: any) {
    this.minDateValue = minDateValue;
    return this;
  }

  setMaxDateValue(maxDateValue: any) {
    this.maxDateValue = maxDateValue;
    return this;
  }

  isDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }

  setShowTime(showTime: boolean) {
    this.showTime = showTime;
    return this;
  }

  setShowClearIcon(showClearIcon: boolean) {
    this.showClearIcon = showClearIcon;
    return this;
  }

  onSelect(onSelectDate: Function) {
    this.onSelectDate = onSelectDate.bind(this);
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

  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      yy: this.format,
      momentFormat: this.momentformat,
      placeholder: this.translate.instant('formPlaceholder_SC', {
        label: this.translate.instant(this.label),
      }),
      value: this.value,
      fieldWidth: this.fieldWidth,
      validation: this.validation,
      errorText: this.errorText,
      onValueChange: this.onValueChange,
      variant: this.variant,
      timeOnly: this.timeOnly,
      view: this.view,
      minDateValue: this.minDateValue,
      maxDateValue: this.maxDateValue,
      readonly: this.readonly,
      disabled: this.disabled,
      selectionMode: this.selectionMode,
      hidden: this.hidden,
      showTime: this.showTime,
      showClearIcon: this.showClearIcon,
      onSelectDate: this.onSelectDate,

      //Hidde Fields
      isHiddenFunction: this.isHiddenFunction,
      hideFunction: this.hideFunction,
      hideFields: this.hideFields,

      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }

}
