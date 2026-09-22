export class SalaryHoldModel {
    id: number;
    employee_ids: any[]    = [];
    employee_names: string = '';
    hold_from_date: Date   = null;
    hold_to_date: Date     = null;
    reason: string         = '';
    remarks: string        = '';
    released_on: Date      = null;
    release_remarks: string = '';
}
