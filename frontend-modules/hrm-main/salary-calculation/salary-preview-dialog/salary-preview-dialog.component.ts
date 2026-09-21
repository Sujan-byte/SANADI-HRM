import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'sanadi-salary-preview-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule, ButtonModule, DecimalPipe, DropdownModule],
  template: `
    <div class="sp-wrap">

      <!-- ══ Meta strip ══════════════════════════════════════════════ -->
      <div class="sp-meta">
        <!-- Row 1: employee name spans full width -->
        <div class="sp-meta-row sp-meta-row-top">
          <div class="sp-meta-emp">
            <span class="sp-meta-lbl">Employee</span>
            <span class="sp-meta-val">{{ row?.employee_code }} {{ row?.first_name }} {{ row?.last_name }}</span>
          </div>
        </div>
        <!-- Row 2: four smaller fields -->
        <div class="sp-meta-row sp-meta-row-bot">
          <div class="sp-meta-cell">
            <span class="sp-meta-lbl">Department</span>
            <span class="sp-meta-val">{{ row?.department || '—' }}</span>
          </div>
          <div class="sp-meta-cell">
            <span class="sp-meta-lbl">Designation</span>
            <span class="sp-meta-val">{{ row?.designation || '—' }}</span>
          </div>
          <div class="sp-meta-cell">
            <span class="sp-meta-lbl">Period</span>
            <span class="sp-meta-val">{{ row?.from_date || '—' }} – {{ row?.to_date || '—' }}</span>
          </div>
          <div class="sp-meta-cell">
            <span class="sp-meta-lbl">Working Days</span>
            <span class="sp-meta-val">{{ row?.working_days ?? '—' }}</span>
          </div>
          <div class="sp-meta-cell" style="border-right:none">
            <span class="sp-meta-lbl">Payable Days</span>
            <span class="sp-meta-val">{{ row?.no_of_days ?? '—' }}</span>
          </div>
        </div>
      </div>

      <!-- ══ Earnings / Deductions side-by-side ═══════════════════════ -->
      <div class="sp-two-col">

        <!-- Earnings -->
        <div class="sp-card">
          <div class="sp-card-head">Earnings</div>
          <table class="sp-tbl">
            <colgroup><col style="width:65%"><col style="width:35%"></colgroup>
            <thead>
              <tr>
                <th>Component</th>
                <th class="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of allowances">
                <td>{{ a.component }}</td>
                <td class="num">{{ a.amount | number:'1.2-2' }}</td>
              </tr>
              <tr *ngIf="!allowances.length">
                <td colspan="2" class="sp-nil">No allowances — regenerate to populate</td>
              </tr>
              <tr *ngFor="let oa of otherAllowancesDetail">
                <td>{{ oa.name }}</td>
                <td class="num">{{ oa.amount | number:'1.2-2' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="tot-lbl">Gross Pay</td>
                <td class="num tot-val">{{ grossTotal | number:'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Deductions -->
        <div class="sp-card">
          <div class="sp-card-head">Deductions</div>
          <table class="sp-tbl">
            <colgroup><col style="width:65%"><col style="width:35%"></colgroup>
            <thead>
              <tr>
                <th>Component</th>
                <th class="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of allDeductions">
                <td>{{ d.component }}</td>
                <td class="num">{{ d.amount | number:'1.2-2' }}</td>
              </tr>
              <tr *ngIf="!allDeductions.length">
                <td colspan="2" class="sp-nil">No deductions</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="tot-lbl">Total Deductions</td>
                <td class="num tot-val">{{ deductionTotal | number:'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      <!-- ══ Attendance breakdown ════════════════════════════════════ -->
      <div class="sp-card">
        <div class="sp-card-head">
          Attendance &amp; Leave Breakdown
          <span class="sp-card-hint">Edit Pay % to adjust LOP for any status</span>
        </div>
        <table class="sp-tbl">
          <colgroup>
            <col style="width:20%">
            <col style="width:6%">
            <col style="width:8%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:12%">
            <col style="width:17%">
            <col style="width:17%">
          </colgroup>
          <thead>
            <tr>
              <th>Status</th>
              <th class="ctr">Days</th>
              <th class="ctr">Paid?</th>
              <th class="ctr">Pay %</th>
              <th class="ctr">Applies On</th>
              <th class="num">Daily Rate</th>
              <th class="num">Earned</th>
              <th class="num">Deduction</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let att of attendance">
              <td>{{ att.status_name }}</td>
              <td class="ctr">{{ att.days }}</td>
              <td class="ctr">
                <span class="sp-tag" [class.tag-paid]="att.is_paid" [class.tag-unpaid]="!att.is_paid">
                  {{ att.is_paid ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td class="ctr">
                <p-inputNumber
                  [(ngModel)]="att.pay_percentage"
                  [min]="0" [max]="100"
                  [disabled]="!att.is_paid"
                  [showButtons]="false"
                  suffix="%"
                  inputStyleClass="pct-inp"
                  (onInput)="onPayPctChange(att)">
                </p-inputNumber>
              </td>
              <td class="ctr">
                <p-dropdown *ngIf="att.is_paid"
                  [(ngModel)]="att.pay_on"
                  [options]="payOnOptions"
                  optionLabel="label"
                  optionValue="value"
                  [style]="{'height':'24px','width':'70px','font-size':'10px'}"
                  [panelStyle]="{'font-size':'10px','min-width':'70px'}"
                  (onChange)="onPayOnChange(att)">
                </p-dropdown>
                <span *ngIf="!att.is_paid" class="sp-pay-on-nil">—</span>
              </td>
              <td class="num">{{ getDisplayRate(att) | number:'1.2-2' }}</td>
              <td class="num">{{ getEarned(att) | number:'1.2-2' }}</td>
              <td class="num">{{ att.lop_contribution | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="!attendance.length">
              <td colspan="8" class="sp-nil">No attendance data — regenerate salary to populate</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="tot-lbl">Total</td>
              <td class="ctr tot-val">{{ totalDays }}</td>
              <td></td><td></td><td></td><td></td>
              <td class="num tot-val">{{ earnedTotal | number:'1.2-2' }}</td>
              <td class="num tot-val">{{ lopTotal | number:'1.2-2' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ══ Net pay summary ════════════════════════════════════════ -->
      <div class="sp-card">
        <div class="sp-card-head">Net Pay Summary</div>
        <table class="sp-net-tbl">
          <tbody>
            <tr>
              <td class="nl">Gross Pay</td>
              <td class="nr">{{ grossTotal | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="lopTotal">
              <td class="nl">Deduction</td>
              <td class="nr">− {{ lopTotal | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="attendance.length">
              <td class="nl">Total Earned</td>
              <td class="nr">{{ earnedTotal | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="otherDeductionsTotal">
              <td class="nl">Other Deductions</td>
              <td class="nr">− {{ otherDeductionsTotal | number:'1.2-2' }}</td>
            </tr>
            <tr *ngFor="let oa of otherAllowancesDetail">
              <td class="nl">{{ oa.name }}</td>
              <td class="nr">+ {{ oa.amount | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="isColVisible('ot') && +row?.ot">
              <td class="nl">OT Amount</td>
              <td class="nr">+ {{ (summary?.ot_amount || row?.ot || 0) | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="isColVisible('bonus') && +row?.bonus">
              <td class="nl">Bonus</td>
              <td class="nr">+ {{ (summary?.bonus || row?.bonus || 0) | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="isColVisible('advance_emi') && +row?.advance_emi">
              <td class="nl">Advance EMI</td>
              <td class="nr">− {{ row.advance_emi | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="isColVisible('arrears') && +row?.arrears">
              <td class="nl">Arrears</td>
              <td class="nr">+ {{ row.arrears | number:'1.2-2' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="net-final-row">
              <td class="nl">Net Pay</td>
              <td class="nr">{{ computedNetPay | number:'1.2-2' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ══ Footer ════════════════════════════════════════════════════ -->
      <div class="sp-footer">
        <button pButton type="button" label="Apply Changes" icon="pi pi-check"
          class="p-button-sm p-button-primary"
          (click)="applyChanges()">
        </button>
        <button pButton type="button" label="Close" icon="pi pi-times"
          class="p-button-sm p-button-text"
          (click)="closeDialog()">
        </button>
      </div>

    </div>
  `,
  styles: [`
    /* ── Wrapper ── */
    .sp-wrap {
      padding: 10px 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-family: inherit;
      font-size: 11px;
      color: var(--text-color, #1a1a1a);
    }

    /* ── Meta strip ── */
    .sp-meta {
      border: 1px solid var(--surface-border, #d4d4d4);
      border-radius: 4px;
      overflow: hidden;
      background: var(--surface-50, #fafafa);
    }
    .sp-meta-row {
      display: flex;
    }
    .sp-meta-row-top {
      border-bottom: 1px solid var(--surface-border, #d4d4d4);
    }
    .sp-meta-emp {
      display: flex;
      flex-direction: column;
      padding: 5px 10px;
      width: 100%;
    }
    .sp-meta-row-bot .sp-meta-cell {
      display: flex;
      flex-direction: column;
      padding: 4px 10px;
      flex: 1;
      border-right: 1px solid var(--surface-border, #d4d4d4);
      min-width: 0;
    }
    .sp-meta-lbl {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color-secondary, #999);
      margin-bottom: 1px;
      font-weight: 500;
      white-space: nowrap;
    }
    .sp-meta-val {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-color, #1a1a1a);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Two-column layout ── */
    .sp-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }

    /* ── Card ── */
    .sp-card {
      border: 1px solid var(--surface-border, #d4d4d4);
      border-radius: 4px;
      overflow: hidden;
    }
    .sp-card-head {
      background: var(--surface-100, #f4f4f4);
      border-bottom: 1px solid var(--surface-border, #d4d4d4);
      padding: 4px 10px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color, #1a1a1a);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sp-card-hint {
      font-size: 8px;
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: var(--text-color-secondary, #999);
    }

    /* ── Tables ── */
    .sp-tbl {
      width: 100%;
      border-collapse: collapse;
    }
    .sp-tbl thead th {
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 600;
      color: var(--text-color-secondary, #666);
      background: var(--surface-0, #fff);
      border-bottom: 1px solid var(--surface-border, #e0e0e0);
      text-align: left;
      white-space: nowrap;
    }
    .sp-tbl thead th.num { text-align: right; }
    .sp-tbl thead th.ctr { text-align: center; }
    .sp-tbl tbody td {
      padding: 4px 8px;
      font-size: 11px;
      border-bottom: 1px solid var(--surface-border, #ececec);
      color: var(--text-color, #1a1a1a);
    }
    .sp-tbl tbody tr:last-child td { border-bottom: none; }
    .sp-tbl tfoot td {
      padding: 4px 8px;
      border-top: 1px solid var(--surface-border, #c8c8c8);
      background: var(--surface-50, #fafafa);
    }
    .num  { text-align: right; font-variant-numeric: tabular-nums; }
    .ctr  { text-align: center; }
    .tot-lbl { font-size: 10px; font-weight: 700; }
    .tot-val { font-size: 10px; font-weight: 700; }
    .sp-nil  {
      text-align: center;
      color: var(--text-color-secondary, #999);
      font-style: italic;
      font-size: 10px;
      padding: 8px;
    }

    /* ── Status tag ── */
    .sp-tag {
      display: inline-block;
      font-size: 8px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 2px;
      border: 1px solid #ccc;
      background: #f0f0f0;
      color: #555;
    }
    .tag-paid   { background: #f0f7f0; border-color: #a5c8a5; color: #2b5c2b; }
    .tag-unpaid { background: #fdf2f2; border-color: #c8a5a5; color: #6b2020; }

    /* ── Applies On dropdown — match Pay % input size ── */
    :host ::ng-deep td p-dropdown .p-dropdown {
      height: 24px !important;
      min-width: unset !important;
      border-radius: 4px !important;
    }
    :host ::ng-deep td p-dropdown .p-dropdown .p-dropdown-label {
      padding: 3px 4px !important;
      font-size: 10px !important;
      line-height: 18px !important;
    }
    :host ::ng-deep td p-dropdown .p-dropdown .p-dropdown-trigger {
      width: 20px !important;
    }
    :host ::ng-deep td p-dropdown .p-dropdown .p-dropdown-trigger .p-dropdown-trigger-icon {
      font-size: 9px !important;
    }
    .sp-pay-on-nil {
      color: var(--text-color-secondary, #aaa);
    }

    /* ── Pay % input ── */
    :host ::ng-deep .pct-inp {
      width: 54px !important;
      text-align: center !important;
      font-size: 10px !important;
      padding: 2px 4px !important;
    }

    /* ── Net pay summary table ── */
    .sp-net-tbl {
      width: 100%;
      border-collapse: collapse;
    }
    .sp-net-tbl tbody tr td { padding: 3px 10px; font-size: 11px; }
    .sp-net-tbl tbody tr:last-child td { border-bottom: 1px solid var(--surface-border, #e0e0e0); }
    .nl { color: var(--text-color-secondary, #555); width: 55%; }
    .nr { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .sp-net-tbl tfoot .net-final-row td {
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      background: var(--surface-50, #fafafa);
      border-top: 1px solid var(--surface-border, #c8c8c8);
    }
    .sp-net-tbl tfoot .net-final-row .nr { font-size: 12px; font-weight: 800; }

    /* ── Footer ── */
    .sp-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding-top: 4px;
      border-top: 1px solid var(--surface-border, #e0e0e0);
    }
  `],
})
export class SalaryPreviewDialogComponent implements OnInit {

