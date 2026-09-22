import { ButtonConfig, DisableConfig, OverlayDialogConfig } from '../../../model/app.model';
import { FormField } from '../form-builder';

export class TableBuilder extends FormField {
  override type?: string = 'table';
  override fields?: FormField[] = new Array<FormField>();

  private schema: any;
  private colSchema: any;
  private dataKey: any;
  private dataSource: any;
  private formInitialization: any;
  private footerRows: any;
  private isFooterEnabled: any;
  private rows: number;
  private paginator: boolean = false;

  private onValueChange: any;
  private updateTableFooter: any;
  private tableCaption: boolean = false;
  private tableCaptionLabel: string = '';
  private tableCaptionDialogButton: boolean = false;
  private tableCaptionDialogButtonLabel: string = '';
  private hiddenCaptionDialogButtonFunction?: Function;
  private exportTableData: boolean = false;
  private exportTableFunction: Function;
  private dialog: any;
  private dialogConfig: any;
  private tableField: any;

  private hideAddButton: boolean = false;
  private hideAddButtonFunction: Function;

  private hideDeleteButton: boolean = false;
  private hideSaveButton: boolean = false;
  private hideCancelButton: boolean = false;
  // private disableButton:boolean=false;
  private disableEditButton: boolean = false;
  private disableDeleteButton: boolean = false;

  private hideEditButton: boolean = false;
  private hideFrozenColumn: boolean = false;
  private columnFilters: boolean = false;
  private dynamicButton: boolean = false;
  private dynamicButtonLabel: string;
  private dynamicButtonIcon: string;
  private onClickDynamicButton: Function;
  private onRowDeleteInit: Function;
  private onRowAddCustomInit:Function;
  private rowAddFunction: Function;
  private updatedRows: Function;
  private onSelectionChange: Function;
  private tableWidth: string;
  private mainSelectedArray: any = [];
  scrollHeight: any;
  private checkbox: boolean = false;
  hideViewButton: boolean = true;
  viewData: Function;

  // TOOL TIP
  private editTooltip: string = 'Edit';
  private editTooltipPosition: string = 'top';
  private deleteTooltip: string = 'Delete';
  private deleteTooltipPosition: string = 'top';
  private saveTooltip: string = 'Save';
  private saveTooltipPosition: string = 'top';
  private cancelTooltip: string = 'Cancel';
  private cancelTooltipPosition: string = 'top';
  private viewTooltip: string = 'View';
  private viewTooltipPosition: string = 'top';

  private isEditDisableFn: boolean = false;
  private editDisableFunction: Function;
  private isDeleteDisableFn: boolean = false;
  private deleteDisableFunction: Function;
  private disableTable: Function;

  // ACTION BUTTON
  private actionButton: Array<ButtonConfig> = [{
    show: false,
    icon: 'pi pi-box',
    toolTip: '',
    tooltipPosition: 'top',
    class: 'p-button-outlined p-button-rounded p-button-help p-button-sm',
  }];
  // CAPTION BUTTONS
  private captionButton: Array<ButtonConfig> = [];
  // TABLE BUTTONS
  private tableButton: Array<ButtonConfig> = [];
  // GLOBAL SEARCH
  private showGlobalSearch: boolean = false;
  private globalFilterFields: string[];

  constructor(translate?: any, name?: string, label?: string, columnFilters?: boolean) {
    super(translate);
    this.name = name;
    this.label = label;
    this.columnFilters = columnFilters;
  }

  formInitialise<T>(initialise: T) {
    this.formInitialization = initialise;
    return this;
  }

  columnSchema(colSchema) {
    this.colSchema = colSchema;
    return this
  }

  formSchema<T>(schema: T) {
    this.schema = schema
    return this;
  }

  getDatasource<T>(id: string, list: T) {
    this.dataKey = id;
    this.dataSource = list;
    return this
  }

  enableFooter(isEnabled) {
    this.isFooterEnabled = isEnabled;
    return this;
  }

