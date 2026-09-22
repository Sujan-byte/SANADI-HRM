import { numberLocale } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
import { FormField } from '../form-builder';

export class NumberField extends FormField {
  override type?: string = 'number';
  minFractionDigits: any;
  maxFractionDigits: any;
  onValueChange: Function;
  onValueChangeOnly: Function;
  min: number;
  max: number;
  locale: string = numberLocale();
  useGrouping: boolean = false;

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
  }

  private getValue(): any {
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }

  setMinFractionDigits(minVal: number) {
    this.minFractionDigits = minVal;
    return this
  }

  setMaxFractionDigits(maxVal: number) {
    this.maxFractionDigits = maxVal;
    return this
  }

  setMinValue(minVal: number) {
    this.min = minVal;
    return this
  }

  setMaxValue(maxVal: number) {
    this.max = maxVal;
    return this
  }

  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  onChangeOnly(onValueChangeOnly: Function) {
    this.onValueChangeOnly = onValueChangeOnly.bind(this);
    return this;
  }

  setLocale(locale: string) {
    this.locale = locale;
    return this;
  }

  setUseGrouping(useGrouping: boolean) {
    this.useGrouping = useGrouping;
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
      hidden: this.hidden,
      readonly: this.readonly,
      variant: this.variant,
      minFractionDigits: this.minFractionDigits,
      maxFractionDigits: this.maxFractionDigits,
      min: this.min,
      max: this.max,
      locale: this.locale,
      useGrouping: this.useGrouping,
      onValueChange: this.onValueChange,
      onValueChangeOnly: this.onValueChangeOnly,
      hideFunction: this.hideFunction,
      validationFunction: this.validationFunction,
      labelFunction: this.labelFunction,
      readonlyFunction: this.readonlyFunction,

      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }
}
