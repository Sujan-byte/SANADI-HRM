import { ButtonConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class ButtonField extends FormField {
  override type?: string = 'button';

  // ACTION BUTTON
  private actionButton: Array<ButtonConfig> = [{
    show: false,
    icon: 'pi pi-box',
    toolTip: '',
    tooltipPosition: 'top',
    class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
  }];
  class: string;

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
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }

  // ACTION BUTTON
  actionButtonConfig(actionButton: Array<ButtonConfig>) {
    this.actionButton = actionButton;
    return this;
  }

  setClass(classes: string) {
    this.class = classes;
    return this;
  }
 
  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      value: this.value,
      fieldWidth: this.fieldWidth,
      class: this.class,

      hidden: this.hidden,
      hideFunction: this.hideFunction,
      hideLabel: this.hideLabel,
      // ACTION BUTTON
      actionButton: this.actionButton,
    };
  }
}
