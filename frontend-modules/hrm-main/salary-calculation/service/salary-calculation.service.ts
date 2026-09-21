import { HttpClient } from '@angular/common/http';
import { Injectable, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { catchError, of } from 'rxjs';
import { SharedService } from 'src/app/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { SalaryCalculationComponent } from '../salary-calculation.component';
import { ConfirmationDialogComponent } from 'src/app/sanadi-library/sanadi-components/confirmation-dialog/confirmation-dialog.component';
import { SalaryCalculationFormConfig } from 'src/app/modules/hrm-main/shared-forms/hrm-forms/salary-calculation-form.config.service';

@Injectable({
  providedIn: 'root'
})
export class SalaryCalculationService {
  baseURL: string = ServiceUrlConstants.BASE_URL;

  constructor(
    private http: HttpClient,
    private dialogService: DialogService,
    private _sharedService: SharedService,
    private _formConfig: SalaryCalculationFormConfig,
  ) { }

  public readonly onSaveFormData = async (
    formData: FormData,
    _formFields,
    action: string = 'submit'
  ): Promise<FormData | null> => {
    try {
      // Inject last selected columns if not already set as array
      const cols = this._formConfig.getLastSelectedColumns();
      if (cols) {
        formData['selected_columns'] = cols;
      }

      const result: any = await this.validationSalaryCaliculation(
        formData['employee_type'],
        formData['from_date'],
        formData['to_date']
      ).toPromise();
      if (result?.message) {
        return new Promise((resolve) => {
          const ref: DynamicDialogRef = this.dialogService.open(ConfirmationDialogComponent, {
            header: 'Please confirm',
            data: {
              message: 'Salary has been generated for the selected date range. Please confirm to proceed.'
            }
          });

          ref.onClose.subscribe((res) => {
            resolve(res ? formData : null);
          });
        });
      } else {
        return formData;
      }
    } catch (error) {
      console.error("Error during form data processing:", error);
      this._sharedService.handleWarning('An error occurred while saving the form data.');
      return null;
    }
  }



  validationSalaryCaliculation(employeeType, fromDate, toDate) {
    return this.http.get<any>(`${this.baseURL}/hrm/salaryCalculation/warningMessage${'?employeeType='}${employeeType}&${'fromDate='}${fromDate}&${'toDate='}${toDate}`).pipe(
      catchError((error) => {
        // this._sharedService.handleError(error);
        return of({})
      })
    )
  }
}
