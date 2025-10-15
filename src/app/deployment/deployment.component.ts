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
  editingDeploymentCue: any = null;
  cueFormLoading: boolean = false;
  cueFormData: any = {
    deploymentCueName: '',
    properties: null, // Single property object for both create and edit
    assignedTo: '', // Only used in edit mode
    status: 'pending', // Only used in edit mode
    notes: '' // Only used in edit mode
  };

  // Deployment Cues API Response Data
  deploymentCuesData: any[] = [];
  deploymentCuesLoading: boolean = false;
  deploymentCuesError: string | null = null;
  deploymentCuesPagination: any = null;
  
  // Navigation for deployment cues cards
  currentCueIndex: number = 0;

  // Notes Modal state
  showNotesModal: boolean = false;
  selectedPropertyIdForNotes: string | null = null;
  newNoteText: string = '';

  // Property dropdown configuration
  propertyDropdownConfig = {
    displayKey: "Listing_Name",
    search: true,
    height: "300px",
    placeholder: "Select Property",
    limitTo: 0,
    moreText: "more",
    noResultsFound: "No properties found!",
    searchPlaceholder: "Search properties...",
    searchOnKey: "Listing_Name",
    clearOnSelection: false,
    inputDirection: "ltr",
    customComparator: undefined,
    showDropDown: true,
    enableCheckAll: false,
    enableSearchFilter: true,
    maxHeight: "300px",
    labelKey: "Listing_Name",
    idKey: "id",
    // Additional options for better visibility
    closeOnSelection: true,
    allowClear: true,
    showSelectAll: false
  };

  propertyOptions: any[] = [];

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
      // this.loadProperties();
      this.loadDeploymentCues();
      this.populatePropertyOptions(); // Load all properties for dropdown
    });
  }

  loadProperties(): void {
    this.loadFilteredPropertiesData();
  }

  loadDeploymentCues(): void {
    if (!this.operatorId) {
      console.log('No operator ID available');
      return;
    }

    this.deploymentCuesLoading = true;
    this.deploymentCuesError = null;

    // Call with default pagination parameters (page: 1, limit: 10, sort_order: 'desc')
    this.deploymentCuesService.getDeploymentCues(this.operatorId, 1, 10, 'desc').subscribe({
      next: (response: any) => {
        console.log('Deployment Cues Data:', response);
        console.log('Response details:', {
          success: response.success,
          data: response.data,
          message: response.message
        });

        // API returns deploymentCues directly in response, not nested in response.data
        if (response && response.deploymentCues) {
          this.deploymentCuesData = response.deploymentCues || [];
          this.deploymentCuesPagination = response.pagination || null;
          this.currentCueIndex = 0; // Reset to first deployment cue
          
          // Populate property options from deployment cues data
          this.populatePropertyOptions();
          
          console.log('Deployment Cues bound to component:', {
            deploymentCuesCount: response.deploymentCuesCount || this.deploymentCuesData.length,
            pagination: this.deploymentCuesPagination,
            deploymentCues: this.deploymentCuesData
          });
        } else if (response.success && response.data) {
          // Fallback for old API structure
          this.deploymentCuesData = response.data.deploymentCues || [];
          this.deploymentCuesPagination = response.data.pagination || null;
          this.currentCueIndex = 0; // Reset to first deployment cue
          
          // Populate property options from deployment cues data
          this.populatePropertyOptions();
        } else {
          this.deploymentCuesError = response.message || 'Failed to load deployment cues';
        }
        this.deploymentCuesLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading deployment cues:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        this.deploymentCuesError = 'Error loading deployment cues. Please try again.';
        this.deploymentCuesLoading = false;
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

  // Get deployment cues data for display
  getDeploymentCuesData(): any[] {
    return this.deploymentCuesData;
  }

  // Get all unique properties from deployment cues for table display
  getDeploymentCuesProperties(): any[] {
    const allProperties: any[] = [];
    const seenPropertyIds = new Set<string>();

    this.deploymentCuesData.forEach((deploymentCue: any) => {
      if (deploymentCue.property && deploymentCue.property.id) {
        if (!seenPropertyIds.has(deploymentCue.property.id)) {
          seenPropertyIds.add(deploymentCue.property.id);
          allProperties.push(deploymentCue.property);
        }
      }
    });

    return allProperties;
  }

  // Get deployment cues for a specific property
  getDeploymentCuesForProperty(property: any): any[] {
    return this.deploymentCuesData.filter((cue: any) => 
      cue.propertyId === property.id
    );
  }

  // Get status badge class for styling
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-warning';
      case 'active':
        return 'bg-success';
      case 'urgent':
        return 'bg-danger';
      case 'completed':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  // Get notes count for a specific property
  getNotesCountForProperty(property: any): number {
    const deploymentCuesForProperty = this.getDeploymentCuesForProperty(property);
    return deploymentCuesForProperty.reduce((total, cue) => {
      return total + (cue.notes ? cue.notes.length : 0);
    }, 0);
  }

  // Get assigned names as string
  getAssignedNames(assignedTo: any[]): string {
    if (!assignedTo || assignedTo.length === 0) {
      return '';
    }
    return assignedTo.map((a: any) => a.name).join(', ');
  }

  // Navigation methods for deployment cues cards
  previousCue(): void {
    if (this.currentCueIndex > 0) {
      this.currentCueIndex--;
    }
  }

  nextCue(): void {
    if (this.currentCueIndex < this.deploymentCuesData.length - 1) {
      this.currentCueIndex++;
    }
  }

  // Get current deployment cue to display
  getCurrentDeploymentCue(): any {
    return this.deploymentCuesData[this.currentCueIndex] || null;
  }

  // Check if previous button should be disabled
  isPreviousDisabled(): boolean {
    return this.currentCueIndex === 0;
  }

  // Check if next button should be disabled
  isNextDisabled(): boolean {
    return this.currentCueIndex >= this.deploymentCuesData.length - 1;
  }

  // Handle assignee dropdown change
  onAssigneeChange(property: any, event: any): void {
    const selectedAssignee = event.target.value;
    if (!selectedAssignee) return;

    const deploymentCuesForProperty = this.getDeploymentCuesForProperty(property);
    if (deploymentCuesForProperty.length === 0) return;

    const deploymentCue = deploymentCuesForProperty[0]; // Assuming one deployment cue per property
    
    // Create assignedTo array with the selected user
    const assignedTo = [{
      name: selectedAssignee,
      userId: selectedAssignee.toLowerCase() // You might need to map this to actual user IDs
    }];

    this.updateDeploymentCueStatus(deploymentCue, { assignedTo });
  }

  // Handle status dropdown change
  onStatusChange(property: any, event: any): void {
    const selectedStatus = event.target.value;
    if (!selectedStatus) return;

    const deploymentCuesForProperty = this.getDeploymentCuesForProperty(property);
    if (deploymentCuesForProperty.length === 0) return;

    const deploymentCue = deploymentCuesForProperty[0]; // Assuming one deployment cue per property
    
    this.updateDeploymentCueStatus(deploymentCue, { status: selectedStatus });
  }

  // Update deployment cue status
  private updateDeploymentCueStatus(deploymentCue: any, updateData: any): void {
    const updatePayload = {
      operatorId: deploymentCue.operatorId,
      propertyId: deploymentCue.propertyId, // Send as string, not array
      deploymentCueName: deploymentCue.deploymentCueName,
      assignedTo: updateData.assignedTo || deploymentCue.assignedTo,
      status: updateData.status || deploymentCue.status,
      notes: deploymentCue.notes || []
    };

    this.deploymentCuesService.updateDeploymentCue(deploymentCue.id, updatePayload).subscribe({
      next: (response: any) => {
        console.log('Deployment cue updated successfully:', response);
        
        // Update the local data
        const cueIndex = this.deploymentCuesData.findIndex(cue => cue.id === deploymentCue.id);
        if (cueIndex !== -1) {
          this.deploymentCuesData[cueIndex] = { ...this.deploymentCuesData[cueIndex], ...updateData };
        }
        
        this.toastr.success('Deployment cue updated successfully');
      },
      error: (error: any) => {
        console.error('Error updating deployment cue:', error);
        this.toastr.error('Failed to update deployment cue');
      }
    });
  }

  // Get current assignee for a property
  getCurrentAssignee(property: any): string {
    const deploymentCuesForProperty = this.getDeploymentCuesForProperty(property);
    if (deploymentCuesForProperty.length > 0 && deploymentCuesForProperty[0].assignedTo && deploymentCuesForProperty[0].assignedTo.length > 0) {
      return deploymentCuesForProperty[0].assignedTo[0].name;
    }
    return '';
  }

  // Get current status for a property
  getCurrentStatus(property: any): string {
    const deploymentCuesForProperty = this.getDeploymentCuesForProperty(property);
    if (deploymentCuesForProperty.length > 0) {
      return deploymentCuesForProperty[0].status;
    }
    return '';
  }

  // Populate property options from properties service
  populatePropertyOptions(): void {
    if (!this.operatorId) {
      return;
    }
    
    this.propertiesService.getProperties(1, 100, this.operatorId, 'desc').subscribe({
      next: (response: any) => {
        if (response && response.properties) {
          this.propertyOptions = response.properties;
        } else if (response && response.data && response.data.properties) {
          // Fallback for different response structure
          this.propertyOptions = response.data.properties;
        } else {
          this.propertyOptions = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading properties for dropdown:', error);
        this.propertyOptions = []; // Set empty array on error
      }
    });
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
      // Find the deployment cue by ID
      this.editingDeploymentCue = this.deploymentCuesData.find(cue => cue.id === cueId);
      if (this.editingDeploymentCue) {
        this.loadCueDataFromDeploymentCue(this.editingDeploymentCue);
      }
    } else {
      // Reset form for creating new cue
      this.resetCueForm();
      this.editingDeploymentCue = null;
    }
    
    this.showCueFormModal = true;
  }

  // Load cue data from deployment cue for editing
  loadCueDataFromDeploymentCue(deploymentCue: any): void {
    this.cueFormData = {
      deploymentCueName: deploymentCue.deploymentCueName || '',
      properties: deploymentCue.property || null, // Single property object
      assignedTo: deploymentCue.assignedTo && deploymentCue.assignedTo.length > 0 ? deploymentCue.assignedTo[0].name : '',
      status: deploymentCue.status || 'pending',
      notes: deploymentCue.notes && deploymentCue.notes.length > 0 ? deploymentCue.notes[0].note : ''
    };
  }

  closeCueFormModal(): void {
    this.showCueFormModal = false;
    this.editingCueId = null;
    this.editingDeploymentCue = null;
    this.cueFormLoading = false;
    this.resetCueForm();
  }

  resetCueForm(): void {
    this.cueFormData = {
      deploymentCueName: '',
      properties: null, // Single property object
      assignedTo: '', // Only used in edit mode
      status: 'pending', // Only used in edit mode
      notes: '' // Only used in edit mode
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
      // Update existing deployment cue
      this.updateDeploymentCue();
    } else {
      // Create new deployment cue
      this.createDeploymentCue();
    }
  }

  // Create new deployment cue
  private createDeploymentCue(): void {
    this.cueFormLoading = true;
    
    const createPayload = {
      operatorId: this.operatorId,
      propertyId: this.cueFormData.properties ? [this.cueFormData.properties.id || this.cueFormData.properties._id] : [],
      deploymentCueName: this.cueFormData.deploymentCueName
    };

    this.deploymentCuesService.createDeploymentCues(createPayload).subscribe({
      next: (response: any) => {
        console.log('Deployment cue created successfully:', response);
        this.toastr.success(`Deployment cue "${this.cueFormData.deploymentCueName}" created successfully!`);
        this.cueFormLoading = false;
        this.loadDeploymentCues(); // Reload data
        this.closeCueFormModal();
      },
      error: (error: any) => {
        console.error('Error creating deployment cue:', error);
        this.toastr.error('Failed to create deployment cue');
        this.cueFormLoading = false;
      }
    });
  }

  // Update existing deployment cue
  private updateDeploymentCue(): void {
    if (!this.editingDeploymentCue) return;

    this.cueFormLoading = true;

    // Prepare assignedTo array
    const assignedTo = this.cueFormData.assignedTo ? [{
      name: this.cueFormData.assignedTo,
      userId: this.cueFormData.assignedTo.toLowerCase()
    }] : [];

    // Prepare notes array
    const notes = this.cueFormData.notes ? [{
      note: this.cueFormData.notes,
      userId: 'current_user_id', // You might need to get this from auth service
      userName: 'Current User',
      userEmail: 'user@example.com',
      userCompleteName: 'Current User',
      createdAt: new Date().toISOString()
    }] : [];

    const updatePayload = {
      operatorId: this.editingDeploymentCue.operatorId,
      propertyId: this.editingDeploymentCue.propertyId,
      deploymentCueName: this.cueFormData.deploymentCueName,
      assignedTo: assignedTo,
      status: this.cueFormData.status,
      notes: notes
    };

    this.deploymentCuesService.updateDeploymentCue(this.editingCueId!, updatePayload).subscribe({
      next: (response: any) => {
        console.log('Deployment cue updated successfully:', response);
        this.toastr.success(`Deployment cue "${this.cueFormData.deploymentCueName}" updated successfully!`);
        this.cueFormLoading = false;
        this.loadDeploymentCues(); // Reload data
        this.closeCueFormModal();
      },
      error: (error: any) => {
        console.error('Error updating deployment cue:', error);
        this.toastr.error('Failed to update deployment cue');
        this.cueFormLoading = false;
      }
    });
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
