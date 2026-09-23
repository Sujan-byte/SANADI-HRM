/**
 * URL path fragments for HRM-owned API endpoints (Leave*, Allowance Assignment,
 * Document Type Master, Attendance Status Master, Expense Claim*, Petty Cash*).
 *
 * These are plugin-owned, not host-owned - unlike the host's own ServiceUrlConstants
 * (which covers the whole ERP and legitimately differs per host), every one of these
 * endpoints is served by this submodule's own hrm_master/hrm_main Django apps, so the
 * path fragments are identical for any host. Host code still uses its own
 * ServiceUrlConstants for everything else; only this submodule's own components need
 * these, imported via the `src/app/modules/hrm-service-url-constants` path alias.
 */
export class HrmServiceUrlConstants {
  public static DOCUMENT_TYPE_MASTER_CRUD = '/master/document-type-master/';
  public static LEAVE_ENTRY_CRUD = '/master/leave-entry/';
  public static LEAVE_APPLICATION_CRUD = '/master/leave-application/';
  public static LEAVE_REVERSAL_CRUD = '/master/leave-reversal-request/';
  public static LEAVE_EXTENSION_CRUD = '/master/leave-extension/';
  public static ALLOWANCE_ASSIGNMENT_CRUD = '/master/allowance-assignment/';
  public static ATTENDANCE_STATUS_MASTER_CRUD = '/hrm/attendance_status_master/';
  public static EXPENSE_CLAIM_CATEGORY_CRUD = '/hrm/expense-claim-categories/';
  public static EXPENSE_CLAIM_CRUD = '/hrm/expense-claims/';
  public static PETTY_CASH_FUND_CRUD = '/hrm/petty-cash-funds/';
  public static PETTY_CASH_TRANSACTION_CRUD = '/hrm/petty-cash-transactions/';
  public static LEAVE_MASTER_CRUD = '/master/leave-master/';
  public static LEAVE_POLICY_CRUD = '/master/leave-policy/';
  public static HOLIDAY_MASTER_CRUD = '/master/holiday-master/';
  public static SHIFT_MASTER_DURATION = '/master/shift-master/';
  public static SALARY_COMPONET_CRUD = '/master/salary-components/';
  public static EXPENSE_CLAIM_LINK_TYPE_CRUD = '/hrm/expense-claim-link-types/';
  public static TICKET_MASTER = '/master/ticket-master/';
  public static GRACE_DETAIL_CRUD = '/hrm/grace-details/';
  public static HISTORICAL_ATTENDANCE_DETAILS_API = '/hrm/historical_attendance_details/';
}
