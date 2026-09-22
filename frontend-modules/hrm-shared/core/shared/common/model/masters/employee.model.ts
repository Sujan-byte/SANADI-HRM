import { Strategy } from "ngx-permissions";
import { GlobalMasterModel } from "./global-master.model";

export class EmployeeModel {
  id?: number;
  employee_code?: string;
  biometric_key?: string;
  employee_card_number?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  mother_name?: string;
  father_or_husband_name?: string;
  employee_type?: string;
  detailed_employee_type?: any;
  count_by_level?: any;
  designation?: any;
  department?: any;
  grade?: any;
  default_shift?: any;
  weekly_off?: any;
  employee_group?: any;
  nationality?: any;
  device_id?: any;
  first_reporting_authority?: string;
  report_authority_first_name?: string;
  report_authority_last_name?: string;
  second_report_authoritying?: string;
  second_report_authority_first_name?: string;
  second_report_authority_last_name?: string;
  system_user?: any;
  user_password?: any;
  groups?: any;
  user?: any;
  dob?: null
  doj?: any
  doc?: null
  dor?: any;
  local_mobile_number?: string;
  home_mobile_number?: string | null;
  address?: string;
  postal_code?: string;
  email?: string;
  marital_status?: string;
  gender?: string;
  blood_group?: string;
  religion?: string;
  passport_no?: any;
  passport_issue_date?: any;
  passport_expiry_date?: any;
  visa_no?: any;
  visa_issue_date?: any;
  visa_expiry_date?: any;
  emirates_id_no?: any;
  emirates_id_issue_date?: any;
  emirates_id_expiry_date?: any;
  labour_card_no?: any;
  labour_card_issue_date?: any;
  labour_card_expiry_date?: any;
  fhc_no?: any;
  fhc_issue_date?: any;
  fhc_expiry_date?: any;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  iban_no?: string;
  swift_code?: string;
  wps_establishment_id?: any;
  payment_method?: any;
  account_type?: any;
  bank_routing_no?: any;
  nominee_relationship?: string;
  nominee_mobile_number?: string;
  nominee_name?: string;
  payout?: any;
  branch?: any;
  previous_employments?: Array<PreviousEmploymentDetails>;
  lic_details?: Array<LicDetails>;
  department_default_object?: Record<string, any>;
  designation_default_object?: Record<string, any>;
  default_operator_object?: Record<string, any>;
  default_technician_object?: Record<string, any>;
  grade_default_object?: Record<string, any>;
  default_first_reporting_authority_object?: Record<string, any>;
  default_second_reporting_authority_object?: Record<string, any>;
  default_global_object?: Record<string, any>;
  default_main_group_object?: Record<string, any>;
  profileImage?: any
  employee_documents_details?: Array<EmployeeDocumentsTableModel>;
  employee_nominee_details?: Array<EmployeeNomineeDetailsModel>;
  job_loss_insurance_no?: any;
  job_loss_insurance_issue_date?: any;
  job_loss_insurance_expiry_date?: any;

  //driving license details
  license_number?: any;
  permit_number?: any;
  issue_date_of_license?: any;
  expiry_date_of_license?: any;
  is_exchange_number?: any;
  exchange_number?: any;

  sponsors?: any;
  //operator mechanic classification
  operator_driver?: any;
  mechanic_technician?: any;
  primary_equipment_specialization?: any;
  secondary_equipment_specialization?: any;
  employee_status_is_active?: any;
  resident?: string = '';
  operator_type?: any;

  cicpa_number?: any;
  cicpa_name?: any;
  cicpa_location?: any;
  cicpa_expiry_date?: any;
  technician_type?: any;
  passport_image?: any;
  profile_image?: any;
  globalList?: Array<GlobalMasterModel>;
  SecondoryList?: Array<GlobalMasterModel>;
  TertiaryList?: Array<GlobalMasterModel>;
  QuaternaryList?: Array<GlobalMasterModel>;
  shift_category_object?: any;
  shift_details?: any;
  branch_master?: any;
  is_emirati?: any;
  is_under_leave?: any;
  note?: any;

  // India-payroll fields (Michellin-specific, no equivalent backend column yet)
  pan_card?: string;
  aadhar_number?: string;
  mobile_number?: string;
  alternate_mobile_number?: string | null;
  pf_account_number?: string;
  religion_type?: string;
  health_issue?: string;
  health_issue_details?: string;
  esi_number?: string;
  uan_number?: string;
  beneficiary_code?: string;
  aadharImage?: any;
  panard_image?: any;
  user_created?: string = '';
}

export class PreviousEmploymentDetails {
  id?: number;
  company_name?: string;
  designation?: string;
  location?: string;
  joined_date?: string;
  resigned_date?: any;
}
export class LicDetails {
  id?: number;
  policy_number?: string;
  amount?: number
}

export class SecurityUser {
  employee?: number;
  password?: number;
}
export class EmployeeDocumentsTableModel {
  id?: any;
  document_name?: string;
  document?: any;
  document_number?: string;
  document_valid_upto?: any;
}


export class EmployeeNomineeDetailsModel {
  id?: any;
  nominee_relationship?: string;
  nominee_name?: any;
  nominee_aadhar_number?: string;
  nominee_mobile_number?: any;
  nominee_percentage?: any;
}
