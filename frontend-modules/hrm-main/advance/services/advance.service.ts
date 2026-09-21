import { Injectable } from '@angular/core';
import { AdvanceEnum } from 'src/app/modules/hrm-main/hrm-enum/advance.enum';

@Injectable({
  providedIn: 'root'
})
export class AdvanceService {

  constructor() { }

  
  public readonly onSaveFormData =
    (formData:FormData) =>{
      // console.log("type of data",formData)
      if(formData[AdvanceEnum.date] === ''){
        formData[AdvanceEnum.date] = null;
      }
      return formData;
    }
}
