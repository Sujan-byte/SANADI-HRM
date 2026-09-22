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

# Apps to add to the host's INSTALLED_APPS. Order matters: hrm_audit_fields has no
# dependencies of its own and must come first; hrm_master/hrm_dashboard/hrm_main all
# depend on it (and hrm_master's models are referenced by the other two).
HRM_INSTALLED_APPS = [
    'hrm_audit_fields',
    'hrm_master',
    'hrm_dashboard',
    'hrm_main',
]


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
