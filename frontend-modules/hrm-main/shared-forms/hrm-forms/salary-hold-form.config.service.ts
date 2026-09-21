import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';
import { SalaryHoldModel } from 'src/app/core/shared/common/model/hrm/salary-hold.model';
import { SalaryHoldEnum } from 'src/app/core/shared/common/enum/hrm-enum/salary-hold.enum';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';
import { DynamicTableComponent } from 'src/app/sanadi-library/sanadi-components/dynamic-table/dynamic-table.component';

@Injectable({ providedIn: 'root' })
export class SalaryHoldFormConfig {
  private translate            = inject(TranslateService);
  private _customDialogService = inject(CustomDialogService);

  public readonly SalaryHoldForm =
    () =>
      (dataFromComponent?: any, initialData?: SalaryHoldModel, isEditMode?: boolean, data?: SalaryHoldModel) => {
        initialData = new SalaryHoldModel();

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('details_TC'),
                fieldUniqueKey: 'salary-hold-tab',
                fields: [

                  // ── Accordion ─────────────────────────────────────────────
                  <any>{
                    type: 'accordion',
                    fieldUniqueKey: 'salary-hold-accordion',
                    multiple: true,
                    fields: [

                      // ── Accordion 1: Hold Details ──────────────────────────
                      // @ts-ignore
                      {
                        accordionHeader: 'Hold Details',
                        selected: true,
                        fieldUniqueKey: 'hold-details-acc',
                        fields: [

                          // Employee multi-picker (read-only text + button)
                          new TextBuilder(this.translate, SalaryHoldEnum.employee_names, isEditMode, data, initialData, undefined, 'formSelectPlaceholder_SC')
                            .addFieldWidth('40%')
                            .isReadOnly(true)
                            .validate(true)
                            .actionButtonConfig([{
                              show: true,
                              icon: 'pi pi-users',
                              toolTip: 'Select Employees',
                              tooltipPosition: 'top',
                              class: 'p-button-help p-button-sm',
                              onClick: (formValue: SalaryHoldModel, field: any, formFields: any) =>
                                this.onClickPickerEmployee(formValue, field, formFields),
                            }])
                            .toObject(),

                          new DateField(this.translate, SalaryHoldEnum.hold_from_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true)
                            .toObject(),

                          new DateField(this.translate, SalaryHoldEnum.hold_to_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false)
                            .toObject(),

                          new TextBuilder(this.translate, SalaryHoldEnum.reason, isEditMode, data, initialData)
                            .addFieldWidth('49%')
                            .validate(true)
                            .toObject(),

                          new TextBuilder(this.translate, SalaryHoldEnum.remarks, isEditMode, data, initialData)
                            .addFieldWidth('49%')
                            .validate(false)
                            .toObject(),

                          // Hidden — stores actual employee id array
                          new InputField(this.translate, SalaryHoldEnum.employee_ids, isEditMode, data, initialData)
                            .isFieldHidden(true)
                            .toObject(),
                        ],
                      },

                      // ── Accordion 2: Release Details (edit mode only) ──────
                      // @ts-ignore
                      {
                        accordionHeader: 'Release Details',
                        selected: false,
                        fieldUniqueKey: 'release-details-acc',
                        hidden: !isEditMode,
                        fields: [

                          new DateField(this.translate, SalaryHoldEnum.released_on, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false)
                            .toObject(),

                          new TextBuilder(this.translate, SalaryHoldEnum.release_remarks, isEditMode, data, initialData)
                            .addFieldWidth('49%')
                            .validate(false)
                            .toObject(),
                        ],
                      },

                    ],
                  },
                ],
              },
            ])
        ];
      };

  async onClickPickerEmployee(formValue: SalaryHoldModel, field: any, formFields: any) {
    const existingIds: string[] = Array.isArray(formValue.employee_ids)
      ? formValue.employee_ids.map(String)
      : [];

    const response: any = await this._customDialogService.openDialog(
      { pageTitle: 'Select Employees', dialogConfig: { height: '80%', width: '40%' } },
      DynamicTableComponent,
      {
        field: {
          columnSchema: [
            { name: 'Code',       field: 'employee_code', filter: true },
            { name: 'First Name', field: 'first_name',    filter: true },
            { name: 'Last Name',  field: 'last_name',     filter: true },
          ],
          rows: 15,
          scrollHeight: '55vh',
          formInitialise: ['employee_code', 'first_name', 'last_name'],
          paginator: true,
          scrollable: true,
          lazy: true,
          url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
          queryParams: { is_active: true, required_fields: 'id,employee_code,first_name,last_name' },
          selectedArray: existingIds.map((id: string) => ({ id, tableRowId: id })),
          tableName: 'table',
        },
        tableDataSource: [],
      },
    );
    if (!response) return formValue;

    const selected: any[] = response?.tempArray || [];
    formValue.employee_ids   = selected.map((s: any) => s.id);
    formValue.employee_names = selected.map((s: any) =>
      `${s.employee_code} - ${s.first_name || ''} ${s.last_name || ''}`.trim()
    ).join(', ');
    return formValue;
  }
}
