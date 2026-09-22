import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import { Injectable, inject, signal } from '@angular/core';
import { API_URL } from 'src/app/core/api-url.token';


@Injectable({
  providedIn: 'root'
})
export class ReportListService {

  baseURL: string = inject(API_URL);
  reportCrudURL: string = ServiceUrlConstants.REPORT_ENGINE_CRUD;
  reportByIDCrudURL: string = ServiceUrlConstants.REPORT_ENGINE_ID_CRUD;
  reportByFilterCrudURL: string = ServiceUrlConstants.REPORT_ENGINE_FILTER_CRUD;
  reportPdfCrudUrl: string = ServiceUrlConstants.REPORT_PDF_CRUD;
  reportExcelCrudUrl: string = ServiceUrlConstants.REPORT_EXCEL_CRUD;
  constructor(private http: HttpClient,
    private _sharedService: SharedService) { }

  getReports(): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.reportCrudURL}?is_active=${true}`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    );
  }

  getReportbyIDAndType(id: any, from_date: any, to_date: any, filter_data: any, offset, limit,queryParams, filtered_columns): Observable<any> {
    console.log("limit")
    let params = new HttpParams()
    .set('filtered_columns', JSON.stringify(filtered_columns)); 
    return this.http.get<any>(`${this.baseURL}${this.reportByIDCrudURL}?id=${id}&from_date=${from_date}&to_date=${to_date}&filter=${filter_data}&offset=${offset}&limit=${limit}&kwargs=${queryParams}`,{params:params}).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    );
  }


  getReportByColumnFilter(id: any, from_date: any, to_date: any, filtered_columns:any, filter_data: any,selectedProject): Observable<any> {
    console.log("filter data", filter_data)
    const queryParams = new HttpParams({
      fromObject: {
        id: id,
        from_date: from_date,
        to_date: to_date,
        filter_queryparams: JSON.stringify(filter_data),
        project:selectedProject,
        filtered_columns: JSON.stringify(filtered_columns)
      }
    });
    return this.http.get<any>(`${this.baseURL}${this.reportByFilterCrudURL}`, { params: queryParams }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    );
  }

  getReportCustomPrint(data): Observable<any> {
    const url = `${this.baseURL}${this.reportPdfCrudUrl}`; // Update with your backend API endpoint
    return this.http.post(url, data).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({});
      })
      )
    }

  getReportPdf(data,report_name): Observable<any> {
    const url = `${this.baseURL}${this.reportPdfCrudUrl}`; // Update with your backend API endpoint
    const options = { responseType: 'blob' as 'json' };
    return this.http.post(url, data, options).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({});
      }),
      switchMap((response: Blob) => {
        const date=new Date()
        const fileName = report_name + '--' + moment(date).format('YYYY-MM-DD HH:mm:ss'); // Update with the desired file name
        // Save the file using the FileSaver.js library
        saveAs(response, fileName);
        // Return the original response
        return of(response);
      })
    );
  }


  getReportExcel(data): Observable<any> {
    const url = `${this.baseURL}${this.reportExcelCrudUrl}`; // Update with your backend API endpoint
    const options = { responseType: 'blob' as 'json' };
    return this.http.post(url, data, options).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({});
      }),
      switchMap((response: Blob) => {
        const date=new Date()
        const fileName = data.report_name + '--' + moment(date).format('YYYY-MM-DD HH:mm:ss'); 

        console.log("response", response) // Update with the desired file name
        // Save the file using the FileSaver.js library
        saveAs(response, fileName);
        // Return the original response
        return of(response);
      })
    );
  }
}
