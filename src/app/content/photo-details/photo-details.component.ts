import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import photoComparisonData from "../../json_data/photo_comparison_data.json";
import { GalleryItem, ImageItem } from "ng-gallery";
import { CompetitorComparisonService } from "../../_services/competitor-comparison.servie";
import { SummaryPipe } from "../../summary.pipe";

@Component({
  selector: "app-photo-details",
  templateUrl: "./photo-details.component.html",
  styleUrl: "./photo-details.component.scss",
  providers: [SummaryPipe],
})
export class PhotoDetailsComponent implements OnInit {
  operatorId: string = "";
  activeTab: string = "photos";
  propertyData: any;
  selectedPhotoIndex: number | null = null;
  selectedCompetitorIndex: number = 0;
  currentImageIndex: number = 0;
  currentCompetitorImageIndex: number = 0;
  Math = Math;
  images: GalleryItem[] = [];
  competitorImages: GalleryItem[] = [];
  galleryRefreshKey: number = 0;
  // Swipe functionality properties
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private mouseStartX: number = 0;
  private mouseStartY: number = 0;
  private isMouseDown: boolean = false;
  private currentSwipeType: "main" | "competitor" | null = null;

  // Thumbnail swipe properties
  private thumbnailTouchStartX: number = 0;
  private thumbnailTouchStartY: number = 0;
  private thumbnailTouchEndX: number = 0;
  private thumbnailTouchEndY: number = 0;
  private thumbnailMouseStartX: number = 0;
  private thumbnailMouseStartY: number = 0;
  private isThumbnailMouseDown: boolean = false;
  private currentThumbnailSwipeType: "main" | "competitor" | null = null;

  // Caption modal properties
  showCaptionModal: boolean = false;
  selectedPhotoId: string = "";
  captionText: string = "";
  isSubmittingCaption: boolean = false;

  // Loading state
  isLoading: boolean = true;

  // Platform tabs
  selectedPropertyPlatform: string = "airbnb";
  selectedCompetitorPlatform: string = "airbnb";
  isPropertyGalleryLoading: boolean = false;
  isCompetitorGalleryLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private competitorComparisonService: CompetitorComparisonService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const propertyId = this.route.snapshot.params["id"];
    console.log("Property ID:", propertyId);

    // API call to get property competitors
    this.loadPropertyCompetitors(propertyId);

