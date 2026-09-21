import { Injectable } from '@angular/core';
import { AdvanceEnum } from 'src/app/core/shared/common/enum/hrm-enum/advance.enum';

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
