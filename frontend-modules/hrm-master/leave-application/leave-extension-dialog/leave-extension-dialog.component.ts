import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { ApprovalOptions } from 'src/app/core/shared/common/enum/app.enum';
import { LeaveExtensionEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-extension.enum';
import { LeaveExtensionModel } from 'src/app/core/shared/common/model/masters/leave-extension.model';
import { LeaveApplicationEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-application.enum';

@Component({
  selector: 'app-leave-extension-dialog',
  standalone: true,
  imports: [CommonModule, TableFilterComponent],
  templateUrl: './leave-extension-dialog.component.html',
})
export class LeaveExtensionDialogComponent implements OnInit {
  @ViewChild(TableFilterComponent) tableFilter: TableFilterComponent;

  private config    = inject(DynamicDialogConfig);
  public  ref       = inject(DynamicDialogRef);
  private formConfigService = inject(FormConfig);

  leaveApplication: any;
  leaveEntry: any;
  autoOpenNew: boolean = false;
  tableConfig = signal<any>(null);
  formConfig  = signal<any>(null);

  ngOnInit(): void {
    this.leaveApplication = this.config?.data?.leaveApplication;
    this.leaveEntry       = this.config?.data?.leaveEntry;
    this.autoOpenNew      = this.config?.data?.autoOpenNew ?? false;
    this.formConfig.set(this.formConfigService.getForm()['leave-extension-form']);
    this.buildTableConfig();
  }

  ngAfterViewInit(): void {
    if (this.autoOpenNew && this.tableFilter) {
      // Small delay to let the table finish its initial load
      setTimeout(() => {
        this.tableFilter.show(this.buildDialogData(), false);
      }, 300);
    }
  }

  private buildDialogData(): LeaveExtensionModel {
    // Support both Leave Application and Leave Entry contexts
    const isEntryMode = !!this.leaveEntry;
    const app  = this.leaveApplication;
    const entr = this.leaveEntry;

    if (isEntryMode) {
      const currentEndDate = entr?.to_date ?? null;
      return {
        [LeaveExtensionEnum.leaveApplication]:    null,
        [LeaveExtensionEnum.leaveEntry]:          entr?.id,
        [LeaveExtensionEnum.employee]:            entr?.employee,
        [LeaveExtensionEnum.currentEndDate]:      currentEndDate,
        [LeaveExtensionEnum.employeeName]:        entr?.first_name ?? '',
        [LeaveExtensionEnum.extensionDays]:       0,
        [LeaveExtensionEnum.lopDays]:             0,
        [LeaveExtensionEnum.allowBeyondEligible]: false,
        employee_default_object:                  entr?.employee_default_object ?? {},
        default_delegated_reviewer_object:        entr?.default_delegated_reviewer_object ?? {},
        available_leaves:                         entr?.available_leaves ?? null,
      };
    }

    const currentEndDate = app?.[LeaveApplicationEnum.newLeaveEndDate]
      ?? app?.[LeaveApplicationEnum.leaveApprovedEndDate]
      ?? null;

    return {
      [LeaveExtensionEnum.leaveApplication]:    app?.id,
      [LeaveExtensionEnum.leaveEntry]:          null,
      [LeaveExtensionEnum.employee]:            app?.employee_code,
      [LeaveExtensionEnum.currentEndDate]:      currentEndDate,
      [LeaveExtensionEnum.employeeName]:        app?.employee_name ?? '',
      [LeaveExtensionEnum.extensionDays]:       0,
      [LeaveExtensionEnum.lopDays]:             0,
      [LeaveExtensionEnum.allowBeyondEligible]: false,
      employee_default_object:                  app?.employee_default_object ?? {},
      default_delegated_reviewer_object:        app?.delegated_reviewer_default_object ?? {},
      available_leaves:                         app?.available_leaves ?? null,
      leave_days_applied:                       app?.[LeaveApplicationEnum.leaveDaysApplied] ?? 0,
    };
  }

  private buildTableConfig(): void {
    const isEntryMode = !!this.leaveEntry;
    const app  = this.leaveApplication;
    const entr = this.leaveEntry;
    const dialogData = this.buildDialogData();

    // GET filter: use leave_entry param when coming from Leave Entry, leave_application otherwise
    const getParams = isEntryMode
      ? { leave_entry: entr?.id,          required_fields: 'id,employee,leave_type,extended_to_date,extension_days,lop_days,allow_beyond_eligible,reason,approval_status,approval_remarks,leave_entry' }
      : { leave_application: app?.id,     required_fields: 'id,employee,leave_type,extended_to_date,extension_days,lop_days,allow_beyond_eligible,reason,approval_status,approval_remarks,leave_application' };

    this.tableConfig.set({
      formName:  'leave-extension',
      pageTitle: 'Leave Extensions',
      tableHeaders: [
        { label: 'leave_type_TC',       field: 'leave_type',       representationField: 'leave_type',   isFilterRequired: false },
        { label: 'extended_to_date_TC', field: 'extended_to_date', fieldType: 'date',                   isFilterRequired: false },
        { label: 'extension_days_TC',   field: 'extension_days',                                         isFilterRequired: false },
        { label: 'lop_days_TC',         field: 'lop_days',                                               isFilterRequired: false },
        { label: 'approval_status_TC',  field: 'approval_status',                                        isFilterRequired: false },
      ],
      tableBody: ['leave_type', 'extended_to_date', 'extension_days', 'lop_days', 'approval_status'],
      url: {
        get:       ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        post:      ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        put:       ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        delete:    ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
        get_by_pk: ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
      },
      params: {
        get: getParams,
      },
      isShowDialog:    true,
      customDialog:    false,
      hideRecentForms: true,
      dialogData,
      editable:        true,
      toolBarActionConfig: {
        activeButton:   false,
        inActiveButton: false,
        newButton:      false,   // New is triggered only from 3-dots "Extend Leave"
        globalSearch:   false,
        clearButton:    false,
      },
      saveConfig: {
        permission: ['hrm_master.add_leaveextension'],
      },
      actions: [
        { label: '', icon: 'pencil', getById: true, actionType: 'EDIT', tooltip: 'Edit' },
        {
          label: '', icon: 'trash', actionType: 'DELETE', tooltip: 'Delete',
          protect: { approval_status: [ApprovalOptions.APPROVED, ApprovalOptions.REJECTED] },
        },
      ],
    });
  }
}
