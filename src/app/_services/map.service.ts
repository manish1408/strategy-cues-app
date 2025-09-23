import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LocalStorageService } from "./local-storage.service";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MapService {
  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  private _url = environment.APIUrl + "mapping";





  mapListing(operatorId: string, bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string): Observable<any> {
    const payload: any = {
      operator_id: operatorId,
     
    };

    if (bookingId) {
        payload.booking_id = bookingId;
      }

    if (airbnbId) {
      payload.airbnb_id = airbnbId;
    }
    if (vrboId) {
      payload.vrbo_id = vrboId;
    }
    if (pricelabsId) {
      payload.pricelabs_id = pricelabsId;
    }
    return this.http.post<any>(`${this._url}/`, payload);
  }

}   