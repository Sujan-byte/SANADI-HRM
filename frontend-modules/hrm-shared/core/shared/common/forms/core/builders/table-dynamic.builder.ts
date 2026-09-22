import { FormField } from '../form-builder';

export class TableDynamicBuilder extends FormField {
  override type?: string = 'table-dynamic';
  override fields?: FormField[] = new Array<FormField>();

  private colSchema: any;
  private dataKey: any;
  private dataSource: any;
  private formInitialization: any;
  private rows: number = 10;
  private paginator: boolean = false;

  private tableWidth: string;
  private scrollHeight: any;
  private columnFilters: boolean;
  private scrollable: any;
  private lazy: any;
  private queryParams: any;
  private url: any;
  private tableName: any;
  private tableCaption: boolean;
  private tableCaptionLabel: string;
  private schema: any;
  private searchHide: boolean;
  
  constructor(translate, name?: string, label?: string, columnFilters?: boolean) {
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

  getDatasource<T>(id: string, list: T) {
    this.dataKey = id;
    this.dataSource = list;
    return this
  }

  setTableScrollHeight(val) {
    this.scrollHeight = val;
    return this
  }

  setTableWidth(tableWidth: string) {
    this.tableWidth = tableWidth;
    return this
  }

  // TABLE ROWS
  tableRowsCount(tableRows: number) {
    this.rows = tableRows;
    this.paginator = true;
    return this;
  }

  setQueryParams(queryParams: any) {
    this.queryParams = queryParams;
    return this;
  }

  setUrls(urls: any) {
    this.url = urls;
    return this;
  }

  setTableName(tableName: string) {
    this.tableName = tableName
    return this;
  }

  setLazy(lazy: boolean) {
    this.lazy = lazy;
    return this;
  }

  setScrollable(scrollable: boolean) {
    this.scrollable = scrollable;
    return this;
  }

  setTableCaption(tableCaption: boolean) {
    this.tableCaption = tableCaption;
    return this;
  }

  setTableCaptionLabel(tableCaptionLabel: string) {
    this.tableCaptionLabel = tableCaptionLabel;
    return this;
  }

  formSchema<T>(schema: T) {
    this.schema = schema
    return this;
  }

  setSearchHide(searchHide: boolean) {
    this.searchHide = searchHide;
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
      rows: this.rows,
      paginator: this.paginator,
      tableWidth: this.tableWidth,
      columnFilters: this.columnFilters,
      scrollable: this.scrollable,
      lazy: this.lazy,
      queryParams: this.queryParams,
      url: this.url,
      tableName: this.tableName,
      width: this.tableWidth,
      tableCaption: this.tableCaption,
      tableCaptionLabel: this.tableCaptionLabel,
      searchHide: this.searchHide,
    }
  }
}

