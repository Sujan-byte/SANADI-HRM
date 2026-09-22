import { FormField } from '../form-builder';

export class FileField extends FormField {
  override type?: string = 'file';
  align: string;
  onUpload: Function;
  fileType: Function;
  onDelete: any;
  isBase64String: boolean = false;
  imageWidth: string;
  imageHeight: string;
  selectedFiles: any = [];
  isMultipleFile: boolean = false;
  acceptFiles: any;
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

  setAlignment(val: string) {
    this.align = val;
    return this
  }

  setIsMultipleFile(val: boolean) {
    this.isMultipleFile = val;
    return this
  }

  onUploadFile(event) {
    this.onUpload = event.bind(this);
    return this
  }

  setFileType(type) {
    this.fileType = type;
  }

  acceptFileType(types: any) {
    this.acceptFiles = types;
    return this
  }

  onDeleteFile(onDelete) {
    this.onDelete = onDelete;
  }

  isBase64StringFile(val: boolean) {
    this.isBase64String = val;
    return this
  }

  setFileConfig(config: { width?: string, height?: string }) {
    this.imageHeight = config?.height;
    this.imageWidth = config?.width;
    return this
  }

  setSelectedFiles(selectedFiles) {
    this.selectedFiles = selectedFiles;
    return this
  }

  toObject() {
    return {
      type: this.type,
      name: this.name,
      label: this.translate.instant(this.label),
      value: this.value,
      validation: this.validation,
      errorText: this.errorText,
      fieldWidth: this.fieldWidth,
      readonly: this.readonly,
      variant: this.variant,
      hidden: this.hidden,
      align: this.align,
      downloadButton: true,
      multiple: this.isMultipleFile,
      onUpload: this.onUpload,
      fileType: this.fileType,
      deleteFile: this.onDelete,
      isBase64String: this.isBase64String,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
      selectedFiles: this.selectedFiles,
      acceptFiles: this.acceptFiles
    };
  }
}
