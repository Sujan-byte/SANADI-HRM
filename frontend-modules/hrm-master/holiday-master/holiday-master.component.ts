import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-holiday-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './holiday-master.component.html',
  styleUrl: './holiday-master.component.scss'
})
export class HolidayMasterComponent {
  private translate = inject(TranslateService);
  holidayMastersConfig = signal({
    formName: 'holiday-master',
    modelName: 'HolidayMaster',
    headerTitleKey: 'date',
    pageTitle: this.translate.instant('holidayMaster_TC'),
    tableHeaders: [
      {
        label: 'From Date',
        field: 'date',
        fieldType: 'date',
        defaultMatchMode:FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.dateIs },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },
      {
        label: 'To Date',
        field: 'to_date',
        fieldType: 'date',
        defaultMatchMode:FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.dateIs },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },
      {
        label: 'description_TC',
        field: 'description',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['date','to_date','description'],
    editable: true,
    url: {
      post: '/master/holiday-master/',
      get: '/master/holiday-master/',
      delete: '/master/holiday-master/',
      put: '/master/holiday-master/',
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        actionType: 'EDIT',
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'Delete',
      },
      {
        label: '',
        icon: 'undo',
        actionType: 'RESTORE',
        tooltip: 'Restore',
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },
    ],
    toolBarActionConfig:{
      activeButton:false,
      inActiveButton:false
    },
    dialogData: {},
    isShowDialog: true,
  });

  holidayMasterForm = signal(null);

  private readonly holidayMasterConfig = inject(FormConfig);

  ngOnInit(): void {
    this.holidayMasterForm.set(this.holidayMasterConfig.getForm()['holiday-master'])
  }
}
