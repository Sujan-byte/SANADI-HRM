import { Component, inject } from '@angular/core';
import { ConfirmationCustomDialogService } from './confirmation-custom-dialog.service';
import { ConfirmationModel } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';

@Component({
  selector: 'confirmation-custom-dialog',
  standalone: true,
  imports: [],
  templateUrl: './confirmation-custom-dialog.component.html',
  styleUrl: './confirmation-custom-dialog.component.scss'
})
export class ConfirmationCustomDialogComponent {
  ccService: ConfirmationModel = inject(ConfirmationCustomDialogService);

  accept() {
    this.ccService.accept();
  }

  reject() {
    this.ccService.reject(); 
  }

  close() {
    this.ccService.close(); 
  }
}
