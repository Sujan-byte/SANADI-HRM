import { DynamicDialogConfig, UrlConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class MultiSelectField extends FormField {
  subForm: FormField[] = new Array<FormField>();
  options: any[] = new Array<any>();
  optionLabel: string = 'name';
  optionLabelList: string[];
  dropdownRequiredFields: string;
  optionValue: string = 'id';
  onValueChange: Function;
  bindOptionList: Function;
  saveDialogueData: Function;
  lazyDropdown: boolean = false;
  lazyFilterDropdown: boolean = false;
  needRequiredFields: boolean = false;
  urlConfig: UrlConfig;
  defaultObject: object;
  dynamicDialogConfig: DynamicDialogConfig;
  override type?: string = 'multiselect';
  hrefButtonConfig: { url: string; hrefButtonIcon: string; };
  maxWidth: string;
  onPanelHide: Function;
  onRemove: Function;

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
    lazyDropdown?: boolean,
    placeholder?: any,
    maxWidth?: string,
    validation?: { required?: boolean; minlength?: number },
    errorText?: { required?: string; minlength?: string }
  ) {
    super(translate);

    this.translate = translate;
    this.name = name;
    this.label = `${name}_TC`;
    this.isEditMode = isEditMode;
    this.data = data;
    this.defaultData = defaultData;
    this.value = this.getValue();
    this.lazyDropdown = lazyDropdown;
    this.placeholder = placeholder || 'formSelectPlaceholder_SC';
    this.maxWidth = maxWidth;
  }

  addSubfields?(field: FormField) {
    this.subForm.push(field);
    return this;
  }

  addDynamicDialogConfig(dynamicDialogConfig: { config: any, formConfig: any }) {
    this.dynamicDialogConfig = dynamicDialogConfig;
    return this
  }
  setDefaultObject(object) {
    this.defaultObject = object;
    return this
  }

  addHrefButtonConfig(hrefButtonConfig: { url: string, hrefButtonIcon: string }) {
    this.hrefButtonConfig = hrefButtonConfig;
    return this
  }


  // addFieldWidth(fieldWidth:string){
  //   this.fieldWidth = fieldWidth;
  //   return this;
  // }

  getOptions(options) {
    this.options = options;
    return this;
  }

  private getValue?(): any {
    return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
  }

  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  saveData(saveDialogueData: Function) {
    this.saveDialogueData = saveDialogueData.bind(this);
    return this;
  }

  addKeyValueLabel(key, value) {
    this.optionLabel = key;
    this.optionValue = value;
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

  isReadOnlyField(isReadOnly) {
    this.readonly = isReadOnly
    return this;
  }

  isLazyFilterDropDown(val: boolean) {
    this.lazyFilterDropdown = val;
    return this
  }

  isNeedRequiredFields(val: boolean) {
    this.needRequiredFields = val;
    return this
  }

  setRequiredFields(requiredFields: string) {
    this.dropdownRequiredFields = requiredFields;
    return this
  }

  // ON OVERLAY PANEL HIDE
  onOverlayPanelHide(onPanelHide: Function) {
    this.onPanelHide = onPanelHide.bind(this);
    return this;
  }

  // ON REMOVE
  onRemoveOptions(onRemove: Function) {
    this.onRemove = onRemove.bind(this);
    return this;
  }

  toObject(): any {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      placeholder: this.translate.instant(this.placeholder ?? 'formPlaceholder_SC', {
        label: this.translate.instant(this.label),
      }),
      value: this.value,
      subForm: this.subForm,
      options: this.options,
      optionLabel: this.optionLabel,
      optionValue: this.optionValue,
      validation: this.validation,
      errorText: this.errorText,
      onValueChange: this.onValueChange,
      saveDialogueData: this.saveDialogueData,
      fieldWidth: this.fieldWidth,
      lazyDropdown: this.lazyDropdown,  // to create new dropdown option by api.
      urlConfig: this.urlConfig,        // url config to add new option or get options.
      bindOptionList: this.bindOptionList, // to return list from API
      autoDisplayFirst: true,
      hidden: this.hidden,
      readonly: this.readonly,
      variant: this.variant,
      lazyFilterDropdown: this.lazyFilterDropdown,
      needRequiredFields: this.needRequiredFields,
      dynamicDialogConfig: this.dynamicDialogConfig,
      hrefButtonConfig: this.hrefButtonConfig,
      maxWidth: this.maxWidth,
      defaultObject: this.defaultObject,
      dropdownRequiredFields: this.dropdownRequiredFields,
      onPanelHide: this.onPanelHide,
      onRemove: this.onRemove,

      labelFunction: this.labelFunction,
      validationFunction: this.validationFunction,

      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,
    };
  }
}
