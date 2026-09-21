import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions, matchModeOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-designation',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './designation.component.html',
  styleUrl: './designation.component.scss'
})
export class DesignationComponent {
  private translate = inject(TranslateService);
  designationsConfig = signal({
    formName: 'designation',
    modelName: 'Designation',
    headerTitleKey: 'designation_code',
    pageTitle: this.translate.instant('designation_TC'),
    tableHeaders: [
      {
        label: 'designation_code_TC',
        field: 'designation_code',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: 'designation_name_TC',
        field: 'designation_name',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },

    ],
    tableBody: ['designation_code', 'designation_name'],
    editable: true,
    url: {
      post: '/master/designation/',
      get: '/master/designation/',
      delete: '/master/designation/',
      put: '/master/designation/',
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

  designationForm = signal(null);

  private readonly designationConfig = inject(FormConfig);

  ngOnInit(): void {
    this.designationForm.set(this.designationConfig.getForm()['designation'])
  }
}
