import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions, matchModeOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-department',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent {
  private translate = inject(TranslateService);
  departmentConfig = signal({
    formName: 'department',
    modelName: 'Department',
    headerTitleKey: 'department_code',
    pageTitle: this.translate.instant('department_TC'),
    tableHeaders: [
      {
        label: 'department_code_TC',
        field: 'department_code',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: 'department_name_TC',
        field: 'department_name',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },

    ],
    tableBody: ['department_code', 'department_name'],
    editable: true,
    url: {
      post: '/master/department/',
      get: '/master/department/',
      delete: '/master/department/',
      put: '/master/department/',
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
      activeButton: true,
      inActiveButton: true
    },
    dialogData: {},
    dialogConfig: {
      height: '45%',
      width: '50%',
      maximizable: true
    },
    isShowDialog: true,
  });

  departmentForm = signal(null);

  private readonly deparmentConfig = inject(FormConfig);

  ngOnInit(): void {
    this.departmentForm.set(this.deparmentConfig.getForm()['department'])
  }
}
