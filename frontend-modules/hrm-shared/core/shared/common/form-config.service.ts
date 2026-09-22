import { Injectable, inject } from '@angular/core';
import { AppSettingFormConfig } from './forms/masters-forms/app-setting-form.config.service';
import { DepartmentFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/department-form.config.service';
import { DesignationFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/designation-form.config.service';
import { BranchFormConfig } from './forms/admin-forms/branch-form.config.service';
import { GradeMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/grade-master-form.config.service';
import { EditorFormConfig } from './forms/masters-forms/editor-form.config.service';
import { GradeFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/grade-form.config.service';
import { EmployeeFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/employee-form.config.service';
import { leaveEntryConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-entry-form.config.service';
import { LeaveMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-master-form.config.service';
import { BonusFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/bonus-form.config.service';
import { AdvanceFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/advance-form.config.service';
import { CareerLetterFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/career-letter-form.config.service';
import { EmployeeSalaryFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/employee-salary-forms.config.service';
import { GratuityFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/gratuity-form.config.service';
import { GratuityCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/gratuity-calculation-form.config.service';
import { HolidayMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/holiday-master-form.config.service';
import { SalaryCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/salary-calculation-form.config.service';
import { AttendanceImportFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/attendance-form.config.service';
import { finalSettlementConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/final-settlement.config.service';
import { taDaFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/ta-da.config.service';
import { ShiftTimingsFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/shift-timings-form.config.services';
import { GlobalMasterMainFormConfig } from './forms/masters-forms/global-master-main-form.config.service';
import { GraceDetailsFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/grace-details-form.config';
import { StatusMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/status-master-form.config.service';
import { LeaveApplicationFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-application-form.config.service';
import { LeavePolicyFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-policy-form.config.service';
import { TicketMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/ticket-master-form.config.service';
import { SalaryComponentFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/salary-components-form.config.service';
import { ShiftMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/shift-master-form.config.service';
import { LeaveReversalConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-reversal-form.config';
import { DisciplinaryActionFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/disciplinary-action-form.config';
import { AllowanceMasterFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/allowance-master-form.config.service';
import { SalaryHoldFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/salary-hold-form.config.service';
import { SalaryIncrementFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/salary-increment-form.config.service';
import { LeaveExtensionFormConfig } from 'src/app/modules/hrm-master/shared-forms/masters-forms/leave-extension-form.config.service';
import { ExpenseClaimCategoryFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/expense-claim-category-form.config.service';
import { ExpenseClaimFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/expense-claim-form.config.service';
import { PettyCashFundFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/petty-cash-fund-form.config.service';
import { PettyCashTransactionFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/petty-cash-transaction-form.config.service';
import { OTSalaryCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/ot-salary-calculation-form.config.service';

@Injectable({
  providedIn: 'root',
})
export class FormConfig {
  private readonly branchForm = inject(BranchFormConfig);
  // MASTER
  private readonly appSettingForm = inject(AppSettingFormConfig);
  private readonly departmentForm = inject(DepartmentFormConfig);
  private readonly gradeMasterForm = inject(GradeMasterFormConfig);
  private readonly designationForm = inject(DesignationFormConfig);
  private readonly editorForm = inject(EditorFormConfig);
  private readonly shiftTimingsForm = inject(ShiftTimingsFormConfig);
  private readonly globalMasterForm = inject(GlobalMasterMainFormConfig);
  private readonly graceDetaisForm = inject(GraceDetailsFormConfig);
  private readonly statusMasterForm = inject(StatusMasterFormConfig);
  private readonly LeaveMasterForm = inject(LeaveApplicationFormConfig);
  private readonly LeavePolicyForm = inject(LeavePolicyFormConfig);
  private readonly ticketMasterForm = inject(TicketMasterFormConfig);
  private readonly SalaryComponentForm = inject(SalaryComponentFormConfig);
  private readonly shiftMasterForm = inject(ShiftMasterFormConfig);
  private readonly leaveReversalRequestForm = inject(LeaveReversalConfig);
  private readonly disciplinaryActionForm = inject(DisciplinaryActionFormConfig);
  private readonly allowanceMasterForm = inject(AllowanceMasterFormConfig);
  private readonly leaveExtensionForm = inject(LeaveExtensionFormConfig);
  private readonly expenseClaimCategoryForm = inject(ExpenseClaimCategoryFormConfig);
  private readonly expenseClaimForm = inject(ExpenseClaimFormConfig);
  private readonly pettyCashFundForm = inject(PettyCashFundFormConfig);
  private readonly pettyCashTransactionForm = inject(PettyCashTransactionFormConfig);
  private readonly salaryHoldForm = inject(SalaryHoldFormConfig);
  private readonly salaryIncrementForm = inject(SalaryIncrementFormConfig);
  private readonly otSalaryCalculationForm = inject(OTSalaryCalculationFormConfig);

  private readonly gradeForm = inject(GradeFormConfig);
  private readonly employeeForm = inject(EmployeeFormConfig);
  private readonly leaveEntryForm = inject(leaveEntryConfig);
  private readonly leaveMasterForm = inject(LeaveMasterFormConfig);
  private readonly bonusForm = inject(BonusFormConfig);
  private readonly advanceForm = inject(AdvanceFormConfig);
  private readonly employeeSalaryForm = inject(EmployeeSalaryFormConfig);
  private readonly careerLetterForm = inject(CareerLetterFormConfig);
  private readonly gratuityForm = inject(GratuityFormConfig);
  private readonly gratuityCalculationForm = inject(GratuityCalculationFormConfig);
  private readonly holidayMasterForm = inject(HolidayMasterFormConfig);
  private readonly salaryCalculationForm = inject(SalaryCalculationFormConfig);
  private readonly attendanceImportForm = inject(AttendanceImportFormConfig);
  private readonly finalSettlementForm = inject(finalSettlementConfig);
  private readonly taDaForm = inject(taDaFormConfig);

  getForm() {
    return {
      'branch': this.branchForm.BranchForm(),
      // MASTER
      'app-setting': this.appSettingForm.AppSettingForm(),
      'department': this.departmentForm.departmentForm(),
      'grade-master': this.gradeMasterForm.GradeMasterForm(),
      'designation': this.designationForm.DesignationForm(),
      'editor': this.editorForm.EditorForm(),

      'grade': this.gradeForm.GradeForm(),
      'employee': this.employeeForm.EmployeeForm(),
      'leave-entry': this.leaveEntryForm.LeaveEntryForm(),
      'leave-master': this.leaveMasterForm.LeaveMasterForm(),
      'bonus': this.bonusForm.BonusForm(),
      'advance': this.advanceForm.AdvanceForm(),
      'employee-salary': this.employeeSalaryForm.EmployeeSalaryForm(),
      'career-letter': this.careerLetterForm.CareerLetterForm(),
      'gratuity': this.gratuityForm.GratuityForm(),
      'gratuity-calculation': this.gratuityCalculationForm.GratuityCalculationForm(),
      'holiday-master': this.holidayMasterForm.HolidayMasterForm(),
      'salary-calculation': this.salaryCalculationForm.SalaryCalculationForm(),
      'attendance-import': this.attendanceImportForm.AttendanceImportForm(),
      'finalSettlement': this.finalSettlementForm.finalSettlementForm(),
      'ta-da': this.taDaForm.taDaForm(),
      'shift-timings': this.shiftTimingsForm.shiftTimingsForm(),
      'global-master': this.globalMasterForm.GlobalMasterMainForm(),
      'grace-details': this.graceDetaisForm.GraceDetailsForm(),
      'status-master': this.statusMasterForm.StatusMasterForm(),
      'leave-application': this.LeaveMasterForm.LeaveApplicationForm(),
      'leave-policy': this.LeavePolicyForm.LeavePolicyForm(),
      'ticket-master': this.ticketMasterForm.TicketMasterForm(),
      'salary-components': this.SalaryComponentForm.SalaryComponentForm(),
      'shift-master': this.shiftMasterForm.ShiftMasterForm(),
      'leave-reversal-form': this.leaveReversalRequestForm.LeaveReversalForm(),
      'disciplinary-action-form': this.disciplinaryActionForm.DisciplinaryActionForm(),
      'allowance-master': this.allowanceMasterForm.AllowanceMasterForm(),
      'leave-extension-form': this.leaveExtensionForm.LeaveExtensionForm(),
      'expense-claim-category': this.expenseClaimCategoryForm.ExpenseClaimCategoryForm(),
      'expense-claim': this.expenseClaimForm.ExpenseClaimForm(),
      'petty-cash-fund': this.pettyCashFundForm.PettyCashFundForm(),
      'petty-cash-transaction': this.pettyCashTransactionForm.PettyCashTransactionForm(),
      'salary-hold': this.salaryHoldForm.SalaryHoldForm(),
      'salary-increment': this.salaryIncrementForm.SalaryIncrementForm(),
      'ot-salary-calculation': this.otSalaryCalculationForm.OTSalaryCalculationForm(),
    };
  }
}
