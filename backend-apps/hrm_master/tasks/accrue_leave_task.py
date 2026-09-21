from datetime import date as date_type
from django.utils.timezone import now
from branch.models import Branch
from hrm_master.models import EmployeeMaster, LeavePolicy, LeavePolicyDetail, LeaveMaster, LeaveMasterDetails, LeaveMasterDetailBreakup
from django.db import models
import calendar
from django.db import transaction


def get_days_in_month(d):
    return calendar.monthrange(d.year, d.month)[1]


def get_fy_bounds(fy_start_month, today):
    """
    Return FY metadata for any arbitrary FY start month.

    Examples:
        fy_start_month=4, today=2024-08-06  →  FY 2024-2025  (Apr 2024 – Mar 2025)
        fy_start_month=1, today=2024-08-06  →  FY 2024-2024  (Jan 2024 – Dec 2024)
        fy_start_month=7, today=2024-08-06  →  FY 2024-2025  (Jul 2024 – Jun 2025)

    When fy_start_month=1 the FY is a single calendar year so fy_year_end==fy_year_start
    and the string is '2024-2024'.  For all other start months the FY spans two
    calendar years as usual.

    Returns:
        fy_year_start   int   — calendar year the FY begins
        fy_year_end     int   — calendar year the FY ends
        fy_str          str   — e.g. '2024-2025' or '2024-2024'
        prev_fy_str     str   — e.g. '2023-2024' or '2023-2023'
        first_day_of_fy date  — 1st day of current FY
        fy_end_month    int   — last month of FY (fy_start_month - 1, wrapping)
    """
    if today.month >= fy_start_month:
        fy_year_start = today.year
    else:
        fy_year_start = today.year - 1

    # When FY starts in January it ends in the same calendar year (Jan–Dec)
    if fy_start_month == 1:
        fy_year_end = fy_year_start
    else:
        fy_year_end = fy_year_start + 1

    fy_str          = f'{fy_year_start}-{fy_year_end}'
    prev_fy_str     = f'{fy_year_start - 1}-{fy_year_start - 1 if fy_start_month == 1 else fy_year_start}'
    first_day_of_fy = date_type(fy_year_start, fy_start_month, 1)
    fy_end_month    = fy_start_month - 1 if fy_start_month > 1 else 12

    return fy_year_start, fy_year_end, fy_str, prev_fy_str, first_day_of_fy, fy_end_month


def get_leave_policies_for_employee(employee_type, employee_group, employee_reporting, b_id):
    """
    Return all matching active policies for the employee grouped by leave_type,
    ordered by priority (most specific first) then by effective_from (oldest first).

    Supports full versioning — multiple policies for the same leave type with
    different effective_from/effective_to ranges are all returned.
    The caller uses get_policy_for_date() to pick the right one per credit date.

    Priority (highest first):
      1. exact type + group + reporting
      2. type + group + All
      3. type + All + reporting
      4. All + group + reporting
      5. type + All + All
      6. All + group + All
      7. All + All + reporting
      8. All + All + All

    Returns:
        dict: { leave_type_id: [policy, ...] } — list ordered by effective_from asc
    """
    employee_type      = employee_type      if employee_type      not in ('', None) else 'All'
    employee_group     = employee_group     if employee_group     not in ('', None) else 'All'
    employee_reporting = employee_reporting if employee_reporting not in ('', None) else 'All'

    PRIORITY = [
        (employee_type, employee_group,     employee_reporting),
        (employee_type, employee_group,     'All'),
        (employee_type, 'All',              employee_reporting),
        ('All',         employee_group,     employee_reporting),
        (employee_type, 'All',              'All'),
        ('All',         employee_group,     'All'),
        ('All',         'All',              employee_reporting),
        ('All',         'All',              'All'),
    ]

    all_policies = LeavePolicy.objects.filter(b_id=b_id, is_active=True).order_by('effective_from')

    # Map leave_type_id → best priority rank
    best_priority = {}
    for rank, (et, eg, er) in enumerate(PRIORITY):
        for policy in all_policies:
            lt_id = policy.type_of_leave_id
            if (policy.employee_type      == et and
                    policy.employee_group     == eg and
                    policy.employee_reporting == er):
                current_rank = best_priority.get(lt_id, 999)
                if rank < current_rank:
                    best_priority[lt_id] = rank

    # Collect all policies at the winning priority level per leave type
    result = {}
    for rank, (et, eg, er) in enumerate(PRIORITY):
        for policy in all_policies:
            lt_id = policy.type_of_leave_id
            if best_priority.get(lt_id) != rank:
                continue
            if (policy.employee_type      == et and
                    policy.employee_group     == eg and
                    policy.employee_reporting == er):
                result.setdefault(lt_id, []).append(policy)

    return result


