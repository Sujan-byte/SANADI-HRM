import { inject, Injectable } from '@angular/core';
import { ApiService } from 'src/app/core/services/api.service';
import { CareerLetterModel } from 'src/app/modules/hrm-shared/core/shared/common/model/hrm/career-letter.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
@Injectable({
    providedIn: 'root'
})
export class EditorService {
    companyName: string;
    GSTIN: string;
    registeredAddress: string;
    bankDetails: any = [];
    employeeName: string;
    private apiService = inject(ApiService);
    constructor() {
        this.companyName = localStorage.getItem('companyName') || '';
        this.GSTIN = localStorage.getItem('gst') || '';
        this.registeredAddress = localStorage?.getItem('registered_address') || '';
        this.bankDetails = JSON.parse(localStorage.getItem('BranchBankDetails')) || [];
    }
    onChangeEditorTypes(prev: any, next: any, formValue: CareerLetterModel, formFields: any, text, employeeName: any,): Promise<CareerLetterModel> {

        // console.log("THE Next is:", next)
        console.log("The formValue refresh is: ", formValue)
        // console.log("The formFields is:", formFields)


        let productsFieldSet: any
        this.employeeName = employeeName


    
        if (text == 'onChange') {
            productsFieldSet = formFields
                ?.find((fieldSet) => fieldSet?.fieldUniqueKey === 'editor-tab')
                ?.fields?.find((field: any) => field?.name === "subject_template")
        } else {
            productsFieldSet = formFields
        }
        if (next && productsFieldSet) {
            return new Promise((resolve) => {
                this.apiService.get(`${ServiceUrlConstants.EDITOR_CURD}`).subscribe((response: any) => {
                    const results = response?.results;
                    const matchingEditor = results?.find((element: any) => element.id === next);
                    if (matchingEditor) {
                        const editorTemplate = matchingEditor?.editor_template;
                        const processedTemplate = this.PrintPage(editorTemplate, formValue);
                        productsFieldSet.editor.render(processedTemplate);
                        productsFieldSet.value = processedTemplate;
                        formValue.subject_template = processedTemplate;
                    }
                    resolve(formValue);
                }, (error: any) => {
                    console.error('API error:', error);
                    resolve(formValue);
                });
            });
        }

        return Promise.resolve(formValue);
    }




    // Processes the editor template and replaces placeholders with form data
    PrintPage(editorTemplate: any, formValue: CareerLetterModel): string {
        const processedBlocks = editorTemplate?.blocks
            ?.filter((element: any) => element && element?.type && element?.data) // Filter out undefined or invalid elements
            ?.map((element: any) => this.processBlock(element, formValue))
            ?.flat();

        return { ...editorTemplate, blocks: processedBlocks };
    }


    // Handles the processing of different block types
    processBlock(element: any, formValue: CareerLetterModel) {
        const placeholders = {
            "[date]": formValue?.date ? `<b>${formValue.date}</b>` : '',
            "[employee_name]": formValue?.first_name ? `<b>${formValue.title}</b>. <b>${formValue.first_name}</b>` : '',
            "[employee_code]": formValue?.employee_code ? `<b>${formValue.employee_code}</b>` : '',
            "[employee_designation]": formValue?.employee_designation ? `<b>${formValue.employee_designation}</b>` : '',
            "[employee_department]": formValue?.department_name ? `<b>${formValue.department_name}</b>` : '',
            "[nationality]": formValue?.nationality ? `<b>${formValue.nationality}</b>` : '',
            "[passport]": formValue?.passport ? `<b>${formValue.passport}</b>` : '',
            "[offer_letter_employee_name]": formValue?.employee_name ? `<b>${formValue.employee_name}</b>` : '',
            "[email]": formValue?.email ? `<b>${formValue.email}</b>` : '',
            "[doj]": formValue?.doj ? `<b>${formValue.doj}</b>` : '',
            "[years_of_service]": formValue?.years_of_service ? `<b>${formValue.years_of_service}</b>` : '',

            "[company_name]": localStorage.getItem('companyName') ? `<b>${localStorage.getItem('companyName')}</b>` : '',
        };

        console.log("element?.type:", element?.type);

        if (element?.type === "paragraph" && element?.data?.text) {
            switch (element.data.text) {
                case "[terms_and_conditions]":
                    return this.generateTermsAndConditions(formValue);
                case "[bank_details]":
                    return this.generateBankAccountTable();
                case "[product_details]":
                    return this.generateProductDetailsTable(formValue);
                default:
                    return this.processDefaultBlock(element, formValue);
            }
        }

        // Handle placeholder replacement in tables
        if (element?.type === "table" && element?.data?.content) {
            element.data.content = element.data.content.map((row: string[]) =>
                row.map((cell: string) => {
                    let updatedCell = cell;
                    Object.entries(placeholders).forEach(([key, value]) => {
                        if (updatedCell.includes(key)) {
                            updatedCell = updatedCell.replace(key, value);
                        }
                    });
                    return updatedCell;
                })
            );
        }

        return element;
    }

