import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApprovalOptions, FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TaDaModel } from 'src/app/core/shared/common/model/hrm/ta-da.model';
import { AppUtils } from 'src/app/core/utils/app.utils';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { TaDaService } from './services/ta-da.service';
import { EncryptedStorageService } from 'src/app/core/shared/services/secure-cookie-service';

@Component({
  selector: 'sanadi-ta-da',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './ta-da.component.html',
  styleUrl: './ta-da.component.scss'
})
export class TaDaComponent {
  private translate = inject(TranslateService);
  private appUtils = inject(AppUtils);
  private taDaService = inject(TaDaService);
  private readonly secureStorage = inject(EncryptedStorageService);
  private readonly taDaRequiredFields = signal('id,tada_number,employee,employee_first_name,employee_department_name,employee_designation_name,approval_status')
  configReady = signal(false);
  taDaConfig = signal({
    formName: 'ta-da',
    modelName: 'TaDa',
    headerTitleKey: 'tada_number',
    pageTitle: this.translate.instant('TravelAllowanceDearnessAllowance_TC'),
    tableHeaders: [
      {
        label: 'ta_da_id_TC',
        field: 'tada_number',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_code_TC',
        field: 'employee__employee_code',
        representationField: 'employeeCode',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_name_TC',
        field: 'employee_first_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'department_name_TC',
        field: 'employee_department_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'designation_name_TC',
        field: 'employee_designation_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'approval_status_TC',
        field: 'approval_status',
        filterType:'dropdown',
        // matchModeOptions: [
        //   { label: 'Starts With', value: FilterOptions.istartsWith },
        //   { label: 'Ends With', value: FilterOptions.iendsWith },
        //   { label: 'Contains', value: FilterOptions.iContains },
        //   { label: 'Equal', value: FilterOptions.iExact },
        // ],
        filterOptions:signal(this.appUtils.getApprovalStatusList()),
        isFilterRequired: true,
      },
    ],
    tableBody: ['tada_number','employeeCode','employee_first_name','employee_department_name','employee_designation_name','approvalStatus'],
    editable: true,
    url: {
      post: '/hrm/taDa/',
      get: '/hrm/taDa/get-list-by-user/',
      delete: '/hrm/taDa/',
      put: '/hrm/taDa/',
      get_by_pk: '/hrm/taDa/'
    },
    params: {
      get: { required_fields: this.taDaRequiredFields() }
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
        // protect: { approval_status: ApprovalOptions.APPROVED },
        protect: { approval_status: [ApprovalOptions.APPROVED, ApprovalOptions.REJECTED, ApprovalOptions.NOT_APPROVED] },
        tooltip: 'Delete',

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

  taDaForm = signal(null);

  private readonly taDaFormConfig = inject(FormConfig);

  async ngOnInit(): Promise<void> {
    this.taDaForm.set(this.taDaFormConfig.getForm()['ta-da'])

    const userId = await this.secureStorage.getItem('user_id');
    this.taDaConfig.update(cfg => ({
      ...cfg,
      params: {
        ...cfg.params,
        get: { ...cfg.params.get, user_id: userId },
      },
    }));
    this.configReady.set(true);
  }

  async updateConfig(config: any, item: TaDaModel) {
    config.isApproveNeeded = true;
    const employee_id = await this.secureStorage.getItem('employeeId');
    if (employee_id == item?.employee) {
      config.isApproveNeeded = false;
    }
    return { config: config, item: item };
  }
}
