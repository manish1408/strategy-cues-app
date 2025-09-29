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

  deleteCompetitorProperty(data: any, competitor_property_id: string) {
    return this.http.post<any>(`${this._url}/delete-competitor/${competitor_property_id}`, data);
  }

  getCompetitorProperties(operatorId: string, listingId: string) {
    return this.http.get<any>(`${this._url}/get-competitors/${operatorId}/${listingId}`);
  }

 
}
