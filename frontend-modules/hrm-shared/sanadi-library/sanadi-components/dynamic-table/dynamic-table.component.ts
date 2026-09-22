import { Component, inject, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import * as _ from 'lodash';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DynamicTableModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import * as moment from 'moment';

@Component({
  selector: 'sanadi-dynamic-table',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, TableModule, FormsModule,
    TranslateModule, CommonModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
  providers: [DecimalPipe]
})
export class DynamicTableComponent {
  private translate = inject(TranslateService);
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private _decimalPipe = inject(DecimalPipe);

  @ViewChild('tb') tb: Table;
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
  tempArray: any[] = [];
  page = 1;
  filterQueryParams: any;
  searchText: any = '';
  idsList = [];
  filteredColumns: Array<any> = [];

  ngOnInit(): void {
    // console.log("config data", this.config);
    this.field = this.config?.data?.data?.field;
    this.dataSource = this.config?.data?.data?.tableDataSource;
    this.dataSourceCopy = Array.from(this.config?.data?.data?.tableDataSource);
    if (this.field?.selectedArray) {
      this.selectedArray = this.field?.selectedArray || [];
      this.tempArray = this.selectedArray;
    }
    this.idsList = this.field?.idsList;
    if (this.field?.lazy) {
      this.getDataByApiInitial({ ...this.field.queryParams, page: 1 });
    }

    this.matchModeOption = [
      // { label: 'Starts With', value: FilterOptions.istartsWith },
      // { label: 'Ends With', value: FilterOptions.iendsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      // { label: 'Equal', value: FilterOptions.iExact },
    ];
  }

  onSelectAllData(event) {
    // console.log("on select all or deselect", event, this.selectedArray)
    this.selectedArray.forEach((ele) => {
      ele.tableRowId = ele?.id;
    });

    if (event?.checked) {
      const newElements = this.selectedArray.filter(
        (ele) => !this.tempArray.some(item => item.tableRowId === ele.tableRowId) &&
          !this.dataSourceCopy.some(item => item.tableRowId === ele.tableRowId)
      );

      this.tempArray.push(...newElements);
      this.dataSourceCopy.push(...newElements);
    } else {
      this.tempArray = this.tempArray.filter((ele: any) => !this.field?.list.some((main) => main.id === ele.id));
      this.dataSourceCopy = this.dataSourceCopy.filter((ele: any) => !this.field?.list.some((main) => main.id === ele.id));
    }
    // console.log('RTy', this.tempArray, this.dataSourceCopy);
  }

  onRowSelect(event: any) {
    event.data.tableRowId = event.data?.id
    this.tempArray.push(event.data);
    this.dataSourceCopy.push(event.data);
  }

  onRowUnselect(event: any) {
    this.tempArray = this.tempArray.filter((e) => e.id !== event.data.id);
    this.dataSourceCopy = this.dataSourceCopy.filter((e) => e.tableRowId !== event.data.id);
  }

  isCheckBoxDisabled() {
    return false;
  }

  getOverlayPanel(event) {
    const removedArray = this.dataSource.filter(item =>
      !this.dataSourceCopy.some(copyItem => copyItem.id === item.id)
    );
    const result = { tempArray: this.tempArray, removedArray: removedArray };
    this.ref.close(result)
  }

  async nextPage(event: TableLazyLoadEvent, queryParams) {
    // console.log("event on next page", event, this.field, this.matchModeOption)
    // this.loading = true;
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
              .filter((o) => _.some(this.dataSourceCopy, (i) => i.tableRowId === o.id))
              .map((o) => ({ ...o, tableRowId: o.id }))
              .value();
          }
          if (this.field?.directSelectedArray) {
            this.selectedArray = _.chain(this.field?.list)
              .filter((o) => _.some(this.idsList, (i) => i === o?.id)).value();
          }
        }
      });
  }

  async getDataByApiInitial(queryParams) {
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
          if (this.field?.directSelectedArray) {
            this.selectedArray = _.chain(this.field?.list)
              .filter((o) => _.some(this.idsList, (i) => i === o?.id)).value();
            this.tempArray = this.selectedArray;
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
