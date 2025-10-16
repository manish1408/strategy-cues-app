import { Component, OnInit, ViewChild } from "@angular/core";
import {
  PropertiesService,
  PropertyData,
} from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { DeploymentCuesService } from "../_services/deploymentCues.service";
import { finalize } from "rxjs/operators";
import { CuePropertiesService } from "../_services/cue-properties.service";
import { AuthenticationService } from "../_services/authentication.service";
@Component({
  selector: 'app-deployment',
  templateUrl: './deployment.component.html',
  styleUrl: './deployment.component.scss',
})
export class DeploymentComponent implements OnInit {
  @ViewChild('cueFormModalCloseBtn') cueFormModalCloseBtn: any;
  @ViewChild('notesModalCloseBtn') notesModalCloseBtn: any;

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
  deploymentCuesLoading: boolean = false;
  cueProperties: any[] = [];

  // Selection state
  selectedPropertyIds: Set<string> = new Set();
  selectAllProperties: boolean = false;

  // Status update loading state
  updatingStatusPropertyIds: Set<string> = new Set();
  
  // Assignee update loading state
  updatingAssigneePropertyIds: Set<string> = new Set();
  
  allUsers: any[] = [];
  selectedPropertyForNotes: any[] = [];
  loggedInUser: any = null;
  constructor(
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private deploymentCuesService: DeploymentCuesService,
    private cuePropertiesService: CuePropertiesService,
    private authService: AuthenticationService
  ) {
    this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
  }

