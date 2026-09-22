import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InputField } from '../core/builders/input.builder';
import { TabBuilder } from '../core/builders/tab.builder';
import { TextBuilder } from '../core/builders/textarea.builder';
import { ApiService } from 'src/app/core/services/api.service';
import { BranchAddressModel, BranchBankDetailsModel, BranchModel, BranchUser } from '../../model/admin/branch.model';
import { BranchAddressEnums, BranchBankDetailsEnums, BranchEnum } from '../../enum/admin-enum/branch.enum';
import { NumberField } from '../core/builders/number.builder';
import { FileField } from '../core/builders/file.builder';
import { OverlayPanelBuilder, TableBuilder } from '../core/builders/table.builder';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { country } from '../../../state/country';
import { DropdownField } from '../core/builders/dropdown.builder';
import { DateField } from '../core/builders/date.builder';
import { ToggleBuilder } from '../core/builders/toggle.builder';
import { CalenderDateEnum, FilterOptions, MomentDateEnum } from '../../enum/app.enum';
import { foreignOrDomestic } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';

@Injectable({
  providedIn: 'root',
})
export class BranchFormConfig {
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private selectedUserList: BranchUser[] = [];
  private countryList = signal(country);
  private stateList = signal([]);

  public readonly BranchForm =
    () =>
      (dataFromComponent?: any, initialData?: BranchModel, isEditMode?: boolean, data?: BranchModel) => {
        initialData = new BranchModel();
        let branchUser = isEditMode ? data.branch : [];
        let labelChangesVatprGst = foreignOrDomestic() === 'DOMESTIC' ? "gst_no_TC" : "vat_no_TC";

        let branchBankDetails = isEditMode ? data?.branch_bank_details : [];
        const branchAddress = isEditMode ? data?.branch_address : [];
        this.selectedUserList = isEditMode ? data.branch ? Array.from(data.branch) : [] : [];
        let selectedCountry = isEditMode ? data?.country_name ? this.countryList().find((ele) => ele.country == data.country_name) : {} : this.countryList().find((ele) => ele.country == 'United Arab Emirates');
        let default_branch_app_config = isEditMode ? data?.default_branch_app_config : {};
        let default_company_app_config = isEditMode ? data?.default_company_app_config : {};
        initialData.country_name = 'United Arab Emirates';
        initialData.country_code = '+971';
        if (Object.keys(selectedCountry).length != 0) {
          this.stateList.set(selectedCountry["states"]);
        }

        return [
          new TabBuilder(this.translate)
            .addTabFields([
              {
                tabHeader: this.translate.instant('branch_TC'),
                fields: [
                  new InputField(this.translate, BranchEnum.branchName, isEditMode, data, initialData)
                    .addFieldWidth('24%')
                    .validate(true, 1, 255)
                    .toObject(),
                  new DropdownField(this.translate, BranchEnum.branchAppConfig, isEditMode, data, initialData, true, undefined, undefined, '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['app_name'], 'id')
                    .setRequiredFields('id,app_name')
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(default_branch_app_config)
                    .validate(true)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.BRANCH_APP_CONFIGURATION_CRUD}`,

                        filterKeys: [`app_name__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),

                  new DropdownField(this.translate, BranchEnum.company, isEditMode, data, initialData, true, undefined, 'Company Name', '23vw')
                    .addFieldWidth('24%')
                    .addKeyValueLabelList(['business_name'], 'id')
                    .setRequiredFields('id,business_name')
                    .getOptions(signal([]))
                    .isLazyFilterDropDown(true)
                    .isNeedRequiredFields(true)
                    .setDefaultObject(default_company_app_config)
                    .validate(true)
                    .getUrlConfig({
                      get: {
                        url: `${ServiceUrlConstants.COMPANY_APP_CONFIGURATION_CRUD}`,

                        filterKeys: [`business_name__${FilterOptions.iContains}`]
                      }
                    })
                    .bindOption(this.updateDynamicDropdownOptions.bind(this))
                    .toObject(),
                  {
                    type: 'accordion',
                    multiple: true,
                    fields: [
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('location_TC'),
                        selected: true,
                        fields: [
                          new DropdownField(this.translate, BranchEnum.countryName, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .variantType('basic')
                            .addKeyValueLabel('country', 'country')
                            .getOptions(this.countryList)
                            .onChangeOnly(this.onChangeHandler.bind(this))
                            .toObject(),
                          new InputField(this.translate, BranchEnum.countryCode, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new DropdownField(this.translate, BranchEnum.stateName, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .variantType('basic')
                            .validate(true)
                            .addKeyValueLabel('name', 'name')
                            .getOptions(this.stateList)
                            .onChangeOnly(this.onChangeState.bind(this))
                            .toObject(),
                          new InputField(this.translate, BranchEnum.stateCode, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 100)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.city, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 100)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.pinCode, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 10)
                            .toObject(),
                          new DateField(this.translate, BranchEnum.fiscal_from_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .addFormat(CalenderDateEnum.monthYear)
                            .addMomentDateFormat(MomentDateEnum.monthYear)
                            // .setMinDateValue(bonus_months)
                            .validate(true)
                            .setView('month')
                            .toObject(),
                          new DateField(this.translate, BranchEnum.fiscal_to_date, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .addFormat(CalenderDateEnum.monthYear)
                            .addMomentDateFormat(MomentDateEnum.monthYear)
                            // .setMinDateValue(year_months)
                            .validate(true)
                            .setView('month')
                            .toObject(),

                        ]
                      },
                      {
                        // @ts-ignore
                        accordionHeader: this.translate.instant('contactInfo_TC'),
                        selected: true,
                        fields: [
                          new InputField(this.translate, BranchEnum.email, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true, 0, 50, true)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.phoneNo, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.faxNumber, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.website, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 255)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.gstNo, isEditMode, data, initialData, labelChangesVatprGst)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.cinNo, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.dunsNumber, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 50)
                            .toObject(),
                          new ToggleBuilder(this.translate, BranchEnum.isHeadOffice, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .toObject(),
                          new TextBuilder(this.translate, BranchEnum.registeredAddress, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 500)
                            .toObject(),
                          new TextBuilder(this.translate, BranchEnum.corporateAddress, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true, 1, 500)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.organizationType, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true, 1, 500)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.businessCategory, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(true, 1, 500)
                            .toObject(),
                          new InputField(this.translate, BranchEnum.description, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .validate(false, 0, 500)
                            .toObject(),
                          new ToggleBuilder(this.translate, BranchEnum.is_weightage_average, isEditMode, data, initialData)
                            .addFieldWidth('24%')
                            .isFieldHidden(true)
                            .toObject(),
                        ]
                      }
                    ]
                  },
                  new TableBuilder(this.translate, BranchEnum.branchAddress, this.translate.instant(`${BranchEnum.branchAddress}_TC`))
                    .columnSchema([
                      'branch_name_TC',
                      'address_TC',
                      'country_TC',
                      'state_TC',
                      'state_code_TC',
                      'city_TC',
                      'zip_code_TC',
                      'fax_number_TC',
                      'phone_number_TC',
                      'tax_number_TC'
                    ])
                    .formInitialise<BranchAddressModel>(new BranchAddressModel())
                    .formSchema([
                      {
                        type: 'input',
                        name: BranchAddressEnums.branchName,
                      },
                      {
                        type: 'textArea',
                        name: BranchAddressEnums.address,
                      },
                      {
                        type: 'dropdown',
                        name: BranchAddressEnums.country,
                        options: this.countryList(),
                        optionLabel: "country",
                        optionValue: "country"
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.state,
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.stateCode,
                      },
                      {
                        name: BranchAddressEnums.city,
                        type: 'input',
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.zipCode,
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.faxNumber,
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.phoneNumber,
                      },
                      {
                        type: 'input',
                        name: BranchAddressEnums.taxNumber,
                      }
                    ])
                    .getDatasource<Array<BranchAddressModel>>('id', branchAddress)
                    // .setTableWidth('91vw')
                    .build()
                ],
              },
              {
                tabHeader: this.translate.instant('images_TC'),
                fields: [
                  new FileField(this.translate, BranchEnum.images, isEditMode, data, initialData)
                    .addFieldWidth('50%')
                    .setAlignment('center')
                    .isBase64StringFile(true)
                    .toObject(),
                ]
              },
              {
                tabHeader: this.translate.instant('branchUsers_TC'),
                fields: [
                  new TableBuilder(this.translate, 'branch', '', true)
                    .columnSchema([
                      { name: "user_TC", colWidth: '200px' },
                    ])
                    .formInitialise<BranchUser>(new BranchUser())
                    .formSchema([
                      {
                        name: 'email',
                        type: 'input',
                        readonly: true
                      },
                    ])
                    .getDatasource<Array<BranchUser>>('id', branchUser)
                    .enableFooter(true)
                    .setAddButton(true)
                    .setTableCaption(true)
                    .setTableCaptionDialogButton(true)
                    .setTableCaptionDialogButtonLabel("Add Branch User")
                    .buttonStates(true, false, false, false, false, true)
                    .setField(
                      new OverlayPanelBuilder()
                        .setTableName("branch")
                        .setOverlayPanelColumnSchema([{ name: 'user_TC', field: 'email' }])
                        .setOnUpdateRows(this.updateTableRows.bind(this))
                        .setOverlayPanelSelectionMode('single')
                        .setOverlayPanelRows(10)
                        .setDialogScrollHeight('58vh')
                        .setOverlayPanelFormInitialise(['email'])
                        .setOverlayPanelPaginator(true)
                        .setScrollable(true)
                        .setLazy(true)
                        .setFontSize('14px')
                        .setQueryParams({})
                        .setDisabledField('false')
                        .setOverlayPanelSelectedArray(this.selectedUserList)
                        .setUrls(ServiceUrlConstants.APP_USER_CRUD)
                        .setOverlayDialogConfig({ width: '50vw', height: '80vh' })
                        .build()
                    )
                    .build(),
                ]
              },
              {
                tabHeader: this.translate.instant('bankDetails_TC'),
                fields: [
                  new TableBuilder(this.translate, BranchEnum.branchBankDetails)
                    .columnSchema([
                      'bank_name_TC',
                      'branch_name_TC',
                      'account_name_TC',
                      'account_number_TC',
                      'bank_address_TC',
                      'ifsc_TC',
                      'swift_code_TC',
                      'bank_code_TC',
                    ])
                    .formInitialise<BranchBankDetailsModel>(new BranchBankDetailsModel())
                    .formSchema([
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.bankName,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.branchName,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.accountName,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.accountNumber,
                      },
                      {
                        type: 'textArea',
                        name: BranchBankDetailsEnums.bankAddress,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.ifsc,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.swiftCode,
                      },
                      {
                        type: 'input',
                        name: BranchBankDetailsEnums.bankCode,
                      },
                    ])
                    .getDatasource<Array<BranchBankDetailsModel>>('id', branchBankDetails)
                    .build()
                ],
              },
            ])
        ];
      };

  updateTableRows(rows) {
    return rows.map((row) => {
      console.log("row on selection", row)
      let branchItem: BranchUser = new BranchUser();
      branchItem.tableRowId = row.id;
      branchItem.user = row.id;
      branchItem.email = row.email
      console.log("branch", branchItem)
      return branchItem
    })
  }

  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  onChangeHandler(prev, next, formValue) {
    // console.log("On change handler", prev)
    // Inside this function, you call your calculation function
    return this.changeCountry(prev, next, formValue);
  }

  changeCountry(prev: any, value: any, formValue: any): void {
    // console.log("Country", country, formValue.country);
    let selectedCountry = country.find((ele) => ele.country == formValue[BranchEnum.countryName]);
    // console.log("Selected Country", selectedCountry);
    this.stateList.set(selectedCountry["states"]);
    formValue[BranchEnum.countryCode] = selectedCountry['value'];

    if (prev !== 0) {
      formValue[BranchEnum.stateName] = '';
      formValue[BranchEnum.stateCode] = '';
    }
    return formValue;
  }

  onChangeState(prev: any, value: any, formValue: any): void {
    // console.log("state",this.stateList,formValue[BranchEnum.stateName]);
    let selectedState = this.stateList().find((item) => item.name === formValue[BranchEnum.stateName]);
    if (selectedState) {
      formValue[BranchEnum.stateCode] = selectedState.value;
    }
    return formValue;
  }
  updateDynamicDropdownOptions(response) {
    if (response?.results?.length) {
      const options = (<any>response)?.results;
      return options;
    }
  }
}
