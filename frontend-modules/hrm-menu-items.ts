import { MenuItem } from 'primeng/api';

/**
 * Reusable HRM sidebar menu definition - the plugin's "menu contract".
 *
 * Any host project wires this in by calling the two factory functions with its own
 * permission-check functions and close-sidebar callback, then splices the results into
 * its own menu-list component. Nothing here depends on any specific menu component
 * implementation - just plain data plus the routerLink/permission strings HRM exposes.
 */

export interface HrmMenuCallbacks {
  checkPermission: (permission: string) => boolean;
  onClick: () => void;
}

/** Permission strings that gate the whole "HRM masters" group (for a host's own group-level `visible`). */
export const HRM_MASTER_PERMISSIONS: string[] = [
  'hrm_master.view_department',
  'hrm_master.view_designation',
  'hrm_master.view_employeemaster',
  'hrm_master.view_grade',
  'hrm_master.view_shiftmaster',
  'hrm_master.view_leavemaster',
  'hrm_master.view_leavepolicy',
  'hrm_main.view_gracedetails',
  'hrm_main.view_attendancestatusmaster',
  'hrm_master.view_salarycomponents',
  'hrm_master.view_holidaymaster',
  'hrm_master.view_leaveentry',
  'hrm_master.view_leaveapplication',
  'hrm_master.view_leavereversalrequest',
  'hrm_master.view_leaveextension',
  'hrm_main.view_attendancedetails',
  'hrm_master.view_documenttypemaster',
];

/** Permission strings that gate the whole "HRM transactions" group (for a host's own group-level `visible`). */
export const HRM_TRANSACTION_PERMISSIONS: string[] = [
  'hrm_master.view_allowanceassignment',
  'hrm_main.view_disciplinaryaction',
  'hrm_main.view_employeemonthlysalary',
  'hrm_main.view_salarycalculation',
  'hrm_main.view_salaryhold',
  'hrm_main.view_otsalarycalculation',
  'hrm_main.view_bonus',
  'hrm_main.view_advance',
  'hrm_main.view_careerletter',
  'hrm_main.view_gratuityemployeeform',
  'hrm_main.view_finalsettlement',
  'hrm_main.view_tada',
  'hrm_main.view_expenseclaimcategory',
  'hrm_main.view_expenseclaim',
  'hrm_main.view_pettycashfund',
  'hrm_main.view_pettycashtransaction',
];

/** HRM-owned master-data screens (Employee, Department, Leave*, Shift*, etc.) - items only, so a
 * host can splice these into its own existing "Master" menu group alongside its own generic items. */
export function getHrmMasterMenuItems(cb: HrmMenuCallbacks): MenuItem[] {
  return [
    { label: 'Department', routerLink: '/app/masters/department', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_department') },
    { label: 'Designation', routerLink: '/app/masters/designation', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_designation') },
    { label: 'Employee', routerLink: '/app/masters/employee', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_employeemaster') },
    { label: 'Grade', routerLink: '/app/masters/grade', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_grade') },
    { label: 'Shift Master', routerLink: '/app/masters/shift-master', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_shiftmaster') },
    { label: 'Leave Master', routerLink: '/app/masters/leave-master', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leavemaster') },
    { label: 'Leave Policy', routerLink: '/app/masters/leave-policy', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leavepolicy') },
    { label: 'Attendance Policy', routerLink: '/app/hrm/grace-details', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_gracedetails') },
    { label: 'Status Master', routerLink: '/app/masters/status-master', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_attendancestatusmaster') },
    { label: 'Document Type Master', routerLink: '/app/masters/document-type-master', icon: 'pi pi-file', command: cb.onClick, visible: true },
    { label: 'Salary Components', routerLink: '/app/masters/salary-components', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_salarycomponents') },
    { label: 'Holiday Master', routerLink: '/app/masters/holiday-master', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_holidaymaster') },
    { label: 'Leave Entry', routerLink: '/app/masters/leave-entry', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leaveentry') },
    { label: 'Leave Application', routerLink: '/app/masters/leave-application', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leaveapplication') },
    { label: 'Leave Reversal Application', routerLink: '/app/masters/leave-reversal-request', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leavereversalrequest') },
    { label: 'Leave Extension', routerLink: '/app/masters/leave-extension', icon: 'pi pi-file-export', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_leaveextension') },
    { label: 'Time Sheet', routerLink: '/app/report/time-sheet', icon: 'pi pi-chart-line', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_attendancedetails') },
  ];
}

/** HRM transaction screens (Advance, Bonus, Payroll, etc.) - a full top-level "HRM" menu group,
 * since this group is entirely plugin-owned with nothing generic mixed in. */
export function getHrmTransactionMenuGroup(
  cb: HrmMenuCallbacks,
  checkModulePermissions: (permissions: string[]) => boolean
): MenuItem {
  return {
    label: 'HRM',
    visible: checkModulePermissions(HRM_TRANSACTION_PERMISSIONS),
    items: [
      { label: 'Allowance Management', icon: 'pi pi-file-export', routerLink: '/app/masters/allowance-assignment', command: cb.onClick, visible: cb.checkPermission('hrm_master.view_allowanceassignment') },
      { label: 'Disciplinary Action', icon: 'pi pi-file-export', routerLink: '/app/masters/disciplinary-action', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_disciplinaryaction') },
      { label: 'Employee Salary', icon: 'pi pi-file-export', routerLink: '/app/hrm/employee-salary', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_employeemonthlysalary') },
      { label: 'Payroll Register', icon: 'pi pi-file-export', routerLink: '/app/hrm/salary-calculation', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_salarycalculation') },
      { label: 'Salary Hold', icon: 'pi pi-file-export', routerLink: '/app/hrm/salary-hold', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_salaryhold') },
      { label: 'Salary Increment', icon: 'pi pi-file-export', routerLink: '/app/hrm/salary-increment', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_employeemonthlysalary') },
      { label: 'OT Payroll Register', icon: 'pi pi-file-export', routerLink: '/app/hrm/ot-salary-calculation', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_otsalarycalculation') },
      { label: 'Bonus', icon: 'pi pi-file-export', routerLink: '/app/hrm/bonus', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_bonus') },
      { label: 'Advance', icon: 'pi pi-file-export', routerLink: '/app/hrm/advance', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_advance') },
      { label: 'Career Letter', icon: 'pi pi-file-export', routerLink: '/app/hrm/career-letter', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_careerletter') },
      { label: 'Gratuity Form', icon: 'pi pi-file-export', routerLink: '/app/hrm/gratuity', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_gratuityemployeeform') },
      { label: 'Final Settlement Form', icon: 'pi pi-file-export', routerLink: '/app/hrm/final-settlement', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_finalsettlement') },
      { label: 'Travel / TA-DA Form', icon: 'pi pi-file-export', routerLink: '/app/hrm/ta-da', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_tada') },
      { label: 'Expense Claim Category', icon: 'pi pi-file-export', routerLink: '/app/hrm/expense-claim-category', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_expenseclaimcategory') },
      { label: 'Expense Claim', icon: 'pi pi-file-export', routerLink: '/app/hrm/expense-claim', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_expenseclaim') },
      { label: 'Petty Cash Fund', icon: 'pi pi-file-export', routerLink: '/app/hrm/petty-cash-fund', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_pettycashfund') },
      { label: 'Petty Cash Transaction', icon: 'pi pi-file-export', routerLink: '/app/hrm/petty-cash-transaction', command: cb.onClick, visible: cb.checkPermission('hrm_main.view_pettycashtransaction') },
    ],
  };
}