  ngOnInit(): void {
    const user_ = this.localStorageService.getItem('STRATEGY-CUES-USER');
    if (user_ && user_ !== 'undefined') {
        const userData = JSON.parse(user_);
        this.loggedInUser = userData.user;
    }
    // Get operatorId from query parameters or localStorage
    this.route.queryParams.subscribe(params => {
      if (params['operatorId']) {
        this.operatorId = params['operatorId'];
      } else {
        this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
      }
      this.loadProperties();
      this.loadDeploymentCues();
      this.loadAllUsers();
    });

    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showCueFormModal) {
        this.closeCueFormModal();
      }
    });
  }
  loadAllUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (response: any) => {
        this.allUsers = response.data.users;
        console.log('Loaded users:', this.allUsers);
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.toastr.error('Failed to load users');
      }
    });
  }

  loadProperties(): void {
    this.loadFilteredPropertiesData();
  }
  loadDeploymentCues(): void {
    this.deploymentCuesLoading = true;
    this.deploymentCuesService
    .getDeploymentCues(this.operatorId as string)
    .pipe(
      finalize(() => this.deploymentCuesLoading = false)
    )
    .subscribe({
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
    this
      .cuePropertiesService.getCueProperties(this.operatorId as string)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.cueProperties = response.data.map((p: any) => ({
              ...p,
              assignedTo: p.assignedTo || { userId: '', name: '' }
            }));
            console.log('Loaded cue properties:', this.cueProperties);
            // Debug first property if available
            if (this.cueProperties.length > 0) {
              console.log('First property assignedTo:', this.cueProperties[0].assignedTo);
            }
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
    
 
  }

  closeCueFormModal(): void {
    // this.showCueFormModal = false;
    this.cueFormModalCloseBtn.nativeElement.click();

    this.editingCueId = null;
    this.resetCueForm();
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
  openNotesModal(property: any): void {
    this.selectedPropertyForNotes = property.notes || [];
    this.selectedPropertyIdForNotes = property._id;
    this.newNoteText = '';
  }

  closeNotesModal(): void {
    this.notesModalCloseBtn.nativeElement.click();
    this.selectedPropertyIdForNotes = null;
    this.newNoteText = '';
  }

  addNote(): void {
    if (!this.newNoteText || !this.newNoteText.trim()) {
      this.toastr.warning('Please enter a note');
      return;
    }

    if (!this.selectedPropertyIdForNotes) {
      this.toastr.warning('No property selected for notes');
      return;
    }

    if (!this.loggedInUser) {
      this.toastr.warning('User information not available');
      return;
    }

    // Create the new note object
    const newNote = {
      note: this.newNoteText.trim(),
      userId: this.loggedInUser.id,
      userName: this.loggedInUser.fullName || this.loggedInUser.userName,
      userEmail: this.loggedInUser.email,
      userCompleteName: this.loggedInUser.fullName,
    };

    // Get existing notes and add the new note
    const existingNotes = this.selectedPropertyForNotes || [];
    const updatedNotes = [...existingNotes, newNote];

    // Prepare the payload
    const updateData = {
      notes: updatedNotes
    };

    // Make API call to update the cue property
    this.cuePropertiesService.updateCueProperty(this.selectedPropertyIdForNotes, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Note added successfully!');
          // Update the local property notes
          const property = this.cueProperties.find(p => p._id === this.selectedPropertyIdForNotes);
          if (property) {
            property.notes = updatedNotes;
          }
          // Update the selected property notes for the modal
          this.selectedPropertyForNotes = updatedNotes;
          this.newNoteText = '';
        } else {
          this.toastr.error(response.message || 'Failed to add note');
        }
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to add note');
        console.error('Add note error:', error);
      }
    });
  }

  deleteNote(noteId: string): void {
    if (confirm('Are you sure you want to delete this note?')) {
      if (!this.selectedPropertyIdForNotes) {
        this.toastr.warning('No property selected for notes');
        return;
      }

      // Remove the note from the local array
      const updatedNotes = this.selectedPropertyForNotes.filter((note: any) => 
        (note._id || note.id) !== noteId
      );

      // Prepare the payload
      const updateData = {
        notes: updatedNotes
      };

      // Make API call to update the cue property
      this.cuePropertiesService.updateCueProperty(this.selectedPropertyIdForNotes, updateData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('Note deleted successfully!');
            // Update the local property notes
            const property = this.cueProperties.find(p => p._id === this.selectedPropertyIdForNotes);
            if (property) {
              property.notes = updatedNotes;
            }
            // Update the selected property notes for the modal
            this.selectedPropertyForNotes = updatedNotes;
          } else {
            this.toastr.error(response.message || 'Failed to delete note');
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to delete note');
          console.error('Delete note error:', error);
        }
      });
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

  // Selection methods
  togglePropertySelection(propertyId: string): void {
    if (this.selectedPropertyIds.has(propertyId)) {
      this.selectedPropertyIds.delete(propertyId);
    } else {
      this.selectedPropertyIds.add(propertyId);
    }
    this.updateSelectAllState();
  }

  isPropertySelected(propertyId: string): boolean {
    return this.selectedPropertyIds.has(propertyId);
  }

  toggleSelectAll(): void {
    const visiblePropertyIds = this.cueProperties
      .filter(property => property._id)
      .map(property => property._id);

    const allVisibleSelected = visiblePropertyIds.length > 0 && 
      visiblePropertyIds.every(id => this.selectedPropertyIds.has(id));
    const someVisibleSelected = visiblePropertyIds.some(id => this.selectedPropertyIds.has(id));

    if (allVisibleSelected) {
      // All selected → Deselect all
      visiblePropertyIds.forEach(id => {
        this.selectedPropertyIds.delete(id);
      });
    } else if (someVisibleSelected) {
      // Some selected → Select all remaining
      visiblePropertyIds.forEach(id => {
        this.selectedPropertyIds.add(id);
      });
    } else {
      // None selected → Select all
      visiblePropertyIds.forEach(id => {
        this.selectedPropertyIds.add(id);
      });
    }

    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    if (this.cueProperties.length === 0) {
      this.selectAllProperties = false;
      return;
    }

    const visiblePropertyIds = this.cueProperties
      .filter(property => property._id)
      .map(property => property._id);

    this.selectAllProperties = visiblePropertyIds.length > 0 && 
      visiblePropertyIds.every(id => this.selectedPropertyIds.has(id));
  }

  getSelectedCount(): number {
    return this.selectedPropertyIds.size;
  }

  getSelectedProperties(): any[] {
    return this.cueProperties.filter(property => 
      property._id && this.selectedPropertyIds.has(property._id)
    );
  }

  clearSelection(): void {
    this.selectedPropertyIds.clear();
    this.selectAllProperties = false;
  }

  // Example method to demonstrate how to use selected properties
  logSelectedProperties(): void {
    const selectedProperties = this.getSelectedProperties();
    console.log('Selected Properties:', selectedProperties);
    console.log('Selected Count:', this.getSelectedCount());
    console.log('Selected IDs:', Array.from(this.selectedPropertyIds));
  }

  // Status update method
  updatePropertyStatus(property: any, newStatus: string): void {
    if (!property._id || !newStatus) {
      this.toastr.warning('Invalid property or status');
      return;
    }

    // Add to loading state
    this.updatingStatusPropertyIds.add(property._id);

    const updateData = {
      status: newStatus
    };

    this.cuePropertiesService.updateCueProperty(property._id, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Status updated successfully!');
          // Update the local property status
          property.status = newStatus;
          this.updatingStatusPropertyIds.delete(property._id);
        } else {
          this.toastr.error(response.message || 'Failed to update status');
          this.updatingStatusPropertyIds.delete(property._id);
        }
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to update status');
        console.error('Status update error:', error);
        this.updatingStatusPropertyIds.delete(property._id);
      },
      complete: () => {
        // Remove from loading state
        this.updatingStatusPropertyIds.delete(property._id);
      }
    });
  }

  // Handle status dropdown change
  onStatusChange(property: any, event: any): void {
    const newStatus = event.target.value;
    if (newStatus) {
      this.updatePropertyStatus(property, newStatus);
    }
  }

  // Check if property status is being updated
  isPropertyStatusUpdating(propertyId: string): boolean {
    return this.updatingStatusPropertyIds.has(propertyId);
  }

  // Assignee update method
  updatePropertyAssignee(property: any, userId: string): void {
    if (!property._id || !userId) {
      this.toastr.warning('Invalid property or assignee');
      return;
    }

    // Find the selected user
    const selectedUser = this.allUsers.find(user => user.id === userId);
    if (!selectedUser) {
      this.toastr.warning('Selected user not found');
      return;
    }

    // Add to loading state
    this.updatingAssigneePropertyIds.add(property._id);

    const updateData = {
      assignedTo: {
        name: selectedUser.fullName,
        userId: selectedUser.id
      }
    };

    this.cuePropertiesService.updateCueProperty(property._id, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('Assignee updated successfully!');
          // Update the local property assignee
          property.assignedTo = updateData.assignedTo;
          this.updatingAssigneePropertyIds.delete(property._id);
        } else {
          this.toastr.error(response.message || 'Failed to update assignee');
          this.updatingAssigneePropertyIds.delete(property._id);
        }
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to update assignee');
        console.error('Assignee update error:', error);
        this.updatingAssigneePropertyIds.delete(property._id);
      },
      complete: () => {
        // Remove from loading state
        this.updatingAssigneePropertyIds.delete(property._id);
      }
    });
  }

  // Handle assignee dropdown change
  onAssigneeChange(property: any, event: any): void {
    const userId = event.target.value;
    if (userId) {
      this.updatePropertyAssignee(property, userId);
    }
  }

  // Check if property assignee is being updated
  isPropertyAssigneeUpdating(propertyId: string): boolean {
    return this.updatingAssigneePropertyIds.has(propertyId);
  }

  // Debug method to check property data structure
  debugPropertyData(property: any): void {
    console.log('Property data:', property);
    console.log('AssignedTo:', property.assignedTo);
    console.log('All users:', this.allUsers);
    if (property.assignedTo?.userId) {
      const matchingUser = this.allUsers.find(user => user.id === property.assignedTo.userId);
      console.log('Matching user:', matchingUser);
    }
  }



}