def get_policy_for_date(policies_for_leave_type, credit_date):
    """
    Given a list of policies for one leave type (ordered by effective_from asc),
    return the one that is effective on credit_date.

    Rules:
    - effective_from <= credit_date (or effective_from is None → always valid from start)
    - effective_to   >= credit_date (or effective_to is None → open-ended)
    - If multiple match, pick the one with the latest effective_from (most recent version)
    - If none match, return None
    """
    best = None
    for policy in policies_for_leave_type:
        eff_from = policy.effective_from
        eff_to   = policy.effective_to

        from_ok = (eff_from is None) or (credit_date >= eff_from)
        to_ok   = (eff_to   is None) or (credit_date <= eff_to)

        if from_ok and to_ok:
            if best is None:
                best = policy
            elif (eff_from or date_type.min) > (best.effective_from or date_type.min):
                best = policy

    return best


def calculate_leave(employee, leave_detail, year_month='Month', today=None,
                    fy_start_month=1, prorate_on_join=False):
    """
    Return the number of leave days to credit for this policy detail row.

    year_month      — 'Month' or 'Year', comes from LeavePolicy (not LeavePolicyDetail)
    fy_start_month  — month the FY starts (1=Jan, 4=Apr etc.)
    prorate_on_join — if False (default), new joiners always get the full grant.
                      if True, credit is prorated based on DOJ within the period.
    """
    if today is None:
        today = now().date()

    first_day_of_month = today.replace(day=1)

    _, _, _, _, first_day_of_fy, _ = get_fy_bounds(fy_start_month, today)

    leave_days = float(leave_detail.number_of_days or 0)

    if prorate_on_join:
        if year_month == 'Month':
            total_days_in_month = get_days_in_month(today)
            if employee.doj and employee.doj > first_day_of_month:
                working_days = (total_days_in_month - employee.doj.day) + 1
                leave_days   = (leave_days / total_days_in_month) * working_days

        elif year_month == 'Year':
            if employee.doj and employee.doj > first_day_of_fy:
                months_into_fy   = (employee.doj.month - fy_start_month) % 12
                months_remaining = 12 - months_into_fy
                leave_days = (leave_days / 12) * months_remaining

    return leave_days


def get_missing_months(employee_doj, fy_start_month, fy_year_start, today, existing_month_years):
    """
    Return a list of (month_abbr, year_str, credit_date) tuples for every month
    from the start of the FY (or DOJ, whichever is later) up to and including
    today that does NOT already have a breakup row.

    existing_month_years — set of (allocated_month, allocated_year) tuples
    already present in LeaveMasterDetailBreakup for this employee+leave type.
    """
    fy_start_date = date_type(fy_year_start, fy_start_month, 1)

    # Accrual starts from the later of FY start or DOJ month start
    if employee_doj and employee_doj > fy_start_date:
        start_date = employee_doj.replace(day=1)
    else:
        start_date = fy_start_date

    missing = []
    m = start_date.month
    y = start_date.year

    while (y, m) <= (today.year, today.month):
        month_abbr  = calendar.month_abbr[m]
        year_str    = str(fy_year_start)
        credit_date = date_type(y, m, 1)

        if (month_abbr, year_str) not in existing_month_years:
            missing.append((month_abbr, year_str, credit_date))

        m += 1
        if m > 12:
            m = 1
            y += 1

    return missing


