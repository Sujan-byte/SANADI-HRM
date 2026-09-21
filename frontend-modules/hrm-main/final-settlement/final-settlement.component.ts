import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from 'src/app/core/services/api.service';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { AppUtils } from 'src/app/core/utils/app.utils';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
@Component({
  selector: 'sanadi-final-settlement',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './final-settlement.component.html',
  styleUrl: './final-settlement.component.scss'
})
export class FinalSettlementComponent {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private appUtils = inject(AppUtils);
  finalSettlementsConfig = signal({
    formName: 'final-settlement',
    modelName: 'FinalSettlement',
    headerTitleKey: 'first_name',
    pageTitle: this.translate.instant('finalSettlement_TC'),
    tableHeaders: [
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
        label: "dor_TC",
        field: 'dor',
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
        label: 'notice_period_TC',
        field: 'notice_period',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'status_TC',
        field: 'approval_status',
        filterType: 'dropdown',
        filterOptions: signal(this.appUtils.getApprovalStatusList()),
        isFilterRequired: true,
      },
    ],
    tableBody: ['first_name', 'dor', 'notice_period', 'approvalStatus'],
    editable: true,
    url: {
      post: '/hrm/finalSettlement/',
      get: '/hrm/finalSettlement/',
      delete: '/hrm/finalSettlement/',
      put: '/hrm/finalSettlement/',
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
        tooltip: 'Delete',
        protect: { approval_status: ApprovalOptions.APPROVED },
      },
      {
        label: '',
        icon: 'undo',
        actionType: 'RESTORE',
        tooltip: 'Restore',
      },
      {
        label: '',
        icon: 'print',
        getById: true,
        actionType: 'PRINT',
        receiptBuilderConfig: { type: 'final-settlement-print' },
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
      activeButton: false,
      inActiveButton: false
    },
    dialogData: {},
    isShowDialog: true,
  });

  finalSettlementForm = signal(null);

  private readonly finalSettlementConfig = inject(FormConfig);
  gradeObject: any;

  ngOnInit(): void {
    this.finalSettlementForm.set(this.finalSettlementConfig.getForm()['finalSettlement'])
  }



}
