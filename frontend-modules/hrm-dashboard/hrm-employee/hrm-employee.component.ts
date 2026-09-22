import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { HomeService } from 'src/app/modules/hrm-shared/components/home.service';
import { TruncatePipe } from 'src/app/modules/hrm-shared/core/shared/common/truncate.pipe';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Holiday, HRMEmployeeDashboardData, Leave, LeaveApplication } from 'src/app/modules/hrm-dashboard/models/hrm-employee.model';

@Component({
  selector: 'sanadi-hrm-employee',
  standalone: true,
  imports: [CommonModule, TableModule, TruncatePipe, FormsModule, DropdownModule],
  templateUrl: './hrm-employee.component.html',
  styleUrl: './hrm-employee.component.scss'
})
export class HrmEmployeeComponent {
  holidays: Holiday[] = [];
  leaveApplications: LeaveApplication[] = [];
  totalNoOfLeaves: number = 0;
  leavesApplied: number = 0;
  totalLeaves: Leave[] = [];

  months: string[];
  selectedMonth: string;
  currentYear: number = new Date().getFullYear();

  constructor(private _homeService: HomeService) { }

  ngOnInit() {
    this.months = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ];
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    this.selectedMonth = this.months[currentMonthIndex];

    this.getHRMDashboardData();
  }

  getHRMDashboardData() {
    this._homeService.getHRMDashboardData(this.months.indexOf(this.selectedMonth) + 1, this.currentYear).subscribe((data: HRMEmployeeDashboardData) => {
      console.log("asdfg",data)
      if(!data.admin_employee) {
        this.holidays = data.holidays;
        this.leaveApplications = data.leave_application;
        this.totalLeaves = data.leaves;
        this.totalNoOfLeaves = data.total_leaves;
        this.leavesApplied = data.number_of_leave_applied;
        // this.calculateLeaves();
      }
    }, (error) => {
      console.log(error);
    });
  }

  // calculateLeaves() {
  //   this.totalNoOfLeaves = this.totalLeaves.reduce((acc, leave) => acc + (leave.allocated_leaves - leave.available_leaves), 0);
  //   this.leavesApplied = this.leaveApplications.reduce((acc, leave) => acc + leave.no_of_days, 0);
  // }

  onMonthChange(e: any) {
    this.selectedMonth = e.value
    this.getHRMDashboardData();
  }
}
