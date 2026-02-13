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

  addCompetitorsToProperty(data: {
    propertyId: string;
    bookingCompetitors?: Array<{ bookingId: string; bookingLink: string }>;
    airbnbCompetitors?: Array<{ airbnbId: string; airbnbLink: string }>;
  }) {
    return this.http.post<any>(`${this._url}/add-competitors-to-property`, data);
  }

  /**
   * Search hotels by location - calls /api/v1/booking/search-by-location?query=<location>
   */
  searchByLocation(query: string) {
    const params = new HttpParams().set('query', query.trim());
    const url = environment.APIUrl + 'booking/search-by-location';
    return this.http.get<any>(url, { params });
  }

  /**
   * Get hotel details - calls /api/v1/booking/hotel-details/{hotel_id}
   */
  getHotelDetails(hotelId: number) {
    const url = environment.APIUrl + 'booking/hotel-details/' + hotelId;
    return this.http.get<any>(url);
  }
}
