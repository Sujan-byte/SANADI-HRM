# sanadi-hrm

Reusable HRM plugin. Meant to be added as a single git submodule to any consuming project,
sibling to that project's own backend/frontend directories.

## Layout

- `backend-apps/` — Django apps (self-contained, no dependency on any other client project's own
  `hrm`/`master`/`utils`/`audit_fields` naming):
  - `hrm_main` — payroll, attendance, gratuity, expense claims, petty cash, and other HRM transactions
  - `hrm_master` — HRM-owned master data: Employee, Department, Designation, Grade, Leave*, Shift*,
    Allowance*, SalaryComponents, Ticket*, HolidayMaster, ProfessionalTaxSlab, DocumentTypeMaster
  - `hrm_dashboard` — HRM dashboard aggregation views (no own models)
  - `hrm_audit_fields` — shared abstract mixins (audit columns, soft delete, approval workflow, UUID PK)
    used internally by the apps above
  - `hrm_utils` — shared utility code (number/sequence generation, custom exception handling, etc.)
    used internally by the apps above
  - `hrm_plugin_config.py` — the integration manifest: `HRM_INSTALLED_APPS` and `get_hrm_urlpatterns()`
  - `hrm_contract_resolver.py` — cross-project foreign key resolution (see below)
- `frontend-modules/` — Angular, all standalone components, no NgModule declarations to wire up:
  - `hrm-main` — payroll, attendance, gratuity, expense claims, petty cash screens
  - `hrm-master` — HRM master-data screens (employee, department, designation, grade, leave-*,
    shift-*, allowance-*, salary-components, ticket-master, holiday-master, document-type-master,
    disciplinary-action, status-master)
  - `hrm-dashboard` — HRM dashboard screens (currently no i18n wiring — hardcoded English strings)
  - `hrm-shared/` — **self-contained copies** of every piece of generic Angular framework this
    submodule's own components depend on (form-builder field classes, `sanadi-library` components —
    dynamic-form-generator, dynamic-print-receipt-generator, table-filter, dialogs — and the shared
    models/enums they use). This exists so a host project does **not** need to already have matching
    versions of this infrastructure; the two exceptions are `ApiService`/`API_URL` and
    `SharedService`'s `environment` dependency, which are **not** duplicated here — see the
    mandatory-prerequisites note below for why.
  - `hrm-menu-items.ts` — the menu contract: `getHrmMenuGroup(callbacks, checkModulePermissions)`
    returns one top-level "HRM" `MenuItem` (a nested "Masters" submenu plus the transaction screens)
  - `hrm-service-url-constants.ts` — `HrmServiceUrlConstants`, the URL path fragments for
    HRM-specific endpoints (leave/allowance/document-type/attendance/expense claim/petty cash).
    A host's own `ServiceUrlConstants` does not need any HRM-specific keys added to it.
  - `i18n/en.json`, `i18n/ar.json` — every translation key this submodule's screens reference,
    self-contained (a host's own translation files do not need any HRM-specific keys added)

## Integrating into a consuming project

### 1. Add the submodule

```
git submodule add https://github.com/Sujan-byte/SANADI-HRM.git sanadi-hrm
```

### 2. Backend

1. Add `sanadi-hrm/backend-apps` to `sys.path` in `settings.py`, before `INSTALLED_APPS` is
   evaluated, then extend `INSTALLED_APPS` with `HRM_INSTALLED_APPS` and `TEMPLATES[0]['DIRS']` with
   `HRM_TEMPLATE_DIRS` (the plugin's `email_templates/`, used by leave entry/application/TaDa
   notification emails):
   ```python
   sys.path.insert(0, str(BASE_DIR.parent / 'sanadi-hrm' / 'backend-apps'))
   from hrm_plugin_config import HRM_INSTALLED_APPS, HRM_TEMPLATE_DIRS
   INSTALLED_APPS = [ ...your apps..., ] + HRM_INSTALLED_APPS

   TEMPLATES = [
       {
           ...
           'DIRS': [os.path.join(BASE_DIR, 'templates')] + HRM_TEMPLATE_DIRS,
           ...
       },
   ]
   ```
2. Wire the routes from the same manifest in the host's root `urls.py`:
   ```python
   from hrm_plugin_config import get_hrm_urlpatterns
   urlpatterns = [ ...your urlpatterns..., ] + get_hrm_urlpatterns(dashboard_prefix='hrm-dashboard')
   ```
   `dashboard_prefix` defaults to `'dashboard'`; pass something else (e.g. `'hrm-dashboard'`) if the
   host already has its own `dashboard` app that should keep that prefix.
3. **`hrm_master` is intentionally *not* included in `get_hrm_urlpatterns()`.** Its viewsets
   (`DepartmentViewSet`, `EmployeeMasterViewSet`, `ShiftMasterViewSet`, `LeavePolicyViewSet`, etc.)
   are meant to be registered on the host's **own** masters router, alongside the host's other
   generic master-data endpoints, at whatever URL prefix that host already uses (e.g. `master/`).
   Use `get_hrm_master_router_registrations()` rather than hand-listing each viewset — this is what
   404d silently on the first integration (twice: 8 viewsets added after the initial wiring, then 3
   more that had never been registered at all) until someone diffed every `HrmServiceUrlConstants`
   `/master/...` entry against the router by hand:
   ```python
   from hrm_master.views import reset_password_employee  # anything that isn't a ViewSet, wire separately
   from hrm_plugin_config import get_hrm_master_router_registrations

   for prefix, viewset in get_hrm_master_router_registrations():
       router.register(prefix, viewset)
   ```
   This list lives in the submodule, not copied per host, so a host picks up a newly-added
   `hrm_master` viewset on its next `git submodule update` instead of silently 404ing on it.
4. If the host needs non-default cross-project foreign key targets (its own Employee/Department/etc.
   are not `hrm_master`'s), create `hrm_contract.py` at the project root (next to `manage.py`):
   ```python
   HRM_MODEL_MAP = {
       "EMPLOYEE": "hrm_master.EmployeeMaster",  # or the host's own app.Model
       "DEPARTMENT": "hrm_master.Department",
       "DESIGNATION": "hrm_master.Designation",
       "GRADE": "hrm_master.Grade",
       "BRANCH": "branch.Branch",
   }
   ```
   Any key left out (or the whole file, if absent) falls back to the defaults shown above.
5. Platform dependencies this plugin expects the host project to already provide (not bundled):
   `branch`, `security`, `tenant`, `customdblogger`, plus the `sequences` pip package, plus a
   `GlobalMaster`-shaped generic key/value lookup model (`global_key`/`global_value`) — `hrm_dashboard`
   and a `violation_type` field on `hrm_main` read from it by that name.
6. **`notifications` is *not* a hard dependency — a host doesn't need it.** HRM's own signal handlers
   (leave entry/application create, TaDa create) integrate with a host's `notifications` app on a
   best-effort basis: if the host has none, that specific side-effect is silently skipped (logged at
   `DEBUG`) rather than blocking the save. Outbound email (leave entry/application approval
   notifications) *is* bundled — see step 1's `HRM_TEMPLATE_DIRS` — but still needs the host's own SMTP
   settings (`DEFAULT_FROM_EMAIL`, `EMAIL_BACKEND`, etc.) to actually send; if those aren't configured,
   the same best-effort handling applies and the save still succeeds either way.
7. Migrations for `hrm_master` and `hrm_main` (the only two of the four apps with real models -
   `hrm_audit_fields` is abstract mixins only, `hrm_dashboard` has none) **are committed to this
   submodule** — a host just runs `migrate` after step 1-2, no `makemigrations` needed for these two
   apps. This is a deliberate reversal of an earlier "regenerate per host" approach: this plugin's own
   models change far less often than a specific host's database history, so a known-good, versioned
   migration set removes an entire class of per-host migration problems (`db_table` collisions,
   inconsistent history against a restored backup, etc.) instead of asking every host to regenerate
   from scratch. If the host's own database already has conflicting tables under these same names from
   before adopting this plugin, see the parent project's migration runbook for the ETL/retirement
   steps - these migrations assume a clean slate for `hrm_master`/`hrm_main`'s own tables.

### 3. Frontend

1. **`tsconfig.json` `paths`** — every submodule import a host's own code needs to resolve:
   ```json
   "paths": {
     "src/app/modules/hrm-main/*": ["../sanadi-hrm/frontend-modules/hrm-main/*"],
     "src/app/modules/hrm-master/*": ["../sanadi-hrm/frontend-modules/hrm-master/*"],
     "src/app/modules/hrm-dashboard/*": ["../sanadi-hrm/frontend-modules/hrm-dashboard/*"],
     "src/app/modules/hrm-menu-items": ["../sanadi-hrm/frontend-modules/hrm-menu-items"],
     "src/app/modules/hrm-service-url-constants": ["../sanadi-hrm/frontend-modules/hrm-service-url-constants"],
     "src/app/modules/hrm-shared/*": ["../sanadi-hrm/frontend-modules/hrm-shared/*"]
   }
   ```
   (adjust the `../sanadi-hrm` prefix if the submodule isn't a sibling of the Angular project root)
2. **Routing** — point the host's own routes at the submodule's modules instead of any local
   equivalent:
   ```typescript
   { path: 'hrm', loadChildren: () => import('src/app/modules/hrm-main/hrm.module').then(m => m.HrmModule) }
   ```
   and, for each `hrm-master` screen the host wants under its own masters routing:
   ```typescript
   { path: 'department', loadComponent: async () => (await import('src/app/modules/hrm-master/department/department.component')).DepartmentComponent }
   ```
3. **Menu** — splice `getHrmMenuGroup()` into the host's own menu component:
   ```typescript
   import { getHrmMenuGroup } from 'src/app/modules/hrm-menu-items';
   // ...
   getHrmMenuGroup(
     { checkPermission: this.check_permission.bind(this), onClick: this.onCloseSidebar.bind(this) },
     this.checkModulePermissions.bind(this)
   )
   ```
4. **i18n** — copy the submodule's translation JSON into the build and merge it into the host's own
   `TranslateLoader`. In `angular.json`:
   ```json
   { "glob": "*.json", "input": "../sanadi-hrm/frontend-modules/i18n/", "output": "/assets/i18n-hrm/" }
   ```
   and in the host's `TranslateLoader` factory, fetch both `assets/i18n/{lang}.json` and
   `assets/i18n-hrm/{lang}.json` and merge them (host's own values should win on any key overlap):
   ```typescript
   class MergedTranslateLoader implements TranslateLoader {
     constructor(private http: HttpClient) {}
     getTranslation(lang: string): Observable<any> {
       const host$ = this.http.get(`./assets/i18n/${lang}.json`).pipe(catchError(() => of({})));
       const hrm$ = this.http.get(`./assets/i18n-hrm/${lang}.json`).pipe(catchError(() => of({})));
       return forkJoin([host$, hrm$]).pipe(map(([host, hrm]) => ({ ...(hrm as object), ...(host as object) })));
     }
   }
   ```
   If the host doesn't already have HRM's translation keys in its own files, none need to be added —
   the submodule's `i18n/en.json`/`ar.json` are already complete.
5. **Mandatory prerequisite — `ApiService` / `API_URL`:** the submodule's own `hrm-shared` copies of
   `SharedService`/`AuthService`/every field-builder-driven component all resolve `ApiService`
   (and the `API_URL` `InjectionToken` it depends on) from the **host's real path**
   (`src/app/core/services/api.service`, `src/app/core/api-url.token`), not a bundled copy. This is
   deliberate — `ApiService`/`API_URL` are app-bootstrap singletons (the host's `app.config.ts` must
   provide a value for `API_URL`), not portable generic framework, so duplicating them would create a
   second, never-provided token and every HRM screen would fail at runtime with
   `NullInjectorError: No provider for InjectionToken API_URL!`. The host must have a real, working
   `ApiService` with `get`/`post`/`put`/`delete` methods (an optional 3rd `headers` param on `get()`
   is needed for one call site) already wired before integrating this submodule.
6. **Mandatory prerequisite — `environment.storageEncryptionKey`:** the submodule's
   `EncryptedStorageService` copy reads `environment.storageEncryptionKey` from the host's own
   `src/environments/environment.ts` (a 32-byte string) — it is not something this submodule can
   provide a default for.
7. **Required one-time local setup, every machine, after cloning/pulling this submodule:** Node's
   module resolution walks up from a file's own physical location looking for `node_modules`, and
   `sanadi-hrm/` is a sibling of the Angular project, not a descendant — so files under
   `frontend-modules/` can't otherwise resolve `@angular/core`, `rxjs`, etc. Create a directory
   junction (no admin rights needed on Windows) so it can:
   ```
   # from the project root, after `npm install` in the Angular project
   cmd /c mklink /J sanadi-hrm\node_modules <path-to-angular-project>\node_modules
   # macOS/Linux equivalent: ln -s <path-to-angular-project>/node_modules sanadi-hrm/node_modules
   ```
   This is machine-local, never committed (`sanadi-hrm/.gitignore` excludes `node_modules/`) —
   re-create it after any fresh clone.

### 4. Verify

- `python manage.py check` (backend) — clean run confirms `INSTALLED_APPS`/urls wiring is correct.
- `npx tsc --noEmit` and a full `ng build` (frontend) — both should be clean; a full `ng build` (not
  just `tsc`) is necessary because Angular's AOT compiler catches template/module wiring errors
  (missing template files, circular NgModule dependencies) that plain `tsc` does not.

See the parent project's `HRM Plugin Blueprint` design doc for the full architecture (masters-canonical
rule, migration runbook, ETL for a host migrating off its own pre-existing HR tables).
