import { Injectable, inject } from '@angular/core';
import { LocalCompServiceConfig } from 'src/app/modules/hrm-shared/core/shared/common/model/app.model';

@Injectable({ providedIn: 'root' })
export class SalaryIncrementService implements LocalCompServiceConfig {

  public readonly onSaveFormData = async (formData: any, _formFields?: any): Promise<any> => {
    if (!formData) return null;

    const earnings:   any[] = formData.earnings   ?? [];
    const deductions: any[] = formData.deductions ?? [];

    const gross_earnings = earnings.map((row: any) => ({
      id:         row.id,
      components: row.components,
      monthly:    Number(row.new_amount)        || 0,
      yearly:     (Number(row.new_amount) || 0) * 12,
    }));

    const gross_deductions = deductions.map((row: any) => ({
      id:         row.id,
      components: row.components,
      monthly:    Number(row.new_amount)        || 0,
      yearly:     (Number(row.new_amount) || 0) * 12,
    }));

    const new_gross         = gross_earnings.reduce((s: number, r: any) => s + (r.monthly || 0), 0);
    const deductions_total  = gross_deductions.reduce((s: number, r: any) => s + (r.monthly || 0), 0);
    const net_pay_monthly   = Math.round(new_gross - deductions_total);
    const net_pay_yearly    = net_pay_monthly * 12;

    return {
      ...formData,
      gross_earnings,
      gross_deductions,
      new_gross,
      net_pay_monthly,
      net_pay_yearly,
    };
  };
}
