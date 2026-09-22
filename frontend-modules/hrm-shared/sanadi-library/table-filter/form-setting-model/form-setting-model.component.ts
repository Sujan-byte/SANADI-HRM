import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { DynamicFormGeneratorModule } from '../../dynamic-form-generator/dynamic-form-generator.module';
import { CommonModule } from '@angular/common';
import { ToggleBtnService } from './toggle-btn/services/toggle-btn.service';
import { FormColumnSettingsComponent } from './form-column-settings/form-column-settings.component';
import { FormSettingModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/form-setting.model';

@Component({
  selector: 'form-setting-model',
  standalone: true,
  imports: [TabViewModule, DynamicFormGeneratorModule, CommonModule, FormColumnSettingsComponent],
  templateUrl: './form-setting-model.component.html',
  styleUrl: './form-setting-model.component.scss'
})
export class FormSettingModelComponent implements OnInit {
  private _toggleBtnService = inject(ToggleBtnService);
  checked = false;
  @Input() formFields: any;
  @Input() columnFields: any[] = [];
  @Input() isNeedFormSettings = false;
  @Input() isNeedColumnSettings = true;

  @Output() onSubmit = new EventEmitter();
  @Output() onReset = new EventEmitter();
  @Output() onClose = new EventEmitter();

  @Output() onSelectAll = new EventEmitter();

  index = 0;
  closed = false;

  formFieldObject: any;

  ngOnInit(): void {
    // console.log('FormSettingModelComponent', this.formFields?.dataSource);
    this._toggleBtnService.getData().subscribe(data => {
      // this.checked = data;
      this.checked = ((this.formFields?.dataSource || []) as Array<any>).every(item => item?.selected);
    })
    if (this.formFields && 'dataSource' in this.formFields) {
      this.checked = ((this.formFields?.dataSource || []) as Array<any>).every(item => item?.selected);
      // console.log('check', this.checked);
    }
  }

  handleSettingsSubmit(fieldName: string, dataSource: any) {
    // this.closed = true;
    const newDataSource = dataSource.map((item: any, i: number) => { return { ...item, orderNo: i } });
    this.onSubmit.emit({ [fieldName]: newDataSource });
  }

  handleSettingsReset() {
    this.onReset.emit();
  }

  toggleSelectAll(fieldName: string, dataSource: FormSettingModel[]) {
    this.checked = !this.checked;
    // console.log('toggleSelectAll', this.checked);
    if (this.checked) {
      dataSource = dataSource.map((row: FormSettingModel) => { row.selected = true; return row });
    } else {
      dataSource = dataSource.map((row: FormSettingModel) => { row.selected = false; return row });
    }
    this.onSelectAll.emit({ [fieldName]: dataSource, checked: this.checked });
  }

  handleSettingsClose() {
    this.closed = true;
    setTimeout(() => {
      this.onClose.emit();
    }, 450);
  }
}