  onChange(onValueChange: Function) {
    this.onValueChange = onValueChange.bind(this);
    return this;
  }

  footerInitialise(rows) {
    this.footerRows = rows;
    return this;
  }

  addDialog(dialog, config) {
    this.dialog = dialog
    this.dialogConfig = config;
    return this;
  }

  setOnValueChange(onValueChange: any): TableBuilder {
    this.onValueChange = onValueChange;
    return this;
  }

  onClickView(onClickView: Function): TableBuilder {
    this.viewData = onClickView;
    return this
  }

  setTableCaption(tableCaption: boolean): TableBuilder {
    this.tableCaption = tableCaption;
    return this;
  }

  setTableCaptionLabel(tableCaptionLabel: string): TableBuilder {
    this.tableCaptionLabel = tableCaptionLabel;
    return this;
  }

  setTableCaptionDialogButton(tableCaptionDialogButton: boolean): TableBuilder {
    this.tableCaptionDialogButton = tableCaptionDialogButton;
    return this;
  }

  setTableCaptionDialogButtonLabel(tableCaptionDialogButtonLabel: string): TableBuilder {
    this.tableCaptionDialogButtonLabel = tableCaptionDialogButtonLabel;
    return this;
  }

  setHiddenCaptionDialogButtonFunction(hiddenCaptionDialogButtonFunction: Function) {
    this.hiddenCaptionDialogButtonFunction = hiddenCaptionDialogButtonFunction;
    return this;
  }

  setExportTableData(exportTableData: boolean): TableBuilder {
    this.exportTableData = exportTableData;
    return this;
  }

  customExportTableFunction(exportTableFunction: Function): TableBuilder {
    this.exportTableFunction = exportTableFunction;
    return this
  }

  setDialog(dialog: any): TableBuilder {
    this.dialog = dialog;
    return this;
  }

  setField(field: OverlayPanelBuilder) {
    this.tableField = field;
    return this;
  }
  disableTableFn(disableTable: Function) {
    this.disableTable = disableTable;
    return this;
   }

  buttonStates(
    hideEdit: boolean = false,
    hideDelete: boolean = false,
    disableEdit: boolean = false,
    disableDelete: boolean = false,
    hideFrozen: boolean = false,
    hideViewButton: boolean = true,
    hideSaveButton: boolean = false,
    hideCancelButton: boolean = false,
  ) {
    this.hideEditButton = hideEdit;
    this.hideDeleteButton = hideDelete;
    this.disableEditButton = disableEdit;
    this.disableDeleteButton = disableDelete;
    this.hideFrozenColumn = hideFrozen;
    this.hideViewButton = hideViewButton;
    this.hideSaveButton = hideSaveButton;
    this.hideCancelButton = hideCancelButton;
    return this;
  }

  isHiddenAddButton(val: boolean) {
    this.hideAddButton = val;
    return this
  }

  setTableScrollHeight(val) {
    this.scrollHeight = val;
    return this
  }

  setDynamicButtonConfig(dynamicButtonConfig: { dynamicButton: boolean, dynamicButtonLabel: string, dynamicButtonIcon?: string }): TableBuilder {
    this.dynamicButton = dynamicButtonConfig?.dynamicButton;
    this.dynamicButtonLabel = dynamicButtonConfig?.dynamicButtonLabel;
    this.dynamicButtonIcon = dynamicButtonConfig?.dynamicButtonIcon
    return this;
  }

  setOnClickDynamicButton(onClickDynamicButton: any) {
    this.onClickDynamicButton = onClickDynamicButton;
    return this;
  }

  // DELETE
  onDeleteTableRow(onRowDeleteInit: Function) {
    this.onRowDeleteInit = onRowDeleteInit;
    return this
  }
   onRowAddCustom(onRowAddCustomInit: Function) {
    this.onRowAddCustomInit = onRowAddCustomInit;
    return this
  }

