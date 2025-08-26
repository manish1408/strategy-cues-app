import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  // private _url = environment.APIUrl;

  constructor(private http: HttpClient) {}

  getUserCountryCode() {
    // return this.http.get<any>(this._url);
  }
}
