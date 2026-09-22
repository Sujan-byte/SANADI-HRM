import { Type } from "@angular/core";
import { FormSettingConfig } from "./masters/form-setting.model";
import { ConfirmationService, MenuItem, SelectItem } from "primeng/api";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";

export class UrlConfig {
  post?: {
    url: string;
    params?: Record<string, any>; // Assuming parameters are key-value pairs
  };
  get?: {
    url: string;
    params?: Record<string, any>;
    filterKeys?: Record<string, any>;
    // Comma-separated field paths for server-side dropdown search. When set, the
    // lazy-filter dropdown sends `search` + `search_key` so the backend filters
    // (OR icontains) at the DB instead of returning the first page unfiltered.
    searchKey?: string;
  };
  put?: {
    url: string;
    params?: Record<string, any>;
  };
  delete?: {
    url: string;
    params?: Record<string, any>;
  };
}

export class OverlayDialogConfig {
  height: string;
  width: string;
}

export class DynamicDialogConfig {
  config: TableFilterFormConfig;
  formConfig: any;
}

export interface LocalCompServiceConfig {
  onSaveFormData(item: any, formFields?: any): any;
}

// BUTTON CONFIG 
export class ButtonConfig {
  show: boolean;
  icon?: string;
  iconFunction?: Function;
  toolTip?: string;
  tooltipPosition?: string;
  tooltipFunction?: Function;
  class?: string = '';
  iconPos?: string;
  isDisableFunction?: boolean;
  disabled?: boolean;
  disableFunction?: Function;
  label?: string;
  labelFunction?: Function;
  hidden?: boolean = false;
  hiddenFunction?: Function;
  onClick?: Function;
  type?: 'toggle';
  value?: any;
  onInput?: Function;
  name?: string;
  // DELETE MULTIPLE ROWS 
  deleteMultiple?: boolean;
  clearFilters?: boolean;
}

export class DisableConfig {
  isDisable: boolean;
  disableFunction: Function;
}

// FOR CUSTOM DYNAMIC TABLE
export class DynamicTableModel {
  pageTitle?: string;
  header?: string;
  columnSchema?: Array<any>;
  list?: Array<any> = [];
  selectionMode?: 'single' | 'multiple';
  rows?: number;
  scrollHeight?: string;
  formInitialise?: Array<any>;
  paginator?: boolean;
  scrollable?: boolean;
  lazy?: boolean;
  fontSize?: string;
  queryParams?: object;
  disabledField?: any;
  url?: string;
  tableName?: string;
  updateRows?: Function;
  selectedArray?: Array<any>;
  height?: string;
  width?: string;
  needSelectedArray?: boolean;
  formValue?: Object;
  tableCaption?: boolean;
  tableCaptionLabel?: string;
  formSchema?: any[];
  directSelectedArray?: boolean;
  idsList?: any;
  bindOption?: Function;
  searchHide?: boolean;
  required_fields?: string = '';
  dataKey?: string = 'id';
}

export interface TableFilterUrlConfig {
  post?: string;
  get?: string;
  delete?: string;
  put?: string;
  getExcel?: string;
  getByPk?: string;
  get_by_pk?: string;
}

export interface TableHeader {
  label: string;
  field: string;
  filterType?: string;
  filterOptions?: any;
  isFilterRequired?: boolean;
  matchModeOptions?: SelectItem<any>[];
  fieldType?: string;
  defaultMatchMode?: string;
  representationField?: string;
  optionLabel?: string;
  optionValue?: string;
  // Enables server-side sorting on this column (DRF ?ordering=<field>).
  sortable?: boolean;
}

export interface ActionConfig {
  label?: string;
  icon?: string;
  actionType?: 'EDIT' | 'DELETE' | 'PRINT' | 'RESTORE' | 'History' | 'REVISION' | 'MENU';
  getById?: boolean;
  tooltip: string;
  buttonClass?: string;
  protect?: { [key: string]: any };
  receiptBuilderConfig?: {
    type: string,
    disablePrintFunction?: Function,
    dynamicPrint?: boolean,
    formUrl?: string,
    copyAs?: string
  };
  onClick?: Function;
  protectFunction?: Function;
  hideen?: boolean;
  hiddenFunction?: Function;
  menuItems?: MenuItem[];
  updateData?: Function;
  // Permission string (e.g. SalesPermission.PRINT_SALES_QUOTATION) the shared table
  // component checks itself to disable this action - lets a form declare gating
  // declaratively in its config instead of computing disabled state per-form.
  permission?: string;
}

export interface ToolBarActionConfig {
  newButton?: boolean;
  activeButton?: boolean;
  inActiveButton?: boolean;
  tutorialVideo?: boolean;
}

export interface ApprovalDropdownConfig {
  disable?: boolean;
  required?: boolean;
  hidden?: boolean;
}

export interface SaveButtonConfig {
  disable?: boolean;
  hidden?: boolean;
}

export interface DialogFooterConfig {
  approvalDropdownConfig?: ApprovalDropdownConfig;
  saveButtonConfig?: SaveButtonConfig
}

export interface dialogConfig {
  width?: string;
  height?: string;
  maximizable?: boolean
  headerActions?: boolean
  localHeaderComponent?: Type<any>;
  localFooterComponent?: Type<any>;
  dialogueFooterConfig?: DialogFooterConfig
}

