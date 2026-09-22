import { CommonModule, JsonPipe } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ApprovalOptions } from 'src/app/modules/hrm-shared/core/shared/common/enum/app.enum';
import { ButtonConfig, ParamtersConfig, ReturnConfig, TableFilterFormConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { RemarksDialogComponent } from '../remarks-dialog/remarks-dialog.component';
import { ConfirmationCustomDialogService } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/confirmation-custom-dialog/confirmation-custom-dialog.service';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { After } from 'v8';

@Component({
  selector: 'sanadi-dialog-footer',
  standalone: true,
  imports: [CommonModule, ButtonModule, TranslateModule, DropdownModule, FormsModule, ProgressBarModule],
  templateUrl: './dialog-footer.component.html',
  styleUrl: './dialog-footer.component.scss'
})
export class DialogFooterComponent implements OnInit {

  tabIndex = 0;
  apiService = inject(ApiService);
  dialogRef = inject(DynamicDialogRef);
  dialogConfig = inject(DynamicDialogConfig);
  permissionsService = inject(NgxPermissionsService);
  remarksRef: DynamicDialogRef | undefined;
  dialogService = inject(DialogService);
  translate = inject(TranslateService);
  _sharedService = inject(SharedService);
  secureStorageService = inject(EncryptedStorageService);
  customConfirmationService = inject(ConfirmationCustomDialogService);
  isDisabledSaveButton: boolean = false;
  // approval model code
  enableApprove: boolean = this.dialogConfig?.data?.item?.hasOwnProperty('approval_status') || this.dialogConfig?.data?.item?.hasOwnProperty('approval_stage_status');
  enableRemarks: boolean = this.dialogConfig?.data?.item?.hasOwnProperty('approval_stage_status');
  checkApproved: boolean = (this.dialogConfig?.data?.item?.approval_status == ApprovalOptions.APPROVED) || (this.dialogConfig?.data?.item?.approval_stage_status == ApprovalOptions.APPROVED) ? true : false;
  isApproveNeeded: boolean = this.dialogConfig?.data?.config?.isApproveNeeded ?? true;
  footerConfig: any = this.dialogConfig?.data?.config?.footerConfig;
  dataConfig: TableFilterFormConfig = this.dialogConfig.data?.config;
  stagesDetails: any = [];
  approvalOptions: any[] = [
    // { label: 'Not Approved', value: ApprovalOptions.NOT_APPROVED },
    { label: 'Approved', value: ApprovalOptions.APPROVED },
    { label: 'Pending Approval', value: ApprovalOptions.PENDING_APPROVAL },
    { label: 'Rejected', value: ApprovalOptions.REJECTED },
    { label: 'Cancelled', value: ApprovalOptions.CANCELLED },
  ];
  progressValue: number = 0;
  successResponse: boolean;
  isDisable: any = this.footerConfig?.disable || false;
  isSuperUser: string = 'false';
  async ngOnInit(): Promise<void> {
    // console.log("config",this.dialogConfig,this.isApproveNeeded);
    // console.log('dialogConfig?.data?.customDialog', this.dialogConfig?.data?.customDialog);
    if (this.dataConfig?.saveConfig?.allowSuperUserSave && !this.dialogConfig?.data?.item?.is_lock) {
      this.isSuperUser = await this.secureStorageService.getItem('is_superuser');
    }
  }

  constructor() { }

  onClickSave(event: any) {
    // console.log('onClickSave', this.dialogConfig.data.item);
    const confirmation = this.dataConfig?.confirmationConfig;
    const rejectConfig = this.dataConfig?.confirmationConfig?.rejectConfig;
    if (confirmation?.show) {
      this.customConfirmationService.confirm({
        title: confirmation?.title,
        message: confirmation?.message,
        submitButtonText: confirmation?.submitButtonText,
        cancelButtonText: confirmation?.cancelButtonText,
        submitButtonStatus: confirmation?.submitButtonStatus,
        cancelButtonStatus: confirmation?.cancelButtonStatus,
        disableSubmit: confirmation?.disableSubmit,
        accept: () => {
          this.onSubmit();
          console.log('Accept');
        },
        reject: async () => {
          if (rejectConfig?.onReject) {
            const response: ReturnConfig = await rejectConfig.onReject({ config: this.dialogConfig, ref: this.dialogRef, formValue: this.dialogConfig.data.item });
            if ('form' in response) {
              this.dialogConfig.data.item = response?.form;
            }
          }
          if (rejectConfig?.saveForm) {
            this.onSubmit()
          }
          if (rejectConfig?.closeDialog ?? true) {
            this.dialogRef.close();
          }
          console.log('Reject');
        },
      });
    } else {
      this.onSubmit();
    }
  }

  async onSubmit() {
    this.isDisabledSaveButton = true;
    if (this.dialogConfig?.data?.customDialog) {
      this.dialogRef.close(this.dialogConfig.data.item);
    }
    else {
      let intervalId: any
      const url = this.dialogConfig?.data?.isEditMode && this.dialogConfig?.data?.item?.id ? `${this.dialogConfig?.data?.config?.url?.put}${this.dialogConfig?.data.item?.id}/` : this.dialogConfig?.data?.config?.url?.post;
      const params = this.dialogConfig?.data?.isEditMode && this.dialogConfig?.data?.item?.id ? this.dialogConfig?.data?.config?.params?.put : this.dialogConfig?.data?.config?.params?.post;
      console.log("paramsssssss", params)
      let formData = this.dialogConfig.data.item;
      formData.is_active = true;
      // modify form data if its said required from local component.
      if (this.dialogConfig?.data?.config?.localCompService) {
        const updatedFormData = await this.dialogConfig?.data?.config?.localCompService?.onSaveFormData(this.dialogConfig.data.item, this.dialogConfig.data?.formFields);
        if (updatedFormData) {
          intervalId = this.startProgressBarInterval();
          formData = updatedFormData;
        }
        else {
          this.isDisabledSaveButton = false
          return;
        }
      }
      else {
        intervalId = this.startProgressBarInterval();
      }

      if (url) {
       // console.log('this.getUpdateMethodOnCondition()', this.apiService[this.getUpdateMethodOnCondition()]);
       // Create final URL with appropriate parameters
        let finalUrl = url;
        
        //Add is_edited=true parameter for edit operations
        if (this.dialogConfig?.data?.isEditMode && this.dialogConfig.data?.item?.id) {
          finalUrl += '?is_edited=true';
        }
        //Add is_revised=true parameter for revision operations (when base_revised_fk is present)
        else if (formData?.base_revised_fk) {
          finalUrl += '?is_revised=true';
        }
        
        const request = this.dialogConfig?.data?.isEditMode && this.dialogConfig.data?.item?.id ? this.apiService[this.getUpdateMethodOnCondition()](finalUrl, formData,params??{}) : this.apiService.post(finalUrl, formData);
        // const request = this.dialogConfig?.data?.isEditMode && this.dialogConfig.data?.item?.id ? this.apiService[this.getUpdateMethodOnCondition()](url, formData) : this.apiService.post(url, formData);
        request.subscribe((res) => {
          if (Object.keys(res).length) {
            clearInterval(intervalId);
            this.progressValue = 100;
            setTimeout(() => {
              this._sharedService.handleSuccess(
                this.translate.instant('entityUpdateSuccessTitle_TC', { entity: '' })
              );
              this.dialogRef.close(res);
            }, 1000)

          }
          else {
            this.successResponse = false;
            this.isDisabledSaveButton = false;
            setTimeout(() => {
              clearInterval(intervalId);
            }, 500)
          }
        })
      } else {
        this.dialogRef.close(this.dialogConfig.data.item);
        console.log("the dialog ref close", this.dialogConfig.data.item )
      }
    }
  }

  nextTab() {
    dispatchEvent(new CustomEvent("nextTabChange"));
  }

  previousTab() {
    dispatchEvent(new CustomEvent("prevTabChange"));
  }

  startProgressBarInterval() {
    this.successResponse = true;
    const intervalId = setInterval(() => {
      this.progressValue = this.progressValue + Math.floor(Math.random() * 10) + 2;
      if (this.progressValue > 100) {
        clearInterval(intervalId);
        this.progressValue = 97;
      }
    }, 300);
    return intervalId;
  }

  disableSaveButton() {
    if(this.isDisabledSaveButton){
      return this.isDisabledSaveButton;
    }
    // if(this.dataConfig?.saveConfig?.tempEnableAccess&&this.dataConfig?.saveConfig?.tempEnableAccess(this.dialogConfig?.data.item)){
    //       console.log("this.dialogConfig?.data.item",this.dialogConfig?.data.item)
    //   return false
    else if(this.dialogConfig.data?.form?.isFormValid){
      return this.dialogConfig.data?.form?.isFormValid;
    }
    else if(this.isSuperUser == 'true'){
      return false;
    }
    else {
      return this.disableSaveButtonByPermission();
    }

  }

  // ON CLICK ACTION BUTTON
  async onClickActionButton(action: ButtonConfig) {
    if (typeof (action?.onClick) === 'function') {
      const result = await action?.onClick(this.dialogConfig?.data.item);
      console.log("resulttttt", result);
      if (result) {
        this.dialogConfig.data.item = result;
        this.onSubmit();
      }
    }
  }

  // HANDLE FORMVALUE
  disableActionButton(val: Function) {
    return val(this.dialogConfig?.data?.item, this.dialogConfig?.data?.old_item);
  }

  // ACTION LABEL
  actionLabel(action: ButtonConfig) {
    if (action?.labelFunction) {
      return action?.labelFunction(this.dialogConfig?.data.item);
    }
    return action?.label || '';
  }

  // CHECK APPROVAL OPTIONS
  checkApproveStatus() {
    if (this.dialogConfig?.data?.config?.handleApprove) {
      return this.dialogConfig?.data?.config?.handleApprove(this.dialogConfig?.data.item);
    }
    return this.enableApprove;
  }

  // APPROVAL STAGES
  getUpdateMethodOnCondition() {
    // console.log("check dropdown disabled", this.checkDropdownDisabled(), this.disableSaveButtonByPermission(), this.isApproveNeeded)
    if (this.checkDropdownDisabled() == true && this.disableSaveButtonByPermission() == false && this.isApproveNeeded) {
      return 'put';
    }
    else {
      return 'put';
    }
  }

  checkDropdownDisabled() {
    if(this.dataConfig?.saveConfig?.tempEnableAccess&&this.dataConfig?.saveConfig?.tempEnableAccess(this.dialogConfig?.data.item)){
      return false
    }
    const item = this.dialogConfig?.data?.item;
    if (item?.hasOwnProperty('approval_stage_status') && !this.checkApproved) {
      const permissions = item.approval_permission_code;
      if (Array.isArray(permissions)) {
        return !(permissions.some(permission =>
          this.permissionsService.getPermission(permission)
        ));
      }
    }
    return this.checkApproved;
  }
  // action?.disableFunction ? this.disableActionButton(action?.disableFunction) : this.checkApproved

  disableSaveButtonByPermission() {
    // console.log("A",this.checkModulePermissions(this.dialogConfig?.data?.config?.saveConfig?.permission || []))
    if (this.dataConfig?.saveConfig?.manual) {
      const hasSavePermission = this.checkModulePermissions(this.dataConfig?.saveConfig?.permission || []);
      return !hasSavePermission || (this.dataConfig?.saveConfig?.disableFunction ? this.disableActionButton(this.dataConfig?.saveConfig?.disableFunction) : this.isDisable);
    }
    else {
      let isSaveButton = false;
      const hasSavePermission = this.checkModulePermissions(this.dataConfig?.saveConfig?.permission || []);
      hasSavePermission ? isSaveButton = false : isSaveButton = (this.checkDropdownDisabled() && this.isApproveNeeded || this.isDisable);
      return isSaveButton;
    }
  }

  checkModulePermissions(permissions): boolean {
    return permissions.some(permission => this.permissionsService.getPermission(permission));
  }

  getApprovalField() {
    return this.dialogConfig?.data?.item?.hasOwnProperty('approval_stage_status') ? 'approval_stage_status' : 'approval_status';
  }

  async showRemarks() {
    if (this.stagesDetails?.length <= 0) {
      this.stagesDetails = await this.getApprovalStageDetails();
    }
    this.remarksRef = this.dialogService.open(RemarksDialogComponent, {
      header: 'Approval Stages',
      // width: '25rem',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      position: 'bottom-right',
      closable: true,
      dismissableMask: true,
      data: {
        stageDetails: this.deepCopy(this.stagesDetails ?? []),
        formData: this.deepCopy(this.dialogConfig?.data?.item)
      }
    });

    this.remarksRef.onClose.subscribe((res) => {
      if (res) {
        this.stagesDetails = res?.stageDetails;
        this.dialogConfig.data.item = res?.formData;
      }
    });
  }

  getApprovalStageDetails() {
    return new Promise((resolve) => {
      const id = this.dialogConfig?.data?.item?.id;
      const stageName = this.dialogConfig?.data?.item?.stage_name;
      const permissionCode = this.dialogConfig?.data?.item?.approval_permission_code;
      this.apiService.get(`${this.dialogConfig?.data?.config?.url?.get}${id}`, {
        approval_stage_detail_fields: 'stage_name,approval_by,approval_date,modified_date,approval_status,permission_code,comments',
        required_fields: 'approval_stages',
        stage_name: stageName,
        permission_code: JSON.stringify(permissionCode),
        exclude_b_id: true
      }).subscribe((res: any) => {
        resolve(res?.approval_stages)
      })
    })
  }

  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }


}
