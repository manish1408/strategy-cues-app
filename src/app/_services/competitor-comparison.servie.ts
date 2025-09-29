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



  getCompetitorById(competitorId: string) {
    return this.http.get<any>(`${this._url}/get-comparisons-by-operator-id?operator_id=${competitorId}`);
  }

 
}
