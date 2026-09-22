import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { DynamicTableModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import * as _ from 'lodash';

@Component({
  selector: 'sanadi-multi-select-table',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, TableModule, FormsModule,
    TranslateModule, CommonModule],
  templateUrl: './multi-select-table.component.html',
  styleUrl: './multi-select-table.component.scss',
  providers: [DecimalPipe]
})
export class MultiSelectTableComponent {
  private translate = inject(TranslateService);
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  @ViewChild('tb') tb: Table;
  @ViewChild('addedTb') addedTb: Table;
  field: DynamicTableModel;
  selectedArray = [];
  loading: boolean;
  totalRecords = 10;
  matchModeOption: any = [];
  showAddButton: boolean = true;
  disableCheckBoxHeader: boolean;
  dataSource = []
  dataSourceCopy = []
  private readonly apiService = inject(ApiService)
  private _decimalPipe = inject(DecimalPipe);
  tempArray: any[] = [];
  page = 1;
  filterQueryParams: any;
  searchText: any = '';
  idsList = [];
  filteredColumns: Array<any> = [];
  dataKey?: string = 'id';

  // ADDED LIST
  addedList: any[] = [];
  showListTable: boolean = true;
  addedLoading: boolean = false;
  addedTotalRecords = 10;

  ngOnInit(): void {
    // console.log("config data", this.config);
    this.field = this.config?.data?.data?.field;
    this.dataSource = this.config?.data?.data?.tableDataSource;
    this.dataSourceCopy = Array.from(this.config?.data?.data?.tableDataSource);
    this.idsList = this.field?.idsList;

    if (this.field?.dataKey) {
      this.dataKey = this.field?.dataKey;
    }

    this.matchModeOption = [
      // { label: 'Starts With', value: FilterOptions.istartsWith },
      // { label: 'Ends With', value: FilterOptions.iendsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      // { label: 'Equal', value: FilterOptions.iExact },
    ];

    if (this.field?.lazy) {
      this.geAddedtList();
    }
  }

  onSelectAllData(event) {
    // console.log("on select all or deselect", event, this.selectedArray);
    if (event?.checked) {
      const newElements = this.selectedArray.filter(
        (ele) => !this.addedList.some(item => item[this.dataKey] === ele[this.dataKey]) &&
          !this.dataSourceCopy.some(item => item[this.dataKey] === ele[this.dataKey])
      );

      this.tempArray.push(...newElements);
      this.dataSourceCopy.push(...newElements);
      this.addedList.push(...newElements);
    } else {
      this.tempArray = this.tempArray.filter((ele: any) => !this.field?.list.some((main) => main[this.dataKey] === ele[this.dataKey]));
      this.dataSourceCopy = this.dataSourceCopy.filter((ele: any) => !this.field?.list.some((main) => main[this.dataKey] === ele[this.dataKey]));
      this.addedList = this.addedList.filter((ele: any) => !this.field?.list.some((main) => main[this.dataKey] === ele[this.dataKey]));
    }
    // console.log('RTy', this.tempArray, this.dataSourceCopy);
  }

  onRowSelect(event: any) {
    this.tempArray.push(event?.data);
    this.dataSourceCopy.push(event?.data);
    this.addedList.push(event?.data);
    // console.log('onRowSelect', this.selectedArray, this.tempArray);
  }

  onRowUnselect(event: any) {
    this.tempArray = this.tempArray.filter((e) => e[this.dataKey] !== event.data[this.dataKey]);
    this.dataSourceCopy = this.dataSourceCopy.filter((e) => e.tableRowId !== event.data[this.dataKey]);
    this.addedList = this.addedList.filter((e) => e[this.dataKey] !== event.data[this.dataKey]);
    // console.log('onRowUnselect', this.selectedArray, this.tempArray);
  }

  isCheckBoxDisabled() {
    return false;
  }

  getOverlayPanel(event) {
    const removedArray = this.dataSource.filter(item =>
      !this.dataSourceCopy.some(copyItem => copyItem[this.dataKey] === item[this.dataKey])
    );
    const result = { tempArray: this.tempArray, removedArray: removedArray, addedList: this.addedList };
    this.ref.close(result)
  }

