import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';

@Injectable({ providedIn: 'root' })
export class SalaryHoldService {
  baseURL: string = ServiceUrlConstants.BASE_URL;
  constructor(private http: HttpClient) {}
}
