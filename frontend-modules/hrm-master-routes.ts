import { Routes } from '@angular/router';

/**
 * Route entries for every hrm-master master-data screen, meant to be spread into a host's
 * existing masters routing (they need to sit under the host's own `/app/masters/*` prefix,
 * alongside its own generic masters, not off in a separate namespace - so this can't just be
 * one `loadChildren` the way hrm-main's own routing is, the way hrm_master's backend viewsets
 * can't just be one `include()` either, for the same reason).
 *
 * A host wires this in instead of hand-listing each hrm-master route:
 *
 *   import { HRM_MASTER_ROUTES } from 'src/app/modules/hrm-master-routes';
 *   const routes: Routes = [
 *     ...the host's own masters routes...,
 *     ...HRM_MASTER_ROUTES,
 *   ];
 *
 * These paths are already a de facto contract, not just a convenience - hrm-menu-items.ts's
 * routerLinks (/app/masters/department, /app/masters/ticket-master, etc.) hardcode the exact
 * same segments, so a host can't rename them without also breaking its own menu. Keeping the
 * canonical list here means a newly added hrm-master screen is picked up automatically on the
 * host's next `git submodule update`, instead of silently unreachable until someone notices and
 * manually adds a route entry - exactly the gap this fixes (ticket-master went unwired this way
 * despite its backend route existing since the very first integration pass).
 */
export const HRM_MASTER_ROUTES: Routes = [
  {
    path: 'department',
    loadComponent: async () =>
      (await import('./hrm-master/department/department.component'))
        .DepartmentComponent,
  },
  {
    path: 'designation',
    loadComponent: async () =>
      (await import('./hrm-master/designation/designation.component'))
        .DesignationComponent,
  },
  {
    path: 'grade',
    loadComponent: async () =>
      (await import('./hrm-master/grade/grade.component'))
        .GradeComponent,
  },
  {
    path: 'employee',
    loadComponent: async () =>
      (await import('./hrm-master/employee/employee.component'))
        .EmployeeComponent,
  },
  {
    path: 'leave-entry',
    loadComponent: async () =>
      (await import('./hrm-master/leave-entry/leave-entry.component'))
        .LeaveEntryComponent,
  },
  {
    path: 'leave-master',
    loadComponent: async () =>
      (await import('./hrm-master/leave-master/leave-master.component'))
        .LeaveMasterComponent,
  },
  {
    path: 'holiday-master',
    loadComponent: async () =>
      (await import('./hrm-master/holiday-master/holiday-master.component'))
        .HolidayMasterComponent,
  },
  {
    path: 'shift-master',
    loadComponent: async () =>
      (await import('./hrm-master/shift-master/shift-master.component'))
        .ShiftMasterComponent,
  },
  {
    path: 'leave-policy',
    loadComponent: async () =>
      (await import('./hrm-master/leave-policy/leave-policy.component'))
        .LeavePolicyComponent,
  },
  {
    path: 'status-master',
    loadComponent: async () =>
      (await import('./hrm-master/status-master/status-master.component'))
        .StatusMasterComponent,
  },
  {
    path: 'document-type-master',
    loadComponent: async () =>
      (await import('./hrm-master/document-type-master/document-type-master.component'))
        .DocumentTypeMasterComponent,
  },
  {
    path: 'salary-components',
    loadComponent: async () =>
      (await import('./hrm-master/salary-components/salary-components.component'))
        .SalaryComponentsComponent,
  },
  {
    path: 'leave-application',
    loadComponent: async () =>
      (await import('./hrm-master/leave-application/leave-application.component'))
        .LeaveApplicationComponent,
  },
  {
    path: 'leave-reversal-request',
    loadComponent: async () =>
      (await import('./hrm-master/leave-reversal-request/leave-reversal-request.component'))
        .LeaveReversalRequestComponent,
  },
  {
    path: 'leave-extension',
    loadComponent: async () =>
      (await import('./hrm-master/leave-extension/leave-extension.component'))
        .LeaveExtensionComponent,
  },
  {
    path: 'allowance-assignment',
    loadComponent: async () =>
      (await import('./hrm-master/allowance-assignment/allowance-assignment.component'))
        .AllowanceAssignmentComponent,
  },
  {
    path: 'disciplinary-action',
    loadComponent: async () =>
      (await import('./hrm-master/disciplinary-action/disciplinary-action.component'))
        .DisciplinaryActionComponent,
  },
  {
    path: 'ticket-master',
    loadComponent: async () =>
      (await import('./hrm-master/ticket-master/ticket-master.component'))
        .TicketMasterComponent,
  },
];
