import { Component, OnInit } from "@angular/core";
import { CompetitorComparisonService } from "../../_services/competitor-comparison.servie";
import { ActivatedRoute } from "@angular/router";
import { LocalStorageService } from "../../_services/local-storage.service";

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss']
})
export class MyReviewsComponent implements OnInit {
  reportDate: string = 'Sep 01, 2025';
  totalReviews: number = 45; // Example number for your own reviews
  
   // API Data properties
   guestDidntLikeData: any | null = null;
   guestWishesData: any | null = null;
   guestLovedData: any | null = null;
   whatToImproveData: any | null = null;
   
   // Loading states
   loading: boolean = true;
   guestDidntLikeLoading: boolean = false;
   guestWishesLoading: boolean = false;
   guestLovedLoading: boolean = false;
   whatToImproveLoading: boolean = false;
   
   error: string | null = null;
   operatorId: string = "";
   propertyId: string = "";

  // My Reviews Data
  myDislikes = [
    {
      title: 'Limited Amenities',
      description: 'Some guests mentioned the lack of certain amenities compared to competitors.'
    },
    {
      title: 'Check-in Process',
      description: 'Guests found the check-in process somewhat complicated and time-consuming.'
    },
    {
      title: 'Wi-Fi Connectivity',
      description: 'Some guests experienced Wi-Fi connectivity issues in certain areas of the property.'
    }
  ];

  myWishes = [
    {
      title: 'More Entertainment Options',
      description: 'Guests would like to see more entertainment options in the property.'
    },
    {
      title: 'Better Wi-Fi Coverage',
      description: 'Some guests experienced Wi-Fi connectivity issues in certain areas.'
    },
    {
      title: 'Additional Kitchen Appliances',
      description: 'Guests requested more kitchen appliances for extended stays.'
    }
  ];

  myLoves = [
    {
      title: 'Excellent Customer Service',
      description: 'Guests consistently praised the responsive and helpful customer service.'
    },
    {
      title: 'Prime Location',
      description: 'The central location and easy access to attractions were highly appreciated.'
    },
    {
      title: 'Clean and Well-Maintained',
      description: 'Guests loved the cleanliness and overall maintenance of the property.'
    },
    {
      title: 'Value for Money',
      description: 'Many guests appreciated the competitive pricing and value offered.'
    }
  ];

  myActionableChanges = [
    {
      title: 'Add More Amenities',
      description: 'Consider adding amenities that competitors offer to stay competitive.'
    },
    {
      title: 'Streamline Check-in',
      description: 'Simplify the check-in process to improve guest experience.'
    },
    {
      title: 'Improve Wi-Fi Infrastructure',
      description: 'Upgrade Wi-Fi equipment to ensure better coverage throughout the property.'
    },
    {
      title: 'Enhance Entertainment Options',
      description: 'Add more entertainment features to meet guest expectations.'
    }
  ];



 
  constructor(
    private competitorComparisonService: CompetitorComparisonService,
    private route: ActivatedRoute,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {

    // Example property_id and operator_id - you may want to get these from route params or parent component
    this.propertyId = this.route.snapshot.params["id"];


    // Get operatorId from query params
    this.operatorId =
      this.route.snapshot.queryParams["operatorId"] ||
      this.localStorageService.getSelectedOperatorId() ||
      "";

    if (this.operatorId) {
      this.loadGuestDidntLikeData();
      this.loadGuestLovedData();
      this.loadGuestWishData();
      this.loadWhatToImproveData();
    } else {
      this.error = "Operator ID not available";
    }
  }

  loadGuestDidntLikeData(): void {
    this.guestDidntLikeLoading = true;
    this.error = null;

    this.competitorComparisonService
      .getGuestDidntLikeInMyProperty(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: any) => {
          // Handle the case where data might be empty or undefined
          if (response?.data?.insights && Array.isArray(response.data.insights)) {
            this.guestDidntLikeData = response.data.insights;
          } else {
            this.guestDidntLikeData = [];
          }
          this.guestDidntLikeLoading = false;
          this.checkAllDataLoaded();
          console.log("Guest didn't like data loaded:", response);
        },
        error: (error) => {
          this.error = "Failed to load guest insights data";
          this.guestDidntLikeLoading = false;
          this.checkAllDataLoaded();
          console.error("Error loading guest didn't like data:", error);
        },
      });
  }

  loadGuestWishData(): void {
    this.guestWishesLoading = true;
    
    this.competitorComparisonService
      .getGuestWishesInMyProperty(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: any) => {
          // Handle the case where data might be empty or undefined
          if (response?.data?.insights && Array.isArray(response.data.insights)) {
            this.guestWishesData = response.data.insights;
          } else {
            this.guestWishesData = [];
          }
          this.guestWishesLoading = false;
          this.checkAllDataLoaded();
          console.log("Guest wishes data loaded:", response);
        },
        error: (error) => {
          this.guestWishesData = [];
          this.guestWishesLoading = false;
          this.checkAllDataLoaded();
          console.error("Error loading guest wishes data:", error);
        },
      });
  }

  loadGuestLovedData(): void {
    this.guestLovedLoading = true;
    
    this.competitorComparisonService
      .getGuestLovedInMyProperty(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: any) => {
          // Handle the case where data might be empty or undefined
          if (response?.data?.insights && Array.isArray(response.data.insights)) {
            this.guestLovedData = response.data.insights;
          } else {
            this.guestLovedData = [];
          }
          this.guestLovedLoading = false;
          this.checkAllDataLoaded();
          console.log("Guest loved data loaded:", response);
        },
        error: (error) => {
          this.guestLovedData = [];
          this.guestLovedLoading = false;
          this.checkAllDataLoaded();
          console.error("Error loading guest loved data:", error);
        },
      });
  }

  loadWhatToImproveData(): void {
    this.whatToImproveLoading = true;
    
    this.competitorComparisonService
      .getWhatToImproveBasedOnMyProperty(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: any) => {
          // Handle the case where data might be empty or undefined
          if (response?.data?.insights && Array.isArray(response.data.insights)) {
            this.whatToImproveData = response.data.insights;
          } else {
            this.whatToImproveData = [];
          }
          this.whatToImproveLoading = false;
          this.checkAllDataLoaded();
          console.log("What to improve data loaded:", response);
        },
        error: (error) => {
          this.whatToImproveData = [];
          this.whatToImproveLoading = false;
          this.checkAllDataLoaded();
          console.error("Error loading what to improve data:", error);
        },
      });
  }

  // Check if all data has been loaded
  checkAllDataLoaded(): void {
    const allLoaded = !this.guestDidntLikeLoading && 
                     !this.guestWishesLoading && 
                     !this.guestLovedLoading && 
                     !this.whatToImproveLoading;
    
    if (allLoaded) {
      this.loading = false;
    }
  }

  // Calculate loading progress percentage
  getLoadingProgress(): number {
    const totalCalls = 4;
    const completedCalls = [
      !this.guestDidntLikeLoading,
      !this.guestWishesLoading,
      !this.guestLovedLoading,
      !this.whatToImproveLoading
    ].filter(Boolean).length;
    
    return Math.round((completedCalls / totalCalls) * 100);
  }
}
