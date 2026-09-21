import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-leave-extension',
  standalone: true,
  imports: [CommonModule, TableFilterComponent],
  templateUrl: './leave-extension.component.html',
  styleUrl: './leave-extension.component.scss',
})
export class LeaveExtensionComponent implements OnInit {
  private translate        = inject(TranslateService);
  private permissionService = inject(NgxPermissionsService);
  private readonly formConfigService = inject(FormConfig);

  private readonly requiredFields = signal(
    'id,employee,employee_code,employee_name,leave_type,extended_to_date,extension_days,lop_days,allow_beyond_eligible,reason,approval_status,approval_remarks,leave_application,leave_entry'
  );

  leaveExtensionConfig = signal({
    formName:  'leave-extension',
    modelName: 'LeaveExtension',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('leaveExtension_TC'),
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains',    value: FilterOptions.iContains },
          { label: 'Equal',       value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_name_TC',
        field: 'employee_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains',    value: FilterOptions.iContains },
          { label: 'Equal',       value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'leave_type_TC',
        field: 'leave_type',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'extended_to_date_TC',
        field: 'extended_to_date',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal',              value: FilterOptions.dateIs },
          { label: 'Less than',          value: FilterOptions.lt },
          { label: 'Greater than',       value: FilterOptions.gt },
          { label: 'Less than or equal', value: FilterOptions.lte },
          { label: 'Greater than or equal', value: FilterOptions.gte },
        ],
        isFilterRequired: true,
      },
      {
        label: 'extension_days_TC',
        field: 'extension_days',
        matchModeOptions: [
          { label: 'Equal',    value: FilterOptions.iExact },
          { label: 'Less than', value: FilterOptions.lt },
          { label: 'Greater than', value: FilterOptions.gt },
        ],
        isFilterRequired: true,
      },
      {
        label: 'lop_days_TC',
        field: 'lop_days',
        matchModeOptions: [
          { label: 'Equal',        value: FilterOptions.iExact },
          { label: 'Greater than', value: FilterOptions.gt },
        ],
        isFilterRequired: true,
      },
      {
        label: 'approval_status_TC',
        field: 'approval_status',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['employee_code', 'employee_name', 'leave_type', 'extended_to_date', 'extension_days', 'lop_days', 'approval_status'],
    editable: true,
    params: {
      get: {
        required_fields: this.requiredFields()
      },
    },
    url: {
      get:      ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
      post:     ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
      put:      ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
      delete:   ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
      get_by_pk: ServiceUrlConstants.LEAVE_EXTENSION_CRUD,
    },
    actions: [
      {
        label: '', icon: 'pencil', getById: true, actionType: 'EDIT', tooltip: 'Edit',
      },
      {
        label: '', icon: 'trash', actionType: 'DELETE', tooltip: 'Delete',
        protect: { approval_status: [ApprovalOptions.APPROVED, ApprovalOptions.REJECTED] },
      },
      {
        label: '', icon: 'history', actionType: 'HISTORY', tooltip: 'History',
      },
    ],
    toolBarActionConfig: {
      activeButton:   false,
      inActiveButton: false,
      newButton:      false,   // extensions created only from leave application 3-dots
    },
    saveConfig: {
      permission: ['master.add_leaveextension'],
    },
    dialogData:      {},
    isShowDialog:    true,
    customDialog:    false,
  });

  leaveExtensionForm = signal(null);

  ngOnInit(): void {
    this.leaveExtensionForm.set(this.formConfigService.getForm()['leave-extension-form']);
  }


  checkIsSuperUser(): boolean {
    return JSON.parse(localStorage.getItem('is_superuser'));
  }

  checkPermission(permission: string): boolean {
    return !!this.permissionService.getPermission(permission);
  }
}
