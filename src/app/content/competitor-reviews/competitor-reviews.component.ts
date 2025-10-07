import { Component, OnInit } from "@angular/core";
import { CompetitorComparisonService } from "../../_services/competitor-comparison.servie";
import { ActivatedRoute } from "@angular/router";
import { LocalStorageService } from "../../_services/local-storage.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-competitor-reviews",
  templateUrl: "./competitor-reviews.component.html",
  styleUrls: ["./competitor-reviews.component.scss"],
})
export class CompetitorReviewsComponent implements OnInit {
  reportDate: string = "Sep 01, 2025";
  totalReviews: number = 130;

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
  
  operatorId: string = "";
  propertyId: string = "";

  // Check if all data is empty
  get isAllDataEmpty(): boolean {
    return (!this.guestDidntLikeData || this.guestDidntLikeData.length === 0) &&
           (!this.guestWishesData || this.guestWishesData.length === 0) &&
           (!this.guestLovedData || this.guestLovedData.length === 0) &&
           (!this.whatToImproveData || this.whatToImproveData.length === 0);
  }

  // Competitor Reviews Data
  competitorDislikes = [
    {
      title: "Noise Issues",
      description:
        "Guests reported noise from nearby bars, outdoor music, a busy street, and ongoing construction, making it difficult to sleep.",
    },
    {
      title: "Air Conditioning Problems",
      description:
        "Issues with malfunctioning air conditioning units and unpleasant odors were noted by guests.",
    },
    {
      title: "Parking Difficulties",
      description:
        "Guests experienced challenges with parking access, including slow valet service and issues with lost access cards.",
    },
    {
      title: "Cleanliness Concerns",
      description:
        "Some guests mentioned cleanliness issues, including dirty bathrooms and pest problems.",
    },
    {
      title: "High Additional Charges",
      description:
        "Guests expressed dissatisfaction with high additional charges for cleaning services and overall pricing, feeling the apartment was overpriced!",
    },
  ];

  competitorWishes = [
    {
      title: "Improved Lighting",
      description: "Guests wished for more lighting in the living area.",
    },
    {
      title: "Smart TV Availability",
      description:
        "A desire for a smart TV instead of cable connection was expressed.",
    },
    {
      title: "Better Communication",
      description:
        "Guests wanted clearer communication regarding cleaning services and check-in processes.",
    },
    {
      title: "Moderate Pricing",
      description:
        "Some guests wished for a more moderate price point to enhance value.",
    },
    {
      title: "Clearer Transportation Instructions",
      description:
        "Guests requested clearer instructions for Ubers to find the building due to confusion with similar buildings in the area.",
    },
  ];

  competitorLoves = [
    {
      title: "Clean and Comfortable Apartments",
      description:
        "Guests loved the cleanliness, comfort, and well-equipped nature of the apartments.",
    },
    {
      title: "Exceptional Hospitality",
      description:
        "Many guests appreciated the exceptional hospitality and responsiveness from hosts, particularly Mr. Jafar.",
    },
    {
      title: "Great Location and Views",
      description:
        "Guests enjoyed the beautiful views and great locations, often close to major attractions like Dubai Mall.",
    },
    {
      title: "Spacious and Modern Decor",
      description:
        "The spaciousness and modern decor of the apartments were frequently praised.",
    },
  ];

  actionableChanges = [
    {
      title: "Address Noise Issues",
      description:
        "Improve sound insulation or provide earplugs for guests to mitigate noise disturbances.",
    },
    {
      title: "Ensure Proper Air Conditioning",
      description:
        "Regularly check and maintain air conditioning units to ensure they are functioning properly.",
    },
    {
      title: "Offer Dedicated Parking Options",
      description:
        "Consider providing dedicated parking options to enhance guest convenience.",
    },
    {
      title: "Maintain High Cleanliness Standards",
      description:
        "Ensure high cleanliness standards to avoid negative feedback regarding hygiene.",
    },
    {
      title: "Improve Communication",
      description:
        "Enhance communication regarding services, check-in processes, and parking access to improve guest experience.",
    },
    {
      title: "Adjust Pricing",
      description:
        "Consider adjusting pricing to be more competitive and reflect the value offered.",
    },
  ];

  constructor(
    private competitorComparisonService: CompetitorComparisonService,
    private route: ActivatedRoute,
    private localStorageService: LocalStorageService,
    private toastr: ToastrService
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
    }
  }

  loadGuestDidntLikeData(): void {
    this.guestDidntLikeLoading = true;

    this.competitorComparisonService
      .getGuestDidntLikeInCompetitor(this.propertyId, this.operatorId)
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
          this.toastr.error("Error loading guest didn't like data. Please try again.");
          this.guestDidntLikeLoading = false;
          this.checkAllDataLoaded();
        },
      });
  }

  loadGuestWishData(): void {
    this.guestWishesLoading = true;
    
    this.competitorComparisonService
      .getGuestWishesInCompetitor(this.propertyId, this.operatorId)
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
          this.toastr.error("Error loading guest wishes data. Please try again.");
          this.guestWishesData = [];
          this.guestWishesLoading = false;
          this.checkAllDataLoaded();
        },
      });
  }

  loadGuestLovedData(): void {
    this.guestLovedLoading = true;
    
    this.competitorComparisonService
      .getGuestLovedInCompetitor(this.propertyId, this.operatorId)
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
          this.toastr.error("Error loading guest loved data. Please try again.");
          this.guestLovedData = [];
          this.guestLovedLoading = false;
          this.checkAllDataLoaded();
        },
      });
  }

  loadWhatToImproveData(): void {
    this.whatToImproveLoading = true;
    
    this.competitorComparisonService
      .getWhatToImproveBasedOnCompetitor(this.propertyId, this.operatorId)
      .subscribe({
        next: (response: any) => {
          // Handle the case where data might be empty or undefined
          if (response?.data?.suggestions && Array.isArray(response.data.suggestions)) {
            this.whatToImproveData = response.data.suggestions;
          } else {
            this.whatToImproveData = [];
          }
          this.whatToImproveLoading = false;
          this.checkAllDataLoaded();
          console.log("What to improve data loaded:", response);
        },
        error: (error) => {
          this.toastr.error("Error loading what to improve data. Please try again.");
          this.whatToImproveData = [];
          this.whatToImproveLoading = false;
          this.checkAllDataLoaded();
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
