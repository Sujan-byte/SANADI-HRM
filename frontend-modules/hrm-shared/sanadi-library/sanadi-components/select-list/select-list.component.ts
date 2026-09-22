import { Component, inject, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ApiService } from 'src/app/core/services/api.service';
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
  selector: 'sanadi-select-list',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, TableModule, FormsModule,
    TranslateModule, CommonModule],
  templateUrl: './select-list.component.html',
  styleUrl: './select-list.component.scss',
  providers: [DecimalPipe]
})
export class SelectListComponent {
  private translate = inject(TranslateService);
  ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);


  @ViewChild('tb') tb: Table;
  field: DynamicTableModel;
  selectedArray = [];
  loading: boolean;
  totalRecords = 10;
  matchModeOption: any = [];

  private readonly apiService = inject(ApiService);
  private _decimalPipe = inject(DecimalPipe);
  page = 1;
  filterQueryParams: any;
  searchText: any = '';

  ngOnInit(): void {
    // console.log("config data", this.config);
    this.field = this.config?.data?.data;

    this.matchModeOption = [
      // { label: 'Starts With', value: FilterOptions.istartsWith },
      // { label: 'Ends With', value: FilterOptions.iendsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      // { label: 'Equal', value: FilterOptions.iExact },
    ];

    // this.getDataByAPI(this.field?.queryParams);
  }

  onRowSelect(event: any) {
    // console.log('onRowSelect', event);
    this.ref.close(event?.data);
  }

  async nextPage(event: TableLazyLoadEvent, queryParams) {
    // console.log("event on next page", event, this.field, this.matchModeOptions);
    // this.loading = true;
    this.page = event.first / event.rows + 1;
    const filteredColumns = [];
    if (event.filters) {
      for (const [columnName, filterArray] of Object.entries(event.filters)) {
        const filter = filterArray[0];

        if (filter?.value) {
          if (filter?.value instanceof Date) {
            const modifiedColumnName = filter.matchMode === FilterOptions.dateIs ? columnName : `${columnName}__${filter?.matchMode?.toLowerCase()}`;
            filteredColumns.push({
              [modifiedColumnName]: moment(filter?.value).format('DD-MM-YYYY'),
            });
          } else {
            let key = '';
            if (filter?.matchMode == "exact") {
              key = columnName;
            } else {
              key = filter?.matchMode ? `${columnName}__${filter?.matchMode?.toLowerCase()}` : columnName;
            }
            filteredColumns.push({ [key]: filter?.value });
          }
        }
      }
    }
    if (filteredColumns?.length > 0) {
      filteredColumns.push(queryParams)
      const mergedParams = Object.assign({}, ...filteredColumns);
      this.filterQueryParams = mergedParams;
      this.getDataByAPI({ ...mergedParams, page: this.page });
    }
    else {
      const localParams = event.globalFilter
        ? { page: this.page, search: event.globalFilter }
        : { page: this.page };
      this.getDataByAPI({ ...queryParams, ...localParams });
    }
  }

  globalSearch(event: any, tb) {
    if (this.field.lazy) {
      this.searchText = event;
      tb.filterGlobal(event);
      this.page = 1;
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
        }
      });
  }

  clearFilters(table: Table) {
    table.clearFilterValues();
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
