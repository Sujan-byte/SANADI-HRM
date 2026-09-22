export class BranchModel {
    id?: number;
    branch_name?: string;
    city?: string;
    pin_code?: string;
    state_code?: string;
    country_code?: string;
    state_name?: string;
    country_name?: string;
    gst_no?: string;
    cin_no?: string;
    email?: string;
    phone_no?: string;
    fax_number?: string;
    website?: string;
    duns_number?: string;
    is_head_office?: boolean;
    registered_address?: string;
    corporate_address?: string;
    organization_type?: string;
    business_category?: string;
    description?: string;
    fiscal_from_date?: any;
    fiscal_to_date?: any;
    is_weightage_average?: any;
    images?: any;
    branch?: Array<BranchUser>;
    branch_bank_details?: Array<BranchBankDetailsModel> = [];
    branch_address?: Array<BranchAddressModel> = [];
    default_branch_app_config?:any={};
    default_company_app_config?:any={};
    branch_app_config?: any;
    company?: any;
}

export class BranchUser {
    id?: any;
    tableRowId?: any;
    branch?: number;
    user?: number;
    email?: string;
}

export class BranchBankDetailsModel {
    id?: number;
    branch?: any = null;
    bank_name?: string = '';
    branch_name?: string = '';
    account_name?: string = '';
    account_number?: string = '';
    bank_address?: string = '';
    ifsc?: string = '';
    swift_code?: string = '';
    bank_code?: string = '';
}

export class BranchAddressModel {
    id?: any = null;
    branch?: any = null;
    branch_name?: string = '';
    address?: string = '';
    country?: string = 'United Arab Emirates';
    city?: string = '';
    state?: string = '';
    state_code?: string = '';
    zip_code?: string = '';
    fax_number?: string = '';
    phone_number?: string = '';
    tax_number?: string = '';
}