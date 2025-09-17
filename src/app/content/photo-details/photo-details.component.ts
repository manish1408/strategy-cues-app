import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import photoComparisonData from '../../json_data/photo_comparison_data.json';

@Component({
  selector: 'app-photo-details',
  templateUrl: './photo-details.component.html',
  styleUrl: './photo-details.component.scss'
})
export class PhotoDetailsComponent implements OnInit {
  propertyData: any;
  selectedPhotoIndex: number | null = null;
  selectedCompetitorIndex: number = 0;
  currentImageIndex: number = 0;
  currentCompetitorImageIndex: number = 0;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.propertyData = photoComparisonData.find(property => property.listing_id === this.route.snapshot.params['id']);
  }

  // Navigation methods
  goBack(): void {
    this.location.back();
  }

  // Image methods
  getMainImage(): string {
    if (this.propertyData?.property_photos && this.propertyData.property_photos.length > 0) {
      return this.propertyData.property_photos[0].url;
    }
    return 'assets/images/placeholder.jpg';
  }

  getCurrentImage(): string {
    if (this.propertyData?.property_photos && this.propertyData.property_photos.length > 0) {
      return this.propertyData.property_photos[this.currentImageIndex].url;
    }
    return 'assets/images/placeholder.jpg';
  }

  getCurrentCompetitorImage(): string {
    const competitor = this.getCurrentCompetitor();
    if (competitor?.photos && competitor.photos.length > 0) {
      return competitor.photos[this.currentCompetitorImageIndex].url;
    }
    return 'assets/images/placeholder.jpg';
  }

  getCurrentCompetitor(): any {
    if (this.propertyData?.competitor && this.propertyData.competitor.length > 0) {
      return this.propertyData.competitor[this.selectedCompetitorIndex];
    }
    return null;
  }

  getTotalImages(): number {
    return this.propertyData?.property_photos?.length || 0;
  }

  getSelectedPhoto(): any {
    if (this.selectedPhotoIndex !== null && this.propertyData?.property_photos) {
      return this.propertyData.property_photos[this.selectedPhotoIndex];
    }
    return null;
  }

  // Photo modal methods
  openPhotoModal(index: number): void {
    this.selectedPhotoIndex = index;
  }

  closePhotoModal(): void {
    this.selectedPhotoIndex = null;
  }

  previousPhoto(): void {
    if (this.selectedPhotoIndex !== null && this.selectedPhotoIndex > 0) {
      this.selectedPhotoIndex--;
    }
  }

  nextPhoto(): void {
    if (this.selectedPhotoIndex !== null && this.propertyData?.property_photos && 
        this.selectedPhotoIndex < this.propertyData.property_photos.length - 1) {
      this.selectedPhotoIndex++;
    }
  }

  // Image navigation methods
  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.getTotalImages() - 1) {
      this.currentImageIndex++;
    }
  }

  previousCompetitorImage(): void {
    const competitor = this.getCurrentCompetitor();
    if (competitor?.photos && this.currentCompetitorImageIndex > 0) {
      this.currentCompetitorImageIndex--;
    }
  }

  nextCompetitorImage(): void {
    const competitor = this.getCurrentCompetitor();
    if (competitor?.photos && this.currentCompetitorImageIndex < competitor.photos.length - 1) {
      this.currentCompetitorImageIndex++;
    }
  }

  // Competitor navigation methods
  selectCompetitor(index: number): void {
    this.selectedCompetitorIndex = index;
    this.currentCompetitorImageIndex = 0;
  }

  previousCompetitor(): void {
    if (this.selectedCompetitorIndex > 0) {
      this.selectedCompetitorIndex--;
      this.currentCompetitorImageIndex = 0;
    }
  }

  nextCompetitor(): void {
    if (this.propertyData?.competitor && this.selectedCompetitorIndex < this.propertyData.competitor.length - 1) {
      this.selectedCompetitorIndex++;
      this.currentCompetitorImageIndex = 0;
    }
  }

  // Analysis methods
  getCaptionPercentage(): number {
    if (!this.propertyData) return 0;
    return Math.round((this.propertyData.captioned_count / this.propertyData.num_photos) * 100);
  }

  getGapClass(photoGap: number): string {
    if (photoGap > 0) {
      return photoGap > 20 ? 'gap-critical' : 'gap-behind';
    } else {
      return 'gap-ahead';
    }
  }

  getMissingCaptionPhotos(): string[] {
    if (!this.propertyData?.property_photos) return [];
    return this.propertyData.property_photos
      .filter((photo: any) => !photo.caption)
      .map((photo: any) => photo.id || 'Unknown');
  }

  // Review methods
  getReviewCount(): number {
    // Mock data - replace with actual review count from your data
    return 4;
  }

  getReviewScore(category: string): string {
    // Mock data - replace with actual review scores from your data
    const scores: any = {
      cleanliness: '4.75',
      accuracy: '5.0',
      checkin: '4.75',
      communication: '5.0',
      location: '4.75',
      value: '4.25'
    };
    return scores[category] || '0.0';
  }

  // Image caption methods
  hasCurrentImageCaption(): boolean {
    if (this.propertyData?.property_photos && this.propertyData.property_photos[this.currentImageIndex]) {
      return !!this.propertyData.property_photos[this.currentImageIndex].caption;
    }
    return false;
  }

  hasCurrentCompetitorImageCaption(): boolean {
    const competitor = this.getCurrentCompetitor();
    if (competitor?.photos && competitor.photos[this.currentCompetitorImageIndex]) {
      return !!competitor.photos[this.currentCompetitorImageIndex].caption;
    }
    return false;
  }

  isBestPhoto(): boolean {
    // Mock logic - replace with actual best photo detection
    return this.currentImageIndex === 0;
  }

  // Export methods
  exportPropertyData(): void {
    if (!this.propertyData) return;

    const csvData: any = {
      'Property Title': this.propertyData.property_title,
      'Listing ID': this.propertyData.listing_id,
      'Total Photos': this.propertyData.num_photos,
      'Captioned Photos': this.propertyData.captioned_count,
      'Missing Captions': this.propertyData.missing_captions,
      'Caption Rate %': this.getCaptionPercentage(),
      'Airbnb Link': this.propertyData.airbnb_link,
      'Booking Link': this.propertyData.booking_link,
      'VRBO Link': this.propertyData.vrbo_link
    };

    // Add competitor data if available
    if (this.propertyData.competitor && this.propertyData.competitor.length > 0) {
      const comp = this.propertyData.competitor[0];
      csvData['Competitor Name'] = comp.name;
      csvData['Competitor Photos'] = comp.num_photos;
      csvData['Photo Gap'] = comp.num_photos - this.propertyData.num_photos;
      csvData['Competitor Rating'] = comp.reviews_score;
      csvData['Competitor Reviews'] = comp.reviews_count;
      csvData['Location Score'] = comp.location_score;
    }

    const headers = Object.keys(csvData);
    const csvContent = [
      headers.join(','),
      headers.map(header => `"${csvData[header] || ''}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.propertyData.listing_id}_details_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
