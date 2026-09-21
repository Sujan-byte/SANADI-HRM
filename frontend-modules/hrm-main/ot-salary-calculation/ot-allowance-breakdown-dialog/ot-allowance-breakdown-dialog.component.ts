import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'sanadi-ot-allowance-breakdown-dialog',
  standalone: true,
  imports: [CommonModule, DecimalPipe, ButtonModule],
  template: `
    <div class="ab-wrap">

      <!-- ── Meta strip ─────────────────────────────────────────────── -->
      <div class="ab-meta">
        <div class="ab-meta-cell">
          <span class="ab-lbl">Employee</span>
          <span class="ab-val">{{ row?.employee_code }} {{ row?.first_name }} {{ row?.last_name }}</span>
        </div>
        <div class="ab-meta-cell">
          <span class="ab-lbl">Designation</span>
          <span class="ab-val">{{ row?.designation || '—' }}</span>
        </div>
        <div class="ab-meta-cell">
          <span class="ab-lbl">Department</span>
          <span class="ab-val">{{ row?.department || '—' }}</span>
        </div>
        <div class="ab-meta-cell" style="border-right:none">
          <span class="ab-lbl">Total OT Hours</span>
          <span class="ab-val">{{ row?.total_ot_hours | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- ── Breakdown table (only when allowance column is visible) ── -->
      <div class="ab-card" *ngIf="!allowanceHidden">
        <div class="ab-card-head">Allowance Breakdown</div>
        <table class="ab-tbl">
          <colgroup><col style="width:70%"><col style="width:30%"></colgroup>
          <thead>
            <tr>
              <th>Allowance Name</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of breakdown">
              <td>{{ b.name }}</td>
              <td class="num">{{ b.amount | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="!breakdown.length">
              <td colspan="2" class="ab-nil">No allowance breakdown available</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="tot-lbl">Total Allowance</td>
              <td class="num tot-val">{{ total | number:'1.2-2' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ── OT Summary ─────────────────────────────────────────────── -->
      <div class="ab-card">
        <div class="ab-card-head">OT Summary</div>
        <table class="ab-net-tbl">
          <tbody>
            <tr>
              <td class="nl">Gross Salary</td>
              <td class="nr">{{ row?.gross_salary | number:'1.2-2' }}</td>
            </tr>
            <tr>
              <td class="nl">Hourly Rate</td>
              <td class="nr">{{ row?.hourly_rate | number:'1.4-4' }}</td>
            </tr>
            <tr>
              <td class="nl">OT Hours</td>
              <td class="nr">{{ row?.total_ot_hours | number:'1.2-2' }}</td>
            </tr>
            <tr>
              <td class="nl">OT Amount</td>
              <td class="nr">{{ row?.ot_amount | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="!allowanceHidden">
              <td class="nl">Allowance</td>
              <td class="nr">{{ row?.allowance | number:'1.2-2' }}</td>
            </tr>
            <tr *ngIf="row?.deduction">
              <td class="nl">Deduction</td>
              <td class="nr">− {{ row?.deduction | number:'1.2-2' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="net-final-row">
              <td class="nl">Net OT Amount</td>
              <td class="nr">{{ row?.net_ot_amount | number:'1.2-2' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ── Footer ────────────────────────────────────────────────── -->
      <div class="ab-footer">
        <button pButton type="button" label="Close" icon="pi pi-times"
          class="p-button-sm p-button-text"
          (click)="close()">
        </button>
      </div>

    </div>
  `,
  styles: [`
    .ab-wrap {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-size: 11px;
      color: var(--text-color, #1a1a1a);
    }

    /* ── Meta strip ── */
    .ab-meta {
      display: flex;
      border: 1px solid var(--surface-border, #d4d4d4);
      border-radius: 4px;
      overflow: hidden;
      background: var(--surface-50, #fafafa);
    }
    .ab-meta-cell {
      display: flex;
      flex-direction: column;
      padding: 5px 10px;
      flex: 1;
      border-right: 1px solid var(--surface-border, #d4d4d4);
      min-width: 0;
    }
    .ab-lbl {
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color-secondary, #999);
      font-weight: 500;
      white-space: nowrap;
      margin-bottom: 1px;
    }
    .ab-val {
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Card ── */
    .ab-card {
      border: 1px solid var(--surface-border, #d4d4d4);
      border-radius: 4px;
      overflow: hidden;
    }
    .ab-card-head {
      background: var(--surface-100, #f4f4f4);
      border-bottom: 1px solid var(--surface-border, #d4d4d4);
      padding: 4px 10px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Tables ── */
    .ab-tbl {
      width: 100%;
      border-collapse: collapse;
    }
    .ab-tbl thead th {
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 600;
      color: var(--text-color-secondary, #666);
      background: var(--surface-0, #fff);
      border-bottom: 1px solid var(--surface-border, #e0e0e0);
      text-align: left;
    }
    .ab-tbl thead th.num { text-align: right; }
    .ab-tbl tbody td {
      padding: 4px 8px;
      font-size: 11px;
      border-bottom: 1px solid var(--surface-border, #ececec);
    }
    .ab-tbl tbody tr:last-child td { border-bottom: none; }
    .ab-tbl tfoot td {
      padding: 4px 8px;
      border-top: 1px solid var(--surface-border, #c8c8c8);
      background: var(--surface-50, #fafafa);
    }
    .num     { text-align: right; font-variant-numeric: tabular-nums; }
    .tot-lbl { font-size: 10px; font-weight: 700; }
    .tot-val { font-size: 10px; font-weight: 700; }
    .ab-nil  {
      text-align: center;
      color: var(--text-color-secondary, #999);
      font-style: italic;
      font-size: 10px;
      padding: 10px;
    }

    /* ── OT Summary table ── */
    .ab-net-tbl {
      width: 100%;
      border-collapse: collapse;
    }
    .ab-net-tbl tbody tr td { padding: 3px 10px; font-size: 11px; }
    .ab-net-tbl tbody tr:last-child td { border-bottom: 1px solid var(--surface-border, #e0e0e0); }
    .nl { color: var(--text-color-secondary, #555); width: 60%; }
    .nr { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .ab-net-tbl tfoot .net-final-row td {
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      background: var(--surface-50, #fafafa);
      border-top: 1px solid var(--surface-border, #c8c8c8);
    }
    .ab-net-tbl tfoot .net-final-row .nr { font-size: 12px; font-weight: 800; }

    /* ── Footer ── */
    .ab-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 4px;
      border-top: 1px solid var(--surface-border, #e0e0e0);
    }
  `],
})
export class OtAllowanceBreakdownDialogComponent implements OnInit {
  row: any;
  breakdown: { name: string; amount: number }[] = [];
  total = 0;
  allowanceHidden = false;

  constructor(
    private config: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit(): void {
    const dialogData = this.config?.data?.data ?? this.config?.data ?? {};
    this.row            = dialogData?.row || {};
    this.allowanceHidden = !!dialogData?.allowanceHidden;
    this.breakdown      = Array.isArray(this.row?.allowance_breakdown) ? this.row.allowance_breakdown : [];
    this.total          = this.breakdown.reduce((s, b) => s + (parseFloat(b.amount as any) || 0), 0);
  }

  close(): void {
    this.ref.close(null);
  }
}
