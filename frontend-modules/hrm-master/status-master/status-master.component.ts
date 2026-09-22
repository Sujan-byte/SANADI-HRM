import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-status-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './status-master.component.html',
  styleUrl: './status-master.component.scss'
})
export class StatusMasterComponent {
 private translate = inject(TranslateService);
  private readonly gradeRequiredFields = signal('id,code,status_name,description,type')
  statusMasterConfig = signal({
    formName: 'status',
    modelName: 'AttendanceStatusMaster',
    headerTitleKey: 'code',
    pageTitle: this.translate.instant('statusMaster_TC'),
    tableHeaders: [
      {
        label: 'code_TC',
        field: 'code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'status_name_TC',
        field: 'status_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
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
      {
        label: 'type_TC',
        field: 'type',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      }
      
    ],
    tableBody: ['code', 'status_name','description','type'],
    editable: true,
    params:{
      get:{required_fields:this.gradeRequiredFields()}
    },
    url: {
      post: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
      get: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
      delete: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
      put: HrmServiceUrlConstants.ATTENDANCE_STATUS_MASTER_CRUD,
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById:true,
        actionType: 'EDIT',
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'De-activate',
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
    dialogConfig: {
      height: '60%',
      width: '40%'
    },
    isShowDialog: true
  });

  statusForm = signal(null);

  private readonly statusConfig = inject(FormConfig);


  ngOnInit(): void {
    this.statusForm.set(this.statusConfig.getForm()['status-master'])
  }
}
