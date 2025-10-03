import { Component, OnInit, Input } from '@angular/core';
import { CompetitorComparisonService } from '../../_services/competitor-comparison.servie';

// Interface for the API response
interface ConversionBoostersResponse {
  data: {
    conversionBoosters: {
      have: Array<{
        cluster_id: number;
        label: string;
        support: number;
        examples: string[];
      }>;
      missing: Array<{
        cluster_id: number;
        label: string;
        support: number;
        examples: string[];
      }>;
    };
    topAreaAmenitiesMissing: Array<{
      cluster_id: number;
      label: string;
      count: number;
      support: number;
      examples: string[];
      rank: number;
    }>;
  };
  success: boolean;
}

@Component({
  selector: 'app-amenities-analyzer',
  templateUrl: './amenities-analyzer.component.html',
  styleUrls: ['./amenities-analyzer.component.scss']
})
export class AmenitiesAnalyzerComponent implements OnInit {
  @Input() propertyId: string = '';
  @Input() operatorId: string = '';
  
  // Ranking & Conversion Boosters Data
  rankingBoosters = [
    { name: 'Room-darkening shades', has: true },
    { name: 'Private entrance', has: true },
    { name: 'Body soap', has: true },
    { name: 'Toaster', has: true },
    { name: 'Iron', has: true },
    { name: 'Patio or balcony', has: true },
    { name: 'Cooking basics', has: true },
    { name: 'Freezer', has: true },
    { name: 'Free street parking', has: false },
    { name: 'Pack \'n Play/travel crib', has: false },
    { name: 'Pets allowed', has: false },
    { name: 'Long term stays allowed', has: false },
    { name: 'Ceiling fan', has: false },
    { name: 'Barbecue utensils', has: false },
    { name: 'Laundromat nearby', has: false },
    { name: 'Private living room', has: false }
  ];

  // Top Ranking Amenities in Your Area
  topRankingAmenities = [
    'Microwave',
    'Coffee maker',
    'Outdoor Dining Area',
    'Outdoor seating',
    'Sun loungers',
    'Kitchenette',
    'Alfresco shower',
    'Bidet',
    'Hot tub',
    'Cleaning before checkout',
    'Nespresso machine',
    'BBQ grill',
    'Waterfront',
    'Paid parking off premises',
    'Keypad',
    'Smart lock',
    'Baking sheet',
    'Books',
    'Beach access',
    'Lock on bedroom door',
    'Paid parking on premises',
    'Host greets you',
    'Mini fridge',
    'High chair',
    'Garden or backyard',
    'Blender',
    'Lake access',
    'Resort access',
    'Sound system',
    'Pool table'
  ];

  // Notifications
  notificationSettings = {
    amenityMissing: false
  };

  // Loading state
  isLoading: boolean = false;

  constructor(private competitorComparisonService: CompetitorComparisonService) { }

  ngOnInit(): void {
    if (this.propertyId && this.operatorId) {
      this.loadConversionBoostersAndAmenities();
    }
  }

  loadConversionBoostersAndAmenities(): void {
    this.isLoading = true;
    this.competitorComparisonService.getConversionBoostersAndAmenities(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: ConversionBoostersResponse) => {
          if (response.success && response.data) {
            this.transformApiDataToComponentData(response.data);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading conversion boosters and amenities:', error);
          this.isLoading = false;
        }
      });
  }

  transformApiDataToComponentData(apiData: ConversionBoostersResponse['data']): void {
    // Transform conversion boosters data
    const haveAmenities = apiData.conversionBoosters.have.map(item => ({
      name: item.label,
      has: true
    }));

    const missingAmenities = apiData.conversionBoosters.missing.map(item => ({
      name: item.label,
      has: false
    }));

    // Combine and update rankingBoosters
    this.rankingBoosters = [...haveAmenities, ...missingAmenities];

    // Transform top area amenities missing data
    this.topRankingAmenities = apiData.topAreaAmenitiesMissing.map(item => item.label);
  }

  toggleNotification(setting: string): void {
    (this.notificationSettings as any)[setting] = !(this.notificationSettings as any)[setting];
  }
}
