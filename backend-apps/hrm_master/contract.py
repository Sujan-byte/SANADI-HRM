"""
Two-directional resolver for HRM's cross-project foreign keys.

HRM_PROVIDES (EMPLOYEE, DEPARTMENT, DESIGNATION, GRADE): a host project's own
apps (e.g. security, notifications) call resolve() instead of hardcoding
"hrm_master.X" directly. This is the gate that keeps a project being migrated
onto this plugin from silently pointing at hrm_master's tables before its own
existing Employee/Department/etc. data has actually been migrated in - the
host project's hrm_contract.py is the one place that switch happens.

HRM_EXPECTS (BRANCH): hrm_master's own models call resolve() instead of
assuming the host's branch-equivalent app is always literally named
"branch" and its model "Branch".

Both directions read HRM_MODEL_MAP from hrm_contract.py at the host project
root (importable because it sits next to manage.py), falling back to this
submodule's own defaults when that file, or a given key in it, is absent -
so the plugin still works standalone with nothing configured.
"""

_DEFAULTS = {
    "EMPLOYEE": "hrm_master.EmployeeMaster",
    "DEPARTMENT": "hrm_master.Department",
    "DESIGNATION": "hrm_master.Designation",
    "GRADE": "hrm_master.Grade",
    "BRANCH": "branch.Branch",
}


def resolve(key: str) -> str:
    try:
        import hrm_contract
        host_map = getattr(hrm_contract, "HRM_MODEL_MAP", {})
    except ImportError:
        host_map = {}
    return host_map.get(key, _DEFAULTS[key])
