import { Component, OnInit } from "@angular/core";
import {
  PropertiesService,
  PropertyData,
} from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: 'app-deployment',
  templateUrl: './deployment.component.html',
  styleUrl: './deployment.component.scss',
})
export class DeploymentComponent implements OnInit {

  // Data from API
  propertyData: PropertyData[] = [];
  loading: boolean = false;
  error: string | null = null;
  operatorId: string | null = null;

  // Infinite scroll properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;

  // Preset loading state (used in template)
  presetLoading: boolean = false;

  // Preset selection state (used in template checkboxes)
  selectedForPresetIds: Set<string> = new Set();
  selectAllForPreset: boolean = false;
  isPresetMode: boolean = false;

  // Active tab state
  activeTab: 'table' | 'cues' = 'cues';

  // Deployment Cue Form state
  showCueFormModal: boolean = false;
  editingCueId: string | null = null;
  cueFormData: any = {
    name: '',
    properties: [],
    description: '',
    actions: '',
    status: ''
  };

  // Notes Modal state
  showNotesModal: boolean = false;
  selectedPropertyIdForNotes: string | null = null;
  newNoteText: string = '';

  // Property dropdown configuration
  propertyDropdownConfig = {
    displayKey: "value",
    search: true,
    height: "auto",
    placeholder: "Select Properties",
    limitTo: 0,
    moreText: "more",
    noResultsFound: "No properties found!",
    searchPlaceholder: "Search properties...",
    searchOnKey: "value",
    clearOnSelection: false,
    inputDirection: "ltr"
  };

  propertyOptions: any[] = [
    { value: 'Sunset Beach Villa' },
    { value: 'Downtown Luxury Apartment' },
    { value: 'Mountain View Cabin' },
    { value: 'Beachfront Bungalow' }
  ];

  constructor(
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
  }

  ngOnInit(): void {
    // Get operatorId from query parameters or localStorage
    this.route.queryParams.subscribe(params => {
      if (params['operatorId']) {
        this.operatorId = params['operatorId'];
      } else {
        this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
      }
      this.loadProperties();
    });
  }

  loadProperties(): void {
    this.loadFilteredPropertiesData();
  }
  
