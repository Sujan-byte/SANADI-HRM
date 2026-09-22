import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api-url.token';
import { Observable, catchError, from, of, switchMap } from 'rxjs';
import { SharedService } from '../shared/services/shared.service';
import * as saveAs from 'file-saver';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public readonly http = inject(HttpClient);
  public readonly api_url = inject(API_URL);

  constructor(
    private _sharedService: SharedService) { }

  get<T>(url: string, queryParams?: any | HttpParams, customHeaders?: HttpHeaders): Observable<T> {
    return this.http.get<T>(this.api_url + url, { params: queryParams, headers: customHeaders, reportProgress: true }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({} as T)
      })
    )
  }

  getJson<T>(url: string): Observable<T> {
    return this.http.get<T>(url);
  }

  delete<T>(url: string, id): Observable<T> {
    let deleteUrl = `${this.api_url + url}${id}/`;
    return this.http.delete<T>(deleteUrl).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({} as T)
      })
    )
  }

  post<T, D>(url: string, data: D, params?: HttpParams): Observable<T> {
    let postUrl = `${this.api_url + url}`;
    return this.http.post<T>(postUrl, data, { params, reportProgress: true }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({} as T)
      })
    )
  }

  put<T, D>(url: string, data: D,params?: HttpParams): Observable<T> {
    let postUrl = `${this.api_url + url}`;
    return this.http.put<T>(postUrl, data,{ params }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({} as T)
      })
    )
  }

  getFile<T>(url: string, queryParams?: any | HttpParams): Observable<T> {
    const params = new HttpParams({ fromObject: queryParams as any }); // Convert queryParams to HttpParams if provided
    return this.http.get(this.api_url + url, { params, responseType: 'blob' }).pipe(
      switchMap((response: Blob) => {
        const date = new Date()
        // detect file type by checking blob type
        const isPDF = response.type === 'application/pdf';
        const isExcel = response.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || response.type === 'application/vnd.ms-excel';

        // assign correct file extension
        const extension = isPDF ? '.pdf' : (isExcel ? '.xlsx' : '');

        // const fileName = queryParams?.dontUseCurrentDate ? (queryParams?.dontUseCurrentDate == true) ? queryParams.fileName : queryParams.fileName + '-' + moment(date).format('DD-MM-YYYY') : queryParams.fileName + '-' + moment(date).format('DD-MM-YYYY');
        // ensure filename from queryParams and force extension
        const rawName = queryParams?.dontUseCurrentDate
          ? (queryParams?.dontUseCurrentDate === true)
            ? queryParams.fileName
            : queryParams.fileName + '-' + moment(date).format('DD-MM-YYYY')
          : queryParams.fileName + '-' + moment(date).format('DD-MM-YYYY');

        // Final name — preserve dots like "Pvt.Ltd" and enforce correct extension
        const fileName = rawName.endsWith(extension) ? rawName : rawName + extension;
        saveAs(response, fileName);
        return of(response as unknown as T);
      }),
      catchError((error) => {
        // responseType:'blob' means error.error is a Blob — read it as text to get the message
        if (error.error instanceof Blob) {
          return from(error.error.text()).pipe(
            switchMap((text: string) => {
              try {
                const parsed = JSON.parse(text);
                this._sharedService.handleError({
                  status: error.status,
                  statusText: error.statusText || 'Error',
                  error: parsed,
                });
              } catch {
                this._sharedService.handleError({
                  status: error.status,
                  statusText: error.statusText || 'Error',
                  errorText: text || 'Export failed',
                });
              }
              return of(null as unknown as T);
            })
          );
        }
        this._sharedService.handleError(error);
        return of(null as unknown as T);
      })
    );
  }

  async postData(url: string, data: any): Promise<any> {
    return await this.post(url, data).toPromise();
  }

  async getData(url: string, params: any = {}): Promise<any> {
    return await this.get(url, params).toPromise();
  }

}