def _credit_one_period(
    employee, leave_policy, leave_policy_details, leave_master_detail,
    credit_date, allocated_month, allocated_year, fy_start_month, financial_year_str,
    year_month='Month', prorate_on_join=False,
):
    """
    Credit leave for a single period (month or year).
    Returns the new breakup row created, or None if days = 0.
    """
    total_leave_days = 0.0
    for leave_detail in leave_policy_details:
        total_leave_days += calculate_leave(
            employee, leave_detail,
            year_month=year_month,
            today=credit_date,
            fy_start_month=fy_start_month,
            prorate_on_join=prorate_on_join,
        )
    total_leave_days = round(total_leave_days, 2)

    if total_leave_days == 0:
        return None

    # Opening balance = last breakup's available, or detail opening balance
    previous_breakup = LeaveMasterDetailBreakup.objects.filter(
        leave_master_detail=leave_master_detail
    ).order_by('id').last()

    # Always accumulate from last breakup's available within the FY
    if previous_breakup:
        previous_available = float(previous_breakup.available_leaves)
    else:
        previous_available = float(leave_master_detail.opening_balance or 0)

    policy_snapshot = {
        'policy_id':           leave_policy.pk,
        'type_of_leave':       leave_policy.type_of_leave.status_name,
        'year_month':          year_month,
        'total_days_credited': total_leave_days,
        'fy_start_month':      fy_start_month,
        'financial_year':      financial_year_str,
        'credit_date':         str(credit_date),
        'effective_from':      str(leave_policy.effective_from) if leave_policy.effective_from else None,
        'effective_to':        str(leave_policy.effective_to)   if leave_policy.effective_to   else None,
    }

    new_breakup = LeaveMasterDetailBreakup.objects.create(
        leave_master_detail=leave_master_detail,
        leave_policy=leave_policy,
        opening_balance=previous_available,
        allocated_leaves=total_leave_days,
        available_leaves=round(previous_available + total_leave_days, 2),
        allocated_month=allocated_month,
        allocated_year=allocated_year,
        entry_type='accrual',
        policy_snapshot=policy_snapshot,
        b_id=employee.b_id,
    )
    return new_breakup


