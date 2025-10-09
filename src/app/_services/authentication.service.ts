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

  forgotPassword(data: any) {
    return this.http.post<any>(`${this._url}/forgot-password`, data);
  }
  resetPassword(data: any) {
    return this.http.post<any>(`${this._url}/reset-password`, data);
  }

  changePassword(data: any) {
    return this.http.put<any>(`${this._url}/change-password`, data);
  }

  // User Management CRUD Operations
  getUsersByAdmin() {
    return this.http.get<any>(`${this._url}/admin/users`);
  }

  createUserByAdmin(data: any) {
    return this.http.post<any>(`${this._url}/admin/create-user`, data);
  }

  deleteUser(userId: string) {
    return this.http.delete<any>(`${this._url}/users/delete-user/${userId}`);
  }

  updateUser(userId: string, data: any) {
    return this.http.put<any>(`${this._url}/users/${userId}`, data);
  }

  getUserById(userId: string) {
    return this.http.get<any>(`${this._url}/admin/users/${userId}`);
  }


}
