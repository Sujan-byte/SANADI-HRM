import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { ActivatedRoute, Router } from '@angular/router';
import { DataImportComponent } from '../data-import/data-import.component';

@Component({
  selector: 'sanadi-attendance-import',
  standalone: true,
  imports: [TableFilterComponent,DataImportComponent],
  templateUrl: './attendance-import.component.html',
  styleUrl: './attendance-import.component.scss'
})
export class AttendanceImportComponent implements OnInit{
  private translate = inject(TranslateService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  // private attendanceImportService:LocalCompServiceConfig = inject(AttendanceImportService);

  private readonly attendanceRequiredFields = signal('id,date,import_code')

  attendanceImportsConfig = signal({
    formName: 'attendance-import',
    modelName: 'AttendanceImport',
    headerTitleKey: 'import_code',
    pageTitle: this.translate.instant('attendanceImportTitle_TC'),
    tableHeaders: [
      {
        label: 'import_code_TC',
        field: 'import_code',
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
    tableBody: ['import_code','date',],
    editable: true,
    params:{
      get:{required_fields:this.attendanceRequiredFields()}
    },
    url: {
      post: '/hrm/attendanceImport/',
      get: '/hrm/attendanceImport/',
      delete: '/hrm/attendanceImport/',
      put: '/hrm/attendanceImport/',
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        actionType: 'EDIT',
        getById:true,
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
        icon: 'history',
        actionType: 'HISTORY',
        tooltip: 'History',
      },
    ],
    toolBarActionConfig:{
      activeButton:false,
      inActiveButton:false
    },
    dialogData: {},
    parentRoute:'/app/hrm/attendance-import/data-import/'
  });

  attendanceImportForm = signal(null);

  private readonly attendanceImportConfig = inject(FormConfig);

  ngOnInit(): void {
    console.log("on init lo",this.activatedRoute.params)
    this.attendanceImportForm.set(this.attendanceImportConfig.getForm()['attendance-import'])
  }
}