import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { SharedService } from 'src/app/modules/hrm-shared/core/shared/services/shared.service';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Injectable({
  providedIn: 'root'
})
export class DataImportService {
  baseURL: string = ServiceUrlConstants.BASE_URL;
  dataImportCrudURL: string = ServiceUrlConstants.DATA_IMORT_CRUD;
  employeeDataImportDetailsCrudURL: string = ServiceUrlConstants.EMPLOYEE_DATA_IMORT_DETAILS_CRUD;
  dataImportDetailsCrudURL: string = ServiceUrlConstants.DATA_IMORT_DETAILS_CRUD;
  employeeListCrudURL: string = ServiceUrlConstants.EMPLOYEE_MASTER_CRUD;
  constructor(private http: HttpClient,
    private _sharedService: SharedService) { }

  getDataImportDetailsById(dataImportId: string): Observable<any> {
    const url = `${this.baseURL}${this.dataImportDetailsCrudURL}?attendance=${dataImportId}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({});
      })
    );
  }
  updateDataImportDetails(rowData: any): Observable<any> {
    return this.http.put<any>(`${this.baseURL}${this.dataImportDetailsCrudURL}${rowData?.id}/`, rowData).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }
  getDataImportById(DataImportId: string): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.dataImportCrudURL}/${DataImportId}/`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    );
  }

  dataImportModifier(formData: FormData) {
    if (formData.get('id')) {
      return this.http.put<any>(`${this.baseURL}${this.dataImportDetailsCrudURL}${formData.get('id')}/`, formData).pipe(
        catchError((error) => {
          this._sharedService.handleError(error);
          return of({})
        })
      );
    } else {
      return this.http.post<any>(`${this.baseURL}${this.employeeDataImportDetailsCrudURL}`, formData).pipe(
        catchError((error) => {
          this._sharedService.handleError(error);
          return of({})
        })
      );
    }
  }

  getDataImportDetailsListByMultipleParameters(queryParams, offset, limit, id): Observable<any> {
    const result = {
      offset: offset,
      limit: limit,
      attendance_id: id,
      multipleQuery: true,
    };
    const mergedQueryParams = { ...result, ...queryParams };
    console.log("mergedQueryParams", mergedQueryParams);
    return this.http.get(`${this.baseURL}${this.dataImportDetailsCrudURL}`, { params: mergedQueryParams }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }
  getDataImportGlobalSearchList(key: any, id: any, offset, limit): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.dataImportDetailsCrudURL}${'?search='}${key}${'&attendance_id='}${id}${'&offset='}${offset}${'&limit='}${limit}`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }
  getDataImportDetailsListByVirtualScrollMultiQuery(id, offset, limit): Observable<any> {
    const result = {
      offset: offset,
      limit: limit,
      attendance_id: id,
      multipleQuery: true,
    };
    const mergedQueryParams = { ...result };

    return this.http.get<any>(`${this.baseURL}${this.dataImportCrudURL}`, { params: mergedQueryParams }).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    );
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.employeeListCrudURL}${'?is_active='}${true}`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }
  getEmployeeQuery(query): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.employeeListCrudURL}${query}`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }
  paySlipList(employee_id, date) {
    return this.http.get<any>(`${this.baseURL}/hrm/payslip_list${'?employee_id='}${employee_id}${'&date='}${date}`).pipe(
      catchError((error) => {
        this._sharedService.handleError(error);
        return of({})
      })
    )
  }

  paySlipZip(employee_id: any, date: string, months: number[]): Observable<Blob> {
    const monthsStr = months.join(',');
    return this.http.get(
      `${this.baseURL}/hrm/payslip_zip?employee_id=${employee_id}&date=${date}&months=${monthsStr}`,
      { responseType: 'blob' }
    ).pipe(
      catchError((err) => {
        // When responseType is 'blob', error body arrives as a Blob — parse it back to JSON
        if (err.error instanceof Blob) {
          return new Observable<never>(observer => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const json = JSON.parse(reader.result as string);
                observer.error({ ...err, error: json });
              } catch {
                observer.error(err);
              }
            };
            reader.readAsText(err.error);
          });
        }
        return throwError(() => err);
      })
    );
  }
}
