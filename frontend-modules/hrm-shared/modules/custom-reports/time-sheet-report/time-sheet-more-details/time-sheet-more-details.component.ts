import { HttpParams } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxPermissionsService } from 'ngx-permissions';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ApprovalOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { TimeSheetDetailsEnum } from 'src/app/modules/hrm-main/hrm-enum/attendance.enum';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-time-sheet-more-details',
  standalone: true,
  imports: [InputTextModule,AccordionModule,ButtonModule,InputTextareaModule,FormsModule],
  templateUrl: './time-sheet-more-details.component.html',
  styleUrl: './time-sheet-more-details.component.scss'
})
export class TimeSheetMoreDetailsComponent implements OnInit {
  dialogRef = inject(DynamicDialogRef)
  dialogConfig = inject(DynamicDialogConfig)
  apiService = inject(ApiService)
  private sharedService = inject(SharedService)
  private permissionService = inject(NgxPermissionsService)
  moreDetails;
  clonedMoreDetails;
  employeeDetails: any;

  ngOnInit(): void {
    if (this.dialogConfig.data?.data) {
        this.moreDetails = this.dialogConfig.data?.data;
        this.clonedMoreDetails = {...this.moreDetails};
        this.getEmployeeDetailByEmpCode(this.dialogConfig.data?.data?.employee_code)
        console.log("more details",this.moreDetails)
    }
  }

  getEmployeeDetailByEmpCode(empCode){
    this.apiService.get(ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,{employee_code:empCode}).subscribe((res:any)=>{
      if(res?.results?.length){
        this.employeeDetails = res?.results[0];
        console.log("employee details",this.employeeDetails)
      }
    })
  }


  
    saveAttendanceDetails() {
      // return new Promise((resolve) => {
      //   let params = new HttpParams();
  
      //   if (this.check_permission('hrm_main.custom_can_approve_timesheet')) {
      //     this.moreDetails.approval_status = ApprovalOptions.APPROVED;
      //   }
      //   else {
      //     params = new HttpParams().set('time_sheet_editing', true)
      //   }

      //   this.apiService.put(`${ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD}${ this.moreDetails?.id}/`,  this.moreDetails, params).subscribe((res) => {
      //     console.log("res", res)
      //     this.sharedService.handleSuccess('Saved Successfully!');
      //     this.dialogRef.close(this.clonedMoreDetails);
      //   })
      // })
      this.moreDetails.editing=true;
     this.dialogRef.close(this.clonedMoreDetails);
    }


    check_permission(permission): boolean {
      if (this.permissionService.getPermission(permission)) {
        return true;
      } else {
        return false;
      }
    }

    onChagePermittedOT(event) {
      console.log("event", event, event?.target.value);
      
      const value = event?.target.value;
      let minutes = 0;
      let seconds = 0;
  
      if (value.includes('.')) {
          [minutes, seconds] = value.split('.').map(Number);
      } else {
          minutes = Number(value);
          seconds = 0; // Default seconds to 0 if not provided
      }
  
      const permittedOT = (minutes * 60 + seconds).toString();
      this.moreDetails[TimeSheetDetailsEnum.permittedOT] = permittedOT;
      console.log("permitted ot", permittedOT);
  }

  onCloseMoreDetails(){
    console.log("cloned details",this.clonedMoreDetails)
    this.moreDetails[TimeSheetDetailsEnum.permittedOT] = this.clonedMoreDetails?.[TimeSheetDetailsEnum.permittedOT];
    this.moreDetails[TimeSheetDetailsEnum.convertedPermittedOT] = this.clonedMoreDetails?.[TimeSheetDetailsEnum.convertedPermittedOT]
    this.moreDetails[TimeSheetDetailsEnum.remarks] = this.clonedMoreDetails?.[TimeSheetDetailsEnum.remarks]
    this.dialogRef.close();
  }
}
