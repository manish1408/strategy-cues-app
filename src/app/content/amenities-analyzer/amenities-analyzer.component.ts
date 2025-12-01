import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CompetitorComparisonService } from '../../_services/competitor-comparison.servie';
import { ToastrService } from 'ngx-toastr';

// Interface for the API response
interface ConversionBoostersResponse {
  data: {
    conversionBoosters: {
      have?: Array<{
        cluster_id: number;
        label: string;
        support: number;
        examples: string[];
      }>;
      missing?: Array<{
        cluster_id: number;
        label: string;
        support: number;
        examples: string[];
      }>;
    } | {};
    topAreaAmenitiesMissing?: Array<{
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
export class AmenitiesAnalyzerComponent implements OnInit, OnChanges {
  @Input() propertyId: string = '';
  @Input() operatorId: string = '';
  @Input() selectedPlatform: string = '';
  
  // Ranking & Conversion Boosters Data (populated from API only)
  rankingBoosters: Array<{ name: string; has: boolean }>= [];

  // Top Ranking Amenities in Your Area (populated from API only)
  topRankingAmenities: string[] = [];

  // Notifications
  notificationSettings = {
    amenityMissing: false
  };

  // Loading state
  isLoading: boolean = false;

  constructor(private competitorComparisonService: CompetitorComparisonService, private toastr: ToastrService) { }

  // Check if all data is empty
  get isAllDataEmpty(): boolean {
    return this.rankingBoosters.length === 0 && this.topRankingAmenities.length === 0;
  }

  ngOnInit(): void {
    if (this.propertyId && this.operatorId) {
      this.loadConversionBoostersAndAmenities();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload data when selectedPlatform changes
    if (changes['selectedPlatform'] && !changes['selectedPlatform'].firstChange && this.propertyId && this.operatorId) {
      this.loadConversionBoostersAndAmenities();
    }
  }

  loadConversionBoostersAndAmenities(): void {
    this.isLoading = true;
    this.competitorComparisonService.getConversionBoostersAndAmenities(this.propertyId, this.operatorId, this.selectedPlatform)
      .subscribe({
        next: (response: ConversionBoostersResponse) => {
          if (response.success && response.data) {
            this.transformApiDataToComponentData(response.data);
          }
          this.isLoading = false;
        },
        error: (error) => {
       
          this.isLoading = false;
        }
      });
  }

  transformApiDataToComponentData(apiData: ConversionBoostersResponse['data']): void {
    // Initialize empty arrays
    let haveAmenities: any[] = [];
    let missingAmenities: any[] = [];
    let topAreaAmenities: string[] = [];

    // Transform conversion boosters data - handle empty object case
    if (apiData.conversionBoosters && typeof apiData.conversionBoosters === 'object' && !Array.isArray(apiData.conversionBoosters)) {
      const conversionBoosters = apiData.conversionBoosters as any;
      
      if (conversionBoosters.have && Array.isArray(conversionBoosters.have)) {
        haveAmenities = conversionBoosters.have.map((item: any) => ({
          name: item.label,
          has: true
        }));
      }

      if (conversionBoosters.missing && Array.isArray(conversionBoosters.missing)) {
        missingAmenities = conversionBoosters.missing.map((item: any) => ({
          name: item.label,
          has: false
        }));
      }
    }

    // Combine and update rankingBoosters
    this.rankingBoosters = [...haveAmenities, ...missingAmenities];

    // Transform top area amenities missing data - handle empty array case
    if (apiData.topAreaAmenitiesMissing && Array.isArray(apiData.topAreaAmenitiesMissing)) {
      topAreaAmenities = apiData.topAreaAmenitiesMissing.map(item => item.label);
    }

    this.topRankingAmenities = topAreaAmenities;
  }

  toggleNotification(setting: string): void {
    (this.notificationSettings as any)[setting] = !(this.notificationSettings as any)[setting];
  }
}
