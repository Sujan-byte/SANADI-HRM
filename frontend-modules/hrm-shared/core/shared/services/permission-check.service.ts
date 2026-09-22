import { Injectable, inject } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';

// Shared "global function" for gating form-level features (Print, Export, etc.) by
// permission - the same NgxPermissionsService check menu-list.component.ts's
// check_permission()/checkModulePermissions() and permission.guard.ts already use for
// menu visibility and route guarding, now reusable from any component (e.g. a form's
// hiddenFunction/hideExport config) without duplicating the wrapper each time.
@Injectable({ providedIn: 'root' })
export class PermissionCheckService {
  private permissionsService = inject(NgxPermissionsService);

  hasPermission(permission: string | string[]): boolean {
    if (Array.isArray(permission)) {
      return permission.some((p) => !!this.permissionsService.getPermission(p));
    }
    return !!this.permissionsService.getPermission(permission);
  }
}
