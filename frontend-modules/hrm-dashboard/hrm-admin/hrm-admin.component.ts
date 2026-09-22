import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { HomeService } from 'src/app/modules/hrm-shared/components/home.service';
import { TruncatePipe } from 'src/app/modules/hrm-shared/core/shared/common/truncate.pipe';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { Department, EmployeeType, Holiday, HRMAdminDashboardData, LeaveApplication } from 'src/app/modules/hrm-dashboard/models/hrm-admin.model';
import { TabViewModule } from 'primeng/tabview';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'sanadi-hrm-admin',
  standalone: true,
  imports: [
    ChartModule,
    InputTextModule,
    TableModule,
    TabViewModule,
    PanelModule,
    InputIconModule,
    CommonModule,
    TruncatePipe,
    PaginatorModule,
    DropdownModule,
    IconFieldModule,
    ButtonModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './hrm-admin.component.html',
  styleUrl: './hrm-admin.component.scss'
})
export class HrmAdminComponent {
  empList: any = [];
  othersList: any = [];
  hrmDashboardData: HRMAdminDashboardData;

  departments: Department[] = [];

  employeeTypeData: any;
  employeeTypeOptions: any;
  employeeTypeLabels: string[] = [];
  employeeTypeDataValues: number[] = [];

  holidays: Holiday[] = [];

  leaveApplications: LeaveApplication[] = [];
  leaveApplicationPage: number = 1;
  leaveApplicationLoading: boolean = false;
  leaveApplicationRows: number = 12;
  leaveApplicationTotalRecords: number = 0;

  attendance: number = 0;
  totalEmployees: number = 0;

  months: string[];
  selectedMonth: string;
  currentYear: number = new Date().getFullYear();

  empPage: number = 1;
  empLoading: boolean = false;
  empRows: number = 10;
  empTotalRecords: number = 0;
  searchEmpText: string = undefined;

  othersPage: number = 1;
  othersLoading: boolean = false;
  othersRows: number = 10;
  othersTotalRecords: number = 0;
  searchothersText: string = undefined;

  // New properties for document filter
  documentNames: string[] = [];
  selectedDocument: string = 'all';
  documentOptions: any[] = [];
  selectedEmployeeDocument: string = 'all';
  employeeDocumentNames: string[] = [];
  employeeDocumentOptions: any[] = [];

  private readonly spinner = inject(NgxSpinnerService);

  constructor(
    private _homeService: HomeService,
    private apiService: ApiService,
  ) { }

  ngOnInit() {
    this.months = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    this.selectedMonth = this.months[currentMonthIndex];

    this.spinner.show();
    this.getHRMDashboardData();
    this.getEmpList();
    this.getOthersDocExpiryList();
    this.employeeTypeOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false
          },
          ticks: {
            display: false
          },
          border: {
            display: false
          }
        }
      },
    };
  }

  getHRMDashboardData() {
    this.leaveApplicationLoading = true;
    this._homeService.getHRMDashboardData(this.months.indexOf(this.selectedMonth) + 1, this.currentYear).subscribe({
      next: (data: any) => {
        this.hrmDashboardData = data;
        if (data.admin) {
          this.departments = data.departments;

          const employeeType = this.deserialiseEmployeeData(data.employee_type);
          this.employeeTypeData = {
            labels: employeeType.labels,
            datasets: [
              {
                label: 'Number of Employees',
                backgroundColor: ['#60147B', '#3F22B5', '#208153', '#0C619F'],
                hoverBackgroundColor: ['#B024E1', '#1B0F4F', '#071B11', '#042339'],
                borderRadius: 15,
                data: employeeType.data
              }
            ]
          };

          this.holidays = data.holidays;
          this.leaveApplications = data.leave_application;
          this.leaveApplicationTotalRecords = data.leave_application.length;
          this.attendance = data.todays_attendance;
          this.totalEmployees = data.total_no_of_employees;
        }
        this.leaveApplicationLoading = false;
        this.spinner.hide();
      },
      error: (error: any) => {
        console.error(error);
        this.leaveApplicationLoading = false;
        this.spinner.hide();
      }
    });
  }

  getLeaveApplicationList() {
    this.leaveApplications = this.hrmDashboardData.leave_application;
  }

  onLeaveApplicationPageChange(event: any) {
    this.leaveApplicationPage = event.page + 1;
    this.leaveApplicationRows = event.rows;
    this.getLeaveApplicationList();
  }

  deserialiseEmployeeData(employeeType: EmployeeType[]): { labels: string[], data: number[] } {
    const labels: string[] = [];
    const data: number[] = [];

    employeeType.forEach(item => {
      const [label, count] = Object.entries(item)[0];
      labels.push(label);
      data.push(count);
    });

    return { labels, data };
  }

  getOthersDocExpiryList() {
    this.othersLoading = true;
    let params = {
      page: this.othersPage,
      is_active: true,
      search: this.searchothersText || '',
      document_name: this.selectedEmployeeDocument !== 'all' ? this.selectedEmployeeDocument : ''
    }

    this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}others`, params).subscribe(
      (res: any) => {
        this.othersList = res.results || [];
        this.othersTotalRecords = res.count;
        this.employeeDocumentNames = res.document_names || [];
        this.employeeDocumentOptions = [
          { label: 'All Documents', value: 'all' },
          ...this.employeeDocumentNames.map(name => ({ label: name, value: name }))
        ];
        this.othersLoading = false;
      },
      (error) => {
        this.othersLoading = false;
      }
    );
  }


  onMonthChange(e: any) {
    this.selectedMonth = e.value
    this.getHRMDashboardData();
  }

  getEmpList() {
    this.empLoading = true;
    let params = {
      page: this.empPage,
      is_active: true,
      search: this.searchEmpText || '',
    }
    this.apiService.get(`${ServiceUrlConstants.EMPLOYEE_MASTER_CRUD}cicpaRenewalforWorkers`, params).subscribe(
      (res: any) => {
        this.empList = res.results;
        this.empTotalRecords = res.count;
        this.empLoading = false;
      },
      (error) => {
        this.empLoading = false;
      }
    );
  }

  onEmpPageChange(event: any) {
    this.empPage = event.page + 1;
    this.empTotalRecords = event.rows;
    this.getEmpList();
  }

  globalEmpSearch(event) {
    this.empPage = 1;
    this.searchEmpText = event?.target.value;
    this.getEmpList();
  }

  onEmployeeDocumentFilterChange() {
    this.othersPage = 1;
    this.getOthersDocExpiryList();
  }

  onothersPageChange(event: any) {
    this.othersPage = event.page + 1;
    this.othersRows = event.rows;
    this.getOthersDocExpiryList();
  }

  globalOthersSearch(event) {
    this.othersPage = 1;
    this.searchothersText = event?.target.value;
    this.getOthersDocExpiryList();
  }

  // New methods for document handling
  onDocumentFilterChange() {
    this.othersPage = 1;
    this.getOthersDocExpiryList();
  }

  viewDocument(documentUrl: string) {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  }
}
