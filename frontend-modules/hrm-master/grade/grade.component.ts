import { Component, ViewChild, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { GradeService } from './service/grade.service';

@Component({
  selector: 'sanadi-grade',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './grade.component.html',
  styleUrl: './grade.component.scss'
})
export class GradeComponent {
  private translate = inject(TranslateService);
  private grade: LocalCompServiceConfig = inject(GradeService);
  private readonly gradeRequiredFields = signal('id,grade_code,grade_description')
  gradesConfig = signal({
    formName: 'grade',
    modelName: 'Grade',
    headerTitleKey: 'grade_code',
    pageTitle: this.translate.instant('grade_TC'),
    tableHeaders: [
      {
        label: 'grade_code_TC',
        field: 'grade_code',
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
        field: 'grade_description',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },


    ],
    tableBody: ['grade_code', 'grade_description'],
    editable: true,
    params: {
      get: { required_fields: this.gradeRequiredFields() }
    },
    url: {
      post: '/master/grade/',
      get: '/master/grade/',
      delete: '/master/grade/',
      put: '/master/grade/',
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
      },
    ],
    toolBarActionConfig: {
      activeButton: true,
      inActiveButton: true
    },
    dialogData: {},
    isShowDialog: true,
    localCompService: this.grade
  });

  gradeForm = signal(null);

  private readonly gradeConfig = inject(FormConfig);

  @ViewChild(ConfirmPopup) confirmPopup!: ConfirmPopup;

  accept() {
    this.confirmPopup.accept();
  }

  reject() {
    this.confirmPopup.reject();
  }
  ngOnInit(): void {
    this.gradeForm.set(this.gradeConfig.getForm()['grade'])
  }
}
