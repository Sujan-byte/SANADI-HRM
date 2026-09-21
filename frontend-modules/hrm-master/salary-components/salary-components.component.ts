import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-salary-components',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './salary-components.component.html',
  styleUrl: './salary-components.component.scss'
})
export class SalaryComponentsComponent {
  private translate = inject(TranslateService);
  holidayMastersConfig = signal({
    formName: 'salary-component-master',
    modelName: 'SalaryComponents',
    headerTitleKey: 'order',
    pageTitle: this.translate.instant('salaryCompenents_TC'),
    tableHeaders: [

      {
        label: 'order_TC',
        field: 'order',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
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
        label: 'Components',
        field: 'component',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['order', 'type', 'component'],
    editable: true,
    url: {
      post: '/master/salary-components/',
      get: '/master/salary-components/',
      delete: '/master/salary-components/',
      put: '/master/salary-components/',
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
    dialogConfig: {
      height: '45%',
      width: '50%',
      maximizable: true
    },
    isShowDialog: true,
  });

  holidayMasterForm = signal(null);

  private readonly holidayMasterConfig = inject(FormConfig);

  ngOnInit(): void {
    this.holidayMasterForm.set(this.holidayMasterConfig.getForm()['salary-components'])
  }
}
