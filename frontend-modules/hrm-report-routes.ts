import { Routes } from '@angular/router';

/**
 * Route entries for every HRM-owned report screen, meant to be spread into a host's
 * existing report-engine routing (they need to sit under the host's own `/app/report/*`
 * prefix, alongside its own generic reports, not off in a separate namespace - so this
 * can't just be one `loadChildren` the way hrm-main's own routing is, for the same reason
 * hrm-master's routes and backend viewsets can't either).
 *
 * A host wires this in instead of hand-listing each hrm report route:
 *
 *   import { HRM_REPORT_ROUTES } from 'src/app/modules/hrm-report-routes';
 *   const routes: Routes = [
 *     ...the host's own report-engine routes...,
 *     ...HRM_REPORT_ROUTES,
 *   ];
 *
 * These paths are already a de facto contract, not just a convenience - hrm-menu-items.ts's
 * routerLinks (/app/report/time-sheet) hardcode the exact same segments, so a host can't
 * rename them without also breaking its own menu. Keeping the canonical list here means a
 * newly added HRM report screen is picked up automatically on the host's next
 * `git submodule update`, instead of silently unreachable until someone notices and manually
 * adds a route entry - exactly the gap that left the Timesheet Report 404ing despite its
 * component and menu item already existing.
 */
export const HRM_REPORT_ROUTES: Routes = [
  {
    path: 'time-sheet',
    loadComponent: async () =>
      (await import('./hrm-shared/modules/custom-reports/time-sheet-report/time-sheet/time-sheet.component'))
        .TimeSheetComponent,
  },
];
