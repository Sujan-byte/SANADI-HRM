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
- `frontend-modules/` — Angular module(s) (not yet extracted; pending)

## Integrating into a consuming project

1. Add as a submodule: `git submodule add https://github.com/Sujan-byte/SANADI-HRM.git sanadi-hrm`
2. Backend: add `sanadi-hrm/backend-apps` to `sys.path` (e.g. in `settings.py`, before `INSTALLED_APPS` is evaluated), then add `hrm_audit_fields`, `hrm_utils`, `hrm_master`, `hrm_dashboard`, `hrm_main` to `INSTALLED_APPS` (in that dependency order).
3. Wire routes: `path('api/v1/<str:client>/hrm/', include('hrm_main.api.urls'))`, `path('api/v1/<str:client>/dashboard/', include('hrm_dashboard.urls'))`.
4. Platform dependencies this plugin expects the host project to already provide (not bundled): `branch`, `security`, `tenant`, `notifications`, `customdblogger`, plus the `sequences` pip package.
5. Frontend wiring: pending until `frontend-modules/` is populated.

See the parent project's `HRM Plugin Blueprint` design doc for the full architecture (masters-canonical rule, migration runbook, `hrm_contract.py` design for cross-app foreign keys).
