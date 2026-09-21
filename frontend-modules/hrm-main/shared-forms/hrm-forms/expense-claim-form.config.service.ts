import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { TabBuilder } from 'src/app/core/shared/common/forms/core/builders/tab.builder';
import { InputField } from 'src/app/core/shared/common/forms/core/builders/input.builder';
import { DateField } from 'src/app/core/shared/common/forms/core/builders/date.builder';
import { DropdownField } from 'src/app/core/shared/common/forms/core/builders/dropdown.builder';
import { NumberField } from 'src/app/core/shared/common/forms/core/builders/number.builder';
import { TextBuilder } from 'src/app/core/shared/common/forms/core/builders/textarea.builder';

import { TableBuilder } from 'src/app/core/shared/common/forms/core/builders/table.builder';

import {
  ExpenseClaimEnum,
  ExpenseClaimLineEnum,
  expenseClaimPaidByOptions,
} from 'src/app/modules/hrm-main/hrm-enum/expense-claim.enum';

import {
  ExpenseClaimModel,
  ExpenseClaimLineModel,
} from 'src/app/core/shared/common/model/hrm/expense-claim.model';

import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { FilterOptions } from 'src/app/core/shared/common/enum/app.enum';

import { CustomDialogService } from 'src/app/core/shared/services/custom-dialog';

import { SelectListComponent } from 'src/app/sanadi-library/sanadi-components/select-list/select-list.component';

import { CarouselField } from 'src/app/core/shared/common/forms/core/builders/carousel.builder';

@Injectable({
  providedIn: 'root',
})
export class ExpenseClaimFormConfig {
  private translate = inject(TranslateService);
  private _customDialogService = inject(CustomDialogService);

  private readonly paidByOptions = signal(expenseClaimPaidByOptions);

