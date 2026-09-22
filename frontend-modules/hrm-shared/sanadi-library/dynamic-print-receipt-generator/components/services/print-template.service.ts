import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Injectable({
  providedIn: 'root'
})
export class PrintTemplateService {

  private readonly BASE_URL = environment.BASE_SERVICE_URL;

  constructor(private http: HttpClient) {}


renderTemplate(
  id: string | number,
  url: string,
  copyAs?: string
): Observable<Blob> {

  let params = new HttpParams();
  if (copyAs) {
    params = params.append('copy_as', copyAs);
  }
  return this.http.get(
    `${this.BASE_URL}${url}${id}/print/`,
    {
      params,
      responseType: 'blob'
    }
  );
}

}
