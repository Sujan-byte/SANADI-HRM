import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-shift-selection',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule],
  templateUrl: './shift-selection.component.html',
  styleUrls: ['./shift-selection.component.scss']
})
export class ShiftSelectionComponent {
  ref = inject(DynamicDialogRef);
  config = inject(DynamicDialogConfig);

  shiftOneOperator: any = null;
  shiftTwoOperator: any = null;
  selectedOperatorType: string | null = null;

  ngOnInit() {
    const data = this.config.data;
    
    this.shiftOneOperator = data?.shiftOneOperator?.id ? {
      id: data.shiftOneOperator.id,
      name: data.shiftOneOperator.name || '',
      profileUrl: data.shiftOneOperator.profileUrl
    } : null;

    this.shiftTwoOperator = data?.shiftTwoOperator?.id ? {
      id: data.shiftTwoOperator.id,
      name: data.shiftTwoOperator.name || '',
      profileUrl: data.shiftTwoOperator.profileUrl
    } : null;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  selectOperator(shiftType: string) {
    if (shiftType === 'shift_one' && this.shiftOneOperator) {
      this.selectedOperatorType = shiftType;
    } else if (shiftType === 'shift_two' && this.shiftTwoOperator) {
      this.selectedOperatorType = shiftType;
    }
  }

  // NEW METHOD: Handle double-click
  onOperatorDoubleClick(shiftType: string) {
    this.selectOperator(shiftType);
    this.confirmSelection(); // Immediately confirm and close with selection
  }

  canSelectOperator(): boolean {
    return this.selectedOperatorType !== null;
  }

  confirmSelection() {
    let selectedOperator = null;
    
    if (this.selectedOperatorType === 'shift_one' && this.shiftOneOperator) {
      selectedOperator = { ...this.shiftOneOperator, shiftType: 'shift_one' };
    } else if (this.selectedOperatorType === 'shift_two' && this.shiftTwoOperator) {
      selectedOperator = { ...this.shiftTwoOperator, shiftType: 'shift_two' };
    }

    if (selectedOperator) {
      this.ref.close(selectedOperator);
    }
  }

  close() {
    this.ref.close();
  }
}