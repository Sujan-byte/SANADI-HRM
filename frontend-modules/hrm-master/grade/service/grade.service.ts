import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { catchError, Observable, of } from 'rxjs';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { ConfirmationDialogComponent } from 'src/app/modules/hrm-shared/sanadi-library/sanadi-components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  baseURL: string = ServiceUrlConstants.BASE_URL;

  // private _sharedService: SharedService,private confirmationService: ConfirmationService, private messageService: MessageService
  constructor(private http: HttpClient, private dialogService: DialogService
  ) { }
  public readonly onSaveFormData =
  async (formData: FormData, formFields,action:string='submit') => {
    if (formData['id'] === undefined ||action == 'RESTORE') {
      formData['confirm_msg']=false
      return Promise.resolve(formData);
    }
   
    return new Promise(async (resolve) => {
      const ref: DynamicDialogRef = this.dialogService.open(ConfirmationDialogComponent, {
        header: 'Please Confirm',
        data: {
          message: 'Do you want to apply these changes to Existing Employees?'
        }
      });
      ref.onClose.subscribe((res) => {

        if (res == true) {
          formData['confirm_msg']=true
          resolve(formData);
        } else {
          formData['confirm_msg']=false
          resolve(formData);
        }
      });
    });
  }

  restoreGrade(formData: FormData): Observable<any> {
    if (formData.get('id')) {
        return this.http.put<any>(`${this.baseURL}/master/grade/${formData.get('id')}/`, formData).pipe(
            catchError((error) => {
                return of({});  
            })
        );
    } else {
        return of(null); 
    }
}

}

