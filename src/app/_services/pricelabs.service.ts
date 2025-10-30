import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LocalStorageService } from "./local-storage.service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class PricelabsService {
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  private _url = environment.APIUrl + "pricelabs-admin";




  syncPricelabs(operatorId: string): Observable<any> {
    return this.http.get<any>(`${this._url}/save-price-labs-admin-data?operator_id=${operatorId}`);
  }

  createAnalyticsReport(operatorId: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this._url}/analytics-report?operator_id=${operatorId}&start_date=${startDate}&end_date=${endDate}`);
  }

  getAnalyticsReport(reportId: string): Observable<any> {
    return this.http.get<any>(`${this._url}/get-analytics-report/${reportId}`);
  }



 

}   