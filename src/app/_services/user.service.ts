import { Injectable } from '@angular/core';

import { LocalStorageService } from './local-storage.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _url = `${environment['APIUrl']}/users`;
  constructor(
    private http: HttpClient,
private localStorageService: LocalStorageService
  ) {}

  getUserDetails(): any {
    const result = this.localStorageService.getItem('STRATEGY-CUES-USER');
    const user = result ? JSON.parse(result) : null;
    return user;
  }

  isLoggedIn(): boolean {
    let user = this.localStorageService.getItem('STRATEGY-CUES-USER') as any;
    if (user) {
      return true;
    }
    return false;
  }

  getAllUser(accountId:string){
    return this.http.get(`${this._url}/get-all-users?accountId=${accountId}`);
  }
  createUser(data: any) {
    return this.http.post<any>(`${this._url}/create-user`, data);
  }
  updateUser(data: any) {
    return this.http.put<any>(`${this._url}/update-user`, data);
  }
  deleteUser(userId:string) {
    return this.http.delete<any>(`${this._url}/delete-user?userId=${userId}`);
  }

  fetchUserDetail(){
    return this.http.get<any>(`${this._url}/get-my-details`);
  }
}
