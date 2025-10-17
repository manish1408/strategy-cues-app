import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import revenueData from '../../json_data/dubai_revenue_magt_cues_50.json';
import { PropertiesService } from '../../_services/properties.service';
import { LocalStorageService } from '../../_services/local-storage.service';



@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss'
})
export class PropertyDetailsComponent implements OnInit {
  property: any = null;
  propertyId: string = '';
  activeTab: 'overview' | 'performance' | 'platforms' | 'reviews' = 'overview';
  operatorId: string = '';
  loading: boolean = true;
  error: string | null = null;
  // Utility property for template
  Math = Math;

  // Simplified policy display - no complex mapping needed

  // Helper method to check if value is an object
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  // Placeholder image path
  placeholderImage = 'assets/images/placeholder.jpg';

  // Handle image loading errors
  onImageError(event: any): void {
    event.target.src = this.placeholderImage;
    event.target.alt = 'Image not available';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertiesService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.propertyId = params['id'];
      this.operatorId = this.localStorageService.getSelectedOperatorId() || '';
      if (this.propertyId) {
      this.loadPropertyData();
      }
    });
  }

  loadPropertyData(): void {
    this.loading = true;
    this.error = null;

    this.propertyService.getProperty(this.propertyId, this.operatorId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.property = res.data;
        } else {
          this.error = res.message || 'Property not found';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading property:', error);
        this.error = 'Failed to load property details. Please try again.';
        this.loading = false;
      }
    });
  }

  switchTab(tab: 'overview' | 'performance' | 'platforms' | 'reviews'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/revenue']);
  }

  // Utility methods for styling
  getRoomTypeClass(roomType: string): string {
    switch (roomType) {
      case 'Studio': return 'badge-studio';
      case '1BR': return 'badge-1br';
      case '2BR': return 'badge-2br';
      case '3BR': return 'badge-3br';
      case 'Loft': return 'badge-loft';
      case 'Townhouse': return 'badge-townhouse';
      default: return 'badge-secondary';
    }
  }

  getPerformanceClass(value: number | null): string {
    if (value === null || value === undefined) return 'text-muted';
    const numValue = parseFloat(value.toString().replace('%', ''));
    if (numValue > 0) return 'text-success';
    if (numValue < 0) return 'text-danger';
    return 'text-muted';
  }

  getOccupancyClass(occupancy: number | null): string {
    if (occupancy === null || occupancy === undefined) return 'bg-secondary';
    const numValue = parseFloat(occupancy.toString().replace('%', ''));
    if (numValue >= 80) return 'bg-success';
    if (numValue >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  getReviewScoreClass(score: number | null): string {
    if (score === null || score === undefined) return 'text-muted';
    const numValue = parseFloat(score.toString());
    if (numValue >= 4.5) return 'text-success';
    if (numValue >= 4.0) return 'text-warning';
    if (numValue >= 3.0) return 'text-info';
    return 'text-danger';
  }

  formatReviewDate(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'n/a') {
        return 'N/A';
      }
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        return value; // show as-is if not a valid date
      }
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy}`;
    }
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return 'N/A';
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy}`;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return 'N/A';
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  // Helper method to check if a platform feature is enabled
  isFeatureEnabled(value: string | null | object): boolean {
    if (!value) return false;
    if (typeof value === 'object') return true; // Objects are considered enabled
    return value.toLowerCase() === 'yes';
  }

  // Simplified policy display - direct access to CXL_Policy data

  // Helper method to filter out Booking.com payment references
  getFilteredPrepaymentText(prepaymentText: string): string {
    if (!prepaymentText) return '';
    
    // Remove "thanks to Payments by Booking.com" and similar phrases
    let filteredText = prepaymentText
      .replace(/thanks to Payments by Booking\.com/gi, '')
      .replace(/Payments by Booking\.com/gi, '')
      .replace(/thanks to booking\.com/gi, '')
      .replace(/booking\.com/gi, '')
      .trim();
    
    // Fix punctuation issues - remove comma before period
    filteredText = filteredText.replace(/,\s*\./g, '.');
    
    // Ensure proper ending punctuation
    if (filteredText && !filteredText.endsWith('.') && !filteredText.endsWith('!') && !filteredText.endsWith('?')) {
      filteredText += '.';
    }
    
    return filteredText;
  }

  // Methods to handle booking platform links
  openBookingLink(platform: 'Booking' | 'Airbnb' | 'VRBO'): void {
    if(platform === 'Booking') {
      window.open(this.property.BookingUrl, '_blank');
    } else if(platform === 'Airbnb') {
      window.open(this.property.AirbnbUrl, '_blank');
    } else if(platform === 'VRBO') {
      window.open(this.property.VRBOUrl, '_blank');
    }
  }

  /**
   * Format guest configuration for display
   */
  formatGuestConfig(guestConfig: any): string {
    if (!guestConfig) return 'No guest configuration available';
    
    const configs: string[] = [];
    if (guestConfig.Booking) {
      const booking = guestConfig.Booking;
      configs.push(`Booking.com: ${booking.max_adults} adults, ${booking.max_children} children, ${booking.max_infants} infants`);
    }
    if (guestConfig.Airbnb) {
      const airbnb = guestConfig.Airbnb;
      configs.push(`Airbnb: ${airbnb.max_guests} guests (${airbnb.max_adults} adults, ${airbnb.max_children} children, ${airbnb.max_infants} infants)`);
    }
    if (guestConfig.VRBO) {
      const vrbo = guestConfig.VRBO;
      configs.push(`VRBO: ${vrbo.max_guests} guests (${vrbo.max_adults} adults, ${vrbo.max_children} children)`);
    }
    
    return configs.length > 0 ? configs.join(' | ') : 'No guest configuration available';
  }

  // Method to open photo in modal or new tab
  openPhotoModal(photoUrl: string, caption?: string): void {
    // For now, just open the image in a new tab
    // You can implement a proper modal later if needed
    window.open(photoUrl, '_blank');
  }

  // Helper method to check if there are any cancellation policies
  hasCancellationPolicies(): boolean {
    if (!this.property?.CXL_Policy) return false;
    
    // Check Booking.com policies
    const hasBookingPolicies = this.property.CXL_Policy.Booking && 
                              Array.isArray(this.property.CXL_Policy.Booking) && 
                              this.property.CXL_Policy.Booking.length > 0;
    
    // Check other platforms
    const hasAirbnbPolicy = !!this.property.CXL_Policy.Airbnb;
    const hasVRBOPolicy = !!this.property.CXL_Policy.VRBO;
    const hasPricelabsPolicy = !!this.property.CXL_Policy.Pricelabs;
    
    return hasBookingPolicies || hasAirbnbPolicy || hasVRBOPolicy || hasPricelabsPolicy;
  }

  // Helper method to check if there is any guest configuration
  hasGuestConfig(): boolean {
    if (!this.property?.Adult_Child_Config) return false;
    
    return !!(this.property.Adult_Child_Config.Booking ||
              this.property.Adult_Child_Config.Airbnb ||
              this.property.Adult_Child_Config.VRBO ||
              this.property.Adult_Child_Config.Pricelabs);
  }
}
