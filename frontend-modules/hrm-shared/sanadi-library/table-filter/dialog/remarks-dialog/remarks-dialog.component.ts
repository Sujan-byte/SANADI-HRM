import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ApprovalOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';

@Component({
  selector: 'sanadi-remarks-dialog',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule, TranslateModule, InputTextareaModule],
  templateUrl: './remarks-dialog.component.html',
  styleUrl: './remarks-dialog.component.scss'
})
export class RemarksDialogComponent {
  dialogConfig = inject(DynamicDialogConfig)
  dialogRef = inject(DynamicDialogRef)
  permissionsService = inject(NgxPermissionsService)
  config = [
    { field: 'stage_name', label: 'Approval Stage', readonly: true },
    { field: 'approval_by', label: 'User', readonly: true },
    { field: 'normalized_approval_status', label: 'Status', readonly: true },
    { field: 'approval_date', label: 'Approval Date', readonly: true },
    { field: 'modified_date', label: 'Date', readonly: true },
    { field: 'comments', label: 'Remarks', readonly: false, type: 'textArea' },
  ]

  onApply() {
    this.dialogRef.close({ stageDetails: this.dialogConfig?.data?.stageDetails, formData: this.dialogConfig.data.formData });
  }

  onReject() {
    this.dialogRef.close()
  }

  checkIsDisabled(product) {
    let stage_name = this.dialogConfig?.data?.formData?.stage_name;
    if (this.getApprovalStatus() || this.checkDisabledByPermission()) {
      return true;
    }
    else if (product?.stage_name == stage_name && product?.approval_status != ApprovalOptions.APPROVED) {
      return false;
    }
    return true;
  }


  checkDisabledByPermission() {
    const item = this.dialogConfig?.data?.formData;
    if (item?.hasOwnProperty('approval_stage_status')) {
      const permissions = item.approval_permission_code;
      if (Array.isArray(permissions)) {
        return !(permissions.some(permission =>
          this.permissionsService.getPermission(permission)
        ));
      }
    }
    return false;
  }

  onChangeRemarks(changedRemarks, item) {
    this.dialogConfig.data.formData.approval_stage_comment = changedRemarks;
    if (item.hasOwnProperty('new_entry') && item?.new_entry == true) {
      this.dialogConfig.data.formData.new_approval_stage = item;
    }
  }

  getApprovalStatus() {
    return this.dialogConfig?.data?.formData?.approval_stage_status == ApprovalOptions.APPROVED ? true : false;
  }

  getApprovalDate(stage: any) {
    const approvalDate = stage?.approval_date;

    if (typeof approvalDate === 'string' && (!approvalDate.includes('T') || approvalDate.includes('T00:00'))) {
      return stage?.modified_date || approvalDate;
    }

    return approvalDate;
  }

}
