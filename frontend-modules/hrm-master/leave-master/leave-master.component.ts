import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-leave-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './leave-master.component.html',
  styleUrl: './leave-master.component.scss'
})
export class LeaveMasterComponent {
  private translate = inject(TranslateService);
  private readonly leaveMasterRequiredFields = signal('id')
    private permissionService = inject(NgxPermissionsService);
  isSuperUser = localStorage.getItem('is_superuser') === 'true';

  leaveMastersConfig = signal({
    formName: 'leave-master',
    modelName: 'LeaveMaster',
    headerTitleKey: 'leave_type',
    hideViewButton: true,
    pageTitle: this.translate.instant('leaveMaster_TC'),
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee__employee_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'first_name_TC',
        field: 'employee__first_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'department_name_TC',
        field: 'employee__department__department_name',
        representationField: 'department_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_type_TC',
        field: 'employee__employee_type',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'reporting_TC',
        field: 'employee__reporting',
        representationField: 'reporting',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_group_TC',
        // field: 'grade__employee_group',
        field: 'employee__employee_group',
        representationField: 'employee_group',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'dob_TC',
        field: 'employee__dob',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.dateIs },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      }

    ],
    tableBody: ['employee_code', 'first_name', 'department_name', 'employee_type','reporting', 'employee_group','doj'],
    editable: true,
    params:{
      get:{required_fields:this.leaveMasterRequiredFields(),user:localStorage.getItem('user_id')}
    },
    url: {
      post: '/master/leave-master/',
      get: this.return_get_url(),
      delete: '/master/leave-master/',
      put: '/master/leave-master/',
      get_by_pk:'/master/leave-master/'
    },
    actions: [
      {
        label: '',
        icon: 'eye',
        getById:true,
        actionType: 'EDIT',
        tooltip: 'View',
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },
      // {
      //   label: '',
      //   icon: 'trash',
      //   actionType: 'DELETE',
      //   tooltip: 'De-activate',
      // },
      // {
      //   label: '',
      //   icon: 'undo',
      //   actionType: 'RESTORE',
      //   tooltip: 'Restore',
      // },
    ],
    toolBarActionConfig:{
      activeButton:false,
      inActiveButton:false,
      newButton: false
    },
    dialogData: {},
    isShowDialog: true,
     saveConfig: {
        ...(!this.isSuperUser ? { isDisable: true } : {})
    },
    isShowFooter: false
  });

  leaveMasterForm = signal(null);

  private readonly leaveMasterConfig = inject(FormConfig);

  ngOnInit(): void {
      console.log("isSuperUser",this.isSuperUser)
    this.leaveMasterForm.set(this.leaveMasterConfig.getForm()['leave-master'])
  }

  return_get_url(){
    const custom_show_all_employees = this.permissionService.getPermission("hrm_master.custom_show_all_employees");
    if(custom_show_all_employees){
      return   '/master/leave-master/'
    }
    return  '/master/leave-master/by-user-or-manager/'

  }
}
