import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import * as moment from 'moment';
import { ButtonModule }       from 'primeng/button';
import { CalendarModule }     from 'primeng/calendar';
import { DropdownModule }     from 'primeng/dropdown';
import { InputTextModule }    from 'primeng/inputtext';
import { MultiSelectModule }  from 'primeng/multiselect';
import { SkeletonModule }     from 'primeng/skeleton';
import { TableModule }        from 'primeng/table';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { DataImportService } from '../data-import/service/data-import.service';
import { SharedService }     from 'src/app/modules/hrm-shared/core/shared/services/shared.service';

const ALL_MONTHS = [
  { label: 'January',   value: 1  },
  { label: 'February',  value: 2  },
  { label: 'March',     value: 3  },
  { label: 'April',     value: 4  },
  { label: 'May',       value: 5  },
  { label: 'June',      value: 6  },
  { label: 'July',      value: 7  },
  { label: 'August',    value: 8  },
  { label: 'September', value: 9  },
  { label: 'October',   value: 10 },
  { label: 'November',  value: 11 },
  { label: 'December',  value: 12 },
];

@Component({
  selector: 'sanadi-payslip',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    MultiSelectModule,
    ButtonModule,
    TableModule,
    SkeletonModule,
    NgxSpinnerModule,
  ],
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.scss',
})
export class PayslipComponent implements OnInit, OnDestroy {

  employeeForm!: FormGroup;

  // Employee dropdown state
  employeeList: { label: string; value: any }[] = [];
  employeeLoading = false;

  // Payslip data
  employee_id: any;
  date: any;
  payslipList:         any[] = [];
  filteredPayslipList: any[] = [];

  // Month multi-select
  readonly months = ALL_MONTHS;
  selectedMonths: number[] = ALL_MONTHS.map(m => m.value);

  // UI state
  isLoading    = false;
  isDownloading = false;
  submitted    = false;

  private readonly searchSubject = new Subject<string>();
  private readonly subs: Subscription[] = [];

  constructor(
    private readonly fb:                  FormBuilder,
    private readonly _dataImportService:  DataImportService,
    private readonly _sharedService:      SharedService,
    private readonly spinner:             NgxSpinnerService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────

  ngOnInit(): void {
    this.employeeForm = this.fb.group({
      selected_employee: [null, Validators.required],
      selected_to_date:  [null, Validators.required],
    });

    // Debounced server-side employee search — fires only after 2+ chars
    this.subs.push(
      this.searchSubject.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        filter(term => term.trim().length >= 2),
      ).subscribe(term => this._fetchEmployees(term)),
    );

    // Reset months + results whenever the year changes
    this.subs.push(
      this.employeeForm.get('selected_to_date')!.valueChanges.subscribe(() => {
        this.selectedMonths = ALL_MONTHS.map(m => m.value);
        this._clearResults();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ── Employee search ────────────────────────────────────────────

  onEmployeeFilter(event: { filter: string }): void {
    const term = (event.filter ?? '').trim();
    if (!term) {
      this.employeeList    = [];
      this.employeeLoading = false;
      return;
    }
    this.employeeLoading = true;
    this.searchSubject.next(term);
  }

  private _fetchEmployees(term: string): void {
    const query = `?page_size=30&is_active=true&search=${encodeURIComponent(term)}`;
    this._dataImportService.getEmployeeQuery(query).subscribe({
      next: (data) => {
        this.employeeList    = (data?.results ?? []).map((e: any) => ({
          label: `${e.first_name} | ${e.employee_code}`,
          value: e,
        }));
        this.employeeLoading = false;
      },
      error: () => { this.employeeLoading = false; },
    });
  }

  onChangeEmployee(employee: any): void {
    this.employee_id = employee?.id ?? null;
    this._clearResults();
  }

  // ── Month multi-select ─────────────────────────────────────────

  onMonthChange(): void {
    if (this.submitted) this._applyMonthFilter();
  }

  get monthsLabel(): string {
    if (this.selectedMonths.length === 12) return 'All Months';
    return `${this.selectedMonths.length} month${this.selectedMonths.length !== 1 ? 's' : ''} selected`;
  }

  // ── Form submit ────────────────────────────────────────────────

  onSubmit(): void {
    if (this.employeeForm.invalid) return;
    if (!this.selectedMonths.length) {
      this._sharedService.handleWarning('Please select at least one month.');
      return;
    }

    this.submitted = true;
    this.isLoading = true;
    this.payslipList         = [];
    this.filteredPayslipList = [];
    this.spinner.show();

    const date = moment(this.date).format('DD-MM-YYYY');

    this._dataImportService.paySlipList(this.employee_id, date).subscribe({
      next: (response) => {
        const results: any[] = response?.results ?? [];
        this.payslipList = results;
        this._applyMonthFilter();

        if (this.filteredPayslipList.length) {
          this._sharedService.handleSuccess('Payslips loaded successfully.');
        } else {
          this._sharedService.handleWarning('No payslips found for the selected months.');
        }
        this.isLoading = false;
        this.spinner.hide();
      },
      error: () => {
        this._sharedService.handleError('Failed to load payslips. Please try again.');
        this.isLoading = false;
        this.spinner.hide();
      },
    });
  }

  private _applyMonthFilter(): void {
    this.filteredPayslipList = this.payslipList.filter(item => {
      const month = moment(item.date).month() + 1; // moment months are 0-indexed
      return this.selectedMonths.includes(month);
    });
  }

  private _clearResults(): void {
    this.submitted           = false;
    this.payslipList         = [];
    this.filteredPayslipList = [];
  }

  // ── PDF actions ────────────────────────────────────────────────

  viewPDF(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }

  downloadPDF(pdfUrl: string, date: string): void {
    const fileName = `Payslip_${moment(date).format('MMMM_YYYY')}.pdf`;
    // Use anchor-click for broadest cross-origin compatibility
    const a = document.createElement('a');
    a.href     = pdfUrl;
    a.download = fileName;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Download all ───────────────────────────────────────────────

  downloadAll(): void {
    if (!this.filteredPayslipList.length || this.isDownloading) return;
    this.isDownloading = true;
    this.spinner.show();

    const date    = moment(this.date).format('DD-MM-YYYY');
    const empName = this.getEmployeeName().replace(/\s+/g, '_') || 'Employee';
    const zipName = `Payslips_${empName}_${this.getYear()}.zip`;

    this._dataImportService.paySlipZip(this.employee_id, date, this.selectedMonths).subscribe({
      next: (blob: Blob) => {
        saveAs(blob, zipName);
        this._sharedService.handleSuccess('Payslips ZIP downloaded successfully.');
        this.isDownloading = false;
        this.spinner.hide();
      },
      error: (err: any) => {
        this._sharedService.handleError(err);
        this.isDownloading = false;
        this.spinner.hide();
      },
    });
  }

  // ── Display helpers ────────────────────────────────────────────

  getMonthName(date: string): string {
    return moment(date).format('MMMM');
  }

  getYear(): string {
    return this.date ? moment(this.date).format('YYYY') : '';
  }

  getEmployeeName(): string {
    const emp = this.employeeForm.get('selected_employee')?.value;
    if (!emp) return '';
    return `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
  }

  getEmployeeCode(): string {
    return this.employeeForm.get('selected_employee')?.value?.employee_code ?? '';
  }

  get isFormValid(): boolean {
    return this.employeeForm.valid && this.selectedMonths.length > 0;
  }

  get skeletonRows(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
