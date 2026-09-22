import { AfterViewInit, Component, inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { EncryptedStorageService } from 'src/app/modules/hrm-shared/core/shared/services/secure-cookie-service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, pairwise, startWith } from 'rxjs/operators';
import { OverlayPanel } from 'primeng/overlaypanel';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'sanadi-currency-form',
  templateUrl: './currency-form.component.html',
  styleUrl: './currency-form.component.scss'
})
export class CurrencyFormComponent implements AfterViewInit, OnDestroy {
  @Input() field: any;
  @Input() form: any;
  @Input() formFields: any[] = [];
  @ViewChild('editOverlay') editOverlay!: OverlayPanel;

  private readonly apiService = inject(ApiService);
  private readonly secureStorage = inject(EncryptedStorageService);
  private readonly datePipe = inject(DatePipe);
  private targetCurrencySubscription?: Subscription;
  private exchangeRateDateSubscription?: Subscription;
  public _spinner = inject(NgxSpinnerService);

  baseCurrency: string = '';
  manualExchangeRate: number = 0;
  isManuallySet: boolean = false;


  ngOnInit(): void {
    this.onValueChanges();
  }

  get exchangeRate(): number {
    return this.field?.exchangeRate || 0;
  }

  get targetCurrency(): string {
    const targetCurrencyValue = this.form?.get(this.field?.targetCurrencyField)?.value || this.field?.targetCurrency;
    if (targetCurrencyValue && typeof targetCurrencyValue === 'object') {
      return targetCurrencyValue.name || targetCurrencyValue.code || targetCurrencyValue.id || '';
    }
    return targetCurrencyValue || '';
  }