  row: any;
  allowances:  any[] = [];
  deductions:  any[] = [];
  attendance:  any[] = [];
  summary:     any   = {};

  isDirty = false;

  /** Selected columns set — used to control which Net Pay Summary rows to show */
  selectedCols: Set<string> = new Set();

  /** Individual allowance assignments active for this employee's period.
   *  Each entry: { name: string, amount: number }
   *  Populated from row.other_allowances_detail passed via dialogData. */
  otherAllowancesDetail: { name: string; amount: number }[] = [];

  readonly payOnOptions = [
    { label: 'Gross', value: 'gross' },
    { label: 'Basic', value: 'basic' },
  ];

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit(): void {
    // custom-dialog.ts wraps the third arg as: { config, customDialog, data: <arg> }
    // so the row lives at config.data.data.row
    const dialogData = this.config?.data?.data ?? this.config?.data ?? {};
    this.row = { ...(dialogData?.row || {}) };
    // selectedColumns from the payroll register — controls which Net Pay Summary rows to show
    const selCols: string[] = dialogData?.selectedColumns || [];
    this.selectedCols = selCols.length ? new Set(selCols) : new Set();
    const otherAllowancesVisible = !selCols.length || this.selectedCols.has('other_allowances');
    this.otherAllowancesDetail = otherAllowancesVisible && Array.isArray(this.row.other_allowances_detail)
      ? this.row.other_allowances_detail
      : [];
    const bd = this.row?.salary_breakdown || {};

    // ── Allowances ───────────────────────────────────────────────────────────
    if (bd.allowances?.length) {
      this.allowances = bd.allowances;
    } else {
      this.allowances = this.dictToList(this.row?.allowance_details);
    }

    // ── Attendance ───────────────────────────────────────────────────────────
    this.attendance = (bd.attendance || []).map((a: any) => ({ ...a }));

    // ── Deductions (excl LOP & advance_emi — computed live) ──────────────────
    const rawDeductions = bd.deductions?.length
      ? bd.deductions.filter((d: any) => !String(d.component || '').startsWith('LOP') && d.component !== 'Advance EMI')
      : this.dictToList(this.row?.deduction_details);
    this.deductions = rawDeductions;

    this.summary = bd.summary || {};
  }