    this.updateCompetitorPlatformImages();
  }

  // Load property competitors from API
  loadPropertyCompetitors(propertyId: string): void {
    this.competitorComparisonService
      .getPropertyCompetitors(propertyId)
      .subscribe({
        next: (response: any) => {
          // Bind the API data to component properties
          if (response?.data) {
            // Update property data with API response
            if (response.data.property) {
              this.propertyData = {
                ...this.propertyData,
                ...response.data.property,
              };

              // Debug: Log the Photos structure from API
              console.log(
                "Property Photos from API:",
                this.propertyData.Photos
              );
              console.log("Property full data:", this.propertyData);

              // Update images array after receiving property data
              this.updatePropertyPlatformImages();
              console.log(
                "Updated Your Photos Images Array after API:",
                this.images
              );
              console.log(
                "Updated Your Photos URLs:",
                this.images.map((img) => img.data?.src)
              );
            }

            // Update competitors data
            if (
              response.data.competitors &&
              Array.isArray(response.data.competitors)
            ) {
              this.propertyData.competitor = response.data.competitors;

              // Update competitor images if we have competitors
              if (this.propertyData.competitor.length > 0) {
                this.updateCompetitorImages();
              }
            } else {
              // Show default competitors when no data from backend
              this.propertyData.competitor = this.getDefaultCompetitors();
              console.log("No competitors found, showing default competitors");
            }

            // Trigger change detection to update the UI
            this.cdr.detectChanges();

            // Set loading to false after data is loaded
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          console.log("Error loading property competitors:", error);
          console.log("Error details:", error?.error);

          // Trigger change detection to update the UI
          this.cdr.detectChanges();

          // Set loading to false even on error
          this.isLoading = false;
        },
      });
  }

  // Helper method to get all property photos from new structure
  getAllPropertyPhotos(): any[] {
    if (!this.propertyData?.Photos) {
      // Return default placeholder photos if no data from backend
      return [{ url: "assets/images/placeholder.jpg" }];
    }

    const allPhotos = [];

    // Add Airbnb photos
    if (
      this.propertyData.Photos.airbnb &&
      Array.isArray(this.propertyData.Photos.airbnb)
    ) {
      allPhotos.push(...this.propertyData.Photos.airbnb);
    }

    // Add Booking photos
    if (
      this.propertyData.Photos.booking &&
      Array.isArray(this.propertyData.Photos.booking)
    ) {
      allPhotos.push(...this.propertyData.Photos.booking);
    }

    // Add VRBO photos if available
    if (
      this.propertyData.Photos.vrbo &&
      Array.isArray(this.propertyData.Photos.vrbo)
    ) {
      allPhotos.push(...this.propertyData.Photos.vrbo);
    }

    // If no photos found from backend, return default photos
    if (allPhotos.length === 0) {
      return [{ url: "assets/images/placeholder.jpg" }];
    }

    return allPhotos;
  }



  // Navigation methods
  goBack(): void {
    this.location.back();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  openBookingLink(platform: string): void {
    let url = "";
    switch (platform) {
      case "Airbnb":
        url = this.propertyData?.AirbnbUrl;
        break;
      case "Booking":
        url = this.propertyData?.BookingUrl;
        break;
      case "Pricelab":
        url = this.propertyData?.PricelabsUrl;
        break;
      case "VRBO":
        url = this.propertyData?.VRBOUrl;
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  }

  // Image methods
  getMainImage(): string {
    const allPhotos = this.getAllPropertyPhotos();
    if (allPhotos && allPhotos.length > 0) {
      return allPhotos[0].url;
    }
    return "assets/images/placeholder.jpg";
  }

  getCurrentImage(): string {
    const allPhotos = this.getAllPropertyPhotos();
    if (allPhotos && allPhotos.length > 0) {
      return allPhotos[this.currentImageIndex].url;
    }
    return "assets/images/placeholder.jpg";
  }

  getCurrentCompetitorImage(): string {
    const competitor = this.getCurrentCompetitor();
    if (competitor?.photos && competitor.photos.length > 0) {
      return competitor.photos[this.currentCompetitorImageIndex].url;
    }
    return "assets/images/placeholder.jpg";
  }

  // Image error handling
  onImageError(event: any): void {
    event.target.src = "assets/images/placeholder.jpg";
  }

  getCurrentCompetitor(): any {
    if (
      this.propertyData?.competitor &&
      this.propertyData.competitor.length > 0 &&
      this.selectedCompetitorIndex >= 0
    ) {
      return this.propertyData.competitor[this.selectedCompetitorIndex];
    }
    return null;
  }

  getTotalImages(): number {
    return this.getAllPropertyPhotos().length;
  }

  // Get total property photos count
  getTotalPropertyPhotos(): number {
    return (
      (this.propertyData?.Photos?.airbnb?.length || 0) +
      (this.propertyData?.Photos?.booking?.length || 0) +
      (this.propertyData?.Photos?.vrbo?.length || 0)
    );
  }

  // Get total competitor photos for current competitor
  getTotalCompetitorPhotosCount(): number {
    const competitor = this.getCurrentCompetitor();
    if (!competitor) return 0;

    return (
      (competitor.propertyAirbnbPhotos?.length || 0) +
      (competitor.propertyBookingPhotos?.length || 0) +
      (competitor.propertyVrboPhotos?.length || 0)
    );
  }

  // Get photo gap between competitor and property
  getPhotoGap(): number {
    return this.getTotalCompetitorPhotosCount() - this.getTotalPropertyPhotos();
  }

  // Get total photos for any competitor by index or competitor object
  getCompetitorPhotosCount(competitor: any): number {
    if (!competitor) return 0;
    return (
      (competitor.propertyAirbnbPhotos?.length || 0) +
      (competitor.propertyBookingPhotos?.length || 0) +
      (competitor.propertyVrboPhotos?.length || 0)
    );
  }

  // Get photo gap for a specific competitor
  getCompetitorPhotoGap(competitor: any): number {
    return (
      this.getCompetitorPhotosCount(competitor) - this.getTotalPropertyPhotos()
    );
  }

  getTotalCompetitorPhotos(): number {
    const currentCompetitor = this.getCurrentCompetitor();
    if (!currentCompetitor) return 0;

    let totalPhotos = 0;

    // Count Airbnb photos
    if (
      currentCompetitor.propertyAirbnbPhotos &&
      Array.isArray(currentCompetitor.propertyAirbnbPhotos)
    ) {
      totalPhotos += currentCompetitor.propertyAirbnbPhotos.length;
    }

    // Count Booking photos
    if (
      currentCompetitor.propertyBookingPhotos &&
      Array.isArray(currentCompetitor.propertyBookingPhotos)
    ) {
      totalPhotos += currentCompetitor.propertyBookingPhotos.length;
    }

    // Count VRBO photos
    if (
      currentCompetitor.propertyVrboPhotos &&
      Array.isArray(currentCompetitor.propertyVrboPhotos)
    ) {
      totalPhotos += currentCompetitor.propertyVrboPhotos.length;
    }

    return totalPhotos;
  }

  getSelectedPhoto(): any {
    if (this.selectedPhotoIndex !== null) {
      const allPhotos = this.getAllPropertyPhotos();
      if (allPhotos && allPhotos.length > this.selectedPhotoIndex) {
        return allPhotos[this.selectedPhotoIndex];
      }
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
    if (this.selectedPhotoIndex !== null) {
      const allPhotos = this.getAllPropertyPhotos();
      if (allPhotos && this.selectedPhotoIndex < allPhotos.length - 1) {
        this.selectedPhotoIndex++;
      }
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
    if (
      competitor?.photos &&
      this.currentCompetitorImageIndex < competitor.photos.length - 1
    ) {
      this.currentCompetitorImageIndex++;
    }
  }

  // Competitor navigation methods
  selectCompetitor(index: number): void {
    this.selectedCompetitorIndex = index;
    this.currentCompetitorImageIndex = 0;
    this.updateCompetitorImages();
  }

  // Force refresh galleries
  refreshGalleries(): void {
    this.galleryRefreshKey++;
    console.log("Refreshing galleries with key:", this.galleryRefreshKey);
  }

  updateCompetitorImages(): void {
    console.log(
      "Updating competitor images. Selected index:",
      this.selectedCompetitorIndex
    );

    // Use platform-specific images based on selected tab
    this.updateCompetitorPlatformImages();
  }

  // Default competitor photos when backend data is not available
  getDefaultCompetitorPhotos(): any[] {
    return [
      {
        id: "competitor-default-1",
        url: "assets/images/placeholder.jpg",
        caption: "Competitor photo placeholder",
        accessibility_label: "Default competitor image",
        source: "default",
      },
      {
        id: "competitor-default-2",
        url: "assets/images/placeholder.jpg",
        caption: "Competitor photo placeholder",
        accessibility_label: "Default competitor image",
        source: "default",
      },
    ].map((photo) => new ImageItem({ src: photo.url, thumb: photo.url }));
  }

  // Default competitors when backend data is not available
  getDefaultCompetitors(): any[] {
    return [
      {
        id: "default-competitor-1",
        name: "Sample Competitor 1",
        num_photos: 2,
        reviews_score: 4.5,
        reviews_count: 25,
        location_score: 4.2,
        propertyAirbnbPhotos: [
          {
            id: "default-airbnb-1",
            url: "assets/images/placeholder.jpg",
            caption: "Default Airbnb photo",
            accessibility_label: "Default competitor image",
            source: "airbnb",
          },
        ],
        propertyBookingPhotos: [
          {
            id: "default-booking-1",
            url: "assets/images/placeholder.jpg",
            caption: "Default Booking photo",
            accessibility_label: "Default competitor image",
            source: "booking",
          },
        ],
        propertyVrboPhotos: null,
        airbnb_link: "#",
        booking_link: "#",
        pricelabs_link: null,
      },
      {
        id: "default-competitor-2",
        name: "Sample Competitor 2",
        num_photos: 2,
        reviews_score: 4.3,
        reviews_count: 18,
        location_score: 4.0,
        propertyAirbnbPhotos: [
          {
            id: "default-airbnb-2",
            url: "assets/images/placeholder.jpg",
            caption: "Default Airbnb photo",
            accessibility_label: "Default competitor image",
            source: "airbnb",
          },
        ],
        propertyBookingPhotos: [
          {
            id: "default-booking-2",
            url: "assets/images/placeholder.jpg",
            caption: "Default Booking photo",
            accessibility_label: "Default competitor image",
            source: "booking",
          },
        ],
        propertyVrboPhotos: null,
        airbnb_link: "#",
        booking_link: "#",
        pricelabs_link: null,
      },
    ];
  }

  // Default property data when no data is available
  getDefaultPropertyData(): any {
    return {
      listing_id: "default-property",
      property_title: "Default Property",
      listing_name: "Default Property Name",
      num_photos: 3,
      Photos: {
        airbnb: [{ url: "assets/images/placeholder.jpg" }],
        booking: [],
        vrbo: null,
      },
      reviews: {
        cleanliness: 4.5,
        accuracy: 4.5,
        checkin: 4.5,
        communication: 4.5,
        location: 4.5,
        value: 4.5,
      },
      reviews_count: 10,
      competitor: [],
    };
  }

  getAmenityIcon(iconString: string): string {
    const iconMap: { [key: string]: string } = {
      SYSTEM_COOKING_BASICS: "fa-utensils",
      SYSTEM_WI_FI: "fa-wifi",
      SYSTEM_POOL: "fa-swimming-pool",
      SYSTEM_TV: "fa-tv",
      SYSTEM_ELEVATOR: "fa-elevator",
      SYSTEM_PARKING: "fa-parking",
      SYSTEM_AIR_CONDITIONING: "fa-snowflake",
      SYSTEM_BALCONY: "fa-home",
      SYSTEM_VIEW: "fa-eye",
      SYSTEM_KITCHEN: "fa-utensils",
      SYSTEM_INTERNET: "fa-wifi",
      SYSTEM_PRIVATE_POOL: "fa-swimming-pool",
      SYSTEM_OUTDOOR_POOL: "fa-swimming-pool",
      SYSTEM_SMOKE_FREE: "fa-ban-smoking",
      SYSTEM_GENERAL: "fa-check-circle",
    };

    return iconMap[iconString] || "fa-check-circle";
  }

  previousCompetitor(): void {
    if (this.selectedCompetitorIndex > -1) {
      this.selectedCompetitorIndex--;
      this.currentCompetitorImageIndex = 0;
      this.updateCompetitorImages();
    }
  }

  nextCompetitor(): void {
    console.log(
      "Next competitor clicked. Current index:",
      this.selectedCompetitorIndex
    );
    console.log("Total competitors:", this.propertyData?.competitor?.length);
    console.log("Current competitor:", this.getCurrentCompetitor());

    if (
      this.propertyData?.competitor &&
      this.selectedCompetitorIndex < this.propertyData.competitor.length - 1
    ) {
      this.selectedCompetitorIndex++;
      this.currentCompetitorImageIndex = 0;
      this.updateCompetitorImages();
      console.log("Moved to competitor index:", this.selectedCompetitorIndex);
      console.log("New competitor:", this.getCurrentCompetitor());
    } else {
      console.log("Cannot move to next competitor - at end or no competitors");
    }
  }

  // Analysis methods
  getCaptionPercentage(): number {
    if (!this.propertyData) return 0;
    return Math.round(
      (this.propertyData.captioned_count / this.propertyData.num_photos) * 100
    );
  }

  getGapClass(photoGap: number): string {
    if (photoGap > 0) {
      return photoGap > 20 ? "gap-critical" : "gap-behind";
    } else {
      return "gap-ahead";
    }
  }

  getMissingCaptionPhotos(): string[] {
    const allPhotos = this.getAllPropertyPhotos();
    if (!allPhotos) return [];
    return allPhotos
      .filter((photo: any) => !photo.caption)
      .map((photo: any) => photo.id || "Unknown");
  }

  // Review methods
  getReviewCount(): number {
    // Mock data - replace with actual review count from your data
    return 4;
  }

  getReviewScore(category: string): string {
    // Mock data - replace with actual review scores from your data
    const scores: any = {
      cleanliness: "4.75",
      accuracy: "5.0",
      checkin: "4.75",
      communication: "5.0",
      location: "4.75",
      value: "4.25",
    };
    return scores[category] || "0.0";
  }

  // Image caption methods
  hasCurrentImageCaption(): boolean {
    const allPhotos = this.getAllPropertyPhotos();
    if (allPhotos && allPhotos[this.currentImageIndex]) {
      return !!allPhotos[this.currentImageIndex].caption;
    }
    return false;
  }

  hasCurrentCompetitorImageCaption(): boolean {
    const competitor = this.getCurrentCompetitor();
    if (
      competitor?.photos &&
      competitor.photos[this.currentCompetitorImageIndex]
    ) {
      return !!competitor.photos[this.currentCompetitorImageIndex].caption;
    }
    return false;
  }

  isBestPhoto(): boolean {
    // Mock logic - replace with actual best photo detection
    return this.currentImageIndex === 0;
  }

  // Platform tab switching methods
  selectPropertyPlatform(platform: string): void {
    this.selectedPropertyPlatform = platform;
    this.isPropertyGalleryLoading = true;

    // Update images based on selected platform
    setTimeout(() => {
      this.updatePropertyPlatformImages();
      this.isPropertyGalleryLoading = false;
    }, 300);
  }

  selectCompetitorPlatform(platform: string): void {
    this.selectedCompetitorPlatform = platform;
    this.isCompetitorGalleryLoading = true;

    // Update images based on selected platform
    setTimeout(() => {
      this.updateCompetitorPlatformImages();
      this.isCompetitorGalleryLoading = false;
    }, 300);
  }

  // Update property images based on selected platform
  updatePropertyPlatformImages(): void {
    let platformPhotos: any[] = [];

    switch (this.selectedPropertyPlatform) {
      case "airbnb":
        platformPhotos = this.propertyData?.Photos?.airbnb || [];
        break;
      case "booking":
        platformPhotos = this.propertyData?.Photos?.booking || [];
        break;
      case "vrbo":
        platformPhotos = this.propertyData?.Photos?.vrbo || [];
        break;
    }

    this.images = platformPhotos.map(
      (photo: any) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  // Update competitor images based on selected platform
  updateCompetitorPlatformImages(): void {
    const competitor = this.getCurrentCompetitor();
    if (!competitor) return;

    let platformPhotos: any[] = [];

    switch (this.selectedCompetitorPlatform) {
      case "airbnb":
        platformPhotos = competitor.propertyAirbnbPhotos || [];
        break;
      case "booking":
        platformPhotos = competitor.propertyBookingPhotos || [];
        break;
      case "vrbo":
        platformPhotos = competitor.propertyVrboPhotos || [];
        break;
    }

    this.competitorImages = platformPhotos.map(
      (photo: any) => new ImageItem({ src: photo.url, thumb: photo.url })
    );
  }

  // Get platform photo count for property
  getPropertyPlatformPhotoCount(platform: string): number {
    switch (platform) {
      case "airbnb":
        return this.propertyData?.Photos?.airbnb?.length || 0;
      case "booking":
        return this.propertyData?.Photos?.booking?.length || 0;
      case "vrbo":
        return this.propertyData?.Photos?.vrbo?.length || 0;
      default:
        return 0;
    }
  }

  // Get platform photo count for competitor
  getCompetitorPlatformPhotoCount(platform: string): number {
    const competitor = this.getCurrentCompetitor();
    if (!competitor) return 0;

    switch (platform) {
      case "airbnb":
        return competitor.propertyAirbnbPhotos?.length || 0;
      case "booking":
        return competitor.propertyBookingPhotos?.length || 0;
      case "vrbo":
        return competitor.propertyVrboPhotos?.length || 0;
      default:
        return 0;
    }
  }

  // Get platform photo gap (property_count - competitor_count)
  getPlatformPhotoGap(competitor: any, platform: string): number {
    const propertyCount = this.getPropertyPlatformPhotoCount(platform);
    let competitorCount = 0;

    switch (platform) {
      case "airbnb":
        competitorCount = competitor.propertyAirbnbPhotos?.length || 0;
        break;
      case "booking":
        competitorCount = competitor.propertyBookingPhotos?.length || 0;
        break;
      case "vrbo":
        competitorCount = competitor.propertyVrboPhotos?.length || 0;
        break;
    }

    return propertyCount - competitorCount;
  }

  // Get photo gap status (Ahead/Behind/Equal)
  getPhotoGapStatus(gap: number): string {
    if (gap > 0) {
      return "Ahead";
    } else if (gap < 0) {
      return "Behind";
    } else {
      return "Equal";
    }
  }

  // Get absolute photo gap value
  getAbsolutePhotoGap(gap: number): number {
    return Math.abs(gap);
  }

  // Get gap status class for styling
  getGapStatusClass(gap: number): string {
    if (gap > 0) {
      return "gap-ahead";
    } else if (gap < 0) {
      return "gap-behind";
    } else {
      return "gap-equal";
    }
  }

  // Photo suggestions methods
  getPhotoSuggestions(): any[] {
    if (this.propertyData?.recommendations) {
      return this.propertyData.recommendations.map((rec: any) => ({
        title: rec.title,
        available: rec.impact === "high" || rec.impact === "medium",
        description: rec.details,
        impact: rec.impact,
        effort: rec.effort,
        id: rec.id,
      }));
    }

    // Fallback data if no recommendations in JSON
    return [
      {
        title: "Floor plan",
        available: false,
        description:
          "A floor plan helps guests understand the layout and space distribution of your property.",
      },
      {
        title: "Aerial photo",
        available: true,
        description:
          "Aerial photos show the property's location, surroundings, and neighborhood context.",
      },
      {
        title: "Best reviews",
        available: false,
        description:
          "Highlight your best guest reviews to build trust and showcase positive experiences.",
      },
      {
        title: "High speed internet",
        available: false,
        description:
          "Show your internet setup and speed test results to attract business travelers.",
      },
      {
        title: "Map with points of interest",
        available: false,
        description:
          "A map showing nearby attractions, restaurants, and transportation options.",
      },
    ];
  }

  refreshSuggestions(): void {
    // This could trigger a refresh of suggestions based on current property data
    console.log("Refreshing photo suggestions...");
    // You could add logic here to regenerate suggestions based on current property analysis
  }

  showSuggestionInfo(suggestion: any): void {
    // This could show a modal or tooltip with more detailed information
    console.log("Showing info for:", suggestion.title);
    // You could implement a modal or detailed view here
  }

  // Export methods
  exportPropertyData(): void {
    if (!this.propertyData) return;

    const csvData: any = {
      "Property Title": this.propertyData.property_title,
      "Listing ID": this.propertyData.listing_id,
      "Total Photos": this.propertyData.num_photos,
      "Captioned Photos": this.propertyData.captioned_count,
      "Missing Captions": this.propertyData.missing_captions,
      "Caption Rate %": this.getCaptionPercentage(),
      "Airbnb Link": this.propertyData.airbnb_link,
      "Booking Link": this.propertyData.booking_link,
      "Pricelab Link": this.propertyData.pricelabs_link,
      // "VRBO Link": this.propertyData.vrbo_link,
    };

    // Add competitor data if available
    if (
      this.propertyData.competitor &&
      this.propertyData.competitor.length > 0
    ) {
      const comp = this.propertyData.competitor[0];
      csvData["Competitor Name"] = comp.name;
      csvData["Competitor Photos"] = comp.num_photos;
      csvData["Photo Gap"] = comp.num_photos - this.propertyData.num_photos;
      csvData["Competitor Rating"] = comp.reviews_score;
      csvData["Competitor Reviews"] = comp.reviews_count;
      csvData["Location Score"] = comp.location_score;
    }

    const headers = Object.keys(csvData);
    const csvContent = [
      headers.join(","),
      headers.map((header) => `"${csvData[header] || ""}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${this.propertyData.listing_id}_details_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Thumbnail navigation methods
  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  setCurrentCompetitorImage(index: number): void {
    this.currentCompetitorImageIndex = index;
  }

  // Touch event handlers
  onTouchStart(event: TouchEvent, type: "main" | "competitor"): void {
    this.currentSwipeType = type;
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    // Prevent default to avoid scrolling while swiping
    event.preventDefault();
  }

  onTouchEnd(event: TouchEvent, type: "main" | "competitor"): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    this.handleSwipe(type);
    this.currentSwipeType = null;
  }

  // Mouse event handlers for desktop
  onMouseDown(event: MouseEvent, type: "main" | "competitor"): void {
    this.currentSwipeType = type;
    this.mouseStartX = event.clientX;
    this.mouseStartY = event.clientY;
    this.isMouseDown = true;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isMouseDown) return;
    // Prevent text selection while dragging
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent, type: "main" | "competitor"): void {
    if (!this.isMouseDown) return;

    const mouseEndX = event.clientX;
    const mouseEndY = event.clientY;

    // Calculate swipe distance
    const deltaX = mouseEndX - this.mouseStartX;
    const deltaY = mouseEndY - this.mouseStartY;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      this.touchStartX = this.mouseStartX;
      this.touchEndX = mouseEndX;
      this.handleSwipe(type);
    }

    this.isMouseDown = false;
    this.currentSwipeType = null;
  }

  // Handle swipe logic
  private handleSwipe(type: "main" | "competitor"): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    // Minimum swipe distance
    const minSwipeDistance = 50;

    // Only trigger if horizontal swipe is greater than vertical
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > minSwipeDistance
    ) {
      if (type === "main") {
        if (deltaX > 0) {
          // Swipe right - go to previous image
          this.previousImage();
        } else {
          // Swipe left - go to next image
          this.nextImage();
        }
      } else if (type === "competitor") {
        if (deltaX > 0) {
          // Swipe right - go to previous competitor image
          this.previousCompetitorImage();
        } else {
          // Swipe left - go to next competitor image
          this.nextCompetitorImage();
        }
      }
    }
  }

  // Thumbnail navigation methods for grid layout
  getVisibleThumbnails(type: "main" | "competitor"): any[] {
    const currentIndex =
      type === "main"
        ? this.currentImageIndex
        : this.currentCompetitorImageIndex;
    const photos =
      type === "main"
        ? this.getAllPropertyPhotos()
        : this.getCurrentCompetitor()?.photos;

    if (!photos || photos.length === 0) return [];

    // Always show 3 thumbnails: previous, current, next
    const visibleThumbnails = [];

    for (let i = -1; i <= 1; i++) {
      const index = currentIndex + i;
      if (index >= 0 && index < photos.length) {
        visibleThumbnails.push(photos[index]);
      } else {
        // Add placeholder for edge cases
        visibleThumbnails.push(null);
      }
    }

    return visibleThumbnails;
  }

  getThumbnailIndex(type: "main" | "competitor", visibleIndex: number): number {
    const currentIndex =
      type === "main"
        ? this.currentImageIndex
        : this.currentCompetitorImageIndex;
    return currentIndex + (visibleIndex - 1); // visibleIndex: 0=prev, 1=current, 2=next
  }

  // Thumbnail touch event handlers
  onThumbnailTouchStart(event: TouchEvent, type: "main" | "competitor"): void {
    this.currentThumbnailSwipeType = type;
    this.thumbnailTouchStartX = event.touches[0].clientX;
    this.thumbnailTouchStartY = event.touches[0].clientY;
  }

  onThumbnailTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

  onThumbnailTouchEnd(event: TouchEvent, type: "main" | "competitor"): void {
    this.thumbnailTouchEndX = event.changedTouches[0].clientX;
    this.thumbnailTouchEndY = event.changedTouches[0].clientY;
    this.handleThumbnailSwipe(type);
    this.currentThumbnailSwipeType = null;
  }

  // Thumbnail mouse event handlers
  onThumbnailMouseDown(event: MouseEvent, type: "main" | "competitor"): void {
    this.currentThumbnailSwipeType = type;
    this.thumbnailMouseStartX = event.clientX;
    this.thumbnailMouseStartY = event.clientY;
    this.isThumbnailMouseDown = true;
  }

  onThumbnailMouseMove(event: MouseEvent): void {
    if (!this.isThumbnailMouseDown) return;
    event.preventDefault();
  }

  onThumbnailMouseUp(event: MouseEvent, type: "main" | "competitor"): void {
    if (!this.isThumbnailMouseDown) return;

    const mouseEndX = event.clientX;
    const mouseEndY = event.clientY;

    const deltaX = mouseEndX - this.thumbnailMouseStartX;
    const deltaY = mouseEndY - this.thumbnailMouseStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      this.thumbnailTouchStartX = this.thumbnailMouseStartX;
      this.thumbnailTouchEndX = mouseEndX;
      this.handleThumbnailSwipe(type);
    }

    this.isThumbnailMouseDown = false;
    this.currentThumbnailSwipeType = null;
  }

  // Handle thumbnail swipe logic
  private handleThumbnailSwipe(type: "main" | "competitor"): void {
    const deltaX = this.thumbnailTouchEndX - this.thumbnailTouchStartX;
    const deltaY = this.thumbnailTouchEndY - this.thumbnailTouchStartY;

    const minSwipeDistance = 50;

    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > minSwipeDistance
    ) {
      if (type === "main") {
        if (deltaX > 0) {
          // Swipe right - go to previous image
          this.previousImage();
        } else {
          // Swipe left - go to next image
          this.nextImage();
        }
      } else if (type === "competitor") {
        if (deltaX > 0) {
          // Swipe right - go to previous competitor image
          this.previousCompetitorImage();
        } else {
          // Swipe left - go to next competitor image
          this.nextCompetitorImage();
        }
      }
    }
  }

  // Caption modal methods
  openCaptionModal(photoId: string): void {
    this.selectedPhotoId = photoId;
    this.captionText = "";
    this.showCaptionModal = true;
  }

  closeCaptionModal(): void {
    this.showCaptionModal = false;
    this.selectedPhotoId = "";
    this.captionText = "";
    this.isSubmittingCaption = false;
  }

  submitCaption(): void {
    if (!this.captionText.trim()) {
      return;
    }

    this.isSubmittingCaption = true;

    // Simulate API call - replace with actual API call
    setTimeout(() => {
      // Here you would typically make an API call to save the caption
      console.log(
        `Adding caption for photo ${this.selectedPhotoId}:`,
        this.captionText
      );

      // Simulate success
      this.isSubmittingCaption = false;
      this.closeCaptionModal();

      // You might want to show a success message here
      // this.showSuccessMessage('Caption added successfully!');
    }, 2000);
  }
}
