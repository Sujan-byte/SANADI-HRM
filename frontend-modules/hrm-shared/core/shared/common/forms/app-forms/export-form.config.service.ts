import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DialogModel, ExportFields, ExportModel, ParamtersConfig, ReturnConfig, TableFilterFormConfig } from '../../model/app.model';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { MultiSelectField } from '../core/builders/multiselect.builder';
import { ExportEnum } from '../../enum/app.enum';
import { ButtonField } from '../core/builders/button.builder';
import { ToggleBuilder } from '../core/builders/toggle.builder';
import { DummyField } from '../core/builders/dummy.builder';
import { NgxSpinnerService } from 'ngx-spinner';
import { cloneDeep } from 'lodash';
import { SharedService } from '../../../services/shared.service';
import { catchError, throwError } from 'rxjs';
import { decimalDigits, numberLocale } from '../../../utils/common.constants';

@Injectable({
    providedIn: 'root',
})
export class ExportFormConfig {
    private translate = inject(TranslateService);
    public _apiService = inject(ApiService);
    public _spinner = inject(NgxSpinnerService);
    public _sharedService = inject(SharedService);
    config: TableFilterFormConfig;
    parentConfig: TableFilterFormConfig;

    public readonly ExportForm =
        () =>
            (config?: DialogModel, initialData?: ExportModel, isEditMode?: boolean, data?: ExportModel) => {
                initialData = new ExportModel();
                initialData = { ...initialData, ...data };
                this.config = config?.config;
                this.parentConfig = this.config?.data?.config?.config;
                return [
                    // new TabBuilder(this.translate)
                    //     .addTabFields([
                    //         {
                    //             tabHeader: 'Export Details',
                    //             fields: [
                    // new ToggleBuilder(this.translate, ExportEnum.selectAll, isEditMode, data, initialData)
                    //     .addFieldWidth('48%')
                    //     .toObject(),
                    new ButtonField(this.translate, ExportEnum.excel, isEditMode, data, initialData)
                        .addFieldWidth('20%')
                        .isHideLabel(true)
                        .setClass('flex justify-content-center')
                        .actionButtonConfig([
                            {
                                show: true,
                                label: 'Excel',
                                icon: 'pi pi-file-excel',
                                toolTip: 'Export Excel',
                                tooltipPosition: 'top',
                                class: 'p-button-help p-button-sm',
                                onClick: this.onClickExport.bind(this),
                            },
                        ])
                        .toObject(),
                    new ButtonField(this.translate, ExportEnum.pdf, isEditMode, data, initialData)
                        .addFieldWidth('20%')
                        .isHideLabel(true)
                        .setClass('flex justify-content-center')
                        .actionButtonConfig([
                            {
                                show: true,
                                label: 'Pdf',
                                icon: 'pi pi-file-pdf',
                                toolTip: 'Export Pdf',
                                tooltipPosition: 'top',
                                class: 'p-button-help p-button-sm',
                                onClick: this.onClickExport.bind(this),
                            },
                        ])
                        .toObject(),
                    new MultiSelectField(this.translate, ExportEnum.fields, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC', '20vw')
                        .addFieldWidth('100%')
                        .addKeyValueLabel('label', 'id')
                        .getOptions(signal(initialData?.export_fields))
                        // .onChange(this.onChangeEmployeeType.bind(this))
                        .toObject(),
                    new DummyField(this.translate, ExportEnum.selectedListIds, isEditMode, data, initialData)
                        .isFieldHidden(true)
                        .toObject(),
                    new DummyField(this.translate, ExportEnum.exportFields, isEditMode, data, initialData)
                        .isFieldHidden(true)
                        .toObject(),
                    new DummyField(this.translate, ExportEnum.params, isEditMode, data, initialData)
                        .isFieldHidden(true)
                        .toObject(),
                    //         ],
                    //     }
                    // ])
                ];
            };

    // ON CLICK EXPORT
    onClickExport(parameters: ParamtersConfig) {
        // console.log('parameters', parameters, this.config);
        const formValue: ExportModel = parameters?.formValue;
        let params = formValue?.params || {};
        let exportFields = cloneDeep(formValue?.export_fields);
        
        if (formValue?.fields?.length) {
            exportFields = formValue?.export_fields.filter((ele: ExportFields) => formValue?.fields.some((field) => field === ele?.id));
        }
        // console.log('exportFields', exportFields);
        if (parameters?.field?.name === ExportEnum.excel) {
            formValue.excel = true;
        } else if (parameters?.field?.name === ExportEnum.pdf) {
            formValue.pdf = true;
        }

        if (exportFields?.length) {
            params = { ...params, export_fields: JSON.stringify(exportFields), excel: formValue?.excel, pdf: formValue?.pdf, id__in: formValue?.selected_list_ids.toString(), decimal: decimalDigits(), number_locale: numberLocale() };
    
            return new Promise((resolve) => {
                this._spinner.show();
                this._apiService
                    .getFile(this.getExportUrl(), params)
                    .pipe(
                        catchError(error => {
                            this._spinner.hide();
                            this._sharedService.handleWarning();
                            return throwError(error);
                        })
                    )
                    .subscribe((res: any) => {
                        formValue.excel = false;
                        formValue.pdf = false;
                        this._spinner.hide();
                        resolve(res);
                    });
            })
        } else  {
            this._sharedService.handleWarning('Export fields are missing');
            return '';
        }
    }

    private getExportUrl(): string {
        const baseUrl = this.parentConfig?.url?.getExcel || this.parentConfig?.url?.get || '';
        return `${baseUrl.replace(/\/?$/, '/')}export/`;
    }
}
