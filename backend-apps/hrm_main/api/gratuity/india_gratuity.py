"""
India Gratuity Calculator — Payment of Gratuity Act, 1972

Formula:
  - Rate     : 15 days basic salary per completed year of service
  - Divisor  : 26 working days
  - Rounding : fraction >= 6 months counts as a full year
  - Cap      : ₹20,00,000 (20 lakh) statutory maximum
  - Threshold: 5 years of continuous service (except death/disability)
"""

from datetime import date


def _completed_years(doj: date, end_date: date) -> int:
    """
    Completed years under Indian Gratuity Act:
    a fraction of a year >= 6 months is rounded up to the next full year.
    """
    from dateutil.relativedelta import relativedelta
    diff = relativedelta(end_date, doj)
    years  = diff.years
    months = diff.months
    days   = diff.days

    # Fraction >= 6 months counts as full year
    if months > 6 or (months == 6 and days >= 1):
        years += 1

    return max(years, 0)


def calculate(
    basic_salary: float,
    doj: date,
    end_date: date,
    unpaid_leave_days: int = 0,
    apply_statutory_cap: bool = True,
    cap_years: float = 2.0,
    termination_reason: str = 'normal',
) -> dict:
    """
    Returns a result dict with full breakdown.

    Args:
        basic_salary        : Last drawn basic salary (monthly)
        doj                 : Date of joining
        end_date            : Date of release / today
        unpaid_leave_days   : Unpaid leave days (deducted from service — India Act allows this)
        apply_statutory_cap : Whether to cap at ₹20 lakh
        termination_reason  : 'normal' | 'article_44' | 'article_54' (unused for India;
                              kept for interface consistency — India has no Article 54 concept)
    """

    # India statutory cap is fixed at ₹20 lakh by law.
    # cap_years param is accepted for interface consistency but not used here.
    INDIA_CAP = 2000000.0   # ₹20,00,000

    result = {
        'formula_type':            'INDIA',
        'basic_salary':            round(basic_salary, 2),
        'doj':                     doj.strftime('%d-%m-%Y'),
        'end_date':                end_date.strftime('%d-%m-%Y'),
        'unpaid_leave_days':       unpaid_leave_days,
        'gratuity_forfeited':      False,
        'cap_applied':             False,
        'cap_value':               INDIA_CAP,
        'total_calendar_days':     0,
        'effective_days':          0,
        'effective_years':         0,
        'service_years_completed': 0,
        'gross_gratuity':          0,
        'total_gratuity_yearly':   0,
        'total_gratuity_monthly':  0,
        'breakdown':               '',
        'error':                   '',
    }

    # +1 = inclusive of both start and end date (FRD Section 5.2 Ref C)
    total_calendar_days = (end_date - doj).days + 1
    result['total_calendar_days'] = total_calendar_days

    # ── Minimum 5-year threshold (standard termination) ─────────────────────
    if total_calendar_days < 365 * 5:
        result['error'] = 'Less than 5 years of service — not eligible for gratuity (India Act)'
        return result

    # ── Effective service after deducting unpaid leave ───────────────────────
    effective_days = max(total_calendar_days - unpaid_leave_days, 0)
    result['effective_days'] = effective_days

    # Recalculate end_date equivalent from effective days for year rounding
    from datetime import timedelta
    effective_end = doj + timedelta(days=effective_days)

    service_years = _completed_years(doj, effective_end)
    result['effective_years']         = round(effective_days / 365.0, 4)
    result['service_years_completed'] = service_years

    if service_years < 5:
        result['error'] = 'Effective service (after unpaid leave) less than 5 years'
        return result

    # ── Formula: (Basic / 26) × 15 × completed years ────────────────────────
    gross_gratuity = (basic_salary / 26.0) * 15 * service_years

    # ── Statutory cap: ₹20 lakh ──────────────────────────────────────────────
    if apply_statutory_cap and gross_gratuity > INDIA_CAP:
        gross_gratuity    = INDIA_CAP
        result['cap_applied'] = True

    result['gross_gratuity']         = round(gross_gratuity, 2)
    result['total_gratuity_yearly']  = round(gross_gratuity, 2)
    result['total_gratuity_monthly'] = round(gross_gratuity / 12, 2)

    # ── Breakdown ────────────────────────────────────────────────────────────
    parts = [
        f'({round(basic_salary, 2)} / 26) × 15 × {service_years} yrs = {round(gross_gratuity, 2)}'
    ]
    if result['cap_applied']:
        parts.append(f'Cap applied (₹{int(INDIA_CAP):,})')
    result['breakdown'] = ' | '.join(parts)

    return result
