import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import revenueData from '../../json_data/dubai_revenue_magt_cues_50.json';
import { PropertiesService } from '../../_services/properties.service';
import { LocalStorageService } from '../../_services/local-storage.service';

interface PropertyData {
  _id: string;
  operator_id: string;
  Listing_Name: string;
  Area: string;
  Room_Type: string;
  Occupancy: {
    '7_days': number;
    '30_days': number;
    TM: number;
    NM: number;
  };
  ADR: {
    TM: number;
    NM: number;
  };
  RevPAR: {
    TM: number;
    NM: number;
  };
  MPI: number;
  STLY_Var: {
    Occ: number;
    ADR: number;
    RevPAR: number;
  };
  STLM_Var: {
    Occ: number;
    ADR: number;
    RevPAR: number;
  };
  Pick_Up_Occ: {
    '7_Days': number;
    '14_Days': number;
    '30_Days': number;
  };
  Min_Rate_Threshold: number;
  BookingCom: {
    Genius: string;
    Mobile: string;
    Pref: string;
    Weekly: string;
    Monthly: string;
    LM_Disc: string;
  };
  Airbnb: {
    Weekly: string;
    Monthly: string;
    Member: string;
    LM_Disc: string;
  };
  VRBO: {
    Weekly: string;
    Monthly: string;
  };
  CXL_Policy: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
  Adult_Child_Config: {
    Booking: number;
    Airbnb: number;
    VRBO: number;
  };
  Reviews: {
    Booking: {
      Last_Rev_Dt: string;
      Last_Rev_Score: number;
      Rev_Score: number;
      Total_Rev: number;
    };
    Airbnb: {
      Last_Rev_Dt: string;
      Last_Rev_Score: number;
      Rev_Score: number;
      Total_Rev: number;
    };
    VRBO: {
      Last_Rev_Dt: string;
      Last_Rev_Score: number;
      Rev_Score: number;
      Total_Rev: number;
    };
  };
  Property_URLs: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
}

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  styleUrl: './property-details.component.scss'
})
export class PropertyDetailsComponent implements OnInit {
  property: PropertyData | null = null;
  propertyId: string = '';
  activeTab: 'overview' | 'performance' | 'platforms' | 'reviews' = 'overview';
  operatorId: string = '';
  // Utility property for template
  Math = Math;

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

    this.propertyService.getProperty(this.propertyId, this.operatorId).subscribe((res: any) => {
      this.property = res.data;
    });
    // const propertyData: PropertyData[] = revenueData as PropertyData[];
    
    // // Find property by index (using ID as index)
    // const index = parseInt(this.propertyId);
    // if (index >= 0 && index < propertyData.length) {
    //   this.property = propertyData[index];
    // } else {
    //   // Property not found, redirect back to revenue page
    //   this.router.navigate(['/revenue']);
    // }
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

  getPerformanceClass(value: number): string {
    const numValue = parseFloat(value.toString().replace('%', ''));
    if (numValue > 0) return 'text-success';
    if (numValue < 0) return 'text-danger';
    return 'text-muted';
  }

  getOccupancyClass(occupancy: number): string {
    const numValue = parseFloat(occupancy.toString().replace('%', ''));
    if (numValue >= 80) return 'bg-success';
    if (numValue >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  getReviewScoreClass(score: number): string {
    const numValue = parseFloat(score.toString());
    if (numValue >= 4.5) return 'text-success';
    if (numValue >= 4.0) return 'text-warning';
    if (numValue >= 3.0) return 'text-info';
    return 'text-danger';
  }

  // Helper method to check if a platform feature is enabled
  isFeatureEnabled(value: string): boolean {
    return value.toLowerCase() === 'yes';
  }

  // Methods to handle booking platform links
  openBookingLink(platform: 'Booking' | 'Airbnb' | 'VRBO'): void {
    if (this.property?.Property_URLs?.[platform]) {
      window.open(this.property.Property_URLs[platform], '_blank');
    }
  }
}
