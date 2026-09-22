import { Component, inject, Input } from '@angular/core';
import { ToggleBtnComponent } from '../toggle-btn/toggle-btn.component';
import { OrderListModule } from 'primeng/orderlist';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormSchemaConfig, FormSettingModel } from 'src/app/modules/hrm-shared/core/shared/common/model/masters/form-setting.model';

@Component({
  selector: 'form-column-settings',
  standalone: true,
  imports: [ToggleBtnComponent, OrderListModule, CommonModule, TranslateModule],
  templateUrl: './form-column-settings.component.html',
  styleUrl: './form-column-settings.component.scss'
})
export class FormColumnSettingsComponent {
  @Input() tableConfig: any;
  @Input() form: any;
  @Input() isNeedColumnSettings = false;
  @Input() formFields: any;

  private translate = inject(TranslateService);

  trackBy(item: any, index: number) {
    return index
  }

  ngOnInit(): void {
    // console.log('table', this.tableConfig);
  }

  isHidden(field: FormSchemaConfig, item: FormSettingModel) {
    if ((field?.hidden) || (item?.hideReadonly && field?.name === 'readonly') || (item?.hideRequired && field?.name === 'required'))
      return false;
    return true;
  }

  onChangeToggle(field: FormSchemaConfig, item: FormSettingModel) {
    item[field?.name] = !item[field?.name];
    if (!this.isNeedColumnSettings) {
      if (field?.name == 'required' && item?.required === true) {
        item.readonly = false;
      } else if (field?.name == 'readonly' && item?.readonly === true) {
        item.required = false;
      }
    }
    // console.log('onChangeToggle', this.tableConfig?.dataSource);
  }
}
