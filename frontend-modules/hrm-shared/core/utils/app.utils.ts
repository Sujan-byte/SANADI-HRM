import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { ApprovalOptions } from '../shared/common/enum/app.enum';
import { Validators } from '@angular/forms';


@Injectable({
    providedIn: 'root'
})
export class AppUtils {

    constructor(private translate: TranslateService) {}

    getApprovalStatusList(): { label: string, value: string, severity: string }[] {
        return [
            { label: this.translate.instant('approved_TC'), value: ApprovalOptions.APPROVED, severity: 'success' },
            { label: this.translate.instant('pending_approval_TC'), value: ApprovalOptions.PENDING_APPROVAL, severity: 'info' },
            { label: this.translate.instant('rejected_TC'), value: ApprovalOptions.REJECTED, severity: 'danger' },
            { label: this.translate.instant('cancelled_TC'), value: ApprovalOptions.CANCELLED, severity: 'danger' },
            { label: this.translate.instant('not_approved_TC'), value: ApprovalOptions.NOT_APPROVED, severity: 'warning' },
            // { label: this.translate.instant('sent_for_review_TC'), value: ApprovalOptions.SENT_FOR_REVIEW, severity: 'contrast' },
        ];
    }

    checkIsSuperUser() {
        const isSuperUser = JSON.parse(localStorage.getItem('is_superuser'));
        return isSuperUser;
    }

}


export  function isFormDisabled(data:any,key:string='approval_status',val:any='APPROVED'):boolean{
     if(data?.[key]==val){
        return true;
     }
     return false;
    }


   export function     mapValidators(validators: any) {
    const formValidators = [];
    if (validators) {
      for (const validation of Object.keys(validators)) {
        if (validation === 'required') {
          formValidators.push(Validators.required);
        } else if (validation === 'email') {
          formValidators.push(Validators.email);
        } else if (validation === 'minlength') {
          formValidators.push(Validators.minLength(validators[validation]));
        } else if (validation === 'maxlength') {
          formValidators.push(Validators.maxLength(validators[validation]));
        } else if (validation === 'pattern') {
          const patternValue = typeof validators[validation] === 'object' 
            ? validators[validation].value 
            : validators[validation];
          formValidators.push(Validators.pattern(patternValue));
        }
        else if (validation === 'warning') {
          console.log('warning validation added',validators[validation]);
          formValidators.push(() => ({ warning: true }));
        }
      }
    }
    return formValidators;
  }