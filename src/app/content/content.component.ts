import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CompetitorComparisonService } from '../_services/competitor-comparison.servie';
import { LocalStorageService } from '../_services/local-storage.service';
import photoComparisonData from '../json_data/photo_comparison_data.json';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit, OnDestroy {
  // Data properties
  photoComparisonData: any[] = [];
  filteredData: any[] = [];
  
  // UI state properties
  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;
  
  // Configuration properties
  operatorId: string = '';
  Math = Math;
  
  // Subscription management
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private competitorComparisonService: CompetitorComparisonService,
    private localStorageService: LocalStorageService
  ) { }

  ngOnInit(): void {
    this.initializeOperatorId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeOperatorId(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.operatorId = params['operatorId'] || 
                         this.localStorageService.getSelectedOperatorId() || 
                         '';
        
        if (this.operatorId) {
          this.loadCompetitorComparisonData();
        } else {
          this.handleError('Operator ID not available');
        }
      });
  }

  private loadCompetitorComparisonData(): void {
    this.setLoadingState(true);
    this.clearError();
    
    this.competitorComparisonService.getCompetitorById(this.operatorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.handleApiResponse(response);
        },
        error: (error: any) => {
          this.handleApiError(error);
        }
      });
  }

  private handleApiResponse(response: any): void {
    if (response?.data?.comparisons) {
      this.photoComparisonData = this.transformApiDataToPhotoComparison(response.data.comparisons);
      this.filteredData = [...this.photoComparisonData];
      this.setLoadingState(false);
    } else {
      this.handleError('No comparison data available');
    }
  }

  private handleApiError(error: any): void {
    console.error('Error loading competitor comparison data:', error);
    this.handleError('Failed to load competitor data. Using fallback data.');
    this.loadFallbackData();
  }

  private handleError(message: string): void {
    this.error = message;
    this.setLoadingState(false);
    this.loadFallbackData();
  }

  private loadFallbackData(): void {
    this.photoComparisonData = photoComparisonData;
    this.filteredData = [...photoComparisonData];
  }

  private setLoadingState(loading: boolean): void {
    this.loading = loading;
  }

  private clearError(): void {
    this.error = null;
  }

  private transformApiDataToPhotoComparison(comparisons: any[]): any[] {
    if (!Array.isArray(comparisons)) {
      return [];
    }

    return comparisons.map(comparison => this.transformSingleComparison(comparison));
  }

  private transformSingleComparison(comparison: any): any {
    return {
      // Basic property information
      property_id: comparison.propertyId || '',
      listing_name: comparison.listingName || '',
      
      // Platform IDs and links
      booking_id: comparison.bookingId || '',
      booking_link: comparison.bookingLink || '',
      airbnb_id: comparison.airbnbId || '',
      airbnb_link: comparison.airbnbLink || '',
      vrbo_id: comparison.vrboId || '',
      vrbo_link: comparison.vrboLink || '',
      
      // Booking.com photo data
      num_photos: this.getNestedValue(comparison, 'bookingPhotos.count', 0),
      captioned_count: this.getNestedValue(comparison, 'bookingPhotos.withCaption', 0),
      missing_captions: this.getNestedValue(comparison, 'bookingPhotos.missingCaption', 0),
      
      // Airbnb photo data
      airbnb_photos: this.getNestedValue(comparison, 'airbnbPhotos.count', 0),
      airbnb_captioned: this.getNestedValue(comparison, 'airbnbPhotos.withCaption', 0),
      airbnb_missing: this.getNestedValue(comparison, 'airbnbPhotos.missingCaption', 0),
      
      // VRBO photo data
      vrbo_photos: this.getNestedValue(comparison, 'vrboPhotos.count', 0),
      vrbo_captioned: this.getNestedValue(comparison, 'vrboPhotos.withCaption', 0),
      vrbo_missing: this.getNestedValue(comparison, 'vrboPhotos.missingCaption', 0),
      
      // Review data
      booking_reviews: this.getNestedValue(comparison, 'bookingReviews.total', 0),
      booking_score: this.getNestedValue(comparison, 'bookingReviews.score', 0),
      airbnb_reviews: this.getNestedValue(comparison, 'airbnbReviews.total', 0),
      airbnb_score: this.getNestedValue(comparison, 'airbnbReviews.score', 0),
      vrbo_reviews: this.getNestedValue(comparison, 'vrboReviews.total', 0),
      vrbo_score: this.getNestedValue(comparison, 'vrboReviews.score', 0),
      
      // Competitors data
      competitors: Array.isArray(comparison.competitors) ? comparison.competitors : []
    };
  }

  private getNestedValue(obj: any, path: string, defaultValue: any = 0): any {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  }


  // ==================== PUBLIC API METHODS ====================
  
  // Summary statistics
  getTotalProperties(): number {
    return this.photoComparisonData.length;
  }

  // Competitor-related methods
  getCompetitorsForProperty(property: any): any[] {
    return this.getNestedValue(property, 'competitors', []);
  }

  hasCompetitors(property: any): boolean {
    const competitors = this.getCompetitorsForProperty(property);
    return competitors.length > 0;
  }

  getCompetitorCount(property: any): number {
    return this.getCompetitorsForProperty(property).length;
  }

  getTotalMissingCaptions(): number {
    return this.photoComparisonData.reduce((sum, property) => sum + property.missing_captions, 0);
  }

  getAveragePhotos(): number {
    const total = this.photoComparisonData.reduce((sum, property) => sum + property.num_photos, 0);
    return Math.round(total / this.photoComparisonData.length);
  }

  getAverageCaptionRate(): number {
    const totalRate = this.photoComparisonData.reduce((sum, property) => {
      return sum + (property.captioned_count / property.num_photos * 100);
    }, 0);
    return Math.round(totalRate / this.photoComparisonData.length);
  }

  // Table helper methods
  getGapClass(photoGap: number): string {
    if (photoGap > 0) {
      return photoGap > 20 ? 'gap-critical' : 'gap-behind';
    } else {
      return 'gap-ahead';
    }
  }

  // Photo gap methods
  getPhotoGap(property: any): number {
    return this.calculatePhotoGap(property, 'competitorBookingPhotos.count', property.num_photos);
  }

  getAirbnbPhotoGap(property: any): number {
    return this.calculatePhotoGap(property, 'competitorAirbnbPhotos.count', property.airbnb_photos);
  }

  getBookingPhotoGap(property: any): number {
    return this.calculatePhotoGap(property, 'competitorBookingPhotos.count', property.num_photos);
  }

  getPricelabPhotoGap(property: any): number {
    // Pricelab doesn't have competitors
    return 0;
  }

  private calculatePhotoGap(property: any, competitorPhotoPath: string, propertyPhotoCount: number): number {
    const competitors = this.getCompetitorsForProperty(property);
    if (competitors.length === 0) return 0;

    const totalGap = competitors.reduce((sum: number, competitor: any) => {
      const competitorPhotoCount = this.getNestedValue(competitor, competitorPhotoPath, 0);
      return sum + (competitorPhotoCount - (propertyPhotoCount || 0));
    }, 0);

    return Math.round(totalGap / competitors.length);
  }

  // getVrboPhotoGap(property: any): number {
  //   // For now, using the same logic as general photo gap
  //   // In a real implementation, this would compare VRBO-specific photo counts
  //   return this.getPhotoGap(property);
  // }

  getPlatformGapClass(photoGap: number): string {
    if (photoGap > 0) {
      return photoGap > 20 ? 'gap-critical' : 'gap-behind';
    } else {
      return 'gap-ahead';
    }
  }

  getPhotoTypes(photos: any[]): string[] {
    if (!photos) return [];
    const types = [...new Set(photos.map(photo => photo.type))];
    return types.slice(0, 3); // Show max 3 types
  }

  // Photo count methods
  getAirbnbPhotoCount(property: any): { count: number; types: string[] } {
    return this.createPhotoCountResponse(property.airbnb_photos, property.property_photos);
  }

  getBookingPhotoCount(property: any): { count: number; types: string[] } {
    return this.createPhotoCountResponse(property.num_photos, property.property_photos);
  }

  getPricelabPhotoCount(property: any): { count: number; types: string[] } {
    return this.createPhotoCountResponse(property.num_photos, property.property_photos);
  }

  private createPhotoCountResponse(count: number, photos: any[]): { count: number; types: string[] } {
    return {
      count: count || 0,
      types: this.getPhotoTypes(photos)
    };
  }

  // getVrboPhotoCount(property: any): { count: number; types: string[] } {
  //   // For now, using the same logic as general photo count
  //   // In a real implementation, this would use platform-specific photo data
  //   return {
  //     count: property.num_photos,
  //     types: this.getPhotoTypes(property.property_photos)
  //   };
  // }

  // Review count methods
  getAirbnbReviewCount(property: any): { count: number; score: number } {
    return this.createReviewCountResponse(property.airbnb_reviews, property.airbnb_score);
  }

  getBookingReviewCount(property: any): { count: number; score: number } {
    return this.createReviewCountResponse(property.booking_reviews, property.booking_score);
  }

  getPricelabReviewCount(property: any): { count: number; score: number } {
    // Pricelab doesn't have reviews
    return this.createReviewCountResponse(0, 0);
  }

  private createReviewCountResponse(count: number, score: number): { count: number; score: number } {
    return {
      count: count || 0,
      score: score || 0
    };
  }

  // getVrboReviewCount(property: any): { count: number; score: number } {
  //   // For now, using competitor data as placeholder
  //   // In a real implementation, this would use platform-specific review data
  //   if (property.competitor && property.competitor.length > 0) {
  //     return {
  //       count: property.competitor[0].reviews_count || 0,
  //       score: property.competitor[0].reviews_score || 0
  //     };
  //   }
  //   return { count: 0, score: 0 };
  // }

  getCaptionPercentage(property: any): number {
    const total = property.num_photos || 0;
    const captioned = property.captioned_count || 0;
    return total > 0 ? Math.round((captioned / total) * 100) : 0;
  }

  // Caption status methods
  getAirbnbCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    return this.createCaptionStatusResponse(
      property.airbnb_photos,
      property.airbnb_captioned,
      property.airbnb_missing
    );
  }

  getBookingCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    return this.createCaptionStatusResponse(
      property.num_photos,
      property.captioned_count,
      property.missing_captions
    );
  }

  getPricelabCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    return this.createCaptionStatusResponse(
      property.num_photos,
      property.captioned_count,
      property.missing_captions
    );
  }

  private createCaptionStatusResponse(total: number, captioned: number, missing: number): { percentage: number; captioned: number; total: number; missing: number } {
    const totalCount = total || 0;
    const captionedCount = captioned || 0;
    const missingCount = missing || 0;
    const percentage = totalCount > 0 ? Math.round((captionedCount / totalCount) * 100) : 0;
    
    return {
      percentage,
      captioned: captionedCount,
      total: totalCount,
      missing: missingCount
    };
  }

  // getVrboCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
  //   // For now, using the same logic as general caption status
  //   // In a real implementation, this would use platform-specific caption data
  //   return {
  //     percentage: this.getCaptionPercentage(property),
  //     captioned: property.captioned_count,
  //     total: property.num_photos,
  //     missing: property.missing_captions
  //   };
  // }

  getCaptionStatusClass(percentage: number): string {
    if (percentage >= 90) return 'caption-excellent';
    if (percentage >= 70) return 'caption-good';
    if (percentage >= 50) return 'caption-fair';
    return 'caption-poor';
  }

  // ==================== SEARCH FUNCTIONALITY ====================
  
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.resetFilter();
      return;
    }

    this.filteredData = this.photoComparisonData.filter(property => 
      this.matchesSearchTerm(property, this.searchTerm.toLowerCase())
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.resetFilter();
  }

  getDisplayData(): any[] {
    return this.filteredData;
  }

  private resetFilter(): void {
    this.filteredData = [...this.photoComparisonData];
  }

  private matchesSearchTerm(property: any, searchTerm: string): boolean {
    const searchFields = [
      property.listing_name,
      property.property_id,
      property.booking_id,
      property.airbnb_id,
      property.vrbo_id
    ];

    // Check basic property fields
    if (searchFields.some(field => field?.toLowerCase().includes(searchTerm))) {
      return true;
    }

    // Check competitor data
    return this.hasMatchingCompetitor(property, searchTerm);
  }

  private hasMatchingCompetitor(property: any, searchTerm: string): boolean {
    const competitors = this.getCompetitorsForProperty(property);
    return competitors.some((competitor: any) => {
      const competitorFields = [
        competitor.bookingId,
        competitor.airbnbId,
        competitor.vrboId
      ];
      return competitorFields.some(field => field?.toLowerCase().includes(searchTerm));
    });
  }

  // CSV Export functionality
  exportToCSV(): void {
    const csvData = this.filteredData.map(property => ({
      'Property Name': property.listing_name,
      'Property ID': property.property_id,
      'Booking.com Photos': property.num_photos,
      'Airbnb Photos': property.airbnb_photos,
      'VRBO Photos': property.vrbo_photos,
      'Booking.com Captioned': property.captioned_count,
      'Airbnb Captioned': property.airbnb_captioned,
      'VRBO Captioned': property.vrbo_captioned,
      'Booking.com Missing': property.missing_captions,
      'Airbnb Missing': property.airbnb_missing,
      'VRBO Missing': property.vrbo_missing,
      'Booking.com Reviews': property.booking_reviews,
      'Airbnb Reviews': property.airbnb_reviews,
      'VRBO Reviews': property.vrbo_reviews,
      'Booking.com Score': property.booking_score,
      'Airbnb Score': property.airbnb_score,
      'VRBO Score': property.vrbo_score,
      'Competitors Count': this.getCompetitorCount(property),
      'Photo Gap': this.getPhotoGap(property),
      'Airbnb Link': property.airbnb_link,
      'Booking Link': property.booking_link,
      'VRBO Link': property.vrbo_link
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `photo_comparison_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Navigation methods
  viewPhotoDetails(propertyId: string): void {
    this.router.navigate(['/content/photo-details', propertyId]);
  }

  // Legacy methods for backward compatibility
  previousCompetitor(): void {
    console.log('Previous competitor');
  }

  nextCompetitor(): void {
    console.log('Next competitor');
  }
}