    processDefaultBlock(element: any, formValue: CareerLetterModel) {
        console.log("formValue", formValue);

        const placeholders = {
            "[date]": formValue?.date ? `<b>${formValue.date}</b>` : '',
            "[employee_name]": formValue?.first_name ? `<b> ${formValue.title}</b>. <b>${formValue.first_name}</b>` : '',
            "[employee_code]": formValue?.employee_code ? `<b>${formValue.employee_code}</b>` : '',
            "[employee_designation]": formValue?.employee_designation ? `<b>${formValue.employee_designation}</b>` : '',
            "[employee_department]": formValue?.department_name ? `<b>${formValue.department_name}</b>` : '',
            "[nationality]": formValue?.nationality ? `<b>${formValue.nationality}</b>` : '',
            "[passport]": formValue?.passport ? `<b>${formValue.passport}</b>` : '',
            "[offer_letter_employee_name]": formValue?.employee_name ? `<b>${formValue.employee_name}</b>` : '',
            "[email]": formValue?.email ? `<b>${formValue.email}</b>` : '',
            "[doj]": formValue?.doj ? `<b>${formValue.doj}</b>` : '',
            "[years_of_service]": formValue?.years_of_service ? `<b>${formValue.years_of_service}</b>` : '',
            "[company_name]": localStorage.getItem('companyName') ? `<b>${localStorage.getItem('companyName')}</b>` : '',

        };

        let text = element?.data?.text;

        Object.keys(placeholders).forEach(key => {
            if (text?.includes(key)) {
                text = text.replace(key, placeholders[key]);
            }
        });

        return {
            id: element?.id,
            type: element?.type,
            data: { text: `${text}` }
        };
    }


    // Generates terms and conditions block
    generateTermsAndConditions(formValue: CareerLetterModel): any[] {
        return formValue?.subject_template.map((item: any, index: number) => ({
            id: `terms_${index}`,
            type: 'paragraph',
            data: { text: `<b>${index + 1}.</b> ${item?.description}` }
            //   ${item?.term} :
        }));
    }

    // Generates bank account table
    generateBankAccountTable = (): any => {
        const rows = [
            ['<b>Account Name</b>', this.bankDetails?.account_name || ''],
            ['<b>Account Number</b>', this.bankDetails?.account_number || ''],
            ['<b>Bank Name</b>', this.bankDetails?.bank_name || ''],
            ['<b>IFSC Code</b>', this.bankDetails?.ifsc || ''],
            ['<b>Branch</b>', this.bankDetails?.branch_name || '']
        ];
        return this.generateTable(rows);
    };

    // Generates product details table grouped by sets
    generateProductDetailsTable = (formValue: CareerLetterModel): any[] => {
        const setsGroups = this.groupBy(formValue?.subject_template, 'sets');
        let tables = [];

        Object.keys(setsGroups)?.forEach(sets => {
            // const rows = setsGroups[sets]?.map(this.mapProductRow || []);
            const rows = setsGroups[sets]?.map((item, index) => this.mapProductRow(item, index) || []);
            console.log("rows", rows)
            const totalRow = this.calculateTotals(setsGroups[sets]);

            tables.push(
                { id: `set_${sets}`, type: 'paragraph', data: { text: `<b>${sets}</b>` } },
                this.generateTable([this.productTableHeaders(), ...rows, totalRow]),
                { id: `br_${sets}`, type: 'paragraph', data: { text: `<br>` } }
            );
        });

        return tables;
    };

