import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';


@Injectable({
    providedIn: 'root',
  })
  export class ExportService {
      private _url = environment.APIUrl + "export";
  constructor(private http: HttpClient) {}

  exportToCSVProperties(operatorId: string, filterParams?: any) {
    let url = `${this._url}/properties/${operatorId}`;
    
    // Add query parameters if filterParams are provided
    if (filterParams) {
      let httpParams = new HttpParams();
      Object.keys(filterParams).forEach(key => {
        const value = filterParams[key];
        if (value !== null && value !== undefined && value !== '') {
          // Handle arrays by appending each element separately
          if (Array.isArray(value)) {
            value.forEach(item => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else {
            httpParams = httpParams.append(key, value.toString());
          }
        }
      });
      
      return this.http.get(url, {
        params: httpParams,
        observe: 'response'
      });
    }
    
    return this.http.get(url, {
      observe: 'response'
    });
  }

  exportToCSVContentCues(operatorId: string) {
    return this.http.get(`${this._url}/content-cues/${operatorId}`, {
      observe: 'response'
    });
  }

            }