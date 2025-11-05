import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';


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
      const queryParams = new URLSearchParams();
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] !== null && filterParams[key] !== undefined && filterParams[key] !== '') {
          queryParams.append(key, filterParams[key]);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
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