  // Gate for the "+" add-row button: called with the current form value before a row is pushed;
  // return false (and show whatever warning you like inside it) to block the add.
  setRowAddFunction(rowAddFunction: Function) {
    this.rowAddFunction = rowAddFunction;
    return this
  }

  onUpdatedRows(updatedRows: Function) {
    this.updatedRows = updatedRows;
    return this
  }

  setTableWidth(tableWidth) {
    this.tableWidth = tableWidth;
    return this
  }

  setTableFooterValues(updatedFooterValues) {
    this.updateTableFooter = updatedFooterValues;
    return this
  }

  setAddButton(val: boolean) {
    this.hideAddButton = val;
    return this
  }

  setHideAddButtonFunction(hiddenFunction: Function) {
    this.hideAddButtonFunction = hiddenFunction;
    return this;
  }

  setMainSelectedArray(values) {
    this.mainSelectedArray = values;
    return this
  }

  setOnSelectionChange(onSelectionChange: any): TableBuilder {
    this.onSelectionChange = onSelectionChange;
    return this;
  }

  setCheckBox(checkbox: boolean) {
    this.checkbox = checkbox;
    return this
  }

  // TOOL TIP
  editButtonToolTip(name: string, position: string) {
    this.editTooltip = name;
    this.editTooltipPosition = position;
    return this;
  }

  deleteButtonToolTip(name: string, position: string) {
    this.deleteTooltip = name;
    this.deleteTooltipPosition = position;
    return this;
  }

  saveButtonToolTip(name: string, position: string) {
    this.saveTooltip = name;
    this.saveTooltipPosition = position;
    return this;
  }

  cancelButtonToolTip(name: string, position: string) {
    this.cancelTooltip = name;
    this.cancelTooltipPosition = position;
    return this;
  }

  viewButtonToolTip(name: string, position: string) {
    this.viewTooltip = name;
    this.viewTooltipPosition = position;
    return this;
  }

  // DISABLE FUNCTION
  editDisableButton(disableFunction: Function) {
    this.editDisableFunction = disableFunction;
    return this;
  }

  deleteDisableButton(disableFunction: Function) {
    this.deleteDisableFunction = disableFunction;
    return this;
  }

  // ACTION BUTTON
  actionButtonConfig(actionButton: Array<ButtonConfig>) {
    this.actionButton = actionButton;
    return this;
  }
  
  // CAPTION BUTTON
  captionButtonConfig(captionButton: Array<ButtonConfig>) {
    this.captionButton = captionButton;
    return this;
  }

  // TABLE BUTTON
  tableButtonConfig(tableButton: Array<ButtonConfig>) {
    this.tableButton = tableButton;
    return this;
  }

  enableGlobalSearch(fields: string[]): TableBuilder {
    this.showGlobalSearch = true;
    this.globalFilterFields = fields;
    return this;
  }

  // TABLE ROWS
  tableRowsCount(tableRows: number) {
    this.rows = tableRows;
    this.paginator = true;
    return this;
  }


