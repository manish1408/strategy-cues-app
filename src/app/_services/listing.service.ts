import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { LocalStorageService } from "./local-storage.service";
import { Observable } from "rxjs";
import { PropertyStatus } from "../_models/status.model";

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

  syncListing(operatorId: string, bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string): Observable<any> {
    const payload: any = {
      operatorId: operatorId
    };

    if (bookingId) {
        payload.bookingId = bookingId;
      }

    if (airbnbId) {
      payload.airbnbId = airbnbId;
    }
    if (vrboId) {
      payload.vrboId = vrboId;
    }
    if (pricelabsId) {
      payload.pricelabsId = pricelabsId;
    }
    return this.http.post<any>(`${this._url}/scrape-listing`, payload);
  }

  fetchStatus(propertyId: string, operatorId: string): Observable<any> {
    const params = new HttpParams()
      .set('operator_id', operatorId);
    
    return this.http.get<any>(`${this._url}/get-property/${propertyId}`, { params });
  }

  scrapeAndMapListing(operatorId: string, bookingId?: string, airbnbId?: string, vrboId?: string, pricelabsId?: string): Observable<any> {
    const payload: any = {
      operatorId: operatorId
    };

    if (bookingId) {
      payload.bookingId = bookingId;
    }

    if (airbnbId) {
      payload.airbnbId = airbnbId;
    }

    if (vrboId) {
      payload.vrboId = vrboId;
    }

    if (pricelabsId) {
      payload.pricelabsId = pricelabsId;
    }

    return this.http.post<any>(`${this._url}/scrape-and-map-listing`, payload);
  }

  uploadExcelForListing(file: File, operatorId: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operator_id', operatorId);

    return this.http.post<any>(`${this._url}/upload_excel_for_listing`, formData);
  }

  
}   