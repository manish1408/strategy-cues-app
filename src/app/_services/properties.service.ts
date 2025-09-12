import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    total_pages: number;
    limit: number;
  };
}

export interface PropertyData {
  Listing_Name: string;
  Area: string;
  Room_Type: string;
  Occupancy: {
    '7_days': string | number;
    '30_days': string | number;
    TM: string | number;
    NM: string | number;
  };
  ADR: {
    TM: string | number;
    NM: string | number;
  };
  RevPAR: {
    TM: string | number;
    NM: string | number;
  };
  MPI: string | number;
  STLY_Var: {
    Occ: string | number;
    ADR: string | number;
    RevPAR: string | number;
  };
  STLM_Var: {
    Occ: string | number;
    ADR: string | number;
    RevPAR: string | number;
  };
  Pick_Up_Occ: {
    '7_Days': string | number;
    '14_Days': string | number;
    '30_Days': string | number;
  };
  Min_Rate_Threshold: string | number;
  BookingCom: {
    Genius: string;
    Mobile: string;
    Pref: string;
    Weekly: string;
    Monthly: string;
    LM_Disc: string;
  };
  Airbnb: {
    Weekly: string;
    Monthly: string;
    Member: string;
    LM_Disc: string;
  };
  VRBO: {
    Weekly: string;
    Monthly: string;
  };
  CXL_Policy: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
  Adult_Child_Config: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
  Reviews: {
    Booking: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string | number;
      Rev_Score: string | number;
      Total_Rev: string | number;
      Last_Review_Date: string;
    };
    Airbnb: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string | number;
      Rev_Score: string | number;
      Total_Rev: string | number;
      Last_Review_Date: string;
    };
    VRBO: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string | number;
      Rev_Score: string | number;
      Total_Rev: string | number;
      Last_Review_Date: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private _url = environment.APIUrl + "properties";
  
  constructor(
    private http: HttpClient,
  ) {}

  getProperties(page: number = 1, limit: number = 10): Observable<ApiResponse<PropertyData[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<PropertyData[]>>(`${this._url}/get-properties`, { params });
  }

  // getProperties(page: number, limit: number) {
  //   return this.http.get(`/api/properties?page=${page}&limit=${limit}`);
  // }

  // Helper method to extract properties array from different response structures
  static extractPropertiesArray(response: any): PropertyData[] {
    if (!response || !response.success) {
      return [];
    }

    // Handle different possible response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.properties)) {
      return response.data.properties;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else {
      console.warn('Unexpected API response structure:', response);
      return [];
    }
  }

  filterProperties(filters: any): Observable<ApiResponse<PropertyData[]>> {
    return this.http.post<ApiResponse<PropertyData[]>>(`${this._url}/filter-properties`, filters);
  }

  createProperty(propertyData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this._url}/create-property`, propertyData);
  }

  updateProperty(propertyData: any, propertyId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this._url}/update-property/${propertyId}`, propertyData);
  }

  deleteProperty(propertyId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this._url}/delete-property/${propertyId}`);
  }
}