  get exchangeRateDate(): string {
    const dateValue = this.form?.get(this.field?.exchangeRateDateField)?.value
      || this.field?.exchangeRateDate;
    if (!dateValue) return 'creation';

    if (dateValue instanceof Date) {
      return this.datePipe.transform(dateValue, 'dd-MM-yyyy') || 'creation';
    }

    const parts = dateValue.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`; // already dd-MM-yyyy
    }

    return dateValue; // fallback
  }




  get externalLinkUrl(): string {
    return this.field?.externalLinkUrl || 'https://www.centralbank.ae/en/forex-eibor/exchange-rates/'; // need to take from branch app config
  }

  get useInverseRate(): boolean {
    return this.field?.useInverseRate === true;
  }

  get exchangeRateText(): string {
    if (this.exchangeRate > 0) {
      this.useInverseRate
      return this.useInverseRate ? `1 ${this.targetCurrency} = ${this.exchangeRate} ${this.baseCurrency}` : `1 ${this.baseCurrency} = ${this.exchangeRate} ${this.targetCurrency}`;
    }
    return '';
  }

  get shouldShowComponent(): boolean {
    const targetCurrencyCode = this.getTargetCurrencyCode();
    const baseCurrencyCode = (this.baseCurrency || '').toString().toUpperCase();

    if (!targetCurrencyCode || targetCurrencyCode.trim() === '') {
      return false;
    }

    if (targetCurrencyCode === baseCurrencyCode) {
      return false;
    }

    return true;
  }

  async ngAfterViewInit(): Promise<void> {
    await this.setBaseCurrency();
    this.isManuallySet = this.field?.isManuallySet || false;
    if (!this.isManuallySet) {
      this.getRateBasedOnDate(true);
    }
    this.subscribeToTargetCurrencyChanges();
    this.subscribeToExchangeRateDateChanges();
  }

  ngOnDestroy(): void {
    this.targetCurrencySubscription?.unsubscribe();
    this.exchangeRateDateSubscription?.unsubscribe();
  }

  private async setBaseCurrency(): Promise<void> {
    const branchAppConfig: any = await this.secureStorage.getItem('branchAppConfig');
    this.baseCurrency = branchAppConfig?.currency || '';
  }

  private getTargetCurrencyCode(): string {
    const targetCurrencyValue = this.form?.get(this.field?.targetCurrencyField)?.value || this.field?.targetCurrency;
    if (!targetCurrencyValue) return '';

    if (typeof targetCurrencyValue === 'object') {
      return (targetCurrencyValue.name || targetCurrencyValue.code || targetCurrencyValue.id || '').toString().toUpperCase();
    }
    return targetCurrencyValue.toString().toUpperCase();
  }

  private formatDateForAPI(dateValue: any): string {
    if (!dateValue) return 'creation';
    let date: Date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return dateValue.toString();
      }
    }

    return this.datePipe.transform(date, 'dd-MM-yyyy') || dateValue.toString();
  }

  onEditClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.manualExchangeRate = this.exchangeRate || 0;
    this.editOverlay.toggle(event);
  }

  async onApplyManualRate(): Promise<void> {
    if (this.manualExchangeRate > 0) {
      this.field.exchangeRate = parseFloat(this.manualExchangeRate.toString());
      this.field.isManuallySet = true;
      this.isManuallySet = true;

      const exchangeRateControl = this.form.get(this.field.name);
      if (exchangeRateControl) {
        exchangeRateControl.setValue(this.field.exchangeRate, { emitEvent: false });
      }
      if (typeof this.field?.onManualChange === 'function') {
        const formValue = this.form.value;
        const updatedFormValue = await this.field.onManualChange(formValue, this.formFields);
        if (updatedFormValue) {
          this.form.patchValue(updatedFormValue);
        }
      }
    }
    this.editOverlay.hide();
  }

  onValueChanges() {
    if (typeof (this.field?.onValueChange) === 'function') {
      this.form.get(this.field.name)
        .valueChanges
        .pipe(debounceTime(500), startWith(null), distinctUntilChanged(), pairwise())
        .subscribe(async ([prev, next]: [any, any]) => {
          console.log("out patch value dropdown", this.formFields)
          const value = await this.field?.onValueChange(prev, next, this.form.value, this.formFields, this.field);

          if (value) {
            this.form.patchValue(value);
          }
        });
    }
  }
  onClearManualRate(): void {
    this.manualExchangeRate = 0;
    this.field.isManuallySet = false;
    this.isManuallySet = false;
    this.field.exchangeRate = 0;

    const exchangeRateControl = this.form.get(this.field.name);
    if (exchangeRateControl) {
      exchangeRateControl.setValue(0, { emitEvent: false });
    }

    this.getRateBasedOnDate();
    this.editOverlay.hide();
  }

  onExternalLinkClick(event: Event): void {
    if (this.externalLinkUrl && this.externalLinkUrl !== '#') {
      event.preventDefault();
      window.open(this.externalLinkUrl, '_blank');
    }
  }

  private subscribeToTargetCurrencyChanges(): void {
    const targetCurrencyFieldName = this.field?.targetCurrencyField;
    if (!targetCurrencyFieldName || !this.form) return;

    const targetCurrencyControl = this.form.get(targetCurrencyFieldName);
    if (!targetCurrencyControl) return;
    const prevValue = targetCurrencyControl.value;

    this.targetCurrencySubscription = targetCurrencyControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(value => value !== null && value !== undefined && value !== '' && value !== prevValue)
      )
      .subscribe(() => {
        // this.isManuallySet = false;
        // this.field.isManuallySet = false;
        // if (this.shouldShowComponent && !this.isManuallySet && !this.field?.isEditMode) {
        if (this.shouldShowComponent && !this.isManuallySet) {
          this.getRateBasedOnDate();
        } else {
          const exchangeRateControl = this.form.get(this.field.name);
          if (exchangeRateControl && this.targetCurrency == this.baseCurrency) {
            exchangeRateControl.setValue(1) 
          }
        }
      });
  }

  private subscribeToExchangeRateDateChanges(): void {
    const exchangeRateDateFieldName = this.field?.exchangeRateDateField;
    if (!exchangeRateDateFieldName || !this.form) return;

    const exchangeRateDateControl = this.form.get(exchangeRateDateFieldName);
    if (!exchangeRateDateControl) return;
    const prevValue = exchangeRateDateControl.value;

    this.exchangeRateDateSubscription = exchangeRateDateControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter(value => value !== null && value !== undefined && value !== '' && value !== prevValue)
      )
      .subscribe(() => {
        // this.isManuallySet = false;
        // this.field.isManuallySet = false;
        if (this.shouldShowComponent && !this.isManuallySet) {
          this.getRateBasedOnDate();
        }
      });
  }

  private getRateBasedOnDate(isIntialized: boolean = false): void {
    if (this.isManuallySet || !this.shouldShowComponent) return;
    if (!this.exchangeRateDate || !this.targetCurrency) return;

    if (this.field?.isEditMode && isIntialized) {
      this.field.exchangeRate = this.form.get(this.field?.name)?.value;
    } else {
      new Promise((resolve) => {
        this._spinner.show();
        this.apiService.get(
          `${ServiceUrlConstants.FOREX_RATE_URL}get-latest-rate?date=${this.exchangeRateDate}&target_currency=${this.targetCurrency}`
        ).subscribe({
          next: (res: any) => this.mapExchangeRateFromResponse(res),
          error: () => this.field.exchangeRate = 0
        });
        this._spinner.hide();
      })
    }
  }

  private mapExchangeRateFromResponse(res: any): void {
    if (!res) {
      this.field.exchangeRate = 0;
      return;
    }

    let rateData = res;
    let rate: number = 0;

    if (this.useInverseRate && rateData.inverse_rate) {
      rate = parseFloat(rateData.inverse_rate);
    } else if (rateData.rate) {
      rate = parseFloat(rateData.rate);
    }
    this.field.exchangeRate = parseFloat(rate.toFixed(6));

    const exchangeRateControl = this.form.get(this.field.name);
    if (exchangeRateControl) {
      exchangeRateControl?.patchValue(Number(this.field?.exchangeRate || 0));
    }
  }
}

