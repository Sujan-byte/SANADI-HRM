import {
  ButtonConfig,
  DynamicDialogConfig,
  UrlConfig,
} from '../../../model/app.model';
import { FormField } from '../form-builder';

export class DropdownField extends FormField {
  subForm: FormField[] = new Array<FormField>();
  options: any[] = new Array<any>();
  optionLabel: string = 'name';
  optionLabelList: string[];
  optionValue: string = 'id';

  onValueChange: Function;
  onValueChangeOnly: Function;
  onSelectItem: Function;

  bindOptionList: Function;
  saveDialogueData: Function;
  lazyDropdown: boolean = false;
  lazyFilterDropdown: boolean = false;
  needRequiredFields: boolean = false;
  showButton: boolean = true;
  filter: boolean = true;
  urlConfig: UrlConfig;
  dynamicDialogConfig: DynamicDialogConfig;
  override type?: string = 'dropdown';
  hrefButtonConfig: { url: string; hrefButtonIcon: string };
  defaultObject: object;
  dropdownRequiredFields: string;
  maxWidth?: string;
  savedDataOfDialogue: Function;

  // CLEAR FUNCTIONALITY
  showClearIcon?: boolean = false;
  onClearFunction?: Function;

  private isHiddenFunction: boolean;
  private hideFields: (formValue) => boolean;
  private isDisableFunction: boolean;
  private disableFields: (formValue) => boolean;

  // ACTION BUTTON
  private actionButton: Array<ButtonConfig> = [
    {
      show: false,
      icon: 'pi pi-box',
      toolTip: 'Sub Product',
      tooltipPosition: 'top',
      class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
    },
  ];

  constructor(
    translate: any,
    name: string,
    isEditMode: boolean,
    data: any,
    defaultData: any,
    lazyDropdown?: boolean,
    placeholder?: any,
    label?: any,
    maxWidth?: string,

    validation?: { required?: boolean; minlength?: number },
    errorText?: { required?: string; minlength?: string },
  ) {
    super(translate);

    this.translate = translate;
    this.name = name;
    this.label = label ?? `${name}_TC`;
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

  addDynamicDialogConfig(dynamicDialogConfig: {
    config: any;
    formConfig: any;
    isEditMode?: boolean;
    data?: any;
  }) {
    this.dynamicDialogConfig = dynamicDialogConfig;
    return this;
  }

  addHrefButtonConfig(hrefButtonConfig: {
    url: string;
    hrefButtonIcon: string;
  }) {
    this.hrefButtonConfig = hrefButtonConfig;
    return this;
  }

  showAddButton(showButton: boolean) {
    this.showButton = showButton;
    return this;
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

  onChangeOnly(onValueChangeOnly: Function) {
    this.onValueChangeOnly = onValueChangeOnly.bind(this);
    return this;
  }

  onSelect(onSelectItem: Function) {
    this.onSelectItem = onSelectItem.bind(this);
    return this;
  }

  saveData(saveDialogueData: Function) {
    this.saveDialogueData = saveDialogueData.bind(this);
    return this;
  }

  savedDataDialogue(savedDataOfDialogue: Function) {
    this.savedDataOfDialogue = savedDataOfDialogue.bind(this);
    return this;
  }

  addKeyValueLabel(key, value) {
    this.optionLabel = key;
    this.optionValue = value;
    return this;
  }

  addKeyValueLabelList(key, value) {
    this.optionLabelList = key;
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
    this.readonly = isReadOnly;
    return this;
  }

  isLazyFilterDropDown(val: boolean) {
    this.lazyFilterDropdown = val;
    return this;
  }

  isNeedRequiredFields(val: boolean) {
    this.needRequiredFields = val;
    return this;
  }

  isReadOnly(readonly: boolean) {
    this.readonly = readonly;
    return this;
  }
  setRequiredFields(requiredFields: string) {
    this.dropdownRequiredFields = requiredFields;
    return this;
  }

  setDefaultObject(object) {
    this.defaultObject = object;
    return this;
  }

  isNeedFilter(filter: boolean) {
    this.filter = filter;
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

  // ACTION BUTTON
  actionButtonConfig(actionButton: Array<ButtonConfig>) {
    this.actionButton = actionButton;
    return this;
  }

  showClear(showClearIcon: boolean) {
    this.showClearIcon = showClearIcon;
    return this;
  }

  onClear(onClearFunction: Function) {
    this.onClearFunction = onClearFunction.bind(this);
    return this;
  }

  toObject(): any {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      placeholder: this.translate.instant(
        this.placeholder ?? 'formPlaceholder_SC',
        {
          label: this.translate.instant(this.label),
        },
      ),
      value: this.value,
      subForm: this.subForm,
      options: this.options,
      optionLabel: this.optionLabel,
      optionValue: this.optionValue,
      validation: this.validation,
      errorText: this.errorText,

      onValueChange: this.onValueChange,
      onValueChangeOnly: this.onValueChangeOnly,
      onSelectItem: this.onSelectItem,

      saveDialogueData: this.saveDialogueData,
      fieldWidth: this.fieldWidth,
      lazyDropdown: this.lazyDropdown, // to create new dropdown option by api.
      urlConfig: this.urlConfig, // url config to add new option or get options.
      bindOptionList: this.bindOptionList, // to return list from API
      autoDisplayFirst: true,
      hidden: this.hidden,
      readonly: this.readonly,
      variant: this.variant,
      dynamicDialogConfig: this.dynamicDialogConfig,
      hrefButtonConfig: this.hrefButtonConfig,
      optionLabelList: this.optionLabelList,
      lazyFilterDropdown: this.lazyFilterDropdown,
      needRequiredFields: this.needRequiredFields,
      requiredFields: this.dropdownRequiredFields,
      defaultObject: this.defaultObject, // to push when dropdown is lazy
      showButton: this.showButton,
      filter: this.filter,
      maxWidth: this.maxWidth,
      savedDataOfDialogue: this.savedDataOfDialogue,

      //Hidde Fields
      isHiddenFunction: this.isHiddenFunction,
      hideFields: this.hideFields,

      isDisableFunction: this.isDisableFunction,
      disableFields: this.disableFields,

      // ACTION BUTTON
      actionButton: this.actionButton,
      hideFunction: this.hideFunction,
      validationFunction: this.validationFunction,
      readonlyFunction: this.readonlyFunction,
      labelFunction: this.labelFunction,
      labelInfo: this.labelInfo,
      labelInfoFunction: this.labelInfoFunction,

      showClearIcon: this.showClearIcon,
      onClearFunction: this.onClearFunction,
    };
  }
}
