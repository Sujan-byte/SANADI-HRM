import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TabBuilder } from '../core/builders/tab.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { EditorEnum } from '../../enum/masters_enum/editor.enums';
import { EditorModel } from '../../model/masters/editor.model';
import { EditorJSBuilder } from '../core/builders/editor.builder';
import { DropdownField } from '../core/builders/dropdown.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { MultiSelectField } from '../core/builders/multiselect.builder';
import { InputField } from '../core/builders/input.builder';
import { TextBuilder } from '../core/builders/textarea.builder';

@Injectable({
    providedIn: 'root',
})
export class EditorFormConfig {
    private translate = inject(TranslateService);
    private apiService = inject(ApiService);
    private editorTypeList = signal([]);

    public readonly EditorForm =
        () =>
            (dataFromComponent?: any, initialData?: EditorModel, isEditMode?: boolean, data?: EditorModel) => {
                initialData = new EditorModel();
                let editorTypeObject = isEditMode ? data?.editorTypeObject : {};
                this.editorTypeList = isEditMode ? data?.editorList : signal([]);

                return [
                    new TabBuilder(this.translate)
                        .addTabFields([
                            {
                                tabHeader: this.translate.instant('EditorDetails_TC'),
                                fields: [
                                    new DropdownField(this.translate, EditorEnum.configEditor, isEditMode, data, initialData, true, 'formSelectPlaceholder_SC', undefined, '21vw')
                                        .addFieldWidth('24%')
                                        .getOptions(signal([]))
                                        .validate(true)
                                        .addKeyValueLabel('editor_type', 'id')
                                        .setDefaultObject(editorTypeObject)
                                        .onChangeOnly(this.onChangeEditorTypes.bind(this))
                                        .getUrlConfig({
                                            get: {
                                                url: ServiceUrlConstants.EDITOR_CONFIGURATION_CRUD,
                                            }
                                        })
                                        .bindOption(this.updateDynamicDropdownEditorTypesOptions.bind(this))
                                        .toObject(),

                                    new InputField(this.translate, EditorEnum.subject, isEditMode, data, initialData)
                                        .addFieldWidth('30%')
                                        .validate(true)
                                        .toObject(),
                                    new TextBuilder(this.translate, EditorEnum.editorTypes, isEditMode, data, initialData)
                                        .addFieldWidth('30%')
                                        .validate(false)
                                        .toObject(),
                                    // new MultiSelectField(this.translate, EditorEnum.editorTypes, isEditMode, data, initialData, false, 'formSelectPlaceholder_SC', '20vw', { required: true })
                                    //     .addFieldWidth('32%')
                                    //     .addKeyValueLabel('key', 'key')
                                    //     .setDefaultObject(this.editorTypeList)
                                    //     .getOptions(this.editorTypeList)
                                    //     .toObject(),

                                    new EditorJSBuilder(this.translate, EditorEnum.editorTemplate, isEditMode, data, initialData)
                                        // .isButtonVisible(false)
                                        .toObject()
                                ],
                            }
                        ])
                ];
            };

    onChangeEditorTypes(prev: string, next: string, formValue: EditorModel, formFields: any) {
        if (!next) return;

        this.apiService.get(`${ServiceUrlConstants.EDITOR_CONFIGURATION_CRUD}`).subscribe((res: any) => {
            if (!res || !res.results) return;
            const matchingEditor = res.results.find((element: any) => element.id === next);
            if (matchingEditor) {
                const processInfo = formFields[0]?.fields.find((field: any) => field?.name === EditorEnum.editorTypes);
                if (processInfo) {
                    processInfo.options = matchingEditor.configuration ? this.generateConfiguration(matchingEditor.configuration) : signal([]);
                }
            }
        });
    }
    generateConfiguration(configuration: any) {
        const configurationArray = Object.keys(configuration).map(key => ({ key: configuration[key] }));
        return signal(configurationArray);
    }
    private removeDuplicateOptions(options: any[]): any[] {
        const seen = new Set();
        return options.filter(option => {
            const identifier = option?.editor_type; // or use `${option.label}-${option.value}` for stricter check
            if (seen.has(identifier)) return false;
            seen.add(identifier);
            return true;
        });
    }


    updateDynamicDropdownOptions(response) {
        if (response?.results?.length) {
            return response.results;
        }
        return [];
    }
    updateDynamicDropdownEditorTypesOptions(response) {
        if (response?.results?.length) {
            const uniqueOptions = this.removeDuplicateOptions(response.results);
            //  console.log("uniqueOptions",response.results,uniqueOptions)
            return uniqueOptions;
        }
        return [];
    }

}

