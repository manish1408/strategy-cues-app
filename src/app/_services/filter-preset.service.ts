import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment.development';



@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private presetsSubject = new BehaviorSubject<any[]>([]);
  public presets$ = this.presetsSubject.asObservable();
  private _url = environment.APIUrl + "filter-presets";

  constructor(private http: HttpClient) {
    // No automatic loading - will be called explicitly
  }

  /**
   * Load all presets from API
   */
  loadPresets(operatorId: string): void {
    if (!operatorId) {
      this.presetsSubject.next([]);
      return;
    }

    this.getFilterPresets(operatorId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle the response structure - data might be an object with filterPresets property
          let presetsArray = response.data;
          
          // If data is an object with filterPresets property, extract it
          if ((response.data as any).filterPresets && Array.isArray((response.data as any).filterPresets)) {
            presetsArray = (response.data as any).filterPresets;
          }
          
          // Ensure we have an array
          if (Array.isArray(presetsArray)) {
            // Convert API response to local format
            const presets = presetsArray.map(apiPreset => ({
              id: apiPreset._id, // API uses _id field
              name: apiPreset.name,
              description: apiPreset.description,
              createdAt: this.safeDateConversion(apiPreset.createdAt),
              updatedAt: this.safeDateConversion(apiPreset.updatedAt),
              propertyIds: apiPreset.propertyIds || [],
              filters: apiPreset.filters
            }));
            this.presetsSubject.next(presets);
          } else {
            this.presetsSubject.next([]);
          }
        } else {
          this.presetsSubject.next([]);
        }
      },
      error: (error) => {
        this.presetsSubject.next([]);
      }
    });
  }


  /**
   * Get all presets
   */
  getAllPresets(): any[] {
    return this.presetsSubject.value;
  }

  /**
   * Get preset by ID
   */
  getPresetById(id: string): any | undefined {
    return this.presetsSubject.value.find(preset => preset.id === id);
  }

  /**
   * Fetch a specific preset from API
   */
  fetchPresetById(presetId: string, operatorId: string): Observable<any> {
    return this.getFilterPreset(presetId, operatorId).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Failed to fetch preset from API');
        }
        
        // Convert API response to FilterPreset format
        const apiPreset = response.data;
        const preset = {
          id: apiPreset._id,
          name: apiPreset.name,
          description: apiPreset.description,
          filters: apiPreset.filters || {},
          propertyIds: apiPreset.propertyIds || [], // Fixed: propertyIds are at root level, not inside filters
          createdAt: new Date(apiPreset.createdAt),
          updatedAt: new Date(apiPreset.updatedAt)
        };
        
        return preset;
      })
    );
  }

  /**
   * Save a new preset
   */
  savePreset(name: string, filters: any, description?: string, operatorId?: string, propertyIds?: string[], isAllPropertiesSelected?: boolean): any {
    if (!name || name.trim().length === 0) {
      throw new Error('Preset name is required');
    }

    if (!operatorId) {
      throw new Error('Operator ID is required to save preset');
    }

    // Validate that either filters or propertyIds is provided and not empty
    const hasActiveFilters = this.hasActiveFilters(filters);
    const hasPropertyIds = propertyIds && propertyIds.length > 0;
    
    if (!hasActiveFilters && !hasPropertyIds) {
      throw new Error('Either filters or property IDs must be provided to save a preset');
    }

    // Check if name already exists
    const existingPresets = this.presetsSubject.value;
    if (existingPresets.some(preset => preset.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A preset with this name already exists');
    }

    // Use the passed isAllPropertiesSelected parameter, default to false if not provided
    const isAllPropertiesSelectedValue = isAllPropertiesSelected ?? false;

    // Create preset via API
    this.createFilterPreset(operatorId, {
      name: name.trim(),
      description: description?.trim(),
      filters: { ...filters },
      propertyIds: propertyIds
    }, isAllPropertiesSelectedValue).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newPreset = {
            id: response.data._id,
            name: response.data.name,
            description: response.data.description,
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
            filters: response.data.filters
          };

          const updatedPresets = [...existingPresets, newPreset];
          this.presetsSubject.next(updatedPresets);
        }
      },
      error: (error) => {
        throw new Error('Failed to save preset to server');
      }
    });

    // Return temporary preset for immediate UI update
    const tempPreset = {
      id: this.generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      filters: { ...filters }
    };

    return tempPreset;
  }


  /**
   * Update an existing preset
   */
  updatePreset(id: string, updates: Partial<Omit<any, 'id' | 'createdAt'>>, operatorId?: string): any {
    const existingPresets = this.presetsSubject.value;
    const presetIndex = existingPresets.findIndex(preset => preset.id === id);

    if (presetIndex === -1) {
      throw new Error('Preset not found');
    }

    if (!operatorId) {
      throw new Error('Operator ID is required to update preset');
    }

    // Check if new name conflicts with existing presets (excluding current preset)
    if (updates['name']) {
      const nameConflict = existingPresets.some(
        (preset, index) => 
          index !== presetIndex && 
          preset.name.toLowerCase() === updates['name']!.trim().toLowerCase()
      );
      if (nameConflict) {
        throw new Error('A preset with this name already exists');
      }
    }

    // Update via API
    this.updateFilterPreset(id, operatorId, {
      name: updates['name']?.trim(),
      description: updates['description']?.trim(),
      filters: updates['filters']
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const updatedPreset = {
            id: response.data._id,
            name: response.data.name,
            description: response.data.description,
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
            filters: response.data.filters
          };

          const updatedPresets = [...existingPresets];
          updatedPresets[presetIndex] = updatedPreset;
          this.presetsSubject.next(updatedPresets);
        }
      },
      error: (error) => {
        throw new Error('Failed to update preset on server');
      }
    });

    const updatedPreset = {
      ...existingPresets[presetIndex],
      ...updates,
      name: updates['name'] ? updates['name'].trim() : existingPresets[presetIndex].name,
      description: updates['description'] ? updates['description'].trim() : existingPresets[presetIndex].description,
      updatedAt: new Date()
    };
    
    return updatedPreset;
  }
  
  /**
   * Delete a preset
   */
  deletePreset(id: string, operatorId?: string): Observable<boolean> {
    const existingPresets = this.presetsSubject.value;
    const presetToDelete = existingPresets.find(preset => preset.id === id);

    if (!presetToDelete) {
      return of(false); // Preset not found
    }

    if (!operatorId) {
      return of(false);
    }
    
    return new Observable<boolean>(observer => {
      this.deleteFilterPreset(id, operatorId).subscribe({
        next: (response) => {
          // According to API docs, successful response should be: { "data": {}, "success": true }
          if (response && response.success === true) {
            // Remove from local state
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true);
            observer.complete();
          } else {
            // Still remove from local state as user requested deletion
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true);
            observer.complete();
          }
        },
        error: (error) => {
          
          // Handle different error scenarios based on API documentation
          if (error.status === 404) {
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true); // Success because preset is gone
            observer.complete();
          } else if (error.status === 400) {
            // Check if it's the specific "Filter preset not found" error
            const errorMessage = error.error?.detail?.error || error.error?.message || '';
            if (errorMessage.includes('Filter preset not found') || errorMessage.includes('not found')) {
              const filteredPresets = existingPresets.filter(preset => preset.id !== id);
              this.presetsSubject.next(filteredPresets);
              observer.next(true); // Success because preset is gone
              observer.complete();
            } else {
              // Don't remove from local state for other 400 errors
              observer.next(false); // Failure - API error
              observer.complete();
            }
          } else if (error.status === 422) {
            // Don't remove from local state for validation errors
            observer.next(false); // Failure - validation error
            observer.complete();
          } else {
            // Don't remove from local state for unexpected errors
            observer.next(false); // Failure - unexpected error
            observer.complete();
          }
        }
      });
    });
  }


  /**
   * Duplicate a preset with a new name
   */
  duplicatePreset(id: string, newName: string, operatorId?: string): any {
    const existingPreset = this.getPresetById(id);
    if (!existingPreset) {
      throw new Error('Preset not found');
    }

    if (!operatorId) {
      throw new Error('Operator ID is required to duplicate preset');
    }

    return this.savePreset(
      newName, 
      existingPreset.filters, 
      `Copy of ${existingPreset.description || existingPreset.name}`,
      operatorId
    );
  }

  /**
   * Check if preset name is available
   */
  isNameAvailable(name: string, excludeId?: string): boolean {
    const existingPresets = this.presetsSubject.value;
    return !existingPresets.some(preset => 
      preset.id !== excludeId && 
      preset.name.toLowerCase() === name.trim().toLowerCase()
    );
  }

  /**
   * Get preset count
   */
  getPresetCount(): number {
    return this.presetsSubject.value.length;
  }



  /**
   * Generate a unique ID for presets
   */
  private generateId(): string {
    return 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Safely convert date strings to Date objects
   */
  private safeDateConversion(dateString: any): Date {
    if (!dateString) return new Date();
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'string') {
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  }

  /**
   * Check if filters object has any active filters
   */
  private hasActiveFilters(filters: any): boolean {
    // Basic filters
    if (filters.selectedArea || filters.selectedRoomType) return true;

    // Range filters
    if (filters.adrMin !== null || filters.adrMax !== null ||
        filters.revparMin !== null || filters.revparMax !== null ||
        filters.mpiMin !== null || filters.mpiMax !== null ||
        filters.minRateThresholdMin !== null || filters.minRateThresholdMax !== null) {
      return true;
    }

    // Occupancy filters
    if (filters.occupancyTMMin !== null || filters.occupancyTMMax !== null ||
        filters.occupancyNMMin !== null || filters.occupancyNMMax !== null ||
        filters.occupancy7DaysMin !== null || filters.occupancy7DaysMax !== null ||
        filters.occupancy30DaysMin !== null || filters.occupancy30DaysMax !== null ||
        filters.pickUpOcc7DaysMin !== null || filters.pickUpOcc7DaysMax !== null ||
        filters.pickUpOcc14DaysMin !== null || filters.pickUpOcc14DaysMax !== null ||
        filters.pickUpOcc30DaysMin !== null || filters.pickUpOcc30DaysMax !== null) {
      return true;
    }

    // Performance filters
    if (filters.stlyVarOccMin !== null || filters.stlyVarOccMax !== null ||
        filters.stlyVarADRMin !== null || filters.stlyVarADRMax !== null ||
        filters.stlyVarRevPARMin !== null || filters.stlyVarRevPARMax !== null ||
        filters.stlmVarOccMin !== null || filters.stlmVarOccMax !== null ||
        filters.stlmVarADRMin !== null || filters.stlmVarADRMax !== null ||
        filters.stlmVarRevPARMin !== null || filters.stlmVarRevPARMax !== null) {
      return true;
    }

    // Platform filters
    const platformFilters = [
      filters.bookingGeniusFilter, filters.bookingMobileFilter, filters.bookingPrefFilter,
      filters.bookingWeeklyFilter, filters.bookingMonthlyFilter, filters.bookingLMDiscFilter,
      filters.airbnbWeeklyFilter, filters.airbnbMonthlyFilter, filters.airbnbMemberFilter,
      filters.airbnbLMDiscFilter, filters.vrboWeeklyFilter, filters.vrboMonthlyFilter
    ];
    if (platformFilters.some(f => f && f !== 'not-present')) return true;

    // Reviews filters
    if (filters.bookingRevScoreMin !== null || filters.bookingRevScoreMax !== null ||
        filters.bookingTotalRevMin !== null || filters.bookingTotalRevMax !== null ||
        filters.airbnbRevScoreMin !== null || filters.airbnbRevScoreMax !== null ||
        filters.airbnbTotalRevMin !== null || filters.airbnbTotalRevMax !== null ||
        filters.vrboRevScoreMin !== null || filters.vrboRevScoreMax !== null ||
        filters.vrboTotalRevMin !== null || filters.vrboTotalRevMax !== null) {
      return true;
    }

    return false;
  }

  /**
   * Get a summary of active filters in a preset
   */
  getPresetSummary(preset: any): string[] {
    const summary: string[] = [];
    const filters = preset.filters;

    // Basic filters
    if (filters.selectedArea) summary.push(`Area: ${filters.selectedArea}`);
    if (filters.selectedRoomType) summary.push(`Room Type: ${filters.selectedRoomType}`);

    // Range filters
    if (filters.adrMin !== null || filters.adrMax !== null) {
      summary.push(`ADR: $${filters.adrMin || 0} - $${filters.adrMax || '∞'}`);
    }
    if (filters.revparMin !== null || filters.revparMax !== null) {
      summary.push(`RevPAR: $${filters.revparMin || 0} - $${filters.revparMax || '∞'}`);
    }
    if (filters.mpiMin !== null || filters.mpiMax !== null) {
      summary.push(`MPI: ${filters.mpiMin || 0}% - ${filters.mpiMax || '∞'}%`);
    }

    // Platform filters
    const platformFilters = [
      filters.bookingGeniusFilter, filters.bookingMobileFilter, filters.bookingPrefFilter,
      filters.bookingWeeklyFilter, filters.bookingMonthlyFilter, filters.bookingLMDiscFilter,
      filters.airbnbWeeklyFilter, filters.airbnbMonthlyFilter, filters.airbnbMemberFilter,
      filters.airbnbLMDiscFilter, filters.vrboWeeklyFilter, filters.vrboMonthlyFilter
    ].filter(f => f && f !== 'not-present').length;

    if (platformFilters > 0) {
      summary.push(`${platformFilters} platform filter${platformFilters > 1 ? 's' : ''}`);
    }

    // Performance filters
    const performanceFilters = [
      filters.stlyVarOccMin, filters.stlyVarOccMax, filters.stlyVarADRMin, filters.stlyVarADRMax,
      filters.stlyVarRevPARMin, filters.stlyVarRevPARMax, filters.stlmVarOccMin, filters.stlmVarOccMax,
      filters.stlmVarADRMin, filters.stlmVarADRMax, filters.stlmVarRevPARMin, filters.stlmVarRevPARMax
    ].filter(f => f !== null && f !== undefined).length;

    if (performanceFilters > 0) {
      summary.push(`${Math.ceil(performanceFilters / 2)} performance filter${performanceFilters > 2 ? 's' : ''}`);
    }

    return summary.length > 0 ? summary : ['No active filters'];
  }

  // ===== API METHODS =====

  /**
   * Create a new filter preset
   * POST /api/v1/filter-presets/create-filter-preset
   */
  private createFilterPreset(operatorId: string, presetData: {
    name: string;
    description?: string;
    filters: any;
    propertyIds?: string[];
  }, isAllPropertiesSelected: boolean = false): Observable<any> {
    const requestData = {
      ...presetData,
      operator_id: operatorId,
      isAllpropertiesSelected: isAllPropertiesSelected
    };
    

    return this.http.post<any>(`${this._url}/create-filter-preset`, requestData);
  }

  /**
   * Get all filter presets
   * GET /api/v1/filter-presets/get-filter-presets
   */
  private getFilterPresets(operatorId: string): Observable<any> {
    const params = new HttpParams().set('operator_id', operatorId);
    

    return this.http.get<any>(`${this._url}/get-filter-presets`, { params });
  }

  /**
   * Get a specific filter preset by ID
   * GET /api/v1/filter-presets/get-filter-preset/{filter_preset_id}
   */
  private getFilterPreset(filterPresetId: string, operatorId: string): Observable<any> {
    const params = new HttpParams().set('operator_id', operatorId);
    

    return this.http.get<any>(`${this._url}/get-filter-preset/${filterPresetId}`, { params });
  }

  /**
   * Update an existing filter preset
   * PUT /api/v1/filter-presets/update-filter-preset/{filter_preset_id}
   */
  private updateFilterPreset(filterPresetId: string,operatorId: string, presetData: {
    name?: string;
    description?: string;
    filters?: any;
  }): Observable<any> {
    console.log('FilterPresetService.updateFilterPreset called with:', {
      url: `${this._url}/update-filter-preset/${filterPresetId}?operator_id=${operatorId}`,
      filterPresetId,
      data: presetData
    });

    return this.http.put<any>(`${this._url}/update-filter-preset/${filterPresetId}?operator_id=${operatorId}`, presetData);
  }

  /**
   * Delete a filter preset
   * DELETE /api/v1/filter-presets/delete-filter-preset/{filter_preset_id}
   * 
   * Expected successful response: { "data": {}, "success": true }
   * Possible error responses: 404 (not found), 422 (validation error)
   */
  private deleteFilterPreset(filterPresetId: string, operatorId: string): Observable<any> {
    const params = new HttpParams().set('operator_id', operatorId);
    

    return this.http.delete<any>(`${this._url}/delete-filter-preset/${filterPresetId}`, { 
      params,
      observe: 'response' // Get full response to handle different status codes
    }).pipe(
      // Transform the response to match our ApiResponse interface
      map(response => {
        return {
          data: response.body?.data || {},
          success: response.body?.success || false,
          message: response.body?.message
        };
      }),
      catchError(error => {
        // Re-throw the error to be handled by the service
        throw error;
      })
    );
  }
}
