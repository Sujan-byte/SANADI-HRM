import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions, matchModeOptions } from 'src/app/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-allowance-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './allowance-master.component.html',
  styleUrl: './allowance-master.component.scss',
})
export class AllowanceMasterComponent {
  private translate = inject(TranslateService);

  allowanceMasterConfig = signal({
    formName: 'allowance-master',
    modelName: 'AllowanceMaster',
    headerTitleKey: 'allowance_code',
    pageTitle: this.translate.instant('allowanceMaster_TC'),
    tableHeaders: [
      {
        label: 'allowanceCode_TC',
        field: 'allowance_code',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },
      {
        label: 'allowanceName_TC',
        field: 'allowance_name',
        matchModeOptions: matchModeOptions,
        isFilterRequired: true,
      },
    ],
    tableBody: ['allowance_code', 'allowance_name'],
    editable: true,
    url: {
      post: '/master/allowance-master/',
      get: '/master/allowance-master/',
      delete: '/master/allowance-master/',
      put: '/master/allowance-master/',
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
      inActiveButton: true,
    },
    dialogData: {},
    dialogConfig: {
      height: '45%',
      width: '50%',
      maximizable: true,
    },
    isShowDialog: true,
  });

  allowanceMasterForm = signal(null);

  private readonly formConfig = inject(FormConfig);

  ngOnInit(): void {
    this.allowanceMasterForm.set(this.formConfig.getForm()['allowance-master']);
  }
}
