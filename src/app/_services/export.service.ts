import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';


@Injectable({
    providedIn: 'root',
  })
  export class ExportService {
      private _url = environment.APIUrl + "export";
  constructor(private http: HttpClient) {}

  exportToCSV(operatorId: string) {
    return this.http.get(`${this._url}/properties/${operatorId}`);
  }
            }