    // Helper to generate table block
    generateTable(rows: string[][]): any {
        return {
            id: `OunZLxzP8H-${Date.now()}`,
            type: "table",
            withHeadings: true,
            data: { content: rows }
        };
    }

    // Maps individual product details to a table row
    mapProductRow(item: any, index: number): string[] {
        const total = item?.is_buyback_product
            ? (-1 * (Number(item?.total_amount || 0) + Number(item?.tax_value || 0))).toFixed(2)
            : (Number(item?.total_amount || 0) + Number(item?.tax_value || 0)).toFixed(2);

        // const total = (Number(item?.total_amount || 0) + Number(item?.tax_value || 0)).toFixed(2);
        console.log("item", item)
        let descriptionOutput = '-';
        if (item?.description) {
            descriptionOutput = item.description
                .split(/[\*\u2022]/)
                .map(line => line.trim())
                .filter(line => line)
                .map((line, index, arr) => {
                    const bullet = item.description.charAt(item.description.indexOf(line) - 1);
                    return `${bullet === '*' ? '*' : '•'} ${line}`;
                })
                .join('<br>');
        }

        return [
            item?.is_buyback_product ? `${index + 1}` : `${item?.hsn || '-'}<br>${item.tax || 0}%`,
            item?.product_name ? `<b>${item?.product_name || ''}</b><br>${descriptionOutput || ''}` : descriptionOutput || '',
            Number(item?.unit_price || 0).toFixed(2),
            Number(item?.qty || 0).toString(),
            item?.is_buyback_product ? Number(-1 * item?.total_amount || 0).toFixed(2) : Number(item?.total_amount || 0).toFixed(2),
            item?.is_buyback_product ? Number(-1 * item?.tax_value || 0).toFixed(2) : Number(item?.tax_value || 0).toFixed(2),
            total
        ];
    }

    // Calculates totals for product details
    calculateTotals(items: any[]): string[] {
        const totalAmount = items.reduce((sum, item) => {
            const adjustment = item?.is_buyback_product ? -Number(item?.total_amount || 0) : Number(item?.total_amount || 0);
            return sum + adjustment;
        }, 0);

        const totalGST = items.reduce((sum, item) => {
            const adjustment = item?.is_buyback_product ? -Number(item?.tax_value || 0) : Number(item?.tax_value || 0);
            return sum + adjustment;
        }, 0);

        return ['', '', '<b>Total</b>', '', totalAmount.toFixed(2), totalGST.toFixed(2), (totalAmount + totalGST).toFixed(2)];
    }
    // calculateTotals(items: any[]): string[] {
    //     const totalAmount = items.reduce((sum, item) => sum + Number(item?.total_amount || 0), 0);
    //     const totalGST = items.reduce((sum, item) => sum + Number(item?.tax_value || 0), 0);
    //     return ['', '', '<b>Total</b>', '', totalAmount.toFixed(2), totalGST.toFixed(2), (totalAmount + totalGST).toFixed(2)];
    // }

    // Product table headers
    productTableHeaders(): string[] {
        return ['<b>HSN Code</b>', '<b>Description</b>', '<b>Basic Price</b>', '<b>Qty</b>', '<b>Total Basic</b>', '<b>GST Price</b>', '<b>Total Price</b>'];
    }

    // Groups items by a given key
    groupBy(items: any[], key: string): any {
        return items.reduce((acc, item) => {
            const groupKey = item[key] || 'Unknown';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(item);
            return acc;
        }, {});
    }
    // Retrieves field by unique key
    getFieldByUniqueKey(formFields: any, fieldSetKey: string, fieldName: string) {
        return formFields
            ?.find((fieldSet: any) => fieldSet?.fieldUniqueKey === fieldSetKey)
            ?.fields?.find((field: any) => field?.name === fieldName);
    }

}