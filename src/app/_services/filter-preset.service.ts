import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError } from 'rxjs';
import { FilterPreset } from '../_models/filter-preset.interface';
import { FilterPresetApiService } from './filter-preset-api.service';

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private presetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  public presets$ = this.presetsSubject.asObservable();

  constructor(private filterPresetApiService: FilterPresetApiService) {
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

    this.filterPresetApiService.getFilterPresets(operatorId).subscribe({
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
  getAllPresets(): FilterPreset[] {
    return this.presetsSubject.value;
  }

  /**
   * Get preset by ID
   */
  getPresetById(id: string): FilterPreset | undefined {
    return this.presetsSubject.value.find(preset => preset.id === id);
  }

  /**
   * Save a new preset
   */
  savePreset(name: string, filters: FilterPreset['filters'], description?: string, operatorId?: string): FilterPreset {
    if (!name || name.trim().length === 0) {
      throw new Error('Preset name is required');
    }

    if (!operatorId) {
      throw new Error('Operator ID is required to save preset');
    }

    // Check if name already exists
    const existingPresets = this.presetsSubject.value;
    if (existingPresets.some(preset => preset.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A preset with this name already exists');
    }

    // Create preset via API
    this.filterPresetApiService.createFilterPreset(operatorId, {
      name: name.trim(),
      description: description?.trim(),
      filters: { ...filters }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newPreset: FilterPreset = {
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
    const tempPreset: FilterPreset = {
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
  updatePreset(id: string, updates: Partial<Omit<FilterPreset, 'id' | 'createdAt'>>, operatorId?: string): FilterPreset {
    const existingPresets = this.presetsSubject.value;
    const presetIndex = existingPresets.findIndex(preset => preset.id === id);

    if (presetIndex === -1) {
      throw new Error('Preset not found');
    }

    if (!operatorId) {
      throw new Error('Operator ID is required to update preset');
    }

    // Check if new name conflicts with existing presets (excluding current preset)
    if (updates.name) {
      const nameConflict = existingPresets.some(
        (preset, index) => 
          index !== presetIndex && 
          preset.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (nameConflict) {
        throw new Error('A preset with this name already exists');
      }
    }

    // Update via API
    this.filterPresetApiService.updateFilterPreset(id, {
      name: updates.name?.trim(),
      description: updates.description?.trim(),
      filters: updates.filters
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const updatedPreset: FilterPreset = {
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

    const updatedPreset: FilterPreset = {
      ...existingPresets[presetIndex],
      ...updates,
      name: updates.name ? updates.name.trim() : existingPresets[presetIndex].name,
      description: updates.description ? updates.description.trim() : existingPresets[presetIndex].description,
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
      this.filterPresetApiService.deleteFilterPreset(id, operatorId).subscribe({
        next: (response) => {
          console.log('Delete preset API response:', response);
          
          // According to API docs, successful response should be: { "data": {}, "success": true }
          if (response && response.success === true) {
            console.log('Preset deleted successfully from API');
            // Remove from local state
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true);
            observer.complete();
          } else {
            console.warn('Delete preset API returned unexpected response:', response);
            // Still remove from local state as user requested deletion
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Error deleting preset from API:', error);
          console.log('Error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message
          });
          console.log('Full error object:', JSON.stringify(error, null, 2));
          
          // Handle different error scenarios based on API documentation
          if (error.status === 404) {
            console.warn('Preset not found on backend (404), removing from local state only');
            const filteredPresets = existingPresets.filter(preset => preset.id !== id);
            this.presetsSubject.next(filteredPresets);
            observer.next(true); // Success because preset is gone
            observer.complete();
          } else if (error.status === 400) {
            console.error('Bad request (400):', error.error);
            // Check if it's the specific "Filter preset not found" error
            const errorMessage = error.error?.detail?.error || error.error?.message || '';
            if (errorMessage.includes('Filter preset not found') || errorMessage.includes('not found')) {
              console.warn('Preset not found on backend, removing from local state only');
              const filteredPresets = existingPresets.filter(preset => preset.id !== id);
              this.presetsSubject.next(filteredPresets);
              observer.next(true); // Success because preset is gone
              observer.complete();
            } else {
              console.error('Other 400 error - API operation failed');
              // Don't remove from local state for other 400 errors
              observer.next(false); // Failure - API error
              observer.complete();
            }
          } else if (error.status === 422) {
            console.error('Validation error (422):', error.error);
            // Don't remove from local state for validation errors
            observer.next(false); // Failure - validation error
            observer.complete();
          } else {
            console.error('Unexpected error - API operation failed');
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
  duplicatePreset(id: string, newName: string, operatorId?: string): FilterPreset {
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
   * Get a summary of active filters in a preset
   */
  getPresetSummary(preset: FilterPreset): string[] {
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
}
