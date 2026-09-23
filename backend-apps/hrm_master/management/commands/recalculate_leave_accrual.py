"""
Management command: recalculate_leave_accrual

Re-credits leave for ALL employees under a given policy, inserting a
'correction' row in LeaveMasterDetailBreakup for each period that has a
discrepancy between what was credited and what should have been credited.

Usage:
    python manage.py recalculate_leave_accrual --policy-id <pk>
    python manage.py recalculate_leave_accrual --policy-id <pk> --fy 2024-2025
    python manage.py recalculate_leave_accrual --policy-id <pk> --fy 2024-2025 --dry-run

Options:
    --policy-id     PK of the LeavePolicy to recalculate (required)
    --fy            Financial year string, e.g. '2024-2025' (optional;
                    defaults to the current FY derived from policy.fy_start_month)
    --dry-run       Show what would be done without writing anything
"""
import calendar
from datetime import date as date_type

from django.core.management.base import BaseCommand
from django.db import transaction, models
from django.utils.timezone import now

from hrm_master.models import EmployeeMaster, LeavePolicy, LeavePolicyDetail, LeaveMaster, LeaveMasterDetails, LeaveMasterDetailBreakup
from hrm_master.tasks.accrue_leave_task import (
    get_fy_bounds,
    calculate_leave,
)


# â”€â”€ Helper: months accrued so far in the FY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _months_accrued_so_far(fy_start_year, fy_start_month, today):
    """
    Return the number of complete calendar months that have elapsed in the FY
    starting at (fy_start_year, fy_start_month) up to and including `today`.

    E.g. FY starts Jan 2025, today = Aug 2026 â†’ 8 months (Janâ€“Aug 2026).
    E.g. FY starts Apr 2025, today = Aug 2025 â†’ 5 months (Aprâ€“Aug).
    """
    count = 0
    month = fy_start_month
    year  = fy_start_year
    while True:
        period_start = date_type(year, month, 1)
        if period_start > today:
            break
        count += 1
        month += 1
        if month > 12:
            month = 1
            year += 1
    return count


