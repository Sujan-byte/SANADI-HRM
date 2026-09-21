import { CommonModule, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxPermissionsModule } from 'ngx-permissions';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from 'src/app/core/services/api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApprovalOptions } from 'src/app/core/shared/common/enum/app.enum';
import { LeaveApplicationFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-application-form.config.service';
import { leaveEntryConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-entry-form.config.service';
import { LeaveMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-master-form.config.service';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DialogHandlerService } from 'src/app/core/shared/services/dialog-form.service';
import { EncryptedStorageService } from 'src/app/core/shared/services/secure-cookie-service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { LeaveApplicationComponent } from 'src/app/modules/hrm-master/leave-application/leave-application.component';
import { LeaveEntryComponent } from 'src/app/modules/hrm-master/leave-entry/leave-entry.component';
import { LeaveMasterComponent } from 'src/app/modules/hrm-master/leave-master/leave-master.component';
import { LeavePolicyComponent } from 'src/app/modules/hrm-master/leave-policy/leave-policy.component';

@Component({
  selector: 'sanadi-staff-dashboard',
  standalone: true,
  imports: [ButtonModule, CalendarModule, FormsModule, CommonModule, TableModule, ChartModule, TooltipModule, NgFor, NgxPermissionsModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss'
})
export class StaffDashboardComponent {
  username: string;
  dates: Date[] | undefined;
  holidayDescriptions: { [key: string]: string } = {}
  private apiService = inject(ApiService);
  private dialogHandlerService = inject(DialogHandlerService);
  public _customDialogService = inject(CustomDialogService);
  private spinner = inject(NgxSpinnerService);
  private readonly secureStorage = inject(EncryptedStorageService);
  private leaveDetailsComp = new LeaveMasterComponent();
  private leaveDetailsForm = inject(LeaveMasterFormConfig);
  private leaveEntryComp = new LeaveEntryComponent();
  private leaveEntryForm = inject(leaveEntryConfig);
  private leaveApplicationComp = new LeaveApplicationComponent();
  private leaveApplicationForm = inject(LeaveApplicationFormConfig);
  private leavePolicyComp = new LeavePolicyComponent();
  appliedLeaveData: any = [];
  appliedLeaveColumns: any = [];
  appliedLeaveLoading = false;
  appliedLeaveTotalRecords = 0;
  appliedLeavePage = 1;

  appliedLeaveApplicationData: any = [];
  appliedLeaveApplicationColumns: any = [];
  appliedLeaveApplicationLoading = false;
  appliedLeaveApplicationTotalRecords = 0;
  appliedLeaveApplicationPage = 1;

  chartOptions: any;
  chartData: any;
  userId: any;
  financialYear: any;
  totalLeaves: any = 0;
  leaveDetails: any = 0;
  carryForwardLeave: number;
  lapseLeave: number;
  startYear: number;
  endYear: any;
  totalUsedLeaves: any;
  leaveMasterId: any = null;
  chartColors: string[];
  chartLabels: any[];
  employeeType: string;
  employeeDesignationName: string;
  employeeCode: string;
  employeeDepartmentName: string;
  availedAnnualLeave: any;
  availableAnnualLeave: any;
  doj: string;
  dataReady = false;

  async ngOnInit(): Promise<void> {
    this.spinner.show();
    this.getFinancialYear();
    // Resolve userId before the lazily-loaded "Applied Leaves" table can render -
    // otherwise its first onLazyLoad fires while userId is still unset and the
    // request goes out with employee__user__id empty, which the API rejects.
    this.userId = await this.secureStorage.getItem('user_id');
    this.dataReady = true;
    this.username = await this.secureStorage.getItem('first_name');
    this.employeeDesignationName = await this.secureStorage.getItem('employeeDesignationName');
    this.employeeDepartmentName = await this.secureStorage.getItem('employeeDepartmentName');
    this.employeeCode = await this.secureStorage.getItem('employeeCode');
    this.getDateOfJoining();
    this.getHolidayList();
    this.getLeaveDetails();
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    // this.chartData = {
    //   labels: ['Total Availed Leaves', 'Sick Leave', 'Annual Leave'],
    //   datasets: [
    //     {
    //       data: [0, 0, 0],
    //       backgroundColor: ['#E4E4E4', '#CCACF1', '#4F0F98'],
    //       hoverBackgroundColor: ['#E4E4E4', '#CCACF1', '#4F0F98'],
    //       hoverOffset: 4,
    //       borderColor: '#F1F4F8',
    //       hoverBorderColor: '#F1F4F8'
    //     }
    //   ]
    // }

    // this.chartOptions = {
    //   cutout: '75%',
    //   plugins: {
    //     legend: {
    //       align: 'start', 
    //       position: 'top',
    //       labels: {
    //           color: textColor,
    //           boxWidth: 10,
    //           boxHeight: 10,
    //       }
    //     },
    //     tooltip: {
    //       callbacks: {
    //         label: function (context: any) {
    //           return context.label + ': ' + context.raw;
    //         }
    //       }
    //     }
    //   },
    //   animation: {
    //     duration: 0 // disable the initial animation
    //   },
    // };
  }

  async getDateOfJoining() {
    const employeeId = await this.secureStorage.getItem('employeeId');
    if (!employeeId) {
      return;
    }
    this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}${employeeId}`).subscribe((res: any) => {
      this.doj = res?.doj;
    });
  }

  async getHolidayList(){
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
    this.apiService.get(`${ServiceUrlConstants.HOLIDAY_MASTER_CRUD}get_all_holiday_dates/?approval_status=APPROVED`).subscribe((holidays: any) => {
      this.holidayDescriptions = {};
      this.dates = holidays;
      holidays.forEach(h => {
        const dateObj = new Date(h.date);
        const prevDateObj = new Date(dateObj);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        this.dates.push(dateObj);
        const prevDateStr = prevDateObj.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
        this.holidayDescriptions[prevDateStr] = h.description;
      });
    })
  }
}

  async onMonthChange(event){
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
    this.apiService.get(`${ServiceUrlConstants.HOLIDAY_MASTER_CRUD}get_all_holiday_dates/?approval_status=APPROVED`,{month:event?.month,year:event?.year}).subscribe((holidays: any) => {
      this.holidayDescriptions = {};
      this.dates = [];
      holidays.forEach(h => {
        const dateObj = new Date(h.date);
        
        const prevDateObj = new Date(dateObj);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        this.dates.push(dateObj);
        const prevDateStr = prevDateObj.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
        this.holidayDescriptions[prevDateStr] = h.description;
      });
      
    })
  }
}


  
  getDescription(dateMeta): string {
    if (!dateMeta || dateMeta.otherMonth || dateMeta.disabled) return '';
    const jsDate = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
    const formatted = jsDate.toISOString().split('T')[0]; 
    return this.holidayDescriptions[formatted] || '';
  }

  onAppliedLeavePageChange(event: any){
    this.appliedLeavePage = event.first / event.rows + 1;
    this.getAppliedLeaveData();
  }

  async getAppliedLeaveData() {
    this.appliedLeaveLoading = true;
     const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
    this.apiService.get(ServiceUrlConstants.LEAVE_ENTRY_CRUD, {
      is_active: true,
      page: this.appliedLeavePage,
      page_size: 10,
      required_fields: "id,leave_type,from_date,to_date,no_of_days,approval_status",
      approval_status: ApprovalOptions.PENDING_APPROVAL,
      employee__user__id: this.userId,
    }).subscribe((res: any) => {
      this.appliedLeaveTotalRecords = res?.count;
      this.appliedLeaveData = res?.results;
      this.appliedLeaveLoading = false;
    });
  }

    this.appliedLeaveColumns = [
      { field: 'leave_types', header: 'Leave Type' },
      { field: 'from_date', header: 'From Date' },
      { field: 'to_date', header: 'To Date' },
      { field: 'no_of_days', header: 'No Of Days' },
      { field: 'status', header: 'Status' },
    ];
  }

  onAppliedLeaveApplicationPageChange(event: any){
    this.appliedLeaveApplicationPage = event.first / event.rows + 1;
    this.getAppliedLeaveApplicationData();
  }

  async getAppliedLeaveApplicationData() {
    this.appliedLeaveApplicationLoading = true;
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
      this.apiService.get(ServiceUrlConstants.LEAVE_APPLICATION_CRUD, {
        is_active: true,
        page: this.appliedLeaveApplicationPage,
        page_size: 10,
        required_fields: "id,employee_code,new_leave_start_date,new_leave_end_date,leave_days_applied,approval_status,approval_remarks",
        approval_status: ApprovalOptions.PENDING_APPROVAL,
        // approval_stages__user: this.userId,
      }).subscribe((res: any) => {
        this.appliedLeaveApplicationTotalRecords = res?.count;
        this.appliedLeaveApplicationData = res?.results;
        this.appliedLeaveApplicationLoading = false;
      });
    }

    this.appliedLeaveApplicationColumns = [
      { field: 'employee_code_code', header: 'Emp Code' },
      { field: 'employee_name', header: 'Emp Name' },
      { field: 'new_leave_start_date', header: 'From Date' },
      { field: 'new_leave_end_date', header: 'To Date' },
      { field: 'leave_days_applied', header: 'No Of Days' },
      { field: 'approval_remarks', header: 'Status' },
    ];
  }

  async handleLeaveDetails(){
    if(this.leaveMasterId){
      const data: any = await this.getLeaveMasterById(this.leaveMasterId);
      const response: any = await this.dialogHandlerService.openDialog(this.leaveDetailsComp.leaveMastersConfig(), this.leaveDetailsForm.LeaveMasterForm(), true, data);
    }
  }

  async handleLeaveApplication(){
    const response: any = await this.dialogHandlerService.openDialog(this.leaveApplicationComp.leaveApplicationsConfig(), this.leaveApplicationForm.LeaveApplicationForm());
  }

  async handleLeaveEntry(){
    const response: any = await this.dialogHandlerService.openDialog(this.leaveEntryComp.leaveEntriesConfig(), this.leaveEntryForm.LeaveEntryForm());
  }

  async handleLeavePolicy(){
    const response: any = await this._customDialogService.openDialog(this.leavePolicyComp.leavePolicyConfig(), LeavePolicyComponent);
  }

  async getLeaveDetails(){
    this.financialYear = this.getFinancialYear();
    const accessToken = await this.secureStorage.getItem('accessToken');
    const data: any = accessToken ? await this.getLeaveMasterByUserId(this.userId, this.financialYear) : { results: [] };
    if(data?.results.length > 0){
      this.totalLeaves = data?.results[0].total_allocated_leaves;
      this.totalUsedLeaves = data?.results[0].total_utilized_leaves;
      this.leaveMasterId = data?.results[0].leave_master;
    }else{
      this.totalLeaves = 0;
      this.totalUsedLeaves = 0;
      this.leaveMasterId = null;
    }

    this.leaveDetails = data?.results;

    const allColors = [
      '#E4E4E4',  // light gray (moved to end since it's neutral, not purple)
      '#E0C3FC', // soft pastel purple
      '#CCACF1', // light purple
      '#9B59B6', // amethyst
      '#8E44AD', // dark lavender
      '#732E91', // deep purple
      '#5D2A84', // rich grape
      '#4F0F98', // vivid deep violet
    ];

    this.chartLabels = [...data.results.map((item) => item.leave_type)];
    this.chartColors = allColors.slice(0, data.results.length + 1);

    this.chartData = {
      labels: [...data.results.map((item) => item.leave_type)],
      datasets: [
        {
          data: [...data.results.map((item) => item.allocated_leaves)],
          backgroundColor: allColors.slice(0, data.results.length + 1),
          hoverBackgroundColor: allColors.slice(0, data.results.length + 1),
          hoverOffset: 4,
          borderColor: '#F1F4F8',
          hoverBorderColor: '#F1F4F8'
        }
      ]
    };

    this.chartOptions = {
      cutout: '75%',
      plugins: {
        legend: {
          display: false,
          align: 'start', 
          position: 'top',
          labels: {
              // color: textColor,
              boxWidth: 10,
              boxHeight: 10,
          }
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return context.raw;
            }
          }
        }
      },
      animation: {
        duration: 0 // disable the initial animation
      },
    };

    this.carryForwardLeave = 0;
    this.lapseLeave = 0;
    data?.results.filter((item)=>{
      if(item.leave_type == "Annual Leave"){
        this.carryForwardLeave = item.carry_forward_days ?? 0;
        this.lapseLeave = item.lapse_days ?? 0;
        this.availedAnnualLeave = item.utilized_leaves ?? 0;
        this.availableAnnualLeave = item.available_leaves ?? 0;
      }
    });
    this.spinner.hide();
  }

  getLeaveMasterByUserId(userId: any, financialYear: any){
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_DETAILS_CRUD}?leave_master__employee__user__id=${userId}&financial_year=${financialYear}`).subscribe((res: any) => {
        resolve(res);
      })
    })
  }

  getLeaveMasterById(leaveMasterId: any){
    return new Promise((resolve) => {
      this.apiService.get(`${ServiceUrlConstants.LEAVE_MASTER_CRUD}${leaveMasterId}`).subscribe((res: any) => {
        resolve(res);
      })
    })
  }

  getFinancialYear(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
  
    this.startYear = month >= 3 ? year : year - 1;
    this.endYear = this.startYear + 1;
  
    return `${this.startYear}-${this.endYear}`;
  }
}
