import { FormField } from '../form-builder';

export class TabBuilder extends FormField {
  override type?: string = 'tab';
  override fields?: FormField[] = new Array<FormField>();

  constructor(translate, tabHeader?:any) {
    super(translate);
    // this.tabHeader = tabHeader;
  }

  addTabFields(fields: FormField[]) {
    this.fields = fields;
    return this;
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
    };
  }
}