class Command(BaseCommand):
    help = (
        'Recalculate leave accrual for ALL employees under a policy, '
        'inserting correction rows where the credited amount differs from expected.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--policy-id', type=int, required=True,
            help='PK of the LeavePolicy to recalculate',
        )
        parser.add_argument(
            '--fy', type=str, default=None,
            help="Financial year string e.g. '2024-2025' (defaults to current FY)",
        )
        parser.add_argument(
            '--dry-run', action='store_true', default=False,
            help='Preview without making any database changes',
        )

    def handle(self, *args, **options):
        policy_id = options['policy_id']
        fy_arg    = options['fy']
        dry_run   = options['dry_run']

        # â”€â”€ TEST DATE â€” uncomment and adjust for testing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # today = date_type(2026, 8, 1)
        # â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        today = now().date()

        # â”€â”€ Load policy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        try:
            policy = LeavePolicy.objects.get(pk=policy_id)
        except LeavePolicy.DoesNotExist:
            self.stderr.write(f'âŒ LeavePolicy with pk={policy_id} not found')
            return

        fy_start_month = policy.fy_start_month if policy.fy_start_month else 1
        year_month     = policy.year_month if policy.year_month in ('Year', 'Month') else 'Month'
        leave_type_name = policy.type_of_leave.status_name if policy.type_of_leave else '(unknown)'

        # â”€â”€ Resolve FY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        fy_year_start, _, financial_year_str, _, _, _ = get_fy_bounds(fy_start_month, today)

        if fy_arg:
            # User passed explicit FY, e.g. '2024-2025'
            financial_year_str = fy_arg
            parts = fy_arg.split('-')
            if len(parts) == 2:
                fy_year_start = int(parts[0])
            else:
                self.stderr.write(f"âŒ Invalid --fy format: '{fy_arg}'. Expected 'YYYY-YYYY' e.g. '2024-2025'")
                return

        # â”€â”€ Periods accrued so far in this FY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        periods_so_far = _months_accrued_so_far(fy_year_start, fy_start_month, today)
        if year_month == 'Year':
            periods_so_far = 1  # annual: one credit per FY

        # â”€â”€ Calculate expected days per period â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # Use a representative employee to compute days â€” all employees share
        # the same policy bands so the per-period credit is identical.
        policy_details = LeavePolicyDetail.objects.filter(leave_policy=policy)
        if not policy_details.exists():
            self.stderr.write(f'âŒ No LeavePolicyDetail bands found for policy {policy_id}')
            return

        self.stdout.write(
            f'\nðŸ“‹ Recalculate Leave Accrual\n'
            f'   Policy ID  : {policy.pk}\n'
            f'   Leave Type : {leave_type_name}\n'
            f'   FY         : {financial_year_str}\n'
            f'   Accrual    : {year_month}\n'
            f'   FY Start   : month {fy_start_month}\n'
            f'   Periods so far: {periods_so_far}\n'
            + ('   âš  DRY RUN â€” no changes will be written\n' if dry_run else '')
        )

        # â”€â”€ Find all employees covered by this policy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # 'All' is this policy's own wildcard sentinel meaning "every value of this
        # dimension", not a literal value to filter employees by - no real employee
        # has employee_type == 'All'.
        emp_filter = {}
        if policy.employee_type and policy.employee_type != 'All':
            emp_filter['employee_type'] = policy.employee_type
        if policy.employee_group and policy.employee_group != 'All':
            emp_filter['employee_group'] = policy.employee_group
        if policy.employee_reporting and policy.employee_reporting != 'All':
            emp_filter['reporting'] = policy.employee_reporting

        employees = EmployeeMaster.objects.filter(**emp_filter).filter(
            b_id=policy.b_id
        ) if policy.b_id else EmployeeMaster.objects.filter(**emp_filter)

        self.stdout.write(f'   Employees  : {employees.count()} found\n')

        corrected = 0
        skipped   = 0
        errors    = 0

        for employee in employees:
            try:
                self._process_employee(
                    employee=employee,
                    policy=policy,
                    policy_details=policy_details,
                    financial_year_str=financial_year_str,
                    fy_start_month=fy_start_month,
                    fy_year_start=fy_year_start,
                    year_month=year_month,
                    leave_type_name=leave_type_name,
                    periods_so_far=periods_so_far,
                    dry_run=dry_run,
                )
                corrected = self._corrected
                skipped   = self._skipped
            except Exception as exc:
                self.stderr.write(f'  âŒ {employee.employee_code}: {exc}')
                errors += 1

        self.stdout.write(
            f'\n{"â”€"*60}\n'
            f'  âœ… Corrections: {corrected}\n'
            f'  â­ Skipped    : {skipped}\n'
            f'  âŒ Errors     : {errors}\n'
            + ('  (DRY RUN â€” nothing written)\n' if dry_run else '')
        )

    # â”€â”€ per-employee logic (factored out for clarity) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    _corrected = 0
    _skipped   = 0

    def _process_employee(
        self, employee, policy, policy_details,
        financial_year_str, fy_start_month, fy_year_start,
        year_month, leave_type_name, periods_so_far, dry_run,
    ):
        try:
            leave_master = LeaveMaster.objects.get(employee=employee)
        except LeaveMaster.DoesNotExist:
            self._skipped += 1
            return

        try:
            leave_detail = LeaveMasterDetails.objects.get(
                leave_master=leave_master,
                leave_type=leave_type_name,
                financial_year=financial_year_str,
            )
        except LeaveMasterDetails.DoesNotExist:
            self._skipped += 1
            return

        # â”€â”€ Walk each period in the FY and compare credited vs expected â”€â”€â”€â”€
        month = fy_start_month
        year  = fy_year_start
        for _ in range(periods_so_far):
            period_date  = date_type(year, month, 1)
            month_abbr   = calendar.month_abbr[month]
            year_str     = str(year)

            # What was already credited for this period (accrual + correction rows)
            already_credited = LeaveMasterDetailBreakup.objects.filter(
                leave_master_detail=leave_detail,
                allocated_month=month_abbr,
                allocated_year=year_str,
                entry_type__in=['accrual', 'correction'],
            )
            actual_days = round(float(
                already_credited.aggregate(total=models.Sum('allocated_leaves'))['total'] or 0.0
            ), 2)

            # What should have been credited for this period
            expected_days = 0.0
            for detail in policy_details:
                expected_days += calculate_leave(
                    employee, detail,
                    year_month=year_month,
                    today=period_date,
                    fy_start_month=fy_start_month,
                    prorate_on_join=bool(policy.prorate_on_join),
                )
            expected_days = round(expected_days, 2)

            delta = round(expected_days - actual_days, 2)

            if delta != 0:
                self.stdout.write(
                    f'  {employee.employee_code} | {month_abbr} {year_str} | '
                    f'expected={expected_days:.2f} actual={actual_days:.2f} delta={delta:+.2f}'
                )

                if not dry_run:
                    with transaction.atomic():
                        last_breakup = LeaveMasterDetailBreakup.objects.filter(
                            leave_master_detail=leave_detail
                        ).order_by('id').last()

                        opening = float(last_breakup.available_leaves) if last_breakup else float(
                            leave_detail.opening_balance or 0
                        )
                        new_available = round(opening + delta, 2)
                        # Floor: never let available go below utilized
                        utilized = float(leave_detail.utilized_leaves or 0)
                        new_available = max(new_available, utilized)

                        policy_snapshot = {
                            'policy_id':        policy.pk,
                            'type_of_leave':    leave_type_name,
                            'year_month':       year_month,
                            'expected_days':    expected_days,
                            'actual_days':      actual_days,
                            'delta':            delta,
                            'fy_start_month':   fy_start_month,
                            'financial_year':   financial_year_str,
                            'period_date':      str(period_date),
                        }

                        LeaveMasterDetailBreakup.objects.create(
                            leave_master_detail=leave_detail,
                            leave_policy=policy,
                            opening_balance=opening,
                            allocated_leaves=delta,
                            available_leaves=new_available,
                            allocated_month=month_abbr,
                            allocated_year=year_str,
                            entry_type='correction',
                            policy_snapshot=policy_snapshot,
                            remarks=(
                                f'Recalculation correction: '
                                f'expected {expected_days}, was {actual_days}, delta {delta:+}'
                            ),
                            b_id=employee.b_id,
                        )

                        # Update LeaveMasterDetails totals
                        agg = LeaveMasterDetailBreakup.objects.filter(
                            leave_master_detail=leave_detail
                        ).aggregate(total=models.Sum('allocated_leaves'))
                        total_allocated = round(float(agg['total'] or 0), 2)

                        last_bk = LeaveMasterDetailBreakup.objects.filter(
                            leave_master_detail=leave_detail
                        ).order_by('id').last()

                        leave_detail.allocated_leaves = total_allocated
                        leave_detail.available_leaves = (
                            float(last_bk.available_leaves) if last_bk else total_allocated
                        )
                        leave_detail.save()

                self._corrected += 1

            # Advance to next period
            month += 1
            if month > 12:
                month = 1
                year += 1
