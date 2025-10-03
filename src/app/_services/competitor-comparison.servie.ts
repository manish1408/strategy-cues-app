import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

// Interface for the guest didn't like insights response


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
    return this.http.get<any>(`${this._url}/get-property-competitors/${property_id}`);
  }

  getGuestDidntLikeInCompetitor(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-didnt-like-in-competitor/${property_id}`, { params });
  }


  getGuestWishesInCompetitor(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-wish-they-had-in-competitor/${property_id}`, { params });
  }
  
  getGuestLovedInCompetitor(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-loved-in-competitor/${property_id}`, { params });
  }

  getWhatToImproveBasedOnCompetitor(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/what-to-improve-based-on-competitor/${property_id}`, { params });
  }

  getGuestDidntLikeInMyProperty(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-didnt-like-in-my-property/${property_id}`, { params });
  }
  
  getGuestWishesInMyProperty(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-wish-they-had-my-property/${property_id}`, { params });
  }
  
  getGuestLovedInMyProperty(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/guest-loved-in-my-property/${property_id}`, { params });
  }
  
  getWhatToImproveBasedOnMyProperty(property_id: string, operator_id: string) {
    const params = new HttpParams()
      .set('operator_id', operator_id);
    
    return this.http.get<any>(`${this._url}/what-to-improve-based-on-my-reviews/${property_id}`, { params });
  }

  getConversionBoostersAndAmenities(property_id: string, operator_id: string) {
    const params = new HttpParams()
    .set('operator_id', operator_id);
  
  return this.http.get<any>(`${this._url}/conversion-boosters-and-amenities/${property_id}`, { params });
}
}
