import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MultiSelectModule } from 'primeng/multiselect';
import { ApiService } from 'src/app/modules/hrm-shared/core/services/api.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';

const ALL_COLUMNS = [
  { field: 'employee_code',    header: 'Employee Code'   },
  { field: 'employee_name',    header: 'Employee Name'   },
  { field: 'designation_name', header: 'Designation'     },
  { field: 'department_name',  header: 'Department'      },
  { field: 'allowance_code',   header: 'Allowance Code'  },
  { field: 'allowance_name',   header: 'Allowance Name'  },
  { field: 'allowance_type',   header: 'Allowance Type'  },
  { field: 'mode',             header: 'Mode'            },
  { field: 'amount',           header: 'Amount'          },
  { field: 'rate',             header: 'Rate'            },
  { field: 'from_date',        header: 'From Date'       },
  { field: 'to_date',          header: 'To Date'         },
  { field: 'approval_status',  header: 'Status'          },
];

const DEFAULT_FIELDS = [
  'employee_code', 'employee_name', 'department_name',
  'allowance_name', 'allowance_type', 'mode', 'amount', 'from_date', 'to_date',
];

const GROUP_BY_OPTIONS = [
  { label: 'Employee',     value: 'employee'     },
  { label: 'Department',   value: 'department'   },
  { label: 'Designation',  value: 'designation'  },
  { label: 'Allowance',    value: 'allowance'    },
];

const BASE_URL = `${HrmServiceUrlConstants.ALLOWANCE_ASSIGNMENT_CRUD}`;

@Component({
  selector: 'app-allowance-register-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DropdownModule, CalendarModule,
    TableModule, TooltipModule, ProgressSpinnerModule, MultiSelectModule,
  ],
  templateUrl: './allowance-register-dialog.component.html',
  styleUrl:    './allowance-register-dialog.component.scss',
})
export class AllowanceRegisterDialogComponent implements OnInit {
  private apiService = inject(ApiService);
  private dialogRef  = inject(DynamicDialogRef, { optional: true });

  readonly allColumns     = ALL_COLUMNS;
  readonly groupByOptions = GROUP_BY_OPTIONS;

  fromDate       = signal<Date | null>(null);
  toDate         = signal<Date | null>(null);
  groupBy        = signal<string>('department');
  selectedFields = signal<string[]>(DEFAULT_FIELDS);

  visibleColumns = computed(() =>
    ALL_COLUMNS.filter(c => this.selectedFields().includes(c.field))
  );

  rows      = signal<any[]>([]);
  loading   = signal(false);
  exporting = signal(false);

  ngOnInit(): void {
    // Do not auto-load — user picks filters then clicks Apply
  }

  close(): void { this.dialogRef?.close(); }

  private formatDate(d: Date | null): string {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private buildParams(includeFields = false): Record<string, any> {
    const b_id = localStorage.getItem('b_id') || '';
    const params: Record<string, any> = {
      b_id,
      group_by: this.groupBy(),
    };
    const fd = this.fromDate();
    const td = this.toDate();
    if (fd) params['from_date'] = this.formatDate(fd);
    if (td) params['to_date']   = this.formatDate(td);
    if (includeFields) {
      const ordered = ALL_COLUMNS
        .filter(c => this.selectedFields().includes(c.field))
        .map(c => c.field);
      params['fields'] = ordered.join(',');
    }
    return params;
  }

  applyFilters(): void {
    this.loading.set(true);
    this.apiService.get(`${BASE_URL}allowance_register_list/`, this.buildParams())
      .subscribe({
        next: (res: any) => {
          const flat: any[] = res?.rows || [];
          // Inject group-header sentinel rows for the table to render
          const gb = this.groupBy();
          const GROUP_FIELD: Record<string, string> = {
            department:  'department_name',
            designation: 'designation_name',
            allowance:   'allowance_name',
            employee:    'employee_name',
          };
          const gf = GROUP_FIELD[gb];
          const display: any[] = [];
          let lastGroup: string | null = null;
          for (const row of flat) {
            const grp = row[gf] || '—';
            if (grp !== lastGroup) {
              display.push({ _isGroupHeader: true, _groupLabel: grp });
              lastGroup = grp;
            }
            display.push(row);
          }
          this.rows.set(display);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  async exportExcel(): Promise<void> {
    this.exporting.set(true);
    try {
      const token    = localStorage.getItem('accessToken') || '';
      const base     = ServiceUrlConstants.BASE_URL.replace(/\/$/, '');
      const hostname = window.location.hostname;
      const match    = hostname.match(/(.*?)\./);
      const client   = match ? match[1] : '';
      const prefix   = client ? `${client}/` : '';

      const params = this.buildParams(true);
      const query  = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)
      ).toString();

      const url = `${base}/${prefix}master/allowance-assignment/allowance_register_excel/?${query}`;
      const res  = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) return;
      const blob   = await res.blob();
      const anchor = document.createElement('a');
      anchor.href  = URL.createObjectURL(blob);
      anchor.download = 'Allowance_Register.xlsx';
      anchor.click();
      URL.revokeObjectURL(anchor.href);
    } finally {
      this.exporting.set(false);
    }
  }
}
