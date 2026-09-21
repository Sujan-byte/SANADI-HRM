
import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { EncryptedStorageService } from 'src/app/core/shared/services/secure-cookie-service';

@Component({
  selector: 'sanadi-leave-reversal-request',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './leave-reversal-request.component.html',
  styleUrl: './leave-reversal-request.component.scss'
})
export class LeaveReversalRequestComponent {
  private translate = inject(TranslateService);
  private readonly leaveReversalRequiredFields = signal('id,employee,reverse_from_date,reverse_to_date,approval_remarks,reason_for_reversal,approval_status,leave_entry,leave_application')
  private permissionService = inject(NgxPermissionsService);
  private readonly secureStorage = inject(EncryptedStorageService);
  configReady = signal(false);

  leaveReversalConfig = signal({
    formName: 'leave-reversal',
    modelName: 'LeaveReversalRequest',
    headerTitleKey: 'employee',
    pageTitle: this.translate.instant('leaveReversal_TC'),
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee__employee_code',
        representationField: 'employee_code',
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
        representationField: 'first_name',
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
        field: 'leave_entry__leave_type__status_name',
        representationField: 'leave_types',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'from_date_TC',
        field: 'reverse_from_date',
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
      },
      {
        label: 'to_date_TC',
        field: 'reverse_to_date',
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
      },
      {
        label: 'reason_for_reversal_TC',
        field: 'reason_for_reversal',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      // {
      //   label: 'status_TC',
      //   field: 'approval_remarks',
      //   fieldType: 'boolean',
      //   matchModeOptions: [
      //     { label: 'Equal', value: FilterOptions.iExact },
      //   ],
      //   isFilterRequired: true,
      // }
      {
        label: 'Approval Remarks',
        field: 'approval_remarks',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['employee_code', 'first_name', 'leave_types', 'reverse_from_date', 'reverse_to_date', 'reason_for_reversal', 'approval_remarks'],
    editable: true,

    params: {
      get: { required_fields: this.leaveReversalRequiredFields() }
    },
    url: {
      post: '/master/leave-reversal-request/',
      get: '/master/leave-reversal-request/',
      delete: '/master/leave-reversal-request/',
      put: '/master/leave-reversal-request/',
      get_by_pk: '/master/leave-reversal-request/'
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById: true,
        actionType: 'EDIT',
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        protect: { approval_status: [ApprovalOptions.APPROVED, ApprovalOptions.REJECTED, ApprovalOptions.NOT_APPROVED] },
        tooltip: 'Delete',
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
      newButton: false,

    },
        saveConfig: {
      permission: ["hrm_master.custom_enable_leave_reversal"],
    },
    dialogData: {},
    isShowDialog: true,
    isApproveNeeded: true,
    customDialog: false,
  });

  leaveReversalForm = signal(null);

  private readonly leaveReversalFormConfig = inject(FormConfig);

  async ngOnInit(): Promise<void> {
    this.leaveReversalForm.set(this.leaveReversalFormConfig.getForm()['leave-reversal-form']);

    const extraParams = await this.getParams();
    this.leaveReversalConfig.update(cfg => ({
      ...cfg,
      params: {
        ...cfg.params,
        get: { ...cfg.params.get, ...extraParams },
      },
    }));
    this.configReady.set(true);
  }

  async checkIsSuperUser(): Promise<boolean> {
    return (await this.secureStorage.getItem('is_superuser')) === 'true';
  }

  async getParams() {
    const isSuperUser = await this.checkIsSuperUser();
    if (isSuperUser) {
      return {}
    }
    const userId = await this.secureStorage.getItem('user_id');
    if (this.checkPermission("hrm_master.custom_approval_stage_HR")) {
      return { initiator_reviewer__user: userId }
    }
    return { approval_stages__user: userId }
  }

  checkPermission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }
}
