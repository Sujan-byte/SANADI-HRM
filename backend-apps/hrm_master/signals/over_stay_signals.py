"""
Over Stay Signal
=================
Fires when HR updates `resume_duty_on` on LeaveApplication
or `extended_to_date` on LeaveEntry.

For each date between (leave_end + 1 day) and (resume_date - 1 day),
updates AttendanceDetails to Over Stay (77).

Reversible — if resume_duty_on is changed to a later date or cleared,
previously marked Over Stay rows are reverted by calling
transfer_attendance_details() for that employee + date range, so the
full device_attendance_task logic (shift, grace, OT, etc.) is applied
exactly as it would be in a normal attendance run.

Auto punch employees:
- OnTime (0) rows also get marked Over Stay
- Over Stay rows have login_time, logout_time, hours, OT all zeroed out
"""

from datetime import timedelta, date as date_type
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.db import transaction

from hrm_master.models import LeaveApplication, LeaveEntry

from attendance_scheduler_tasks.utils.overstay_utils import (
    OVER_STAY_STATUS, AUTO_PUNCH_ZERO_FIELDS, get_lop_on_overstay,
)

STATUSES_TO_UPDATE = [
    '4',   # Absent
    '15',  # YetToPunchToday
    '17',  # WeeklyOff
    '11',  # WeeklyOffOvertime
    '18',  # Holiday
    '19',  # HolidayOvertime
]
ON_TIME_STATUS = '0'


def _get_employee_auto_punch(emp_code, b_id):
    from hrm_master.models import EmployeeMaster
    return EmployeeMaster.objects.filter(
        employee_code=emp_code, b_id=b_id
    ).values_list('auto_punch', flat=True).first() or False


def _get_lop_on_overstay(emp_code, b_id, leave_type_name):
    """Thin wrapper — delegates to shared util in overstay_utils.py."""
    return get_lop_on_overstay(emp_code, b_id, leave_type_name)


def _apply_over_stay(emp_code, b_id, leave_end_date, resume_date, leave_type_name=None):
    """
    Mark Over Stay for dates between leave_end_date+1 and resume_date-1.
    Checks lop_on_overstay from the employee's leave policy first — if False, skips.
    Auto punch employees: also zero out time fields and update OnTime rows.
    """
    from hrm_main.models import AttendanceDetails

    # Policy gate — only apply LOP if policy allows it
    if leave_type_name and not _get_lop_on_overstay(emp_code, b_id, leave_type_name):
        return

    over_stay_start = leave_end_date + timedelta(days=1)
    over_stay_end   = resume_date - timedelta(days=1)

    if over_stay_start > over_stay_end:
        return

    is_auto_punch = _get_employee_auto_punch(emp_code, b_id)
    statuses = STATUSES_TO_UPDATE + [ON_TIME_STATUS] if is_auto_punch else STATUSES_TO_UPDATE

    rows = AttendanceDetails.objects.filter(
        employee_code=emp_code,
        b_id=b_id,
        date__range=[over_stay_start, over_stay_end],
        status__in=statuses,
    )

    if is_auto_punch:
        # Zero out all time fields + set Over Stay
        rows.update(status=OVER_STAY_STATUS, **AUTO_PUNCH_ZERO_FIELDS)
    else:
        rows.update(status=OVER_STAY_STATUS)


def _revert_over_stay(emp_code, b_id, leave_end_date, old_resume_date):
    """
    Revert Over Stay rows back to original status when resume_duty_on
    is changed to a later date or cleared.
    Rows between (leave_end+1) and (old_resume_date-1) that were marked Over
    Stay are recomputed by calling transfer_attendance_details() for that
    employee and date range — the same logic the daemon uses, so shift, grace,
    OT, and auto_punch times are all restored correctly.
    """
    from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details

    revert_start = leave_end_date + timedelta(days=1)
    revert_end   = old_resume_date - timedelta(days=1)

    if revert_start > revert_end:
        return

    transfer_attendance_details(
        start_date=revert_start.strftime('%Y-%m-%d'),
        end_date=revert_end.strftime('%Y-%m-%d'),
        employee_codes=[emp_code],
    )


# ── LeaveApplication ──────────────────────────────────────────────────────────

@receiver(pre_save, sender=LeaveApplication)
def capture_leave_application_before(sender, instance, **kwargs):
    """Store previous resume_duty_on before save."""
    if instance.pk:
        try:
            instance._prev_resume_duty_on_app = LeaveApplication.objects.filter(
                pk=instance.pk
            ).values_list('resume_duty_on', flat=True).first()
        except Exception:
            instance._prev_resume_duty_on_app = None
    else:
        instance._prev_resume_duty_on_app = None


