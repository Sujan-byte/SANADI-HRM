"""
Gratuity Router — reads branch config and delegates to the correct formula.

Usage:
    from hrm_main.api.gratuity.gratuity_router import calculate_gratuity
    result = calculate_gratuity(gratuity_form_instance)
"""

from django.utils import timezone
from django.db.models import Sum

from hrm_main.api.gratuity import uae_gratuity, india_gratuity


def _get_basic_salary(employee):
    """
    Fetch monthly basic salary from the latest approved EmployeeMonthlySalary record.

    Multiple salary records exist per employee due to increments — each with an
    effective_date. We pick the most-recent approved (or active) record so salary
    increments are correctly reflected in the gratuity calculation.
    """
    from hrm_main.models import EmployeeMonthlyAllowanceDetails, EmployeeMonthlySalary
    from django.utils import timezone

    today = timezone.now().date()

    # Latest approved salary record whose effective_date has passed
    latest_salary = (
        EmployeeMonthlySalary.objects
        .filter(
            employee=employee,
            approval_status='APPROVED',
            effective_date__lte=today,
        )
        .order_by('-effective_date', '-created')
        .first()
    )

    # Fallback: initial salary setup records have approval_status=None (no workflow).
    # Exclude PENDING_APPROVAL / REJECTED — only accept None (setup) or APPROVED.
    if not latest_salary:
        latest_salary = (
            EmployeeMonthlySalary.objects
            .filter(employee=employee)
            .exclude(approval_status__in=['PENDING_APPROVAL', 'REJECTED'])
            .order_by('-effective_date', '-created')
            .first()
        )

    if not latest_salary:
        return 0.0

    detail = EmployeeMonthlyAllowanceDetails.objects.filter(
        gross_earnings=latest_salary,
        components__icontains='Basic',
    ).first()

    return float(detail.monthly) if detail else 0.0


def _get_unpaid_leave_days_system(employee, b_id):
    """
    Count attendance days for this employee where the status maps to an
    is_paid=False AttendanceStatusMaster record.
    """
    from hrm_main.models import AttendanceStatusMaster, AttendanceDetails
    unpaid_codes = list(
        AttendanceStatusMaster.objects.filter(is_paid=False, b_id=b_id)
        .values_list('code', flat=True)
    )
    if not unpaid_codes:
        return 0
    return AttendanceDetails.objects.filter(
        employee_code=employee.employee_code,
        date__gte=employee.doj,
        status__in=unpaid_codes,
    ).count()


def _get_outstanding_advance(employee):
    """Sum of balance_loan_amount from approved Advance records."""
    from hrm_main.models import Advance
    from django.db.models import Sum
    total = Advance.objects.filter(
        employee=employee,
        approval_status='APPROVED',
        balance_loan_amount__gt=0,
    ).aggregate(total=Sum('balance_loan_amount'))['total']
    return float(total or 0)


def _get_advance_refs(employee):
    """Return comma-separated advance identifiers for the remark field."""
    from hrm_main.models import Advance
    advances = Advance.objects.filter(
        employee=employee,
        approval_status='APPROVED',
        balance_loan_amount__gt=0,
    ).values_list('id', flat=True)
    return ', '.join([f'ADV-{str(a)[:8]}' for a in advances])


def _get_branch_config(b_id):
    """Return (formula_type, apply_statutory_cap, cap_years) for the branch."""
    from branch.models import Branch
    branch = Branch.objects.filter(id=b_id).values(
        'gratuity_formula_type', 'gratuity_apply_statutory_cap', 'gratuity_cap_years'
    ).first()
    if branch:
        return (
            branch['gratuity_formula_type'],
            branch['gratuity_apply_statutory_cap'],
            float(branch['gratuity_cap_years'] or 2.0),
        )
    return 'UAE', True, 2.0   # safe defaults


