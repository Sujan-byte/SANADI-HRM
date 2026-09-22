import { FormField } from "../form-builder";

export class CarouselField extends FormField {
    override type?: string = 'carousel';

    constructor(
        translate: any,
        name: string,
        isEditMode: boolean,
        data: any,
        defaultData?: any,
        label?: any,
        placeholder?: any,
        validation?: { required?: boolean; minlength?: number },
        errorText?: { required?: string; minlength?: string }
    ) {
        super(translate);
        this.name = name;
        this.label = label ?? `${name}_TC`;
        this.isEditMode = isEditMode;
        this.data = data;
        this.defaultData = defaultData;
        this.value = this.getValue();
        this.placeholder = placeholder;
    }

    private getValue(): any {
        return this.isEditMode ? this.data[this.name] : this.defaultData[this.name];
    }

    toObject() {
        return {
            type: this.type,
            name: this.name,
            label: this.translate.instant(this.label),
            value: this.value,
            validation: this.validation,
            errorText: this.errorText,
            fieldWidth: this.fieldWidth,
            readonly: this.readonly,
            variant: this.variant,
            hidden: this.hidden,
            downloadButton: true,
        };
    }
}