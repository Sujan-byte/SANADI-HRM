"""
UAE Gratuity Calculator — MoHRE (Federal Decree-Law No. 33 of 2021)

Formula:
  - First 5 years of service : 21 days basic salary per year
  - Beyond 5 years           : 30 days basic salary per year (only the extra years)
  - Divisor                  : 30 calendar days
  - Pro-rata                 : decimal years based on actual days
  - Statutory cap            : 2 years' basic salary (24 months)
  - Minimum threshold        : 1 year of continuous service
  - Unpaid leave             : deducted from effective service period
  - Article 54               : full forfeiture
"""

from datetime import date


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
        unpaid_leave_days   : Total unpaid leave days to deduct
        apply_statutory_cap : Whether to cap at 2 years basic salary
        termination_reason  : 'normal' | 'article_44' | 'article_54'
    """

    result = {
        'formula_type':            'UAE',
        'basic_salary':            round(basic_salary, 2),
        'doj':                     doj.strftime('%d-%m-%Y'),
        'end_date':                end_date.strftime('%d-%m-%Y'),
        'unpaid_leave_days':       unpaid_leave_days,
        'gratuity_forfeited':      False,
        'cap_applied':             False,
        'cap_value':               0,
        'total_calendar_days':     0,
        'effective_days':          0,
        'effective_years':         0,
        'years_upto_5':            0,
        'years_beyond_5':          0,
        'gratuity_upto_5':         0,
        'gratuity_beyond_5':       0,
        'gross_gratuity':          0,
        'total_gratuity_yearly':   0,
        'total_gratuity_monthly':  0,
        'breakdown':               '',
        'error':                   '',
    }

    # ── Article 54 — full forfeiture ────────────────────────────────────────
    if termination_reason == 'article_54':
        result['gratuity_forfeited'] = True
        result['breakdown'] = 'Gratuity forfeited — terminated under Article 54 (Gross Misconduct)'
        return result

    # ── Minimum 1-year threshold ────────────────────────────────────────────
    # +1 = inclusive of both start and end date (FRD Section 5.2 Ref C)
    total_calendar_days = (end_date - doj).days + 1
    result['total_calendar_days'] = total_calendar_days

    if total_calendar_days < 365:
        result['error'] = 'Less than 1 year of service — not eligible for gratuity'
        return result

    # ── Effective service after deducting unpaid leave ───────────────────────
    effective_days = max(total_calendar_days - unpaid_leave_days, 0)
    result['effective_days'] = effective_days

    effective_years = effective_days / 365.0
    result['effective_years'] = round(effective_years, 4)

    if effective_years < 1:
        result['error'] = 'Effective service (after unpaid leave deduction) less than 1 year'
        return result

    # ── Daily rate ───────────────────────────────────────────────────────────
    daily_rate = basic_salary / 30.0

    # ── Split-tier calculation ───────────────────────────────────────────────
    if effective_years <= 5:
        years_upto_5   = effective_years
        years_beyond_5 = 0.0
    else:
        years_upto_5   = 5.0
        years_beyond_5 = effective_years - 5.0

    gratuity_upto_5   = daily_rate * 21 * years_upto_5
    gratuity_beyond_5 = daily_rate * 30 * years_beyond_5
    gross_gratuity    = gratuity_upto_5 + gratuity_beyond_5

    result['years_upto_5']    = round(years_upto_5, 4)
    result['years_beyond_5']  = round(years_beyond_5, 4)
    result['gratuity_upto_5'] = round(gratuity_upto_5, 2)
    result['gratuity_beyond_5'] = round(gratuity_beyond_5, 2)

    # ── Statutory cap: cap_years × 12 months of basic salary ────────────────
    cap_value = basic_salary * (cap_years * 12)
    result['cap_value'] = round(cap_value, 2)
    result['cap_years'] = cap_years

    if apply_statutory_cap and gross_gratuity > cap_value:
        gross_gratuity     = cap_value
        result['cap_applied'] = True

    result['gross_gratuity']         = round(gross_gratuity, 2)
    result['total_gratuity_yearly']  = round(gross_gratuity, 2)
    result['total_gratuity_monthly'] = round(gross_gratuity / 12, 2)

    # ── Human-readable breakdown ─────────────────────────────────────────────
    parts = []
    if years_upto_5 > 0:
        parts.append(f'{round(years_upto_5, 2)} yr(s) × 21 days = {round(gratuity_upto_5, 2)}')
    if years_beyond_5 > 0:
        parts.append(f'{round(years_beyond_5, 2)} yr(s) × 30 days = {round(gratuity_beyond_5, 2)}')
    if result['cap_applied']:
        parts.append(f'Cap applied (2yr basic = {round(cap_value, 2)})')
    result['breakdown'] = ' | '.join(parts)

    return result
