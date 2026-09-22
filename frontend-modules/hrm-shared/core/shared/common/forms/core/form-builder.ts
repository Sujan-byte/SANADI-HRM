import { warn } from "console";

export abstract class FormField {
  type?: string = '';
  name?: string;
  label?: string;
  placeholder?: string;
  value?: any;
  validation?: {
    required?: boolean;
    minlength?: number;
    pattern?: string;
    warning?:boolean
    // Add more validation rules as needed
  };
  errorText?: {
    required?: string;
    minlength?: string;
    maxLength?: string;
    // Add more error messages as needed
  };
  isEditMode?: boolean;
  data?: any;
  defaultData?: any;
  readonly?: boolean;
  readonlyFunction?: Function;

  translate?: any;

  // used for Tab title
  tabHeader?: string;
  fieldWidth?: string;
  fields?: FormField[];
  hidden?: boolean;
  variant?: any;
  fieldUniqueKey?: string;

  hideFunction?: Function;
  hideLabel?: boolean = false;
  validationFunction?: Function;
  labelFunction?: Function;

  labelInfo?: any;
  labelInfoFunction?: Function;

  constructor(translate: any) {
    this.translate = translate;
  }

  validate?(required?: boolean, minLength?: number, maxLength?: number, isEmail?: boolean, password?: boolean, isGST?: boolean, isPhoneNumber?: boolean, isHsn?: boolean,warning?:boolean,warningText?:string) {
    let validationObj: any = {};

    if (required) {
      validationObj.required = required;
    }
    if (minLength) {
      validationObj.minlength = minLength;
    }
    if (maxLength) {
      validationObj.maxlength = maxLength;
    }
    if (isEmail) {
      validationObj.pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    }
    if (password) {
      validationObj.pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    }
    if (isGST) {
      validationObj.pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    }
    if (isPhoneNumber) {
      validationObj.pattern = /^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}?\)?)[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})?$/;
    }
    if (isHsn) {
      validationObj.pattern = /^\d{8}$/;
    }
    if(warning){
      validationObj.warning = true;
    }
    this.validation = validationObj;
    this.error(minLength ? minLength.toString() : '', maxLength ? maxLength.toString() : '', isEmail, password, isGST, isPhoneNumber, isHsn,warning,warningText)
    return this;
  }

  error?(minLength: string = 'one_number', maxLength: string = '', isEmail?: boolean, password?: boolean, isGST?: boolean, isPhoneNumber?: boolean, isHsn?: boolean,warning?:boolean,warningText?:string) {
    let errorObj = {
      required: '',
      minlength: '',
      maxlength: '',
      pattern: '',
      warning:''
    };

    errorObj.required = this.translate.instant('formRequiredError_SC', {
      label: this.translate.instant(this.label),
    });
    if (minLength) {
      errorObj.minlength = this.translate.instant('formMinLengthError_SC', {
        label: this.translate.instant(this.label),
        char: this.translate.instant(minLength),
      });
    }
    if (maxLength) {
      errorObj.maxlength = this.translate.instant('formMaxLengthError_SC', {
        label: this.translate.instant(this.label),
        char: this.translate.instant(maxLength),
      });
    }
    if (isEmail) {
      errorObj.pattern = this.translate.instant('formEmailError_SC', {
        label: this.translate.instant(this.label),
      });
    }
    if (password) {
      errorObj.pattern = this.translate.instant('formPasswordError_SC', {
        label: this.translate.instant(this.label),
      });
    }
    if (isGST) {
      errorObj.pattern = this.translate.instant('formGstError_SC', {
        label: this.translate.instant(this.label),
      });
    }
    if (isPhoneNumber) {
      errorObj.pattern = this.translate.instant('formPhoneNumber_SC', {
        label: this.translate.instant(this.label),
      });
    }
    if (isHsn) {
      errorObj.pattern = this.translate.instant('formHsnError_SC', {
        label: this.translate.instant(this.label),
      });
    }
    if(warning){
          errorObj.warning = warningText || 'Warning: This field has a warning';
    }
    this.errorText = errorObj;
    return this;
  }

  addFormFields?(fields: FormField[]) {

  }

  addFieldWidth?(fieldWidth: string) {
    this.fieldWidth = fieldWidth;
    return this;
  }

  isFieldHidden?(hidden: boolean) {
    this.hidden = hidden;
    return this;
  }

  variantType?(variant) {
    this.variant = variant;
    return this;
  }

  isHideFunction?(hiddenFunction: Function) {
    this.hideFunction = hiddenFunction;
    return this;
  }

  isHideLabel?(hiddenLabel: boolean) {
    this.hideLabel = hiddenLabel;
    return this;
  }

  setValidationFunction?(validationFunction: Function) {
    this.validationFunction = validationFunction;
    return this;
  }

  setReadonlyFunction?(readonlyFunction: Function) {
    this.readonlyFunction = readonlyFunction;
    return this;
  }

  setLabelFunction?(labelFunction: Function) {
    this.labelFunction = labelFunction;
    return this;
  }

  setLabelInfo?(info) {
    this.labelInfo = { info };
    return this;
  }

  setLabelInfoFunction?(labelInfoFunction: Function) {
    this.labelInfoFunction = labelInfoFunction;
    return this;
  }

  // setValue(value) {
  //   this.value = value;
  //   return this;
  // }
}
