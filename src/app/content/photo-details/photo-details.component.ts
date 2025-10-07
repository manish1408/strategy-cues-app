import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
// import photoComparisonData from "../../json_data/photo_comparison_data.json";
import { GalleryItem, ImageItem } from "ng-gallery";
import { CompetitorComparisonService } from "../../_services/competitor-comparison.servie";
import { SummaryPipe } from "../../summary.pipe";
import { ImageCaptionService } from "../../_services/image-caption.service";
import { ToastService } from "../../_services/toast.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-photo-details",
  templateUrl: "./photo-details.component.html",
  styleUrl: "./photo-details.component.scss",
  providers: [SummaryPipe],
})
export class PhotoDetailsComponent implements OnInit {
  operatorId: string = "";
  propertyId: string = "";
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

  // Caption generation properties
  isGeneratingCaption: boolean = false;
  generatingPhotoId: string = "";
  generatingPhotoUrl: string = "";
  
  // Store photo metadata separately since ImageItem doesn't support custom data
  currentPlatformPhotos: any[] = [];

  // Loading state
  isLoading: boolean = true;
  isRefreshingCaptions: boolean = false;

  // Platform tabs
  selectedPlatform: string = "airbnb";
  selectedPropertyPlatform: string = "airbnb";
  selectedCompetitorPlatform: string = "airbnb";
  isPropertyGalleryLoading: boolean = false;
  isCompetitorGalleryLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private competitorComparisonService: CompetitorComparisonService,
    private cdr: ChangeDetectorRef,
    private imageCaptionService: ImageCaptionService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.params["id"];
    this.operatorId = this.route.snapshot.queryParams["operatorId"] || "";
    console.log("Property ID:", this.propertyId);
    console.log("Operator ID:", this.operatorId);

    // API call to get property competitors
    this.loadPropertyCompetitors(this.propertyId);

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
            
            // Fetch captions for the default platform (Airbnb)
            this.fetchAllCaptionsForPlatform('airbnb');
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

  // Get platform-specific photo gap for a competitor
  getCompetitorPlatformPhotoGap(competitor: any, platform: string): number {
    if (!competitor) return 0;
    
    // Get competitor count for specific platform
    let competitorCount = 0;
    switch (platform) {
      case 'airbnb':
        competitorCount = competitor.propertyAirbnbPhotos?.length || 0;
        break;
      case 'booking':
        competitorCount = competitor.propertyBookingPhotos?.length || 0;
        break;
      case 'vrbo':
        competitorCount = competitor.propertyVrboPhotos?.length || 0;
        break;
    }
    
    const propertyCount = this.getPropertyPlatformPhotoCount(platform);
    
    return competitorCount - propertyCount;
  }