  async nextPage(event: TableLazyLoadEvent, queryParams) {
    // console.log("event on next page", event);
    this.loading = true;
    this.page = event.first / event.rows + 1;
    this.filteredColumns = [];
    if (event.filters) {
      // Iterate through each filter and add it to the filteredColumns array.
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray;
        if (filter) {
          this.handleFilterColumns(columnName, filter);
        }
      }
    }
    if (this.filteredColumns.length > 0) {
      this.filteredColumns.push(queryParams)
      const mergedParams = Object.assign({}, ...this.filteredColumns);
      this.filterQueryParams = mergedParams;
      this.getDataByAPI({ ...mergedParams, page: this.page });
    }
    else {
      // if (typeof this.searchText === 'undefined' || this.searchText == '') {
      //   this.filterQueryParams = queryParams;
      //   this.getDataByAPI({ ...queryParams, page: this.page });
      // } else {
      //   this.getDataByAPI({ ...queryParams, search: this.searchText, page: this.page });
      // }
      const localParams = event.globalFilter
        ? { page: this.page, search: event.globalFilter }
        : { page: this.page };
      this.getDataByAPI({ ...queryParams, ...localParams });
    }
  }

  handleFilterColumns(columnName, filterArray) {
    if (filterArray?.length) {
      filterArray.forEach(filter => {
        if (filter.value) {
          if (filter.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter.matchMode?.toLowerCase()}`;
            this.filteredColumns.push({
              [modifiedColumnName]: moment(filter.value).format('DD-MM-YYYY'),
            });
          } else {
            const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
            this.filteredColumns.push({ [key]: filter.value });
            // this.filteredColumns.push({
            //   [`${columnName}${filter.matchMode?.toLowerCase()?`__${filter.matchMode?.toLowerCase()}`:''}`]: filter.value,
            // });
          }
        }
      });
    }
  }

  globalSearch(event: any, tb) {
    if (this.field.lazy) {
      this.searchText = event;
      tb.filterGlobal(event);
      this.page = 1;
      // this.getDataByAPI({ ...this.field?.queryParams, search: this.searchText, page: this.page });
    }
    else {
      return this.tb.filterGlobal(event, 'contains');
    }
  }

  async getDataByAPI(queryParams) {
    // console.log('getDataByAPI', queryParams);
    this.apiService.get(this.field.url, queryParams)
      .subscribe(async (response: any) => {
        if (response?.results) {
          this.loading = false;
          this.totalRecords = response?.count;
          if (typeof this.field?.bindOption === 'function') {
            this.field.list = await this.field.bindOption(response);
          } else {
            this.field.list = response?.results;
          }
          if (this.field?.needSelectedArray) {
            this.selectedArray = _.chain(this.field?.list)
              .filter((o) => _.some(this.addedList, (i) => i[this.dataKey] === o[this.dataKey])).value();
            // console.log('selectedArray', this.selectedArray, this.addedList);
          }
        }
      });
  }

  clearFilters(table: Table) {
    table.clearFilterValues();
    this.filteredColumns = [];
    this.searchText = "";
    this.page = 1;
    table.reset();
  }

  // ADDED LIST TABLE
  toggleViewAddedList(event: any) {
    this.showListTable = !this.showListTable;
  }

  async geAddedtList() {
    this.addedList = [];
    this.addedLoading = true;
    if (this.idsList?.length) {
      const queryParams = {};
      queryParams[`${this.dataKey}__in`] = (this.idsList || []).toString();
      const addedList = await this.apiService.getData(this.field.url, queryParams);
      this.addedList = addedList?.results || [];
      this.addedTotalRecords = addedList?.count;
      this.selectedArray = this.addedList;
    }
    this.addedLoading = false;
  }

  // DELETE ADDED LIST
  onDeleteAddedList(data: any) {
    this.addedList = this.addedList.filter((ele: any) => ele[this.dataKey] !== data[this.dataKey]);
    this.selectedArray = this.selectedArray.filter((e) => e[this.dataKey] !== data[this.dataKey]);
    // console.log('onDeleteAddedList', data, this.addedList);
  }

  globalSearchAddedList(event: any) {
    return this.addedTb.filterGlobal(event, 'contains');
  }

  formatDate(item: any, row: any) {
      return item[row?.key] ? moment(item[row?.key]).format(row?.format) : "";
    }
  
  displayNumber(num, format: string, locale: string) {
    if (format) {
      return this._decimalPipe.transform(num, format, locale || 'en-US');
    }
    return num;
  }
}
