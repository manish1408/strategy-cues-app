import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';



@Injectable({
  providedIn: 'root',
})
export class CompetitorComparisonService {
  private _url = environment.APIUrl + "competitor-comparisons";
  
  constructor(
    private http: HttpClient,
  ) {}



  getCompetitorById(operatorId: string, page: number = 1, limit: number = 10) {
    const params = new HttpParams()
      .set('operator_id', operatorId)
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<any>(`${this._url}/get-comparisons`, { params });
  }

  getPropertyCompetitors(property_id: string) {
    return this.http.get<any>(`${this._url}/get-comparisons-by-property/${property_id}`);
  }

 
}
