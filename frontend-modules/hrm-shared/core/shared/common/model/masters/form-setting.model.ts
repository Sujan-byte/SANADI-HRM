import { TableFilterUrlConfig } from "../app.model";

export class FormModel {
    id: string;
    form_key: string;
    form_value: any;
    column: any;
    search: any;

    form_setting: any[];
}

export class FormSettingModel {
    id: number;
    label: string;
    field: string;
    selected: boolean;
    required: boolean;
    readonly: boolean;
    hideRequired?: boolean;
    hideReadonly?: boolean;
}

export interface FormSchemaConfig {
    type: string;
    name: 'readonly' | 'required' | 'selected' | 'fieldName' | 'fieldset';
    readonly?: boolean;
    hidden?: boolean;
}

export interface FormSettingFieldsConfig {
    name?: string;
    key: string;
    baseDataSource: FormSettingModel[];
    dataSource: FormSettingModel[];
    formSchema: FormSchemaConfig[];
    url: TableFilterUrlConfig;
    params: {
        get?: Record<string, any>,
    };
    updateFields?: Function;
    isUpdate?: boolean;
}

export interface FormSettingConfig {
    show: boolean;
    formSettingFields?: FormSettingFieldsConfig;
}



