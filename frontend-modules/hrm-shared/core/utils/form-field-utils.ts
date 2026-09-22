import { DateField } from '../shared/common/forms/core/builders/date.builder';
import { DropdownField } from '../shared/common/forms/core/builders/dropdown.builder';
import { InputField } from '../shared/common/forms/core/builders/input.builder';

export class FormFieldUtil {
  translate: any;
  constructor(translate: any) {
    this.translate = translate;
  }
  getInputField(name: string, defaultData) {
    return new InputField(this.translate, name, false, null, defaultData)
      .addFieldWidth('32%')
      .variantType('basic')
      // .isReadOnly(true)
      .toObject();
  }

  getDateField(name: string, defaultData,onChageHandler?: Function,) {
    return (
      new DateField(this.translate, name, false, null, defaultData)
        .addFieldWidth('32%')
        .validate(true)
        .variantType('basic')
        .onChange(onChageHandler.bind(this))
        .addFormat('yy-mm-dd')
        .toObject()
    );
  }

  getDropDownField(
    name: string,
    defaultData,
    onChageHandler?: Function,
    options?: any
  ) {
    return new DropdownField(this.translate, name, false, null, defaultData)
      .addFieldWidth('32%')
      .addKeyValueLabel('value', 'key')
      .onChange(onChageHandler.bind(this))
      .getOptions(options)
      .variantType('basic')
      .toObject();
  }

  createTableInputField(
    name: string,
    type: string,
    id?: string,
    onValueChange?: Function
  ) {
    return { name, type, id, onValueChange };
  }

  createDropdownField(dpData){
    return {
      name:dpData.name,
      type:"dropdown",
      options:dpData.options,
      optionLabel:dpData.optionLabel,
      optionValue:dpData.optionValue,
      dialogue:dpData.dialogue,
      label: 'test',
      dialogueLabel: 'Enter Serial Number',
      emptyCustomDialogTemplate: true,
      emptyComment: '',
      placeholder: this.translate.instant('enter_Serial_Number_TC', {
        label: this.translate.instant('enter_Serial_Number_TC'),
      }),
      dialogueWidth:dpData.dialogueWidth,
      dialogueHeight:dpData.dialogueHeight,
      dialogueFields:dpData.dialogueFields,
    }
  }
}