export interface TableFilterFormConfig {
  formName?: string;
  pageTitle?: string;
  tableHeaders?: TableHeader[];
  tableBody?: string[] | Array<any>;
  editable?: boolean;
  url?: TableFilterUrlConfig;
  params?: {
    get?: Record<string, any>,
    getById?: Record<string, any>
  };
  actions?: ActionConfig[];
  toolBarActionConfig?: ToolBarActionConfig;
  dialogData?: any;
  isShowDialog?: boolean;
  customDialog?: boolean;
  data?: any;
  parentRoute?: any;
  localCompService?: any;
  dialogConfig?: dialogConfig;
  formSettingModel?: FormSettingConfig;
  updateConfig?: Function;
  customShow?: Function;
  // AFTER REPONSE FORM DIALOGUE
  dialogueResponse?: Function;
  // CHECK BOX
  hideCheckBox?: boolean;
  hideSerialNumber?: boolean;
  // TABLE
  scrollHeight?: string;
  // EXPORT
  hideExport?: boolean;
  disableExport?: boolean;
  // Permission string (e.g. SalesPermission.EXPORT_SALES_QUOTATION) the shared table
  // component checks itself to disable the Export button - same declarative pattern as
  // ActionConfig.permission, so a form doesn't need to compute this itself.
  exportPermission?: string;
  exportFields?: Array<ExportFields>;
  exportFileName?: string;
  // IMPORT
  // Declaring this turns on the toolbar's Import (+ Download Sample, when
  // sampleFileUrl is set) buttons for this table - same declarative pattern
  // as exportFields/exportPermission above.
  importConfig?: TableImportConfig;
  actionButton?: ButtonConfig[];
  handleApprove?: Function;
  closeOnEscape?: boolean;
  closable?: boolean;
  autoGeneratedCode?: AutoGeneratedModel;
  isShowFooter?: boolean;
  onCloseGetList?: boolean;
  isApproveNeeded?: boolean;
  middleTitle?: ButtonConfig;
  saveFunction?: Function;
  hideSaveButton?: boolean;
  confirmationConfig?: ConfirmationModel;
  saveConfig?: {
    manual?: boolean;
    permission?: any[];
    disableFunction?: Function;
    allowSuperUserSave?:boolean;
    tempEnableAccess?:Function
  }
}

// PARAMETERS CONFIG
export class ParamtersConfig {
  event?: any;
  current?: any;
  next?: any;
  prev?: any;
  formValue?: any = {};
  tableValue?: any = {};
  field?: any;
  formFields?: any = [];
  form?: any;

  // DROPDOWN
  currentItem?: any = {};

  action?: ButtonConfig;
  confirmationService?: ConfirmationService;

  dataSource?: any[] = [];
  selectedMainArray?: any[] = [];
  dialogHandlerService?: DialogService;

  config?: any;
  ref?: any;
}

// RETURN CONFIG
export class ReturnConfig {
  form?: any;
  footerInitialize?: any;
  tableValue?: any;
  selectedArray?: any[];
}

export class DialogModel {
  config?: TableFilterFormConfig;
  ref?: DynamicDialogRef;
}

// EXPORT MODEL
export class ExportModel {
  select_all?: boolean = false;
  fields?: any[] = [];
  excel?: boolean = false;
  pdf?: boolean = false;

  export_fields?: any = [];
  selected_list_ids?: any = [];
  params?: any = {};
}

export class ExportFields {
  id?: any;
  field?: string = '';
  label?: string = '';
  type?: 'number';
  format?: string = '';
  locale?: string = '';

}

export interface TableImportConfig {
  // Endpoint the raw file is POSTed to as multipart FormData under the 'file' key,
  // e.g. `${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}/import_excel/`.
  url: string;
  // Static asset path for a downloadable sample template; the Download Sample
  // button is hidden when this isn't set.
  sampleFileUrl?: string;
  // Download filename to use for the sample file (defaults to its own name).
  sampleFileName?: string;
  // Same declarative permission-gating pattern as exportPermission.
  permission?: string;
  // Accepted file extensions for the picker, defaults to '.xlsx,.xls'.
  accept?: string;
}

export class ConfirmationModel {
  show?: boolean = false;
  title?: string; //confirmation dialog title
  titleTooltip?: string; //tooltip for title if needed
  icon?: string; //dialog icon
  message?: string; // confirmation dialog subtitle
  submitButtonText?: string; //submit button text
  cancelButtonText?: string; //cancel button text
  closeButtonText?: string; //close button text
  type?: string; //confirmation, info
  isInfoActionable?: boolean; //on hover list show info dialog
  data?: any; //processed data for showing custom info ...etc
  submitButtonStatus?: boolean; //hide/show submit button
  cancelButtonStatus?: boolean; //hide/show cancel button
  closeButtonStatus?: boolean; //hide/show close button
  width?: string; //popup width
  height?: string; //popup width
  accept?: any;
  reject?: any;
  close?: any;
  disableSubmit?: boolean;

  rejectConfig?: {
    onReject?: Function;
    closeDialog?: boolean;
    saveForm?: boolean;
  }
}

// AUTO GENERATED CODE CONFIG
export class AutoGeneratedModel {
  url?: string;
  key?: string;
  data?: AutoGeneratedDataModel;
}

export class AutoGeneratedDataModel {
  constants?: string;
  type?: AutoGeneratedTypeModel;
}

export class AutoGeneratedTypeModel {
  last_sequence?: boolean;
  four?: boolean;
  four_fiscal_year?: boolean;
  sequence_letter?: boolean;
  text_value_year_sequence?: any;
  custom?: any;
}

export class ValidationModel {
  required?: boolean = false;
  minLength?: number;
  maxLength?: number;
  isEmail?: boolean = false;
  password?: boolean = false;
  isGST?: boolean = false;
  isPhoneNumber?: boolean = false;
  isHsn?: boolean = false;
  pattern?: string | { value: RegExp; message?: string };
  warning?: boolean = false;
  warningText?: string = '';
  invalidate?: boolean = false;
}
