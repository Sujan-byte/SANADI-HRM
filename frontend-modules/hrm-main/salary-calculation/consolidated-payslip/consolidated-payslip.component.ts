import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MultiSelectModule } from 'primeng/multiselect';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

const MONTHS = [
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

const ALL_COLUMNS = [
  { field: 'employee_code',   header: 'Employee Code'    },
  { field: 'first_name',      header: 'Employee Name'    },
  { field: 'employee_type',   header: 'Employee Type'    },
  { field: 'department',      header: 'Department'       },
  { field: 'designation',     header: 'Designation'      },
  { field: 'sponsors',        header: 'Sponsor'          },
  { field: 'working_days',    header: 'Working Days'     },
  { field: 'no_of_days',      header: 'Payable Days'     },
  { field: 'leave_days',      header: 'Leave Days'       },
  { field: 'basic',           header: 'Basic'            },
  { field: 'variable',        header: 'Variable'         },
  { field: 'gross_pay',       header: 'Gross Pay'        },
  { field: 'ot',              header: 'OT'               },
  { field: 'bonus',           header: 'Bonus'            },
  { field: 'other_incentive', header: 'Other Incentives' },
  { field: 'lop_amount',      header: 'LOP Amount'       },
  { field: 'earned',          header: 'Earned'           },
  { field: 'advance_emi',     header: 'Advance EMI'      },
  { field: 'advance_balance', header: 'Advance Balance'  },
  { field: 'deductions_pay',  header: 'Deduction Pay'    },
  { field: 'other_allowances', header: 'Other Allowances' },
  { field: 'net_pay',         header: 'Net Pay'          },
  { field: 'salary_status',   header: 'Status'           },
  { field: 'remarks',         header: 'Remarks'          },
];

const DEFAULT_VISIBLE_FIELDS = [
  'employee_code', 'first_name', 'department', 'no_of_days',
  'basic', 'variable', 'gross_pay', 'lop_amount', 'deductions_pay', 'net_pay', 'salary_status',
];

const GROUP_BY_OPTIONS = [
  { label: 'Department', value: 'department'  },
  { label: 'Designation', value: 'designation' },
  { label: 'Sponsor',    value: 'sponsor'      },
  { label: 'All (No Grouping)', value: 'all'  },
];

@Component({
  selector: 'app-consolidated-payslip',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    TooltipModule,
    ProgressSpinnerModule,
    MultiSelectModule,
  ],
  templateUrl: './consolidated-payslip.component.html',
  styleUrl: './consolidated-payslip.component.scss',
})
export class ConsolidatedPayslipComponent implements OnInit {
  private apiService   = inject(ApiService);
  private dialogRef    = inject(DynamicDialogRef,    { optional: true });
  private dialogConfig = inject(DynamicDialogConfig, { optional: true });

  readonly months          = MONTHS;
  readonly allColumns      = ALL_COLUMNS;
  readonly groupByOptions  = GROUP_BY_OPTIONS;
  readonly currentYear     = new Date().getFullYear();
  readonly yearOptions = Array.from({ length: 6 }, (_, i) => ({
    label: String(this.currentYear - i),
    value: this.currentYear - i,
  }));

  year           = signal<number>(this.currentYear);
  month          = signal<number>(new Date().getMonth() + 1);
  groupBy        = signal<string>('department');
  selectedFields = signal<string[]>(DEFAULT_VISIBLE_FIELDS);

  visibleColumns = computed(() =>
    ALL_COLUMNS.filter(c => this.selectedFields().includes(c.field))
  );

  rows      = signal<any[]>([]);
  loading   = signal(false);
  exporting = signal(false);

  ngOnInit(): void {}

  close(): void {
    this.dialogRef?.close();
  }

  private buildParams(includeFields = false): Record<string, any> {
    const b_id = localStorage.getItem('b_id') || '';
    const params: Record<string, any> = {
      b_id,
      year:     this.year(),
      month:    this.month(),
      group_by: this.groupBy(),
    };
    if (includeFields) {
      // Use ALL_COLUMNS order so PDF/Excel columns match the table display order
      const orderedFields = ALL_COLUMNS
        .filter(c => this.selectedFields().includes(c.field))
        .map(c => c.field);
      params['fields'] = orderedFields.join(',');
    }
    return params;
  }

  applyFilters(): void {
    this.loading.set(true);
    this.apiService.get('/hrm/salaryCalculation/consolidated_payslip_list/', this.buildParams())
      .subscribe({
        next: (res: any) => {
          this.rows.set(res?.rows || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  async exportExcel(): Promise<void> {
    await this._download('consolidated_payslip_excel', 'Consolidated_Payslip.xlsx');
  }

  async exportPdf(): Promise<void> {
    await this._download('consolidated_payslip_pdf', 'Consolidated_Payslip.pdf');
  }

  private async _download(action: string, filename: string): Promise<void> {
    this.exporting.set(true);
    try {
      const token = localStorage.getItem('accessToken') || '';
      const base  = ServiceUrlConstants.BASE_URL.replace(/\/$/, '');
      const hostname = window.location.hostname;
      const match    = hostname.match(/(.*?)\./);
      const client   = match ? match[1] : '';
      const clientPrefix = client ? `${client}/` : '';

      const params = this.buildParams(true);
      const query  = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
      ).toString();

      const url = `${base}/${clientPrefix}hrm/salaryCalculation/${action}/?${query}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!response.ok) return;
      const blob   = await response.blob();
      const anchor = document.createElement('a');
      anchor.href  = URL.createObjectURL(blob);
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    } finally {
      this.exporting.set(false);
    }
  }
}
