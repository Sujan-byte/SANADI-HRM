import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { AppUtils } from 'src/app/core/utils/app.utils';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-bonus',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './bonus.component.html',
  styleUrl: './bonus.component.scss'
})
export class BonusComponent {
  private translate = inject(TranslateService);
  private readonly bounsRequiredFields = signal('id,bonus_months,total_bonus_amount,date,approval_status')
  private appUtils = inject(AppUtils);
  bonusesConfig = signal({
    formName: 'bonus',
    modelName: 'Bonus',
    headerTitleKey: 'grade_code',
    pageTitle: this.translate.instant('bonus_TC'),
    tableHeaders: [
      {
        label: 'grade_code_TC',
        field: 'grade__grade_code',
        representationField: 'grade_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'grade_description_TC',
        field: 'grade__grade_description',
        representationField: 'grade_description',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'bonus_months_TC',
        field: 'bonus_months',
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
        label: 'Total_bonus_amount_TC',
        field: 'total_bonus_amount',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'date_TC',
        field: 'date',
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
        label: 'status_TC',
        field: 'approval_status',
        filterType: 'dropdown',
        filterOptions: signal(this.appUtils.getApprovalStatusList()),
        isFilterRequired: true,
      },

    ],
    tableBody: ['grade_code', 'grade_description', 'bonus_months', 'total_bonus_amount', 'date', 'status'],
    editable: true,
    params: {
      get: { required_fields: this.bounsRequiredFields() }
    },
    url: {
      post: '/hrm/bonus/',
      get: '/hrm/bonus/',
      delete: '/hrm/bonus/',
      put: '/hrm/bonus/',
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
        icon: 'trash',
        actionType: 'DELETE',
        protect: { approval_status: ApprovalOptions.APPROVED },
        tooltip: 'Delete',
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
      activeButton: false,
      inActiveButton: false
    },
    dialogData: {},
    isShowDialog: true,

  });

  bonusForm = signal(null);

  private readonly bonusConfig = inject(FormConfig);

  ngOnInit(): void {
    this.bonusForm.set(this.bonusConfig.getForm()['bonus'])
  }
}
