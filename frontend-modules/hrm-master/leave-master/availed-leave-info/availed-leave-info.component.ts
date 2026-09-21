import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { LeaveMasterDetails } from 'src/app/core/shared/common/model/masters/leave-master.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-availed-leave-info',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './availed-leave-info.component.html',
  styleUrl: './availed-leave-info.component.scss'
})
export class AvailedLeaveInfoComponent {
  private config = inject(DynamicDialogConfig);
  private translate = inject(TranslateService);
  leaveMasterDetails: LeaveMasterDetails = this.config?.data?.data;
  availedLeaveInfoConfig = signal({
    formName: 'sales-quotation',
    pageTitle: this.translate.instant(`Availed Leave Info - ${this.leaveMasterDetails.leave_type}`),
    tableHeaders: [
      {
        label: 'from_date_TC',
        field: 'from_date',
        isFilterRequired: false,
      },
      {
        label: 'to_date_TC',
        field: 'to_date',
        isFilterRequired: false,
      },
      {
        label: 'no_of_days_TC',
        field: 'no_of_days',
        isFilterRequired: false,
      },
      {
        label: 'weekly_off_days_TC',
        field: 'weekly_off_days',
        isFilterRequired: false,
      },
      {
        label: 'holiday_days_TC',
        field: 'holiday_days',
        isFilterRequired: false,
      },
    ],
    tableBody: ['from_date', 'to_date', 'no_of_days', 'weekly_off_days', 'holiday_days'],
    editable: true,
    url: {
      get: '/master/leave-master-details/get_availed_leave_info/',
    },
    params: {
      get: { 
        leave_master_details_id : this.leaveMasterDetails.id
      }
    },
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false,
      newButton: false,
      globalSearch: false,
      clearButton: false,
    },
    dialogData: {},
    isShowDialog: true,
    customDialog: false,
    paginator: false,
  });

  salesQuotationForm = signal(null);

  ngOnInit(): void {
  }
}
