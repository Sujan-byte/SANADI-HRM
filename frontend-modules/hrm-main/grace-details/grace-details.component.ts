import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-grace-details',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './grace-details.component.html',
  styleUrl: './grace-details.component.scss'
})
export class GraceDetailsComponent {
  private translate = inject(TranslateService);
  graceDetailsConfig = signal({
    formName: 'grace-details',
    modelName: 'GraceDetails',
    headerTitleKey: 'type',
    pageTitle: this.translate.instant('grace_details_TC'),
    tableHeaders: [
      {
        label: 'type_TC',
        field: 'type',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'description_TC',
        field: 'description',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'emp_type_TC',
        field: 'emp_type',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'emp_group_TC',
        field: 'emp_group',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'emp_reporting_TC',
        field: 'emp_reporting',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'shift_TC',
        field: 'shift_name',
        isFilterRequired: false,
      },
      // {
      //   label: 'from_date_TC',
      //   field: 'from_date',
      //   matchModeOptions: [
      //     { label: 'Equal', value: FilterOptions.iExact },
      //     { label: 'Less than', value: FilterOptions.lt },
      //     { label: 'Greater than', value: FilterOptions.gt },
      //   ],
      //   isFilterRequired: true,
      // },
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
      
    //   {
    //   label: 'to_date_TC',
    //   field: 'to_date',
    //   matchModeOptions: [
    //     { label: 'Equal', value: FilterOptions.iExact },
    //     { label: 'Less than', value: FilterOptions.lt },
    //     { label: 'Greater than', value: FilterOptions.gt },
    //   ],
    //   isFilterRequired: true,
    // },
  
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
  
    ],
    tableBody: ['type', 'description', 'emp_type', 'emp_group', 'emp_reporting', 'shift_name', 'from_date', 'to_date'],
    editable: true,
    url: {
    post: '/hrm/grace-details/',
    get: '/hrm/grace-details/',
    delete: '/hrm/grace-details/',
    put: '/hrm/grace-details/',
  },
    actions: [
    {
      label: '',
      icon: 'pencil',
      actionType: 'EDIT',
      tooltip: 'Edit',
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
  },
    dialogData: {},
    dialogConfig: {
    height: '100%',
    width: '80%'
  },
    isShowDialog: true,
  });

graceDetailsForm = signal(null);

  private readonly graceDetailsFormConfig = inject(FormConfig);

ngOnInit(): void {
  this.graceDetailsForm.set(this.graceDetailsFormConfig.getForm()['grace-details'])
}
}
