import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Form, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import * as XLSX from 'xlsx';
import { TableDialogComponent } from './table-dialog/table-dialog.component';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { Table } from 'primeng/table';
import { OverlayPanel } from 'primeng/overlaypanel';
import * as moment from 'moment';
import { ButtonConfig, ReturnConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { decimalDigits, numberFormat02, numberLocale } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
import { DecimalPipe } from '@angular/common';
import { matchModeOptions, matchModeOptionsLocal } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';

@Component({
  selector: 'table-field',
  templateUrl: './table-field.component.html',
  styleUrls: ['./table-field.component.scss'],
})
export class TableFieldComponent implements OnInit, OnDestroy {
  @Input() columnSchema: any = [];
  @Input() formSchema: any = [];
  @Input() formInitialise: any = [];
  @Input() formName: string = '';
  @Input() dataSource: any = [];
  @Input() form: UntypedFormGroup | any;
  @Input() dataKey: string = 'id';
  @Input() field: any = {};
  @Input() scrollHeight: any;
  @Input() hideButton: boolean = false;
  @Input() hideFrozenColumn: boolean = false;
  @Input() formFields: any;
  selectedArray: any = [];
  @Input() selectedMainArray: any = [];
  tableCaptionDialogFlag: boolean = false;
  tempArray: any = [];
  filtering: any;
  rowSelected: boolean = false;
  rowUnSelected: boolean = false;
  tempDataSource: any = [];
  display: boolean = false;
  openOverlayDialog: boolean = false;
  printItem: any;
  showPrintModifier: boolean = false;
  printFields: any = [];
  showAddMaterialsModifier: boolean = false;
  loading: boolean = false;
  get isValid() {
    return this.form?.controls[this.field.name].valid;
  }
  get inValid() {
    return this.form?.controls[this.field.name].invalid;
  }
  get isDirty() {
    return this.form?.controls[this.field.name].dirty;
  }
  get isTouched() {
    return this.form?.controls[this.field.name].touched;
  }
  get isError() {
    return Object.keys(this.form?.controls[this.field?.name]?.errors)?.length;
  }

  statuses: any = [];
  clonedTableData: { [s: string]: any } = {};

  products = [];

  matchModeOptions: any[] = matchModeOptions;
  matchModeOptionsLocal: any[] = matchModeOptionsLocal;

  @ViewChild('dt') table: Table;

  // IMAGE OPTIONS
  private readonly contextRowImage = signal('');
  private readonly contextFileName = signal('')
  imageOptions: MenuItem[] = [
    {
      label: 'Preview', icon: 'pi pi-eye', command: () => {
        this.previewRowImage();
      }
    },
    {
      label: 'Download', icon: 'pi pi-cloud-download', command: () => {
        this.downloadRowImage();
      }
    }
  ];

  private readonly messageService = inject(MessageService)

  constructor(
    public translate: TranslateService,
    private dialogService: DialogService,
    private dialogHandlerService: DialogHandlerService,
    private _decimalPipe: DecimalPipe,
  ) { }

  ngOnInit(): void {
    // console.log('TableFieldComponent', this.field);
    this.form?.get(this.formName)?.setValue(this.dataSource);
    if (this.field?.selectedRow) {
      this.selectedMainArray = this.field?.selectedRow;
    }
    if (this.field.selectedArray !== undefined && this.field.selectedCheckbox) {
      if (this.field.selectedArray.length) {
        this.selectedArray = this.field.selectedArray;
        // console.log("selected array on if", this.selectedArray)
      } else {
        // const _ = require('lodash');
        this.selectedArray = _.chain(this.field?.overlayPanelList)
          .filter((o) => _.some(this.dataSource, (i) => i.tableRowId === o.id))
          .map((o) => ({ ...o, tableRowId: o.id }))
          .value();
        // console.log("selected array on else", this.selectedArray, this.dataSource, this.field?.overlayPanelList)
      }
    }
  }

  buildOrderItemsForm(item: any): UntypedFormGroup {
    return new UntypedFormGroup(item);
  }

  onRowEditInit(item: any) {
    this.clonedTableData[item.id] = { ...item };
    // console.log("check item", this.clonedTableData, item?.id);
  }

  onRowEditSave(item: any) {
    if (item[this.dataKey]) {
      delete this.clonedTableData[item[this.dataKey]];
      // this.messageService.add({severity:'success', summary: 'Success', detail:'Product is updated'});
    }
    this.form.get(this.formName).setValue(this.dataSource);
    // console.log(this.formName)
    // this.onTableValueChangeHandler(this.dataSource, this.field)
    if (typeof this.field.onRowEditSave === 'function') {
      this.field?.onRowEditSave(this.form.value);
    }
  }

  onRowEditCancel(item: any, index: number) {
    // this.dataSource[index] = this.clonedTableData[item[this.dataKey]];
    const restoreIndex = this.dataSource.findIndex(
      (row) => row[this.dataKey] === item[this.dataKey]
    );

    if (restoreIndex !== -1) {
      this.dataSource[restoreIndex] = this.clonedTableData[item[this.dataKey]];
    }

    // IF FILTER IS USED WE NEED TO REMOVE
    if (this.table.filteredValue) {
      const filteredIndex = this.table.filteredValue.findIndex(
        (row) => row[this.dataKey] === item[this.dataKey]
      );
      if (filteredIndex !== -1) {
        this.table.filteredValue[filteredIndex] =
          this.clonedTableData[item[this.dataKey]];
      }
    }
    // IF FILTER IS USED WE NEED TO REMOVE

    delete this.clonedTableData[item[this.dataKey]];

    this.form.get(this.formName).setValue(this.dataSource);
  }

  async onRowAddInit(dt: Table) {
    if (typeof this.field?.rowAddFunction === 'function' && !this.field.rowAddFunction(this.form.value)) {
      return;
    }
    const id = this.generateUniqueId();
    console.log()
    let item: any = {};
    Object.assign(item, this.formInitialise);
    item.id = id;
    // if (item.hasOwnProperty('sequence')) {
    //   item.sequence = this.generateSerialNo(this.dataSource);
    // }
    if (!this.dataSource) {
      this.dataSource = [];
    }
    this.dataSource.push(item);
    this.clonedTableData[id] = { ...item };
    this.form.get(this.formName).setValue(this.dataSource);
    if (!this.field || typeof this.field.onRowAddCustomInit !== 'function') {
      console.warn('onRowAddCustomInit is not defined on field.');
      return; // exit early safely
    }
    const result: { form: Form; footerInitialize: any } = await this.field?.onRowAddCustomInit(this.form.value, item, this.formFields);
    if (result?.form) {
      this.form.patchValue(result?.form);
    }
    if (result?.footerInitialize) {
      this.field.footerInitialise = result?.footerInitialize;
    }
    dt.selectionChange.emit([])
  }

  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  async onRowDeleteInit(item: any, index: number, tableValue) {
    // console.log('table', this.table);
    delete this.clonedTableData[item[this.dataKey]];
    // this.dataSource.splice(index, 1);

    const removeIndex = this.dataSource.findIndex(
      (row) => row[this.dataKey] === item[this.dataKey]
    );

    if (removeIndex !== -1) {
      this.dataSource.splice(removeIndex, 1);
    }

    // IF FILTER IS USED WE NEED TO REMOVE
    if (this.table?.filteredValue) {
      const filteredIndex = this.table.filteredValue.findIndex(
        (row) => row[this.dataKey] === item[this.dataKey]
      );
      if (filteredIndex !== -1) {
        this.table.filteredValue.splice(filteredIndex, 1);
      }
    }
    // IF FILTER IS USED WE NEED TO REMOVE

    // console.log('onRowDeleteInit', item, this.dataSource);

    if (typeof this.field.onRowDeleteInit === 'function') {
      // if (this.field?.tableFooter) {
      const result: { form: Form; footerInitialize: any } = await this.field?.onRowDeleteInit(this.form.value, item, this.formFields);
      if (result?.form) {
        this.form.patchValue(result?.form);
      }
      if (result?.footerInitialize) {
        this.field.footerInitialise = result?.footerInitialize;
      }
      // }
    }

    this.form.get(this.formName).setValue(this.dataSource);
    // console.log('dataSource', this.form.get(this.formName).value);

    this.onTableValueChangeHandler(1, this.field, tableValue);
    if (typeof this.field.onRowEditSave === 'function') {
      this.field?.onRowEditSave(this.form.value);
    }
  }

  getDropDownText(itemId: string, fieldOptions: any) {
    let value = itemId;
    // console.log("check dropdown Text", fieldOptions?.options, fieldOptions?.optionValue, itemId)
    // console.log("filter value", fieldOptions?.options.filter((e) => {
    // console.log("check element", e.id === itemId);
    //   e.id === itemId
    // }))
    if (fieldOptions?.options?.length) {
      const filteredValue = fieldOptions?.options.filter(
        (e: any) => e[fieldOptions?.optionValue] === itemId
      );

      value = filteredValue?.length
        ? filteredValue[0][fieldOptions?.optionLabel]
        : this.fallBackDisplayText(itemId, fieldOptions);
      // console.log("check dropdown value text", value)
    }

    return value;
  }

  fallBackDisplayText(itemId: string, fieldOptions: any) {
    let value = itemId;
    // console.log("check dropdown", value)

    if (fieldOptions?.displayOptions?.length) {
      const filteredValue = fieldOptions?.displayOptions.filter(
        (e: any) => e[fieldOptions?.optionValue] === itemId
      );
      value = filteredValue?.length
        ? filteredValue[0][fieldOptions?.optionLabel]
        : itemId;
    }

    return value;
  }

  public disableNavigation(event: any) {
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowDown' || event.key == 'ArrowUp'
      || event.key == 'Down' || event.key == 'Up' || event.key == 'Left' || event.key == 'Right') {
      event.stopPropagation();
    }
  }

  async onChangeHandler($event: any, field: any, item: any) {
    if ($event?.value && typeof field.onValueChange === 'function') {
      this.clonedTableData[item.id] = await field?.onValueChange(
        $event?.value,
        item,
        this.form.value,
        this.formFields
      );
      Object.assign(
        this.dataSource.filter((e) => e.id === item.id)[0],
        this.clonedTableData[item.id]
      );
    }
    if ($event?.value && typeof field.getTableRowID === 'function') {
      this.field?.getTableRowID(item);
    }

    // if (typeof field.onValueChangeUpdateTable === 'function') {
    //   const result: { form: Form; footerInitialize: any } = await field?.onValueChangeUpdateTable(this.form.value);
    //   if ('form' in result) {
    //     this.form.patchValue(result?.form);
    //   }
    //   if ('footerInitialize' in result) {
    //     this.field.footerInitialise = result?.footerInitialize;
    //   }
    //   // if ('tableValue' in result) {
    //   //   this.clonedTableData[tableValue?.id] = result?.tableValue;
    //   //   Object.assign(
    //   //     this.dataSource.filter((e) => e.id === tableValue?.id)[0],
    //   //     this.clonedTableData[tableValue?.id]
    //   //   );
    //   // }
    // }


    if (typeof field.updateTableFooter === 'function') {
      const result: { form: Form; footerInitialize: any } = await field?.updateTableFooter(this.form.value);
      if ('form' in result) {
        this.form.patchValue(result?.form);
      }
      if ('footerInitialize' in result) {
        this.field.footerInitialise = result?.footerInitialize;
      }
    }
  }

  async onValueChangeHandler($event: any, field: any, item: any) {
    // console.log("check item", item);
    if (field?.type === 'number') {
      // extra added part for handling the 0 and negative zero case in input number
      // If user is typing negative zero
      const rawInput = $event.originalEvent?.target?.value;
      if (rawInput === '-0' || rawInput === '-0.') {
        item._isNegativeZeroTyping = true;
        return;
      }

      let value = $event.value;

      // Restore negative if needed
      if (item._isNegativeZeroTyping && value === 0) {
        return; // wait until user completes typing
      }

      item._isNegativeZeroTyping = false;

      // if (value === null) return;    //no need as of now
    }

    if ($event && typeof field.onValueChange === 'function') {
      this.clonedTableData[item.id] = await field?.onValueChange(
        $event,
        item,
        this.form.value,
        this.formFields,
        field
      );
      Object.assign(
        this.dataSource.filter((e) => e.id === item.id)[0],
        this.clonedTableData[item.id]
      );

      // if (this.field?.tableFooter) {
      if (typeof field.updateTableFooter === 'function') {
        const result: { form: Form; footerInitialize: any } = await field?.updateTableFooter(this.form.value);
        if ('form' in result) {
          this.form.patchValue(result?.form);
        }
        if ('footerInitialize' in result) {
          this.field.footerInitialise = result?.footerInitialize;
        }
      }
      // }
    }
    // Plain cell edits (no custom field.onValueChange, e.g. a simple editable
    // text column) still need to reach the reactive form — every other table
    // mutation here (add/delete row, select-all) syncs via this same call,
    // but this handler previously only did so inside the block above.
    this.form?.get(this.formName)?.setValue(this.dataSource);
  }

  onBlurNumber($event: any, field: any, item: any) {
    if ($event && typeof field.onBlurNumber === 'function') {
      this.clonedTableData[item.id] = field?.onBlurNumber(
        $event,
        item,
        this.form.value,
        this.formFields,
        field
      );
      Object.assign(
        this.dataSource.filter((e) => e.id === item.id)[0],
        this.clonedTableData[item.id]
      );

      if (this.field?.tableFooter) {
        if (typeof field.updateTableFooter === 'function') {
          const result: { form: Form; footerInitialize: any } =
            field?.updateTableFooter(this.form.value);
          if (result?.form) {
            this.form.patchValue(result?.form);
          }
          this.field.footerInitialise = result?.footerInitialize;
        }
      }
    }
  }

  onTableValueChangeHandler($event: any, field: any, item) {
    // console.log("field in table",field,item,$event)
    if ($event && typeof field.onValueChange === 'function') {
      const value = this.field?.onValueChange($event, item, this.form.value);
      if (value) {
        this.form.patchValue(value);
      }
    }
  }

  showDialog(item: any) {
    this.display = true;
    this.field?.getTableRowID(item);
  }

  onView(item, index, tableValue) {
    this.field?.viewData(item, index, tableValue, this.form.value, this.dialogHandlerService);
  }

  generateSerialNo(dataSource) {
    return dataSource.length + 1;
  }

  onCloseOverlayPanel(event, op) {
    if (this.field.selectedArray !== undefined && this.field.selectedCheckbox) {
      this.selectedArray = this.selectedArray.filter((o) =>
        this.dataSource.some((i) => i.tableRowId === o.tableRowId)
      );
      this.tempDataSource = [];
      this.tempArray = [];
      this.ngOnInit();
    }
  }

  onRowSelect(event: any) {
    // event.data.tableRowId = event.data.id
    this.tempArray.push(event.data);
    this.tempDataSource = this.dataSource.filter((o) =>
      this.selectedArray.some((i) => i.tableRowId !== o.tableRowId)
    );
    // this.dataSource =
    this.rowSelected = true;
  }

  onRowUnselect(event: any) {
    this.tempArray = this.tempArray.filter((e) => e.id !== event.data.id);
    this.rowUnSelected = true;
    this.tempDataSource = this.dataSource.filter((o) =>
      this.selectedArray.some((i) => i.tableRowId === o.tableRowId)
    );
    // this.dataSource =
  }

  getOverlayPanel(event: any) {
    if (this.field?.selectedCheckbox === true) {
      this.dataSource = this.tempDataSource;
      this.form.get(this.formName).setValue(this.dataSource);
    } else {
      this.tempArray = this.selectedArray;
    }
    if (typeof this.field.getOverlayPanel === 'function') {
      this.field?.getOverlayPanel(
        this.tempArray,
        this.form.value,
        this.selectedArray
      );
      this.filtering = 'none';
    }
  }

  getSelectedArray(event: any) {
    if (typeof this.field.getSelectedArray === 'function') {
      this.field?.getOverlayPanel(
        this.selectedMainArray,
        this.form.value,
        this.formInitialise
      );
    }
  }

  onSelectAllData(event) {
    // console.log("on select all data", event, event.data)
    this.form.get(this.formName).setValue(this.dataSource);
    // this.selectedArray=this.field.overlayPanelList;
    this.tempArray = this.selectedArray;
  }

  globalSearch(event: any, tb: any) {
    return tb.filterGlobal(event.target.value, 'contains');
  }

  showTableCaptionDialog(event: any, dt) {
    // this.tableCaptionDialogFlag = true;
    // this.onMainTableRowSelect(this.selectedMainArray);
    this.loading = true;
    this.dialogService
      .open(TableDialogComponent, {
        header: this.field?.tableCaptionDialogButtonLabel,
        height: this.field?.field?.height ?? '50rem',
        width: this.field?.field?.width ?? '50rem',
        showHeader: true,
        closable: true,
        maximizable: true,
        data: { ...this.field?.field, tableDataSource: this.dataSource || [] },
      })
      .onClose.subscribe(async (res) => {
        if (res?.tempArray?.length) {
          const responseFromActual = await this.field?.field?.updateRows(res?.tempArray, this.formFields, this.dataSource, this.form.value);
          if (responseFromActual) {
            const updatedResponse = responseFromActual.map((ele) => ({
              ...ele,
              id: this.generateUniqueId(),
            }));
            this.dataSource.push(...updatedResponse);
            this.form.get(this.field?.field?.tableName).patchValue(this.dataSource);
            dt.selectionChange.emit([])
            this.setFooterValues();
            if (typeof (this.field?.updatedRows) === 'function') {
              const result: ReturnConfig = await this.field?.updatedRows({
                formValue: this.form.value,
                field: this.field,
                formFields: this.formFields,
                form: this.form,
              });
              if (result) {
                if ('form' in result) {
                  this.updateFormValue(result?.form);
                }
                if ('footerInitialize' in result) {
                  this.field.footerInitialise = result?.footerInitialize;
                }
              }
            }
          }
        }
        if (res?.removedArray?.length) {
          const removedIds = new Set(res.removedArray.map(item => item.id));
          this.dataSource = this.dataSource.filter(item => !removedIds.has(item.id));
          this.form.get(this.field?.field?.tableName).patchValue(this.dataSource);
          this.setFooterValues();
        }
        this.loading = false;
      });
  }

  handleTableCaptionDialog(event: any) {
    if (typeof this.field.onCloseTableCaptionDialog === 'function') {
      this.field.onCloseTableCaptionDialog(event, this.form.value);
      return event;
    }
  }

  savetableCaptionDialogData(event: any) {
    if (typeof this.field.savetableCaptionDialogData === 'function') {
      this.field?.savetableCaptionDialogData(
        event,
        this.form.value,
        this.selectedMainArray
      );
      this.tableCaptionDialogFlag = false;
    }
  }

  export(dt: any) {
    let element = document.getElementById('dt');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    // ws['!cols'][0] = { hidden: true };
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(
      wb,
      this.field.exportTableLabel
        ? this.field.exportTableLabel
        : 'ExportedData.xlsx'
    );
  }

  onMainTableRowSelect(event) {
    // console.log("event on select", event);
    if (typeof this.field.onMainTableRowSelect === 'function') {
      this.field?.onMainTableRowSelect(event.data, this.form.value);
    }
  }

  getPrintFields() {
    // console.log(this.printFields)
    return this.printFields;
  }

  rowPrint(item) {
    this.printItem = item;
    this.showPrintModifier = true;
    this.generateFields();
  }

  generateFields() {
    this.printFields = [
      {
        type: this.field.printForm,
        value: this.printItem,
      },
    ];
  }

  ngOnDestroy(): void {
    // console.log('Table Field Destroyed');
    this.selectedArray = [];
  }

  showDynamicDialog(event) {
    if (typeof this.field.onClickDynamicButton == 'function') {
      const value = this.field?.onClickDynamicButton(event, this.dataSource, this.dialogHandlerService, this.selectedMainArray, { field: this.field, formValue: this.form.value, form: this.form });
      if (value) {
        this.form.patchValue(value);
      }
    }
  }

  setFooterValues() {
    if (this.field?.tableFooter) {
      if (typeof this.field.updateTableFooter === 'function') {
        const result: { form: Form; footerInitialize: any } =
          this.field?.updateTableFooter(this.form.value);
        if (result?.form) {
          this.form.patchValue(result?.form);
        }
        this.field.footerInitialise = result?.footerInitialize;
      }
    }
  }

  // IMAGE UPLOAD
  previewRowImage() {
    const fileName = this.contextFileName();
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const fileUrl = this.contextRowImage();

    const newTab = window.open('', '_blank', 'width=500,height=400');

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      newTab.document.body.innerHTML = `<img src="${fileUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: auto;">`;
    } else if (fileExtension === 'pdf') {
      newTab.document.body.innerHTML = `<embed src="${fileUrl}" width="100%" height="100%" type="application/pdf">`;
    } else {
      newTab.document.body.innerHTML = `<p>Preview is not available for this file type: ${fileExtension.toUpperCase()}</p>`;
    }
  }

  downloadRowImage() {
    const link = document.createElement('a');
    link.href = this.contextRowImage();
    link.download = this.contextFileName() || 'image.jpg';
    link.target = '_blank';
    link.click();
  }

  onOpenImageContext(event, field: any, item: any) {
    const fieldName = field?.name;
    const value = item[fieldName];
    let fileName = this.getFileName(field, item);
    // console.log("value", value);
    if (value instanceof Object) {
      this.contextRowImage.set(value['file']);
      this.contextFileName.set(fileName);
    } else {
      this.contextRowImage.set(value);
      this.contextFileName.set(fileName);
    }
  }

  onHideImageContext() {
    this.contextRowImage.set('');
  }

  previewImage(value: any) {
    // console.log("value",value)
    if (value instanceof Object) {
      return value['file'];
    } else {
      return value;
    }
  }

  async onUpload(fileEvent, item, field) {
    const file = fileEvent?.currentFiles[0];
    if (file) {
      const reader = new FileReader();
      const readFile = new Promise((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          reject(reader.error);
        };
      });
      reader.readAsDataURL(file);
      try {
        const base64String = await readFile;
        const fileObject = {
          id: `${this.generateUniqueId()}+A`,
          file: base64String,
          file_name: file.name,
          type: file.type
        }
        item[field?.name] = fileObject;
        return item;
      } catch (error) {
        console.error("Error reading file:", error);
        return null;
      }
    } else {
      console.error("No file uploaded");
      return null;
    }
  }

  // CHECK IMAGE OR NOT NOT
  checkIsImage(field: any, item: any) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const imageExtensionsWithoutDot = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

    const fieldName = field?.name;
    const value = item[fieldName];

    if (!value) return true;

    if (value instanceof Object) {
      return imageExtensionsWithoutDot.some(ext => value?.type?.toLowerCase().includes(ext));
    }

    return value.startsWith("http") && imageExtensions.some(ext => value.endsWith(ext));
  }

  // TO GET FILE NAME
  getFileName(field: any, item: any) {
    const fieldName = field?.name;
    const value = item[fieldName];

    if (!value) return 'Upload a file';

    if (value instanceof Object) {
      return value?.file_name || 'Unknown file name';
    }

    if (value.startsWith("http")) {
      const url = new URL(value);
      const pathSegment = field?.path || '/media/images/';

      const fileName = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
      const updatedFileName = fileName.includes(pathSegment) ? fileName.slice(pathSegment.length) : fileName;
      return updatedFileName
    }
    return 'Upload a file';
  }
  // IMAGE UPLOAD

  onSelectionChange(event) {
    if (typeof this.field.onSelectionChange === 'function') {
      // console.log("comes inisde")
      this.field?.onSelectionChange(event, this.dataSource);
    }
  }

  // ON CLICK ON INPUT BUTTON
  async onClickInputButton(event: any, tableItem: any, inputField: any) {
    // console.log("onClickInputButton", event, tableItem, inputField);
    if (inputField?.show) {
      if (typeof (inputField?.onClickInputButton) === 'function') {
        await inputField?.onClickInputButton(event, this.form.value, tableItem);
      }
    }
  }

  updateFormValue(formValue: any) {
    this.form.patchValue(formValue);
  }

  // ON CLICK ACTION BUTTON
  async onClickActionButton(tableValue: any, dataSource: any, index: any, field: any, action: any) {
    // console.log('onClickActionButton', tableValue, dataSource, index, action);
    if (typeof (action?.onClick) === 'function') {
      const result: { form: any; footerInitialize: any } = await action?.onClick(tableValue, dataSource, index, this.form.value, field, this.formFields, this.dialogHandlerService);
      if (result) {
        if ('form' in result) {
          this.updateFormValue(result?.form);
        }
        if ('footerInitialize' in result) {
          this.field.footerInitialise = result?.footerInitialize;
        }
        if ('tableValue' in result) {
          this.clonedTableData[tableValue?.id] = result?.tableValue;
          Object.assign(
            this.dataSource.filter((e) => e.id === tableValue?.id)[0],
            this.clonedTableData[tableValue?.id]
          );
        }
      }
    }
    // ON INPUT BUTTONS
    if (typeof (action?.onInput) === 'function') {
      const result: ReturnConfig = await action?.onInput({
        event: event,
        formValue: this.form.value,
        form: this.form,
        formFields: this.formFields,
        field: this.field,
        action: action,
        dataSource: this.dataSource,
        selectedMainArray: this.selectedMainArray,
        dialogHandlerService: this.dialogHandlerService,
        tableValue: tableValue,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
      if ('footerInitialize' in result) {
        this.field.footerInitialise = result?.footerInitialize;
      }
      if ('tableValue' in result) {
        this.clonedTableData[tableValue?.id] = result?.tableValue;
        Object.assign(
          this.dataSource.filter((e) => e.id === tableValue?.id)[0],
          this.clonedTableData[tableValue?.id]
        );
      }
    }
  }

  disableActionButton(tableValue: any, val: Function) {
    // console.log('disableActionButton', tableValue, val);
    return val(tableValue, this.form.value);
  }

  captionAction(val: Function) {
    // console.log('disableActionButton', tableValue, val);
    return val(this.form.value, this.selectedMainArray);
  }

  // ON CLICK ON CAPTION BUTTON
  async onClickCaptionButton(event, action: ButtonConfig) {
    // console.log('selectedMainArray', this.selectedMainArray);
    // DELETE MULTIPLE ROWS
    if (action?.deleteMultiple && this.selectedMainArray?.length) {
      this.dataSource = (this.dataSource ?? []).filter((clone: any) => {
        return !this.selectedMainArray.some((row: any) => row?.id === clone?.id);
      });
      this.form.get(this.formName).setValue(this.dataSource);
      this.field.dataSource = this.dataSource;
      // console.log('dataSource', this.dataSource, this.form.get(this.formName).value, this.field?.dataSource);
      this.selectedMainArray = [];
    }

    if (action?.clearFilters) {
      this.table.clearFilterValues();
      this.table.reset();
    }

    // ON CLICK BUTTONS
    if (typeof action.onClick == 'function') {
      const result = await action?.onClick(this.form.value, this.field, this.formFields, { event: event, dataSource: this.dataSource, dialogHandlerService: this.dialogHandlerService, selectedMainArray: this.selectedMainArray });
      // console.log('onClickCaptionButton', result);
      if (result) {
        if ('form' in result) {
          this.updateFormValue(result?.form);
        }
        if ('footerInitialize' in result) {
          this.field.footerInitialise = result?.footerInitialize;
        }
      }
    }

    // ON INPUT BUTTONS
    if (typeof (action?.onInput) === 'function') {
      const result: ReturnConfig = await action?.onInput({
        event: event,
        formValue: this.form.value,
        form: this.form,
        formFields: this.formFields,
        field: this.field,
        action: action,
        dataSource: this.dataSource,
        selectedMainArray: this.selectedMainArray,
        dialogHandlerService: this.dialogHandlerService,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
      if ('footerInitialize' in result) {
        this.field.footerInitialise = result?.footerInitialize;
      }
      if ('selectedArray' in result) {
        this.selectedMainArray = result?.selectedArray;
      }
    }
  }

  // ON CLICK ON INPUT
  async clickInput(event: any, tableItem: any, inputField: any) {
    // console.log("clickInput", event, tableItem, inputField);
    if (typeof (inputField?.onClickInput) === 'function') {
      const result: { form: any; footerInitialize: any; tableValue: any } = await inputField?.onClickInput(event, tableItem, this.form.value);
      if (result) {
        if ('form' in result) {
          this.updateFormValue(result?.form);
        }
        if ('footerInitialize' in result) {
          this.field.footerInitialise = result?.footerInitialize;
        }
        if ('tableValue' in result) {
          // console.log('tableValue', result, tableItem);
          this.clonedTableData[tableItem?.id] = result?.tableValue;
          Object.assign(
            this.dataSource.filter((e) => e.id === tableItem?.id)[0],
            this.clonedTableData[tableItem?.id]
          );
        }
      }
    }

    // ON INPUT BUTTONS
    if (typeof (inputField?.onInput) === 'function') {
      const result: ReturnConfig = await inputField?.onInput({
        event: event,
        formValue: this.form.value,
        form: this.form,
        formFields: this.formFields,
        field: this.field,
        tableValue: tableItem,
        dataSource: this.dataSource,
        selectedMainArray: this.selectedMainArray,
        dialogHandlerService: this.dialogHandlerService,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
      if ('footerInitialize' in result) {
        this.field.footerInitialise = result?.footerInitialize;
      }
      if ('tableValue' in result) {
        // console.log('tableValue', result, tableItem);
        this.clonedTableData[tableItem?.id] = result?.tableValue;
        Object.assign(
          this.dataSource.filter((e) => e.id === tableItem?.id)[0],
          this.clonedTableData[tableItem?.id]
        );
      }
    }
  }

  onSelectDate(date: Date, item: any, field: any) {
    // const momenDate = moment(date).format(this.field?.format??'DD-MM-YYYY HH:mm')
    // console.log("moment...",date);
    // item[field?.name] = momenDate;
    if (this.isValidDate(date, field)) {
      const momenDate = moment(date, field?.format ?? 'DD-MM-YYYY', true);
      if (momenDate.isValid()) {
        item[field?.name] = momenDate.format(field?.format ?? 'DD-MM-YYYY');
        // console.log("item[field?.name] ", item[field?.name], field?.format)
      } else {
        // console.log("Invalid date format");
      }
    } else {
      // console.log("Invalid date");
    }
  }

  onInputDate(event: any, item: any, field: any) {
    //  console.log("event", event)
    const inputDate = event.target.value;
    if (this.isValidDate(inputDate, field)) {
      const momenDate = moment(inputDate, field?.format ?? 'DD-MM-YYYY', true);
      if (momenDate.isValid()) {
        item[field?.name] = momenDate.format(field?.format ?? 'DD-MM-YYYY');
      } else {
        // console.log("Invalid date format");
      }
    } else {
      // console.log("Invalid date");
    }
  }

  isValidDate(dateString: any, field: any) {
    const momenDate = moment(dateString, field?.format ?? 'DD-MM-YYYY', true);
    return momenDate.isValid();
  }

  formatDate(item: any, field: any) {
    return item[field?.name] ? moment(item[field?.name]).format(field?.format) : "";
  }

  formatDateTime(item: any, field: any) {
    // console.log('Current date-time value:', item[field.name]);
    if (item[field?.name]) {
      const date = moment(item[field?.name], field?.format, true);
      return date.isValid() ? date.format(field?.format) : item[field?.name];
    }
    return null;
  }
  // DATE TIME 

  displayNumber(num, format: string, locale: string, field: any) {
    if (num && field?.useGrouping !== false) {
      const digitsInfo =
        format || `1.${field?.maxFractionDigits ?? 2}-${field?.maxFractionDigits ?? 2}`;

      return this._decimalPipe.transform(
        num,
        format || digitsInfo,
        locale || numberLocale(),
      );
    }
    return num;
  }

  displayFooterNumber(item) {
    // console.log('displayFooterNumber', num, typeof num);
    //   if (!Number.isFinite(num)) {
    //   return '0'; // or '--'
    // }
    const name = item?.name;
    const format = item?.format;
    const locale = item?.locale;

    if (name !== null && name !== undefined && String(name).trim() !== '' && !isNaN(Number(name))) {
      if (item?.customDigits) {
        const digitsInfo =
          format || `1.${item?.customDigits ?? 2}-${item?.customDigits ?? 2}`;
        return this._decimalPipe.transform(
          name,
          format || digitsInfo,
          locale || numberLocale(),
        );
      }
      const digitsInfo =
        format || `1.${decimalDigits() ?? 2}-${decimalDigits() ?? 2}`;
      return this._decimalPipe.transform(
        name,
        format || digitsInfo,
        locale || numberLocale(),
      );
    }
    return name;
  }

  isNAN(number: any) {
    return isNaN(Number(number));
  }

  // INPUT SWITCH
  async onChangeInputSwitch(event: any, field: any, tableValue: any) {
    // console.log('onChangeInputSwitch', event, tableValue);
    if (typeof (field?.onInput) === 'function') {
      const result: ReturnConfig = await field?.onInput({
        event: event,
        formValue: this.form.value,
        form: this.form,
        formFields: this.formFields,
        field: this.field,
        dataSource: this.dataSource,
        selectedMainArray: this.selectedMainArray,
        dialogHandlerService: this.dialogHandlerService,
        tableValue: tableValue,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
      if ('footerInitialize' in result) {
        this.field.footerInitialise = result?.footerInitialize;
      }
      if ('tableValue' in result) {
        this.clonedTableData[tableValue?.id] = result?.tableValue;
        Object.assign(
          this.dataSource.filter((e) => e.id === tableValue?.id)[0],
          this.clonedTableData[tableValue?.id]
        );
      }
    }
  }

  isTableDisabled() {
    if (typeof this.field?.disableTable === 'function') {
      // console.log("disable table", this.field?.disableTable(this.form.value))
      return this.field?.disableTable(this.form.value);
    }
  }
}
