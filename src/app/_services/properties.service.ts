import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  _id: string;
  Listing_Name: string;
  Area: string;
  Room_Type: string;
  Property_Type?: string;
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
  MPI: {
    TM: string | number;
    NM: string | number;
    LYTM: string | number;
  };
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
  BookingCom: any;
  Airbnb: any;
  VRBO: any;
  CXL_Policy: {
    Booking: {
      type: string;
      description: string;
      free_cancellation_until: string | null;
    } | null;
    Airbnb: {
      type: string;
      description: string;
      free_cancellation_until: string | null;
    } | null;
    VRBO: {
      type: string;
      description: string;
      free_cancellation_until: string | null;
    } | null;
  };
  Adult_Child_Config: {
    Booking: {
      id: string;
      max_guests: string;
      max_adults: string;
      max_children: string;
      max_infants: string;
      room_count: string;
    } | null;
    Airbnb: {
      max_guests: number;
    } | null;
    VRBO: any | null;
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
  // New direct URL fields
  BookingUrl?: string;
  AirbnbUrl?: string;
  VRBOUrl?: string;
  PricelabsUrl?: string;
  // New ID fields
  BookingId?: string;
  AirbnbId?: string;
  VRBOId?: string;
  PricelabsId?: string;
  // Photos object
  Photos?: {
    booking?: Array<{
      id: string;
      url: string;
      caption?: string;
      accessibility_label?: string;
      source: string;
    }>;
    airbnb?: Array<{
      id: string;
      url: string;
      caption?: string;
      accessibility_label?: string;
      source: string;
    }>;
    vrbo?: Array<{
      id: string;
      url: string;
      caption?: string;
      accessibility_label?: string;
      source: string;
    }>;
  };
  // Legacy Property_URLs for backward compatibility
  Property_URLs?: {
    Booking?: {
      url: string;
      id: string;
    };
    Airbnb?: {
      url: string;
      id: string;
    };
    VRBO?: {
      url: string;
      id: string;
    };
    Pricelab?: {
      url: string;
      id: string;
    };
  };
  // Additional fields
  operator_id: string;
  listing_id?: string;
  createdAt: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private _url = environment.APIUrl + "properties";
  
  constructor(
    private http: HttpClient,
  ) {}

  getProperties(page: number = 1, limit: number = 10, operatorId: string, sortOrder: string): Observable<ApiResponse<PropertyData[]>> {
    const params = new HttpParams()
    .set('operator_id', operatorId)
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('sort_order', sortOrder);
    
    
    return this.http.get<ApiResponse<PropertyData[]>>(`${this._url}/get-properties`, { params });
  }

  // getPropertiesByOperatorId(operatorId: string) {
  //   return this.http.get<ApiResponse<PropertyData[]>>(`${this._url}/get-properties-by-operator-id?operator_id=${operatorId}`);
  // }

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
      console.log('Using response.data.properties (new API structure)');
      // Map the new API response structure to PropertyData interface
      const mappedProperties = response.data.properties.map((property: any) => ({
        _id: property._id,
        Listing_Name: property.Listing_Name,
        Area: property.Area,
        Room_Type: property.Room_Type,
        Property_Type: property.Property_Type,
        Occupancy: property.Occupancy || {
          '7_days': null,
          '30_days': null,
          TM: null,
          NM: null
        },
        ADR: property.ADR || {
          TM: null,
          NM: null
        },
        RevPAR: property.RevPAR || {
          TM: null,
          NM: null
        },
        MPI: property.MPI || {
          TM: null,
          NM: null,
          LYTM: null
        },
        STLY_Var: property.STLY_Var || {
          Occ: null,
          ADR: null,
          RevPAR: null
        },
        STLM_Var: property.STLM_Var || {
          Occ: null,
          ADR: null,
          RevPAR: null
        },
        Pick_Up_Occ: property.Pick_Up_Occ || {
          '7_Days': null,
          '14_Days': null,
          '30_Days': null
        },
        Min_Rate_Threshold: property.Min_Rate_Threshold || null,
        BookingCom: property.BookingCom || null,
        Airbnb: property.Airbnb || null,
        VRBO: property.VRBO || null,
        CXL_Policy: property.CXL_Policy || {
          Booking: null,
          Airbnb: null,
          VRBO: null
        },
        Adult_Child_Config: property.Adult_Child_Config || {
          Booking: null,
          Airbnb: null,
          VRBO: null
        },
        Reviews: property.Reviews || {
          Booking: {
            Last_Rev_Dt: null,
            Last_Rev_Score: null,
            Rev_Score: null,
            Total_Rev: null,
            Last_Review_Date: null
          },
          Airbnb: {
            Last_Rev_Dt: null,
            Last_Rev_Score: null,
            Rev_Score: null,
            Total_Rev: null,
            Last_Review_Date: null
          },
          VRBO: {
            Last_Rev_Dt: null,
            Last_Rev_Score: null,
            Rev_Score: null,
            Total_Rev: null,
            Last_Review_Date: null
          }
        },
        // New URL fields
        BookingUrl: property.BookingUrl || null,
        AirbnbUrl: property.AirbnbUrl || null,
        VRBOUrl: property.VRBOUrl || null,
        PricelabsUrl: property.PricelabsUrl || null,
        // New ID fields
        BookingId: property.BookingId || null,
        AirbnbId: property.AirbnbId || null,
        VRBOId: property.VRBOId || null,
        PricelabsId: property.PricelabsId || null,
        // Photos object
        Photos: property.Photos || {
          booking: null,
          airbnb: null,
          vrbo: null
        },
        // Legacy Property_URLs for backward compatibility
        Property_URLs: property.Property_URLs || {
          Booking: { url: property.BookingUrl, id: property.BookingId },
          Airbnb: { url: property.AirbnbUrl, id: property.AirbnbId },
          VRBO: { url: property.VRBOUrl, id: property.VRBOId },
          Pricelab: { url: property.PricelabsUrl, id: property.PricelabsId }
        },
        operator_id: property.operator_id,
        listing_id: property.listing_id,
        createdAt: property.createdAt,
        status: property.status
      }));
      console.log('Mapped properties:', mappedProperties);
      return mappedProperties;
    } else if (response.data && Array.isArray(response.data.data)) {
      console.log('Using response.data.data');
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      console.log('Using response.data.results');
      return response.data.results;
    } else {
      // Fallback: try to return response.data directly if it exists
      if (response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
      }
      return [];
    }
  }

  filterProperties(filters: any): Observable<ApiResponse<PropertyData[]>> {
    let params = new HttpParams();
    
    // Add all filter parameters to the query string
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key].toString());
      }
    });
    
    console.log('PropertiesService.filterProperties called with:', {
      url: `${this._url}/filter-properties`,
      params: params.toString()
    });
    
    return this.http.get<ApiResponse<PropertyData[]>>(`${this._url}/filter-properties`, { params });
  }

  createProperty(propertyData: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this._url}/create-property`, propertyData);
  }

  updateProperty(propertyData: any, propertyId: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this._url}/update-property/${propertyId}`, propertyData).pipe(
      catchError((error) => {
        return throwError(() => new Error('Failed to update property'));
      })
    );
  }

  deleteProperty(listingId: string, operatorId: string): Observable<any> {
    const params = new HttpParams().set('operator_id', operatorId);
    return this.http.delete(`${this._url}/delete-property/${listingId}`, { params });
  }

  getProperty(propertyId: string, operatorId: string): Observable<ApiResponse<PropertyData>> {
    const params = new HttpParams().set('operator_id', operatorId);
    return this.http.get<ApiResponse<PropertyData>>(`${this._url}/get-property/${propertyId}`, { params });
  }
}
