import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'bonus',
    loadComponent: async () =>
      (await import('./bonus/bonus.component'))
        .BonusComponent,
  },
  {
    path: 'advance',
    loadComponent: async () =>
      (await import('./advance/advance.component'))
        .AdvanceComponent,
  },


  {
    path: 'expense-claim-category',
    loadComponent: async () =>
      (
        await import(
          './expense-claim-category/expense-claim-category.component'
        )
      ).ExpenseClaimCategoryComponent,
  },

  {
    path: 'expense-claim',
    loadComponent: async () =>
      (
        await import(
          './expense-claim/expense-claim.component'
        )
      ).ExpenseClaimComponent,
  },

  {
    path: 'petty-cash-fund',
    loadComponent: async () =>
      (
        await import(
          './petty-cash-fund/petty-cash-fund.component'
        )
      ).PettyCashFundComponent,
  },

  {
    path: 'petty-cash-transaction',
    loadComponent: async () =>
      (
        await import(
          './petty-cash-transaction/petty-cash-transaction.component'
        )
      ).PettyCashTransactionComponent,
  },

  {
    path: 'employee-salary',
    loadComponent: async () =>
      (await import('./employee-salary/employee-salary.component'))
        .EmployeeSalaryComponent,
  },
  {
    path: 'career-letter',
    loadComponent: async () =>
      (await import('./career-letter/career-letter.component'))
        .CareerLetterComponent,
  },
  {
    path: 'gratuity',
    loadComponent: async () =>
      (await import('./gratuity-form/gratuity-form.component'))
        .GratuityFormComponent,
  },
  {
    path: 'gratuity-calculation',
    loadComponent: async () =>
      (await import('./gratuity-calculation/gratuity-calculation.component'))
        .GratuityCalculationComponent,
  },
  {
    path: 'salary-calculation',
    loadComponent: async () =>
      (await import('./salary-calculation/salary-calculation.component'))
        .SalaryCalculationComponent,
  },
  {
    path: 'salary-hold',
    loadComponent: async () =>
      (await import('./salary-hold/salary-hold.component'))
        .SalaryHoldComponent,
  },
  {
    path: 'salary-increment',
    loadComponent: async () =>
      (await import('./salary-increment/salary-increment.component'))
        .SalaryIncrementComponent,
  },
  {
    path: 'ot-salary-calculation',
    loadComponent: async () =>
      (await import('./ot-salary-calculation/ot-salary-calculation.component'))
        .OTSalaryCalculationComponent,
  },
  {
    path: 'attendance-import',
    loadComponent: async () =>
      (await import('./attendance-import/attendance-import.component'))
        .AttendanceImportComponent,
  },
  {
    path: 'attendance-import/data-import',
    loadComponent: async () =>
      (await import('./data-import/data-import.component')).DataImportComponent,
    children: [
      {
        path: ':id',
        loadComponent: async () =>
          (await import('./data-import/data-import.component')).DataImportComponent
      }
    ]
  },

  {
    path: 'pay-slip',
    loadComponent: async () =>
      (await import('./payslip/payslip.component'))
        .PayslipComponent
  },
  {
    path: 'final-settlement',
    loadComponent: async () =>
      (await import('./final-settlement/final-settlement.component'))
        .FinalSettlementComponent,
  },
  {
    path: 'ta-da',
    loadComponent: async () =>
      (await import('./ta-da/ta-da.component'))
        .TaDaComponent,
  },
  {
    path: 'grace-details',
    loadComponent: async () =>
      (await import('./grace-details/grace-details.component'))
        .GraceDetailsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrmRoutingModule { }
