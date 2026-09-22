import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { decimalDigits } from 'src/app/modules/hrm-shared/core/shared/utils/common.constants';
import { currency } from 'src/app/modules/hrm-shared/core/shared/utils/currency-master';
import { PostingPreviewService } from './posting-preview.service';
import { PostingPreviewCurrencyTotals, PostingPreviewResponse } from './posting-preview.model';

/**
 * Standalone preview of a voucher's accounting entries - either the live
 * PostingPreviewMaster rows (before the voucher is posted) or the actual
 * TallyLedgerDetails rows (once it is), decided entirely by the backend and
 * surfaced here via `dataSource`. Takes only `from_type`/`from_id` and fetches
 * its own data, so it can be dropped into a voucher tab, a dashboard tile, a
 * report, or a standalone page without modification.
 */
@Component({
  selector: 'sanadi-posting-preview',
  standalone: true,
  imports: [CommonModule, TableModule],
  providers: [DecimalPipe],
  templateUrl: './posting-preview.component.html',
  styleUrl: './posting-preview.component.scss',
})
export class PostingPreviewComponent implements OnChanges {
  @Input() from_type!: string;
  @Input() from_id!: number;
  @Input() title = 'Posting Preview';
  @Input() subtitle = 'Preview of posting entries in transaction and base currencies';

  private readonly postingPreviewService = inject(PostingPreviewService);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<PostingPreviewResponse | null>(null);
  readonly exporting = signal(false);

  get amountFormat(): string {
    const digits = decimalDigits() ?? 2;
    return `1.${digits}-${digits}`;
  }

  get sameCurrency(): boolean {
    const d = this.data();
    return !!d && !!d.transaction_currency && d.transaction_currency === d.base_currency;
  }

  currencyName(code: string | undefined | null): string {
    return currency.find(c => c.currency_code === code)?.currency_name || '';
  }

  difference(totals: PostingPreviewCurrencyTotals | undefined | null): number {
    return Math.abs((totals?.total_debit || 0) - (totals?.total_credit || 0));
  }

  differenceDisplay(totals: PostingPreviewCurrencyTotals | undefined | null): string {
    const diff = this.difference(totals);
    if (diff === 0) {
      return '-';
    }
    return this.decimalPipe.transform(diff, this.amountFormat) || '-';
  }

  higherSide(totals: PostingPreviewCurrencyTotals | undefined | null): string {
    if (!totals || totals.total_debit === totals.total_credit) {
      return '-';
    }
    return totals.total_debit > totals.total_credit ? 'Debit' : 'Credit';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['from_type'] || changes['from_id']) {
      this.load();
    }
  }

  async load(): Promise<void> {
    if (!this.from_type || !this.from_id) {
      this.data.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.postingPreviewService.getPostingPreview(this.from_type, this.from_id);
      this.data.set(response);
    } catch {
      this.error.set('Could not load the posting preview for this record.');
      this.data.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async exportPdf(): Promise<void> {
    if (!this.from_type || !this.from_id || this.exporting()) {
      return;
    }
    this.exporting.set(true);
    try {
      await this.postingPreviewService.exportPdf(this.from_type, this.from_id, this.data()?.vch_no);
    } finally {
      this.exporting.set(false);
    }
  }
}