  /** Convert {component: amount} dict → [{component, amount}] list */
  private dictToList(dict: any): any[] {
    if (!dict) return [];
    if (Array.isArray(dict)) return dict;
    if (typeof dict === 'string') {
      try { dict = JSON.parse(dict); } catch { return []; }
    }
    return Object.entries(dict).map(([component, amount]) => ({
      component,
      amount: parseFloat(amount as any) || 0,
    }));
  }

  // ── Computed getters ─────────────────────────────────────────────────────

  get grossTotal(): number {
    if (this.allowances.length) {
      return this.allowances.reduce((s: number, a: any) => s + (parseFloat(a.amount) || 0), 0);
    }
    return parseFloat(this.row?.base_gross_amount) || parseFloat(this.row?.gross_pay) || 0;
  }

  get lopTotal(): number {
    if (this.attendance.length) {
      return Math.round(
        this.attendance.reduce((s: number, a: any) => s + (parseFloat(a.lop_contribution) || 0), 0)
      );
    }
    return parseFloat(this.row?.lop_amount) || 0;
  }

  get otherDeductionsTotal(): number {
    return this.deductions.reduce((s: number, d: any) => s + (parseFloat(d.amount) || 0), 0);
  }

  get deductionTotal(): number {
    return this.otherDeductionsTotal + this.lopTotal + (parseFloat(this.row?.advance_emi) || 0);
  }

