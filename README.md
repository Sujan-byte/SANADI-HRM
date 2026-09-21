# sanadi-hrm

Reusable HRM plugin, extracted from `ST000065_MECHELLIN_2.0` (branch `HRM_PLUGIN`). Meant to be added as a
single git submodule to any consuming project.

## Layout

- `backend-apps/` — Django apps (self-contained, no dependency on any other client project's own `hrm`/`master`/`utils`/`audit_fields` naming):
  - `hrm_main` — payroll, attendance, gratuity, expense claims, petty cash, and other HRM transactions
  - `hrm_master` — HRM-owned master data: Employee, Department, Designation, Grade, Leave*, Shift*, Allowance*, SalaryComponents, Ticket*, HolidayMaster, ProfessionalTaxSlab, DocumentTypeMaster
  - `hrm_dashboard` — HRM dashboard aggregation views (no own models)
  - `hrm_audit_fields` — shared abstract mixins (audit columns, soft delete, approval workflow, UUID PK) used internally by the apps above
  - `hrm_utils` — shared utility code (number/sequence generation, custom exception handling, etc.) used internally by the apps above
- `frontend-modules/` — Angular modules:
  - `hrm-main` — payroll, attendance, gratuity, expense claims, petty cash screens, and their `shared-forms/hrm-forms/` form-config services
  - `hrm-master` — HRM master-data screens (employee, department, designation, grade, leave-*, shift-*, allowance-*, salary-components, ticket-master, holiday-master, document-type-master, disciplinary-action, status-master) and their `shared-forms/masters-forms/` form-config services

## Integrating into a consuming project

1. Add as a submodule: `git submodule add https://github.com/Sujan-byte/SANADI-HRM.git sanadi-hrm`
2. Backend: add `sanadi-hrm/backend-apps` to `sys.path` (e.g. in `settings.py`, before `INSTALLED_APPS` is evaluated), then add `hrm_audit_fields`, `hrm_utils`, `hrm_master`, `hrm_dashboard`, `hrm_main` to `INSTALLED_APPS` (in that dependency order).
3. Wire routes: `path('api/v1/<str:client>/hrm/', include('hrm_main.api.urls'))`, `path('api/v1/<str:client>/dashboard/', include('hrm_dashboard.urls'))`.
4. Platform dependencies this plugin expects the host project to already provide (not bundled): `branch`, `security`, `tenant`, `notifications`, `customdblogger`, plus the `sequences` pip package.
5. Frontend: in the consuming project's `tsconfig.json`, add a `paths` mapping so existing `src/app/modules/hrm-main/*` and `src/app/modules/hrm-master/*` imports resolve into the submodule instead of requiring every import site to change:
   ```json
   "paths": {
     "src/app/modules/hrm-main/*": ["../sanadi-hrm/frontend-modules/hrm-main/*"],
     "src/app/modules/hrm-master/*": ["../sanadi-hrm/frontend-modules/hrm-master/*"]
   }
   ```
   (adjust the `../sanadi-hrm` prefix if the submodule isn't a sibling of the Angular project root)
6. **Required one-time local setup, every machine, after cloning/pulling this submodule:** Node's module resolution walks up from a file's own physical location looking for `node_modules`, and `sanadi-hrm/` is a sibling of the Angular project, not a descendant — so files under `frontend-modules/` can't otherwise resolve `@angular/core`, `rxjs`, etc. Create a directory junction (no admin rights needed on Windows) so it can:
   ```
   # from the project root, after `npm install` in the Angular project
   cmd /c mklink /J sanadi-hrm\node_modules <path-to-angular-project>\node_modules
   # macOS/Linux equivalent: ln -s <path-to-angular-project>/node_modules sanadi-hrm/node_modules
   ```
   This is machine-local, never committed (`sanadi-hrm/.gitignore` excludes `node_modules/`) — re-create it after any fresh clone.

See the parent project's `HRM Plugin Blueprint` design doc for the full architecture (masters-canonical rule, migration runbook, `hrm_contract.py` design for cross-app foreign keys).
