import { Component, OnInit } from "@angular/core";
import {
  PropertiesService,
  PropertyData,
} from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { DeploymentCuesService } from "../_services/deploymentCues.service";

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
    operatorId: '',
    name: '',
    tag: '',
    description1: '',
    description2: '',
    pickups: []
  };

  // Notes Modal state
  showNotesModal: boolean = false;
  selectedPropertyIdForNotes: string | null = null;
  newNoteText: string = '';
  // Deployment Cues state
  deploymentCues: any[] = [];
  currentCueIndex: number = 0;
  totalCues: number = 0;
  currentCuePage: number = 1;
  totalCuePages: number = 1;
  constructor(
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private deploymentCuesService: DeploymentCuesService
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
      this.loadDeploymentCues();
    });

    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showCueFormModal) {
        this.closeCueFormModal();
      }
    });
  }

  loadProperties(): void {
    this.loadFilteredPropertiesData();
  }
  loadDeploymentCues(): void {
    this.deploymentCuesService.getDeploymentCues(this.operatorId as string).subscribe({
      next: (response: any) => {
        console.log(response);
        this.deploymentCues = response.data.deploymentCues;
        this.totalCues = response.data.pagination.total;
        this.totalCuePages = response.data.pagination.total_pages;
        this.currentCuePage = response.data.pagination.page;
        
        // Reset current cue index when loading new data
        this.currentCueIndex = 0;
      },
      error: (error: any) => {
        console.log(error);
      }
    });
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
  openCueFormModal(cue: any): void {
    this.editingCueId = cue._id;
    
    if (cue._id) {
      // Load cue data for editing (demo data)
      this.cueFormData = cue;
    } else {
      // Reset form for creating new cue
      this.resetCueForm();
    }
    
    this.showCueFormModal = true;
    
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
  }

  closeCueFormModal(): void {
    this.showCueFormModal = false;
    this.editingCueId = null;
    this.resetCueForm();
    
    // Remove body scroll prevention when modal is closed
    document.body.classList.remove('modal-open');
  }

  resetCueForm(): void {
    this.cueFormData = {
      operatorId: this.operatorId || '',
      name: '',
      tag: '',
      description1: '',
      description2: '',
      pickups: []
    };
  }

  loadCueData(cueId: string): void {
    // Demo data for editing
    const demoCues: any = {
      'cue1': {
        operatorId: this.operatorId || '',
        name: 'Low Occupancy Alert',
        tag: 'Critical',
        description1: 'Property occupancy below 30% for the current month',
        description2: 'Immediate action required to improve booking rates',
        pickups: [
          { name: 'Pickup Case 1', description: 'Reduce the month by 15%' },
          { name: 'Pickup Case 2', description: 'Promote listing on social media' }
        ]
      },
      'cue2': {
        operatorId: this.operatorId || '',
        name: 'High Demand Period',
        tag: 'High Priority',
        description1: 'High booking demand detected for upcoming holiday season',
        description2: 'Optimize pricing and availability for maximum revenue',
        pickups: [
          { name: 'Pickup Case 1', description: 'Increase Rate by 20%' },
          { name: 'Pickup Case 2', description: 'Update Availability Calendar' }
        ]
      },
      'cue3': {
        operatorId: this.operatorId || '',
        name: 'Maintenance Required',
        tag: 'Urgent',
        description1: 'Scheduled maintenance and inspection required',
        description2: 'Block dates and coordinate with maintenance team',
        pickups: [
          { name: 'Pickup Case 1', description: 'Schedule Service Appointment' },
          { name: 'Pickup Case 2', description: 'Block Dates in Calendar' }
        ]
      },
      'cue4': {
        operatorId: this.operatorId || '',
        name: 'Price Optimization',
        tag: 'Medium Priority',
        description1: 'Review and optimize pricing strategy based on market trends',
        description2: 'Analyze competition and adjust rates accordingly',
        pickups: [
          { name: 'Pickup Case 1', description: 'Analyze Competition' },
          { name: 'Pickup Case 2', description: 'Update Rates' },
          { name: 'Pickup Case 3', description: 'Set Dynamic Pricing' }
        ]
      }
    };

    if (demoCues[cueId]) {
      this.cueFormData = { ...demoCues[cueId] };
    }
  }

  addPickupCase(): void {
    this.cueFormData.pickups.push({ name: '', description: '' });
  }

  removePickupCase(index: number): void {
    this.cueFormData.pickups.splice(index, 1);
  }

  saveCue(): void {
    // Ensure operatorId is set
    this.cueFormData.operatorId = this.operatorId || '';
    
    // Validate pickup cases
    if (this.cueFormData.pickups.length === 0) {
      this.toastr.warning('Please add at least one pickup case');
      return;
    }

    // Validate pickup case fields
    const invalidPickups = this.cueFormData.pickups.some((pickup: any) => 
      !pickup.name || !pickup.name.trim() || !pickup.description || !pickup.description.trim()
    );
    
    if (invalidPickups) {
      this.toastr.warning('Please fill in all pickup case names and descriptions');
      return;
    }

    if (this.editingCueId) {
      console.log('Updated cue:', this.editingCueId, this.cueFormData);
      delete this.cueFormData.createdAt
      this.deploymentCuesService.updateDeploymentCue(this.editingCueId, this.cueFormData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Deployment cue updated successfully!');
            this.loadDeploymentCues();
            this.closeCueFormModal();
          } else {  
            this.toastr.error(response.message);
            this.closeCueFormModal();
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to update deployment cue');
          this.closeCueFormModal();
        }
      });
    } else {
      this.deploymentCuesService.createDeploymentCues(this.cueFormData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Deployment cue created successfully!');
            this.loadDeploymentCues();
            this.closeCueFormModal();
          } else {
            this.toastr.error(response.message);
            this.closeCueFormModal();
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to create deployment cue');
          this.closeCueFormModal();
        }
      });
    }
    
  }

  deleteCue(cueId: string): void {
    if (confirm('Are you sure you want to delete this deployment cue?')) {
      this.deploymentCuesService.deleteDeploymentCue(cueId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Deployment cue deleted successfully!');
            this.loadDeploymentCues();
          } else {
            this.toastr.error(response.message);
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to delete deployment cue');
        }
      });
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

  // Deployment Cue Navigation Methods
  goToPreviousCue(): void {
    if (this.currentCueIndex > 0) {
      this.currentCueIndex--;
    }
  }

  goToNextCue(): void {
    if (this.currentCueIndex < this.deploymentCues.length - 1) {
      this.currentCueIndex++;
    }
  }

  canGoToPrevious(): boolean {
    return this.currentCueIndex > 0;
  }

  canGoToNext(): boolean {
    return this.currentCueIndex < this.deploymentCues.length - 1;
  }

  getCurrentCue(): any {
    return this.deploymentCues[this.currentCueIndex] || null;
  }
}