  get allDeductions(): any[] {
    const list = [...this.deductions];
    const lop = this.lopTotal;
    if (lop) {
      const lopDays = this.attendance
        .filter((a: any) => !a.is_paid || a.pay_percentage < 100)
        .reduce((s: number, a: any) => s + (parseInt(a.days) || 0), 0);
      list.push({
        component: lopDays ? `LOP (${lopDays} day${lopDays !== 1 ? 's' : ''})` : 'LOP',
        amount: lop,
      });
    }
    const emi = parseFloat(this.row?.advance_emi) || 0;
    if (emi) list.push({ component: 'Advance EMI', amount: emi });
    return list;
  }

  get totalDays(): number {
    return this.attendance.reduce((s: number, a: any) => s + (parseInt(a.days) || 0), 0);
  }

  /** Daily rate to display — basic rate when pay_on=basic, else gross */
  getDisplayRate(att: any): number {
    if (att.is_paid && att.pay_on === 'basic' && att.basic_daily_rate) {
      return parseFloat(att.basic_daily_rate);
    }
    return parseFloat(att.daily_rate) || 0;
  }

  /** Earned = applicable_daily_rate × days × pay% / 100
   *  Uses basic rate when pay_on=basic, gross otherwise.
   */
  getEarned(att: any): number {
    const rate = this.getDisplayRate(att);
    const days = parseInt(att.days) || 0;
    const pct  = parseFloat(att.pay_percentage) ?? 100;
    return Math.round(rate * days * (pct / 100) * 100) / 100;
  }

