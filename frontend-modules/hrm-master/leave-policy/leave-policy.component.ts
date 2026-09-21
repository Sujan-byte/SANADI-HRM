import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { LeavePolicyModel } from 'src/app/core/shared/common/model/masters/leave-policy.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-leave-policy',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './leave-policy.component.html',
  styleUrl: './leave-policy.component.scss'
})
export class LeavePolicyComponent {
  private translate = inject(TranslateService);
  private readonly LeavePolicyRequiredFields = signal('id,employee_type,employee_group,employee_reporting,type_of_leave')
  private permissionService = inject(NgxPermissionsService);
  leavePolicyConfig = signal({
    formName: 'leave-policy',
    modelName: 'LeavePolicy',
    headerTitleKey: 'employee_type',
    pageTitle: this.translate.instant('leave_policy_TC'),
    tableHeaders: [
      {
        label: 'employee_type_TC',
        field: 'employee_type',
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
        field: 'employee_group',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_reporting_TC',
        field: 'employee_reporting',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'type_of_leave_TC',
        field: 'type_of_leave__type',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      }
    ],
    tableBody: ['employee_type', 'employee_group', 'employee_reporting', 'leave_typeee'],
    editable: true,
    params:{
      get:{required_fields:this.LeavePolicyRequiredFields(), ...this.getEmployeeType()}
    },
    url: {
      post: '/master/leave-policy/',
      get: '/master/leave-policy/',
      delete: '/master/leave-policy/',
      put: '/master/leave-policy/',
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        actionType: 'EDIT',
        tooltip: 'Edit',
        getById:true,
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'Delete',
        protectFunction: (data: LeavePolicyModel) => (!(this.checkPermission("hrm_master.delete_leavepolicy"))),
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      }
    ],
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false,
      newButton: (this.checkPermission("hrm_master.add_leavepolicy")),
    },
    dialogData: {},
    dialogConfig: {
      height: '100%',
      width: '80%'
    },
    isShowDialog: true,
    isShowFooter: false,
  });

  leavePolicyForm = signal(null);

  private readonly leavePolicyFormConfig = inject(FormConfig);

  ngOnInit(): void {
    this.leavePolicyForm.set(this.leavePolicyFormConfig.getForm()['leave-policy'])
  }

  checkPermission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }

  getEmployeeType(){
    if(this.checkPermission('hrm_master.custom_approval_stage_initiator')){
      return { };
    }
    return { employee_type__in: ['All','Staff'].toString() };
  }
}
