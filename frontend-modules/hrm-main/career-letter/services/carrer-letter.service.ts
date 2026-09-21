import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarrerLetterService {

  constructor() { }

  public readonly onSaveFormData =
    (formData:FormData, formFields: any) =>{
      console.log("type of data",formData, formFields)

      return formData;
    }
}
