import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { GratuityEnum } from 'src/app/modules/hrm-main/hrm-enum/gratuity.enum';

// File fields on the gratuity form
const FILE_FIELDS = [
  GratuityEnum.resignation_letter,
  GratuityEnum.forfeiture_document,
  GratuityEnum.supporting_document,
] as const;

@Component({
  selector: 'sanadi-gratuity-form',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './gratuity-form.component.html',
  styleUrl: './gratuity-form.component.scss'
})
export class GratuityFormComponent {
  private translate = inject(TranslateService);
  private readonly gratuityFormRequiredFields = signal('id,total_gratuity_monthly,total_gratuity_yearly,dor,approval_remarks')

  /**
   * Builds a multipart FormData so file fields are sent as binary
   * (same pattern as DisciplinaryActionComponent).
   */
  readonly onSaveFormData = async (formData: any, formFields: any): Promise<FormData> => {
    const fd = new FormData();

    // Locate each file field in the form tree to get its selectedFiles ref
    const fileFieldRefs: Record<string, any> = {};
    for (const fieldName of FILE_FIELDS) {
      fileFieldRefs[fieldName] = this.findField(formFields, fieldName);
    }

    Object.entries(formData).forEach(([key, value]) => {
      // Skip file fields — handled separately below
      if ((FILE_FIELDS as readonly string[]).includes(key)) return;

      if (value === null || value === undefined) {
        fd.append(key, '');
      } else if (typeof value === 'object' && !(value instanceof File)) {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, value as any);
      }
    });

    // Append each file field as proper binary
    for (const fieldName of FILE_FIELDS) {
      const ref = fileFieldRefs[fieldName];
      if (ref?.selectedFiles?.length) {
        fd.append(fieldName, ref.selectedFiles[0]);
      } else if (ref?.fileDeleted) {
        fd.append(fieldName, '');
      }
      // No new file & not deleted → don't append, backend keeps existing file
    }

    return fd;
  };

  /** Recursively find a field by name inside the form fields tree */
  private findField(formFields: any, name: string): any {
    if (!formFields) return null;
    const arr = Array.isArray(formFields) ? formFields : [formFields];
    for (const f of arr) {
      if (!f) continue;
      if (f?.name === name) return f;
      const nested = f?.fields ?? f?.subFields ?? [];
      const found = this.findField(nested, name);
      if (found) return found;
    }
    return null;
  }

  gratuityFormsConfig = signal({
    formName: 'gratuity',
    modelName: 'GratuityEmployeeForm',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('gratuityForm_TC'),
    localCompService: this,
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
        label: 'designation_TC',
        field: 'employee__designation_name',
        representationField: 'designation_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'monthlyGratuityAmount_TC',
        field: 'total_gratuity_monthly',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'totalGratuityAmount_TC',
        field: 'total_gratuity_yearly',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'dor_TC',
        field: 'dor',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'approvalRemarks_TC',
        field: 'approval_remarks',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
      {
        label: 'lastModifiedDate_TC',
        field: 'last_modified_date',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
      {
        label: 'modifiedBy_TC',
        field: 'modified_by',
        matchModeOptions: [
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: false,
      },
    ],
    tableBody: ['employee_code', 'first_name', 'designation_name', 'total_gratuity_monthly', 'total_gratuity_yearly', 'dor', 'approval_remarks', 'last_modified_date', 'modified_by'],
    editable: true,
    params: {
      get: { required_fields: this.gratuityFormRequiredFields() }
    },
    url: {
      post: '/hrm/gratuityEmployeeFrom/',
      get: '/hrm/gratuityEmployeeFrom/',
      delete: '/hrm/gratuityEmployeeFrom/',
      put: '/hrm/gratuityEmployeeFrom/',
      get_by_pk: '/hrm/gratuityEmployeeFrom/gratuity_calculation/?id='
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        actionType: 'EDIT',
        getById: true,
        tooltip: 'Edit',
      },
      {
        label: '',
        icon: 'print',
        actionType: 'PRINT',
        receiptBuilderConfig: {
          type: 'gratuity-form',
          dynamicPrint: true,
          formUrl: '/hrm/gratuityEmployeeFrom/',
        },
        tooltip: 'Print',
      },
      {
        label: '',
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },
    ],
    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true,
      newButton: false
    },
    dialogData: {},
    isShowDialog: true,
  });

  gratuityForm = signal(null);

  private readonly gratuityConfig = inject(FormConfig);

  ngOnInit(): void {
    this.gratuityForm.set(this.gratuityConfig.getForm()['gratuity'])
  }
}
