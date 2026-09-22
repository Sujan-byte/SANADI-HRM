import { Component, Input, Output, EventEmitter, ChangeDetectorRef, inject, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ButtonConfig, ReturnConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';


@Component({
  selector: 'sanadi-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() field: any = {};
  @Input() form: FormGroup | any;
  @Input() formFields: any = [];
  public confirmationService = inject(ConfirmationService);
  public sharedService = inject(SharedService);
  @ViewChild('cd') cd: ConfirmDialog;

  constructor() { }

  ngOnInit() {

  }

  // ON CLICK ACTION BUTTON
  async onClickActionButton(event: any, field: any, action: ButtonConfig) {
    // console.log('onClickActionButton', field, action);
    if (typeof (action?.onClick) === 'function') {
      const result: ReturnConfig = await action?.onClick({
        formValue: this.form.value,
        field: this.field,
        formFields: this.formFields,
        form: this.form,
        action: action,
        confirmationService: this.confirmationService,
      });
      if ('form' in result) {
        this.updateFormValue(result?.form);
      }
    }
  }

  disableActionButton(val: Function) {
    // console.log('disableActionButton', val(this.form.value));
    return val(this.form.value);
  }

  updateFormValue(formValue: any) {
    // console.log('updateFormValue', formValue);
    if (formValue) {
      this.form.patchValue(formValue);
    }
  }

}
