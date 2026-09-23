import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, catchError, Observable, Subject } from 'rxjs';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { ApiService } from 'src/app/core/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { decimalDigits } from '../utils/common.constants';
import { HrmStorage } from 'src/app/modules/hrm-shared/core/shared/services/hrm-storage';

export class GSTModel {
  branchCountry?: string = '';
  branchStateCode?: string = '';
  country_key?: string = 'country';
  stateCode_key?: string = 'state_code';
  cgst_key?: string = 'cgst';
  sgst_key?: string = 'sgst';
  igst_key?: string = 'igst';
  tcs_key?: string = 'tcs';
  counter_vat_amount_key?: string = 'counter_vat_amount';
  taxAmount?: number = 0;
  data?: any = {};
  vat_key?: string = 'vat';
  is_foreign?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private data = new Subject<any>();
  private myObservableSubject = new BehaviorSubject<any>(0);
  myObservable$ = this.myObservableSubject.asObservable();
  private readonly _httpClient = inject(HttpClient);
  private readonly _messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private readonly secureStorage = inject(HrmStorage);

  // BEHAVIOR SUBJECT
  private triggerSubject = new BehaviorSubject<any>('default message');
  triggerObservable = this.triggerSubject.asObservable();

  handleSuccess(title?: any, description?: any) {
    let successTitle = title ? title : 'SUCCESS';
    let successText = description ? description : '';
    this._messageService.add({
      key: 'toaster',
      severity: 'success',
      summary: successTitle,
      detail: successText,
      life: 1000,
    });
  }

  handleError(error?: any) {
    let errorTitle = 'ERROR';
    let errorText = 'Unable to process your request.';
    // console.log('error', error);
    if (!this.checkInternetConnection()) {
      // Handle no internet connection
      errorTitle = 'Internet Connection Error',
        errorText = 'Please check your internet connection.'
      this._messageService.add({
        key: 'toaster',
        severity: 'error',
        summary: errorTitle,
        detail: errorText,
        life: 5000,
      });
    } else if (error.status != 0) {
      if (error) {
        errorTitle = error?.statusText;
        var keyjson = ''
        if (error.error) {
          for (var key in error?.error) {
            keyjson = error.error[key];
          }
        }
        if (error?.error?.code == 'token_not_valid') {
          errorText = "Session Expired!";
        }
        else {
          if (error?.errorText) {
            errorText = error?.errorText;
          }
          else {
            errorText = keyjson;
          }
        }
      }
      this._messageService.add({
        key: 'toaster',
        severity: 'error',
        summary: errorTitle,
        detail: errorText,
        life: 5000,
      });
    }
  }

  handleWarning(error?: any) {
    let errorTitle = 'WARNING';
    let errorText = 'Unable to process your request.';

    if (error) {
      // errorTitle = error;
      errorText = error;
    }

    this._messageService.add({
      key: 'toaster',
      severity: 'warn',
      summary: errorTitle,
      detail: errorText,
      life: 5000,
    });
  }

  handleInfo(infoText: string = '', infoTitle: string = 'Info') {
    this._messageService.add({
      key: 'toaster',
      severity: 'info',
      summary: infoTitle,
      detail: infoText,
      life: 5000,
    });
  }

  clear() {
    this._messageService.clear();
  }

  sendData(data: any) {
    this.data.next(data);
  }

  getData() {
    return this.data.asObservable();
  }

  reverseGeocode(lat: number, lng: number) {
    console.log('lat', lat, lng);
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    return this._httpClient.get(nominatimUrl).pipe(
      catchError((err) => {
        this.handleError();
        return err;
      })
    );
  }

  sendSignal(signal: any) {
    this.myObservableSubject.next(signal);
  }

  checkInternetConnection(): boolean {
    // return navigator.onLine;
    return true;
  }

  // FIELD LABEL CHANGE
  fieldLabelChange(label: any, fieldObject: any, placeholder: boolean = true, errorText = '') {
    let errorObj = {
      required: '',
      minlength: '',
      maxlength: '',
      pattern: ''
    };
    fieldObject.label = label;
    if (placeholder) {
      if (fieldObject?.type == "dropdown") {
        fieldObject.placeholder = this.translate.instant('formSelectPlaceholder_SC', { label: label });
      } else {
        fieldObject.placeholder = this.translate.instant('formPlaceholder_SC', { label: label });
      }
    }
    const validation = fieldObject?.validation || {};
    if (validation?.required) {
      errorObj.required = this.translate.instant('formRequiredError_SC', {
        label: this.translate.instant(label),
      });
    }

    if (validation?.minlength) {
      errorObj.minlength = this.translate.instant('formMinLengthError_SC', {
        label: this.translate.instant(label),
        char: this.translate.instant(validation?.minlength.toString()),
      });
    }

    if (validation?.maxlength) {
      errorObj.maxlength = this.translate.instant('formMaxLengthError_SC', {
        label: this.translate.instant(label),
        char: this.translate.instant(validation?.maxlength.toString()),
      });
    }

    if (validation?.email) {
      errorObj.pattern = this.translate.instant('formEmailError_SC', {
        label: this.translate.instant(label),
      });
    }

    if (validation?.password) {
      errorObj.pattern = this.translate.instant('formPasswordError_SC', {
        label: this.translate.instant(label),
      });
    }
    
    if (validation?.pattern) {
      errorObj.pattern = errorText;
    }
    fieldObject.errorText = errorObj;
    return fieldObject;
  }

