import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

export interface ApiFilterPreset {
  _id: string;
  name: string;
  description?: string;
  filters: any;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface FilterPresetsResponse {
  filterPresets: ApiFilterPreset[];
}

@Injectable({
  providedIn: 'root'
})
export class FilterPresetApiService {
  private _url = environment.APIUrl + "filter-presets";

  constructor(private http: HttpClient) {}

  /**
   * Create a new filter preset
   * POST /api/v1/filter-presets/create-filter-preset
   */
  createFilterPreset(operatorId: string, presetData: {
    name: string;
    description?: string;
    filters: any;
  }): Observable<ApiResponse<ApiFilterPreset>> {
    const requestData = {
      ...presetData,
      operator_id: operatorId
    };
    
    console.log('FilterPresetApiService.createFilterPreset called with:', {
      url: `${this._url}/create-filter-preset`,
      operatorId,
      data: requestData
    });

    return this.http.post<ApiResponse<ApiFilterPreset>>(`${this._url}/create-filter-preset`, requestData);
  }

  /**
   * Get all filter presets
   * GET /api/v1/filter-presets/get-filter-presets
   */
  getFilterPresets(operatorId: string): Observable<ApiResponse<FilterPresetsResponse>> {
    const params = new HttpParams().set('operator_id', operatorId);
    
    console.log('FilterPresetApiService.getFilterPresets called with:', {
      url: `${this._url}/get-filter-presets`,
      operatorId,
      params: params.toString()
    });

    return this.http.get<ApiResponse<FilterPresetsResponse>>(`${this._url}/get-filter-presets`, { params });
  }

  /**
   * Get a specific filter preset by ID
   * GET /api/v1/filter-presets/get-filter-preset/{filter_preset_id}
   */
  getFilterPreset(filterPresetId: string): Observable<ApiResponse<ApiFilterPreset>> {
    console.log('FilterPresetApiService.getFilterPreset called with:', {
      url: `${this._url}/get-filter-preset/${filterPresetId}`,
      filterPresetId
    });

    return this.http.get<ApiResponse<ApiFilterPreset>>(`${this._url}/get-filter-preset/${filterPresetId}`);
  }

  /**
   * Update an existing filter preset
   * PUT /api/v1/filter-presets/update-filter-preset/{filter_preset_id}
   */
  updateFilterPreset(filterPresetId: string, presetData: {
    name?: string;
    description?: string;
    filters?: any;
  }): Observable<ApiResponse<ApiFilterPreset>> {
    console.log('FilterPresetApiService.updateFilterPreset called with:', {
      url: `${this._url}/update-filter-preset/${filterPresetId}`,
      filterPresetId,
      data: presetData
    });

    return this.http.put<ApiResponse<ApiFilterPreset>>(`${this._url}/update-filter-preset/${filterPresetId}`, presetData);
  }

  /**
   * Delete a filter preset
   * DELETE /api/v1/filter-presets/delete-filter-preset/{filter_preset_id}
   * 
   * Expected successful response: { "data": {}, "success": true }
   * Possible error responses: 404 (not found), 422 (validation error)
   */
  deleteFilterPreset(filterPresetId: string, operatorId: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('operator_id', operatorId);
    
    console.log('FilterPresetApiService.deleteFilterPreset called with:', {
      url: `${this._url}/delete-filter-preset/${filterPresetId}`,
      filterPresetId,
      operatorId,
      params: params.toString()
    });

    return this.http.delete<ApiResponse<any>>(`${this._url}/delete-filter-preset/${filterPresetId}`, { 
      params,
      observe: 'response' // Get full response to handle different status codes
    }).pipe(
      // Transform the response to match our ApiResponse interface
      map(response => {
        console.log('Raw delete response:', response);
        return {
          data: response.body?.data || {},
          success: response.body?.success || false,
          message: response.body?.message
        };
      }),
      catchError(error => {
        console.error('Delete preset HTTP error:', error);
        // Re-throw the error to be handled by the service
        throw error;
      })
    );
  }
}
