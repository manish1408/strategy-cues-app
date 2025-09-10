import { Injectable } from '@angular/core';

import { LocalStorageService } from './local-storage.service';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
    private _url = environment.APIUrl + "common";
  constructor(
    private http: HttpClient,
private localStorageService: LocalStorageService
  ) {}

  uploadFile(data: any) {
    return this.http.post<any>(`${this._url}/upload-file`, data);
  }
  deleteFile(data: any) {
    return this.http.post<any>(`${this._url}/delete-file`, data);
  }
}
