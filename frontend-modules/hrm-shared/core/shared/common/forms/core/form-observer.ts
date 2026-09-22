import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormObserver {
  private updateForm$ = new BehaviorSubject<any>(null);
  updateFormObservable = this.updateForm$.asObservable();

  updateForm(formConfig){
    this.updateForm$.next(formConfig);
  }

}
