import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormField } from '../form-builder';
import { UrlConfig } from '../../../model/app.model';

export class CheckboxBuilder extends FormField {
  override type?: string = 'checkbox';
  options: Array<{ key: string; label: string }> = [];
  onValueChange: Function;
  onClickValue: Function;
  onValueChangeOnly: Function;
  dynamicDialogConfig: DynamicDialogConfig;
  savedDataOfDialogue: Function;
  urlConfig: UrlConfig;
  saveDialogueData: Function;
  bindOptionList: Function;
  addButton: boolean;

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
    label?: any,
    options?: Array<{ key: string; label: string }>,
    validation?: { required?: boolean },
    errorText?: { required?: string },
  ) {
    super(translate);

    this.name = name;
    this.label = label ?? `${name}_TC`;
    this.isEditMode = isEditMode;
    this.data = data;
    this.defaultData = defaultData;
    this.options = options ?? [];
    this.value = this.getValue();
    this.validation = validation;
    this.errorText = errorText;
  }

  private getValue(): any {
    const values = this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
    // const group: { [key: string]: boolean } = {};
    // this.options.forEach(opt => {
    //   group[opt.key] = !!(values?.[opt.key]);
    // });
    return values ?? [];
  }

  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  onClick(onClickValue: Function) {
    this.onClickValue = onClickValue.bind(this);
    return this;
  }

  onChangeOnly(onValueChangeOnly: Function) {
    this.onValueChangeOnly = onValueChangeOnly.bind(this);
    return this;
  }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }
  isaddButton(addButton:boolean){
    this.addButton = addButton;
    return this;
  }
  getOptions(options) {
    this.options = options;
    return this;
  }
  addDynamicDialogConfig(dynamicDialogConfig: { config: any, formConfig: any, isEditMode?: boolean, data?: any, disabled?: boolean }) {
    this.dynamicDialogConfig = dynamicDialogConfig;
    return this
  }
  saveData(saveDialogueData: Function) {
    this.saveDialogueData = saveDialogueData.bind(this);
    return this;
  }
  getUrlConfig(urlConfig: UrlConfig) {
    this.urlConfig = urlConfig;
    return this;
  }
  bindOption(bindOptionList: Function) {
    this.bindOptionList = bindOptionList.bind(this);
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
      options: this.options,
      value: this.value,
      validation: this.validation,
      errorText: this.errorText,
      fieldWidth: this.fieldWidth,
      onValueChange: this.onValueChange,
      onClickValue: this.onClickValue,
      readonly: this.readonly,
      hidden: this.hidden,
      onValueChangeOnly: this.onValueChangeOnly,
      addButton:this.addButton,
      dynamicDialogConfig: this.dynamicDialogConfig,
      savedDataOfDialogue: this.savedDataOfDialogue,
    };
  }
}
