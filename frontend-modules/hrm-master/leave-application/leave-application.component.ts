import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/core/services/api.service';
import { ApprovalOptions, FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { LeaveReversalEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-reversal-enum';
import { LeaveExtensionEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-extension.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { LeaveApplicationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-application.model';
import { LeaveExtensionModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/leave-extension.model';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { DialogService } from 'primeng/dynamicdialog';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { LeaveReversalRequestComponent } from '../leave-reversal-request/leave-reversal-request.component';
import { LeaveExtensionDialogComponent } from './leave-extension-dialog/leave-extension-dialog.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { LeaveEntryEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-entry.enum';
import { LeaveApplicationEnum } from 'src/app/modules/hrm-shared/core/shared/common/enum/masters_enum/leave-application.enum';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
  selector: 'sanadi-leave-application',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './leave-application.component.html',
  styleUrl: './leave-application.component.scss'
})
export class LeaveApplicationComponent {
  private translate = inject(TranslateService);
  private readonly leaveApplicationRequiredFields = signal('id,employee_code,employee_name,department,leave_approved_start_date,leave_approved_end_date,leave_days_applied,leave_approved,approval_remarks,approval_status,leave_approved_days,is_reversal,balance_no_of_days')
  // private localCompService: LocalCompServiceConfig = inject(LeaveEntryService);
  private dialogHandlerService = inject(DialogHandlerService);
  private dialogService        = inject(DialogService);
  private leaveRevesalComponent = new LeaveReversalRequestComponent();
  private permissionService = inject(NgxPermissionsService);

  private apiService = inject(ApiService);

  leaveApplicationsConfig = signal({
    formName: 'leave-application',
    modelName: 'LeaveApplication',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('leaveApplication_TC'),
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee_code__employee_code',  // Changed from 'employee_code__employee_code'
        representationField: 'employee_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Equal', value: FilterOptions.iExact },
          { label: 'Contains', value: FilterOptions.iContains },

        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_name_TC',
        field: 'employee_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'department_TC',
        field: 'department__department_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'leave_start_date_TC',
        field: 'new_leave_start_date',
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
        label: 'leave_end_date_TC',
        field: 'new_leave_end_date',
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
        label: 'leave_days_applied_TC',
        field: 'leave_days_applied',
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
      // },
      {
        label: 'Approval Remarks',
        field: 'approval_remarks',
        // fieldType: 'boolean',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },

    ],
    tableBody: ['employee_code_code', 'employee_name', 'department_name', 'leave_approved_start_date', 'leave_approved_end_date', 'leave_approved_days', 'approval_remarks'],
    editable: true,
    params: {
      get: { required_fields: this.leaveApplicationRequiredFields(), ...this.getUsersExceptMd() }
    },
    url: {
      post: '/master/leave-application/',
      get: '/master/leave-application/',
      delete: '/master/leave-application/',
      put: '/master/leave-application/',
      //   get_by_pk: '/master/leave-application/'
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
        protect: { local_approval_status: ApprovalOptions.APPROVED },
        tooltip: 'Delete',
      },

      {
        label: '',
        icon: 'print',
        actionType: 'PRINT',
        receiptBuilderConfig: { type: 'leave-application-print' },
        tooltip: 'Print',
      },
      {
        label: '',
        icon: 'directions-alt',
        actionType: 'REVERSAL',
        tooltip: 'Leave Reversal Application',
        protectFunction: (data: LeaveApplicationModel) =>
          !(data?.is_reversal === true && data.balance_no_of_days > 0),
        onClick: this.onClickLeaveReversal.bind(this),
      },
      {
        label: '',
        icon: 'calendar-plus',
        actionType: 'EXTEND_LEAVE',
        tooltip: 'Extend Leave',
        protectFunction: (data: LeaveApplicationModel) =>
          data?.approval_status !== ApprovalOptions.APPROVED,
        onClick: this.onClickExtendLeave.bind(this),
      },
      {
        label: '',
        icon: 'eye',
        actionType: 'VIEW_EXTENSIONS',
        tooltip: 'View Extensions',
        protectFunction: (data: LeaveApplicationModel) =>
          data?.approval_status !== ApprovalOptions.APPROVED,
        onClick: this.onClickViewExtensions.bind(this),
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
      inActiveButton: false
    },
    dialogData: {},
    isShowDialog: true,
    customDialog: false,
    saveConfig: {
      permission: ["hrm_master.custom_enable_leave_reversal"]
    }

  });

  leaveApplicationForm = signal(null);
  leaveReversalForm    = signal(null);
  leaveExtensionForm   = signal(null);
  private readonly leaveApplicationConfig = inject(FormConfig);
  private readonly leaveEntryConfig = inject(FormConfig);

  ngOnInit(): void {
    this.leaveApplicationForm.set(this.leaveApplicationConfig.getForm()['leave-application']);
    this.leaveReversalForm.set(this.leaveEntryConfig.getForm()['leave-reversal-form']);
    this.leaveExtensionForm.set(this.leaveEntryConfig.getForm()['leave-extension-form']);
  }

  getUsersExceptMd() {
    //  console.log("this.checkIsSuperUser()",this.checkIsSuperUser())
    if (!this.checkIsSuperUser()&&!this.check_permission("hrm_master.custom_approval_stage_HR")) {
      return { approval_stages__user: localStorage.getItem('user_id') }
    }
    else {
      return {}
    }
  }

  async onClickLeaveReversal(event, item, action, config) {
    console.log("event, item, action, config", item,);

    if (item?.id) {
      const data: any = await this.getLeaveDetailsById(item.id);
      console.log("delegatedReviewer", data)
      const modifiedData = {
        [LeaveEntryEnum.travel_or_leave]: 'Leave',
        [LeaveReversalEnum.employee]: data?.employee_code,
        [LeaveReversalEnum.typeOfDays]: data?.type_of_days,
        [LeaveReversalEnum.leaveType]: data?.leave_type,
        [LeaveReversalEnum.leaveTypeDefaultObj]: data?.leave_type_default_object,
        [LeaveReversalEnum.fromDate]: data?.[LeaveApplicationEnum.newLeaveStartDate],
        [LeaveReversalEnum.toDate]: data?.[LeaveApplicationEnum.newLeaveEndDate],
        [LeaveReversalEnum.noOfDays]: data?.[LeaveApplicationEnum.noOfDays],
        [LeaveReversalEnum.reason]: data?.[LeaveApplicationEnum.note],
        [LeaveReversalEnum.condition]: 'Full Day',
        [LeaveReversalEnum.leaveApplication]: data?.id,
        [LeaveReversalEnum.leaveEntry]: null,
        [LeaveReversalEnum.employeeDefaultObj]: data?.employee_default_object,
        [LeaveReversalEnum.balanceNoOfDays]: data?.[LeaveReversalEnum.balanceNoOfDays],
      };

      const response: any = await this.dialogHandlerService.openDialog(
        this.leaveRevesalComponent.leaveReversalConfig(),
        this.leaveReversalForm(),
        true,
        modifiedData
      );
    }
  }


  // ── Extend Leave: directly opens the extension form (no list) ──────────────
  async onClickExtendLeave(event: any, item: any, action: any, config: any) {
    if (!item?.id) return;
    const data: any = await this.getLeaveDetailsById(item.id);

    const currentEndDate = data?.[LeaveApplicationEnum.newLeaveEndDate]
      ?? data?.[LeaveApplicationEnum.leaveApprovedEndDate]
      ?? null;

    const modifiedData: LeaveExtensionModel = {
      [LeaveExtensionEnum.leaveApplication]:    data?.id,
      [LeaveExtensionEnum.leaveEntry]:          null,
      [LeaveExtensionEnum.employee]:            data?.employee_code,
      [LeaveExtensionEnum.currentEndDate]:      currentEndDate,
      [LeaveExtensionEnum.employeeName]:        data?.employee_name ?? '',
      [LeaveExtensionEnum.extensionDays]:       0,
      [LeaveExtensionEnum.lopDays]:             0,
      [LeaveExtensionEnum.allowBeyondEligible]: false,
      employee_default_object:                  data?.employee_default_object ?? {},
      default_delegated_reviewer_object:        data?.delegated_reviewer_default_object ?? {},
      available_leaves:                         data?.available_leaves ?? null,
      leave_days_applied:                       data?.[LeaveApplicationEnum.leaveDaysApplied] ?? 0,
    };

    await this.dialogHandlerService.openDialog(
      {
        formName:        'leave-extension',
        pageTitle:       this.translate.instant('leaveExtension_TC'),
        url: {
          post:      HrmServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          get:       HrmServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          put:       HrmServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          delete:    HrmServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          get_by_pk: HrmServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        },
        isShowDialog:    true,
        customDialog:    false,
        dialogData:      modifiedData,   // ← initialData in DialogComponent
        saveConfig: {
          permission: ['hrm_master.add_leaveextension'],
        },
      },
      this.leaveExtensionForm(),
      false,          // isEditMode = false → new record
      null            // item not needed; initialData (dialogData) carries the pre-population
    );
  }

  // ── View Extensions: opens list dialog showing all extensions for this leave ─
  async onClickViewExtensions(event: any, item: any, action: any, config: any) {
    if (!item?.id) return;
    const data: any = await this.getLeaveDetailsById(item.id);

    this.dialogService.open(LeaveExtensionDialogComponent, {
      header: `Leave Extensions — ${data?.employee_name ?? ''}`,
      width: '80%',
      height: '80%',
      maximizable: true,
      contentStyle: { overflow: 'auto' },
      appendTo: 'body',
      data: { leaveApplication: data },
    });
  }

  getLeaveDetailsById(id) {
    return new Promise((resolve) => {
      this.apiService.get(`${HrmServiceUrlConstants.LEAVE_APPLICATION_CRUD}${id}`).subscribe((res: any) => {
        resolve(res);
      })
    })
  }

  check_permission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }
  checkIsSuperUser() {
    const isSuperUser = JSON.parse(localStorage.getItem('is_superuser'));
    return isSuperUser;
  }


}