@receiver(post_save, sender=LeaveApplication)
def on_leave_application_resumed(sender, instance, **kwargs):
    """
    When resume_duty_on is set or changed:
    - If prev exists: revert old Over Stay range back to original status
    - Apply Over Stay for the new range
    - If curr is cleared (None): only revert, nothing to apply
    """
    prev = getattr(instance, '_prev_resume_duty_on_app', None)
    curr = instance.resume_duty_on

    if curr == prev:
        return

    leave_end       = instance.leave_approved_end_date
    emp_code        = getattr(instance.employee_code, 'employee_code', None)
    b_id            = instance.b_id
    leave_type_name = getattr(instance.leave_type, 'status_name', None) if hasattr(instance, 'leave_type') else None

    if not leave_end or not emp_code or not b_id:
        return

    def _update():
        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
        today = date_type.today()

        if prev and curr:
            # Resume date changed from one date to another
            _revert_over_stay(emp_code, b_id, leave_end, prev)
            _apply_over_stay(emp_code, b_id, leave_end, curr, leave_type_name=leave_type_name)
            # Re-run curr → today so all days from resume onwards are correctly processed
            if curr <= today:
                transfer_attendance_details(
                    start_date=curr.strftime('%Y-%m-%d'),
                    end_date=today.strftime('%Y-%m-%d'),
                    employee_codes=[emp_code],
                )

        elif prev and not curr:
            # Resume date cleared — mark leave_end+1 → today as OverStay directly.
            _apply_over_stay(emp_code, b_id, leave_end, today + timedelta(days=1),
                             leave_type_name=leave_type_name)

        elif not prev and curr:
            # Resume date set for the first time
            _apply_over_stay(emp_code, b_id, leave_end, curr, leave_type_name=leave_type_name)
            # Re-run curr → today so all days from resume onwards are correctly processed
            if curr <= today:
                transfer_attendance_details(
                    start_date=curr.strftime('%Y-%m-%d'),
                    end_date=today.strftime('%Y-%m-%d'),
                    employee_codes=[emp_code],
                )

    transaction.on_commit(_update)


# ── LeaveEntry ────────────────────────────────────────────────────────────────

@receiver(pre_save, sender=LeaveEntry)
def capture_leave_entry_before(sender, instance, **kwargs):
    """Store previous extended_to_date before save."""
    if instance.pk:
        try:
            instance._prev_extended_to_date = LeaveEntry.objects.filter(
                pk=instance.pk
            ).values_list('extended_to_date', flat=True).first()
        except Exception:
            instance._prev_extended_to_date = None
    else:
        instance._prev_extended_to_date = None


@receiver(post_save, sender=LeaveEntry)
def on_leave_entry_resumed(sender, instance, **kwargs):
    """
    When extended_to_date is set (or changed), mark Over Stay
    for all Absent/YetToPunchToday rows between leave end and extended date.

    Guard against duplicate firings within the same request cycle
    (e.g. super().update() + _trigger_post_save_signal both call post_save):
    once we've handled a (prev→curr) transition we stamp the instance so the
    second post_save for the same change is a no-op.
    """
    prev = getattr(instance, '_prev_extended_to_date', None)
    curr = instance.extended_to_date

    if curr == prev:
        return

    # Dedup: if we already processed this exact prev→curr transition, skip.
    _handled_key = f'_overstay_handled_{prev}_{curr}'
    if getattr(instance, _handled_key, False):
        return
    setattr(instance, _handled_key, True)

    leave_end       = instance.to_date
    emp_code        = getattr(instance.employee, 'employee_code', None)
    b_id            = instance.b_id
    leave_type_name = getattr(instance.leave_type, 'status_name', None) if instance.leave_type else None

    if not leave_end or not emp_code or not b_id:
        return

    def _update():
        from attendance_scheduler_tasks.device_attendance_task import transfer_attendance_details
        today = date_type.today()

        if prev and curr:
            # Extended date changed from one date to another
            _revert_over_stay(emp_code, b_id, leave_end, prev)
            _apply_over_stay(emp_code, b_id, leave_end, curr, leave_type_name=leave_type_name)
            # Re-run curr → today so all days from resume onwards are correctly processed
            if curr <= today:
                transfer_attendance_details(
                    start_date=curr.strftime('%Y-%m-%d'),
                    end_date=today.strftime('%Y-%m-%d'),
                    employee_codes=[emp_code],
                )

        elif prev and not curr:
            # Extended date cleared — mark leave_end+1 → today as OverStay directly.
            # Pass today+1 as the resume_date arg so _apply_over_stay's range becomes
            # leave_end+1 → today (it internally uses resume_date - 1 as the upper bound).
            _apply_over_stay(emp_code, b_id, leave_end, today + timedelta(days=1),
                             leave_type_name=leave_type_name)

        elif not prev and curr:
            # Extended date set for the first time
            _apply_over_stay(emp_code, b_id, leave_end, curr, leave_type_name=leave_type_name)
            # Re-run curr → today so all days from resume onwards are correctly processed
            if curr <= today:
                transfer_attendance_details(
                    start_date=curr.strftime('%Y-%m-%d'),
                    end_date=today.strftime('%Y-%m-%d'),
                    employee_codes=[emp_code],
                )

    transaction.on_commit(_update)
