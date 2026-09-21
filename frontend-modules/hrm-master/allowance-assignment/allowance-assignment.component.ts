import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TableFilterComponent } from 'src/app/sanadi-library/table-filter/table-filter.component';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { AllowanceAssignmentFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/allowance-assignment-form.config.service';
import { DialogService } from 'primeng/dynamicdialog';
import { AllowanceRegisterDialogComponent } from './allowance-register-dialog/allowance-register-dialog.component';

@Component({
  selector: 'app-allowance-assignment',
  standalone: true,
  imports: [TableFilterComponent],
  providers: [DialogService],
  templateUrl: './allowance-assignment.component.html',
  styleUrls: ['./allowance-assignment.component.scss'],
})
export class AllowanceAssignmentComponent implements OnInit {
  private translate         = inject(TranslateService);
  private formConfigService = inject(AllowanceAssignmentFormConfig);
  private dialogService     = inject(DialogService);

  allowanceAssignmentConfig = signal<any>({
    formName:  'allowance-assignment',
    pageTitle: 'Allowance Management',
    tableHeaders: [
      { label: this.translate.instant('assignmentCode_TC')   || 'Code',           field: 'assignment_code',  isFilterRequired: false },
      { label: this.translate.instant('allowanceCode_TC')    || 'Allowance Code', field: 'allowance_code',   isFilterRequired: false },
      { label: this.translate.instant('allowanceName_TC')    || 'Allowance Name', field: 'allowance_name',   isFilterRequired: false },
      { label: this.translate.instant('mode_TC')             || 'Mode',           field: 'mode',             isFilterRequired: false },
      { label: this.translate.instant('fromDate_TC')         || 'From Date',      field: 'from_date',        isFilterRequired: false },
      { label: this.translate.instant('toDate_TC')           || 'To Date',        field: 'to_date',          isFilterRequired: false },
      { label: this.translate.instant('filterBy_TC')         || 'Filter By',      field: 'filter_criteria',  isFilterRequired: false },
      { label: this.translate.instant('employeeCount_TC')    || 'Employees',      field: 'employee_count',   isFilterRequired: false },
      { label: this.translate.instant('approvalStatus_TC')   || 'Status',         field: 'approval_status',  isFilterRequired: false },
    ],
    tableBody: [
      'assignment_code',
      'allowance_code',
      'allowance_name',
      {
        field: 'mode',
        updateValue: (row: any) => {
          const val = row?.mode;
          return val === 'manual' ? 'Manual' : val === 'auto' ? 'Auto' : val;
        },
      },
      'from_date',
      'to_date',
      {
        field: 'filter_criteria',
        updateValue: (row: any) => {
          const map: Record<string, string> = {
            employee_wise: 'Individual',
            designation:   'Designation',
            department:    'Department',
          };
          return map[row?.filter_criteria] || row?.filter_criteria || '';
        },
      },
      'employee_count',
      {
        field: 'approval_status',
        updateValue: (row: any) => {
          const map: Record<string, string> = {
            PENDING_APPROVAL: 'Pending',
            APPROVED:         'Approved',
            REJECTED:         'Rejected',
            NOT_APPROVED:     'Not Approved',
            CANCELLED:        'Cancelled',
          };
          return map[row?.approval_status] || row?.approval_status || '';
        },
      },
    ],
    editable: true,
    isShowDialog: true,
    url: {
      get:        `${ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}batch_list/`,
      // get_by_pk: getApiDataByID calls url.get_by_pk + item.id
      // item.id from batch_list = '{batch_id}/get_by_batch'
      // → GET /master/allowance-assignment/{batch_id}/get_by_batch/
      get_by_pk:  `${ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}`,
      post:       `${ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}bulk_create/`,
      // footer builds: url.put + item.id + '/'
      // get_by_batch returns id = '{batch_id}/bulk_update_by_batch'
      // → PUT /master/allowance-assignment/{batch_id}/bulk_update_by_batch/
      put:        `${ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}`,
      delete:     `${ServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}bulk_delete/`,
    },
    captionButton: [
      {
        show:       true,
        icon:       'list',
        label:      'Allowance Register',
        toolTip:    'View and export approved allowance assignments by employee, department, designation or allowance',
        actionType: 'ALLOWANCE_REGISTER',
        onClick:    () => this.openRegister(),
      },
    ],
    toolBarActionConfig: {
      newButton:      true,
      activeButton:   true,
      inActiveButton: true,
    },
    actions: [
      {
        label:      this.translate.instant('edit_TC') || 'Edit',
        icon:       'pi pi-pencil',
        actionType: 'EDIT',
        // getById=true → table-filter calls getApiDataByID(item.id)
        // which GETs url.get_by_pk + item.id
        // backend get_by_batch returns full data incl. employees + the correct id for PUT
        getById:    true,
      },
    ],
    dialogData: {},
    // Keep Save enabled even after approval — allowance can always be re-edited
    saveConfig: { disableFunction: () => false },
    // updateConfig: backend get_by_batch builds all edit data — no frontend work needed
    updateConfig: async (cfg: any, item: any) => {
      // Seed the picker so Generate re-opens with prior selections pre-ticked
      if (item?.batch_id) {
        this.formConfigService.seedEditState(item, item?.employees || []);
      }
      return { config: cfg, item };
    },
  });

  allowanceAssignmentForm = signal<any>(null);

  openRegister(): void {
    this.dialogService.open(AllowanceRegisterDialogComponent, {
      header:       'Allowance Register',
      width:        '92vw',
      height:       '88vh',
      contentStyle: { overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
      maximizable:  true,
    });
  }

  ngOnInit(): void {
    this.allowanceAssignmentForm.set(this.formConfigService.AllowanceAssignmentForm());
  }
}
