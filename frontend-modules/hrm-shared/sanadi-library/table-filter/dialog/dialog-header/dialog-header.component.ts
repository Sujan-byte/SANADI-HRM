import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ConfirmationCustomDialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/confirmation-custom-dialog/confirmation-custom-dialog.component';
import { DialogFooterComponent } from '../dialog-footer/dialog-footer.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'sanadi-dialog-header',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    ConfirmPopupModule,
    ConfirmDialogModule,
    ConfirmationCustomDialogComponent,
    TranslateModule
  ],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.scss',
})
export class DialogHeaderComponent extends DialogFooterComponent implements OnInit {
  // dialogConfig = inject(DynamicDialogConfig);
  // dialogRef = inject(DynamicDialogRef);
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  // _sharedService = inject(SharedService);
  isMaximize: boolean = !(this.dialogConfig?.width === '100%' && this.dialogConfig?.height === '100%');

  config = this.dialogConfig?.data?.config;

  // ngOnInit() {
    // console.log("dialog config", this.dialogConfig, this.dialogRef);
  // }

  onActionClick(action: Function) {
    if (action && typeof action === 'function') {
      action({ formData: this.dialogConfig.data.item, formFields: this.dialogConfig.data?.formFields, dialogRef: this.dialogRef });
    }
  }

  onClickClose(event: any) {
    const disableSubmit = this.disableSaveButton()
    this.customConfirmationService.confirm({
      title: this.translateService.instant(this.config?.pageTitle),
      message: 'Do you want to save the changes you made',
      submitButtonText: 'Save',
      cancelButtonText: disableSubmit ? 'Close' : `Don't Save`,
      closeButtonText: 'Cancel',
      submitButtonStatus: !(this.config?.saveFunction ? this.disableActionButton(this.config?.saveFunction) : (this.config?.hideSaveButton == true)),
      closeButtonStatus: true,
      disableSubmit: disableSubmit,
      accept: () => {
        this.onSubmit();
        console.log('Accept');
      },
      reject: () => {
        this.dialogRef.close();
        console.log('Cancel');
      },
      close: () => {
        console.log('Close');
      },
    });
  }

  onToggleMaximize(event: any) {
    this.isMaximize = !this.isMaximize;
    this.config.dialogService.dialogComponentRefMap.forEach(x => {
      x.instance.maximized = !this.isMaximize;
    });
  }
}
// this.confirmationService.confirm({
//   target: event.target as EventTarget,
//   message: `Are you sure you want to close?`,
//   icon: 'pi pi-exclamation-triangle',

//   accept: () => {
//     this.dialogRef.close();
//     this.messageService.add({ key: 'toaster', severity: 'info', summary: 'Closed', detail: this.config?.pageTitle, life: 3000 });
//   },
//   reject: () => {
//     // this.messageService.add({
//     //   key: 'toaster',
//     //   severity: 'error',
//     //   summary: 'Rejected',
//     //   detail: 'You have rejected',
//     //   life: 3000,
//     // });
//   },
// });
