import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
 
  constructor(
    private http: HttpClient,
  ) {}

  // login(data: any) {
  //   return this.http.post<any>(`${this._url}/login`, data);
  // }
  // createAccount(data: any) {
  //   return this.http.post<any>(`${this._url}/create-account`, data);
  // }
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
  // validateLogin(data: any) {
  //   return this.http.post<any>(`${this._url}/verify-otp`, data);
  // }
  // signOut(): void {
  //   sessionStorage.clear();
  //   localStorage.clear();
  // }
  // isAuthenticated() {
  //   const token = this.localStorageService.getItem('MILO-USER-TOKEN');
  //   return !!token;
  // }

  // isAuthenticated(): boolean {
  //   const token = this.localStorageService.getItem('MILO-USER-TOKEN');
  //   const user = JSON.parse(this.localStorageService.getItem('MILO-USER') || '{}');
  
  //   // ✅ User is authenticated only if they have a token AND are fully onboarded
  //   return !!token && user.isOnboarded && user.onboardingStep === -1;
  // }
  // forgotPassword(data: any) {
  //   return this.http.post<any>(`${this._url}/forgot-password`, data);
  // }
  // resetPassword(data: any) {
  //   return this.http.post<any>(`${this._url}/reset-password`, data);
  // }

  // changePassword(data: any) {
  //   return this.http.put<any>(`${this._url}/change-password`, data);
  // }
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
