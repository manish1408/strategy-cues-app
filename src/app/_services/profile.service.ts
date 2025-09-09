import { Injectable } from '@angular/core';

import { LocalStorageService } from './local-storage.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
    private _url = environment.APIUrl + "profile";
  constructor(
    private http: HttpClient,
private localStorageService: LocalStorageService
  ) {}

  getUserDetails(): any {
    try {
      const result = this.localStorageService.getItem('STRATEGY-CUES-USER');
      if (result && result !== 'undefined') {
        const userData = JSON.parse(result);
        // Handle nested user structure: {user: {...}} -> {...}
        return userData.user || userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    let user = this.localStorageService.getItem('STRATEGY-CUES-USER') as any;
    if (user) {
      return true;
    }
    return false;
  }

 
 
  updateUser(data: any) {
    return this.http.put<any>(`${this._url}/update-user-info`, data);
  }
 

  fetchUserDetail(){
    return this.http.get<any>(`${this._url}/me`);
  }
}
