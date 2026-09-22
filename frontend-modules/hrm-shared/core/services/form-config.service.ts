import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormFieldModel } from '../form-field.builder';

@Injectable({
  providedIn: 'root',
})
export class FormConfigService {
  private formMap: Map<string, Map<string, FormFieldModel>> = new Map<
    string,
    Map<string, FormFieldModel>
  >();

  private http = inject(HttpClient);

  getFormConfig(formId: string): Observable<any[]> {
    return this.http.get<any[]>(`assets/forms-config/${formId}.json`);
  }

  constructFormMap(configs: string[]) {
    configs.forEach((res) => {
      this.getFormConfig(res).subscribe((config:FormFieldModel[]) => {
        let map = new Map();
        config.forEach((reso: FormFieldModel) => {
          this.formMap.set(res, map.set(reso.name, reso));
        });
      });
    });
  }

  getFormFields(formName: string) {
    return this.formMap.get(formName);
  }
}
