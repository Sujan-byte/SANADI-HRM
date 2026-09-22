import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'sanadi-confirmation-dialog',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  dialogRef = inject(DynamicDialogRef)
  config = inject(DynamicDialogConfig);
  accept() {
    this.dialogRef.close(true);
  }
  reject() {
    this.dialogRef.close(false);
  }
  ngOnInit(): void {
    // console.log("dialogRef",this.config.data.message,this.dialogRef, this.config.data)
  }
}
