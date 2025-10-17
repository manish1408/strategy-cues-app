import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CompetitorComparisonService } from '../_services/competitor-comparison.servie';
import { PropertiesService } from '../_services/properties.service';
import { LocalStorageService } from '../_services/local-storage.service';
import { ExportService } from '../_services/export.service';
import { ToastrService } from 'ngx-toastr';
import { ToastService } from '../_services/toast.service';

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
  exportLoading: boolean = false;
  error: string | null = null;
  
  // Infinite scroll properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;
  
  // Configuration properties
  operatorId: string = '';
  Math = Math;
  
  // Subscription management
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private competitorComparisonService: CompetitorComparisonService,
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private exportService: ExportService,
    private toastr: ToastrService,
    private toastService: ToastService
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

  loadCompetitorComparisonData(): void {
    // Only set main loading state for first page load, not for infinite scroll
    if (this.currentPage === 1) {
      this.setLoadingState(true);
    }
    this.clearError();
    
    this.competitorComparisonService.getCompetitorById(this.operatorId, this.currentPage, this.itemsPerPage)
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

  loadCompetitorComparisonDataForProperties(propertyIds: string[]): void {
    // Fetch competitor comparison data for specific properties
    this.competitorComparisonService.getCompetitorById(this.operatorId, this.currentPage, this.itemsPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response?.data?.comparisons) {
            // Filter the comparison data to only include the searched properties
            const allComparisons = response.data.comparisons;
            const filteredComparisons = allComparisons.filter((comparison: any) => 
              propertyIds.includes(comparison.propertyId) || 
              propertyIds.includes(comparison._id) ||
              propertyIds.includes(comparison.listing_id)
            );
            
            // Update the data with filtered results
            this.photoComparisonData = filteredComparisons;
            this.filteredData = [...filteredComparisons];
            this.totalItems = filteredComparisons.length;
            this.totalPages = 1; // Search results don't support pagination
            this.hasMoreData = false; // No more data to load for search results
            this.loading = false;
          } else {
            this.handleError('No comparison data available');
          }
        },
        error: (error: any) => {
          this.handleApiError(error);
        }
      });
  }

  private handleApiResponse(response: any): void {
    if (response?.data?.comparisons) {
      const newData = response.data.comparisons;
      
      // For infinite scroll: append data instead of replacing
      if (this.currentPage === 1) {
        this.photoComparisonData = newData;
        this.filteredData = [...newData];
      } else {
        this.photoComparisonData = [...this.photoComparisonData, ...newData];
        this.filteredData = [...this.photoComparisonData];
      }
      
      // Update pagination data from response
      if (response.data.pagination) {
        this.totalItems = response.data.pagination.total || 0;
        this.totalPages = response.data.pagination.totalPages || 0;
        this.currentPage = response.data.pagination.page || 1;
        this.hasMoreData = this.currentPage < this.totalPages;
      } else {
        // Fallback if pagination data is not available
        this.totalItems = response.data.comparisons.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.hasMoreData = this.currentPage < this.totalPages;
      }
      
      this.setLoadingState(false);
      this.isLoadingMore = false;
    } else {
      this.handleError('No comparison data available');
    }
  }

  private handleApiError(error: any): void {
    console.error('API Error:', error);
    this.isLoadingMore = false; // Reset loading state for infinite scroll
    this.toastr.error('Error loading competitor comparison data. Please try again later.');
    this.handleError('Failed to load competitor data. Please try again later.');
  }

  private handleError(message: string): void {
    this.error = message;
    this.setLoadingState(false);
    this.isLoadingMore = false;
    // Clear data when there's an error
    this.photoComparisonData = [];
    this.filteredData = [];
  }

  private setLoadingState(loading: boolean): void {
    this.loading = loading;
  }

  clearError(): void {
    this.error = null;
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
    return this.photoComparisonData.reduce((sum, property) => {
      const bookingMissing = property.bookingPhotos?.missingCaption || 0;
      const airbnbMissing = property.airbnbPhotos?.missingCaption || 0;
      const vrboMissing = property.vrboPhotos?.missingCaption || 0;
      return sum + bookingMissing + airbnbMissing + vrboMissing;
    }, 0);
  }

  getAveragePhotos(): number {
    const total = this.photoComparisonData.reduce((sum, property) => {
      const bookingCount = property.bookingPhotos?.count || 0;
      const airbnbCount = property.airbnbPhotos?.count || 0;
      const vrboCount = property.vrboPhotos?.count || 0;
      return sum + bookingCount + airbnbCount + vrboCount;
    }, 0);
    return Math.round(total / this.photoComparisonData.length);
  }

  getAverageCaptionRate(): number {
    const totalRate = this.photoComparisonData.reduce((sum, property) => {
      const bookingTotal = property.bookingPhotos?.count || 0;
      const bookingCaptioned = property.bookingPhotos?.withCaption || 0;
      const airbnbTotal = property.airbnbPhotos?.count || 0;
      const airbnbCaptioned = property.airbnbPhotos?.withCaption || 0;
      const vrboTotal = property.vrboPhotos?.count || 0;
      const vrboCaptioned = property.vrboPhotos?.withCaption || 0;
      
      const totalPhotos = bookingTotal + airbnbTotal + vrboTotal;
      const totalCaptioned = bookingCaptioned + airbnbCaptioned + vrboCaptioned;
      
      return sum + (totalPhotos > 0 ? (totalCaptioned / totalPhotos * 100) : 0);
    }, 0);
    return Math.round(totalRate / this.photoComparisonData.length);
  }

  // Table helper methods
  getGapClass(photoGap: number): string {
    if (photoGap > 0) {
      return 'gap-behind';
    } else if (photoGap < 0) {
      return 'gap-ahead';
    } else {
      return 'gap-neutral';
    }
  }

  // Photo gap methods
  getPhotoGap(property: any): number {
    const totalPhotos = (property.bookingPhotos?.count || 0) + (property.airbnbPhotos?.count || 0) + (property.vrboPhotos?.count || 0);
    return this.calculatePhotoGap(property, 'competitorBookingPhotos.count', totalPhotos);
  }

  getAirbnbPhotoGap(property: any): number {
    return this.calculatePhotoGap(property, 'competitorAirbnbPhotos.count', property.airbnbPhotos?.count || 0);
  }

  getBookingPhotoGap(property: any): number {
    return this.calculatePhotoGap(property, 'competitorBookingPhotos.count', property.bookingPhotos?.count || 0);
  }

  // Pricelabs methods - commented out for future use
  // getPricelabPhotoGap(property: any): number {
  //   // Pricelab doesn't have competitors
  //   return 0;
  // }

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
      return 'gap-behind';
    } else if (photoGap < 0) {
      return 'gap-ahead';
    } else {
      return 'gap-neutral';
    }
  }

  getPhotoTypes(photos: any[]): string[] {
    if (!photos) return [];
    const types = [...new Set(photos.map(photo => photo.type))];
    return types.slice(0, 3); // Show max 3 types
  }

  // Photo count methods
  getAirbnbPhotoCount(property: any): { count: number; types: string[] } {
    return this.createPhotoCountResponse(property.airbnbPhotos?.count || 0, property.photos?.airbnb);
  }

  getBookingPhotoCount(property: any): { count: number; types: string[] } {
    return this.createPhotoCountResponse(property.bookingPhotos?.count || 0, property.photos?.booking);
  }

  // getPricelabPhotoCount(property: any): { count: number; types: string[] } {
  //   return this.createPhotoCountResponse(property.num_photos, property.property_photos);
  // }

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
    return this.createReviewCountResponse(property.airbnbReviews?.total || 0, property.airbnbReviews?.score || 0);
  }

  getBookingReviewCount(property: any): { count: number; score: number } {
    return this.createReviewCountResponse(property.bookingReviews?.total || 0, property.bookingReviews?.score || 0);
  }

  // getPricelabReviewCount(property: any): { count: number; score: number } {
  //   // Pricelab doesn't have reviews
  //   return this.createReviewCountResponse(0, 0);
  // }

  private createReviewCountResponse(count: number, score: number): { count: number; score: number } {
    return {
      count: count || 0,
      score: score || 0
    };
  }

  // Star rating methods
  getAirbnbStarRating(property: any): { stars: number; fullStars: number; hasHalfStar: boolean } {
    const score = this.getAirbnbReviewCount(property).score;
    return this.createStarRating(score);
  }

  getBookingStarRating(property: any): { stars: number; fullStars: number; hasHalfStar: boolean } {
    const score = this.getBookingReviewCount(property).score;
    return this.createStarRating(score);
  }

  private createStarRating(score: number): { stars: number; fullStars: number; hasHalfStar: boolean } {
    if (!score || score <= 0) {
      return { stars: 0, fullStars: 0, hasHalfStar: false };
    }
    
    // Convert score to 5-star scale
    const normalizedScore = Math.min(Math.max(score, 0), 5);
    const fullStars = Math.floor(normalizedScore);
    const hasHalfStar = normalizedScore % 1 >= 0.5;
    
    return {
      stars: normalizedScore,
      fullStars: fullStars,
      hasHalfStar: hasHalfStar
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
    const bookingTotal = property.bookingPhotos?.count || 0;
    const bookingCaptioned = property.bookingPhotos?.withCaption || 0;
    const airbnbTotal = property.airbnbPhotos?.count || 0;
    const airbnbCaptioned = property.airbnbPhotos?.withCaption || 0;
    const vrboTotal = property.vrboPhotos?.count || 0;
    const vrboCaptioned = property.vrboPhotos?.withCaption || 0;
    
    const totalPhotos = bookingTotal + airbnbTotal + vrboTotal;
    const totalCaptioned = bookingCaptioned + airbnbCaptioned + vrboCaptioned;
    
    return totalPhotos > 0 ? Math.round((totalCaptioned / totalPhotos) * 100) : 0;
  }

  // Caption status methods
  getAirbnbCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    return this.createCaptionStatusResponse(
      property.airbnbPhotos?.count || 0,
      property.airbnbPhotos?.withCaption || 0,
      property.airbnbPhotos?.missingCaption || 0
    );
  }

  getBookingCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    return this.createCaptionStatusResponse(
      property.bookingPhotos?.count || 0,
      property.bookingPhotos?.withCaption || 0,
      property.bookingPhotos?.missingCaption || 0
    );
  }

  // getPricelabCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
  //   return this.createCaptionStatusResponse(
  //     property.num_photos,
  //     property.captioned_count,
  //     property.missing_captions
  //   );
  // }

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

  // ==================== PAGINATION METHODS ====================
  
  changePage(page: number): void {
    if (page >= 1 && page !== this.currentPage && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCompetitorComparisonData();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ==================== SEARCH FUNCTIONALITY ====================
  
  performSearch(): void {
    // Reset to first page
    this.currentPage = 1;
    this.hasMoreData = true;
    
    if (this.searchTerm && this.searchTerm.trim()) {
      // Use search API if search term exists
      this.loading = true;
      this.propertiesService.searchProperties(this.searchTerm.trim(), this.operatorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success && response.data && response.data.properties) {
              // Extract property IDs from search results
              const propertyIds = response.data.properties.map((property: any) => property._id);
              
              if (propertyIds.length > 0) {
                // Fetch competitor comparison data for these specific properties
                this.loadCompetitorComparisonDataForProperties(propertyIds);
              } else {
                this.handleError('No properties found');
              }
            } else {
              this.handleError('No results found');
            }
          },
          error: (error: any) => {
            this.handleApiError(error);
          }
        });
    } else {
      // If search term is empty, reload all data
      this.loadCompetitorComparisonData();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.performSearch();
  }

  getDisplayData(): any[] {
    // For infinite scroll, return all filtered data
    return this.filteredData;
  }

  // CSV Export functionality
  exportToCSV() {
    this.exportLoading = true;
    this.exportService.exportToCSVContentCues(this.operatorId || "").subscribe({
      next: (response: any) => {
        this.exportLoading = false;
        
        // Handle JSON response with file_url
        if (response.body && typeof response.body === 'object') {
          const res = response.body;
          if (res.success && res.data && typeof res.data.file_url === "string" && res.data.file_url.startsWith("https")) {
            // Open the file URL directly in a new tab
            window.open(res.data.file_url, "_blank");
            this.toastr.success("Properties exported successfully");
          } else {
            this.toastr.error("Invalid response format from server");
          }
        }
        // Handle blob response from backend (fallback)
        else if (response.body instanceof Blob) {
          const blob = response.body;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          
          // Try to get filename from Content-Disposition header
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `properties_${new Date().toISOString().split("T")[0]}.csv`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.toastr.success("Properties exported successfully");
        } else {
          this.toastr.error("Invalid response format from server");
        }
      },
      error: (error) => {
        this.exportLoading = false;
        console.error('Export error:', error);
        this.toastr.error(error.error?.error || error.message || "Failed to export properties");
      },
    });
}
  // exportToCSV(): void {
  //   const csvData = this.filteredData.map(property => ({
  //     'Property Name': property.listing_name,
  //     'Property ID': property.property_id,
  //     'Booking.com Photos': property.num_photos,
  //     'Airbnb Photos': property.airbnb_photos,
  //     'VRBO Photos': property.vrbo_photos,
  //     'Booking.com Captioned': property.captioned_count,
  //     'Airbnb Captioned': property.airbnb_captioned,
  //     'VRBO Captioned': property.vrbo_captioned,
  //     'Booking.com Missing': property.missing_captions,
  //     'Airbnb Missing': property.airbnb_missing,
  //     'VRBO Missing': property.vrbo_missing,
  //     'Booking.com Reviews': property.booking_reviews,
  //     'Airbnb Reviews': property.airbnb_reviews,
  //     'VRBO Reviews': property.vrbo_reviews,
  //     'Booking.com Score': property.booking_score,
  //     'Airbnb Score': property.airbnb_score,
  //     'VRBO Score': property.vrbo_score,
  //     'Competitors Count': this.getCompetitorCount(property),
  //     'Photo Gap': this.getPhotoGap(property),
  //     'Airbnb Link': property.airbnb_link,
  //     'Booking Link': property.booking_link,
  //     'VRBO Link': property.vrbo_link
  //   }));

  //   const headers = Object.keys(csvData[0]);
  //   const csvContent = [
  //     headers.join(','),
  //     ...csvData.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
  //   ].join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', `photo_comparison_${new Date().toISOString().split('T')[0]}.csv`);
  //   link.style.visibility = 'hidden';
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // }

  // Image methods
  getPropertyImage(property: any): string {
  
    // Try to get first image from photos array
    if (property.photos) {
     
      // Check for Airbnb photos first
      if (property.photos.airbnb && property.photos.airbnb.length > 0) {
        return property.photos.airbnb[0].url;
      }
      // Check for Booking photos
      if (property.photos.booking && property.photos.booking.length > 0) {
        return property.photos.booking[0].url;
      }
    }
    
    // Fallback to placeholder
    return 'assets/images/placeholder.jpg';
  }

  onImageError(event: any): void {
    // Set fallback image when image fails to load
    console.log('Image failed to load:', event.target.src);
    event.target.src = 'assets/images/placeholder.jpg';
    // Prevent infinite loop if placeholder also fails
    event.target.onerror = null;
  }

  // Navigation methods
  viewPhotoDetails(propertyId: string): void {
    this.router.navigate(['/content/photo-details', propertyId], { queryParams: { operatorId: this.operatorId } });
  }

  // Legacy methods for backward compatibility
  previousCompetitor(): void {
    // Legacy method for backward compatibility
  }

  nextCompetitor(): void {
    // Legacy method for backward compatibility
  }

  // ==================== INFINITE SCROLL METHODS ====================
  
  loadMoreData(): void {
    if (this.hasMoreData && !this.isLoadingMore && !this.loading) {
      this.isLoadingMore = true;
      this.currentPage++;
      this.loadCompetitorComparisonData();
    }
  }

  // Scroll event handler for infinite scroll
  onScroll(event: any): void {
    try {
      const element = event.target;
      const threshold = 50; // pixels from bottom
      
      // Check if element has valid scroll properties
      if (element && element.scrollTop !== undefined && element.clientHeight && element.scrollHeight) {
        if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
          this.loadMoreData();
        }
      }
    } catch (error) {
      console.error('Scroll event error:', error);
    }
  }

  generateReport(propertyId: string): void {
    this.competitorComparisonService.generateComparisonReport(propertyId, this.operatorId).subscribe({
      next: (response: any) => {
        this.toastr.success("Report generation scheduled");
      },
      error: (error: any) => {
        this.toastr.error("Failed to schedule report generation");
      }
    });
  }
}