  loadFilteredPropertiesData(): void {
    // Build filter parameters
    this.loading = true;
    const filterParams = this.buildFilterParams();

    // Load current page data using filter endpoint
    this.propertiesService
      .filterProperties(filterParams)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const newData = PropertiesService.extractPropertiesArray(response);

            // For infinite scroll: append data instead of replacing
            if (this.currentPage === 1) {
              this.propertyData = newData;
            } else {
              this.propertyData = [...this.propertyData, ...newData];
            }

            this.totalPages = response.data.pagination.total_pages;
              this.currentPage = response.data.pagination.page;
              this.itemsPerPage = response.data.pagination.limit;
              this.hasMoreData = this.currentPage < this.totalPages;
          } else {
            this.error = response.message || "Failed to load properties data";
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.error = "Error loading properties. Please try again.";
          this.loading = false;
          this.isLoadingMore = false;
        },
        complete: () => {
         
        }
      });
  }

  buildFilterParams(): any {
    const params: any = {
      operator_id: this.operatorId,
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    return params;
  }

  refreshData(): void {
    this.loadProperties();
  }

  clearAllFilters(): void {
    this.currentPage = 1;
    this.hasMoreData = true;
    this.loadFilteredPropertiesData();
  }

  // Infinite scroll handler
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.loadMoreData();
    }
  }

  loadMoreData(): void {
    if (this.hasMoreData && !this.isLoadingMore && !this.loading) {
      this.isLoadingMore = true;
      this.currentPage++;
      this.loadFilteredPropertiesData();
    }
  }

  // Get filtered data for display
  getFilteredPropertyData(): any[] {
    return this.propertyData;
  }

  // Helper methods for template
  safeParseNumber(value: any): number {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      return parseFloat(value.replace("%", "")) || 0;
    }
    return 0;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  hasBookingPolicies(bookingData: any): boolean {
    if (!bookingData) return false;
    if (Array.isArray(bookingData)) {
      return bookingData.length > 0;
    }
    return !!bookingData;
  }

  getBookingPoliciesArray(bookingData: any): any[] {
    if (Array.isArray(bookingData)) {
      return bookingData;
    }
    return [];
  }

  hasValidAirbnbPolicy(airbnbData: any): boolean {
    if (!airbnbData) return false;
    return !!(airbnbData.type || airbnbData.description || airbnbData.free_cancellation_until);
  }

  getPropertyImage(property: PropertyData): string {
    // Priority order: Booking.com -> Airbnb -> VRBO -> Placeholder
    if (property.Photos?.booking && property.Photos.booking.length > 0) {
      return property.Photos.booking[0].url;
    }
    if (property.Photos?.airbnb && property.Photos.airbnb.length > 0) {
      return property.Photos.airbnb[0].url;
    }
    if (property.Photos?.vrbo && property.Photos.vrbo.length > 0) {
      return property.Photos.vrbo[0].url;
    }
    return 'assets/images/placeholder.jpg';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.jpg';
  }

  getOccupancyColor(percentage: number, isLight: boolean = false): string {
    if (percentage >= 66) {
      return isLight ? '#C7E596' : '#78C000';
    } else if (percentage >= 33) {
      return isLight ? '#FFE4B5' : '#FF8C00';
    } else {
      return isLight ? '#FFC0CB' : '#FF6347';
    }
  }

  getPerformanceClass(value: any): string {
    const numValue = this.safeParseNumber(value);
    if (numValue > 0) return "text-success";
    if (numValue < 0) return "text-danger";
    return "text-muted";
  }

  getStarArray(
    rating: string | number,
    maxRating: number
  ): Array<{ filled: boolean }> {
    const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
    const stars: Array<{ filled: boolean }> = [];

    if (isNaN(numRating) || numRating < 0) {
      for (let i = 0; i < 5; i++) {
        stars.push({ filled: false });
      }
      return stars;
    }

    const normalizedRating = maxRating === 10 ? numRating / 2 : numRating;
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;

    for (let i = 0; i < fullStars && i < 5; i++) {
      stars.push({ filled: true });
    }

    if (hasHalfStar && fullStars < 5) {
      stars.push({ filled: true });
    }

    const totalFilledStars = hasHalfStar ? fullStars + 1 : fullStars;
    for (let i = totalFilledStars; i < 5; i++) {
      stars.push({ filled: false });
    }

    return stars;
  }

  formatGuestConfig(guestConfig: any): string {
    if (!guestConfig) {
      return 'N/A';
    }

    if (guestConfig.max_guests && typeof guestConfig.max_guests === 'number') {
      return `${guestConfig.max_guests}`;
    } else {
      const adults = this.extractNumber(guestConfig.max_adults) || 0;
      const children = this.extractNumber(guestConfig.max_children) || 0;
      const total = adults + children;
      return `${total} (${adults}+${children})`;
    }
  }

  private extractNumber(text: string): number {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  openPropertyUrl(
    property: any,
    platform: "Booking" | "Airbnb" | "VRBO"
  ): void {
    let url: string | null = null;

    switch (platform) {
      case "Booking":
        url = property.BookingUrl;
        break;
      case "Airbnb":
        url = property.AirbnbUrl;
        break;
      case "VRBO":
        url = property.VRBOUrl;
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  viewDetails(propertyId: string) {
    if (!propertyId) {
      return;
    }
    this.router.navigate(["/revenue/property-details", propertyId]);
  }

  // Preset selection methods (used in template)
  togglePropertySelectionForPreset(propertyId: string): void {
    if (this.selectedForPresetIds.has(propertyId)) {
      this.selectedForPresetIds.delete(propertyId);
    } else {
      this.selectedForPresetIds.add(propertyId);
    }
    this.updateSelectAllForPresetState();
  }

  isPropertySelectedForPreset(propertyId: string): boolean {
    return this.selectedForPresetIds.has(propertyId);
  }

  toggleSelectAllForPreset(): void {
    const filteredData = this.getFilteredPropertyData();
    const visiblePropertyIds = filteredData
      .filter(property => property._id)
      .map(property => property._id);

    const allVisibleSelected = visiblePropertyIds.length > 0 &&
      visiblePropertyIds.every(id => this.selectedForPresetIds.has(id));
    const someVisibleSelected = visiblePropertyIds.some(id => this.selectedForPresetIds.has(id));

    if (allVisibleSelected) {
      filteredData.forEach(property => {
        if (property._id) {
          this.selectedForPresetIds.delete(property._id);
        }
      });
    } else if (someVisibleSelected) {
      filteredData.forEach(property => {
        if (property._id) {
          this.selectedForPresetIds.add(property._id);
        }
      });
    } else {
      filteredData.forEach(property => {
        if (property._id) {
          this.selectedForPresetIds.add(property._id);
        }
      });
    }

    this.updateSelectAllForPresetState();
  }

  updateSelectAllForPresetState(): void {
    const filteredData = this.getFilteredPropertyData();
    if (filteredData.length === 0) {
      this.selectAllForPreset = false;
      return;
    }

    const visiblePropertyIds = filteredData
      .filter(property => property._id)
      .map(property => property._id);

    this.selectAllForPreset = visiblePropertyIds.length > 0 && visiblePropertyIds.every(id =>
      this.selectedForPresetIds.has(id)
    );
  }

  getSelectedForPresetCount(): number {
    return this.selectedForPresetIds.size;
  }

  deselectSelectedForPreset(): void {
    const filteredData = this.getFilteredPropertyData();
    const visiblePropertyIds = filteredData
      .filter(property => property._id)
      .map(property => property._id);

    visiblePropertyIds.forEach(id => {
      if (this.selectedForPresetIds.has(id)) {
        this.selectedForPresetIds.delete(id);
      }
    });

    this.updateSelectAllForPresetState();
  }

  // Tab Management Methods
  switchTab(tab: 'table' | 'cues'): void {
    this.activeTab = tab;
  }

  // Deployment Cue Form Modal Methods
  openCueFormModal(cueId: string | null): void {
    this.editingCueId = cueId;
    
    if (cueId) {
      // Load cue data for editing (demo data)
      this.loadCueData(cueId);
    } else {
      // Reset form for creating new cue
      this.resetCueForm();
    }
    
    this.showCueFormModal = true;
  }

  closeCueFormModal(): void {
    this.showCueFormModal = false;
    this.editingCueId = null;
    this.resetCueForm();
  }

  resetCueForm(): void {
    this.cueFormData = {
      name: '',
      properties: [],
      description: '',
      actions: '',
      status: ''
    };
  }

  loadCueData(cueId: string): void {
    // Demo data for editing
    const demoCues: any = {
      'cue1': {
        name: 'Low Occupancy Alert',
        properties: [
          { value: 'Sunset Beach Villa' },
          { value: 'Downtown Luxury Apartment' }
        ],
        description: 'Property occupancy below 30% for the current month',
        actions: 'Adjust Pricing, Promote Listing, Review Calendar',
        status: 'Active'
      },
      'cue2': {
        name: 'High Demand Period',
        properties: [
          { value: 'Downtown Luxury Apartment' },
          { value: 'Beachfront Bungalow' },
          { value: 'Mountain View Cabin' }
        ],
        description: 'High booking demand detected for upcoming holiday season',
        actions: 'Increase Rate, Update Availability',
        status: 'Active'
      },
      'cue3': {
        name: 'Maintenance Required',
        properties: [
          { value: 'Mountain View Cabin' }
        ],
        description: 'Scheduled maintenance and inspection required',
        actions: 'Schedule Service, Block Dates',
        status: 'Urgent'
      },
      'cue4': {
        name: 'Price Optimization',
        properties: [
          { value: 'Beachfront Bungalow' },
          { value: 'Sunset Beach Villa' },
          { value: 'Downtown Luxury Apartment' },
          { value: 'Mountain View Cabin' }
        ],
        description: 'Review and optimize pricing strategy based on market trends',
        actions: 'Analyze Competition, Update Rates, Set Dynamic Pricing',
        status: 'Pending'
      }
    };

    if (demoCues[cueId]) {
      this.cueFormData = { ...demoCues[cueId] };
    }
  }

  onPropertySelectionChange(): void {
    console.log('Selected properties:', this.cueFormData.properties);
  }

  saveCue(): void {
    if (this.editingCueId) {
      this.toastr.success(`Deployment cue "${this.cueFormData.name}" updated successfully!`);
      console.log('Updated cue:', this.editingCueId, this.cueFormData);
    } else {
      this.toastr.success(`Deployment cue "${this.cueFormData.name}" created successfully!`);
      console.log('Created new cue:', this.cueFormData);
    }
    this.closeCueFormModal();
  }

  deleteCue(cueId: string): void {
    if (confirm('Are you sure you want to delete this deployment cue?')) {
      this.toastr.success('Deployment cue deleted successfully!');
      console.log('Delete cue:', cueId);
    }
  }

  // Notes Management Methods
  openNotesModal(propertyId: string): void {
    this.selectedPropertyIdForNotes = propertyId;
    this.showNotesModal = true;
    this.newNoteText = '';
  }

  closeNotesModal(): void {
    this.showNotesModal = false;
    this.selectedPropertyIdForNotes = null;
    this.newNoteText = '';
  }

  addNote(): void {
    if (!this.newNoteText || !this.newNoteText.trim()) {
      this.toastr.warning('Please enter a note');
      return;
    }

    // In production, this would save to the backend
    const currentUser = 'Manish'; // This would come from auth service
    const timestamp = new Date();
    
    console.log('Adding note:', {
      propertyId: this.selectedPropertyIdForNotes,
      note: this.newNoteText,
      author: currentUser,
      timestamp: timestamp
    });

    this.toastr.success('Note added successfully!');
    this.newNoteText = '';
  }

  deleteNote(noteId: string): void {
    if (confirm('Are you sure you want to delete this note?')) {
      console.log('Deleting note:', noteId);
      this.toastr.success('Note deleted successfully!');
    }
  }
}