  build() {
    return {
      type: this.type,
      name: this.name,
      label: this.label,
      tableGridlines: "p-datatable-gridlines",
      scrollHeight: this.scrollHeight,
      formInitialise: this.formInitialization,
      columnSchema: this.colSchema,
      formSchema: this.schema,
      dataKey: this.dataKey,
      dataSource: this.dataSource,
      tableFooter: this.isFooterEnabled,
      footerInitialise: this.footerRows,
      onValueChange: this.onValueChange,
      updateTableFooter: this.updateTableFooter,
      rows: this.rows,
      paginator: this.paginator,

      hideAddButton: this.hideAddButton,
      hideAddButtonFunction: this.hideAddButtonFunction,
      
      hideDeleteButton: this.hideDeleteButton,
      hideEditButton: this.hideEditButton,
      hideViewButton: this.hideViewButton,
      hideFrozenColumn: this.hideFrozenColumn,
      hideSaveButton: this.hideSaveButton,
      hideCancelButton: this.hideCancelButton,
      viewData: this.viewData,

      // disableButton:this.disableButton,
      disableEditButton: this.disableEditButton,
      disableDeleteButton: this.disableDeleteButton,
      tableWidth: this.tableWidth,
      onSelectionChange: this.onSelectionChange,

      // table popup
      tableCaption: this.tableCaption,
      tableCaptionLabel: this.tableCaptionLabel,
      tableCaptionDialogButton: this.tableCaptionDialogButton,
      tableCaptionDialogButtonLabel: this.tableCaptionDialogButtonLabel,
      hiddenCaptionDialogButtonFunction: this.hiddenCaptionDialogButtonFunction,
      exportTableData: this.exportTableData,
      exportTableFunction: this.exportTableFunction,
      dialog: this.dialog,
      config: this.dialogConfig,
      field: this.tableField,
      columnFilters: this.columnFilters,
      onRowDeleteInit: this.onRowDeleteInit,
      onRowAddCustomInit: this.onRowAddCustomInit,
      rowAddFunction: this.rowAddFunction,
      mainSelectedArray: this.mainSelectedArray,
      updatedRows: this.updatedRows,

      // dynamic button
      dynamicButton: this.dynamicButton,
      dynamicButtonLabel: this.dynamicButtonLabel,
      dynamicButtonIcon: this.dynamicButtonIcon,
      onClickDynamicButton: this.onClickDynamicButton,
      checkbox: this.checkbox,

      // TOOL TIP BUTTON
      editTooltip: this.editTooltip,
      editTooltipPosition: this.editTooltipPosition,
      deleteTooltip: this.deleteTooltip,
      deleteTooltipPosition: this.deleteTooltipPosition,
      saveTooltip: this.saveTooltip,
      saveTooltipPosition: this.saveTooltipPosition,
      cancelTooltip: this.cancelTooltip,
      cancelTooltipPosition: this.cancelTooltipPosition,
      viewTooltip: this.viewTooltip,
      viewTooltipPosition: this.viewTooltipPosition,

      isEditDisableFn: this.isEditDisableFn,
      editDisableFunction: this.editDisableFunction,
      isDeleteDisableFn: this.isDeleteDisableFn,
      deleteDisableFunction: this.deleteDisableFunction,

      // ACTION BUTTON
      actionButton: this.actionButton,
      // CAPTION BUTTON
      captionButton: this.captionButton,
      // TABLE BUTTON
      tableButton: this.tableButton,
      showGlobalSearch: this.showGlobalSearch,
      globalFilterFields: this.globalFilterFields,
      hidden: this.hidden,
      hideFunction: this.hideFunction,
      disableTable: this.disableTable
    }
  }
}

export class OverlayPanelBuilder {
  private overlayPanelColumnSchema: any = null;
  private overlayPanelList: any[] = [];
  private overlayPanelSelectionMode: string = 'single';
  private overlayPanelRows: number = 10;
  private dialogScrollHeight: string = '55vh';
  private overlayPanelFormInitialise: string[] = [];
  private overlayPanelPaginator: boolean = true;
  private scrollable: boolean = true;
  private lazy: boolean = true;
  private fontSize: string = '14px';
  private queryParams: any = {};
  private disabledField: string = 'false';
  private urls: any;
  private tableName: string;
  private onUpdateRows: any;
  private selectedArray: any = [];
  private overlayDialogHeight: any;
  private overlayDialogWidth: any;
  private needSelectedArray: boolean = true;
  private overlayHeader: string;
  constructor() { }

  setOverlayPanelColumnSchema(overlayPanelColumnSchema: any): OverlayPanelBuilder {
    this.overlayPanelColumnSchema = overlayPanelColumnSchema;
    return this;
  }

  setOverlayPanelList(overlayPanelList: any): OverlayPanelBuilder {
    this.overlayPanelList = overlayPanelList;
    return this;
  }

