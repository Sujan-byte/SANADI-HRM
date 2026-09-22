import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FilterOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { FormConfig } from 'src/app/modules/hrm-shared/core/shared/common/form-config.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { TableFilterComponent } from 'src/app/modules/hrm-shared/sanadi-library/table-filter/table-filter.component';

@Component({
  selector: 'sanadi-ticket-master',
  standalone: true,
  imports: [TableFilterComponent],
  templateUrl: './ticket-master.component.html',
  styleUrl: './ticket-master.component.scss'
})
export class TicketMasterComponent {
 private translate = inject(TranslateService);
  private readonly ticketMasterRequiredFields = signal('id,employee,ticket_sector,last_ticket_availed,next_ticket_eligible_period')
  ticketMastersConfig = signal({
    formName: 'ticket-master',
    pageTitle: this.translate.instant('ticketMaster_TC'),
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
        label: 'ticket_sector_TC',
        field: 'ticket_sector',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'last_ticket_availed_TC',
        field: 'last_ticket_availed',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      },
      {
        label: 'next_ticket_eligible_period_TC',
        field: 'next_ticket_eligible_period',
        matchModeOptions: [
          { label: 'Starts With', value: FilterOptions.istartsWith },
          { label: 'Ends With', value: FilterOptions.iendsWith },
          { label: 'Contains', value: FilterOptions.iContains },
          { label: 'Equal', value: FilterOptions.iExact },
        ],
        isFilterRequired: true,
      }
    ],
    tableBody: ['employee_code', 'employee_name', 'ticket_sector', 'last_ticket_availed', 'next_ticket_eligible_period'],
    editable: true,
    params:{
      get:{required_fields:this.ticketMasterRequiredFields()}
    },
    url: {
      post: ServiceUrlConstants.TICKET_MASTER,
      get: ServiceUrlConstants.TICKET_MASTER,
      delete: ServiceUrlConstants.TICKET_MASTER,
      put: ServiceUrlConstants.TICKET_MASTER,
    },
    actions: [
      {
        label: '',
        icon: 'pencil',
        getById:true,
        actionType: 'EDIT',
        tooltip: 'Edit',
      }
    ],
    toolBarActionConfig:{
      activeButton:false,
      inActiveButton:false
    },
    dialogData: {},
    isShowDialog: true,
  });

  ticketMasterForm = signal(null);

  private readonly ticketMasterConfig = inject(FormConfig);

  ngOnInit(): void {
    this.ticketMasterForm.set(this.ticketMasterConfig.getForm()['ticket-master'])
  }
}
