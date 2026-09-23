import { Injectable } from '@angular/core';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { HrmServiceUrlConstants } from 'src/app/modules/hrm-service-url-constants';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../core/shared/services/shared.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  baseURL: string = ServiceUrlConstants.BASE_URL;
  countFormURL: string = ServiceUrlConstants.BRANCH_CRUD;
  branChdashbordCountFormURL: string = ServiceUrlConstants.BRANCH_DASHBORD_CRUD;
  inquiryFormURL: string = ServiceUrlConstants.SALES_INQUIRY_CRUD;
  bdFormURL: string = ServiceUrlConstants.BANK_DETAIL_FORM_CRUD;
  quotationFormURL: string = ServiceUrlConstants.SALES_QUOTATION_CRUD;
  serviceInquiryFormURL: string = '';
  serviceQuotationFormURL: string = '';
  MatrialIssueFormURL: string = '';
  raisedServiceQuotationURL: string = '';
  dashboardCountCrudURL: string = HrmServiceUrlConstants.DASHBOARD_COUNTS_CRUD;

  constructor(
    private http: HttpClient,
    private _sharedService: SharedService,
  ) { }

  getCountForm(): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.branChdashbordCountFormURL}`).pipe(
    )
  }

  //Sales - Inquiry 

  getInquiryList(page: number, pageSize: number = 12): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.inquiryFormURL}`, {
      params: {
        is_active: 'true',
        required_fields: "id,inquiry_no,inquiry_date,select_customer,lead_source",
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }

  getInquirybyId(id: any): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.inquiryFormURL}${id}`).pipe(
    )
  }

  getTTDashboard(): Observable<any> {
    return this.http.get<any>(`${this.bdFormURL}`).pipe(
      
    )
  }

  //Sales Quotation

  getQuotationList(page: number, pageSize: number = 12): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.quotationFormURL}`, {
      params: {
        is_active: 'true',
        required_fields: "id,quotation_no,quotation_date,select_customer,approval_status",
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }
  getEmployeeAssignProductIssue(page: number, pageSize: number = 12, user_id: number, api: string): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.MatrialIssueFormURL}${user_id}/profile_material_details_issue/`, {
      params: {
        is_active: 'true',
        page: page.toString(),
        page_size: pageSize.toString(),
        user_id: user_id.toString(),
        api_type: api
      }
    });
  }

  getQuotationbyId(id: any): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.quotationFormURL}${id}`).pipe(
    )
  }

  // Service -Inquiry

  getServiceInquiryList(page: number, pageSize: number = 12): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.serviceInquiryFormURL}`, {
      params: {
        is_active: 'true',
        required_fields: "id,inquiry_no,inquiry_date,select_customer,lead_source",
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }

  getServiceInquiryById(id): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.serviceInquiryFormURL}${id}`);
  }

  // Service -Quotation


  getServiceQuotationList(page: number, pageSize: number = 12): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.serviceQuotationFormURL}`, {
      params: {
        is_active: 'true',
        required_fields: "id,quotation_no,quotation_date,select_customer",
        page: page.toString(),
        page_size: pageSize.toString()
      }
    });
  }

  getServiceQuotationById(id): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.serviceQuotationFormURL}${id}`);
  }

  // ERP
  getERPDashboardData(month: any, year: any): Observable<any> {
    if(month == null){
      month = new Date().getMonth() + 1;
    }
    if(year == null){
      year = new Date().getFullYear();
    }
    return this.http.get<any>(`${this.baseURL}${ServiceUrlConstants.ERP_DASHBOARD}?month=${month}&year=${year}`);
  }

  // for approving and rejecting the spare parts request
  updateSparePartsRequest(id: number, type: 'approve' | 'reject'): Observable<any> {
    return this.http.put<any>(`${this.baseURL}${ServiceUrlConstants.SERVICE_SPARE_PARTS_REQUEST}/${id}/?event_type=${type}`, {})
  }

  // HRM
  getHRMDashboardData(month: any, year: any): Observable<any> {
    if(month == null){
      month = new Date().getMonth() + 1;
    }
    if(year == null){
      year = new Date().getFullYear();
    }
    return this.http.get<any>(`${this.baseURL}${ServiceUrlConstants.HRM_DASHBOARD}?month=${month}&year=${year}`);
  }

  // Raised Service -Quotation
  getRaisedSQList(page: number, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.raisedServiceQuotationURL}`, {
      params: {
        is_active: 'true',
        required_fields: "id,created",
        page: page.toString(),
        page_size: pageSize.toString(),
        used: false,
      }
    });
  }

  getRaisedSQById(id): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.raisedServiceQuotationURL}${id}`);
  }

  // Home dashboard (Employee Overview / Leave Graph) counts, used by AdminDashboardComponent
  getDashboardCountData(): Observable<any> {
    return this.http.get<any>(`${this.baseURL}${this.dashboardCountCrudURL}`).pipe(
    )
  }

}
