import { Component, inject, signal } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ApiService } from 'src/app/core/services/api.service';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TimeSheetDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/attendance.enum';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';

@Component({
  selector: 'sanadi-time-sheet-history',
  standalone: true,
  imports: [TableModule],
  templateUrl: './time-sheet-history.component.html',
  styleUrl: './time-sheet-history.component.scss'
})
export class TimeSheetHistoryComponent {
  timeSheetHistoryDetails = signal([])
  loading: boolean = false;
  totalTimeSheetHistoryRecords: number = 0;
  page: number = 1;
  private apiService = inject(ApiService)
 dialogRef = inject(DynamicDialogRef)
  getTableSchema() {
    return [
      {
        label: 'History Date',
        field: 'history_date',
      },
      {
        label: 'User Modified',
        field: 'history_user',
      },
      {
        label: 'History Type',
        field: 'history_type'
      },
      {
        label: 'Employee Name',
        field: TimeSheetDetailsEnum.employeeName,
      },
      {
        label: 'Date',
        field: TimeSheetDetailsEnum.conDate,
      },
      {
        label: 'In Time',
        field: TimeSheetDetailsEnum.loginTime,
      },
      {
        label: 'Out Time',
        field: TimeSheetDetailsEnum.logoutTime,
      },
      {
        label: 'Work Hrs',
        field: TimeSheetDetailsEnum.conTotalHours
      },
      {
        label: 'Base Hrs',
        field: TimeSheetDetailsEnum.conWorkingTime
      },
      {
        label: 'Status',
        field: TimeSheetDetailsEnum.status
      },
      {
        label: 'OT 1',
        field: TimeSheetDetailsEnum.conOtHrs
      },
      {
        label: 'OT 2',
        field: TimeSheetDetailsEnum.comOt2Hrs
      },
      {
        label: 'HOT Hrs',
        field: TimeSheetDetailsEnum.conHotHrs
      },
      {
        label: 'Less Hrs',
        field: TimeSheetDetailsEnum.conLessHrs
      },
      {
        label: 'Extra Hrs',
        field: TimeSheetDetailsEnum.extraHrs
      }
    ]
  }

  async nextPage(event: TableLazyLoadEvent) {
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
      const mergedParams = Object.assign({}, ...filteredColumns);
      this.getTimeSheetDetailsByParams(this.handleParams({ ...mergedParams, page: this.page, page_size: event?.rows }));
    }
    else {
      const localParams = event.globalFilter
        ? this.handleParams({ page: this.page, search: event.globalFilter, page_size: event?.rows })
        : this.handleParams({ page: this.page, page_size: event?.rows });
      this.getTimeSheetDetailsByParams({ ...localParams });
    }
  }


  getTimeSheetDetailsByParams(params) {
    this.apiService.get(`${HrmServiceUrlConstants.HISTORICAL_ATTENDANCE_DETAILS_API}`, params).subscribe((response: any) => {
      if (response) {
        this.timeSheetHistoryDetails.set(response?.results);
        this.totalTimeSheetHistoryRecords = response?.count;
        this.loading = false;
      }
    })
  }

  handleParams(params) {

    return params
  }


}
