import io
from collections import OrderedDict, defaultdict
from datetime import date, datetime, timedelta
import pandas as pd
import xlsxwriter
from dateutil.relativedelta import relativedelta
from django.http import HttpResponse
from hrm_master.models import LeaveReversalRequest, LeaveMasterDetails, EmployeeMaster, HolidayMaster, LeaveEntry, LeaveMaster, Grade, LeaveApplication, Designation
from master.models import AppSettings
from hrm_master.models import ProfessionalTaxSlab
from hrm_main.models import AttendanceDetails, BonusDetails, Advance, EmployeeMonthlyAllowanceDetails, \
    EmployeeMonthlyDeductionDetails, SalaryHold
from hrm_main.models import EmployeeMonthlySalary
from hrm_utils.custom_functions import generate_unique_id
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from django.contrib.auth.hashers import make_password
from .. import models
from notificationemail.notification import NotificationService
from django.db.models import Count, Q, Sum, F, ExpressionWrapper, IntegerField, Value, Sum, F,FloatField
from django.db.models.functions import Coalesce, Floor, Cast, Concat, LPad
from hrm_utils.custom_functions import get_dynamic_serializer_class, generate_unique_id


class MasterSignal:

    @classmethod
    def on_approve_leave_entry(cls, leave_instance, lop, comp_off, **kwargs):
        if lop == False and comp_off == False or lop == "" and comp_off == "":
            leave_master_details_instance = LeaveMasterDetails.objects.get(id=leave_instance.leave_type.id)
            if leave_master_details_instance.available_leaves != 0:
                leave_master_details_instance.available_leaves = float(
                    leave_master_details_instance.available_leaves or 0) - float(
                    leave_instance.no_of_days or 0)
                leave_master_details_instance.utilized_leaves = float(
                    leave_master_details_instance.utilized_leaves or 0) + float(leave_instance.no_of_days or 0)
                leave_master_details_instance.save()
                leave_master_instance = LeaveMaster.objects.get(id=leave_master_details_instance.leave_master.id)
                leave_master_instance.total_available_leaves = float(
                    leave_master_instance.total_available_leaves or 0) - float(
                    leave_instance.no_of_days or 0)
                leave_master_instance.total_utilized_leaves = float(
                    leave_master_instance.total_utilized_leaves or 0) + float(
                    leave_instance.no_of_days or 0)
                leave_master_instance.save()
        return True

    @classmethod
    def salary_calculation(cls, employee_type, f_date, to_date, b_id, exclude_zero_payable=True):
        employees = EmployeeMaster.objects.filter(
            employee_type__in=employee_type.split(','), is_active=True, b_id=b_id
        ).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def salary_calculation_by_employees(cls, employee_ids_str, f_date, to_date, b_id, exclude_zero_payable=True):
        ids = [i.strip() for i in employee_ids_str.split(',') if i.strip()]
        employees = EmployeeMaster.objects.filter(id__in=ids, is_active=True,b_id=b_id).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def salary_calculation_by_designation(cls, designation_ids_str, f_date, to_date, b_id, exclude_zero_payable=True):
        ids = [i.strip() for i in designation_ids_str.split(',') if i.strip()]
        employees = EmployeeMaster.objects.filter(designation__id__in=ids, is_active=True,b_id=b_id).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def salary_calculation_by_department(cls, department_ids_str, f_date, to_date, b_id, exclude_zero_payable=True):
        ids = [i.strip() for i in department_ids_str.split(',') if i.strip()]
        employees = EmployeeMaster.objects.filter(department__id__in=ids, is_active=True,b_id=b_id).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def salary_calculation_by_sponsor(cls, sponsors_str, f_date, to_date, b_id, exclude_zero_payable=True):
        from django.db.models import Q
        sponsors = [s.strip() for s in sponsors_str.split(',') if s.strip()]
        q = Q()
        for s in sponsors:
            q |= Q(sponsors__icontains=s)
        print("q",q)
        employees = EmployeeMaster.objects.filter(q, is_active=True, b_id=b_id).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def salary_calculation_all(cls, f_date, to_date, b_id, exclude_zero_payable=True):
        print("Calculating salary for all active employees in branch:", b_id)
        employees = EmployeeMaster.objects.filter(is_active=True,b_id=b_id).order_by('doj')
        return cls._build_salary_list(employees, f_date, to_date, b_id, exclude_zero_payable)

    @classmethod
    def _build_salary_list(cls, employee_queryset, f_date, to_date, b_id, exclude_zero_payable=True):
        import json as _json
        employee_list = []
        from_date = datetime.strptime(f_date, '%d-%m-%Y')
        to_date_dt = datetime.strptime(to_date, '%d-%m-%Y')

        # Materialise queryset once with related objects to avoid per-employee FK hits
        # Order by department priority first so grouping respects client-defined order
        # Coalesce treats NULL as 9999 so departments with no order set go last
        # Also departments with order=0 (old default) are treated as unset via Case/When
        from django.db.models.functions import Coalesce
        from django.db.models import Value, IntegerField, Case, When
        employees = list(
            employee_queryset.select_related('department', 'designation', 'grade')
            .annotate(
                dept_order=Case(
                    When(department__order__isnull=True, then=Value(9999)),
                    When(department__order=0, then=Value(9999)),
                    default='department__order',
                    output_field=IntegerField()
                )
            )
            .order_by('dept_order', 'department__department_name', 'first_name', 'last_name')
        )
        if not employees:
            return []

        emp_ids  = [e.id for e in employees]
        emp_codes = [e.employee_code for e in employees]

        # ── Resolve active salary record per employee (effective_date-aware) ─────
        # Pick the latest EmployeeMonthlySalary where effective_date <= payroll month.
        # NULL effective_date = initial setup (no versioning) → treated as 1900-01-01.
        salary_month_start_pre = date(
            datetime.strptime(f_date, '%d-%m-%Y').year,
            datetime.strptime(f_date, '%d-%m-%Y').month,
            1,
        )
        from django.db.models.functions import Coalesce as _Coalesce
        from django.db.models import Value as _Value, Q as _Q
        all_applicable = (
            EmployeeMonthlySalary.objects
            .filter(employee_id__in=emp_ids)
            .filter(_Q(effective_date__lte=salary_month_start_pre) | _Q(effective_date__isnull=True))
            .annotate(eff_sortable=_Coalesce('effective_date', _Value(date(1900, 1, 1))))
            .order_by('employee_id', '-eff_sortable')
            .values('id', 'employee_id')
        )
        active_salary_id_map = {}
        for rec in all_applicable:
            if rec['employee_id'] not in active_salary_id_map:
                active_salary_id_map[rec['employee_id']] = rec['id']
        active_salary_ids = list(active_salary_id_map.values())

        # ── Bulk fetch allowances & deductions ───────────────────────────────────
        allowance_rows = EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings_id__in=active_salary_ids
        ).values('gross_earnings__employee_id', 'components', 'monthly')

        deduction_rows = EmployeeMonthlyDeductionDetails.objects.filter(
            gross_deductions_id__in=active_salary_ids
        ).values('gross_deductions__employee_id', 'components', 'monthly', 'lop_applicable')

        allowance_map = defaultdict(dict)   # emp_id -> {component: monthly}
        for row in allowance_rows:
            allowance_map[row['gross_earnings__employee_id']][row['components']] = row['monthly']

        deduction_map = defaultdict(list)   # emp_id -> [{components, monthly, lop_applicable}]
        for row in deduction_rows:
            deduction_map[row['gross_deductions__employee_id']].append(row)

        # ── Pre-fetch AttendanceStatusMaster (is_paid drives absent/leave sets) ───
        # Guard: is_paid column may not exist yet if the ALTER TABLE SQL hasn't been run.
        # Fall back to hardcoded lists so salary generation never breaks mid-migration.
        from hrm_main.models import AttendanceStatusMaster as _AttStatusMaster
        _FALLBACK_ABSENT  = ['4', '77', '8', '10', '22', '26', '51', '62', '64', '65', '74', '75', '76', '1061', '-1']
        _FALLBACK_LEAVE   = ['8', '9', '10', '20', '21', '23', '62', '64', '65', '68', '71', '73']
        try:
            _all_statuses = list(_AttStatusMaster.objects.only('code', 'status_name', 'is_paid', 'type'))
            # Trigger attribute access to confirm column exists in DB
            _ = _all_statuses[0].is_paid if _all_statuses else True
            status_master_map = {s.code: s for s in _all_statuses}
            ABSENT_STATUSES   = [s.code for s in _all_statuses if not s.is_paid]
            LEAVE_STATUSES    = [s.code for s in _all_statuses if (s.type or '').lower() == 'leave']
            _is_paid_available = True
        except Exception:
            # Column not yet in DB — use hardcoded fallback and build a minimal status_master_map
            _all_statuses = list(_AttStatusMaster.objects.only('code', 'status_name', 'type'))
            status_master_map = {s.code: s for s in _all_statuses}
            ABSENT_STATUSES   = _FALLBACK_ABSENT
            LEAVE_STATUSES    = _FALLBACK_LEAVE
            _is_paid_available = False

        # ── Pre-fetch LeavePolicy pay_percentage per employee per leave-type ────
        # employee → LeaveMaster → LeaveMasterDetails → LeavePolicy → LeavePolicyDetail
        # Single flat values() query — no select_related/prefetch overhead.
        from hrm_master.models import LeaveMasterDetails as _LMD
        _emp_lp_map = {}   # {emp_id: {status_code: {'pay_pct', 'pay_on'}}}
        _lmd_rows = _LMD.objects.filter(
            leave_master__employee_id__in=emp_ids,
            leave_master__b_id=b_id,
            is_active=True,
            leave_policy_key__isnull=False,
            leave_policy_key__type_of_leave__isnull=False,
            leave_policy_key__is_active=True,
        ).values(
            'leave_master__employee_id',
            'leave_policy_key__type_of_leave__code',
            'leave_policy_key__pay_on',
            'leave_policy_key__leave_policy_details__pay_percentage',
            'leave_policy_key__leave_policy_details__id',
            'leave_policy_key__leave_policy_details__is_active',
        ).order_by(
            'leave_master__employee_id',
            'leave_policy_key__type_of_leave__code',
            'leave_policy_key__leave_policy_details__id',  # lowest id = first detail row
        )
        _seen_lp = set()  # (emp_id, code) — only take first detail row per policy
        for _row in _lmd_rows:
            if not _row['leave_policy_key__leave_policy_details__is_active']:
                continue
            _eid  = _row['leave_master__employee_id']
            _code = str(_row['leave_policy_key__type_of_leave__code'] or '')
            if not _code or (_eid, _code) in _seen_lp:
                continue
            _seen_lp.add((_eid, _code))
            if _eid not in _emp_lp_map:
                _emp_lp_map[_eid] = {}
            _emp_lp_map[_eid][_code] = {
                'pay_pct': float(_row['leave_policy_key__leave_policy_details__pay_percentage'] or 100),
                'pay_on':  _row['leave_policy_key__pay_on'] or 'gross',
            }

        def _get_leave_policy(emp_id, status_code):
            """Return {'pay_pct', 'pay_on'} for this employee + leave status, or None."""
            return _emp_lp_map.get(emp_id, {}).get(str(status_code))

        # ── Bulk fetch attendance ─────────────────────────────────────────────────
        att_qs = AttendanceDetails.objects.filter(
            is_active=True,
            date__range=(from_date.date(), to_date_dt.date()),
            b_id=b_id,
            employee_code__in=emp_codes,
        )

        att_agg = att_qs.values('employee_code').annotate(
            # present_all: all records minus unpaid-status days (weekly-offs count as present)
            present_all=Count('date') - Count('id', filter=Q(status__in=ABSENT_STATUSES)),
            leave_days_count=Count('id', filter=Q(status__in=LEAVE_STATUSES)),
            ot_hrs_total=Sum(Cast('ot_hrs', FloatField())),
            hot_hrs_total=Sum(Cast('hot_hrs', FloatField())),
            ot2_hrs_total=Sum(Cast('ot2_hrs', FloatField())),
            # total_hours stores worked minutes (despite the name); sum across all present days
            total_hours_total=Sum(Cast('total_hours', FloatField())),
        )
        att_by_code = {r['employee_code']: r for r in att_agg}

        # Per-status day counts per employee (for salary_breakdown attendance section)
        att_by_status_qs = att_qs.values('employee_code', 'status').annotate(days=Count('id'))
        att_status_map = defaultdict(list)  # employee_code → [{status_code, days}]
        for _r in att_by_status_qs:
            att_status_map[_r['employee_code']].append({
                'status_code': _r['status'],
                'days': _r['days'],
            })

        # ── Bulk fetch direct advances (cash given to employee this salary month) ──
        salary_month_start = date(from_date.year, from_date.month, 1)
        advance_direct_qs = Advance.objects.filter(
            date__year=from_date.year,
            date__month=from_date.month,
            employee_id__in=emp_ids,
            approval_status='APPROVED',
        ).values('employee_id', 'advance_amount')
        advance_direct_map = defaultdict(float)
        for r in advance_direct_qs:
            advance_direct_map[r['employee_id']] += float(r['advance_amount'] or 0)

        # ── Bulk fetch loan advances (EMI deductions, logic applied per-employee) ──
        all_advances = list(
            Advance.objects.filter(
                employee_id__in=emp_ids,
                approval_status='APPROVED',
                loan_start_date__isnull=False,
            ).values('employee_id', 'loan_start_date', 'emi', 'balance_loan_amount')
        )
        # Group by employee for O(1) lookup in the per-employee loop
        advance_rows_map = defaultdict(list)
        for row in all_advances:
            advance_rows_map[row['employee_id']].append(row)

        # ── Bulk fetch bonus ──────────────────────────────────────────────────────
        bonus_qs = BonusDetails.objects.filter(
            bonus__bonus_months__month=from_date.month,
            bonus__bonus_months__year=from_date.year,
            bonus__approval_status='APPROVED',
            employee_id__in=emp_ids,
        ).values('employee_id', 'bonus_amount')
        bonus_map = {r['employee_id']: r['bonus_amount'] for r in bonus_qs}


        # ── Cache app settings & professional tax slabs ──────────────────────────
        min_ot_setting = AppSettings.objects.filter(app_key='MIN_OT_HOURS').first()
        min_ot_hours = float(min_ot_setting.app_value) if min_ot_setting else 1.0

        tax_slabs = list(ProfessionalTaxSlab.objects.filter(b_id=b_id).order_by('min_salary'))

        def get_prof_tax(gross):
            for slab in tax_slabs:
                if gross >= (slab.min_salary or 0):
                    if slab.max_salary is None or gross <= slab.max_salary:
                        return float(slab.tax_amount or 0)
            return 0.0

        # Only process employees who have salary components configured
        # ── Bulk fetch active salary holds for the period ────────────────────────
        hold_records = SalaryHold.objects.filter(
            is_active=True,
            approval_status='APPROVED',
            hold_from_date__lte=to_date_dt.date(),
            released_on__isnull=True,
        ).filter(
            Q(hold_to_date__isnull=True) | Q(hold_to_date__gte=from_date.date())
        ).values_list('employee_ids', flat=True)
        held_employee_ids = set()
        for ids in hold_records:
            if ids:
                held_employee_ids.update(str(i) for i in ids)

        emp_ids_with_components = set(allowance_map.keys())

        # ── Per-employee loop (no DB hits inside) ─────────────────────────────────
        for employee in employees:
            if employee.id not in emp_ids_with_components:
                continue
            eid  = employee.id
            code = employee.employee_code

            # Total calendar days in the period (MNC standard: 30/31 day basis)
            total_calendar_days = (to_date_dt.date() - from_date.date()).days + 1

            # Attendance
            att = att_by_code.get(code, {})
            present_display = att.get('present_all') or 0  # all records minus absent (weekly-offs = present)

            # Skip employees with zero payable days (fully absent for the month)
            if exclude_zero_payable and present_display == 0:
                continue

            leave_days      = att.get('leave_days_count') or 0
            ot_mins = (att.get('ot_hrs_total') or 0) + (att.get('ot2_hrs_total') or 0) + (att.get('hot_hrs_total') or 0)
            total_ot_hours = round(ot_mins / 60, 1)

            # Allowances
            allowance_details = dict(allowance_map.get(eid, {}))
            gross_earnings = sum(float(v or 0) for v in allowance_details.values())
            basic_pay = float(next(
                (v for k, v in allowance_details.items() if 'basic' in k.lower()),
                0
            ) or 0)

            # ── Per-status attendance breakdown → LOP (paid/unpaid aware) ─────────
            daily_rate = round(gross_earnings / total_calendar_days, 4) if gross_earnings and total_calendar_days else 0.0
            attendance_breakdown = []
            lop_amount = 0.0

            for _sr in att_status_map.get(code, []):
                _sc   = str(_sr['status_code'])
                _days = _sr['days']
                _sm   = status_master_map.get(_sc)

                _status_name  = _sm.status_name if _sm else _sc
                # Use is_paid from DB if column exists, else fall back to: unpaid if code in ABSENT list
                if _is_paid_available and _sm:
                    _is_paid = _sm.is_paid
                else:
                    _is_paid = (_sc not in _FALLBACK_ABSENT)  # fallback: absent list codes = unpaid

                # basic_daily: per-day Basic Pay; falls back to gross daily if Basic Pay component not found
                _basic_daily = round(basic_pay / total_calendar_days, 4) if basic_pay and total_calendar_days else daily_rate

                if _is_paid:
                    # Paid status — check if a leave policy applies (e.g. leave at reduced pay%)
                    _lp = _get_leave_policy(eid, _sc)
                    if _lp:
                        _pay_pct = _lp['pay_pct']
                        if _lp['pay_on'] == 'basic':
                            # Employee gets pay_pct% of Basic for these days.
                            # Deduction = gross_daily×days - basic_daily×(pay_pct/100)×days
                            _paid_amount = round(_basic_daily * _days * (_pay_pct / 100), 2)
                            _lop_contrib = round(max(0, daily_rate * _days - _paid_amount), 2)
                        else:
                            # Employee gets pay_pct% of Gross for these days.
                            _lop_contrib = round(daily_rate * _days * (1 - _pay_pct / 100), 2)
                    else:
                        # No leave policy (e.g. WO, regular present) → fully paid, no LOP
                        _pay_pct     = 100.0
                        _lop_contrib = 0.0
                else:
                    # Unpaid status — full daily deduction
                    _pay_pct    = 0.0
                    _lop_contrib = round(daily_rate * _days, 2)
                attendance_breakdown.append({
                    'status_code':      _sc,
                    'status_name':      _status_name,
                    'days':             _days,
                    'is_paid':          _is_paid,
                    'pay_percentage':   _pay_pct,
                    'pay_on':           (_lp['pay_on'] if _lp else 'gross'),
                    'lop_contribution': _lop_contrib,
                    'daily_rate':       daily_rate,
                    'basic_daily_rate': _basic_daily,
                })
                lop_amount += _lop_contrib

            # ── Unaccounted days (no attendance record at all, e.g. before DOJ) ────
            # If total attendance records < total_calendar_days, the missing days
            # have no records — treat them as unpaid (no-show / pre-joining days).
            accounted_days = sum(_sr['days'] for _sr in att_status_map.get(code, []))
            unaccounted_days = max(0, total_calendar_days - accounted_days)
            if unaccounted_days:
                _unaccounted_lop = round(daily_rate * unaccounted_days, 2)
                attendance_breakdown.append({
                    'status_code':      'UNACCOUNTED',
                    'status_name':      'No Record',
                    'days':             unaccounted_days,
                    'is_paid':          False,
                    'pay_percentage':   0.0,
                    'lop_contribution': _unaccounted_lop,
                    'daily_rate':       daily_rate,
                })
                lop_amount += _unaccounted_lop

            lop_amount = round(lop_amount)
            # OT
            hourly_rate = gross_earnings / 240 if gross_earnings else 0
            ot_amount = round(hourly_rate * total_ot_hours, 2) if total_ot_hours >= min_ot_hours else 0

            # Deductions
            gross_deductions = 0
            tds_amount = 0
            deduction_details = {}
            pf_perc = 0
            for d in deduction_map.get(eid, []):
                comp = d['components']
                if comp == 'Professional Tax':
                    pt = get_prof_tax(gross_earnings)
                    gross_deductions += pt
                    deduction_details[comp] = pt
                else:
                    amt = float(d['monthly'] or 0)
                    gross_deductions += amt
                    deduction_details[comp] = amt
                    if comp == 'TDS':
                        tds_amount += amt

            pf_contribution = round((basic_pay * pf_perc) / 100)
            employer_pf_contribution = min(pf_contribution, 1800)

            # Bonus & advance
            bonus_amount = float(bonus_map.get(eid, 0) or 0)

            # Compute EMI and balance from advance rows for this employee
            advance_emi     = 0.0
            advance_balance = 0.0
            for adv in advance_rows_map.get(eid, []):
                loan_start = adv['loan_start_date']
                balance    = float(adv['balance_loan_amount'] or 0)
                emi_val    = float(adv['emi'] or 0)
                if balance <= 0:
                    continue
                # Active if loan_start month/year <= salary month/year
                loan_month_start = date(loan_start.year, loan_start.month, 1)
                if loan_month_start <= salary_month_start:
                    advance_emi     += emi_val
                    # balance after this month's deduction (floor 0)
                    advance_balance += max(0.0, balance - emi_val)

            advance_amount = advance_direct_map.get(eid, 0.0)
            gross_pay      = gross_earnings
            earned         = 0  # computed by frontend based on selected columns
            deductions_pay = gross_deductions  # advance_emi added by frontend only if column is selected
            net_pay        = 0  # computed by frontend based on selected columns

            basic = sum(float(v or 0) for k, v in allowance_details.items() if 'basic' in k.lower())
            variable = sum(float(v or 0) for k, v in allowance_details.items() if 'basic' not in k.lower())

            # ── Build salary_breakdown snapshot ───────────────────────────────────
            # Allowances: list of {component, amount}
            _breakdown_allowances = [
                {'component': k, 'amount': round(float(v or 0), 2)}
                for k, v in allowance_details.items()
            ]
            # Deductions: configured deductions + LOP as a line item
            _breakdown_deductions = [
                {'component': k, 'amount': round(float(v or 0), 2)}
                for k, v in deduction_details.items()
            ]
            if lop_amount:
                _lop_days_total = sum(
                    _r['days'] for _r in attendance_breakdown if not _r['is_paid']
                ) + sum(
                    _r['days'] for _r in attendance_breakdown
                    if _r['is_paid'] and _r['pay_percentage'] < 100
                )
                _breakdown_deductions.append({
                    'component': f'LOP ({_lop_days_total} day{"s" if _lop_days_total != 1 else ""})',
                    'amount': round(float(lop_amount), 2),
                })
            if advance_emi:
                _breakdown_deductions.append({
                    'component': 'Advance EMI',
                    'amount': round(float(advance_emi), 2),
                })

            salary_breakdown = {
                'allowances':  _breakdown_allowances,
                'deductions':  _breakdown_deductions,
                'attendance':  attendance_breakdown,
                'summary': {
                    'gross_pay':         round(float(gross_pay), 2),
                    'lop_amount':        round(float(lop_amount), 2),
                    'ot_amount':         round(float(ot_amount), 2),
                    'bonus':             round(float(bonus_amount), 2),
                    'earned':            0,   # recomputed by frontend onChangeFields
                    'total_deductions':  round(float(gross_deductions), 2),
                    'advance_emi':       round(float(advance_emi), 2),
                    'arrears':           0.0,
                    'net_pay':           0,   # recomputed by frontend onChangeFields
                },
            }

            # Total worked minutes this period (total_hours field stores minutes despite the name)
            total_worked_minutes = att.get('total_hours_total') or 0

            employee_list.append({
                "id":                       generate_unique_id(),
                "from_date":                from_date.date(),
                "to_date":                  to_date_dt.date(),
                "employee":                 eid,
                "employee_code":            code,
                "first_name":               employee.first_name,
                "employee_type":            employee.employee_type,
                "department":               employee.department.department_name if employee.department else "",
                "designation":              employee.designation.designation_name if employee.designation else "",
                "last_name":                employee.last_name,
                "no_of_days":               present_display,
                "total_worked_minutes":     total_worked_minutes,
                "doj":                      employee.doj,
                "ot":                       ot_amount,
                "loan_advance":             0,
                "other_expense":            0,
                "other_incentive":          0,
                "lop_amount":               lop_amount,
                "tds":                      tds_amount,
                "advance_emi":              advance_emi,
                "income_tax":               0,
                "bonus":                    bonus_amount,
                "advance":                  advance_amount,
                "gross_pay":                gross_pay,
                "deductions_pay":           deductions_pay,
                "base_gross_amount":        gross_earnings,
                "base_deductions_amount":   gross_deductions,
                "net_pay":                  net_pay,
                "allowance_details":        allowance_details,
                "deduction_details":        deduction_details,
                "employer_pf_contribution": employer_pf_contribution,
                "basic":                    basic,
                "variable":                 variable,
                "salary_status":            'hold' if str(eid) in held_employee_ids else 'processing',
                "sponsors":                 employee.sponsors or "",
                "leave_days":               leave_days,
                "working_days":             total_calendar_days,
                "advance_balance":          advance_balance,
                "earned":                   earned,
                "arrears":                  0.0,
                "remarks":                  "",
                "salary_breakdown":         salary_breakdown,
            })

        return employee_list

    # @classmethod
    # def salary_calculation(cls, employee_type, f_date, to_date, b_id):
    #     employee_list = []
    #     from_date = datetime.strptime(f_date, '%d-%m-%Y')
    #     to_date = datetime.strptime(to_date, '%d-%m-%Y')
    #     designation_list = [x.strip().lower()  for x in employee_type.split(',')]
    #     try:
    #         app_val = AppSettings.objects.filter(app_key__iexact='operators').first()
    #         if app_val and getattr(app_val, 'app_value', None):
    #             operator_driver_designations = [x.strip(' ()').lower() for x in app_val.app_value.split(',') if x.strip()]
    #         else:
    #             operator_driver_designations = ['operators', 'drivers']
    #     except Exception:
    #         operator_driver_designations = ['operators', 'drivers']
    #     is_operator_driver = any(d in operator_driver_designations for d in designation_list)


    #     # Build case-insensitive Q filters to be more flexible with DB values
    #     def build_insensitive_q(field, values):
    #         q = Q()
    #         for v in values:
    #             v = v.strip()
    #             if not v:
    #                 continue
    #             q |= Q(**{f"{field}__iexact": v}) | Q(**{f"{field}__icontains": v})
    #         return q

    #     if is_operator_driver:
    #         q = build_insensitive_q('designation__designation_name', designation_list)
    #         all_employee_list = EmployeeMaster.objects.filter(q, is_active=True).order_by('doj')
    #     else:
    #         q = build_insensitive_q('employee_type', designation_list)
    #         all_employee_list = EmployeeMaster.objects.filter(q, is_active=True).order_by('doj')

    #     # If still empty, try a more flexible query
    #     if all_employee_list.count() == 0:
    #         all_employee_list = EmployeeMaster.objects.filter(
    #             designation__designation_name__in=designation_list,
    #             is_active=True
    #         ).order_by('doj')

    #         # If still empty, check if any employees exist at all
    #         if all_employee_list.count() == 0:
    #             total_employees = EmployeeMaster.objects.filter(is_active=True).count()

    #             # Check what designations actual employees have
    #             employees_with_designations = EmployeeMaster.objects.filter(
    #                 is_active=True,
    #                 designation__isnull=False
    #             ).values_list('designation__designation_name', flat=True).distinct()

    #     for employee in all_employee_list:
    #         working_days = cls.get_days_in_month(from_date, to_date, employee)

    #         emp_desig = employee.designation.designation_name.lower() if employee.designation else ''
    #         if employee.designation and emp_desig in operator_driver_designations:
    #             present_count, lop_days, lop_amount, ot_amount = cls.get_operator_timesheet_attendance(
    #                 from_date, to_date, employee, working_days)
    #         else:
    #             present_count, lop_days, lop_amount, ot_amount = cls.get_present_and_lop(
    #                 from_date, to_date, employee.employee_code, employee.b_id, working_days)

    #         gross_earnings, gross_deductions, tds_amount, allowance_details, deduction_details, employer_pf_contribution = cls.monthly_employee_salary(
    #             employee.id, lop_days, working_days, b_id, employee.grade)

    #         bonus_amount = cls.bonus_amount(from_date, employee.id, employee.grade)
    #         advance_amount, advance_emi = cls.advance_amount(from_date, employee.id)
    #         gross_pay = float(gross_earnings) + float(bonus_amount) + float(advance_amount) + float(ot_amount)
    #         net_pay = gross_pay - (float(gross_deductions) + float(advance_emi)+float(lop_amount))
    #         deductions_pay = float(gross_deductions) + float(advance_emi)

    #         employee_data = {
    #             "id": generate_unique_id(),
    #             "from_date": from_date.date(),
    #             "to_date": to_date.date(),
    #             "employee": employee.id,
    #             "employee_code": employee.employee_code,
    #             "first_name": employee.first_name,
    #             "employee_type": employee.employee_type,
    #             "designation": employee.designation.designation_name if employee.designation else None,
    #             "last_name": employee.last_name,
    #             "no_of_days": present_count or 0,
    #             "doj": employee.doj,
    #             "ot": ot_amount,
    #             "loan_advance": 0,
    #             "other_expense": 0,
    #             "other_incentive": 0,
    #             "lop_amount": lop_amount,
    #             "tds": tds_amount,
    #             "advance_emi": advance_emi,
    #             "income_tax": 0,
    #             "bonus": bonus_amount,
    #             "advance": advance_amount,
    #             "gross_pay": gross_pay,
    #             "deductions_pay": deductions_pay,
    #             "base_gross_amount": gross_earnings,
    #             "base_deductions_amount": gross_deductions,
    #             "net_pay": net_pay,
    #             "allowance_details": allowance_details,
    #             "deduction_details": deduction_details,
    #             "employer_pf_contribution": employer_pf_contribution,
    #         }

    #         employee_list.append(employee_data)

    #     return employee_list

    @classmethod
    def get_operator_timesheet_attendance(cls, from_date, to_date, employee, working_days):
        """Calculate attendance, overtime, and LOP for operators/drivers"""
        from django.db.models import Sum, Q

        # Normalize dates
        if isinstance(from_date, datetime):
            from_date = from_date.date()
        elif isinstance(from_date, str):
            from_date = datetime.strptime(from_date, '%Y-%m-%d').date()

        if isinstance(to_date, datetime):
            to_date = to_date.date()
        elif isinstance(to_date, str):
            to_date = datetime.strptime(to_date, '%Y-%m-%d').date()

        # Get all timesheet entries for this employee in date range
        entries = TimesheetEntry.objects.filter(
            date__range=(from_date, to_date),
            timesheet__is_active=True,
            start_time__isnull=False,
        ).filter(
            Q(timesheet__operator_shift_one=employee) |
            Q(timesheet__operator_shift_two=employee)
        )

        # Count distinct dates present
        present_count = entries.values('date').distinct().count()

        # Calculate total overtime hours
        overtime_hours_total = entries.aggregate(total=Sum('overtime_hours'))['total'] or 0

        # Calculate LOP days
        lop_days = max(0, working_days - present_count)

        # Get gross earnings for LOP calculation
        gross = EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings__employee=employee
        ).aggregate(total=Sum('monthly'))['total'] or 0

        # Calculate LOP amount based on daily wage
        daily_wage = gross / working_days if gross and working_days > 0 else 0
        lop_amount = round(daily_wage * lop_days)

        # Calculate overtime amount (assuming 1.5x normal rate)
        # Get hourly rate: gross / (working_days * 8) assuming 8-hour workday
        normal_hourly_rate = gross / (working_days * 8) if gross and working_days > 0 else 0
        ot_amount = round(overtime_hours_total * normal_hourly_rate * 1.5)

        print(f"Employee: {employee.employee_code}, Present: {present_count}, OT Hours: {overtime_hours_total}, OT Amount: {ot_amount}")

        # Return only 4 values to match the expected return
        return present_count, lop_days, lop_amount, ot_amount

    @classmethod
    def get_working_days(cls, from_date, to_date):
        # Calculate the number of working days excluding Sundays
        working_days = sum(
            1 for day in range((to_date - from_date).days + 1)
            if (from_date + timedelta(days=day)).weekday() != 6
        )
        return working_days

    @classmethod
    def get_present_and_lop(cls, from_date, to_date, employee_code, b_id, working_days):
        parse = lambda d: datetime.strptime(d, "%Y-%m-%d").date() if isinstance(d, str) else d
        from_date, to_date = parse(from_date), parse(to_date)
        total_ot_minutes=0
        emp = EmployeeMaster.objects.filter(
            employee_code=employee_code, is_active=True
        ).filter(Q(dor__isnull=True) | Q(dor__gte=from_date)).first()

        if not emp:
            return 0, 0, 0, 0

        # weekly_off may be stored as a JSON string '["Sunday"]' or already a list
        import json as _json
        raw_weekly_off = emp.weekly_off or []
        if isinstance(raw_weekly_off, str):
            try:
                raw_weekly_off = _json.loads(raw_weekly_off)
            except Exception:
                raw_weekly_off = []
        weekly_off = [d.strip() for d in raw_weekly_off if isinstance(d, str) and len(d) > 2]
        # Build exact list of weekly-off dates in the range (same logic as get_days_in_month)
        total_days = (to_date - from_date).days + 1
        weekly_off_dates = [
            from_date + timedelta(days=i)
            for i in range(total_days)
            if (from_date + timedelta(days=i)).strftime('%A') in weekly_off
        ]
        att_qs = AttendanceDetails.objects.filter(
            is_active=True,
            date__range=(from_date, to_date),
            b_id=b_id,
            employee_code=emp.employee_code
        )
        # Full attendance (including weekly-off days) for display present count
        att_all = att_qs.aggregate(
            present_display=Count('date') - Count('id', filter=Q(
                status__in=['4', '77', '8', '10', '22', '26', '51', '62', '64', '65', '74', '75', '76', '1061', '-1'])),
            ot_hrs_total=Sum(Cast('ot_hrs', FloatField())),
            hot_hrs_total=Sum(Cast('hot_hrs', FloatField())),
            ot2_hrs_total=Sum(Cast('ot2_hrs', FloatField())),
        )
        present_display = att_all.get('present_display') or 0
        ot_hrs1 = att_all.get('ot_hrs_total') or 0
        ot_hrs2 = att_all.get('ot2_hrs_total') or 0
        ot_hrs3 = att_all.get('hot_hrs_total') or 0

        # Attendance excluding weekly-off days — used only for LOP calculation
        att_working = att_qs.exclude(date__in=weekly_off_dates).aggregate(
            present_working=Count('date') - Count('id', filter=Q(
                status__in=['4', '77', '8', '10', '22', '26', '51', '62', '64', '65', '74', '75', '76', '1061', '-1'])),
        )
        present_working = att_working.get('present_working') or 0

        total_ot_minutes = ot_hrs1 + ot_hrs2 + ot_hrs3
        total_ot_hours = round(total_ot_minutes / 60, 1)

        gross = EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings__employee=emp
        ).aggregate(total=Sum('monthly'))['total'] or 0
        hourly_rate = gross / 240 if gross else 0
        value = AppSettings.objects.filter(app_key='MIN_OT_HOURS').first()
        min_ot_hours = float(value.app_value) if value else 1
        ot_amount = round(hourly_rate * total_ot_hours, 2) if total_ot_hours >= min_ot_hours else 0

        # LOP uses working-day present; display present includes weekly-off days
        lop_days = max(0, working_days - present_working)
        lop_amount = round((gross / working_days) * lop_days) if gross and working_days else 0
        return present_display, lop_days, lop_amount, ot_amount

    @classmethod
    def bonus_amount(cls, date, employee_id, grade):
        bonus_queryset = BonusDetails.objects.filter(
            bonus__bonus_months__month=date.month,
            bonus__bonus_months__year=date.year,
            bonus__grade=grade if grade else None,
            employee=employee_id, bonus__approval_status='APPROVED'
        )
        bonus_amounts = [bonus.bonus_amount for bonus in bonus_queryset]
        if bonus_amounts:
            bonus_price = bonus_amounts[0]
        else:
            bonus_price = 0
        return bonus_price

    @classmethod
    def advance_amount(cls, from_date, employee_id):
        from_month = from_date.month
        from_year = from_date.year

        # Query to get advance amount for the specified month and year
        advance_amount_qs = Advance.objects.filter(
            date__year=from_year,
            date__month=from_month,
            employee=employee_id,
            approval_status='APPROVED'
        )

        if advance_amount_qs.exists():
            advance_amount = sum(advance.advance_amount for advance in advance_amount_qs)
            return advance_amount, 0
        else:
            # Query to get loan EMI for loans started on or before the specified month and year
            advance_loan_qs = Advance.objects.filter(
                Q(loan_start_date__year__lt=from_year) |
                (Q(loan_start_date__year=from_year) & Q(loan_start_date__month__lte=from_month)),
                employee=employee_id,
                approval_status='APPROVED'
            )

            if advance_loan_qs.exists():
                loan_emi = sum(advance.emi for advance in advance_loan_qs if advance.balance_loan_amount > 0)
                return 0, loan_emi

        return 0, 0

    @classmethod
    def monthly_employee_salary(cls, employee_id, lop_days, working_days, b_id, grade):
        allowance_dict = {}
        deductions_dict = {}
        gross_earnings = 0
        gross_deductions = 0
        tds_amount = 0
        basic_pay = 0
        gross_earnings_list = EmployeeMonthlyAllowanceDetails.objects.filter(gross_earnings__employee=employee_id)
        gross_deductions_list = EmployeeMonthlyDeductionDetails.objects.filter(gross_deductions__employee=employee_id)

        for gross in gross_earnings_list:
            earnings = gross.monthly
            gross_earnings += gross.monthly
            if gross.components == "Basic Pay" and earnings:
                basic_pay = earnings
            allowance_dict[gross.components] = earnings

        for deduction in gross_deductions_list:
            if deduction.components == "Professional Tax":
                slab = ProfessionalTaxSlab.objects.filter(
                    min_salary__lte=gross_earnings, b_id=b_id
                ).filter(
                    Q(max_salary__gte=gross_earnings) | Q(max_salary__isnull=True)
                ).first()
                professional_tax = slab.tax_amount if slab else 0
                if deduction.lop_applicable:
                    gross_deductions += professional_tax
                    deductions_dict[deduction.components] = professional_tax
            else:

                deductions = deduction.monthly
                gross_deductions += deduction.monthly
                deductions_dict[deduction.components] = deductions

                if deduction.components == 'TDS':
                    tds_amount += deductions
        # pf_perc = grade.pf_employer_contribution or 0
        pf_perc = 0
        pf_contribution = round((basic_pay * pf_perc) / 100)
        if pf_contribution < 1800:
            employer_pf_contribution = pf_contribution
        else:
            employer_pf_contribution = 1800
        # print("employer_pf_contribution", employer_pf_contribution)

        return gross_earnings, gross_deductions, tds_amount, allowance_dict, deductions_dict, employer_pf_contribution

    @classmethod
    def lop_amount_leave_days(cls, to_date, from_date, employee_id, working_days):
        leave_qs = LeaveEntry.objects.filter(
            from_date__gte=from_date,
            to_date__lte=to_date,
            employee=employee_id,
            approval_status='APPROVED',
            leave_type__code=22
        )
        leave_count = sum(leave.no_of_days for leave in leave_qs)

        gross_qs = EmployeeMonthlyAllowanceDetails.objects.filter(
            gross_earnings__employee=employee_id
        )
        gross_earnings = sum(gross.monthly for gross in gross_qs)

        if not gross_earnings or not working_days:
            return 0, leave_count

        lop_amount = round((gross_earnings / working_days) * leave_count)
        return lop_amount, leave_count

    @classmethod
    def ot_salary_calculation(cls, from_date, to_date, b_id):
        """
        Collect employees from TimesheetEntry for the given date range,
        sum their overtime_hours, and compute OT amount using gross_salary / 240.
        Returns a list of dicts ready for OTEmployeeList creation.
        """
        from django.db.models import Sum, Q

        if isinstance(from_date, str):
            from_date = datetime.strptime(from_date, '%d-%m-%Y').date()
        if isinstance(to_date, str):
            to_date = datetime.strptime(to_date, '%d-%m-%Y').date()

        # Aggregate overtime_hours per employee (shift_one and shift_two)
        entries = TimesheetEntry.objects.filter(
            date__range=(from_date, to_date),
            timesheet__is_active=True,
            timesheet__b_id=b_id,
            overtime_hours__gt=0,
        ).filter(
            Q(timesheet__operator_shift_one__isnull=False) |
            Q(timesheet__operator_shift_two__isnull=False)
        )

        # Map employee_id -> total OT hours (an employee may appear as shift_one or shift_two)
        employee_ot = {}  # {employee_id: total_ot_hours}

        for entry in entries.select_related('timesheet__operator_shift_one', 'timesheet__operator_shift_two'):
            ot = float(entry.overtime_hours or 0)
            if ot <= 0:
                continue
            for emp in [entry.timesheet.operator_shift_one, entry.timesheet.operator_shift_two]:
                if emp:
                    employee_ot[emp.id] = employee_ot.get(emp.id, 0) + ot

        employee_list = []
        for emp_id, total_ot_hours in employee_ot.items():
            emp = EmployeeMaster.objects.filter(id=emp_id, is_active=True).first()
            if not emp:
                continue

            # hourly_rate = gross_salary / 240
            gross = EmployeeMonthlyAllowanceDetails.objects.filter(
                gross_earnings__employee=emp
            ).aggregate(total=Sum('monthly'))['total'] or 0
            hourly_rate = round(float(gross) / 240, 2) if gross else 0
            ot_amount = round(hourly_rate * total_ot_hours, 2)

            # Pro-rata allowance from AllowanceAllocation
            allowance_total = cls._get_prorata_allowance(emp_id, from_date, to_date, b_id)

            employee_list.append({
                'id': generate_unique_id(),
                'employee': emp.id,
                'employee_code': emp.employee_code or '',
                'first_name': emp.first_name or '',
                'last_name': emp.last_name or '',
                'gross_salary': round(float(gross), 2),
                'total_ot_hours': round(total_ot_hours, 2),
                'hourly_rate': hourly_rate,
                'ot_amount': ot_amount,
                'allowance': allowance_total,
                'deduction': 0,
                'net_ot_amount': round(ot_amount + allowance_total, 2),
            })

        employee_list.sort(key=lambda x: x['first_name'])
        return employee_list

    @classmethod
    def _get_prorata_allowance(cls, employee_id, payroll_from, payroll_to, b_id):
        """
        Sum pro-rata allowance amounts from AllowanceAllocation for an operator
        that overlap with the payroll period.

        Formula:
            pro_rata = detail.amount * (overlap_days / total_allocation_days)
        """
        from decimal import Decimal

        allocations = AllowanceAllocation.objects.filter(
            operator=employee_id,
            b_id=b_id,
            is_active=True,
            from_date__lte=payroll_to,
            to_date__gte=payroll_from,
        ).prefetch_related('allowance_details')

        total = Decimal('0.00')
        for allocation in allocations:
            alloc_from = allocation.from_date
            alloc_to   = allocation.to_date
            total_days = (alloc_to - alloc_from).days + 1

            overlap_from = max(payroll_from, alloc_from)
            overlap_to   = min(payroll_to,   alloc_to)
            overlap_days = (overlap_to - overlap_from).days + 1

            if overlap_days <= 0 or total_days <= 0:
                continue

            ratio = Decimal(overlap_days) / Decimal(total_days)
            for detail in allocation.allowance_details.all():
                total += (Decimal(str(detail.amount)) * ratio).quantize(Decimal('0.01'))

        return float(total)

    @classmethod
    def validate_dates(cls, from_date, to_date):
        """Validate that from_date is earlier than or equal to to_date."""
        if isinstance(from_date, str):
            from_date = datetime.strptime(from_date, "%d-%m-%Y").date()
        if isinstance(to_date, str):
            to_date = datetime.strptime(to_date, "%d-%m-%Y").date()

        if from_date > to_date:
            raise serializers.ValidationError("The 'from date' must be earlier than the 'to date'.")

    @classmethod
    def validate_duplicate_dates(cls, employee_id, from_date, to_date, exclude_instance=None):
        """Validate the provided leave dates to ensure they do not overlap with previously applied leave dates."""
        existing_leaves = LeaveEntry.objects.filter(employee=employee_id, is_active=True,
                                                    approval_status__in=['PENDING_APPROVAL', 'APPROVED'],is_reversal=False).all()
        if exclude_instance:
            existing_leaves = existing_leaves.exclude(id=exclude_instance.id)
        for leave in existing_leaves:
            leave_from_date = leave.from_date
            leave_to_date = leave.to_date
            current_date = from_date
            while current_date <= to_date:
                if (current_date >= leave_from_date and current_date <= leave_to_date):
                    formatted_from_date = leave_from_date.strftime('%d-%m-%Y')
                    formatted_to_date = leave_to_date.strftime('%d-%m-%Y')
                    formatted_date = current_date.strftime('%d-%m-%Y')
                    raise serializers.ValidationError(
                        f"Provided leave date({formatted_date})is overlapping with already applied leaves from {formatted_from_date} to {formatted_to_date})")
                current_date += timedelta(days=1)
    @classmethod
    def validate_reversal_dates(cls, from_date, to_date):
        """Validate that from_date is earlier than or equal to to_date."""
        if isinstance(from_date,str):
            from_date=datetime.strptime(from_date, "%d-%m-%Y").date()
        if isinstance(to_date,str):
            to_date=datetime.strptime(to_date, "%d-%m-%Y").date()

        if from_date > to_date:
            raise serializers.ValidationError("The 'from date' must be earlier than the 'to date'.")

    @classmethod
    def validate_reversal_duplicate_dates(cls, employee_id, from_date, to_date, exclude_instance=None):
        """Validate the provided leave dates to ensure they do not overlap with previously applied leave dates."""
        existing_leaves = LeaveReversalRequest.objects.filter(employee=employee_id, is_active=True,
                                                    approval_status__in=['PENDING_APPROVAL', 'APPROVED']).all()
        if exclude_instance:
            existing_leaves = existing_leaves.exclude(id=exclude_instance.id)
        for leave in existing_leaves:
            leave_from_date = leave.reverse_from_date
            leave_to_date = leave.reverse_to_date
            current_date = from_date
            while current_date <= to_date:
                if (current_date >= leave_from_date and current_date <= leave_to_date):
                    formatted_from_date = leave_from_date.strftime('%d-%m-%Y')
                    formatted_to_date = leave_to_date.strftime('%d-%m-%Y')
                    formatted_date = current_date.strftime('%d-%m-%Y')
                    raise serializers.ValidationError(
                        f"Provided leave date({formatted_date})is overlapping with already applied leaves from {formatted_from_date} to {formatted_to_date})")
                current_date += timedelta(days=1)

    @classmethod
    def validate_grade_master(cls, grade_code, grade_description, b_id, exclude_instance=None):
        grade = Grade.objects.filter(b_id=b_id, is_active=True).all()
        if exclude_instance:
            grade = grade.exclude(id=exclude_instance.id)
        for i in grade:
            old_grade_code = i.grade_code
            old_grade_description = i.grade_description
            ogc = old_grade_code.replace(" ", "").lower()
            ogd = old_grade_description.replace(" ", "").lower()
            gc = grade_code.replace(" ", "").lower()
            gd = grade_description.replace(" ", "").lower()
            if ogc == gc and ogd == gd:
                raise serializers.ValidationError("Provided grade code and grade description already in use")

    @classmethod
    def get_days_in_month(cls, from_date, to_date, employee):
        import json as _json
        raw_weekly_off = employee.weekly_off or []
        if isinstance(raw_weekly_off, str):
            try:
                raw_weekly_off = _json.loads(raw_weekly_off)
            except Exception:
                raw_weekly_off = []
        weekly_off = [d.strip() for d in raw_weekly_off if isinstance(d, str) and len(d) > 2]
        parse = lambda d: datetime.strptime(d, "%Y-%m-%d").date() if isinstance(d, str) else d
        from_date, to_date = parse(from_date), parse(to_date)

        days = sum(
            1 for i in range((to_date - from_date).days + 1)
            if (from_date + timedelta(days=i)).strftime('%A') not in weekly_off
        )
        return days

    @classmethod
    def validate_leave_application_duplicate_dates(cls, employee_id, from_date, to_date, exclude_instance=None):
        """Validate the provided leave dates to ensure they do not overlap with previously applied leave dates."""
        existing_leaves = LeaveApplication.objects.filter(employee_code=employee_id, is_active=True,
                                                          approval_status__in=['PENDING_APPROVAL', 'APPROVED'])

        if exclude_instance:
            existing_leaves = existing_leaves.exclude(id=exclude_instance.id)
        print("existing_leaves", existing_leaves, employee_id, exclude_instance.id)
        for leave in existing_leaves:
            new_leave_start_date = leave.new_leave_start_date
            new_leave_end_date = leave.new_leave_end_date
            current_date = from_date
            while current_date <= to_date:
                if (current_date >= new_leave_start_date and current_date <= new_leave_end_date):
                    formatted_from_date = new_leave_start_date.strftime('%d-%m-%Y')
                    formatted_to_date = new_leave_end_date.strftime('%d-%m-%Y')
                    formatted_date = current_date.strftime('%d-%m-%Y')
                    raise serializers.ValidationError(
                        f"Provided leave date({formatted_date})is overlapping with already applied leaves from {formatted_from_date} to {formatted_to_date})")
                current_date += timedelta(days=1)


