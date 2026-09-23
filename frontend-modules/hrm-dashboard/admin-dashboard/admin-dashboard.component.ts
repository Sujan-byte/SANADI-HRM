import { CommonModule, NgFor } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService } from 'src/app/core/services/api.service';
import { ApprovalOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { CustomDialogService } from 'src/app/modules/hrm-shared/core/shared/services/custom-dialog';
import { DialogHandlerService } from 'src/app/modules/hrm-shared/core/shared/services/dialog-form.service';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { HomeService } from 'src/app/modules/hrm-shared/components/home.service';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'sanadi-admin-dashboard',
  standalone: true,
  imports: [ButtonModule, CalendarModule, FormsModule, CommonModule, TableModule, ChartModule, TooltipModule, NgFor, InputTextModule, InputGroupModule, InputGroupAddonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  dates: Date[] | undefined;
  holidayDescriptions: { [key: string]: string } = {}
  private apiService = inject(ApiService);
  private dialogHandlerService = inject(DialogHandlerService);
  public _customDialogService = inject(CustomDialogService);
  private spinner = inject(NgxSpinnerService);
  private readonly secureStorage = inject(EncryptedStorageService);

  username: string;
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
  barChartData: any = [];
  barChartOptions: any;
  totalEmployees: any;
  totalWorkerCount: any;
  totalStaffCount: any;
  employeeOnLeave: any;


  // MODAL
  showLeavePopup = false;
  employeesOnLeave: any[] = [];
  filteredEmployees: any[] = [];
  employeesOnLeaveLoading = false;
  searchTerm: string = '';


  constructor(public _homeService: HomeService
  ) {

  }

  async ngOnInit() {
    this.username = await this.secureStorage.getItem('first_name');
    this.spinner.show();
    this.getDashBoardCountData();
    this.barChartData = {
      labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
      datasets: [
        {
          type: 'bar',
          label: 'Staff',
          backgroundColor: '#560D8B',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
          type: 'bar',
          label: 'Worker',
          backgroundColor: '#973FE4',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
      ]
    };
    this.barChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          align: 'start',
          position: 'top',
          labels: {
            color: 'black',
            boxWidth: 10,
            boxHeight: 10,
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#878787',
            font: {
              weight: 500
            }
          },
          grid: {
            color: 'white',
            drawBorder: false
          }
        },
        y: {
          display: false,
          grid: {
            drawTicks: false,
            drawBorder: false,
            color: 'white'
          },
          ticks: {
            display: false
          }
        }

      }
    };

    this.getHolidayList();
  }

  handleEmployee() {

  }

  getDescription(dateMeta): string {
    if (!dateMeta || dateMeta.otherMonth || dateMeta.disabled) return '';
    const jsDate = new Date(dateMeta.year, dateMeta.month, dateMeta.day);
    const formatted = jsDate.toISOString().split('T')[0];
    return this.holidayDescriptions[formatted] || '';
  }

  async getHolidayList() {
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
      this.apiService.get(`${HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD}get_all_holiday_dates/?approval_status=APPROVED`).subscribe((holidays: any) => {
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

  async onMonthChange(event) {
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
      this.apiService.get(`${HrmServiceUrlConstants.HOLIDAY_MASTER_CRUD}get_all_holiday_dates/?approval_status=APPROVED`, { month: event?.month, year: event?.year }).subscribe((holidays: any) => {
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

  onAppliedLeavePageChange(event: any) {
    this.appliedLeavePage = event.first / event.rows + 1;
    this.getAppliedLeaveData();
  }

  async getAppliedLeaveData() {
    this.appliedLeaveLoading = true;
    const accessToken = await this.secureStorage.getItem('accessToken');
    if (accessToken) {
      this.apiService.get(HrmServiceUrlConstants.LEAVE_ENTRY_CRUD, {
        is_active: true,
        page: this.appliedLeavePage,
        page_size: 10,
        required_fields: "id,employee,leave_type,from_date,to_date,no_of_days,approval_status",
        approval_status: ApprovalOptions.PENDING_APPROVAL,
      }).subscribe((res: any) => {
        this.appliedLeaveTotalRecords = res?.count;
        this.appliedLeaveData = res?.results;
        this.appliedLeaveLoading = false;
      });
    }

    this.appliedLeaveColumns = [
      { field: 'employee_code', header: 'Emp Code' },
      { field: 'first_name', header: 'Emp Name' },
      { field: 'leave_types', header: 'Leave Type' },
      { field: 'from_date', header: 'From Date' },
      { field: 'to_date', header: 'To Date' },
      { field: 'no_of_days', header: 'No Of Days' },
      { field: 'status', header: 'Status' },
    ];
  }

  onAppliedLeaveApplicationPageChange(event: any) {
    this.appliedLeaveApplicationPage = event.first / event.rows + 1;
    this.getAppliedLeaveApplicationData();
  }



  getAppliedLeaveApplicationData() {
    this.appliedLeaveApplicationLoading = true;
    this.apiService.get(HrmServiceUrlConstants.LEAVE_APPLICATION_CRUD, {
      is_active: true,
      page: this.appliedLeaveApplicationPage,
      page_size: 10,
      required_fields: "id,employee_code,new_leave_start_date,new_leave_end_date,leave_days_applied,approval_status,approval_remarks",
      approval_status: ApprovalOptions.PENDING_APPROVAL,
    }).subscribe((res: any) => {
      this.appliedLeaveApplicationTotalRecords = res?.count;
      this.appliedLeaveApplicationData = res?.results;
      this.appliedLeaveApplicationLoading = false;
    });

    this.appliedLeaveApplicationColumns = [
      { field: 'employee_code_code', header: 'Emp Code' },
      { field: 'employee_name', header: 'Emp Name' },
      { field: 'new_leave_start_date', header: 'From Date' },
      { field: 'new_leave_end_date', header: 'To Date' },
      { field: 'leave_days_applied', header: 'No Of Days' },
      { field: 'approval_remarks', header: 'Status' },
    ];
  }

  getDashBoardCountData() {
    this._homeService.getDashboardCountData().subscribe({
      next: (data: any) => {
        this.totalEmployees = data?.total_employees ?? 0;
        this.totalWorkerCount = data?.total_worker_count ?? 0;
        this.totalStaffCount = data?.total_staff_count ?? 0;
        this.employeeOnLeave = data?.employee_on_leave ?? 0;
        this.barChartData = {
          labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [
            {
              type: 'bar',
              label: 'Group-1',
              backgroundColor: '#560D8B',
              data: data?.staff_counts ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
            {
              type: 'bar',
              label: 'Group-2',
              backgroundColor: '#973FE4',
              data: data?.worker_counts ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            },
          ]
        };
        this.spinner.hide();
      },
      error: () => this.spinner.hide()
    })
  }



  // MODAL TO DISPLAY DATA
  openLeavePopup() {
    this.getEmployeesOnLeaveDetails();
  }

  closeLeavePopup() {
    this.showLeavePopup = false;
    this.employeesOnLeave = []; // : clear data when closing
    this.filteredEmployees = []; // Clear filtered data as well
    this.searchTerm = ''; // Reset search term
  }

  getEmployeesOnLeaveDetails() {
    this.employeesOnLeaveLoading = true;

    this.apiService.get(HrmServiceUrlConstants.DASHBOARD_LEAVE_TODAY_CRUD)
      .subscribe({
        next: (response: any) => {
          // Transform data to match HTML's 7 columns
          this.employeesOnLeave = (response.results || []).map((item: any) => ({
            srNo: item.sr_no,
            empId: item.emp_id,
            empName: item.emp_name,
            designation: item.designation,
            department: item.department,
            fromDate: item.from_date,
            toDate: item.to_date,
            group: item.employee_group,
          }));

          this.filteredEmployees = [...this.employeesOnLeave]; // Initialize filtered data

          this.employeesOnLeaveLoading = false;
          this.showLeavePopup = true;
        },
        error: (error) => {
          this.employeesOnLeaveLoading = false;
        }
      });
  }

  // NEW: Filter function for search
  @ViewChild('dt') table!: any;

  filterLeaveData() {
    if (!this.searchTerm) {
      this.filteredEmployees = [...this.employeesOnLeave];
          if (this.table) {
      this.table.reset();
    }
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();

    this.filteredEmployees = this.employeesOnLeave.filter(employee => {
      return (
        (employee.empId && employee.empId.toString().toLowerCase().includes(term)) ||
        (employee.empName && employee.empName.toLowerCase().includes(term)) ||
        (employee.designation && employee.designation.toLowerCase().includes(term)) ||
        (employee.department && employee.department.toLowerCase().includes(term)) ||
        (employee.fromDate && employee.fromDate.toString().toLowerCase().includes(term)) ||
        (employee.toDate && employee.toDate.toString().toLowerCase().includes(term))
      );

    });

  if (this.table) {
    this.table.reset();
  }
  }

  // NEW: Clear search function
  clearSearch() {
    this.searchTerm = '';
    this.filteredEmployees = [...this.employeesOnLeave];
      if (this.table) {
    this.table.reset();
  }
  }
}
