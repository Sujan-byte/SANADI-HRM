import { Injectable } from '@angular/core';
import { ConfirmationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationCustomDialogService {

  show: boolean = false;
  confirmation: any;
  title: string = '';
  message: string = '';
  submitButtonText: string = '';
  cancelButtonText: string = '';
  closeButtonText: string = '';
  submitButtonStatus: boolean = true;
  cancelButtonStatus: boolean = true;
  closeButtonStatus: boolean = false;
  disableSubmit: boolean = false;

  constructor() { }

  confirm(data: ConfirmationModel) {
    // console.log('data', data);
    this.show = true;
    this.confirmation = data;
    this.title = data?.title || 'Warning';
    this.message = data?.message || 'Are you sure you want to leave? Any unsaved changes will be lost.';
    this.submitButtonText = data.submitButtonText || 'OK';
    this.cancelButtonText = data.cancelButtonText || 'Cancel';
    this.closeButtonText = data.closeButtonText || 'Cancel';
    this.submitButtonStatus = data.submitButtonStatus != undefined ? data.submitButtonStatus : true;
    this.cancelButtonStatus = data.cancelButtonStatus != undefined ? data.cancelButtonStatus : true;
    this.closeButtonStatus = data.closeButtonStatus ?? false;
    this.disableSubmit = data?.disableSubmit ?? false;
  }

  accept() {
    this.show = false;
    this.confirmation.accept();
    // console.log('accept', this.confirmation);
  }

  reject() {
    this.show = false;
    this.confirmation.reject();
    // console.log('enter');
  }

  close() {
    this.show = false;
    this.confirmation.close();
    // console.log('enter');
  }

}
