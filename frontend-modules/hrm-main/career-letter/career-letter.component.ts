import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { CarrerLetterService } from './services/carrer-letter.service';
import { LocalCompServiceConfig } from 'src/app/core/shared/common/model/app.model';

@Component({
  selector: 'sanadi-career-letter',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './career-letter.component.html',
  styleUrl: './career-letter.component.scss'
})
export class CareerLetterComponent {
  private translate = inject(TranslateService);
  private readonly careerLetterRequiredFields = signal('id,date,subject')
  careerLettersConfig = signal({
    formName: 'career-letter',
    modelName: 'CareerLetter',
    headerTitleKey: 'employee_code',
    pageTitle: this.translate.instant('careerLetterTitle_TC'),
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
        label: 'employee_name_TC',
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
        label: 'date_TC',
        field: 'date',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      // {
      //   label: 'career_latter_type_TC',
      //   field: 'career_latter_type',
      //   matchModeOptions: [
      //     { label: 'Starts With', value: FilterOptions.istartsWith },
      //     { label: 'Ends With', value: FilterOptions.iendsWith },
      //     { label: 'Contains', value: FilterOptions.iContains },
      //     { label: 'Equal', value: FilterOptions.iExact },
      //   ],
      //   isFilterRequired: true,
      // },      
      {
        label: 'subject_TC',
        field: 'subject',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['employee_code','first_name', 'date', 'subject'],
    editable: true,
    params: {
      get: { required_fields: this.careerLetterRequiredFields() }
    },
    url: {
      post: '/hrm/careerLetter/',
      get: '/hrm/careerLetter/',
      delete: '/hrm/careerLetter/',
      put: '/hrm/careerLetter/',
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
        tooltip: 'Delete',
      },
      {
        label: '',
        icon: 'print',
        actionType: 'PRINT',
        receiptBuilderConfig: { type: 'career-letter-print' },
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

  careerLetterForm = signal(null);

  private readonly careerLetterConfig = inject(FormConfig);

  ngOnInit(): void {
    this.careerLetterForm.set(this.careerLetterConfig.getForm()['career-letter'])
  }
}
