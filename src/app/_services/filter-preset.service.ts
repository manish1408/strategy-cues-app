import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError } from 'rxjs';
import { FilterPreset } from '../_models/filter-preset.interface';
import { FilterPresetApiService } from './filter-preset-api.service';

@Injectable({
  providedIn: 'root'
})
export class FilterPresetService {
  private readonly STORAGE_KEY = 'revenue_filter_presets';
  private presetsSubject = new BehaviorSubject<FilterPreset[]>([]);
  public presets$ = this.presetsSubject.asObservable();

  constructor(private filterPresetApiService: FilterPresetApiService) {
    this.loadPresets();
  }

  /**
   * Load all presets from API
   */
  loadPresets(operatorId?: string): void {
    if (operatorId) {
      this.filterPresetApiService.getFilterPresets(operatorId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Convert API response to local format
            const presets = response.data.map(apiPreset => ({
              id: apiPreset.id,
              name: apiPreset.name,
              description: apiPreset.description,
              createdAt: new Date(apiPreset.created_at),
              updatedAt: new Date(apiPreset.updated_at),
              filters: apiPreset.filters
            }));
            this.presetsSubject.next(presets);
          }
        },
        error: (error) => {
          console.error('Error loading filter presets from API:', error);
          // Fallback to localStorage if API fails
          this.loadPresetsFromStorage();
        }
      });
    } else {
      // Fallback to localStorage if no operatorId
      this.loadPresetsFromStorage();
    }
  }

  /**
   * Fallback: Load presets from localStorage
   */
  private loadPresetsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const presets = JSON.parse(stored) as FilterPreset[];
        // Convert date strings back to Date objects
        presets.forEach(preset => {
          preset.createdAt = new Date(preset.createdAt);
          preset.updatedAt = new Date(preset.updatedAt);
        });
        this.presetsSubject.next(presets);
      }
    } catch (error) {
      console.error('Error loading filter presets from storage:', error);
      this.presetsSubject.next([]);
    }
  }

  /**
   * Save presets to localStorage
   */
  private saveToStorage(presets: FilterPreset[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving filter presets:', error);
      throw new Error('Failed to save filter preset. Storage may be full.');
    }
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

    // Check if name already exists
    const existingPresets = this.presetsSubject.value;
    if (existingPresets.some(preset => preset.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A preset with this name already exists');
    }

    // Create preset via API if operatorId is available
    if (operatorId) {
      this.filterPresetApiService.createFilterPreset(operatorId, {
        name: name.trim(),
        description: description?.trim(),
        filters: { ...filters }
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const newPreset: FilterPreset = {
              id: response.data.id,
              name: response.data.name,
              description: response.data.description,
              createdAt: new Date(response.data.created_at),
              updatedAt: new Date(response.data.updated_at),
              filters: response.data.filters
            };

            const updatedPresets = [...existingPresets, newPreset];
            this.presetsSubject.next(updatedPresets);
          }
        },
        error: (error) => {
          console.error('Error saving preset to API:', error);
          // Fallback to localStorage
          this.savePresetToStorage(name, filters, description);
        }
      });
    } else {
      // Fallback to localStorage if no operatorId
      this.savePresetToStorage(name, filters, description);
    }

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
   * Fallback: Save preset to localStorage
   */
  private savePresetToStorage(name: string, filters: FilterPreset['filters'], description?: string): FilterPreset {
    const newPreset: FilterPreset = {
      id: this.generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      filters: { ...filters }
    };

    const existingPresets = this.presetsSubject.value;
    const updatedPresets = [...existingPresets, newPreset];
    this.saveToStorage(updatedPresets);
    this.presetsSubject.next(updatedPresets);

    return newPreset;
  }

  /**
   * Update an existing preset
   */
  updatePreset(id: string, updates: Partial<Omit<FilterPreset, 'id' | 'createdAt'>>): FilterPreset {
    const existingPresets = this.presetsSubject.value;
    const presetIndex = existingPresets.findIndex(preset => preset.id === id);

    if (presetIndex === -1) {
      throw new Error('Preset not found');
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

    const updatedPreset: FilterPreset = {
      ...existingPresets[presetIndex],
      ...updates,
      name: updates.name ? updates.name.trim() : existingPresets[presetIndex].name,
      description: updates.description ? updates.description.trim() : existingPresets[presetIndex].description,
      updatedAt: new Date()
    };

    const updatedPresets = [...existingPresets];
    updatedPresets[presetIndex] = updatedPreset;

    this.saveToStorage(updatedPresets);
    this.presetsSubject.next(updatedPresets);

    return updatedPreset;
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const existingPresets = this.presetsSubject.value;
    const presetToDelete = existingPresets.find(preset => preset.id === id);

    if (!presetToDelete) {
      return false; // Preset not found
    }

    // Delete via API
    this.filterPresetApiService.deleteFilterPreset(id).subscribe({
      next: (response) => {
        if (response.success) {
          const filteredPresets = existingPresets.filter(preset => preset.id !== id);
          this.presetsSubject.next(filteredPresets);
        }
      },
      error: (error) => {
        console.error('Error deleting preset from API:', error);
        // Fallback to localStorage
        this.deletePresetFromStorage(id);
      }
    });

    return true;
  }

  /**
   * Fallback: Delete preset from localStorage
   */
  private deletePresetFromStorage(id: string): boolean {
    const existingPresets = this.presetsSubject.value;
    const filteredPresets = existingPresets.filter(preset => preset.id !== id);

    if (filteredPresets.length === existingPresets.length) {
      return false; // Preset not found
    }

    this.saveToStorage(filteredPresets);
    this.presetsSubject.next(filteredPresets);
    return true;
  }

  /**
   * Duplicate a preset with a new name
   */
  duplicatePreset(id: string, newName: string): FilterPreset {
    const existingPreset = this.getPresetById(id);
    if (!existingPreset) {
      throw new Error('Preset not found');
    }

    return this.savePreset(
      newName, 
      existingPreset.filters, 
      `Copy of ${existingPreset.description || existingPreset.name}`
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
   * Export presets as JSON
   */
  exportPresets(): string {
    return JSON.stringify(this.presetsSubject.value, null, 2);
  }

  /**
   * Import presets from JSON
   */
  importPresets(jsonData: string, replaceExisting: boolean = false): number {
    try {
      const importedPresets = JSON.parse(jsonData) as FilterPreset[];
      
      // Validate imported data
      if (!Array.isArray(importedPresets)) {
        throw new Error('Invalid preset data format');
      }

      // Validate each preset
      importedPresets.forEach((preset, index) => {
        if (!preset.id || !preset.name || !preset.filters) {
          throw new Error(`Invalid preset at index ${index}`);
        }
      });

      let existingPresets = replaceExisting ? [] : this.presetsSubject.value;
      let importedCount = 0;

      importedPresets.forEach(preset => {
        // Generate new ID to avoid conflicts
        const newPreset = {
          ...preset,
          id: this.generateId(),
          createdAt: new Date(preset.createdAt),
          updatedAt: new Date(),
        };

        // Handle name conflicts
        let finalName = preset.name;
        let counter = 1;
        while (existingPresets.some(p => p.name.toLowerCase() === finalName.toLowerCase())) {
          finalName = `${preset.name} (${counter})`;
          counter++;
        }
        newPreset.name = finalName;

        existingPresets.push(newPreset);
        importedCount++;
      });

      this.saveToStorage(existingPresets);
      this.presetsSubject.next(existingPresets);

      return importedCount;
    } catch (error) {
      console.error('Error importing presets:', error);
      throw new Error('Failed to import presets. Please check the file format.');
    }
  }

  /**
   * Clear all presets
   */
  clearAllPresets(): void {
    this.saveToStorage([]);
    this.presetsSubject.next([]);
  }

  /**
   * Generate a unique ID for presets
   */
  private generateId(): string {
    return 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