  setOverlayPanelSelectionMode(overlayPanelSelectionMode: string): OverlayPanelBuilder {
    this.overlayPanelSelectionMode = overlayPanelSelectionMode;
    return this;
  }

  setOverlayPanelRows(overlayPanelRows: number): OverlayPanelBuilder {
    this.overlayPanelRows = overlayPanelRows;
    return this;
  }

  setDialogScrollHeight(dialogScrollHeight: string): OverlayPanelBuilder {
    this.dialogScrollHeight = dialogScrollHeight;
    return this;
  }

  setOverlayPanelFormInitialise(overlayPanelFormInitialise: string[]): OverlayPanelBuilder {
    this.overlayPanelFormInitialise = overlayPanelFormInitialise;
    return this;
  }

  setOverlayPanelPaginator(overlayPanelPaginator: boolean): OverlayPanelBuilder {
    this.overlayPanelPaginator = overlayPanelPaginator;
    return this;
  }

  setScrollable(scrollable: boolean): OverlayPanelBuilder {
    this.scrollable = scrollable;
    return this;
  }

  setLazy(lazy: boolean): OverlayPanelBuilder {
    this.lazy = lazy;
    return this;
  }

  setFontSize(fontSize: string): OverlayPanelBuilder {
    this.fontSize = fontSize;
    return this;
  }

  setQueryParams(queryParams: any): OverlayPanelBuilder {
    this.queryParams = queryParams;
    return this;
  }

  setDisabledField(disabledField: string): OverlayPanelBuilder {
    this.disabledField = disabledField;
    return this;
  }

  setUrls(urls: any) {
    this.urls = urls;
    return this;
  }

  setTableName(tableName: string) {
    this.tableName = tableName
    return this;
  }

  setOnUpdateRows(onUpdateRows: any) {
    this.onUpdateRows = onUpdateRows;
    return this;
  }

  setOverlayPanelSelectedArray(selectedArray: any[]) {
    this.selectedArray = selectedArray;
    return this
  }

  setOverlayDialogConfig(config: OverlayDialogConfig) {
    this.overlayDialogHeight = config.height;
    this.overlayDialogWidth = config.width;
    return this
  }

  setoverlayHeader(overlayHeader: string) {
    this.overlayHeader = overlayHeader
    return this;
  }


  build(): any {
    return {
      overlayPanelColumnSchema: this.overlayPanelColumnSchema,
      overlayPanelList: this.overlayPanelList,
      overlayPanelSelectionMode: this.overlayPanelSelectionMode,
      overlayPanelRows: this.overlayPanelRows,
      dialogScrollHeight: this.dialogScrollHeight,
      overlayPanelFormInitialise: this.overlayPanelFormInitialise,
      overlayPanelPaginator: this.overlayPanelPaginator,
      scrollable: this.scrollable,
      lazy: this.lazy,
      fontSize: this.fontSize,
      queryParams: this.queryParams,
      disabledField: this.disabledField,
      url: this.urls,
      tableName: this.tableName,
      updateRows: this.onUpdateRows,
      selectedArray: this.selectedArray,
      height: this.overlayDialogHeight,
      width: this.overlayDialogWidth,
      needSelectedArray: this.needSelectedArray,
      overlayHeader: this.overlayHeader
    };
  }
}

// Example Usage:
// const overlayPanelSettings = new OverlayPanelBuilder()
//   .setOverlayPanelColumnSchema(null)
//   .setOverlayPanelList([{}, {}, {}, {}, {}])
//   .setOverlayPanelSelectionMode('single')
//   .setOverlayPanelRows(10)
//   .setDialogScrollHeight('55vh')
//   .setOverlayPanelFormInitialise(['productName', 'kit_no'])
//   .setOverlayPanelPaginator(true)
//   .setScrollable(true)
//   .setLazy(true)
//   .setFontSize('14px')
//   .setQueryParams({})
//   .setDisabledField('false')
//   .build();
