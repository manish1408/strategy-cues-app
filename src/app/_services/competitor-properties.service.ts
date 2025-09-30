import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';



@Injectable({
  providedIn: 'root',
})
export class CompetitorPropertiesService {
  private _url = environment.APIUrl + "competitor-properties";
  
  constructor(
    private http: HttpClient,
  ) {}

  createCompetitorProperty(data: any) {
    return this.http.post<any>(`${this._url}/create-competitor`, data);
  }

  deleteCompetitorProperty(competitor_property_id: string) {
    return this.http.delete<any>(`${this._url}/delete-competitor/${competitor_property_id}`);
  }

  getCompetitorProperties(property_id: string) {
    return this.http.get<any>(`${this._url}/get-competitors-by-property/${property_id}`);
  }

 
}
