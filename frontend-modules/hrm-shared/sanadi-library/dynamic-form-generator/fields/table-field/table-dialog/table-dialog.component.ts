import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ApiService } from 'src/app/core/services/api.service';
import * as _ from 'lodash';
import { LazyLoadEvent } from 'primeng/api';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';

@Component({
  selector: 'sanadi-table-dialog',
  templateUrl: './table-dialog.component.html',
  styleUrl: './table-dialog.component.scss',
})
export class TableDialogComponent implements OnInit {
  private translate = inject(TranslateService);
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);


  @ViewChild('tb') tb: Table;
  field: any;
  selectedArray = [];
  loading: boolean;
  totalRecords = 10;
  matchModeOption: any = [];
  display;
  showAddButton: boolean = true;
  disableCheckBoxHeader: boolean;
  dataSource = []
  dataSourceCopy = []
  private readonly apiService = inject(ApiService)
  tempArray: any[] = [];
  page = 1;
  filterQueryParams: any;
  searchText: any = '';

  ngOnInit(): void {
    // console.log("config data", this.config.data);
    this.field = this.config.data

    this.dataSource = this.config.data?.tableDataSource;
    this.dataSourceCopy = Array.from(this.config.data?.tableDataSource);

    this.matchModeOption = [
      // { label: 'Starts With', value: FilterOptions.istartsWith },
      // { label: 'Ends With', value: FilterOptions.iendsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      // { label: 'Equal', value: FilterOptions.iExact },
    ];
  }

  onSelectAllData(event) {
    // console.log("on select all or deselect", event, this.selectedArray);
    this.selectedArray.forEach((ele) => {
      ele.tableRowId = ele?.id;
    });

    const newElements = this.selectedArray.filter(
      (ele) => !this.tempArray.some(item => item.tableRowId === ele.tableRowId) &&
        !this.dataSourceCopy.some(item => item.tableRowId === ele.tableRowId)
    );

    this.tempArray.push(...newElements);
    this.dataSourceCopy.push(...newElements);
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
    const filteredColumns = [];
    if (event.filters) {
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray[0];
        if (filter && filter.value) {
          const key = filter.matchMode ? `${columnName}__${filter.matchMode.toLowerCase()}` : columnName;
          filteredColumns.push({ [key]: filter.value });
        }
      }
    }
    if (filteredColumns.length > 0) {
      filteredColumns.push(queryParams)
      const mergedParams = Object.assign({}, ...filteredColumns);
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


  clearFilters(table: Table) {
    table.clearFilterValues();
    this.searchText = '';
    table.reset();
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

  getDataByAPI(queryParams) {
    this.apiService.get(this.field.url, queryParams)
      .subscribe((response: any) => {
        if (response?.results) {
          this.loading = false;
          this.totalRecords = response?.count;
          this.field.overlayPanelList = response?.results;
          if (this.field?.needSelectedArray) {
            this.selectedArray = _.chain(this.field?.overlayPanelList)
              .filter((o) => _.some(this.dataSourceCopy, (i) => i.tableRowId === o.id))
              .map((o) => ({ ...o, tableRowId: o.id }))
              .value();
          }
        }
      });
  }

}