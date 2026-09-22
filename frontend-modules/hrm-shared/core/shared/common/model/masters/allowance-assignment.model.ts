export class AllowanceAssignmentEmployeeModel {
    employee:         any    = '';
    employee_code:    string = '';
    employee_name:    string = '';
    designation_name: string = '';
    department_name:  string = '';
    amount:           number = 0;
    rate:             number = 0;
    remark:           string = '';
}

export class AllowanceAssignmentModel {
    id?:                    any    = '';
    batch_id?:              any    = '';
    assignment_code?:       string = '';
    approval_status?:       string = '';
    // Allowance
    allowance:              any    = '';
    allowance_code:         string = '';
    allowance_name:         string = '';
    allowance_type:         string = '';
    // Default object for lazy allowance dropdown (populated from backend in edit mode)
    allowance_default_object: any = {};
    // Display-only (not sent to API)
    filter_employee_picker: string = '';
    // Mode
    mode:                   string = 'manual';
    amount:                 number = 0;
    rate:                   number = 0;
    // Dates
    from_date:              string = '';
    to_date:                string = '';
    // Employee filter
    filter_criteria:        string = 'employee_wise';
    filter_designation_ids: string = '';
    filter_department_ids:  string = '';
    // Employee list (used in form Tab 2)
    employees:              AllowanceAssignmentEmployeeModel[] = [];
    is_active:              boolean = true;
}
