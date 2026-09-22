export class DocumentTypeMasterModel {
  id?: number;

  doc_type_code?: string | null;
  doc_type_name?: string | null;

  applies_to: string = 'Employee';

  expiry_required: boolean = true;

  default_alert_days: number[] = [];

  remarks?: string | null;

  constructor() {
    this.applies_to = 'Employee';
    this.expiry_required = true;
    this.default_alert_days = [];
  }
}