def calculate_gratuity(gratuity_form):
    """
    Main entry point called by the view.

    gratuity_form : GratuityEmployeeForm instance (already saved with flags)

    Returns the raw calculator result dict PLUS saves updated fields back to
    the GratuityEmployeeForm instance.
    """
    employee = gratuity_form.employee
    b_id     = gratuity_form.b_id

    formula_type, branch_apply_cap, cap_years = _get_branch_config(b_id)

    # Per-employee override takes priority over branch setting
    # 'inherit' → use branch setting
    # 'on'      → force cap ON
    # 'off'     → force cap OFF (special contract)
    override = gratuity_form.override_statutory_cap or 'inherit'
    if override == 'on':
        apply_cap = True
    elif override == 'off':
        apply_cap = False
    else:  # 'inherit' or blank
        apply_cap = branch_apply_cap

    # ── Basic salary ─────────────────────────────────────────────────────────
    # If HR manually keyed in the salary, use it; otherwise auto-fetch from payroll
    if gratuity_form.basic_salary_manual_override and gratuity_form.present_basic_pay:
        basic_salary = float(gratuity_form.present_basic_pay)
    else:
        basic_salary = _get_basic_salary(employee)

    # ── End date ─────────────────────────────────────────────────────────────
    # Priority: gratuity_form.dor (HR-entered last working day) → employee.dor → today
    today = timezone.now().date()
    dor   = gratuity_form.dor or employee.dor
    end_date = dor if (dor and dor <= today) else today

    # ── Unpaid leave ─────────────────────────────────────────────────────────
    system_days = 0
    if gratuity_form.consider_auto_sync:
        system_days = _get_unpaid_leave_days_system(employee, b_id)

    gratuity_form.unpaid_leave_days_system = system_days
    gratuity_form.unpaid_leave_last_synced = today

    if gratuity_form.consider_unpaid_leave:
        total_unpaid = gratuity_form.unpaid_leave_days_manual + system_days
    else:
        total_unpaid = 0

    gratuity_form.unpaid_leave_days_total = total_unpaid

    # ── Debt deduction ───────────────────────────────────────────────────────
    if gratuity_form.consider_debt_deduction:
        debt = _get_outstanding_advance(employee)
        refs = _get_advance_refs(employee)
        gratuity_form.debt_deduction        = debt
        gratuity_form.debt_deduction_remark = refs
    else:
        debt = 0.0

    # ── Service start date ───────────────────────────────────────────────────
    # UAE Labour Law: gratuity accrues from date of confirmation (doc), NOT date
    # of joining (doj). The probationary period is excluded.
    # Priority: gratuity_form.doc (HR override) → employee.doc → employee.doj
    service_start_date = gratuity_form.doc or employee.doc or employee.doj

    # ── Run formula ──────────────────────────────────────────────────────────
    kwargs = dict(
        basic_salary        = basic_salary,
        doj                 = service_start_date,
        end_date            = end_date,
        unpaid_leave_days   = total_unpaid,
        apply_statutory_cap = apply_cap,
        cap_years           = cap_years,
        termination_reason  = gratuity_form.termination_reason or 'normal',
    )

    if formula_type == 'INDIA':
        result = india_gratuity.calculate(**kwargs)
    else:
        result = uae_gratuity.calculate(**kwargs)

    # ── Formula returned an eligibility error — save sync fields and return ──
    if result.get('error'):
        gratuity_form.save(update_fields=[
            'unpaid_leave_days_system',
            'unpaid_leave_days_total',
            'unpaid_leave_last_synced',
            'debt_deduction',
            'debt_deduction_remark',
        ])
        return result

    # ── Forfeiture ───────────────────────────────────────────────────────────
    gratuity_form.gratuity_forfeited = result.get('gratuity_forfeited', False)

    gross = result.get('total_gratuity_yearly', 0)

    # ── Pre-forfeiture gross (audit trail — store what it would have been) ───
    # Even for Article 54 the calculator returns early with gross=0, so we
    # recompute the would-be gross for audit purposes.
    if gratuity_form.gratuity_forfeited:
        # Run a shadow calculation without forfeiture to capture the pre-forfeiture value
        shadow_kwargs = dict(kwargs)
        shadow_kwargs['termination_reason'] = 'normal'
        if formula_type == 'INDIA':
            shadow = india_gratuity.calculate(**shadow_kwargs)
        else:
            shadow = uae_gratuity.calculate(**shadow_kwargs)
        gratuity_form.gross_gratuity_before_forfeiture = round(
            shadow.get('total_gratuity_yearly', 0), 2)
    else:
        gratuity_form.gross_gratuity_before_forfeiture = round(gross, 2)

    # ── Net payable ──────────────────────────────────────────────────────────
    net = max(gross - debt, 0) if not gratuity_form.gratuity_forfeited else 0
    gratuity_form.net_gratuity_payable = round(net, 2)

    # ── Residual employee debt (excess advance after gratuity offset) ────────
    gratuity_form.residual_employee_debt = round(max(debt - gross, 0), 2)

    # ── Service display in Y/M/D format ─────────────────────────────────────
    try:
        from dateutil.relativedelta import relativedelta as rdelta
        rd = rdelta(end_date, service_start_date)
        parts_display = []
        if rd.years:
            parts_display.append(f'{rd.years} yr{"s" if rd.years != 1 else ""}')
        if rd.months:
            parts_display.append(f'{rd.months} mo{"s" if rd.months != 1 else ""}')
        if rd.days:
            parts_display.append(f'{rd.days} day{"s" if rd.days != 1 else ""}')
        gratuity_form.service_years_display = ' '.join(parts_display) or '0 days'
    except Exception:
        gratuity_form.service_years_display = ''

    # ── Settlement due date (UAE Labour Law: DOR + 14 calendar days) ────────
    effective_dor = gratuity_form.dor or employee.dor
    if effective_dor:
        from datetime import timedelta
        gratuity_form.settlement_due_date = effective_dor + timedelta(days=14)
    else:
        gratuity_form.settlement_due_date = None

    # ── Status: advance to 'calculated' ──────────────────────────────────────
    if gratuity_form.status in ('draft', ''):
        gratuity_form.status = 'calculated'

    # ── Build human-readable calculation remarks ─────────────────────────────
    remarks_lines = []
    remarks_lines.append(f'Formula       : {formula_type}')
    remarks_lines.append(f'Basic Salary  : {basic_salary:,.2f}')
    if employee.doc:
        remarks_lines.append(f'Date of Join  : {employee.doj.strftime("%d-%m-%Y")} (Probation excluded)')
        remarks_lines.append(f'Date of Confirm: {employee.doc.strftime("%d-%m-%Y")} (Service start)')
    else:
        remarks_lines.append(f'Date of Join  : {employee.doj.strftime("%d-%m-%Y")}')
    remarks_lines.append(f'End Date      : {end_date.strftime("%d-%m-%Y")}')
    remarks_lines.append(f'Total Days    : {result.get("total_calendar_days", 0)}')

    if total_unpaid > 0:
        manual = gratuity_form.unpaid_leave_days_manual
        system_d = gratuity_form.unpaid_leave_days_system
        remarks_lines.append(f'Unpaid Leave  : {total_unpaid} days (Manual: {manual} + System: {system_d})')
        remarks_lines.append(f'Effective Days: {result.get("effective_days", 0)}')

    remarks_lines.append(f'Service Years : {result.get("effective_years", 0)} yrs')

    if result.get('gratuity_forfeited'):
        remarks_lines.append('Termination   : Article 54 — Gratuity FORFEITED')
    else:
        if formula_type == 'UAE':
            y5  = result.get('years_upto_5', 0)
            yb5 = result.get('years_beyond_5', 0)
            g5  = result.get('gratuity_upto_5', 0)
            gb5 = result.get('gratuity_beyond_5', 0)
            daily = basic_salary / 30
            remarks_lines.append(f'Daily Rate    : {basic_salary:,.2f} / 30 = {daily:,.4f}')
            if y5 > 0:
                remarks_lines.append(f'First 5 yrs   : {daily:,.4f} x 21 days x {y5:.4f} yrs = {g5:,.2f}')
            if yb5 > 0:
                remarks_lines.append(f'Beyond 5 yrs  : {daily:,.4f} x 30 days x {yb5:.4f} yrs = {gb5:,.2f}')
        else:
            sy = result.get('service_years_completed', 0)
            daily_india = basic_salary / 26
            remarks_lines.append(f'Daily Rate    : {basic_salary:,.2f} / 26 = {daily_india:,.4f}')
            remarks_lines.append(f'Formula       : {daily_india:,.4f} x 15 x {sy} yrs = {gross:,.2f}')

        remarks_lines.append(f'Gross Gratuity: {gross:,.2f}')

        cap_val = result.get('cap_value', 0)
        if apply_cap:
            remarks_lines.append(f'Cap           : {cap_years} yrs x {basic_salary:,.2f} x 12 = {cap_val:,.2f}')
            if result.get('cap_applied'):
                remarks_lines.append(f'Cap Applied   : YES — capped at {cap_val:,.2f}')
            else:
                remarks_lines.append(f'Cap Applied   : NO — gross ({gross:,.2f}) is under cap ({cap_val:,.2f})')
        else:
            remarks_lines.append('Cap           : DISABLED (override or branch setting)')

        if debt > 0:
            remarks_lines.append(f'Advance Deduct: {debt:,.2f} ({gratuity_form.debt_deduction_remark or ""})')

        remarks_lines.append(f'Net Payable   : {net:,.2f}')

        residual = gratuity_form.residual_employee_debt
        if residual > 0:
            remarks_lines.append(f'Residual Debt : {residual:,.2f} (employee owes beyond gratuity offset)')

    if gratuity_form.settlement_due_date:
        remarks_lines.append(f'Settle By     : {gratuity_form.settlement_due_date.strftime("%d-%m-%Y")} (DOR + 14 days)')

    calculation_remarks = '\n'.join(remarks_lines)
    gratuity_form.calculation_remarks = calculation_remarks

    # ── Persist computed values ──────────────────────────────────────────────
    gratuity_form.present_basic_pay      = basic_salary
    gratuity_form.service_years          = str(result.get('effective_years', 0))
    gratuity_form.total_gratuity_yearly  = gross
    gratuity_form.total_gratuity_monthly = result.get('total_gratuity_monthly', 0)

    gratuity_form.save(update_fields=[
        'present_basic_pay',
        'service_years',
        'service_years_display',
        'total_gratuity_yearly',
        'total_gratuity_monthly',
        'unpaid_leave_days_system',
        'unpaid_leave_days_total',
        'unpaid_leave_last_synced',
        'debt_deduction',
        'debt_deduction_remark',
        'net_gratuity_payable',
        'gratuity_forfeited',
        'gross_gratuity_before_forfeiture',
        'residual_employee_debt',
        'settlement_due_date',
        'status',
        'calculation_remarks',
    ])

    # Attach extra context for the response
    result['formula_type']                    = formula_type
    result['net_gratuity_payable']            = round(net, 2)
    result['debt_deduction']                  = round(debt, 2)
    result['debt_deduction_remark']           = gratuity_form.debt_deduction_remark or ''
    result['calculation_remarks']             = calculation_remarks
    result['service_years_display']           = gratuity_form.service_years_display or ''
    result['gross_gratuity_before_forfeiture']= gratuity_form.gross_gratuity_before_forfeiture
    result['residual_employee_debt']          = gratuity_form.residual_employee_debt
    result['settlement_due_date']             = (
        gratuity_form.settlement_due_date.strftime('%d-%m-%Y')
        if gratuity_form.settlement_due_date else ''
    )
    result['status']                          = gratuity_form.status

    return result