  // Get platform photo count for a specific competitor
  getCompetitorPlatformPhotoCountForCompetitor(competitor: any, platform: string): number {
    if (!competitor) return 0;
    
    switch (platform) {
      case 'airbnb':
        return competitor.propertyAirbnbPhotos?.length || 0;
      case 'booking':
        return competitor.propertyBookingPhotos?.length || 0;
      case 'vrbo':
        return competitor.propertyVrboPhotos?.length || 0;
      default:
        return 0;
    }
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

  openPhotoInNewWindow(photoId: string): void {
    const photo = this.getPhotoById(photoId);
    if (photo && photo.url) {
      window.open(photo.url, '_blank');
    }
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
      // Airbnb system icons
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
      // Booking icons
      pool: "fa-swimming-pool",
      wifi: "fa-wifi",
      parking_sign: "fa-parking",
      kitchen: "fa-utensils",
      tv: "fa-tv",
      elevator: "fa-elevator",
      air_conditioning: "fa-snowflake",
      balcony: "fa-home",
      view: "fa-eye",
      internet: "fa-wifi",
      private_pool: "fa-swimming-pool",
      outdoor_pool: "fa-swimming-pool",
      smoke_free: "fa-ban-smoking",
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

  getTotalPhotos(): number {
    if (!this.propertyData?.Photos) return 0;
    
    const airbnbCount = this.propertyData.Photos.airbnb?.length || 0;
    const bookingCount = this.propertyData.Photos.booking?.length || 0;
    const vrboCount = this.propertyData.Photos.vrbo?.length || 0;
    
    return airbnbCount + bookingCount + vrboCount;
  }

  getCaptionedCount(): number {
    if (!this.propertyData?.Photos) return 0;
    
    let captionedCount = 0;
    
    // Count captioned photos from Airbnb
    if (this.propertyData.Photos.airbnb) {
      captionedCount += this.propertyData.Photos.airbnb.filter((photo: any) => 
        photo.caption && photo.caption.trim() !== ''
      ).length;
    }
    
    // Count captioned photos from Booking
    if (this.propertyData.Photos.booking) {
      captionedCount += this.propertyData.Photos.booking.filter((photo: any) => 
        photo.caption && photo.caption.trim() !== ''
      ).length;
    }
    
    // Count captioned photos from VRBO
    if (this.propertyData.Photos.vrbo) {
      captionedCount += this.propertyData.Photos.vrbo.filter((photo: any) => 
        photo.caption && photo.caption.trim() !== ''
      ).length;
    }
    
    return captionedCount;
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
      .filter((photo: any) => !photo.caption || photo.caption.trim() === '')
      .map((photo: any) => photo.id || "Unknown");
  }

  // Get count of missing captions
  getMissingCaptionsCount(): number {
    return this.getMissingCaptionPhotos().length;
  }

  // Get photos missing captions for specific platform
  getMissingCaptionPhotosForPlatform(platform: string): string[] {
    if (!this.propertyData?.Photos) return [];
    
    let platformPhotos: any[] = [];
    switch (platform) {
      case 'airbnb':
        platformPhotos = this.propertyData.Photos.airbnb || [];
        break;
      case 'booking':
        platformPhotos = this.propertyData.Photos.booking || [];
        break;
      case 'vrbo':
        platformPhotos = this.propertyData.Photos.vrbo || [];
        break;
      default:
        return [];
    }
    
    // Return only photos that are missing captions
    return platformPhotos
      .filter((photo: any) => !photo.caption || photo.caption.trim() === '')
      .map((photo: any) => photo.id || "Unknown");
  }

  // Get count of photos without captions for specific platform
  getMissingCaptionsCountForPlatform(platform: string): number {
    if (!this.propertyData?.Photos) return 0;
    
    let platformPhotos: any[] = [];
    switch (platform) {
      case 'airbnb':
        platformPhotos = this.propertyData.Photos.airbnb || [];
        break;
      case 'booking':
        platformPhotos = this.propertyData.Photos.booking || [];
        break;
      case 'vrbo':
        platformPhotos = this.propertyData.Photos.vrbo || [];
        break;
      default:
        return 0;
    }
    
    return platformPhotos.filter((photo: any) => !photo.caption || photo.caption.trim() === '').length;
  }

  // Get all photos for specific platform
  getAllPhotosForPlatform(platform: string): string[] {
    if (!this.propertyData?.Photos) return [];
    
    let platformPhotos: any[] = [];
    switch (platform) {
      case 'airbnb':
        platformPhotos = this.propertyData.Photos.airbnb || [];
        break;
      case 'booking':
        platformPhotos = this.propertyData.Photos.booking || [];
        break;
      case 'vrbo':
        platformPhotos = this.propertyData.Photos.vrbo || [];
        break;
      default:
        return [];
    }
    
    return platformPhotos.map((photo: any) => photo.id || "Unknown");
  }

  // Get photos with generated captions for specific platform
  getGeneratedCaptionPhotosForPlatform(platform: string): string[] {
    if (!this.propertyData?.Photos) return [];
    
    let platformPhotos: any[] = [];
    switch (platform) {
      case 'airbnb':
        platformPhotos = this.propertyData.Photos.airbnb || [];
        break;
      case 'booking':
        platformPhotos = this.propertyData.Photos.booking || [];
        break;
      case 'vrbo':
        platformPhotos = this.propertyData.Photos.vrbo || [];
        break;
      default:
        return [];
    }
    
    // Return only photos that have captions
    return platformPhotos
      .filter((photo: any) => photo.caption && photo.caption.trim() !== '')
      .map((photo: any) => photo.id || "Unknown");
  }

  // Fetch all captions for current platform photos
  fetchAllCaptionsForPlatform(platform: string): void {
    if (!this.propertyData?.Photos) return;
    
    this.isRefreshingCaptions = true;
    
    // Get captions by source (saved captions)
    this.imageCaptionService.getCaptionsBySource({
      operator_id: this.operatorId,
      property_id: this.propertyId,
      source: platform as 'airbnb' | 'booking' | 'vrbo'
    }).subscribe({
      next: (response: any) => {
        console.log('Fetched saved captions response:', response);
        
        if (response.success && response.data && Array.isArray(response.data)) {
          console.log('Saved captions data received:', response.data);
          // Update captions from saved data
          this.updateCaptionsFromSavedData(response.data, platform);
        } else {
          console.log('No saved captions found');
        }
        
        this.isRefreshingCaptions = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching saved captions:', error);
        this.isRefreshingCaptions = false;
        this.cdr.detectChanges();
      }
    });
  }


  // Update captions from saved data
  private updateCaptionsFromSavedData(savedCaptions: any[], platform: string): void {
    console.log('Updating captions from saved data:', savedCaptions);
    console.log('Platform:', platform);
    
    if (!this.propertyData?.Photos || !savedCaptions) {
      console.log('No property data or saved captions available');
      return;
    }
    
    let platformPhotos: any[] = [];
    switch (platform) {
      case 'airbnb':
        platformPhotos = this.propertyData.Photos.airbnb || [];
        break;
      case 'booking':
        platformPhotos = this.propertyData.Photos.booking || [];
        break;
      case 'vrbo':
        platformPhotos = this.propertyData.Photos.vrbo || [];
        break;
      default:
        return;
    }
    
    console.log('Platform photos:', platformPhotos);
    
    let updatedCount = 0;
    // Update captions for each photo from saved data
    platformPhotos.forEach((photo: any, index: number) => {
      console.log(`Processing photo ${index}:`, photo.url);
      
      if (photo.url) {
        // Try to find by url or imageId field
        const savedCaption = savedCaptions.find((item: any) => 
          item.url === photo.url || item.imageId === photo.url
        );
        
        if (savedCaption && savedCaption.caption) {
          console.log(`Found saved caption for ${photo.url}:`, savedCaption.caption);
          photo.caption = savedCaption.caption;
          updatedCount++;
        } else {
          console.log(`No saved caption found for ${photo.url}`);
        }
      }
    });
    
    console.log(`Updated ${updatedCount} captions from saved data for ${platform} platform`);
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

  // Unified platform selection method
  selectPlatform(platform: string): void {
    // Skip VRBO if it's commented out
    if (platform === 'vrbo') {
      return;
    }
    
    this.selectedPlatform = platform;
    this.selectedPropertyPlatform = platform;
    this.selectedCompetitorPlatform = platform;
    
    this.isPropertyGalleryLoading = true;
    this.isCompetitorGalleryLoading = true;
    
    // Update images based on selected platform
    setTimeout(() => {
      this.updatePropertyPlatformImages();
      this.updateCompetitorPlatformImages();
      this.isPropertyGalleryLoading = false;
      this.isCompetitorGalleryLoading = false;
      
      // Fetch all captions for the selected platform
      this.fetchAllCaptionsForPlatform(platform);
    }, 300);
  }

  // Get amenities for selected platform
  getPropertyAmenitiesForPlatform(platform: string): any[] {
    if (!this.propertyData) return [];
    
    // Check if Amenities object exists (API response structure)
    if (this.propertyData.Amenities) {
      switch (platform) {
        case 'airbnb':
          return this.propertyData.Amenities.Airbnb || [];
        case 'booking':
          return this.propertyData.Amenities.Booking || [];
        case 'vrbo':
          return this.propertyData.Amenities.VRBO || [];
        default:
          return [];
      }
    }
    
    // Fallback to old structure if Amenities object doesn't exist
    switch (platform) {
      case 'airbnb':
        return this.propertyData.amenitiesAirbnb || [];
      case 'booking':
        return this.propertyData.amenitiesBooking || [];
      case 'vrbo':
        return this.propertyData.amenitiesVrbo || [];
      default:
        return [];
    }
  }

  // Get competitor amenities for selected platform
  getCompetitorAmenitiesForPlatform(platform: string): any[] {
    const competitor = this.getCurrentCompetitor();
    if (!competitor) return [];
    
    // API response structure: competitors use lowercase camelCase properties
    switch (platform) {
      case 'airbnb':
        return competitor.amenitiesAirbnb || [];
      case 'booking':
        return competitor.amenitiesBooking || [];
      case 'vrbo':
        return competitor.amenitiesVrbo || [];
      default:
        return [];
    }
  }

  // Platform tab switching methods (keeping for backward compatibility)
  selectPropertyPlatform(platform: string): void {
    this.selectPlatform(platform);
  }

  selectCompetitorPlatform(platform: string): void {
    this.selectPlatform(platform);
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

    // Store photo metadata separately
    this.currentPlatformPhotos = platformPhotos;

    this.images = platformPhotos.map(
      (photo: any) => new ImageItem({ 
        src: photo.url, 
        thumb: photo.url,
        alt: photo.caption || photo.accessibility_label || 'Property photo'
      })
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
   
    ];
  }

  // Get photo suggestions filtered by platform
  getPhotoSuggestionsForPlatform(platform: string): any[] {
    const allSuggestions = this.getPhotoSuggestions();
    
    // Filter suggestions based on platform
    // You can add platform-specific logic here
    return allSuggestions.filter((suggestion: any) => {
      // For now, return all suggestions, but you can add platform-specific filtering
      // Example: return suggestion.platform === platform || !suggestion.platform;
      return true;
    });
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

  // Caption generation methods
  generateCaption(photoUrl: string, photoId: string): void {
    if (this.isGeneratingCaption) {
      return;
    }

    this.isGeneratingCaption = true;
    this.generatingPhotoUrl = photoUrl;

    this.imageCaptionService.generateCaption({
      operator_id: this.operatorId,
      property_id: this.propertyId,
      source: this.selectedPropertyPlatform as 'airbnb' | 'booking' | 'vrbo',
      image_url: photoUrl,
      image_id: photoUrl
    })
      .subscribe({
        next: (response: any) => {
          console.log('Caption generated successfully:', response);
          
          // Show success toast
          if (response.success) {
            const caption = response.data?.caption || response.caption;
            
            if (caption) {
              // Update the photo caption immediately in the UI
              this.updatePhotoCaptionByUrl(photoUrl, caption);
              this.toastr.success('Caption generated and saved successfully!');
            } else {
              this.toastr.warning('Caption generated but no caption text received.');
            }
            
            // Also refresh captions for the current platform to ensure consistency
            this.fetchAllCaptionsForPlatform(this.selectedPropertyPlatform);
          } else {
            this.toastr.error('Failed to generate caption. Please try again.');
          }
          
          this.isGeneratingCaption = false;
          this.generatingPhotoUrl = "";
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error generating caption:', error.message);
          this.toastr.error('Failed to generate caption. Please try again.');
          this.isGeneratingCaption = false;
          this.generatingPhotoUrl = "";
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
        }
      });
  }

  private updatePhotoCaption(photoId: string, caption: string): void {
    if (!this.propertyData?.Photos) return;

    // Update Airbnb photos
    if (this.propertyData.Photos.airbnb) {
      const photo = this.propertyData.Photos.airbnb.find((p: any) => p.id === photoId);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'airbnb') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }

    // Update Booking photos
    if (this.propertyData.Photos.booking) {
      const photo = this.propertyData.Photos.booking.find((p: any) => p.id === photoId);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'booking') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }

    // Update VRBO photos
    if (this.propertyData.Photos.vrbo) {
      const photo = this.propertyData.Photos.vrbo.find((p: any) => p.id === photoId);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'vrbo') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }
  }

  private updatePhotoCaptionByUrl(photoUrl: string, caption: string): void {
    if (!this.propertyData?.Photos) return;

    // Update Airbnb photos
    if (this.propertyData.Photos.airbnb) {
      const photo = this.propertyData.Photos.airbnb.find((p: any) => p.url === photoUrl);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'airbnb') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }

    // Update Booking photos
    if (this.propertyData.Photos.booking) {
      const photo = this.propertyData.Photos.booking.find((p: any) => p.url === photoUrl);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'booking') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }

    // Update VRBO photos
    if (this.propertyData.Photos.vrbo) {
      const photo = this.propertyData.Photos.vrbo.find((p: any) => p.url === photoUrl);
      if (photo) {
        photo.caption = caption;
        // Update current platform photos if it's the same platform
        if (this.selectedPropertyPlatform === 'vrbo') {
          this.updatePropertyPlatformImages();
        }
        return;
      }
    }
  }

  isGeneratingCaptionForPhoto(photoId: string): boolean {
    return this.isGeneratingCaption && this.generatingPhotoId === photoId;
  }

  isGeneratingCaptionForPhotoUrl(photoUrl: string): boolean {
    return this.isGeneratingCaption && this.generatingPhotoUrl === photoUrl;
  }

  // Get current photo data for caption generation
  getCurrentPhotoData(): any {
    if (!this.currentPlatformPhotos || this.currentPlatformPhotos.length === 0) return null;
    
    // Get the current image index from the gallery
    // This might need to be adjusted based on how the gallery component works
    const currentIndex = this.currentImageIndex || 0;
    const currentPhoto = this.currentPlatformPhotos[currentIndex];
    
    return currentPhoto || null;
  }

  // Check if current photo has a caption
  hasCurrentPhotoCaption(): boolean {
    const photoData = this.getCurrentPhotoData();
    return photoData?.caption && photoData.caption.trim() !== '';
  }

  // Get current photo ID
  getCurrentPhotoId(): string {
    const photoData = this.getCurrentPhotoData();
    return photoData?.id || '';
  }

  // Get the first available photo from any platform for a competitor
  getCompetitorFirstPhoto(competitor: any): string {
    if (!competitor) return 'assets/images/placeholder.jpg';

    // Try to get first photo from any platform
    if (competitor.propertyAirbnbPhotos && competitor.propertyAirbnbPhotos.length > 0) {
      return competitor.propertyAirbnbPhotos[0].url;
    }
    if (competitor.propertyBookingPhotos && competitor.propertyBookingPhotos.length > 0) {
      return competitor.propertyBookingPhotos[0].url;
    }
    if (competitor.propertyVrboPhotos && competitor.propertyVrboPhotos.length > 0) {
      return competitor.propertyVrboPhotos[0].url;
    }

    return 'assets/images/placeholder.jpg';
  }

  // Get user-friendly gap message
  getUserFriendlyGapMessage(gap: number): string {
    if (gap > 0) {
      return `${gap} photos behind`;
    } else if (gap < 0) {
      return `${Math.abs(gap)} photos ahead`;
    } else {
      return 'Same photo count';
    }
  }

  // Get photo by ID from all platforms
  getPhotoById(photoId: string): any {
    if (!this.propertyData?.Photos) return null;
    
    // Check Airbnb photos
    if (this.propertyData.Photos.airbnb) {
      const photo = this.propertyData.Photos.airbnb.find((p: any) => p.id === photoId);
      if (photo) return photo;
    }
    
    // Check Booking photos
    if (this.propertyData.Photos.booking) {
      const photo = this.propertyData.Photos.booking.find((p: any) => p.id === photoId);
      if (photo) return photo;
    }
    
    // Check VRBO photos
    if (this.propertyData.Photos.vrbo) {
      const photo = this.propertyData.Photos.vrbo.find((p: any) => p.id === photoId);
      if (photo) return photo;
    }
    
    return null;
  }
}
