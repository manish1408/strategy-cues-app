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
