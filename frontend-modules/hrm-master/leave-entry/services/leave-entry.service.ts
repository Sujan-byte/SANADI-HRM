import { Injectable } from '@angular/core';
import { LeaveEntryEnum } from 'src/app/core/shared/common/enum/masters_enum/leave-entry.enum';

@Injectable({
  providedIn: 'root'
})
export class LeaveEntryService {

  constructor() { }

  public readonly onSaveFormData =
  (formData:FormData,formFields) =>{
    const updatedFormData = new  FormData();
    const imageKeys = [LeaveEntryEnum.certificate];

    Object.entries(formData).forEach(([key, value]) => {
      // console.log("key value",key,value)
      if (!imageKeys.includes(key as LeaveEntryEnum) || value=="") {
        updatedFormData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if(formFields){
      const appendFiles = (uniqueKey, enumKey) => {
        const field = formFields[0]?.fields
          .find(ele => ele?.fieldUniqueKey === uniqueKey)?.fields
          .find(ele => ele?.name === enumKey);
        console.log("field", field)
        if (field) {
          for (const file of field.selectedFiles) {
            updatedFormData.append(enumKey, file);
          }
        }
      };
      // console.log("formfields",formFields)
      imageKeys.forEach(enumKey => appendFiles('upload',  enumKey));  
    }
    
    return updatedFormData;
  }
}