class MasterService:

    @classmethod
    def reset_password_employee(self, reset_employee, password, client):
        user_instance = []
        try:
            emp_obj = models.EmployeeMaster.objects.get(id=reset_employee)
            if emp_obj.user is not None:
                user_instance = emp_obj.user
                user_instance.password = make_password(password)
                print("user instance", password, emp_obj.user)
                user_instance.save()
                emp_obj.user_password = password
                emp_obj.save()

                # emailNotification = NotificationService()
                # emailNotification.send_user_created_email(to_mail=user_instance.email,
                #                                           username=user_instance.first_name,
                #                                           employee_code=emp_obj.employee_code,
                #                                           email_body=password)

                return user_instance.password
        except models.EmployeeMaster.DoesNotExist:
            print("Employee not found with ID:", reset_employee)
            return None


def get_leave_master_custom_excel(leave_master, data, header, export_fields, total_leave_details, calender_to):
    # Create a DataFrame from the provided data
    for item in data:
        # Create an OrderedDict to maintain order according to export_fields
        ordered_item = OrderedDict()

        # Iterate over export_fields
        for col in export_fields:
            # If the field is in the current item, add it to ordered_item
            if col in item:
                ordered_item[col] = item[col]
            else:
                ordered_item[col] = None  # or any default value if field is missing

        # Update item with ordered_item
        item.clear()
        item.update(ordered_item)

    df = pd.DataFrame(data)
    df.fillna(' ', inplace=True)
    df.replace('', ' ', inplace=True)

    # Define the report name
    report_name = f'{header}'

    # Create an in-memory Excel file buffer
    excel_file = io.BytesIO()

    # Create an Excel writer using XlsxWriter engine
    workbook = xlsxwriter.Workbook(excel_file)
    worksheet = workbook.add_worksheet('Sheet1')

    # Define header format
    header_format = workbook.add_format({
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'bg_color': '#2E80BA',
        'font_color': '#FFFFFF',
    })

    # Merge and write the report name as the header
    # head = df.columns
    # worksheet.merge_range(0, 0, 0, len(head) - 1, report_name, header_format)
    worksheet.write(0, 0, "Emp Code", header_format)
    worksheet.write(0, 1, "Name", header_format)
    worksheet.write(0, 2, "DOJ", header_format)
    worksheet.write(0, 3, "Calculation From", header_format)
    worksheet.write(0, 4, "Calculation To", header_format)
    # worksheet.write(0, 5, "Remarks", header_format)
    worksheet.merge_range(0, 5, 0, 8, 'Remarks', header_format)

    worksheet.write(1, 0, leave_master.employee.employee_code)
    worksheet.write(1, 1, leave_master.employee.first_name)
    worksheet.write(1, 2, (leave_master.employee.doj).strftime("%d-%b-%Y") if leave_master.employee.doj else "")
    worksheet.write(1, 3, (leave_master.employee.doj).strftime("%d-%b-%Y") if leave_master.employee.doj else "")
    worksheet.write(1, 4, calender_to)
    # worksheet.write(1, 5, "")
    worksheet.merge_range(1, 5, 1, 8, '')

    # Write column headers
    for col, header_name in enumerate(df.columns):
        if header_name in export_fields:
            title = export_fields[header_name]
            worksheet.write(3, col, title, header_format)

    # Write data rows
    last_row = 3
    for row, data_row in enumerate(df.values, start=4):
        for col, value in enumerate(data_row):
            if isinstance(value, list):
                value_str = ', '.join(map(str, value))
                worksheet.write(row, col, value_str)
            else:
                worksheet.write(row, col, value)
        last_row = row

    worksheet.write(last_row + 1, 0, "")
    worksheet.write(last_row + 1, 1, "Total")
    worksheet.write(last_row + 1, 2, "")
    worksheet.write(last_row + 1, 3, total_leave_details['total_opening_balance'])
    worksheet.write(last_row + 1, 4, total_leave_details['total_allocated_leaves'])
    worksheet.write(last_row + 1, 5, total_leave_details['total_utilized_leaves'])
    worksheet.write(last_row + 1, 6, total_leave_details['total_available_leaves'])
    worksheet.write(last_row + 1, 7, total_leave_details['total_carry_forward_days'])
    worksheet.write(last_row + 1, 8, total_leave_details['total_lapse_days'])

    # Close the workbook
    workbook.close()

    # Reset the buffer's position to the beginning
    excel_file.seek(0)

    # Prepare the HTTP response with the Excel file
    response = HttpResponse(content=excel_file,
                            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="report.xlsx"'
    return response


class EmployeeSalary:
    @classmethod
    def create_employee_salary_based_on_grade(cls, instance):
        from sequences import get_next_value
        seq = get_next_value('employee_salary_number', initial_value=1)
        document_number = f"ES{seq:06d}"
        # Create parent salary record
        employee_sal_obj = EmployeeMonthlySalary.objects.create(
            employee=instance,
            grade=instance.grade,
            b_id=instance.b_id,
            is_active=True,
            document_number=document_number,
            net_pay_monthly=round(instance.grade.gross_monthly_total - instance.grade.deduction_monthly_total),
            net_pay_yearly=round(instance.grade.gross_yearly_total - instance.grade.deduction_yearly_total),
            ctc=round(instance.grade.gross_yearly_total - instance.grade.deduction_yearly_total),
            approval_status='PENDING_APPROVAL',
        )
        instance.is_sal_created = True
        instance.save(update_fields=['is_sal_created'])

        # Create deductions linked to parent salary record
        for deduction in instance.grade.grade_gross_deductions.all():
            deduction_data = {
                'components': deduction.components,
                'monthly': deduction.monthly,
                'yearly': deduction.yearly,
                'grade_deduction': deduction,
                'gross_deductions': employee_sal_obj,
                'b_id': instance.b_id,
                'table_row_id': deduction.table_row_id if deduction.table_row_id else 0,
                'salary_component': deduction.salary_component if deduction.salary_component else None,
            }
            EmployeeMonthlyDeductionDetails.objects.create(**deduction_data)

        # Create earnings linked to parent salary record
        for earning in instance.grade.grade_gross_earnings.all():
            earning_data = {
                'components': earning.components,
                'monthly': earning.monthly,
                'yearly': earning.yearly,
                'grade_allowance': earning,
                'gross_earnings': employee_sal_obj,
                'b_id': instance.b_id,
                'table_row_id': earning.table_row_id if earning.table_row_id else 0,
                'salary_component': earning.salary_component if earning.salary_component else None,
            }
            EmployeeMonthlyAllowanceDetails.objects.create(**earning_data)

    @classmethod
    def update_employee_salary_based_on_grade(cls, instance, old_instance):
        # print("old_instance111", old_instance.grade, instance.grade, instance.grade != old_instance.grade)
        if instance.grade !=(old_instance.grade.id if old_instance.grade else None):
            if old_instance.grade is not None:
                EmployeeMonthlySalary.objects.filter(
                    employee=instance, employee__grade=old_instance.grade.id, b_id=instance.b_id
                ).update(is_active=False)
            employee_salary = EmployeeMonthlySalary.objects.filter(
                employee=instance, employee__grade=instance.grade.id, b_id=instance.b_id, is_active=False
            ).first()
            # print("employee_salary", employee_salary)
            if employee_salary:
                # Deactivate other active salary records
                EmployeeMonthlySalary.objects.filter(
                    employee=instance, is_active=True, b_id=instance.b_id
                ).exclude(id=employee_salary.id).update(is_active=False)

                # Activate this one
                employee_salary.is_active = True
                employee_salary.save()

                # Update or create deduction records
                for deduction in instance.grade.grade_gross_deductions.all():
                    EmployeeMonthlyDeductionDetails.objects.update_or_create(
                        gross_deductions=employee_salary,
                        grade_deduction=deduction,
                        defaults={
                            'table_row_id': deduction.table_row_id if deduction.table_row_id else 0,
                            'salary_component': deduction.salary_component if deduction.salary_component else None,
                            'components': deduction.components,
                            'monthly': deduction.monthly,
                            'yearly': deduction.yearly,
                        }
                    )

                # Update or create earning records
                for earning in instance.grade.grade_gross_earnings.all():
                    EmployeeMonthlyAllowanceDetails.objects.update_or_create(
                        gross_earnings=employee_salary,
                        grade_allowance=earning,
                        defaults={
                            'table_row_id': earning.table_row_id if earning.table_row_id else 0,
                            'salary_component': earning.salary_component if earning.salary_component else None,
                            'components': earning.components,
                            'monthly': earning.monthly,
                            'yearly': earning.yearly,
                        }
                    )

                # Update parent totals
                net_monthly = round(instance.grade.gross_monthly_total - instance.grade.deduction_monthly_total)
                net_yearly = round(instance.grade.gross_yearly_total - instance.grade.deduction_yearly_total)

                employee_salary.net_pay_monthly = net_monthly
                employee_salary.net_pay_yearly = net_yearly
                employee_salary.ctc = net_yearly
                employee_salary.save()
            else:
                cls.create_employee_salary_based_on_grade(instance)

