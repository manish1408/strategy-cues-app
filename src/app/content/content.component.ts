import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import photoComparisonData from '../json_data/photo_comparison_data.json';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit {
  photoComparisonData: any[] = photoComparisonData;
  filteredData: any[] = photoComparisonData;
  searchTerm: string = '';
  Math = Math;

  constructor(private router: Router) { }

  ngOnInit(): void {
  }


  // Summary statistics methods
  getTotalProperties(): number {
    return this.photoComparisonData.length;
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

  getPhotoGap(property: any): number {
    if (!property.competitor || property.competitor.length === 0) return 0;
    return property.competitor[0].num_photos - property.num_photos;
  }

  // Platform-specific photo gap methods
  getAirbnbPhotoGap(property: any): number {
    // For now, using the same logic as general photo gap
    // In a real implementation, this would compare Airbnb-specific photo counts
    return this.getPhotoGap(property);
  }

  getBookingPhotoGap(property: any): number {
    // For now, using the same logic as general photo gap
    // In a real implementation, this would compare Booking.com-specific photo counts
    return this.getPhotoGap(property);
  }

  getPricelabPhotoGap(property: any): number {
    // For now, using the same logic as general photo gap
    // In a real implementation, this would compare Pricelab-specific photo counts
    return this.getPhotoGap(property);
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

  // Platform-specific photo count methods
  getAirbnbPhotoCount(property: any): { count: number; types: string[] } {
    // For now, using the same logic as general photo count
    // In a real implementation, this would use platform-specific photo data
    return {
      count: property.num_photos,
      types: this.getPhotoTypes(property.property_photos)
    };
  }

  getBookingPhotoCount(property: any): { count: number; types: string[] } {
    // For now, using the same logic as general photo count
    // In a real implementation, this would use platform-specific photo data
    return {
      count: property.num_photos,
      types: this.getPhotoTypes(property.property_photos)
    };
  }

  getPricelabPhotoCount(property: any): { count: number; types: string[] } {
    // For now, using the same logic as general photo count
    // In a real implementation, this would use platform-specific photo data
    return {
      count: property.num_photos,
      types: this.getPhotoTypes(property.property_photos)
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

  // Platform-specific review count methods
  getAirbnbReviewCount(property: any): { count: number; score: number } {
    // For now, using competitor data as placeholder
    // In a real implementation, this would use platform-specific review data
    if (property.competitor && property.competitor.length > 0) {
      return {
        count: property.competitor[0].reviews_count || 0,
        score: property.competitor[0].reviews_score || 0
      };
    }
    return { count: 0, score: 0 };
  }

  getBookingReviewCount(property: any): { count: number; score: number } {
    // For now, using competitor data as placeholder
    // In a real implementation, this would use platform-specific review data
    if (property.competitor && property.competitor.length > 0) {
      return {
        count: property.competitor[0].reviews_count || 0,
        score: property.competitor[0].reviews_score || 0
      };
    }
    return { count: 0, score: 0 };
  }

  getPricelabReviewCount(property: any): { count: number; score: number } {
    // For now, using competitor data as placeholder
    // In a real implementation, this would use platform-specific review data
    if (property.competitor && property.competitor.length > 0) {
      return {
        count: property.competitor[0].reviews_count || 0,
        score: property.competitor[0].reviews_score || 0
      };
    }
    return { count: 0, score: 0 };
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
    return Math.round((property.captioned_count / property.num_photos) * 100);
  }

  // Platform-specific caption status methods
  getAirbnbCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    // For now, using the same logic as general caption status
    // In a real implementation, this would use platform-specific caption data
    return {
      percentage: this.getCaptionPercentage(property),
      captioned: property.captioned_count,
      total: property.num_photos,
      missing: property.missing_captions
    };
  }

  getBookingCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    // For now, using the same logic as general caption status
    // In a real implementation, this would use platform-specific caption data
    return {
      percentage: this.getCaptionPercentage(property),
      captioned: property.captioned_count,
      total: property.num_photos,
      missing: property.missing_captions
    };
  }

  getPricelabCaptionStatus(property: any): { percentage: number; captioned: number; total: number; missing: number } {
    // For now, using the same logic as general caption status
    // In a real implementation, this would use platform-specific caption data
    return {
      percentage: this.getCaptionPercentage(property),
      captioned: property.captioned_count,
      total: property.num_photos,
      missing: property.missing_captions
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

  // Search functionality
  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = this.photoComparisonData;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.photoComparisonData.filter(property => {
      // Search in property title
      if (property.property_title?.toLowerCase().includes(searchLower)) return true;
      
      // Search in listing ID
      if (property.listing_id?.toLowerCase().includes(searchLower)) return true;
      
      // Search in competitor name
      if (property.competitor && property.competitor.length > 0) {
        if (property.competitor[0].name?.toLowerCase().includes(searchLower)) return true;
      }
      
      // Search in photo types
      if (property.property_photos) {
        const photoTypes = property.property_photos.map((photo: any) => photo.type).join(' ').toLowerCase();
        if (photoTypes.includes(searchLower)) return true;
      }
      
      return false;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredData = this.photoComparisonData;
  }

  getDisplayData(): any[] {
    return this.filteredData;
  }

  // CSV Export functionality
  exportToCSV(): void {
    const csvData = this.filteredData.map(property => ({
      'Property Title': property.property_title,
      'Listing ID': property.listing_id,
      'Your Photos': property.num_photos,
      'Captioned Photos': property.captioned_count,
      'Missing Captions': property.missing_captions,
      'Caption Rate %': this.getCaptionPercentage(property),
      'Competitor Name': property.competitor && property.competitor.length > 0 ? property.competitor[0].name : 'N/A',
      'Competitor Photos': property.competitor && property.competitor.length > 0 ? property.competitor[0].num_photos : 0,
      'Photo Gap': this.getPhotoGap(property),
      'Competitor Rating': property.competitor && property.competitor.length > 0 ? property.competitor[0].reviews_score : 'N/A',
      'Competitor Reviews': property.competitor && property.competitor.length > 0 ? property.competitor[0].reviews_count : 0,
      'Airbnb Link': property.airbnb_link,
      'Booking Link': property.booking_link,
      'Pricelab Link': property.pricelabs_link,
      // 'VRBO Link': property.vrbo_link
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
