import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { DocumentTypeMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/document-type-master-form.config.service';

@Component({
  selector: 'sanadi-document-type-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './document-type-master.component.html',
  styleUrls: ['./document-type-master.component.scss'],
})
export class DocumentTypeMasterComponent {
  private translate = inject(TranslateService);
  private readonly documentTypeMasterFormConfig = inject(
    DocumentTypeMasterFormConfig,
  );

  DocumentTypeMasterForm = signal<any>(null);

  DocumentTypeMasterConfig = signal({
    formName: 'document-type-master',
    modelName: 'DocumentTypeMaster',
    headerTitleKey: 'doc_type_code',
    pageTitle: this.translate.instant('Document Master'),

    tableHeaders: [
      {
        label: 'Doc Type Code',
        field: 'doc_type_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Doc Type Name',
        field: 'doc_type_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Applies To',
        field: 'applies_to',
        matchModeOptions: [
          { label: 'Equal', value: FilterOptions.iExact },
          { label: 'Contains', value: FilterOptions.iContains },
        ],
        isFilterRequired: true,
      },
      {
        label: 'Expiry Required',
        field: 'expiry_required',
        representationField: 'expiry_required_display',
        filterType: 'dropdown',
        defaultMatchMode: FilterOptions.exact,
        filterOptions: signal([
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ]),
        isFilterRequired: true,
      },
      // {
      //   label: 'Expiry Required',
      //   field: 'expiry_required',
      //   matchModeOptions: [
      //     { label: 'Equal', value: FilterOptions.exact },
      //   ],
      //   isFilterRequired: true,
      // },
      // {
      //   label: 'Default Alert Days',
      //   field: 'default_alert_days_display',
      //   matchModeOptions: [
      //     { label: 'Contains', value: FilterOptions.iContains },
      //   ],
      //   isFilterRequired: false,
      // },
      {
        label: 'Remarks',
        field: 'remarks',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],

    tableBody: [
      'doc_type_code',
      'doc_type_name',
      'applies_to',
      // 'expiry_required',
      'expiry_required_display',
      // 'default_alert_days_display',
      'remarks',
    ],

    editable: true,
    isShowDialog: true,

    url: {
      get: ServiceUrlConstants.DOCUMENT_TYPE_MASTER_CRUD,
      post: ServiceUrlConstants.DOCUMENT_TYPE_MASTER_CRUD,
      put: ServiceUrlConstants.DOCUMENT_TYPE_MASTER_CRUD,
      delete: ServiceUrlConstants.DOCUMENT_TYPE_MASTER_CRUD,
    },

    params: {
      get: {
        is_active: true,
      },
    },

    actions: [
      {
        label: '',
        icon: 'pencil',
        getById: true,
        actionType: 'EDIT',
        tooltip: 'Edit Document Type',
      },
      {
        label: '',
        icon: 'trash',
        actionType: 'DELETE',
        tooltip: 'Deactivate',
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

    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true,
    },

    dialogData: {},
  });

  ngOnInit(): void {
    this.DocumentTypeMasterForm.set(
      this.documentTypeMasterFormConfig.DocumentTypeMasterForm(),
    );
  }
}
