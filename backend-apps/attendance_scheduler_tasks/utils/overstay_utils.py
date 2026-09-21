"""
Overstay shared utilities
==========================
Shared between device_attendance_task.py and over_stay_signals.py.
Kept in a separate module to avoid circular imports (the signals file
imports transfer_attendance_details from the task, so the task cannot
import from the signals file).
"""

from datetime import date as date_type


OVER_STAY_STATUS = '77'

AUTO_PUNCH_ZERO_FIELDS = {
    'login_time': '0000',
    'logout_time': '0000',
    'total_hours': '0',
    'processed_total_hour': '0',
    'ot_hrs': '0',
    'hot_hrs': '0',
    'ot2_hrs': '0',
    'less_hrs': '0',
    'extra_hrs': '0',
    'late_hrs': '0',
    'permitted_ot': '0',
    'scheduled_ot': '0',
}


def get_lop_on_overstay(emp_code, b_id, leave_type_name):
    """
    Look up the LeavePolicy for this employee + leave_type and return
    lop_on_overstay flag. Defaults to True if no matching policy is found.

    Used by:
      - device_attendance_task (daily scheduler path)
      - over_stay_signals._apply_over_stay (signal path)
    """
    from hrm_master.models import EmployeeMaster, LeavePolicy
    from hrm_master.tasks.accrue_leave_task import get_leave_policies_for_employee, get_policy_for_date
    from django.utils.timezone import now

    try:
        employee = EmployeeMaster.objects.filter(
            employee_code=emp_code, b_id=b_id
        ).first()
        if not employee:
            return True

        policies_by_lt = get_leave_policies_for_employee(
            employee.employee_type,
            employee.employee_group,
            employee.reporting,
            b_id,
        )

        today = now().date()
        for lt_id, versions in policies_by_lt.items():
            sample = versions[-1]
            policy_leave_name = sample.type_of_leave.status_name if sample.type_of_leave else None
            if sample.type_of_leave and policy_leave_name == leave_type_name:
                policy = get_policy_for_date(versions, today)
                if policy:
                    return bool(policy.lop_on_overstay)

    except Exception:
        import traceback; traceback.print_exc()

    return True  # default - apply LOP if policy not found


def get_active_overstay(emp_code, punch_date, leave_entry_cache, leave_app_cache,
                        pending_overstay_cache=None, resume_punch_cache=None):
    """
    Returns (True, leave_type_name) if punch_date falls AFTER the employee's
    approved leave end AND no resume/extended date is set (open-ended overstay).

    Three sources checked in order:
      1. leave_entry_cache      - leaves overlapping the current run window (to_date >= start_date)
      2. leave_app_cache        - applications overlapping the current run window
      3. pending_overstay_cache - leaves that ended BEFORE the run window (common case:
                                  employee on leave in a prior month, no resume date recorded)

    Resume-punch guard (resume_punch_cache):
      If the employee already had a real bio punch after the leave ended (even without
      HR recording resume_duty_on), they have physically returned. Any subsequent absent
      days are normal absences - not overstay. Once first_punch_date <= punch_date the
      overstay window is closed.

    Cache tuple formats:
      leave_entry_cache      -> (..., status_name[5], extended_to_date[6])
      leave_app_cache        -> (..., leave_type_name[3], resume_duty_on[4])
      pending_overstay_cache -> (source, end_date, leave_type_name, None)
    """
    if isinstance(punch_date, str):
        punch_date = date_type.fromisoformat(punch_date)

    entries = leave_entry_cache.get(emp_code, [])
    apps    = leave_app_cache.get(emp_code, [])
    pending = pending_overstay_cache.get(emp_code, []) if pending_overstay_cache else []

    # Resume-punch guard (bio-punch employees only, auto-punch excluded from cache).
    # If the employee swiped the machine after their leave ended, they physically
    # returned. Any day on or after that first real swipe is not overstay.
    first_punch = resume_punch_cache.get(emp_code) if resume_punch_cache else None
    if first_punch and punch_date >= first_punch:
        return False, None

    # 1. LeaveEntry overlapping current window
    for entry in entries:
        to_date          = entry[1]
        status_name      = entry[5]
        extended_to_date = entry[6]
        # Overstay applies from the day after leave ends until the employee resumes.
        # extended_to_date acts like resume_duty_on â€” overstay ends ON that date
        # (punch_date < extended_to_date). If extended_to_date is None, overstay is open-ended.
        if to_date and to_date < punch_date:
            if extended_to_date is None or punch_date < extended_to_date:
                return True, status_name

    # 2. LeaveApplication overlapping current window
    for app in apps:
        end_date        = app[1]
        leave_type_name = app[3]
        resume_duty_on  = app[4]
        # Overstay applies from the day after leave ends until the employee resumes.
        # If resume_duty_on is set, overstay ends ON that date (punch_date < resume_duty_on).
        # If resume_duty_on is None, overstay is open-ended.
        if end_date and end_date < punch_date:
            if resume_duty_on is None or punch_date < resume_duty_on:
                return True, leave_type_name

    # 3. Pending overstay - leave ended before the run window
    for rec in pending:
        source, end_date, leave_type_name, _ = rec
        if end_date and end_date < punch_date:
            return True, leave_type_name

    return False, None
