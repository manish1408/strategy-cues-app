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

  // Helper method to check if value is an object
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
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

  // Helper method to check if a platform feature is enabled
  isFeatureEnabled(value: string | null | object): boolean {
    if (!value) return false;
    if (typeof value === 'object') return true; // Objects are considered enabled
    return value.toLowerCase() === 'yes';
  }

  // Helper method to get CSS class for policy type badges
  getPolicyTypeClass(policyType: string | null): string {
    if (!policyType) return 'badge-secondary';
    
    switch (policyType.toLowerCase()) {
      case 'flexible':
        return 'badge-success';
      case 'moderate':
        return 'badge-warning';
      case 'strict':
        return 'badge-danger';
      case 'hotel_policy':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
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

  // Format guest configuration for display
  formatGuestConfig(guestConfig: any): string {
    if (!guestConfig) {
      return 'N/A';
    }

    // Handle different structures for Booking vs Airbnb
    if (guestConfig.max_guests && typeof guestConfig.max_guests === 'number') {
      // Airbnb structure: max_guests is a number
      return `${guestConfig.max_guests}`;
    } else {
      // Booking structure: extract numbers from strings like "6 adults", "5 children"
      const adults = this.extractNumber(guestConfig.max_adults) || 0;
      const children = this.extractNumber(guestConfig.max_children) || 0;
      const total = adults + children;

      return `${total} (${adults}+${children})`;
    }
  }

  // Helper method to extract number from string like "6 adults" -> 6
  private extractNumber(text: string): number {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Method to open photo in modal or new tab
  openPhotoModal(photoUrl: string, caption?: string): void {
    // For now, just open the image in a new tab
    // You can implement a proper modal later if needed
    window.open(photoUrl, '_blank');
  }
}
