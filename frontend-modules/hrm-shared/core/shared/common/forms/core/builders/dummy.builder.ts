import { ButtonConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class DummyField extends FormField {
  override type?: string = 'dummy';

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData?: any,
    label?: any,
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
    const value = this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
    // console.log('getValue', value, 'name', this.name);
    return value;
  }

  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      value: this.value,
      fieldWidth: this.fieldWidth,
      hidden: this.hidden,
      hideFunction: this.hideFunction,
    };
  }
}
