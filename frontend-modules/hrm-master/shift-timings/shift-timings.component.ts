import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-shift-timings',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './shift-timings.component.html',
  styleUrl: './shift-timings.component.scss'
})
export class ShiftTimingsComponent {
  private translate = inject(TranslateService);
  private readonly shiftTimingsRequiredFields = signal('id,shift_name,shift_code');
  shiftTimingsConfig = signal({
    formName: 'shift-timings',
    pageTitle: this.translate.instant('shift_timings_TC'),
    tableHeaders: [
      {
        label: 'shift_code_TC',
        field: 'shift_code',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'shift_name_TC',
        field: 'shift_name',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
    ],
    tableBody: ['shift_code', 'shift_name'],
    editable: true,
    params:{
      get:{required_fields:this.shiftTimingsRequiredFields()}
    },
    url: {
      post: '/master/shift-timings/',
      get: '/master/shift-timings/',
      delete: '/master/shift-timings/',
      put: '/master/shift-timings/',
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById:true,
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
    ],
    dialogData: {},
    isShowDialog: true,
  });

  shiftTimingsForm = signal(null);

  private readonly shiftTimingsFormConfig = inject(FormConfig);

  ngOnInit(): void {
    this.shiftTimingsForm.set(this.shiftTimingsFormConfig.getForm()['shift-timings'])
  }
}
