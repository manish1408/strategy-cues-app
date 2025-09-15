import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LocalStorageService } from "./local-storage.service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ListingService {
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  private _url = environment.APIUrl + "listings";

//   getListing(operatorId: string) {
//     return this.http.get<any>(`${this._url}/get-property-urls?operator_id=${operatorId}`);
//   }

  getListings(page: number = 1, limit: number = 10, operatorId: string, sortOrder: string): Observable<any> {
    const params = new HttpParams()
    .set('operator_id', operatorId)
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('sort_order', sortOrder);

    
    return this.http.get<any>(`${this._url}/get-property-urls`, { params });
  }

 

}   