  get earnedTotal(): number {
    return Math.round(this.attendance.reduce((s: number, a: any) => s + this.getEarned(a), 0) * 100) / 100;
  }

  get otherAllowancesTotal(): number {
    return this.otherAllowancesDetail.reduce((s, oa) => s + (parseFloat(oa.amount as any) || 0), 0);
  }

  get computedNetPay(): number {
    const ot      = this.isColVisible('ot')          ? (parseFloat(this.summary?.ot_amount) || parseFloat(this.row?.ot)    || 0) : 0;
    const bonus   = this.isColVisible('bonus')       ? (parseFloat(this.summary?.bonus)     || parseFloat(this.row?.bonus) || 0) : 0;
    const arrears = this.isColVisible('arrears')     ? (parseFloat(this.row?.arrears)       || 0) : 0;
    const advEmi  = this.isColVisible('advance_emi') ? (parseFloat(this.row?.advance_emi)   || 0) : 0;
    const base    = this.grossTotal - this.lopTotal;
    return Math.round(Math.max(0, base) + this.otherAllowancesTotal + ot + bonus - this.otherDeductionsTotal - advEmi + arrears);
  }

  // ── Pay % / Applies On edit ──────────────────────────────────────────────

  private recomputeLop(att: any): void {
    const pct       = Math.min(100, Math.max(0, parseFloat(att.pay_percentage) || 0));
    const days      = parseInt(att.days) || 0;
    const grossRate = parseFloat(att.daily_rate) || 0;
    const basicRate = parseFloat(att.basic_daily_rate) || grossRate;

    let lop: number;
    if (att.pay_on === 'basic') {
      // Deduction = gross_days_value - (basic × pay%)
      const paidAmount = basicRate * days * (pct / 100);
      lop = grossRate * days - paidAmount;
    } else {
      // Gets pct% of Gross
      lop = grossRate * days * (1 - pct / 100);
    }
    att.lop_contribution = Math.round(Math.max(0, lop) * 100) / 100;
    this.isDirty = true;
    const newLop = this.lopTotal;
    if (this.row) {
      this.row.lop_amount = newLop;
      if (this.row.salary_breakdown) {
        this.row.salary_breakdown.attendance = this.attendance;
        if (this.row.salary_breakdown.summary) {
          this.row.salary_breakdown.summary.lop_amount = newLop;
        }
      }
    }
  }

  onPayPctChange(att: any): void {
    att.pay_percentage = Math.min(100, Math.max(0, parseFloat(att.pay_percentage) || 0));
    this.recomputeLop(att);
  }

  onPayOnChange(att: any): void {
    this.recomputeLop(att);
  }

  /** Apply — close dialog and return the updated row so the table row is patched */
  applyChanges(): void {
    const newLop    = this.lopTotal;
    const newNetPay = this.computedNetPay;

    const otherAllowancesTotal = this.otherAllowancesTotal;
    // Patch the row object with recomputed values
    const updated = {
      ...this.row,
      lop_amount:               newLop,
      net_pay:                  newNetPay,
      other_allowances:         otherAllowancesTotal,
      other_allowances_detail:  this.otherAllowancesDetail,
      earned:                   Math.max(0, this.grossTotal - newLop + otherAllowancesTotal),
      salary_breakdown:  {
        ...(this.row?.salary_breakdown || {}),
        attendance: this.attendance,
        summary: {
          ...(this.row?.salary_breakdown?.summary || {}),
          lop_amount:              newLop,
          net_pay:                 newNetPay,
          other_allowances:        otherAllowancesTotal,
          other_allowances_detail: this.otherAllowancesDetail,
        },
      },
    };

    this.ref.close(updated);
  }

  /** Returns true if the column is selected (or no column filter is active) */
  isColVisible(col: string): boolean {
    return !this.selectedCols.size || this.selectedCols.has(col);
  }

  /** Close without applying */
  closeDialog(): void {
    this.ref.close(null);
  }
}