  // GENERATE GRN GST CALCULATION
  generateGST(gstData: GSTModel) {
    let data = gstData?.data;
    gstData.country_key = gstData?.country_key ?? 'country';
    gstData.stateCode_key = gstData?.stateCode_key ?? 'state_code';
    gstData.cgst_key = gstData?.cgst_key ?? 'cgst';
    gstData.sgst_key = gstData?.sgst_key ?? 'sgst';
    gstData.igst_key = gstData?.igst_key ?? 'igst';
    gstData.vat_key = gstData?.vat_key ?? 'vat';
    gstData.tcs_key = gstData?.tcs_key ?? 'tcs';
    gstData.counter_vat_amount_key = gstData?.counter_vat_amount_key ?? 'counter_vat_amount';
    gstData.is_foreign = gstData?.data?.is_foreign ?? false;
  //  console.log("data",gstData?.data?.is_foreign,gstData?.taxAmount)
    if  (gstData?.is_foreign){
      data[gstData?.cgst_key] = 0;
      data[gstData?.sgst_key] = 0;
      data[gstData?.igst_key] = 0;
      data[gstData?.tcs_key] = 0;
      data[gstData?.vat_key] = Number(gstData?.taxAmount.toFixed(decimalDigits()));
      data[gstData?.counter_vat_amount_key] = Number(gstData?.taxAmount.toFixed(decimalDigits()));
    }
    else
      {
    if ((gstData?.branchCountry == 'India') && (data[gstData?.country_key] == 'India')) {
      if (!gstData?.branchStateCode || !data[gstData?.stateCode_key]) {
        // console.log("this.branchStateCode() inside if", gstData?.branchStateCode);
        data[gstData?.cgst_key] = Number((Math.ceil(Number(gstData?.taxAmount) / 2 * 100) / 100).toFixed(decimalDigits()));
        data[gstData?.sgst_key] = Number((Math.ceil(Number(gstData?.taxAmount) / 2 * 100) / 100).toFixed(decimalDigits()));
        data[gstData?.igst_key] = 0;
      } else {
        if (gstData?.branchStateCode == data[gstData?.stateCode_key]) {
          // console.log("this.branchStateCode()", gstData?.branchStateCode, data[gstData?.stateCode_key]);
          data[gstData?.cgst_key] = Number((Math.ceil(Number(gstData?.taxAmount) / 2 * 100) / 100).toFixed(decimalDigits()));
          data[gstData?.sgst_key] = Number((Math.ceil(Number(gstData?.taxAmount) / 2 * 100) / 100).toFixed(decimalDigits()));
          data[gstData?.igst_key] = 0;
        } else {
          // console.log("this.branchStateCode() else", gstData?.branchStateCode, data[gstData?.stateCode_key]);
          data[gstData?.cgst_key] = 0;
          data[gstData?.sgst_key] = 0;
          data[gstData?.igst_key] = Number(gstData?.taxAmount.toFixed(decimalDigits()));
        }
      }
    } else {
      data[gstData?.cgst_key] = 0;
      data[gstData?.sgst_key] = 0;
      data[gstData?.igst_key] = Number(gstData?.taxAmount.toFixed(decimalDigits()));
    }}
    return data;
  }


  // CALL SUBJECT
  sendTrigger(signal: any) {
    this.triggerSubject.next(signal);
  }

  // GENERATE UNIQUE ID
  generateUniqueId() {
    return Math.floor(1000000000000 + Math.random() * 9000) + 'A';
  }

  generateAddress(data: {
    company_name?: string,
    address?: string,
    city?: string,
    zip_code?: string,
    state?: string,
    state_code?: string,
    country?: string,
    tax_number?: string,
  }) {
    // console.log('address data', data);
    let address: string = '';
    if (data?.company_name)
      address = data?.company_name + '\n';
    if (data?.address)
      address += data?.address + '\n';
    // if (data?.address2)
    //   address = address + data?.address2 + '\n';
    if (data?.city && data?.zip_code) {
      address = address + data?.city + ', ' + data?.zip_code + '\n';
    } else if (data?.city && !data?.zip_code) {
      address = address + data?.city + '\n';
    } else if (!data?.city && data?.zip_code) {
      address = address + data?.zip_code + '\n';
    }
    // TAX
    if (data?.tax_number)
      address = address + `GSTIN/UIN: ${data?.tax_number}` + '\n';
    // STATE, STATE CODE, COUNTRY
    if (data?.state && data?.state_code) {
      address = address + data?.state + ', ' + data?.state_code + '\n';
    } else if (data?.state && !data?.state_code) {
      address = address + data?.state + '\n';
    } else if (!data?.state && data?.state_code) {
      address = address + data?.state_code + '\n';
    }
    if (data?.country)
      address = address + data?.country;
    // console.log('generateAddress', address);
    return address;
  }

  disableNavigationView(event: any) {
    // console.log('navigation product', event);
    if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' ||
      event.key == 'Up' || event.key == 'Left' || event.key == 'Right') {
      event.stopPropagation();
    }
  }

  generateAccountingFieldName(branchAppConfig: any, field_name: any) {
    const dateString = branchAppConfig?.accounting_start_date;
    const formattedDate = dateString ?
        dateString.split('-').reverse().join('-') :
        dateString;

    return `${field_name} ${formattedDate}`;
  }

  async getAccountingMinDate(): Promise<Date | undefined> {
    const branchAppConfig: any = await this.secureStorage.getItem('branchAppConfig');
    if (!branchAppConfig?.accounting_start_date) return undefined;
    const [year, month, day] = branchAppConfig.accounting_start_date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  clampToMinDate(dateStr: string, minDate: Date): string {
    if (!minDate || !dateStr) return dateStr;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
    const [day, month, year] = parts;
    const date = new Date(year, month - 1, day);
    if (date < minDate) {
      const d = minDate.getDate().toString().padStart(2, '0');
      const m = (minDate.getMonth() + 1).toString().padStart(2, '0');
      return `${d}-${m}-${minDate.getFullYear()}`;
    }
    return dateStr;
  }
}

