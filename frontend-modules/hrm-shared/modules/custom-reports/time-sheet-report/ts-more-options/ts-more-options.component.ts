import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ApiService } from 'src/app/core/services/api.service';
import { BranchTypes } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Component({
  selector: 'sanadi-ts-more-options',
  standalone: true,
  imports: [CommonModule, RadioButtonModule, FormsModule, DropdownModule, InputSwitchModule, NgxPermissionsModule],
  templateUrl: './ts-more-options.component.html',
  styleUrl: './ts-more-options.component.scss'
})
export class TsMoreOptionsComponent implements OnInit {
  selectedType: any = 'C';
  isProcessed: boolean = true;
  timeSheetTypes = [
    { name: 'Consolidated', key: 'C', hide:false},
    { name: 'BreakDown', key: 'B', hide:true}
  ];

  employeeReportingTypes = [
    { name: 'Direct', key: 'Direct', hide:false},
    { name: 'Indirect', key: 'Indirect', hide:false},
    { name: 'All', key: 'All', hide:false},
  ];
  selectedEmployeeReportingType='All';

  employeeType = signal([]);
  selectedEmployeeType;


  employeeGroup = signal([])
  selectedEmployeeGroup;
  branch: any;

  private apiService = inject(ApiService)
  private permissionService = inject(NgxPermissionsService)
  onClearEmployeeType() {

  }

  ngOnInit(): void {
    this.branch = localStorage.getItem('b_id');
    this.getEmployeeTypes();
    this.getEmployeeGroup();
  }

  onClearEmployeeGroup() {

  }

  getEmployeeTypes() {
    this.apiService.get(ServiceUrlConstants.GLOBAL_MASTER_CRUD, { global_key: 'employee_type' }).subscribe((res: any) => {
      console.log("employee types", res)
      if (res?.results?.length) {
        this.employeeType.set(res?.results[0]?.global_value || []);
      }
    })
  }

  getEmployeeGroup() {
    this.apiService.get(ServiceUrlConstants.GLOBAL_MASTER_CRUD, { global_key: 'employee_group' }).subscribe((res: any) => {
      console.log("employee types", res)
      if (res?.results?.length) {
        this.employeeGroup.set(res?.results[0]?.global_value || []);
      }
    })
  }

  showToggleProcessedButton() {
    if(this.checkIsSuperUser()){
      if (this.branch == BranchTypes.ASFIC && this.selectedType == 'C') {
        return false;
      }
      else {
        return true;
      }
    }
    else{
      return false;
    }
  }

  
  check_permission(permission): boolean {
    if (this.permissionService.getPermission(permission)) {
      return true;
    } else {
      return false;
    }
  }

  checkIsSuperUser(){
    return localStorage.getItem('is_superuser')=='true';
  }

  onChangeEmployeeReporting(event){
    if(event?.value=='Direct'){
     this.timeSheetTypes[1].hide=false;
     this.selectedType='C';
    }
      else{
        this.timeSheetTypes[1].hide=true;
        this.selectedType='C';
      }

  }
}
