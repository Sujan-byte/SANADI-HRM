import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, NgModule, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToggleBtnService } from './services/toggle-btn.service';
import { InputSwitchModule } from 'primeng/inputswitch';

@Component({
  selector: 'toggle-btn',
  standalone: true,
  imports: [FormsModule, CommonModule, InputSwitchModule],
  templateUrl: './toggle-btn.component.html',
  styleUrls: ['./toggle-btn.component.scss']
})
export class ToggleBtnComponent {
  constructor(private _toogleBtnService: ToggleBtnService) { }

  @Input() value: boolean;
  @Input() label: string;
  @Input() id: string;

  @Output() onChange = new EventEmitter<boolean>();

  handleOnToggleChange() {
    this.onChange.emit(this.value);
    this._toogleBtnService.sendData(this.value);
  }
}
