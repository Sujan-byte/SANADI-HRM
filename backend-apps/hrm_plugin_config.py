"""
Backend integration manifest for the HRM plugin (sanadi-hrm).

A host project wires this in from its own settings.py / urls.py instead of hand-listing
each app or hand-writing each url include, so pulling in a later version of this plugin
(more apps, moved urls, etc.) doesn't require re-editing the host project by hand.

One-time per-project setup this still requires (not handled here, see the submodule's
README.md): adding `sanadi-hrm/backend-apps` to `sys.path`, and - once it exists -
`hrm_contract.py` for cross-app foreign keys into host-provided models (Branch, User,
Company).

Note: `master` (the generic-masters host app) is NOT part of this manifest, even though
it imports some HRM ViewSets internally (see hrm_master.views) - it is a host-owned app
that happens to reference plugin classes, not a plugin-owned app itself, so its
INSTALLED_APPS entry and its own url include stay hand-wired in the host project.
"""

from pathlib import Path

# Apps to add to the host's INSTALLED_APPS. Order matters: hrm_audit_fields has no
# dependencies of its own and must come first; hrm_master/hrm_dashboard/hrm_main all
# depend on it (and hrm_master's models are referenced by the other two).
HRM_INSTALLED_APPS = [
    'hrm_audit_fields',
    'hrm_master',
    'hrm_dashboard',
    'hrm_main',
]

# Template directories to add to the host's TEMPLATES[0]['DIRS'] - currently just
# email_templates/ (leave entry/application/TaDa notification emails), kept as a
# plain top-level directory rather than nested under any one app's own templates/,
# since more than one HRM app renders from it. Not relied on via Django's implicit
# APP_DIRS auto-discovery so the host's settings.py stays the single, explicit place
# every template source is declared - consistent with how sys.path/INSTALLED_APPS
# are wired here rather than left to happen implicitly.
HRM_TEMPLATE_DIRS = [str(Path(__file__).resolve().parent / 'templates')]


def get_hrm_urlpatterns(client_param: str = 'client', dashboard_prefix: str = 'dashboard'):
    """Returns the list of Django path() entries this plugin needs registered under
    api/v1/<client>/... . Call this from the host project's root urls.py and extend
    urlpatterns with the result:

        from hrm_plugin_config import get_hrm_urlpatterns
        urlpatterns += get_hrm_urlpatterns()

    `dashboard_prefix` defaults to 'dashboard' (this plugin's origin project has no
    dashboard app of its own). A host project that already has its own generic/ERP
    'dashboard' app should pass a distinct prefix instead, e.g. 'hrm-dashboard', so
    the two don't both try to own the same URL prefix.
    """
    from django.urls import path, include
    from hrm_main.api import urls as hrm_urls
    from hrm_dashboard import urls as dashboard_urls

    return [
        path(f'api/v1/<str:{client_param}>/hrm/', include(hrm_urls)),
        path(f'api/v1/<str:{client_param}>/{dashboard_prefix}/', include(dashboard_urls)),
    ]


def get_hrm_master_router_registrations():
    """Returns (url_prefix, ViewSet) pairs for every hrm_master viewset, meant to be
    registered on the host's OWN masters router - hrm_master is deliberately not part
    of get_hrm_urlpatterns() (see that function's docstring) since its master-data
    screens belong alongside a host's own generic masters, not off in a separate /hrm/
    namespace. Call this from the host's own masters urls.py instead of hand-listing
    each viewset:

        from hrm_plugin_config import get_hrm_master_router_registrations
        for prefix, viewset in get_hrm_master_router_registrations():
            router.register(prefix, viewset)

    Keeping this list here (not hand-copied per host) means a host picks up a newly
    added hrm_master viewset on its next `git submodule update` instead of silently
    404ing on it until someone notices and manually adds a router.register() line.
    """
    from hrm_master import views as v

    return [
        ('department', v.DepartmentViewSet),
        ('designation', v.DesignationViewSet),
        ('grade', v.GradeViewSet),
        ('employee', v.EmployeeMasterViewSet),
        ('document-type-master', v.DocumentTypeMasterViewSet),
        ('leave-entry', v.LeaveEntryViewSet),
        ('leave-details', v.LeaveDetailsViewSet),
        ('leave-reversal-request', v.LeaveReversalRequestViewSet),
        ('leave-master', v.LeaveMasterViewSet),
        ('leave-master-details', v.LeaveMasterDetailsViewSet),
        ('holiday-master', v.HolidayMasterViewSet),
        ('shift-timings', v.ShiftTimingsViewSet),
        ('leave-application', v.LeaveApplicationViewSet),
        ('leave-policy', v.LeavePolicyViewSet),
        ('leave-policy-detail', v.LeavePolicyDetailViewSet),
        ('ticket-master', v.TicketMasterViewSet),
        ('salary-components', v.SalaryComponentsViewSet),
        ('shift-master', v.ShiftMasterViewSet),
        ('allowance-master', v.AllowanceMasterViewSet),
        ('allowance-assignment', v.AllowanceAssignmentViewSet),
        ('leave-extension', v.LeaveExtensionViewSet),
    ]
