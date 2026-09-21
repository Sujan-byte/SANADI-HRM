import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { DisciplinaryActionEnum } from 'src/app/modules/hrm-main/hrm-enum/disciplinary-action.enum';

@Component({
  selector: 'sanadi-disciplinary-action',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './disciplinary-action.component.html',
  styleUrl: './disciplinary-action.component.scss'
})
export class DisciplinaryActionComponent {
  private translate      = inject(TranslateService);
  private permissionService = inject(NgxPermissionsService);
  private formConfig     = inject(FormConfig);

  private readonly requiredFields = signal(
    'id,reference_no,employee,employee_code,employee_name,violation_type,penalty_type,affects_pay,from_date,to_date,attachment,approval_status,approval_remarks'
  );

  /**
   * Builds a multipart FormData so the backend receives `attachment`
   * as a proper binary file (same pattern as employee master).
   * Non-file fields are JSON-stringified as needed.
   */
  readonly onSaveFormData = async (formData: any, formFields: any): Promise<FormData> => {
    const fd = new FormData();

    // Find the attachment field to get the actual File object from selectedFiles
    const attachmentField = this.findField(formFields, DisciplinaryActionEnum.attachment);

    Object.entries(formData).forEach(([key, value]) => {
      if (key === DisciplinaryActionEnum.attachment) return; // handled separately below

      if (value === null || value === undefined) {
        fd.append(key, '');
      } else if (typeof value === 'object' && !(value instanceof File)) {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, value as any);
      }
    });

    // Append actual binary file if a new one was selected
    if (attachmentField?.selectedFiles?.length) {
      fd.append(DisciplinaryActionEnum.attachment, attachmentField.selectedFiles[0]);
    } else if (attachmentField?.fileDeleted) {
      fd.append(DisciplinaryActionEnum.attachment, '');
    }
    // If no new file and not deleted — don't append at all so backend keeps existing file

    return fd;
  };

  /** Recursively find a field by name inside the form fields tree */
  private findField(formFields: any, name: string): any {
    if (!formFields) return null;
    const arr = Array.isArray(formFields) ? formFields : [formFields];
    for (const f of arr) {
      if (!f) continue;
      if (f?.name === name) return f;
      // recurse into nested field arrays (tab, accordion, fieldset etc.)
      const nested = f?.fields ?? f?.subFields ?? [];
      const found = this.findField(nested, name);
      if (found) return found;
    }
    return null;
  }

  disciplinaryConfig = signal({
    formName: 'disciplinary-action',
    pageTitle: this.translate.instant('disciplinaryAction_TC'),
    localCompService: this,
    tableHeaders: [
      {
        label: 'reference_no_TC',
        field: 'reference_no',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_code_TC',
        field: 'employee__employee_code',
        representationField: 'employee_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains',    value: FilterOptions.iContains   },
          { label: 'Equal',       value: FilterOptions.iExact      },
        ],
        isFilterRequired: true,
      },
      {
        label: 'first_name_TC',
        field: 'employee__first_name',
        representationField: 'employee_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains',    value: FilterOptions.iContains   },
        ],
        isFilterRequired: true,
      },
      {
        label: 'violationType_TC',
        field: 'violation_type',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal',    value: FilterOptions.iExact    },
        ],
        isFilterRequired: true,
      },
      {
        label: 'penaltyType_TC',
        field: 'penalty_type',
        matchModeOptions: [
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
          { label: 'Equal',                value: FilterOptions.dateIs },
          { label: 'Greater than or equal',value: FilterOptions.gte   },
          { label: 'Less than or equal',   value: FilterOptions.lte   },
        ],
        isFilterRequired: true,
      },
      {
        label: 'to_date_TC',
        field: 'to_date',
        fieldType: 'date',
        defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Equal',                value: FilterOptions.dateIs },
          { label: 'Greater than or equal',value: FilterOptions.gte   },
          { label: 'Less than or equal',   value: FilterOptions.lte   },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Approval Status',
        field: 'approval_status',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['reference_no', 'employee_code', 'employee_name', 'violation_type', 'penalty_type', 'from_date', 'to_date', 'approval_status'],
    editable: true,
    params: {
      get: { required_fields: this.requiredFields(), ...this.getParams() }
    },
    url: {
      post:       '/hrm/disciplinary-action/',
      get:        '/hrm/disciplinary-action/',
      delete:     '/hrm/disciplinary-action/',
      put:        '/hrm/disciplinary-action/',
      get_by_pk:  '/hrm/disciplinary-action/',
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
        icon: 'print',
        actionType: 'PRINT',
        receiptBuilderConfig: {
          type: 'disciplinary-action',
          dynamicPrint: true,
          formUrl: '/hrm/disciplinary-action/',
        },
        tooltip: 'Print',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        protect: { approval_status: [ApprovalOptions.APPROVED, ApprovalOptions.REJECTED] },
        tooltip: 'Delete',
      }
    ],
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false,
      newButton: true,
    },
    saveConfig: {
      permission: ['hrm.custom_can_approve_disciplinary_action'],
    },
    dialogData: {},
    isShowDialog: true,
    isApproveNeeded: true,
    customDialog: false,
    // Keep approval dropdown enabled even after approval so HR can reject
    approveDropdownDisabled: (_item: any) => {
      const hasPermission = this.checkPermission('hrm.custom_can_approve_disciplinary_action') || this.checkIsSuperUser();
      return !hasPermission;
    },
  });

  disciplinaryForm = signal(null);

  ngOnInit(): void {
    this.disciplinaryForm.set(this.formConfig.getForm()['disciplinary-action-form']);
  }

  getParams() {
    if (this.checkIsSuperUser()) return {};
    if (this.checkPermission('hrm.custom_can_approve_disciplinary_action')) return {};
    return { approval_stages__user: localStorage.getItem('user_id') };
  }

  checkIsSuperUser(): boolean {
    return JSON.parse(localStorage.getItem('is_superuser') || 'false');
  }

  checkPermission(permission: string): boolean {
    return !!this.permissionService.getPermission(permission);
  }
}
