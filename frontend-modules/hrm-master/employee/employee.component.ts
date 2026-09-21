import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { LocalCompServiceConfig, TableFilterFormConfig } from 'src/app/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { EmployeeService } from './services/employee.service';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { EmployeeDocumentsTableModel, EmployeeModel } from 'src/app/core/shared/common/model/masters/employee.model';
import { ApiService } from 'src/app/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'sanadi-employee',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {
  private translate = inject(TranslateService);
  private readonly employeeRequiredFields = signal('id,employee_code,first_name,reporting,employee_type,employee_group,emirates_id_no,emirates_id_expiry_date,employee_status,is_under_leave')
  private employeeService: LocalCompServiceConfig = inject(EmployeeService);
  private _customDialogService = inject(CustomDialogService);
  private apiService = inject(ApiService);
  employeeConfig = signal({
    formName: 'employee',
    modelName: 'EmployeeMaster',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('employee_TC'),
    showEditInInactive: true,
    hideColumnsOnInactive: ['employee_status'],
    
    tableHeaders: [
      {
        label: 'employee_code_TC',
        field: 'employee_code',
        sortable: true,
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
        field: 'first_name',
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
        field: 'department__department_name',
        representationField: 'department_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'employee_type_TC',
        field: 'employee_type',
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
        field: 'designation__designation_name',
        representationField: 'designation_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      // {
      //   label: 'employee_group_TC',
      //   field: 'grade__employee_group',
      //   representationField: 'employee_group',
      //   matchModeOptions: [
      //     { label: 'Starts With', value: FilterOptions.istartsWith },
      //     { label: 'Ends With', value: FilterOptions.iendsWith },
      //     { label: 'Contains', value: FilterOptions.iContains },
      //     { label: 'Equal', value: FilterOptions.iExact },
      //   ],
      //   isFilterRequired: true,
      // },
      {
        label: 'emirates_id_no_TC',
        field: 'emirates_id_no',
        // fieldType: 'date',
        // defaultMatchMode: FilterOptions.dateIs,
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'emirates_id_expiry_date_TC',
        field: 'emirates_id_expiry_date',
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
    label: 'Employee Status',
    field: 'employee_status',
    matchModeOptions: [
      { label: 'Starts With', value: FilterOptions.istartsWith },
      { label: 'Ends With', value: FilterOptions.iendsWith },
      { label: 'Contains', value: FilterOptions.iContains },
      { label: 'Equal', value: FilterOptions.iExact },
    ],
    isFilterRequired: true,
  },

    ],
    tableBody: [
      'employee_code', 'first_name', 'department_name', 'employee_type',
       'designation_name', 'emirates_id_no', 'emirates_id_expiry_date', 'employee_status'
    ],
    editable: true,
    params: {
      get: { required_fields: this.employeeRequiredFields() }
    },
    url: {
      post: '/master/employee/',
      get: '/master/employee/',
      delete: '/master/employee/',
      put: '/master/employee/',
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
        tooltip: 'De-activate',
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
      }
    ],
    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true
    },
    dialogData: {},
    // dialogConfig: {
    //   height: '45%',
    //   width: '50%'
    // },
    isShowDialog: true,
    updateConfig: this.updateConfig.bind(this),
    localCompService: this.employeeService,
    frozenActionColumn: true,

  });
  config = {
    pageTitle: 'Employee Product History',
    dialogConfig: {
      width: '40%',
      height: '80%'
    },
    // closeOnEscape: false,
    // closable: false,
  };
  employeeForm = signal(null);

  private readonly employeeFormConfig = inject(FormConfig);


  ngOnInit(): void {

    this.employeeForm.set(this.employeeFormConfig.getForm()['employee'])
  }
  async getGlobalMasterList(globalKey: string) {
    const params={global_key:globalKey,is_active:true}
    return this.apiService.get(ServiceUrlConstants.GLOBAL_MASTER_CRUD,params).toPromise();
  }
async updateConfig(config: TableFilterFormConfig, item: EmployeeModel | any = {}) {
  const employeeItem: any = item;
  const employeeConfig: any = config;

  const keys = [
    { key: 'primary_equipment_specialization', prop: 'globalList' },
    { key: 'secondary_equipment_specialization', prop: 'SecondoryList' },
    { key: 'tertiary_equipment_specialization', prop: 'TertiaryList' },
    { key: 'quaternary_equipment_specialization', prop: 'QuaternaryList' }
  ];

  for (const { key, prop } of keys) {
    const response: any = await this.getGlobalMasterList(key);

    const values = response?.results?.[0]?.global_value || [];
    employeeItem[prop] = values.map(val => ({
      key: val?.id,
      label: val?.name
    }));
  }

  const isInactiveEmployeeView =
    employeeConfig?.showEditInInactive === true && employeeItem?.is_active === false;

  employeeConfig.hideFooterButtons = isInactiveEmployeeView;
  employeeConfig.dialogData = employeeItem;

  return { item: employeeItem, config: employeeConfig };
}


} 