def accrue_leave():
    # ── TEST DATE — comment out in production ─────────────────────────────────
    # from datetime import date as _date
    # today = _date(2030, 8, 1)
    # ─────────────────────────────────────────────────────────────────────────
    today = now().date()

    b_ids = list(Branch.objects.all().values_list('id', flat=True))
    if not b_ids:
        print('No branches found')
        return

    for b_id in b_ids:
        all_employees = EmployeeMaster.objects.filter(is_active=True, b_id=b_id)

        for employee in all_employees:
            # Guard: skip employees with no DOJ
            if not employee.doj:
                print(f'⚠ Skipping {employee.employee_code} — no DOJ')
                continue

            with transaction.atomic():
                try:
                    # Returns dict: { leave_type_id: [policy_v1, policy_v2, ...] }
                    policies_by_leave_type = get_leave_policies_for_employee(
                        employee.employee_type,
                        employee.employee_group,
                        employee.reporting,
                        employee.b_id,
                    )

                    for _, policy_versions in policies_by_leave_type.items():

                        # Use the policy effective TODAY for all general config
                        # (fy_start_month, year_month, carry settings).
                        # Fall back to latest version if nothing matches today.
                        current_policy = get_policy_for_date(policy_versions, today) or policy_versions[-1]

                        if not current_policy.type_of_leave:
                            continue

                        # ── Parental leave gate ───────────────────────────────
                        if current_policy.type_of_leave.status_name in ('Maternity Leave', 'Paternity Leave'):
                            if (not employee.eligible_for_parental_leave or
                                    employee.eligible_for_parental_leave != current_policy.type_of_leave.status_name):
                                continue

                        # ── FY bounds from current policy ─────────────────────
                        fy_start_month = current_policy.fy_start_month or 1
                        (
                            fy_year_start,
                            _,
                            financial_year_str,
                            previous_fy_str,
                            _,
                            _,
                        ) = get_fy_bounds(fy_start_month, today)

                        # ── Accrual frequency from current policy ─────────────
                        year_month = current_policy.year_month if current_policy.year_month in ('Year', 'Month') else 'Month'

                        # ── Carry cap: use policy effective at END of this FY ──
                        # e.g. FY 2028-2028 (Jan–Dec) ends Dec 31 2028.
                        # The policy active on that date governs the carry cap,
                        # not today's policy (which may have a different cap).
                        fy_end_month_num  = (fy_start_month - 1) if fy_start_month > 1 else 12
                        fy_end_year       = fy_year_start if fy_start_month == 1 else fy_year_start + 1
                        fy_last_day       = date_type(fy_end_year, fy_end_month_num,
                                                      calendar.monthrange(fy_end_year, fy_end_month_num)[1])
                        end_of_fy_policy  = get_policy_for_date(policy_versions, fy_last_day) or current_policy
                        carry_forward_cap = float(end_of_fy_policy.carry_threshold_value or 0)

                        # ── Get or create LeaveMaster + LeaveMasterDetails ────
                        leave_master, _ = LeaveMaster.objects.get_or_create(
                            employee=employee,
                            defaults={'b_id': employee.b_id},
                        )

                        leave_master_detail, created = LeaveMasterDetails.objects.get_or_create(
                            leave_master=leave_master,
                            leave_type=current_policy.type_of_leave.status_name,
                            financial_year=financial_year_str,
                        )

                        # ── Carry forward from previous FY on first creation ──
                        if created:
                            previous_year_detail = LeaveMasterDetails.objects.filter(
                                leave_master=leave_master,
                                leave_type=current_policy.type_of_leave.status_name,
                                financial_year=previous_fy_str,
                            ).first()

                            if previous_year_detail and current_policy.year_to_year_carry:
                                available = round(float(previous_year_detail.available_leaves or 0), 2)

                                # Cap comes from the policy at end of the PREVIOUS FY
                                prev_fy_end_month_num = (fy_start_month - 1) if fy_start_month > 1 else 12
                                prev_fy_end_year      = (fy_year_start - 1) if fy_start_month == 1 else fy_year_start
                                prev_fy_last_day      = date_type(
                                    prev_fy_end_year, prev_fy_end_month_num,
                                    calendar.monthrange(prev_fy_end_year, prev_fy_end_month_num)[1]
                                )
                                prev_end_policy   = get_policy_for_date(policy_versions, prev_fy_last_day) or current_policy
                                prev_carry_cap    = float(prev_end_policy.carry_threshold_value or 0)

                                if available > prev_carry_cap:
                                    carry_forward = prev_carry_cap
                                    lapse_days    = available - prev_carry_cap
                                else:
                                    carry_forward = available
                                    lapse_days    = 0.0

                                leave_master_detail.opening_balance    = carry_forward
                                leave_master_detail.available_leaves   = carry_forward
                                leave_master_detail.carry_forward_days = carry_forward
                                leave_master_detail.lapse_days         = lapse_days

                                # Stamp the previous FY row with the correct carry/lapse
                                previous_year_detail.carry_forward_days = carry_forward
                                previous_year_detail.lapse_days         = round(available - carry_forward, 2)
                                previous_year_detail.save()

                        leave_master_detail.b_id             = employee.b_id
                        leave_master_detail.leave_policy_key = current_policy
                        leave_master_detail.save()

                        # ── YEARLY policy ─────────────────────────────────────
                        if year_month == 'Year':
                            already_allocated = LeaveMasterDetailBreakup.objects.filter(
                                leave_master_detail=leave_master_detail,
                                allocated_year=str(fy_year_start),
                                entry_type='accrual',
                            ).exists()
                            if already_allocated:
                                continue

                            fy_start_date = date_type(fy_year_start, fy_start_month, 1)
                            leave_policy  = get_policy_for_date(policy_versions, fy_start_date)
                            if not leave_policy:
                                print(f'⚠ No effective policy on {fy_start_date} for '
                                      f'{employee.employee_code} ({current_policy.type_of_leave.status_name})')
                                continue

                            leave_policy_details = LeavePolicyDetail.objects.filter(leave_policy=leave_policy)
                            new_breakup = _credit_one_period(
                                employee, leave_policy, leave_policy_details,
                                leave_master_detail,
                                credit_date=fy_start_date,
                                allocated_month=calendar.month_abbr[fy_start_month],
                                allocated_year=str(fy_year_start),
                                fy_start_month=fy_start_month,
                                financial_year_str=financial_year_str,
                                year_month=year_month,
                                prorate_on_join=bool(leave_policy.prorate_on_join),
                            )
                            if not new_breakup:
                                continue

                            print(
                                f'✅ Credited {new_breakup.allocated_leaves:.2f} days to '
                                f'{employee.employee_code} ({leave_policy.type_of_leave.status_name}) '
                                f'FY {financial_year_str} [Yearly]'
                            )

                        # ── MONTHLY policy — backfill all missing months ───────
                        else:
                            existing = set(
                                LeaveMasterDetailBreakup.objects.filter(
                                    leave_master_detail=leave_master_detail,
                                    entry_type='accrual',
                                ).values_list('allocated_month', 'allocated_year')
                            )

                            missing_months = get_missing_months(
                                employee_doj=employee.doj,
                                fy_start_month=fy_start_month,
                                fy_year_start=fy_year_start,
                                today=today,
                                existing_month_years=existing,
                            )

                            if not missing_months:
                                continue

                            print(f'  📅 Missing months for {employee.employee_code}: {[(m,y) for m,y,_ in missing_months]}')
                            for (allocated_month, allocated_year, credit_date) in missing_months:
                                # Pick policy version effective on this credit date
                                leave_policy = get_policy_for_date(policy_versions, credit_date)
                                if not leave_policy:
                                    print(f'⚠ No effective policy on {credit_date} for '
                                          f'{employee.employee_code} ({current_policy.type_of_leave.status_name}) '
                                          f'— skipping {allocated_month} '
                                          f'[policy eff_from={current_policy.effective_from} eff_to={current_policy.effective_to}]')
                                    continue

                                leave_policy_details = LeavePolicyDetail.objects.filter(leave_policy=leave_policy)
                                new_breakup = _credit_one_period(
                                    employee, leave_policy, leave_policy_details,
                                    leave_master_detail,
                                    credit_date=credit_date,
                                    allocated_month=allocated_month,
                                    allocated_year=allocated_year,
                                    fy_start_month=fy_start_month,
                                    financial_year_str=financial_year_str,
                                    year_month=year_month,
                                    prorate_on_join=bool(leave_policy.prorate_on_join),
                                )
                                if not new_breakup:
                                    continue

                                print(
                                    f'✅ Credited {new_breakup.allocated_leaves:.2f} days to '
                                    f'{employee.employee_code} ({leave_policy.type_of_leave.status_name}) '
                                    f'{allocated_month} {allocated_year} '
                                    f'[policy effective {leave_policy.effective_from}]'
                                )

                        # ── Recalculate LeaveMasterDetails totals ─────────────
                        last_breakup = LeaveMasterDetailBreakup.objects.filter(
                            leave_master_detail=leave_master_detail
                        ).order_by('id').last()

                        total_allocated = round(float(
                            LeaveMasterDetailBreakup.objects.filter(
                                leave_master_detail=leave_master_detail
                            ).aggregate(total=models.Sum('allocated_leaves'))['total'] or 0.0
                        ), 2)

                        leave_master_detail.allocated_leaves = total_allocated
                        leave_master_detail.available_leaves = (
                            float(last_breakup.available_leaves) if last_breakup else total_allocated
                        )

                        if current_policy.year_to_year_carry:
                            av = leave_master_detail.available_leaves
                            if av > carry_forward_cap:
                                leave_master_detail.carry_forward_days = carry_forward_cap
                                leave_master_detail.lapse_days         = av - carry_forward_cap
                            else:
                                leave_master_detail.carry_forward_days = av
                                leave_master_detail.lapse_days         = 0.0

                        leave_master_detail.b_id             = employee.b_id
                        leave_master_detail.leave_policy_key = current_policy
                        leave_master_detail.save()

                        # ── Recalculate LeaveMaster totals ────────────────────
                        agg = LeaveMasterDetails.objects.filter(
                            leave_master=leave_master,
                            financial_year=financial_year_str,
                        ).aggregate(
                            total_alloc=models.Sum('allocated_leaves'),
                            total_avail=models.Sum('available_leaves'),
                        )
                        leave_master.total_allocated_leaves = round(float(agg['total_alloc'] or 0), 2)
                        leave_master.total_available_leaves = round(float(agg['total_avail'] or 0), 2)
                        leave_master.b_id = employee.b_id
                        leave_master.save()

                except Exception as e:
                    import traceback
                    transaction.set_rollback(True)
                    print(f'❌ Error processing leave for {employee.employee_code}: {e}')
                    print(traceback.format_exc())
