import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-gratuity-calculation',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './gratuity-calculation.component.html',
  styleUrl: './gratuity-calculation.component.scss'
})
export class GratuityCalculationComponent {
  private translate = inject(TranslateService);
  gratuityCalculationsConfig = signal({
    formName: 'gratuity-calculation',
    modelName: 'Gratuity',
    headerTitleKey: 'from_date',
    pageTitle: this.translate.instant('gratuityCalculation_TC'),
    tableHeaders: [
      {
        label: 'from_date_TC',
        field: 'from_date',
        fieldType: 'date',
        defaultMatchMode:FilterOptions.dateIs,
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
        label: 'to_date_TC',
        field: 'to_date',
        fieldType: 'date',
        defaultMatchMode:FilterOptions.dateIs,
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
    tableBody: ['from_date', 'to_date'],
    editable: true,
    url: {
      post: '/hrm/gratuity/',
      get: '/hrm/gratuity/',
      delete: '/hrm/gratuity/',
      put: '/hrm/gratuity/',
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
      },
    ],
    toolBarActionConfig: {
      activeButton: false,
      inActiveButton: false
    },
    dialogData: {},
    isShowDialog: true,
  });

  gratuityCalculationForm = signal(null);

  private readonly gratuityCalculationConfig = inject(FormConfig);

  ngOnInit(): void {
    this.gratuityCalculationForm.set(this.gratuityCalculationConfig.getForm()['gratuity-calculation'])
  }
}
