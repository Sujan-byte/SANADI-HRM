import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/core/shared/common/model/app.model';
import { LeaveEntryModel } from 'src/app/core/shared/common/model/masters/leave-entry.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { LeaveEntryService } from './services/leave-entry.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { colorSets } from '@swimlane/ngx-charts';
import { DialogHandlerService } from 'src/app/core/shared/services/dialog-form.service';
import { DialogService } from 'primeng/dynamicdialog';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { ApiService } from 'src/app/core/services/api.service';
import { LeaveReversalRequestComponent } from '../leave-reversal-request/leave-reversal-request.component';
import { LeaveEntryEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-entry.enum';
import { LeaveReversalEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-reversal-enum';
import { LeaveExtensionEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-extension.enum';
import { LeaveExtensionModel } from 'src/app/core/shared/common/model/masters/leave-extension.model';
import { LeaveExtensionDialogComponent } from '../leave-application/leave-extension-dialog/leave-extension-dialog.component';

@Component({
  selector: 'sanadi-leave-entry',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './leave-entry.component.html',
  styleUrl: './leave-entry.component.scss'
})
export class LeaveEntryComponent {
  private translate = inject(TranslateService);
  private readonly leaveEntryRequiredFields = signal('id,from_date,to_date,no_of_days,approval_status,is_system_generated,employee,approval_remarks,approval_status,balance_no_of_days,is_reversal')
  private readonly user_id = signal(localStorage.getItem('user_id'));
  private localCompService: LocalCompServiceConfig = inject(LeaveEntryService);
  private permissionService = inject(NgxPermissionsService);
  private dialogHandlerService = inject(DialogHandlerService);
  private dialogService        = inject(DialogService);
  private apiService = inject(ApiService);
  private leaveRevesalComponent = new LeaveReversalRequestComponent();

  // variable:boolean = true;
  leaveEntriesConfig = signal({
    formName: 'leave-entry',
    modelName: 'LeaveEntry',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('leaveEntry_TC'),
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
        field: 'leave_type__status_name',
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
        field: 'from_date',
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
        field: 'to_date',
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
        label: 'no_of_days_TC',
        field: 'no_of_days',
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
    tableBody: ['employee_code', 'first_name', 'leave_types', 'from_date', 'to_date', 'no_of_days', 'approval_remarks'],
    editable: true,
    params: {
      get: { required_fields: this.leaveEntryRequiredFields(), ...this.getParams() }
    },
    url: {
      post: '/master/leave-entry/',
      get: '/master/leave-entry/',
      delete: '/master/leave-entry/',
      put: '/master/leave-entry/',
      get_by_pk: '/master/leave-entry/'
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById: true,
        actionType: 'EDIT',
        // protect: {is_system_generated:true},
        protectFunction: (data: LeaveEntryModel) => (localStorage.getItem('employeeId') == data?.employee) && (data?.is_system_generated == true),
        tooltip: 'Edit',
        // onClick:this.hasInitiatorPermissions.bind(this)
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
        icon: 'directions-alt',
        actionType: 'REVERSAL',
        tooltip: 'Leave Reversal Application',
        protectFunction: (data: LeaveEntryModel) =>
          !(data?.is_reversal === true && data.balance_no_of_days > 0),
        onClick: this.onClickLeaveReversal.bind(this),
      },
      {
        label: '',
        icon: 'calendar-plus',
        actionType: 'EXTEND_LEAVE',
        tooltip: 'Extend Leave',
        protectFunction: (data: LeaveEntryModel) =>
          data?.approval_status !== ApprovalOptions.APPROVED,
        onClick: this.onClickExtendLeave.bind(this),
      },
      {
        label: '',
        icon: 'eye',
        actionType: 'VIEW_EXTENSIONS',
        tooltip: 'View Extensions',
        protectFunction: (data: LeaveEntryModel) =>
          data?.approval_status !== ApprovalOptions.APPROVED,
        onClick: this.onClickViewExtensions.bind(this),
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },

    ],
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false
    },
    saveConfig: {
      permission: ["master.custom_enable_leave_reversal"],
    },
    dialogData: {},
    isShowDialog: true,
    isApproveNeeded: true,
    localCompService: this.localCompService,
    updateConfig: this.updateConfig.bind(this),
    customDialog: false,
    // refCloseEvent:this.refClose.bind(this)
  });

  leaveEntryForm      = signal(null);
  leaveReversalForm   = signal(null);
  leaveExtensionForm  = signal(null);
  private readonly leaveEntryConfig = inject(FormConfig);


  ngOnInit(): void {
    this.leaveEntryForm.set(this.leaveEntryConfig.getForm()['leave-entry']);
    this.leaveReversalForm.set(this.leaveEntryConfig.getForm()['leave-reversal-form']);
    this.leaveExtensionForm.set(this.leaveEntryConfig.getForm()['leave-extension-form']);
  }

  updateConfig(config: any, item: LeaveEntryModel) {
    // console.log('config', config, item);
    config.isApproveNeeded = true;
    const employee_id = localStorage.getItem('employeeId');
    // console.log("qwer",employee_id ,item?.employee,employee_id == item?.employee)
    if (employee_id == item?.employee) {
      config.isApproveNeeded = false;
    }
    return { config: config, item: item };
  }
  async onClickLeaveReversal(event, item, action, config) {
    console.log("event, item, action, config", item?.leave_reversal, event, item, action, config);

    if (item?.id) {
      const data: any = await this.getLeaveDetailsById(item.id);
      console.log("delegatedReviewer", data, data?.weekly_off)
      const modifiedData = {
        [LeaveReversalEnum.leaveType]: data?.[LeaveEntryEnum.leaveType],
        [LeaveReversalEnum.employee]: data?.employee,
        [LeaveReversalEnum.travel_or_leave]: data?.[LeaveEntryEnum.travel_or_leave],
        [LeaveReversalEnum.typeOfDays]: data?.[LeaveEntryEnum.typeOfDays],
        [LeaveReversalEnum.fromDate]: data?.[LeaveEntryEnum.fromDate],
        [LeaveReversalEnum.toDate]: data?.[LeaveEntryEnum.toDate],
        [LeaveReversalEnum.noOfDays]: data?.[LeaveEntryEnum.noOfDays],
        [LeaveReversalEnum.reason]: data?.[LeaveEntryEnum.reason],
        [LeaveReversalEnum.leaveEntry]: data?.id,
        [LeaveReversalEnum.leaveApplication]: null,
        [LeaveReversalEnum.leaveTypeDefaultObj]: data?.[LeaveEntryEnum.leaveTypeDefaultObj],
        [LeaveReversalEnum.employeeDefaultObj]: data?.[LeaveEntryEnum.employeeDefaultObj],
        [LeaveReversalEnum.condition]: data?.[LeaveEntryEnum.condition],
        [LeaveReversalEnum.reverseFromDate]: data?.[LeaveReversalEnum.reverseFromDate],
        [LeaveReversalEnum.reverseToDate]: data?.[LeaveReversalEnum.reverseToDate],
        [LeaveReversalEnum.reverseNoOfDays]: data?.[LeaveReversalEnum.reverseNoOfDays],
        [LeaveReversalEnum.reasonForReversal]: data?.[LeaveReversalEnum.reasonForReversal],
        [LeaveReversalEnum.balanceNoOfDays]: data?.[LeaveReversalEnum.balanceNoOfDays],
        [LeaveReversalEnum.weeklyOff]: data?.[LeaveReversalEnum.weeklyOff],

        // [LeaveReversalEnum.defaultDelegatedReviewerObj]: data?.[LeaveReversalEnum.defaultDelegatedReviewerObj],
        //  [LeaveReversalEnum.delegatedReviewer]: data?.[LeaveReversalEnum.delegatedReviewer],


      };

      const response: any = await this.dialogHandlerService.openDialog(
        this.leaveRevesalComponent.leaveReversalConfig(),
        this.leaveReversalForm(),
        true,
        modifiedData
      );
    }
  }


  async onClickExtendLeave(event: any, item: any, action: any, config: any) {
    if (!item?.id) return;
    const data: any = await this.getLeaveDetailsById(item.id);

    // current_end_date for LeaveEntry extension = the leave's to_date
    const currentEndDate = data?.[LeaveEntryEnum.toDate] ?? null;

    const modifiedData: LeaveExtensionModel = {
      [LeaveExtensionEnum.leaveApplication]:    null,
      [LeaveExtensionEnum.leaveEntry]:          data?.id,
      [LeaveExtensionEnum.employee]:            data?.employee,
      [LeaveExtensionEnum.currentEndDate]:      currentEndDate,
      [LeaveExtensionEnum.employeeName]:        data?.first_name ?? '',
      [LeaveExtensionEnum.extensionDays]:       0,
      [LeaveExtensionEnum.lopDays]:             0,
      [LeaveExtensionEnum.allowBeyondEligible]: false,
      employee_default_object:                  data?.employee_default_object ?? {},
      default_delegated_reviewer_object:        data?.default_delegated_reviewer_object ?? {},
      available_leaves:                         data?.available_leaves ?? null,
    };

    await this.dialogHandlerService.openDialog(
      {
        formName:     'leave-extension',
        pageTitle:    this.translate.instant('leaveExtension_TC'),
        url: {
          post:      ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          get:       ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          put:       ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          delete:    ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
          get_by_pk: ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        },
        isShowDialog:  true,
        customDialog:  false,
        dialogData:    modifiedData,
        saveConfig: {
          permission: ['master.add_leaveextension'],
        },
      },
      this.leaveExtensionForm(),
      false,
      null
    );
  }

  async onClickViewExtensions(event: any, item: any, action: any, config: any) {
    if (!item?.id) return;
    const data: any = await this.getLeaveDetailsById(item.id);

    this.dialogService.open(LeaveExtensionDialogComponent, {
      header: `Leave Extensions — ${data?.first_name ?? ''}`,
      width: '80%',
      height: '80%',
      maximizable: true,
      contentStyle: { overflow: 'auto' },
      appendTo: 'body',
      data: { leaveEntry: data },
    });
  }

  getLeaveDetailsById(id) {
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.LEAVE_ENTRY_CRUD}${id}`).subscribe((res: any) => {
        resolve(res);
      })
    })
  }

  getLeaveDetailsRevertById(id) {
    return new Promise((resolve, reject) => {
      const url = `${ServiceUrlConstants.LEAVE_REVERSAL_CRUD}${id}`;
      this.apiService.get(url).subscribe({
        next: (res: any) => resolve(res),
        error: (err) => reject(err)
      });
    });
  }

  checkIsSuperUser() {
    const isSuperUser = JSON.parse(localStorage.getItem('is_superuser'));
    return isSuperUser;
  }

  getParams() {
    console.log("this.checkIsSuperUser()", this.checkIsSuperUser())
    if (!this.checkIsSuperUser()&&!this.check_permission("master.custom_approval_stage_HR")) {
      return { approval_stages__user: localStorage.getItem('user_id') }
    }
    else {
      return {}
    }
  }

  check_permission(permission): boolean {
    // console.log("perm", this.permissionsService.getPermission(permission))
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }
}