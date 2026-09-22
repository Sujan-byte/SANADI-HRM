import { FormField } from '../form-builder';

export class GapField extends FormField {
    override type?: string = 'gap';

    constructor(
        translate: any,
    ) {
        super(translate);
    }

    toObject() {
        return {
            type: this.type,
            fieldWidth: this.fieldWidth,
        };
    }
}