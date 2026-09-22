import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import {
  CustomTokenObtainPair,
  TokenRefresh,
  User,
} from '../models/security.model';
import { ServiceUrlConstants } from 'src/app/core/shared/utils/service-url-constants';
import { SharedService } from './shared.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { EncryptedStorageService } from './secure-cookie-service';
import { Observable, from, switchMap, throwError, catchError } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly signinURL = ServiceUrlConstants.SIGN_IN;
  private readonly signupURL = ServiceUrlConstants.SIGN_UP;
  private readonly refreshTokenURL = ServiceUrlConstants.REFRESH_TOKEN;
  private readonly resetPasswordURL = ServiceUrlConstants.RESET_PASSWORD;
  private readonly sendOTPResetPasswordURL =
    ServiceUrlConstants.SEND_OTP_RESET_PASSWORD;
  private readonly confirmResetPasswordURL =
    ServiceUrlConstants.RESET_PASSWORD_CONFIRM;
  private readonly branchCRUD = ServiceUrlConstants.BRANCH_CRUD;
  private refreshTokenTimeout: any;
  private username: string = '';

  private authenticationObs$ = new BehaviorSubject<boolean>(false);

  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly _sharedService = inject(SharedService);
  private readonly translate = inject(TranslateService);
  private readonly permissionsService = inject(NgxPermissionsService);
  private readonly secureStorage = inject(EncryptedStorageService);

  constructor() {
    // Restore the username after a page reload (it is only kept in memory on login,
    // but first_name is persisted to secure storage), so getUserDetails() stays reliable.
    this.hydrateUsername();
  }

  private async hydrateUsername(): Promise<void> {
    if (!this.username) {
      this.username = (await this.secureStorage.getItem('first_name')) || '';
    }
  }

  /**
   *  LOGIN USER
   */

  async loginUser(userInfo: CustomTokenObtainPair): Promise<any> {
    try {
      const user = await firstValueFrom(
        this.apiService.post<any, any>(this.signinURL, userInfo).pipe(
          tap(async (user) => {
            this.username = user?.first_name ?? '';
            this.startRefreshTokenTimer();
            this.setAuthenticationObs(true);
            this.permissionsService.loadPermissions(user.permission);
          }),
          catchError((error) => {
            console.error('Login error:', error);
            // this._sharedService.handleError(error);
            return throwError(() => error);
          })
        )
      );

      return user; // ✅ resolved Promise result
    } catch (error) {
      throw error; // propagate error in async/await style
    }
  }

  /**
   *  REGISTER USER
   */
  registerUser(registerInfo: User): Observable<any> {
    return this.apiService.post<any, any>(this.signupURL, registerInfo);
  }

  /**
   *  FORGOT PASSWORD
   */
  forgotPassword(info: any): Observable<any> {
    return this.apiService.post<any, any>(this.resetPasswordURL, info);
  }

  /**
   *  CHECK LOGIN
   */
  async checkLogin(): Promise<boolean> {
    const token = await this.secureStorage.getItem('accessToken');
    return !!token;
  }

  /**
   *  LOGOUT
   */
  async logout() {
    this.stopRefreshTokenTimer();

    const theme = await this.secureStorage.getItem('theme');
    const fontScale = await this.secureStorage.getItem('font-scale');
    const scaleIndex = await this.secureStorage.getItem('scale-index');

    await this.secureStorage.clear();
    await this.secureStorage.setItem('theme', theme);
    await this.secureStorage.setItem('font-scale', fontScale);
    await this.secureStorage.setItem('scale-index', scaleIndex);

    this._sharedService.sendSignal(null);
    this.setAuthenticationObs(false);
    this.router.navigate(['app/login']);
    this._sharedService.handleSuccess(
      this.translate.instant('logoutSuccessTitle_TC')
    );
  }

  /**
   *  REFRESH TOKEN HANDLER
   */
  async startRefreshTokenTimer() {
    const timeout = 250 * 60 * 1000; // 250 minutes

    const refreshAndSchedule = async () => {
      try {
        const res = await firstValueFrom(this.refreshToken());
        if (res?.access) {
          await this.secureStorage.setItem('accessToken', res.access);
        }
        this.refreshTokenTimeout = setTimeout(refreshAndSchedule, timeout);
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.router.navigate(['/app/login']);
      }
    };

    refreshAndSchedule();
  }

  refreshToken(): Observable<any> {
    return from(this.secureStorage.getItem('refresh')).pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) {
          return throwError(() => new Error('No refresh token found'));
        }
        // Post the refresh token to get a new access token
        return this.apiService.post<any, any>(this.refreshTokenURL, {
          refresh: refreshToken,
        });
      }),
      catchError((err) => {
        console.error('Token refresh failed:', err);
        return throwError(() => err);
      })
    );
  }

  stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }

  /**
   *  TOKEN HELPERS
   */
  async getToken() {
    return await this.secureStorage.getItem('accessToken');
  }

  async isAuthenticated() {
    return (await this.secureStorage.getItem('accessToken')) != null;
  }

  getUserDetails() {
    return this.username;
  }

  /**
   *  AUTH STATE OBSERVABLE
   */
  getAuthenticationObs(): Observable<boolean> {
    return this.authenticationObs$.asObservable();
  }

  setAuthenticationObs(isAuthenticated: boolean) {
    this.authenticationObs$.next(isAuthenticated);
  }
  async getBranchByID(id: number): Promise<any> {
    return await firstValueFrom(this.apiService.get(`${this.branchCRUD}${id}`));
  }

  /**
   *  UPDATE USER BRANCH
   */
  async updateUser(branch: any): Promise<any> {
    const userId: any = await this.secureStorage.getItem('user_id');

    if (!userId) {
      await this.secureStorage.removeItem('b_id');
      throw new Error('User ID not found');
    }

    // Store branch ID safely
    await this.secureStorage.setItem('b_id', branch);

    const url = `${ServiceUrlConstants.LOGIN_USER_CRUD}${userId}/update_user/`;

    return firstValueFrom(
      this.apiService.put(url, { id: parseInt(userId), branch }).pipe(
        tap(async (response: any) => {
          if (response) {
            this._sharedService.sendSignal(response.branch);
          } else {
            await this.secureStorage.removeItem('b_id');
          }
        }),
        catchError(async (error) => {
          await this.secureStorage.removeItem('b_id');
          throw error;
        })
      )
    );
  }

  /**
   *  PASSWORD RESET
   */
  sendOTP(info: any): Observable<any> {
    return this.apiService.post<any, any>(this.sendOTPResetPasswordURL, info);
  }

  confirmPasswordReset(data: any): Observable<any> {
    return this.apiService.post<any, any>(this.confirmResetPasswordURL, data);
  }

  updateUserOnBranchChange(branch: any): Promise<any> {
    // console.log("BRanch is:", branch);
    return new Promise(async (resolve, reject) => {
      const userId: any = await this.secureStorage.getItem('user_id');
      const branchAppConfig: any = await this.secureStorage.getItem(
        'branchAppConfig'
      );
      console.log('branchAppConfig', branchAppConfig);
      this.secureStorage.setItem('b_id', branch);
      let branchObject: any = await this.getBranchByID(branch);
      // console.log("branch Object is:", branchObject);
      this.secureStorage.setItem('company', branchObject?.company),
        this.secureStorage.setItem('state_code', branchObject?.state_code);
      this.secureStorage.setItem('branchName', branchObject?.branch_name || '');
      this.secureStorage.setItem(
        'branchaddress',
        branchObject?.registered_address || ''
      );
      this.secureStorage.setItem('phone_no', branchObject?.phone_no || '');
      this.secureStorage.setItem('branchEmail', branchObject?.email || '');
      this.secureStorage.setItem('gst_no', branchObject?.gst_no || '');
      this.secureStorage.setItem('images', branchObject?.images || '');
      this.secureStorage.setItem(
        'country_name',
        branchObject?.country_name || ''
      );
      this.secureStorage.setItem('cin_no', branchObject?.cin_no || '');
      this.secureStorage.setItem('fax', branchObject?.fax || '');
      this.secureStorage.setItem(
        'branchAppConfig',
        branchObject?.branch_app_config_details || {}
      );
      this.secureStorage.setItem(
        'dynamic_decimal_digits',
        branchObject?.branch_app_config_details
          ? branchObject?.branch_app_config_details?.dynamic_decimal_digits
          : 6
      ),
        this.secureStorage.setItem(
          'branch_image',
          branchObject?.branch_image ? branchObject?.branch_image : null
        );

      if (userId) {
        this.apiService
          .put(`${ServiceUrlConstants.LOGIN_USER_CRUD}${userId}/update_user/`, {
            id: parseInt(userId),
            branch: branch,
          })
          .subscribe(
            (response: any) => {
              if (response) {
                this._sharedService.sendSignal(response?.branch);
                resolve(response); // Resolve the promise with the response
                // location.href = this.router.url;
              } else {
                this.secureStorage.removeItem('b_id');
                reject('No response'); // Reject if there's no response
                // location.href = this.router.url;
              }
            },
            (error: any) => {
              this.secureStorage.removeItem('b_id');
              reject(error); // Reject the promise on error
              // location.href = this.router.url;
            }
          );
      } else {
        this.secureStorage.removeItem('b_id');
        reject('User ID not found'); // Reject if no user ID is found
        // location.href = this.router.url;
      }
    });
  }
}
