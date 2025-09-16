import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LocalStorageService } from "./local-storage.service";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  private _url = environment.APIUrl + "auth";

  signin(data: any) {
    return this.http.post<any>(`${this._url}/signin`, data);
  }
  signup(data: any) {
    return this.http.post<any>(`${this._url}/signup`, data);
  }
  // onboardUser(data: any) {
  //   return this.http.post<any>(`${this._url}/onboard-user`, data);
  // }
  // onboardTemplate(data: any) {
  //   return this.http.post<any>(`${this._url}/onboard-template`, data);
  // }
  // onboardSchedule(data: any) {
  //   return this.http.post<any>(`${this._url}/onboard-schedule`, data);
  // }
  // onboardKnowledge(data: any) {
  //   return this.http.post<any>(`${this._url}/onboard-knowledge`, data);
  // }
  // onboardInstallation(data: any) {
  //   return this.http.post<any>(`${this._url}/onboard-installation`, data);
  // }
  verifyOtp(data: any) {
    return this.http.post<any>(`${this._url}/verify-otp`, data);
  }
  signOut(): void {
    sessionStorage.clear();
    localStorage.clear();
  }

  isAuthenticated() {
    const token = this.localStorageService.getItem('STRATEGY-CUES-USER-TOKEN');
    const userStr = this.localStorageService.getItem('STRATEGY-CUES-USER');
    
    if (!token) {
      return false;
    }
    
    // Only check user data if it exists, don't require it for authentication
    if (userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data in isAuthenticated:', error);
      }
    }
    
    return !!token;
  }

  // isAuthenticated(): boolean {
  //   const token = this.localStorageService.getItem('MILO-USER-TOKEN');
  //   const user = JSON.parse(this.localStorageService.getItem('MILO-USER') || '{}');

  //   // ✅ User is authenticated only if they have a token AND are fully onboarded
  //   return !!token && user.isOnboarded && user.onboardingStep === -1;
  // }
  forgotPassword(data: any) {
    return this.http.post<any>(`${this._url}/forgot-password`, data);
  }
  resetPassword(data: any) {
    return this.http.post<any>(`${this._url}/reset-password`, data);
  }

  changePassword(data: any) {
    return this.http.put<any>(`${this._url}/change-password`, data);
  }
  // updateProfile(data: any) {
  //   return this.http.put<any>(`${this._url}/update-user-profile`, data);
  // }
  // saveWidgetImage(data: any) {
  //   return this.http.post<any>(`${this._url}/upload-widget-img`, data);
  // }
  // saveProfileImage(data: any) {
  //   return this.http.post<any>(`${this._url}/upload-profile-img`, data);
  // }
  // resendOtp(data: any) {
  //   return this.http.post<any>(`${this._url}/resend-otp`, data);
  // }
  // updateMeetingSchedule(data: any) {
  //   return this.http.put<any>(`${this._url}/update-meeting-schedule`, data);
  // }

  // googleSignin(data: any) {
  //   return this.http.post<any>(`${this._url}/google-signin`, data)
  // }
}