  public readonly ExpenseClaimForm =
    () =>
    (
      dataFromComponent?: any,
      initialData?: ExpenseClaimModel,
      isEditMode?: boolean,
      data?: ExpenseClaimModel,
    ) => {
      initialData = new ExpenseClaimModel();

      // --------------------------------------------------
      // DEFAULT VALUES
      // --------------------------------------------------

      initialData.status = 'DRAFT';
      initialData.paid_by = 'OUT_OF_POCKET';

      const defaultClaimantObject = this.buildDefaultClaimantObject(
        initialData,
        data,
        isEditMode,
      );

      initialData = {
        ...initialData,
        ...(data || {}),
      };

      data = initialData;


      const defaultSubmittedByObject =
        isEditMode && data?.submitted_by
          ? {
              id: data.submitted_by,
              first_name: (data as any)?.submitted_by_name || '',
              employee_code: (data as any)?.submitted_by_code || '',
            }
          : {};

      const defaultPettyCashFundObject =
        isEditMode && data?.petty_cash_fund
          ? {
              id: data.petty_cash_fund,
              fund_no: (data as any)?.petty_cash_fund_no || '',
              holder_name: (data as any)?.petty_cash_fund_holder_name || '',
            }
          : {};
          

      const generatedExpenseLineTable =
        this.generateExpenseLineTableSchema(data);

      return [
        new TabBuilder(this.translate).addTabFields([
          // ==================================================
          // TAB 1 - CLAIM DETAILS
          // ==================================================
          {
            tabHeader: 'Claim Details',
            fieldUniqueKey: 'expense-claim-details',
            fields: [
              // Claim No
              new InputField(
                this.translate,
                ExpenseClaimEnum.claimNo,
                isEditMode,
                data,
                initialData,
                'Claim No',
                'Auto Generated',
              )
                .addFieldWidth('24%')
                .isReadOnly(true)
                .toObject(),

              // Claim Name
              new InputField(
                this.translate,
                ExpenseClaimEnum.claimName,
                isEditMode,
                data,
                initialData,
                'Claim Name',
              )
                .addFieldWidth('24%')
                .validate(true, 1, 200)
                .toObject(),

              // Claimant
              new DropdownField(
                this.translate,
                ExpenseClaimEnum.claimant,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['first_name', 'employee_code'], 'id')
                .setDefaultObject(defaultClaimantObject)
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(false)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      search_key: 'first_name,employee_code',
                    },
                    filterKeys: [`search`],
                  },
                })
                .showClear(true)
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .validate(true)
                .toObject(),

              // Submitted By
              new DropdownField(
                this.translate,
                ExpenseClaimEnum.submittedBy,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['first_name', 'employee_code'], 'id')
                .setDefaultObject(defaultSubmittedByObject)
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(false)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.EMPLOYEE_MASTER_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      search_key: 'first_name,employee_code',
                    },
                    filterKeys: [`search`],
                  },
                })
                .showClear(true)
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                .toObject(),

              // Period From
              new DateField(
                this.translate,
                ExpenseClaimEnum.periodFrom,
                isEditMode,
                data,
                initialData,
                false,
                'Period From',
              )
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),

              // Period To
              new DateField(
                this.translate,
                ExpenseClaimEnum.periodTo,
                isEditMode,
                data,
                initialData,
                false,
                'Period To',
              )
                .addFieldWidth('24%')
                .validate(true)
                .toObject(),

              // Paid By
              new DropdownField(
                this.translate,
                ExpenseClaimEnum.paidBy,
                isEditMode,
                data,
                initialData,
                false,
                'formSelectPlaceholder_SC',
              )
                .addFieldWidth('24%')
                .addKeyValueLabel('label', 'value')
                .getOptions(this.paidByOptions)
                .onChangeOnly(this.onPaidByChange.bind(this))
                .validate(true)
                .toObject(),

              // Petty Cash Fund
              new DropdownField(
                this.translate,
                ExpenseClaimEnum.pettyCashFund,
                isEditMode,
                data,
                initialData,
                true,
                'formSelectPlaceholder_SC',
                undefined,
                '23vw',
              )
                .addFieldWidth('24%')
                .addKeyValueLabelList(['fund_no', 'holder_name'], 'id')
                .setDefaultObject(defaultPettyCashFundObject)
                .getOptions(signal([]))
                .isLazyFilterDropDown(true)
                .isNeedRequiredFields(false)
                .getUrlConfig({
                  get: {
                    url: ServiceUrlConstants.PETTY_CASH_FUND_CRUD,
                    params: {
                      page_size: 30,
                      is_active: true,
                      search_key: 'fund_no',
                    },
                    filterKeys: [`search`],
                  },
                })
                .showClear(true)
                .bindOption(this.updateDynamicDropdownOptions.bind(this))
                // .setIsHiddenFunction(true)
                // .setHideFields((formValue: ExpenseClaimModel) => formValue?.paid_by !== 'PETTY_CASH')
                .isHideFunction(
                  (formValue: ExpenseClaimModel) =>
                    formValue?.paid_by !== 'PETTY_CASH',
                )
                // .validate(true)
                .toObject(),

              // Advance Reference
              new InputField(
                this.translate,
                ExpenseClaimEnum.advanceReference,
                isEditMode,
                data,
                initialData,
                'Advance Reference',
              )
                .addFieldWidth('24%')
                .validate(false, 1, 100)
                .toObject(),

              // Advance Amount
              new NumberField(
                this.translate,
                ExpenseClaimEnum.advanceAmount,
                isEditMode,
                data,
                initialData,
                'Advance Amount',
              )
                .addFieldWidth('24%')
                .setMinValue(0)
                .toObject(),

              // Business Purpose
              new TextBuilder(
                this.translate,
                ExpenseClaimEnum.businessPurpose,
                isEditMode,
                data,
                initialData,
                'Business Purpose',
              )
                .addFieldWidth('48%')
                .validate(true)
                .toObject(),

              // Remarks
              new TextBuilder(
                this.translate,
                ExpenseClaimEnum.remarks,
                isEditMode,
                data,
                initialData,
                'Remarks',
              )
                .addFieldWidth('48%')
                .validate(false)
                .toObject(),
            ],
          },

          // ==================================================
          // TAB 2 - EXPENSE LINES
          // ==================================================
          {
            tabHeader: 'Expense Lines',
            fieldUniqueKey: 'expense-claim-lines',

            fields: [
              new TableBuilder(this.translate, ExpenseClaimEnum.lines, '', true)
                .columnSchema(generatedExpenseLineTable.columnSchema)
                .formInitialise<ExpenseClaimLineModel>(
                  new ExpenseClaimLineModel(),
                )
                .formSchema(generatedExpenseLineTable.formSchema)
                .getDatasource<Array<ExpenseClaimLineModel>>(
                  'id',
                  isEditMode ? (data?.lines ?? []) : [],
                )
                .setTableCaption(true)
                .setTableCaptionLabel('Expense Lines')
                .setTableWidth('98vw')
                .setAddButton(false)
                .build(),
            ],
          },

          // ==================================================
          // TAB 3 - ATTACHMENTS
          // ==================================================
          {
            tabHeader: 'Attachments',
            fieldUniqueKey: 'expense-claim-attachments',

            fields: [
              new CarouselField(
                this.translate,
                ExpenseClaimEnum.attachments,
                isEditMode,
                data,
                initialData,
                'Files',
              ).toObject(),
            ],
          },
        ]),
      ];
    };

  // ==================================================
  // EMPLOYEE DROPDOWN RESPONSE
  // ==================================================
  updateDynamicDropdownOptions(response: any) {
    if (response?.results?.length) {
      return response.results;
    }

    return [];
  }

  // ==================================================
  // DEFAULT CLAIMANT
  // ==================================================
  buildDefaultClaimantObject(
    initialData: ExpenseClaimModel,
    data: ExpenseClaimModel,
    isEditMode?: boolean,
  ) {
    let defaultClaimantObject: any = {};

    if (isEditMode && data?.claimant) {
      defaultClaimantObject = {
        id: data.claimant,
        first_name: data?.claimant_name || '',
        employee_code: (data as any)?.claimant_code || '',
      };
    } else {
      const employeeId = Number(localStorage.getItem('employee_id'));

      if (employeeId) {
        initialData.claimant = employeeId;
        initialData.submitted_by = employeeId;

        defaultClaimantObject = {
          id: employeeId,
          first_name: localStorage.getItem('first_name') || '',
          employee_code: localStorage.getItem('employeeCode') || '',
        };
      }
    }

    return defaultClaimantObject;
  }

  // ==================================================
  // EXPENSE LINE TABLE SCHEMA
  // ==================================================
  generateExpenseLineTableSchema(formValue: ExpenseClaimModel) {
    const columnSchema = [
      {
        field: ExpenseClaimLineEnum.expenseDate,
        name: 'Expense Date',
        colWidth: '110px',
      },

      {
        field: ExpenseClaimLineEnum.categoryName,
        name: 'Category',
        colWidth: '150px',
      },

      {
        field: ExpenseClaimLineEnum.vendorName,
        name: 'Vendor Name',
        colWidth: '160px',
      },

      {
        field: ExpenseClaimLineEnum.description,
        name: 'Description',
        colWidth: '220px',
      },

      {
        field: ExpenseClaimLineEnum.amount,
        name: 'Amount',
        colWidth: '110px',
      },

      {
        field: ExpenseClaimLineEnum.receiptAttached,
        name: 'Receipt Attached',
        colWidth: '120px',
      },

      {
        field: ExpenseClaimLineEnum.linkTypeLabel,
        name: 'Related To',
        colWidth: '140px',
      },

      {
        field: ExpenseClaimLineEnum.linkedObjectDisplay,
        name: 'Related Record',
        colWidth: '180px',
      },
    ];

    const formSchema = [
      // Expense Date
      {
        type: 'date',
        name: ExpenseClaimLineEnum.expenseDate,
        required: true,
      },

      // Category
      {
        type: 'input',
        name: ExpenseClaimLineEnum.categoryName,
        placeholder: 'Select Category',
        readonly: true,
        required: true,
        onClickInput: this.onClickExpenseCategory.bind(this),
      },

      // Vendor
      {
        type: 'input',
        name: ExpenseClaimLineEnum.vendorName,
        placeholder: 'Enter Vendor Name',
      },

      // Description
      {
        type: 'textArea',
        name: ExpenseClaimLineEnum.description,
        placeholder: 'Enter Description',
        required: true,
      },

      // Amount
      {
        type: 'number',
        name: ExpenseClaimLineEnum.amount,

        minFractionDigits: 2,
        maxFractionDigits: 2,

        min: 0.01,

        required: true,

        onValueChange: this.onChangeExpenseAmount.bind(this),

        // updateTableFooter: this.updateExpenseTotals.bind(this),
      },

      // Receipt
      {
        type: 'toggle',
        name: ExpenseClaimLineEnum.receiptAttached,
      },

      // link type
      {
        type: 'input',
        name: ExpenseClaimLineEnum.linkTypeLabel,
        placeholder: 'Select Related To',
        readonly: true,

        onClickInput: this.onClickExpenseLinkType.bind(this),
      },

      // Linked Object
      {
        type: 'input',
        name: ExpenseClaimLineEnum.linkedObjectDisplay,
        placeholder: 'Select Related Record',
        readonly: true,

        onClickInput: this.onClickLinkedObject.bind(this),
      },
    ];

    return {
      formValue,
      columnSchema,
      formSchema,
    };
  }

  // ==================================================
  // SELECT EXPENSE CLAIM CATEGORY
  // ==================================================
  async onClickExpenseCategory(
    event: any,
    tableValue: ExpenseClaimLineModel,
    formValue: ExpenseClaimModel,
  ) {
    const dynamicObject = {
      columnSchema: [
        {
          name: 'Code',
          field: 'code',
        },
        {
          name: 'Category',
          field: 'name',
        },
        {
          name: 'Requires Receipt',
          field: 'requires_receipt',
        },
      ],

      selectionMode: 'single',

      rows: 10,

      scrollHeight: '55vh',

      formInitialise: ['code', 'name', 'requires_receipt'],

      paginator: true,

      scrollable: true,

      lazy: true,

      fontSize: '14px',

      queryParams: {
        is_active: true,
        page_size: 30,
      },

      url: ServiceUrlConstants.EXPENSE_CLAIM_CATEGORY_CRUD,

      tableName: 'table',

      height: '70vh',
      width: '65vw',
    };

    const response: any = await this._customDialogService.openDialog(
      {
        pageTitle: 'Select Expense Category',

        dialogConfig: {
          width: '65%',
          height: '75%',
        },
      },

      SelectListComponent,

      dynamicObject,
    );

    if (!response?.id) {
      return {
        tableValue: tableValue,
      };
    }

    tableValue.category = response.id;

    tableValue.category_name = response.name;

    // useful later for receipt validation
    (tableValue as any).requires_receipt = response.requires_receipt;

    return {
      tableValue: tableValue,
    };
  }

  // ==================================================
  // SELECT EXPENSE CLAIM LINK TYPE
  // ==================================================
  async onClickExpenseLinkType(
    event: any,
    tableValue: ExpenseClaimLineModel,
    formValue: ExpenseClaimModel,
  ) {
    const dynamicObject = {
      columnSchema: [
        {
          name: 'Link Type',
          field: 'label',
        },
        // {
        //   name: 'Display Field',
        //   field: 'display_field',
        // },
      ],

      selectionMode: 'single',

      rows: 10,

      scrollHeight: '55vh',

      // formInitialise: ['label', 'display_field', 'search_url', 'content_type'],
      formInitialise: ['label'],

      paginator: true,

      scrollable: true,

      lazy: true,

      fontSize: '14px',

      queryParams: {
        is_active: true,
        page_size: 30,
      },

      url: ServiceUrlConstants.EXPENSE_CLAIM_LINK_TYPE_CRUD,

      tableName: 'table',

      height: '70vh',
      width: '60vw',
    };

    const response: any = await this._customDialogService.openDialog(
      {
        // pageTitle: 'Select Link Type',
        pageTitle: 'Select Related To',

        dialogConfig: {
          width: '60%',
          height: '75%',
        },
      },

      SelectListComponent,

      dynamicObject,
    );

    if (!response?.id) {
      return {
        tableValue,
      };
    }

    // FK
    tableValue.link_type = response.id;

    // display in expense line table
    tableValue.link_type_label = response.label;

    // These are frontend helper values.
    // Needed to know which API to open for Linked Object.
    (tableValue as any).link_search_url = response.search_url;

    (tableValue as any).link_display_field = response.display_field;

    // link type changed -> clear previous linked object
    tableValue.linked_object_id = null;

    tableValue.linked_object_display = '';

    return {
      tableValue,
    };
  }

  // ==================================================
  // SELECT LINKED OBJECT
  // ==================================================
  // async onClickLinkedObject(
  //   event: any,
  //   tableValue: ExpenseClaimLineModel,
  //   formValue: ExpenseClaimModel,
  // ) {
  //   const searchUrl = (tableValue as any)?.link_search_url;

  //   const displayField = (tableValue as any)?.link_display_field;

  //   if (!tableValue?.link_type || !searchUrl || !displayField) {
  //     return {
  //       tableValue,
  //     };
  //   }

  //   const displayLabel = tableValue?.link_type_label || 'Linked Object';

  //   const dynamicObject = {
  //     columnSchema: [
  //       {
  //         name: displayLabel,
  //         field: displayField,
  //       },
  //     ],

  //     selectionMode: 'single',

  //     rows: 10,

  //     scrollHeight: '55vh',

  //     formInitialise: [
  //       // 'id',
  //       displayField
  //     ],

  //     paginator: true,

  //     scrollable: true,

  //     lazy: true,

  //     fontSize: '14px',

  //     queryParams: {
  //       is_active: true,
  //       page_size: 30,
  //     },

  //     url: searchUrl,

  //     tableName: 'table',

  //     height: '70vh',
  //     width: '65vw',
  //   };

  //   const response: any = await this._customDialogService.openDialog(
  //     {
  //       pageTitle: 'Select Linked Object',

  //       dialogConfig: {
  //         width: '65%',
  //         height: '75%',
  //       },
  //     },

  //     SelectListComponent,

  //     dynamicObject,
  //   );

  //   if (!response?.id) {
  //     return {
  //       tableValue,
  //     };
  //   }

  //   tableValue.linked_object_id = response.id;

  //   tableValue.linked_object_display = response?.[displayField] ?? '';

  //   return {
  //     tableValue,
  //   };
  // }

  async onClickLinkedObject(
    event: any,
    tableValue: ExpenseClaimLineModel,
    formValue: ExpenseClaimModel,
  ) {
    const searchUrl = (tableValue as any)?.link_search_url;

    const displayField = (tableValue as any)?.link_display_field;

    const linkType = tableValue?.link_type_label;

    if (!tableValue?.link_type || !searchUrl || !displayField) {
      return {
        tableValue,
      };
    }

    // --------------------------------------------------
    // Dynamic popup columns based on Link Type
    // --------------------------------------------------

    let columnSchema: any[] = [];

    let formInitialise: string[] = [];

    // =========================
    // PROJECT
    // =========================
    if (linkType === 'Project') {
      columnSchema = [
        {
          name: 'Project Name',
          field: 'project_name',
        },
        {
          name: 'VOE Number',
          field: 'voe_no',
        },
        {
          name: 'Registration Number',
          field: 'registration_number_display',
        },
      ];

      formInitialise = [
        'project_name',
        'voe_no',
        'registration_number_display',
      ];
    }

    // =========================
    // EQUIPMENT
    // =========================
    else if (linkType === 'Equipment') {
      columnSchema = [
        {
          name: 'Equipment Name',
          field: 'equipment_name',
        },
        {
          name: 'Registration Number',
          field: 'registration_number',
        },
        {
          name: 'Asset Code',
          field: 'asset_code',
        },
      ];

      formInitialise = ['equipment_name', 'registration_number', 'asset_code'];
    }

    // =========================
    // SITE
    // =========================
    else if (linkType === 'Site') {
      columnSchema = [
        {
          name: 'Site Type',
          field: 'site_type',
        },
        {
          name: 'Site Name',
          field: 'site_name',
        },
        {
          name: 'Site Name Arabic',
          field: 'site_name_arabic',
        },
      ];

      formInitialise = ['site_type', 'site_name', 'site_name_arabic'];
    }

    // =========================
    // FALLBACK
    // =========================
    else {
      columnSchema = [
        {
          name: linkType || 'Linked Object',
          field: displayField,
        },
      ];

      formInitialise = [displayField];
    }

    const dynamicObject = {
      columnSchema,

      selectionMode: 'single',

      rows: 10,

      scrollHeight: '55vh',

      formInitialise,

      paginator: true,

      scrollable: true,

      lazy: true,

      fontSize: '14px',

      queryParams: {
        is_active: true,
        page_size: 30,
      },

      url: searchUrl,

      tableName: 'table',

      height: '70vh',
      width: '75vw',
    };

    const response: any = await this._customDialogService.openDialog(
      {
        // pageTitle: `Select ${linkType || 'Linked Object'}`,
        pageTitle: `Select ${linkType || 'Related Record'}`,

        dialogConfig: {
          width: '75%',
          height: '75%',
        },
      },

      SelectListComponent,

      dynamicObject,
    );

    if (!response?.id) {
      return {
        tableValue,
      };
    }

    // Backend FK reference
    tableValue.linked_object_id = response.id;

    // --------------------------------------------------
    // Main table display value
    // --------------------------------------------------

    if (linkType === 'Project') {
      tableValue.linked_object_display = [
        response?.project_name,
        response?.voe_no,
        response?.registration_number_display,
      ]
        .filter(Boolean)
        .join(' | ');
    } else if (linkType === 'Equipment') {
      tableValue.linked_object_display = [
        response?.equipment_name,
        response?.registration_number,
        response?.asset_code,
      ]
        .filter(Boolean)
        .join(' | ');
    } else if (linkType === 'Site') {
      tableValue.linked_object_display = [
        response?.site_name,
        response?.site_name_arabic,
      ]
        .filter(Boolean)
        .join(' | ');
    } else {
      tableValue.linked_object_display = response?.[displayField] ?? '';
    }

    return {
      tableValue,
    };
  }
  // ==================================================
  // EXPENSE AMOUNT CHANGE
  // ==================================================
  // onChangeExpenseAmount(
  //   value: any,
  //   item: ExpenseClaimLineModel,
  //   formValue: ExpenseClaimModel,
  //   formFields: any,
  // ) {
  //   item.amount = Number(item?.amount || 0);

  //   return this.updateExpenseTotals(formValue);
  // }

  // onChangeExpenseAmount(
  //   value: any,
  //   item: ExpenseClaimLineModel,
  //   formValue: ExpenseClaimModel,
  //   formFields: any,
  // ) {
  //   item.amount = Number(item?.amount || 0);

  //   this.updateExpenseTotals(formValue);

  //   return {
  //     tableValue: item,
  //   };
  // }
  onChangeExpenseAmount(
    value: any,
    item: ExpenseClaimLineModel,
    formValue: ExpenseClaimModel,
    formFields: any,
  ) {
    item.amount = Number(item?.amount || 0);

    this.updateExpenseTotals(formValue);

    return item;
  }

  // ==================================================
  // EXPENSE TOTALS
  // ==================================================
  // updateExpenseTotals(formValue: ExpenseClaimModel) {
  //   const lines = formValue?.lines || [];

  //   const totalClaimed = lines.reduce(
  //     (total: number, line: ExpenseClaimLineModel) =>
  //       total + Number(line?.amount || 0),
  //     0,
  //   );

  //   const advance = Number(formValue?.advance_amount || 0);

  //   const net = totalClaimed - advance;

  //   formValue.total_claimed = Number(totalClaimed.toFixed(2));

  //   formValue.net_payable = Number(net.toFixed(2));

  //   formValue.excess_to_return = net < 0 ? Number(Math.abs(net).toFixed(2)) : 0;

  //   return {
  //     form: formValue,
  //     footerInitialize: [],
  //   };
  // }

  updateExpenseTotals(formValue: ExpenseClaimModel) {
    const lines = formValue?.lines || [];

    const totalClaimed = lines.reduce(
      (total: number, line: ExpenseClaimLineModel) =>
        total + Number(line?.amount || 0),
      0,
    );

    const advance = Number(formValue?.advance_amount || 0);

    const net = totalClaimed - advance;

    formValue.total_claimed = Number(totalClaimed.toFixed(2));

    formValue.net_payable = Number(net.toFixed(2));

    formValue.excess_to_return = net < 0 ? Number(Math.abs(net).toFixed(2)) : 0;

    return formValue;
  }

  onPaidByChange(
    prev: any,
    next: any,
    formValue: ExpenseClaimModel,
    formFields: any,
  ) {
    if (next !== 'PETTY_CASH') {
      formValue.petty_cash_fund = null;
    }

    return formValue;
  }
}
