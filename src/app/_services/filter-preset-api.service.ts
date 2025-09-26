import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: any;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
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
  }): Observable<ApiResponse<FilterPreset>> {
    const requestData = {
      ...presetData,
      operator_id: operatorId
    };
    
    console.log('FilterPresetApiService.createFilterPreset called with:', {
      url: `${this._url}/create-filter-preset`,
      operatorId,
      data: requestData
    });

    return this.http.post<ApiResponse<FilterPreset>>(`${this._url}/create-filter-preset`, requestData);
  }

  /**
   * Get all filter presets
   * GET /api/v1/filter-presets/get-filter-presets
   */
  getFilterPresets(operatorId: string): Observable<ApiResponse<FilterPreset[]>> {
    const params = new HttpParams().set('operator_id', operatorId);
    
    console.log('FilterPresetApiService.getFilterPresets called with:', {
      url: `${this._url}/get-filter-presets`,
      operatorId,
      params: params.toString()
    });

    return this.http.get<ApiResponse<FilterPreset[]>>(`${this._url}/get-filter-presets`, { params });
  }

  /**
   * Get a specific filter preset by ID
   * GET /api/v1/filter-presets/get-filter-preset/{filter_preset_id}
   */
  getFilterPreset(filterPresetId: string): Observable<ApiResponse<FilterPreset>> {
    console.log('FilterPresetApiService.getFilterPreset called with:', {
      url: `${this._url}/get-filter-preset/${filterPresetId}`,
      filterPresetId
    });

    return this.http.get<ApiResponse<FilterPreset>>(`${this._url}/get-filter-preset/${filterPresetId}`);
  }

  /**
   * Update an existing filter preset
   * PUT /api/v1/filter-presets/update-filter-preset/{filter_preset_id}
   */
  updateFilterPreset(filterPresetId: string, presetData: {
    name?: string;
    description?: string;
    filters?: any;
  }): Observable<ApiResponse<FilterPreset>> {
    console.log('FilterPresetApiService.updateFilterPreset called with:', {
      url: `${this._url}/update-filter-preset/${filterPresetId}`,
      filterPresetId,
      data: presetData
    });

    return this.http.put<ApiResponse<FilterPreset>>(`${this._url}/update-filter-preset/${filterPresetId}`, presetData);
  }

  /**
   * Delete a filter preset
   * DELETE /api/v1/filter-presets/delete-filter-preset/{filter_preset_id}
   */
  deleteFilterPreset(filterPresetId: string): Observable<ApiResponse<any>> {
    console.log('FilterPresetApiService.deleteFilterPreset called with:', {
      url: `${this._url}/delete-filter-preset/${filterPresetId}`,
      filterPresetId
    });

    return this.http.delete<ApiResponse<any>>(`${this._url}/delete-filter-preset/${filterPresetId}`);
  }
}
