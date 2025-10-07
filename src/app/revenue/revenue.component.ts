import { Component, OnInit } from "@angular/core";
import {
  PropertiesService,
  PropertyData,
} from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { FilterPresetService } from '../_services/filter-preset.service';
import { FilterPreset } from '../_models/filter-preset.interface';
import { Router, ActivatedRoute } from "@angular/router";
import { ExportService } from "../_services/export.service";
import { ToastrService } from "ngx-toastr";
import { ToastService } from "../_services/toast.service";

// Declare global variables for jQuery and Bootstrap
declare var $: any;
declare var bootstrap: any;

@Component({
  selector: "app-revenue",
  templateUrl: "./revenue.component.html",
  styleUrl: "./revenue.component.scss",
})
export class RevenueComponent implements OnInit {
  // Data from API
  propertyData: PropertyData[] = [];
  loading: boolean = false;
  exportLoading: boolean = false;
  error: string | null = null;
  operatorId: string | null = null;
  sortOrder = "desc";
  // View and tab management
  currentView: "table" | "cards" = "table";
  activeTab: "booking" | "airbnb" | "vrbo" = "booking"; // Keep for backward compatibility
  cardActiveTabs: { [key: number]: "booking" | "airbnb" | "vrbo" } = {};

  // Summary data calculated from JSON
  totalListings: number = 0;
  totalRevenueTM: number = 0;
  totalRevenueNM: number = 0;
  averageOccupancy: number = 0;

  // Search and filter properties
  searchTerm: string = "";
  selectedArea: string = "";
  selectedRoomType: string = "";

  // Basic Range filter properties
  adrMin: number | null = null;
  adrMax: number | null = null;
  revparMin: number | null = null;
  revparMax: number | null = null;
  mpiMin: number | null = null;
  mpiMax: number | null = null;
  minRateThresholdMin: number | null = null;
  minRateThresholdMax: number | null = null;

  // Occupancy filter properties
  occupancyTMMin: number | null = null;
  occupancyTMMax: number | null = null;
  occupancyNMMin: number | null = null;
  occupancyNMMax: number | null = null;
  occupancy7DaysMin: number | null = null;
  occupancy7DaysMax: number | null = null;
  occupancy30DaysMin: number | null = null;
  occupancy30DaysMax: number | null = null;
  pickUpOcc7DaysMin: number | null = null;
  pickUpOcc7DaysMax: number | null = null;
  pickUpOcc14DaysMin: number | null = null;
  pickUpOcc14DaysMax: number | null = null;
  pickUpOcc30DaysMin: number | null = null;
  pickUpOcc30DaysMax: number | null = null;

  // Performance filter properties (STLY Var)
  stlyVarOccMin: number | null = null;
  stlyVarOccMax: number | null = null;
  stlyVarADRMin: number | null = null;
  stlyVarADRMax: number | null = null;
  stlyVarRevPARMin: number | null = null;
  stlyVarRevPARMax: number | null = null;

  // Performance filter properties (STLM Var)
  stlmVarOccMin: number | null = null;
  stlmVarOccMax: number | null = null;
  stlmVarADRMin: number | null = null;
  stlmVarADRMax: number | null = null;
  stlmVarRevPARMin: number | null = null;
  stlmVarRevPARMax: number | null = null;

  // Platform filter properties - Booking.com (three-state: 'not-present', 'yes', 'no')
  bookingGeniusFilter: string = "not-present";
  bookingMobileFilter: string = "not-present";
  bookingPrefFilter: string = "not-present";
  bookingWeeklyFilter: string = "not-present";
  bookingMonthlyFilter: string = "not-present";
  bookingLMDiscFilter: string = "not-present";

  // Platform filter properties - Airbnb (three-state: 'not-present', 'yes', 'no')
  airbnbWeeklyFilter: string = "not-present";
  airbnbMonthlyFilter: string = "not-present";
  airbnbMemberFilter: string = "not-present";
  airbnbLMDiscFilter: string = "not-present";

  // Platform filter properties - VRBO (three-state: 'not-present', 'yes', 'no')
  vrboWeeklyFilter: string = "not-present";
  vrboMonthlyFilter: string = "not-present";

  // Reviews filter properties - Booking.com
  bookingRevScoreMin: number | null = null;
  bookingRevScoreMax: number | null = null;
  bookingTotalRevMin: number | null = null;
  bookingTotalRevMax: number | null = null;

  // Reviews filter properties - Airbnb
  airbnbRevScoreMin: number | null = null;
  airbnbRevScoreMax: number | null = null;
  airbnbTotalRevMin: number | null = null;
  airbnbTotalRevMax: number | null = null;

  // Reviews filter properties - VRBO
  vrboRevScoreMin: number | null = null;
  vrboRevScoreMax: number | null = null;
  vrboTotalRevMin: number | null = null;
  vrboTotalRevMax: number | null = null;

  // Temporary filter properties (draft values before applying)
  tempSelectedArea: string = "";
  tempSelectedRoomType: string = "";

  // Temporary Basic Range filter properties
  tempAdrMin: number | null = null;
  tempAdrMax: number | null = null;
  tempRevparMin: number | null = null;
  tempRevparMax: number | null = null;
  tempMpiMin: number | null = null;
  tempMpiMax: number | null = null;
  tempMinRateThresholdMin: number | null = null;
  tempMinRateThresholdMax: number | null = null;

  // Temporary Occupancy filter properties
  tempOccupancyTMMin: number | null = null;
  tempOccupancyTMMax: number | null = null;
  tempOccupancyNMMin: number | null = null;
  tempOccupancyNMMax: number | null = null;
  tempOccupancy7DaysMin: number | null = null;
  tempOccupancy7DaysMax: number | null = null;
  tempOccupancy30DaysMin: number | null = null;
  tempOccupancy30DaysMax: number | null = null;
  tempPickUpOcc7DaysMin: number | null = null;
  tempPickUpOcc7DaysMax: number | null = null;
  tempPickUpOcc14DaysMin: number | null = null;
  tempPickUpOcc14DaysMax: number | null = null;
  tempPickUpOcc30DaysMin: number | null = null;
  tempPickUpOcc30DaysMax: number | null = null;

  // Temporary Performance filter properties (STLY Var)
  tempStlyVarOccMin: number | null = null;
  tempStlyVarOccMax: number | null = null;
  tempStlyVarADRMin: number | null = null;
  tempStlyVarADRMax: number | null = null;
  tempStlyVarRevPARMin: number | null = null;
  tempStlyVarRevPARMax: number | null = null;

  // Temporary Performance filter properties (STLM Var)
  tempStlmVarOccMin: number | null = null;
  tempStlmVarOccMax: number | null = null;
  tempStlmVarADRMin: number | null = null;
  tempStlmVarADRMax: number | null = null;
  tempStlmVarRevPARMin: number | null = null;
  tempStlmVarRevPARMax: number | null = null;

  // Temporary Platform filter properties - Booking.com (three-state: 'not-present', 'yes', 'no')
  tempBookingGeniusFilter: string = "not-present";
  tempBookingMobileFilter: string = "not-present";
  tempBookingPrefFilter: string = "not-present";
  tempBookingWeeklyFilter: string = "not-present";
  tempBookingMonthlyFilter: string = "not-present";
  tempBookingLMDiscFilter: string = "not-present";

  // Temporary Platform filter properties - Airbnb (three-state: 'not-present', 'yes', 'no')
  tempAirbnbWeeklyFilter: string = "not-present";
  tempAirbnbMonthlyFilter: string = "not-present";
  tempAirbnbMemberFilter: string = "not-present";
  tempAirbnbLMDiscFilter: string = "not-present";

  // Temporary Platform filter properties - VRBO (three-state: 'not-present', 'yes', 'no')
  tempVrboWeeklyFilter: string = "not-present";
  tempVrboMonthlyFilter: string = "not-present";

  // Temporary Reviews filter properties - Booking.com
  tempBookingRevScoreMin: number | null = null;
  tempBookingRevScoreMax: number | null = null;
  tempBookingTotalRevMin: number | null = null;
  tempBookingTotalRevMax: number | null = null;

  // Temporary Reviews filter properties - Airbnb
  tempAirbnbRevScoreMin: number | null = null;
  tempAirbnbRevScoreMax: number | null = null;
  tempAirbnbTotalRevMin: number | null = null;
  tempAirbnbTotalRevMax: number | null = null;

  // Temporary Reviews filter properties - VRBO
  tempVrboRevScoreMin: number | null = null;
  tempVrboRevScoreMax: number | null = null;
  tempVrboTotalRevMin: number | null = null;
  tempVrboTotalRevMax: number | null = null;

  // Infinite scroll properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;

  // Sorting properties
  sortField: string = "";
  sortDirection: "asc" | "desc" = "asc";

  // Utility property for template
  Math = Math;

  // Column visibility properties
  columnVisibility = {
    propertyName: true,
    occupancyTM: true,
    occupancyNM: true,
    adr: true,
    revpar: true,
    mpi: true,
    reviews: true,
    cxlPolicy: true,
    adultChildConfig: true,
    pickupOcc: true,
    minRateThreshold: true,
    stlyVarOcc: true,
    stlyVarRevPAR: true,
    lastReviewScore: true,
    lastReviewDate: true,
    actions: true,
  };

  // Get unique values for filters
  areas: string[] = [];
  roomTypes: string[] = [];

  // Range slider min/max values calculated from data
  adrMinRange: number = 0;
  adrMaxRange: number = 1000;
  revparMinRange: number = 0;
  revparMaxRange: number = 1000;
  mpiMinRange: number = 0;
  mpiMaxRange: number = 200;

  // Performance range values
  stlyVarOccMinRange: number = -100;
  stlyVarOccMaxRange: number = 100;
  stlyVarADRMinRange: number = -100;
  stlyVarADRMaxRange: number = 100;
  stlyVarRevPARMinRange: number = -100;
  stlyVarRevPARMaxRange: number = 100;
  stlmVarOccMinRange: number = -100;
  stlmVarOccMaxRange: number = 100;
  stlmVarADRMinRange: number = -100;
  stlmVarADRMaxRange: number = 100;
  stlmVarRevPARMinRange: number = -100;
  stlmVarRevPARMaxRange: number = 100;

  // Review range values
  bookingTotalRevMinRange: number = 0;
  bookingTotalRevMaxRange: number = 1000;
  airbnbTotalRevMinRange: number = 0;
  airbnbTotalRevMaxRange: number = 1000;
  vrboTotalRevMinRange: number = 0;
  vrboTotalRevMaxRange: number = 1000;

  // Filter preset properties
  filterPresets: FilterPreset[] = [];
  selectedPresetId: string = '';
  showSavePresetForm: boolean = false;
  newPresetName: string = '';
  newPresetDescription: string = '';
  presetSaveError: string = '';
  showPresetManagement: boolean = false;
  
  // Preset loading states
  presetLoading: boolean = false;
  presetSaving: boolean = false;
  presetDeleting: boolean = false;
  presetDuplicating: boolean = false;
  presetExporting: boolean = false;
  presetImporting: boolean = false;

  // Property selection state
  selectedPropertyIds: Set<string> = new Set();
  selectAllProperties: boolean = false;
  showOnlySelected: boolean = true; // Default to showing only selected properties

  constructor(
    private propertiesService: PropertiesService, 
    private localStorageService: LocalStorageService, 
    private filterPresetService: FilterPresetService,
    private router: Router,
    private route: ActivatedRoute,
    private exportService: ExportService,
    private toastr: ToastrService,
    private toastService: ToastService
  ) {
    this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
  }

  // Helper methods to safely parse values that might be strings or numbers
  safeParseNumber(value: any): number {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      // Remove percentage signs and parse
      return parseFloat(value.replace("%", "")) || 0;
    }
    return 0;
  }

  safeParseString(value: any): string {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return "";
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

  ngOnInit(): void {
    // First try to get operatorId from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['operatorId']) {
        this.operatorId = params['operatorId'];
      } else {
        // Fallback to localStorage
        this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
      }
      
      // Load properties with the operatorId
      this.loadProperties();
      
      // Load filter presets after operatorId is set
      this.loadFilterPresets();
    });

  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;

    // Load current page data first
    this.loadFilteredPropertiesData();
  }

  loadFilteredPropertiesData(): void {
    
    // Build filter parameters
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

            // Update pagination data from API response
            if (response.pagination) {
              this.totalPages = response.pagination.total_pages;
              this.currentPage = response.pagination.page;
              this.itemsPerPage = response.pagination.limit;
              this.hasMoreData = this.currentPage < this.totalPages;
            } else if (response.data && response.data.pagination) {
              // Fallback for nested pagination structure
              this.totalPages = response.data.pagination.total_pages;
              this.currentPage = response.data.pagination.page;
              this.itemsPerPage = response.data.pagination.limit;
              this.hasMoreData = this.currentPage < this.totalPages;
            }

            // Calculate range values and filter options from current data
            this.calculateRangeValues();
            this.extractFilterOptions();
            this.initializeTempFilters();

            this.calculateSummaryData();
          } else {
            this.error = response.message || "Failed to load properties data";
          }
          this.loading = false;
          this.isLoadingMore = false;
        },
        error: (error: any) => {
          this.error = "Error loading properties. Please try again.";
          this.loading = false;
          this.isLoadingMore = false;
        },
        complete: () => {
          // Ensure loading is set to false even if there's an issue
          setTimeout(() => {
            if (this.loading) {
              this.loading = false;
            }
            if (this.isLoadingMore) {
              this.isLoadingMore = false;
            }
          }, 1000);
        }
      });
  }

  loadFilteredPropertiesDataWithPropertyRestore(presetPropertyIds: string[]): void {
    // Build filter parameters
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

            // Update pagination data from API response
            if (response.pagination) {
              this.totalPages = response.pagination.total_pages;
              this.currentPage = response.pagination.page;
              this.itemsPerPage = response.pagination.limit;
              this.hasMoreData = this.currentPage < this.totalPages;
            } else if (response.data && response.data.pagination) {
              // Fallback for nested pagination structure
              this.totalPages = response.data.pagination.total_pages;
              this.currentPage = response.data.pagination.page;
              this.itemsPerPage = response.data.pagination.limit;
              this.hasMoreData = this.currentPage < this.totalPages;
            }

            // Calculate range values and filter options from current data
            this.calculateRangeValues();
            this.extractFilterOptions();
            this.initializeTempFilters();

            // Restore property selection from preset
            if (presetPropertyIds && presetPropertyIds.length > 0) {
              console.log('Restoring property selection:', presetPropertyIds);
              this.selectedPropertyIds.clear();
              presetPropertyIds.forEach(id => this.selectedPropertyIds.add(id));
              this.updateSelectAllState();
              // Show only selected properties when preset has property IDs
              this.showOnlySelected = true;
              console.log('Property selection restored. Selected count:', this.selectedPropertyIds.size, 'Show only selected:', this.showOnlySelected);
            } else {
              this.clearPropertySelection();
            }

            this.calculateSummaryData();
          } else {
            this.error = response.message || "Failed to load properties data";
          }
          this.loading = false;
          this.isLoadingMore = false;
        },
        error: (error: any) => {
          this.error = "Error loading properties. Please try again.";
          this.loading = false;
          this.isLoadingMore = false;
        },
        complete: () => {
          // Ensure loading is set to false even if there's an issue
          setTimeout(() => {
            if (this.loading) {
              this.loading = false;
            }
            if (this.isLoadingMore) {
              this.isLoadingMore = false;
            }
          }, 1000);
        }
      });
  }

  calculateSummaryData(): void {
    // Use current page data for summary calculations
    const dataSource = this.propertyData;

    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      this.totalListings = 0;
      this.totalRevenueTM = 0;
      this.totalRevenueNM = 0;
      this.averageOccupancy = 0;
      return;
    }

    this.totalListings = dataSource.length;

    this.totalRevenueTM = dataSource.reduce((sum, item) => {
      return sum + this.safeParseNumber(item.RevPAR?.TM);
    }, 0);

    this.totalRevenueNM = dataSource.reduce((sum, item) => {
      return sum + this.safeParseNumber(item.RevPAR?.NM);
    }, 0);

    this.averageOccupancy =
      dataSource.reduce((sum, item) => {
        return sum + this.safeParseNumber(item.Occupancy?.TM);
      }, 0) / this.totalListings;
  }

  extractFilterOptions(): void {
    // Use current page data for filter options
    const dataSource = this.propertyData;

    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      this.areas = [];
      this.roomTypes = [];
      return;
    }

    this.areas = [...new Set(dataSource.map((item) => item.Area))];
    this.roomTypes = [...new Set(dataSource.map((item) => item.Room_Type))];
  }

  calculateRangeValues(): void {
    // Use current page data for range calculations
    const dataSource = this.propertyData;

    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      // Set default ranges if no data
      this.adrMinRange = 0;
      this.adrMaxRange = 1000;
      this.revparMinRange = 0;
      this.revparMaxRange = 1000;
      this.mpiMinRange = 0;
      this.mpiMaxRange = 200;
      return;
    }

    // Calculate ADR ranges from data source
    const adrValues = dataSource.map((item) =>
      this.safeParseNumber(item.ADR?.TM)
    ).filter(val => val !== null && val !== undefined);
    this.adrMinRange = adrValues.length > 0 ? Math.floor(Math.min(...adrValues)) : 0;
    this.adrMaxRange = adrValues.length > 0 ? Math.ceil(Math.max(...adrValues)) : 1000;

    // Calculate RevPAR ranges from data source
    const revparValues = dataSource.map((item) =>
      this.safeParseNumber(item.RevPAR?.TM)
    ).filter(val => val !== null && val !== undefined);
    this.revparMinRange = revparValues.length > 0 ? Math.floor(Math.min(...revparValues)) : 0;
    this.revparMaxRange = revparValues.length > 0 ? Math.ceil(Math.max(...revparValues)) : 1000;

    // Calculate MPI ranges from data source (using TM values)
    const mpiValues = dataSource.map((item) => this.safeParseNumber(item.MPI?.TM))
      .filter(val => val !== null && val !== undefined);
    this.mpiMinRange = mpiValues.length > 0 ? Math.floor(Math.min(...mpiValues)) : 0;
    this.mpiMaxRange = mpiValues.length > 0 ? Math.ceil(Math.max(...mpiValues)) : 200;

    // Calculate STLY Var ranges from data source
    const stlyOccValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLY_Var?.Occ)
    ).filter(val => val !== null && val !== undefined);
    this.stlyVarOccMinRange = stlyOccValues.length > 0 ? Math.floor(Math.min(...stlyOccValues)) : 0;
    this.stlyVarOccMaxRange = stlyOccValues.length > 0 ? Math.ceil(Math.max(...stlyOccValues)) : 100;

    const stlyADRValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLY_Var?.ADR)
    ).filter(val => val !== null && val !== undefined);
    this.stlyVarADRMinRange = stlyADRValues.length > 0 ? Math.floor(Math.min(...stlyADRValues)) : 0;
    this.stlyVarADRMaxRange = stlyADRValues.length > 0 ? Math.ceil(Math.max(...stlyADRValues)) : 100;

    const stlyRevPARValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLY_Var?.RevPAR)
    ).filter(val => val !== null && val !== undefined);
    this.stlyVarRevPARMinRange = stlyRevPARValues.length > 0 ? Math.floor(Math.min(...stlyRevPARValues)) : 0;
    this.stlyVarRevPARMaxRange = stlyRevPARValues.length > 0 ? Math.ceil(Math.max(...stlyRevPARValues)) : 100;

    // Calculate STLM Var ranges from data source
    const stlmOccValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLM_Var?.Occ)
    ).filter(val => val !== null && val !== undefined);
    this.stlmVarOccMinRange = stlmOccValues.length > 0 ? Math.floor(Math.min(...stlmOccValues)) : 0;
    this.stlmVarOccMaxRange = stlmOccValues.length > 0 ? Math.ceil(Math.max(...stlmOccValues)) : 100;

    const stlmADRValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLM_Var?.ADR)
    ).filter(val => val !== null && val !== undefined);
    this.stlmVarADRMinRange = stlmADRValues.length > 0 ? Math.floor(Math.min(...stlmADRValues)) : 0;
    this.stlmVarADRMaxRange = stlmADRValues.length > 0 ? Math.ceil(Math.max(...stlmADRValues)) : 100;

    const stlmRevPARValues = dataSource.map((item) =>
      this.safeParseNumber(item.STLM_Var?.RevPAR)
    ).filter(val => val !== null && val !== undefined);
    this.stlmVarRevPARMinRange = stlmRevPARValues.length > 0 ? Math.floor(Math.min(...stlmRevPARValues)) : 0;
    this.stlmVarRevPARMaxRange = stlmRevPARValues.length > 0 ? Math.ceil(Math.max(...stlmRevPARValues)) : 100;

    // Calculate Review ranges from data source
    const bookingTotalRevValues = dataSource
      .map((item) => this.safeParseNumber(item.Reviews?.Booking?.Total_Rev))
      .filter((val) => !isNaN(val));
    if (bookingTotalRevValues.length > 0) {
      this.bookingTotalRevMinRange = Math.floor(
        Math.min(...bookingTotalRevValues)
      );
      this.bookingTotalRevMaxRange = Math.ceil(
        Math.max(...bookingTotalRevValues)
      );
    }

    const airbnbTotalRevValues = dataSource
      .map((item) => this.safeParseNumber(item.Reviews.Airbnb.Total_Rev))
      .filter((val) => !isNaN(val));
    if (airbnbTotalRevValues.length > 0) {
      this.airbnbTotalRevMinRange = Math.floor(
        Math.min(...airbnbTotalRevValues)
      );
      this.airbnbTotalRevMaxRange = Math.ceil(
        Math.max(...airbnbTotalRevValues)
      );
    }

    const vrboTotalRevValues = dataSource
      .map((item) => this.safeParseNumber(item.Reviews.VRBO.Total_Rev))
      .filter((val) => !isNaN(val));
    if (vrboTotalRevValues.length > 0) {
      this.vrboTotalRevMinRange = Math.floor(Math.min(...vrboTotalRevValues));
      this.vrboTotalRevMaxRange = Math.ceil(Math.max(...vrboTotalRevValues));
    }
  }

  initializeTempFilters(): void {
    // Initialize temporary filters with current active filter values
    this.tempSelectedArea = this.selectedArea;
    this.tempSelectedRoomType = this.selectedRoomType;

    // Basic filters
    this.tempAdrMin = this.adrMin;
    this.tempAdrMax = this.adrMax;
    this.tempRevparMin = this.revparMin;
    this.tempRevparMax = this.revparMax;
    this.tempMpiMin = this.mpiMin;
    this.tempMpiMax = this.mpiMax;
    this.tempMinRateThresholdMin = this.minRateThresholdMin;
    this.tempMinRateThresholdMax = this.minRateThresholdMax;

    // Occupancy filters
    this.tempOccupancyTMMin = this.occupancyTMMin;
    this.tempOccupancyTMMax = this.occupancyTMMax;
    this.tempOccupancyNMMin = this.occupancyNMMin;
    this.tempOccupancyNMMax = this.occupancyNMMax;
    this.tempOccupancy7DaysMin = this.occupancy7DaysMin;
    this.tempOccupancy7DaysMax = this.occupancy7DaysMax;
    this.tempOccupancy30DaysMin = this.occupancy30DaysMin;
    this.tempOccupancy30DaysMax = this.occupancy30DaysMax;
    this.tempPickUpOcc7DaysMin = this.pickUpOcc7DaysMin;
    this.tempPickUpOcc7DaysMax = this.pickUpOcc7DaysMax;
    this.tempPickUpOcc14DaysMin = this.pickUpOcc14DaysMin;
    this.tempPickUpOcc14DaysMax = this.pickUpOcc14DaysMax;
    this.tempPickUpOcc30DaysMin = this.pickUpOcc30DaysMin;
    this.tempPickUpOcc30DaysMax = this.pickUpOcc30DaysMax;

    // Performance filters
    this.tempStlyVarOccMin = this.stlyVarOccMin;
    this.tempStlyVarOccMax = this.stlyVarOccMax;
    this.tempStlyVarADRMin = this.stlyVarADRMin;
    this.tempStlyVarADRMax = this.stlyVarADRMax;
    this.tempStlyVarRevPARMin = this.stlyVarRevPARMin;
    this.tempStlyVarRevPARMax = this.stlyVarRevPARMax;
    this.tempStlmVarOccMin = this.stlmVarOccMin;
    this.tempStlmVarOccMax = this.stlmVarOccMax;
    this.tempStlmVarADRMin = this.stlmVarADRMin;
    this.tempStlmVarADRMax = this.stlmVarADRMax;
    this.tempStlmVarRevPARMin = this.stlmVarRevPARMin;
    this.tempStlmVarRevPARMax = this.stlmVarRevPARMax;

    // Platform filters
    this.tempBookingGeniusFilter = this.bookingGeniusFilter;
    this.tempBookingMobileFilter = this.bookingMobileFilter;
    this.tempBookingPrefFilter = this.bookingPrefFilter;
    this.tempBookingWeeklyFilter = this.bookingWeeklyFilter;
    this.tempBookingMonthlyFilter = this.bookingMonthlyFilter;
    this.tempBookingLMDiscFilter = this.bookingLMDiscFilter;
    this.tempAirbnbWeeklyFilter = this.airbnbWeeklyFilter;
    this.tempAirbnbMonthlyFilter = this.airbnbMonthlyFilter;
    this.tempAirbnbMemberFilter = this.airbnbMemberFilter;
    this.tempAirbnbLMDiscFilter = this.airbnbLMDiscFilter;
    this.tempVrboWeeklyFilter = this.vrboWeeklyFilter;
    this.tempVrboMonthlyFilter = this.vrboMonthlyFilter;

    // Reviews filters
    this.tempBookingRevScoreMin = this.bookingRevScoreMin;
    this.tempBookingRevScoreMax = this.bookingRevScoreMax;
    this.tempBookingTotalRevMin = this.bookingTotalRevMin;
    this.tempBookingTotalRevMax = this.bookingTotalRevMax;
    this.tempAirbnbRevScoreMin = this.airbnbRevScoreMin;
    this.tempAirbnbRevScoreMax = this.airbnbRevScoreMax;
    this.tempAirbnbTotalRevMin = this.airbnbTotalRevMin;
    this.tempAirbnbTotalRevMax = this.airbnbTotalRevMax;
    this.tempVrboRevScoreMin = this.vrboRevScoreMin;
    this.tempVrboRevScoreMax = this.vrboRevScoreMax;
    this.tempVrboTotalRevMin = this.vrboTotalRevMin;
    this.tempVrboTotalRevMax = this.vrboTotalRevMax;
  }

  // Refresh data from API
  refreshData(): void {
    this.loadProperties();
  }

  // Perform search action
  performSearch(): void {
    // Clear property selection when performing search since results might change
    this.clearPropertySelection();
    this.filterData();
  }

  // Build filter parameters for the API
  buildFilterParams(): any {
    const params: any = {
      operator_id: this.operatorId,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    // Basic filters
    if (this.selectedArea) params.area = this.selectedArea;
    if (this.selectedRoomType) params.room_type = this.selectedRoomType;

    // Basic range filters
    if (this.adrMin !== null) params.adr_min = this.adrMin;
    if (this.adrMax !== null) params.adr_max = this.adrMax;
    if (this.revparMin !== null) params.revpar_min = this.revparMin;
    if (this.revparMax !== null) params.revpar_max = this.revparMax;
    if (this.mpiMin !== null) params.mpi_min = this.mpiMin;
    if (this.mpiMax !== null) params.mpi_max = this.mpiMax;
    if (this.minRateThresholdMin !== null) params.min_rate_threshold_min = this.minRateThresholdMin;
    if (this.minRateThresholdMax !== null) params.min_rate_threshold_max = this.minRateThresholdMax;

    // Occupancy filters
    if (this.occupancyTMMin !== null) params.occ_tm_min = this.occupancyTMMin;
    if (this.occupancyTMMax !== null) params.occ_tm_max = this.occupancyTMMax;
    if (this.occupancyNMMin !== null) params.occ_nm_min = this.occupancyNMMin;
    if (this.occupancyNMMax !== null) params.occ_nm_max = this.occupancyNMMax;
    if (this.occupancy7DaysMin !== null) params.occ_7days_min = this.occupancy7DaysMin;
    if (this.occupancy7DaysMax !== null) params.occ_7days_max = this.occupancy7DaysMax;
    if (this.occupancy30DaysMin !== null) params.occ_30days_min = this.occupancy30DaysMin;
    if (this.occupancy30DaysMax !== null) params.occ_30days_max = this.occupancy30DaysMax;

    // Pickup occupancy filters
    if (this.pickUpOcc7DaysMin !== null) params.pickup_7days_min = this.pickUpOcc7DaysMin;
    if (this.pickUpOcc7DaysMax !== null) params.pickup_7days_max = this.pickUpOcc7DaysMax;
    if (this.pickUpOcc14DaysMin !== null) params.pickup_14days_min = this.pickUpOcc14DaysMin;
    if (this.pickUpOcc14DaysMax !== null) params.pickup_14days_max = this.pickUpOcc14DaysMax;
    if (this.pickUpOcc30DaysMin !== null) params.pickup_30days_min = this.pickUpOcc30DaysMin;
    if (this.pickUpOcc30DaysMax !== null) params.pickup_30days_max = this.pickUpOcc30DaysMax;

    // STLY Variance filters
    if (this.stlyVarOccMin !== null) params.stly_occ_min = this.stlyVarOccMin;
    if (this.stlyVarOccMax !== null) params.stly_occ_max = this.stlyVarOccMax;
    if (this.stlyVarADRMin !== null) params.stly_adr_min = this.stlyVarADRMin;
    if (this.stlyVarADRMax !== null) params.stly_adr_max = this.stlyVarADRMax;
    if (this.stlyVarRevPARMin !== null) params.stly_revpar_min = this.stlyVarRevPARMin;
    if (this.stlyVarRevPARMax !== null) params.stly_revpar_max = this.stlyVarRevPARMax;

    // STLM Variance filters
    if (this.stlmVarOccMin !== null) params.stlm_occ_min = this.stlmVarOccMin;
    if (this.stlmVarOccMax !== null) params.stlm_occ_max = this.stlmVarOccMax;
    if (this.stlmVarADRMin !== null) params.stlm_adr_min = this.stlmVarADRMin;
    if (this.stlmVarADRMax !== null) params.stlm_adr_max = this.stlmVarADRMax;
    if (this.stlmVarRevPARMin !== null) params.stlm_revpar_min = this.stlmVarRevPARMin;
    if (this.stlmVarRevPARMax !== null) params.stlm_revpar_max = this.stlmVarRevPARMax;

    // Platform filters - Booking.com
    if (this.bookingGeniusFilter !== 'not-present') {
      params.booking_genius = this.bookingGeniusFilter === 'yes';
    }
    if (this.bookingMobileFilter !== 'not-present') {
      params.booking_mobile = this.bookingMobileFilter === 'yes';
    }
    if (this.bookingPrefFilter !== 'not-present') {
      params.booking_preferred = this.bookingPrefFilter === 'yes';
    }
    if (this.bookingWeeklyFilter !== 'not-present') {
      params.booking_weekly = this.bookingWeeklyFilter === 'yes';
    }
    if (this.bookingMonthlyFilter !== 'not-present') {
      params.booking_monthly = this.bookingMonthlyFilter === 'yes';
    }
    if (this.bookingLMDiscFilter !== 'not-present') {
      params.booking_lastminute = this.bookingLMDiscFilter === 'yes';
    }

    // Platform filters - Airbnb
    if (this.airbnbWeeklyFilter !== 'not-present') {
      params.airbnb_weekly = this.airbnbWeeklyFilter === 'yes';
    }
    if (this.airbnbMonthlyFilter !== 'not-present') {
      params.airbnb_monthly = this.airbnbMonthlyFilter === 'yes';
    }
    if (this.airbnbMemberFilter !== 'not-present') {
      params.airbnb_member = this.airbnbMemberFilter === 'yes';
    }
    if (this.airbnbLMDiscFilter !== 'not-present') {
      params.airbnb_lastminute = this.airbnbLMDiscFilter === 'yes';
    }

    // Platform filters - VRBO
    if (this.vrboWeeklyFilter !== 'not-present') {
      params.vrbo_weekly = this.vrboWeeklyFilter === 'yes';
    }
    if (this.vrboMonthlyFilter !== 'not-present') {
      params.vrbo_monthly = this.vrboMonthlyFilter === 'yes';
    }

    // Review filters - Booking.com
    if (this.bookingRevScoreMin !== null) params.booking_review_min = this.bookingRevScoreMin;
    if (this.bookingRevScoreMax !== null) params.booking_review_max = this.bookingRevScoreMax;
    if (this.bookingTotalRevMin !== null) params.booking_total_reviews_min = this.bookingTotalRevMin;
    if (this.bookingTotalRevMax !== null) params.booking_total_reviews_max = this.bookingTotalRevMax;

    // Review filters - Airbnb
    if (this.airbnbRevScoreMin !== null) params.airbnb_review_min = this.airbnbRevScoreMin;
    if (this.airbnbRevScoreMax !== null) params.airbnb_review_max = this.airbnbRevScoreMax;
    if (this.airbnbTotalRevMin !== null) params.airbnb_total_reviews_min = this.airbnbTotalRevMin;
    if (this.airbnbTotalRevMax !== null) params.airbnb_total_reviews_max = this.airbnbTotalRevMax;

    // Review filters - VRBO
    if (this.vrboRevScoreMin !== null) params.vrbo_review_min = this.vrboRevScoreMin;
    if (this.vrboRevScoreMax !== null) params.vrbo_review_max = this.vrboRevScoreMax;
    if (this.vrboTotalRevMin !== null) params.vrbo_total_reviews_min = this.vrboTotalRevMin;
    if (this.vrboTotalRevMax !== null) params.vrbo_total_reviews_max = this.vrboTotalRevMax;

    return params;
  }

  // Filter data based on search term, area, room type, and all range filters
  filterData(): void {
    // For infinite scroll, we need to reload data with filters
    // Reset to first page when applying filters
    this.loading = true;
    this.currentPage = 1;
    this.hasMoreData = true;
    
    // Clear property selection when applying new filters since the filtered results might be different
    this.clearPropertySelection();
    
    this.loadFilteredPropertiesData();
  }

  // Sort data by field
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }

    this.propertyData.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      // Handle nested object properties
      switch (field) {
        case "occupancyTM":
          aVal = this.safeParseNumber(a.Occupancy.TM);
          bVal = this.safeParseNumber(b.Occupancy.TM);
          break;
        case "adrTM":
          aVal = this.safeParseNumber(a.ADR.TM);
          bVal = this.safeParseNumber(b.ADR.TM);
          break;
        case "revparTM":
          aVal = this.safeParseNumber(a.RevPAR.TM);
          bVal = this.safeParseNumber(b.RevPAR.TM);
          break;
        case "mpi":
          aVal = this.safeParseNumber(a.MPI?.TM);
          bVal = this.safeParseNumber(b.MPI?.TM);
          break;
        default:
          aVal = (a as any)[field];
          bVal = (b as any)[field];
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return this.sortDirection === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  // Legacy pagination methods - kept for backward compatibility but not used with infinite scroll
  updatePagination(): void {
    // Pagination data is now updated from API response in loadFilteredPropertiesData()
    // This method is kept for backward compatibility but pagination is handled by API
  }

  changePage(page: number): void {
    // Legacy method - not used with infinite scroll
    if (page >= 1 && page !== this.currentPage && page <= this.totalPages) {
      this.loading = true;
      this.currentPage = page;
      this.loadFilteredPropertiesData();
    }
  }

  getPageNumbers(): number[] {
    // Legacy method - not used with infinite scroll
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // View management methods
  switchView(view: "table" | "cards"): void {
    this.currentView = view;
  }

  switchTab(tab: "booking" | "airbnb" | "vrbo"): void {
    this.activeTab = tab;
  }

  // New methods for per-card tab management
  switchCardTab(cardIndex: number, tab: "booking" | "airbnb" | "vrbo"): void {
    this.cardActiveTabs[cardIndex] = tab;
  }

  getActiveTab(cardIndex: number): "booking" | "airbnb" | "vrbo" {
    return this.cardActiveTabs[cardIndex] || "booking"; // Default to 'booking'
  }

  // Utility methods for styling
  getRoomTypeClass(roomType: string): string {
    switch (roomType) {
      case "Studio":
        return "badge-studio";
      case "1BR":
        return "badge-1br";
      case "2BR":
        return "badge-2br";
      case "3BR":
        return "badge-3br";
      case "Loft":
        return "badge-loft";
      case "Townhouse":
        return "badge-townhouse";
      default:
        return "badge-secondary";
    }
  }

  getPerformanceClass(value: any): string {
    const numValue = this.safeParseNumber(value);
    if (numValue > 0) return "text-success";
    if (numValue < 0) return "text-danger";
    return "text-muted";
  }

  getOccupancyClass(occupancy: any): string {
    const numValue = this.safeParseNumber(occupancy);
    if (numValue >= 80) return "bg-success";
    if (numValue >= 60) return "bg-warning";
    return "bg-danger";
  }

  // Generate star array for rating display
  getStarArray(
    rating: string | number,
    maxRating: number
  ): Array<{ filled: boolean }> {
    const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
    const stars: Array<{ filled: boolean }> = [];

    // Handle invalid ratings
    if (isNaN(numRating) || numRating < 0) {
      for (let i = 0; i < 5; i++) {
        stars.push({ filled: false });
      }
      return stars;
    }

    // Convert rating to 5-star scale
    const normalizedRating = maxRating === 10 ? numRating / 2 : numRating;
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;

    // Add filled stars
    for (let i = 0; i < fullStars && i < 5; i++) {
      stars.push({ filled: true });
    }

    // Add half star (treated as filled for simplicity)
    if (hasHalfStar && fullStars < 5) {
      stars.push({ filled: true });
    }

    // Add empty stars
    const totalFilledStars = hasHalfStar ? fullStars + 1 : fullStars;
    for (let i = totalFilledStars; i < 5; i++) {
      stars.push({ filled: false });
    }

    return stars;
  }

  // Action methods
  viewDetails(propertyId: string) {
    if (!propertyId) {
      return;
    }
    this.router.navigate(["/revenue/property-details", propertyId]);
  }

  compareProperty(item: PropertyData): void {
    // Implement property comparison logic
    // This could open a comparison modal, navigate to a comparison page, etc.
  }

  exportToCSV() {
    this.exportLoading = true;
    this.exportService.exportToCSVProperties(this.operatorId || "").subscribe({
      next: (response: any) => {
        this.exportLoading = false;
        
        // Handle JSON response with file_url
        if (response.body && typeof response.body === 'object') {
          const res = response.body;
          if (res.success && res.data && typeof res.data.file_url === "string" && res.data.file_url.startsWith("https")) {
            // Open the file URL directly in a new tab
            window.open(res.data.file_url, "_blank");
            this.toastr.success("Properties exported successfully");
          } else {
            this.toastr.error("Invalid response format from server");
          }
        }
        // Handle blob response from backend (fallback)
        else if (response.body instanceof Blob) {
          const blob = response.body;
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          
          // Try to get filename from Content-Disposition header
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `properties_${new Date().toISOString().split("T")[0]}.csv`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.toastr.success("Properties exported successfully");
        } else {
          this.toastr.error("Invalid response format from server");
        }
      },
      error: (error) => {
        this.exportLoading = false;
        this.toastr.error(error.error?.error || error.message || "Failed to export properties");
      },
    });
}

  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return "";
    }
    // Escape double quotes by doubling them and wrap in quotes if contains comma, quote, or newline
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return stringValue.replace(/"/g, '""');
    }
    return stringValue;
  }

  // Helper method for three-state filtering
  private matchesThreeStateFilter(
    filterValue: string,
    itemValue: string | null | undefined
  ): boolean {
    if (filterValue === "not-present") {
      return true; // No filter applied, show all
    }
    if (filterValue === "yes") {
      return itemValue === "Yes";
    }
    if (filterValue === "no") {
      return itemValue === "No";
    }
    return true;
  }

  // Helper methods for templates
  // getPaginatedData() method removed - now using server-side pagination

  // Helper method to check if property has any last review scores
  hasLastReviewScore(property: PropertyData): boolean {
    const bookingScore = this.safeParseNumber(property.Reviews.Booking.Last_Rev_Score);
    const airbnbScore = this.safeParseNumber(property.Reviews.Airbnb.Last_Rev_Score);
    const vrboScore = this.safeParseNumber(property.Reviews.VRBO.Last_Rev_Score);
    
    return bookingScore > 0 || airbnbScore > 0 || vrboScore > 0;
  }

  // Helper method to check if property has any last review dates
  hasLastReviewDate(property: PropertyData): boolean {
    const bookingDate = property.Reviews.Booking.Last_Review_Date;
    const airbnbDate = property.Reviews.Airbnb.Last_Review_Date;
    const vrboDate = property.Reviews.VRBO.Last_Review_Date;
    
    const hasBookingDate = !!(bookingDate && typeof bookingDate === 'string' && bookingDate.trim() !== '');
    const hasAirbnbDate = !!(airbnbDate && typeof airbnbDate === 'string' && airbnbDate.trim() !== '');
    const hasVrboDate = !!(vrboDate && typeof vrboDate === 'string' && vrboDate.trim() !== '');
    
    return hasBookingDate || hasAirbnbDate || hasVrboDate;
  }


  // Modal and filter methods
  openFilterModal(): void {
    // Use jQuery to show the modal (preferred method with Bootstrap + jQuery)
    if (typeof $ !== "undefined") {
      $("#filterModal").modal("show");
    } else {
      // Fallback to Bootstrap 5 native API
      const modalElement = document.getElementById("filterModal");
      if (modalElement && typeof bootstrap !== "undefined") {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedArea ||
      this.selectedRoomType ||
      // Basic filters
      this.adrMin !== null ||
      this.adrMax !== null ||
      this.revparMin !== null ||
      this.revparMax !== null ||
      this.mpiMin !== null ||
      this.mpiMax !== null ||
      this.minRateThresholdMin !== null ||
      this.minRateThresholdMax !== null ||
      // Occupancy filters
      this.occupancyTMMin !== null ||
      this.occupancyTMMax !== null ||
      this.occupancyNMMin !== null ||
      this.occupancyNMMax !== null ||
      this.occupancy7DaysMin !== null ||
      this.occupancy7DaysMax !== null ||
      this.occupancy30DaysMin !== null ||
      this.occupancy30DaysMax !== null ||
      this.pickUpOcc7DaysMin !== null ||
      this.pickUpOcc7DaysMax !== null ||
      this.pickUpOcc14DaysMin !== null ||
      this.pickUpOcc14DaysMax !== null ||
      this.pickUpOcc30DaysMin !== null ||
      this.pickUpOcc30DaysMax !== null ||
      // Performance filters
      this.stlyVarOccMin !== null ||
      this.stlyVarOccMax !== null ||
      this.stlyVarADRMin !== null ||
      this.stlyVarADRMax !== null ||
      this.stlyVarRevPARMin !== null ||
      this.stlyVarRevPARMax !== null ||
      this.stlmVarOccMin !== null ||
      this.stlmVarOccMax !== null ||
      this.stlmVarADRMin !== null ||
      this.stlmVarADRMax !== null ||
      this.stlmVarRevPARMin !== null ||
      this.stlmVarRevPARMax !== null ||
      // Platform filters (check if any are not 'not-present')
      this.bookingGeniusFilter !== "not-present" ||
      this.bookingMobileFilter !== "not-present" ||
      this.bookingPrefFilter !== "not-present" ||
      this.bookingWeeklyFilter !== "not-present" ||
      this.bookingMonthlyFilter !== "not-present" ||
      this.bookingLMDiscFilter !== "not-present" ||
      this.airbnbWeeklyFilter !== "not-present" ||
      this.airbnbMonthlyFilter !== "not-present" ||
      this.airbnbMemberFilter !== "not-present" ||
      this.airbnbLMDiscFilter !== "not-present" ||
      this.vrboWeeklyFilter !== "not-present" ||
      this.vrboMonthlyFilter !== "not-present" ||
      // Reviews filters
      this.bookingRevScoreMin !== null ||
      this.bookingRevScoreMax !== null ||
      this.bookingTotalRevMin !== null ||
      this.bookingTotalRevMax !== null ||
      this.airbnbRevScoreMin !== null ||
      this.airbnbRevScoreMax !== null ||
      this.airbnbTotalRevMin !== null ||
      this.airbnbTotalRevMax !== null ||
      this.vrboRevScoreMin !== null ||
      this.vrboRevScoreMax !== null ||
      this.vrboTotalRevMin !== null ||
      this.vrboTotalRevMax !== null
    );
  }

  getActiveFilterCount(): number {
    let count = 0;
    // Basic filters
    if (this.selectedArea) count++;
    if (this.selectedRoomType) count++;
    if (this.adrMin !== null || this.adrMax !== null) count++;
    if (this.revparMin !== null || this.revparMax !== null) count++;
    if (this.mpiMin !== null || this.mpiMax !== null) count++;
    if (this.minRateThresholdMin !== null || this.minRateThresholdMax !== null)
      count++;

    // Occupancy filters
    if (this.occupancyTMMin !== null || this.occupancyTMMax !== null) count++;
    if (this.occupancyNMMin !== null || this.occupancyNMMax !== null) count++;
    if (this.occupancy7DaysMin !== null || this.occupancy7DaysMax !== null)
      count++;
    if (this.occupancy30DaysMin !== null || this.occupancy30DaysMax !== null)
      count++;
    if (this.pickUpOcc7DaysMin !== null || this.pickUpOcc7DaysMax !== null)
      count++;
    if (this.pickUpOcc14DaysMin !== null || this.pickUpOcc14DaysMax !== null)
      count++;
    if (this.pickUpOcc30DaysMin !== null || this.pickUpOcc30DaysMax !== null)
      count++;

    // Performance filters
    if (this.stlyVarOccMin !== null || this.stlyVarOccMax !== null) count++;
    if (this.stlyVarADRMin !== null || this.stlyVarADRMax !== null) count++;
    if (this.stlyVarRevPARMin !== null || this.stlyVarRevPARMax !== null)
      count++;
    if (this.stlmVarOccMin !== null || this.stlmVarOccMax !== null) count++;
    if (this.stlmVarADRMin !== null || this.stlmVarADRMax !== null) count++;
    if (this.stlmVarRevPARMin !== null || this.stlmVarRevPARMax !== null)
      count++;

    // Platform filters (count non-'not-present' values)
    if (this.bookingGeniusFilter !== "not-present") count++;
    if (this.bookingMobileFilter !== "not-present") count++;
    if (this.bookingPrefFilter !== "not-present") count++;
    if (this.bookingWeeklyFilter !== "not-present") count++;
    if (this.bookingMonthlyFilter !== "not-present") count++;
    if (this.bookingLMDiscFilter !== "not-present") count++;
    if (this.airbnbWeeklyFilter !== "not-present") count++;
    if (this.airbnbMonthlyFilter !== "not-present") count++;
    if (this.airbnbMemberFilter !== "not-present") count++;
    if (this.airbnbLMDiscFilter !== "not-present") count++;
    if (this.vrboWeeklyFilter !== "not-present") count++;
    if (this.vrboMonthlyFilter !== "not-present") count++;

    // Reviews filters
    if (this.bookingRevScoreMin !== null || this.bookingRevScoreMax !== null)
      count++;
    if (this.bookingTotalRevMin !== null || this.bookingTotalRevMax !== null)
      count++;
    if (this.airbnbRevScoreMin !== null || this.airbnbRevScoreMax !== null)
      count++;
    if (this.airbnbTotalRevMin !== null || this.airbnbTotalRevMax !== null)
      count++;
    if (this.vrboRevScoreMin !== null || this.vrboRevScoreMax !== null) count++;
    if (this.vrboTotalRevMin !== null || this.vrboTotalRevMax !== null) count++;

    return count;
  }

  // Range slider event handlers (update temporary values only)
  onAdrMinChange(event: any): void {
    this.tempAdrMin = parseFloat(event.target.value);
  }

  onAdrMaxChange(event: any): void {
    this.tempAdrMax = parseFloat(event.target.value);
  }

  onRevparMinChange(event: any): void {
    this.tempRevparMin = parseFloat(event.target.value);
  }

  onRevparMaxChange(event: any): void {
    this.tempRevparMax = parseFloat(event.target.value);
  }

  onMpiMinChange(event: any): void {
    this.tempMpiMin = parseFloat(event.target.value);
  }

  onMpiMaxChange(event: any): void {
    this.tempMpiMax = parseFloat(event.target.value);
  }

  onMinRateThresholdMinChange(event: any): void {
    this.tempMinRateThresholdMin = parseFloat(event.target.value);
  }

  onMinRateThresholdMaxChange(event: any): void {
    this.tempMinRateThresholdMax = parseFloat(event.target.value);
  }

  // Occupancy range handlers (update temporary values only)
  onOccupancyTMMinChange(event: any): void {
    this.tempOccupancyTMMin = parseFloat(event.target.value);
  }

  onOccupancyTMMaxChange(event: any): void {
    this.tempOccupancyTMMax = parseFloat(event.target.value);
  }

  onOccupancyNMMinChange(event: any): void {
    this.tempOccupancyNMMin = parseFloat(event.target.value);
  }

  onOccupancyNMMaxChange(event: any): void {
    this.tempOccupancyNMMax = parseFloat(event.target.value);
  }

  onOccupancy7DaysMinChange(event: any): void {
    this.tempOccupancy7DaysMin = parseFloat(event.target.value);
  }

  onOccupancy7DaysMaxChange(event: any): void {
    this.tempOccupancy7DaysMax = parseFloat(event.target.value);
  }

  onOccupancy30DaysMinChange(event: any): void {
    this.tempOccupancy30DaysMin = parseFloat(event.target.value);
  }

  onOccupancy30DaysMaxChange(event: any): void {
    this.tempOccupancy30DaysMax = parseFloat(event.target.value);
  }

  onPickUpOcc7DaysMinChange(event: any): void {
    this.tempPickUpOcc7DaysMin = parseFloat(event.target.value);
  }

  onPickUpOcc7DaysMaxChange(event: any): void {
    this.tempPickUpOcc7DaysMax = parseFloat(event.target.value);
  }

  onPickUpOcc14DaysMinChange(event: any): void {
    this.tempPickUpOcc14DaysMin = parseFloat(event.target.value);
  }

  onPickUpOcc14DaysMaxChange(event: any): void {
    this.tempPickUpOcc14DaysMax = parseFloat(event.target.value);
  }

  onPickUpOcc30DaysMinChange(event: any): void {
    this.tempPickUpOcc30DaysMin = parseFloat(event.target.value);
  }

  onPickUpOcc30DaysMaxChange(event: any): void {
    this.tempPickUpOcc30DaysMax = parseFloat(event.target.value);
  }

  // Performance range handlers (update temporary values only)
  onStlyVarOccMinChange(event: any): void {
    this.tempStlyVarOccMin = parseFloat(event.target.value);
  }

  onStlyVarOccMaxChange(event: any): void {
    this.tempStlyVarOccMax = parseFloat(event.target.value);
  }

  onStlyVarADRMinChange(event: any): void {
    this.tempStlyVarADRMin = parseFloat(event.target.value);
  }

  onStlyVarADRMaxChange(event: any): void {
    this.tempStlyVarADRMax = parseFloat(event.target.value);
  }

  onStlyVarRevPARMinChange(event: any): void {
    this.tempStlyVarRevPARMin = parseFloat(event.target.value);
  }

  onStlyVarRevPARMaxChange(event: any): void {
    this.tempStlyVarRevPARMax = parseFloat(event.target.value);
  }

  onStlmVarOccMinChange(event: any): void {
    this.tempStlmVarOccMin = parseFloat(event.target.value);
  }

  onStlmVarOccMaxChange(event: any): void {
    this.tempStlmVarOccMax = parseFloat(event.target.value);
  }

  onStlmVarADRMinChange(event: any): void {
    this.tempStlmVarADRMin = parseFloat(event.target.value);
  }

  onStlmVarADRMaxChange(event: any): void {
    this.tempStlmVarADRMax = parseFloat(event.target.value);
  }

  onStlmVarRevPARMinChange(event: any): void {
    this.tempStlmVarRevPARMin = parseFloat(event.target.value);
  }

  onStlmVarRevPARMaxChange(event: any): void {
    this.tempStlmVarRevPARMax = parseFloat(event.target.value);
  }

  // Review range handlers (update temporary values only)
  onBookingRevScoreMinChange(event: any): void {
    this.tempBookingRevScoreMin = parseFloat(event.target.value);
  }

  onBookingRevScoreMaxChange(event: any): void {
    this.tempBookingRevScoreMax = parseFloat(event.target.value);
  }

  onBookingTotalRevMinChange(event: any): void {
    this.tempBookingTotalRevMin = parseFloat(event.target.value);
  }

  onBookingTotalRevMaxChange(event: any): void {
    this.tempBookingTotalRevMax = parseFloat(event.target.value);
  }

  onAirbnbRevScoreMinChange(event: any): void {
    this.tempAirbnbRevScoreMin = parseFloat(event.target.value);
  }

  onAirbnbRevScoreMaxChange(event: any): void {
    this.tempAirbnbRevScoreMax = parseFloat(event.target.value);
  }

  onAirbnbTotalRevMinChange(event: any): void {
    this.tempAirbnbTotalRevMin = parseFloat(event.target.value);
  }

  onAirbnbTotalRevMaxChange(event: any): void {
    this.tempAirbnbTotalRevMax = parseFloat(event.target.value);
  }

  onVrboRevScoreMinChange(event: any): void {
    this.tempVrboRevScoreMin = parseFloat(event.target.value);
  }

  onVrboRevScoreMaxChange(event: any): void {
    this.tempVrboRevScoreMax = parseFloat(event.target.value);
  }

  onVrboTotalRevMinChange(event: any): void {
    this.tempVrboTotalRevMin = parseFloat(event.target.value);
  }

  onVrboTotalRevMaxChange(event: any): void {
    this.tempVrboTotalRevMax = parseFloat(event.target.value);
  }

  // Three-point slider change handlers
  onThreePointSliderChange(filterName: string, value: string): void {
    switch (filterName) {
      // Booking.com filters
      case "bookingGenius":
        this.tempBookingGeniusFilter = value;
        break;
      case "bookingMobile":
        this.tempBookingMobileFilter = value;
        break;
      case "bookingPref":
        this.tempBookingPrefFilter = value;
        break;
      case "bookingWeekly":
        this.tempBookingWeeklyFilter = value;
        break;
      case "bookingMonthly":
        this.tempBookingMonthlyFilter = value;
        break;
      case "bookingLMDisc":
        this.tempBookingLMDiscFilter = value;
        break;
      // Airbnb filters
      case "airbnbWeekly":
        this.tempAirbnbWeeklyFilter = value;
        break;
      case "airbnbMonthly":
        this.tempAirbnbMonthlyFilter = value;
        break;
      case "airbnbMember":
        this.tempAirbnbMemberFilter = value;
        break;
      case "airbnbLMDisc":
        this.tempAirbnbLMDiscFilter = value;
        break;
      // VRBO filters
      case "vrboWeekly":
        this.tempVrboWeeklyFilter = value;
        break;
      case "vrboMonthly":
        this.tempVrboMonthlyFilter = value;
        break;
    }
    // Don't apply filters immediately - let users apply them manually via the Apply button
    // this.filterData();
  }

  // Helper method to get the next slider value (for clicking on slider track)
  getNextSliderValue(currentValue: string): string {
    switch (currentValue) {
      case "not-present":
        return "no";
      case "no":
        return "yes";
      case "yes":
        return "not-present";
      default:
        return "not-present";
    }
  }

  // Helper method to get display value for slider
  getSliderDisplayValue(value: string): string {
    switch (value) {
      case "not-present":
        return "NA";
      case "yes":
        return "Yes";
      case "no":
        return "No";
      default:
        return "NA";
    }
  }

  // Apply filters method
  applyFilters(): void {
    // Copy temporary values to active filters
    this.selectedArea = this.tempSelectedArea;
    this.selectedRoomType = this.tempSelectedRoomType;
    
    // Clear property selection when applying new filters
    this.clearPropertySelection();

    // Basic filters
    this.adrMin = this.tempAdrMin;
    this.adrMax = this.tempAdrMax;
    this.revparMin = this.tempRevparMin;
    this.revparMax = this.tempRevparMax;
    this.mpiMin = this.tempMpiMin;
    this.mpiMax = this.tempMpiMax;
    this.minRateThresholdMin = this.tempMinRateThresholdMin;
    this.minRateThresholdMax = this.tempMinRateThresholdMax;

    // Occupancy filters
    this.occupancyTMMin = this.tempOccupancyTMMin;
    this.occupancyTMMax = this.tempOccupancyTMMax;
    this.occupancyNMMin = this.tempOccupancyNMMin;
    this.occupancyNMMax = this.tempOccupancyNMMax;
    this.occupancy7DaysMin = this.tempOccupancy7DaysMin;
    this.occupancy7DaysMax = this.tempOccupancy7DaysMax;
    this.occupancy30DaysMin = this.tempOccupancy30DaysMin;
    this.occupancy30DaysMax = this.tempOccupancy30DaysMax;
    this.pickUpOcc7DaysMin = this.tempPickUpOcc7DaysMin;
    this.pickUpOcc7DaysMax = this.tempPickUpOcc7DaysMax;
    this.pickUpOcc14DaysMin = this.tempPickUpOcc14DaysMin;
    this.pickUpOcc14DaysMax = this.tempPickUpOcc14DaysMax;
    this.pickUpOcc30DaysMin = this.tempPickUpOcc30DaysMin;
    this.pickUpOcc30DaysMax = this.tempPickUpOcc30DaysMax;

    // Performance filters
    this.stlyVarOccMin = this.tempStlyVarOccMin;
    this.stlyVarOccMax = this.tempStlyVarOccMax;
    this.stlyVarADRMin = this.tempStlyVarADRMin;
    this.stlyVarADRMax = this.tempStlyVarADRMax;
    this.stlyVarRevPARMin = this.tempStlyVarRevPARMin;
    this.stlyVarRevPARMax = this.tempStlyVarRevPARMax;
    this.stlmVarOccMin = this.tempStlmVarOccMin;
    this.stlmVarOccMax = this.tempStlmVarOccMax;
    this.stlmVarADRMin = this.tempStlmVarADRMin;
    this.stlmVarADRMax = this.tempStlmVarADRMax;
    this.stlmVarRevPARMin = this.tempStlmVarRevPARMin;
    this.stlmVarRevPARMax = this.tempStlmVarRevPARMax;

    // Platform filters
    this.bookingGeniusFilter = this.tempBookingGeniusFilter;
    this.bookingMobileFilter = this.tempBookingMobileFilter;
    this.bookingPrefFilter = this.tempBookingPrefFilter;
    this.bookingWeeklyFilter = this.tempBookingWeeklyFilter;
    this.bookingMonthlyFilter = this.tempBookingMonthlyFilter;
    this.bookingLMDiscFilter = this.tempBookingLMDiscFilter;
    this.airbnbWeeklyFilter = this.tempAirbnbWeeklyFilter;
    this.airbnbMonthlyFilter = this.tempAirbnbMonthlyFilter;
    this.airbnbMemberFilter = this.tempAirbnbMemberFilter;
    this.airbnbLMDiscFilter = this.tempAirbnbLMDiscFilter;
    this.vrboWeeklyFilter = this.tempVrboWeeklyFilter;
    this.vrboMonthlyFilter = this.tempVrboMonthlyFilter;

    // Reviews filters
    this.bookingRevScoreMin = this.tempBookingRevScoreMin;
    this.bookingRevScoreMax = this.tempBookingRevScoreMax;
    this.bookingTotalRevMin = this.tempBookingTotalRevMin;
    this.bookingTotalRevMax = this.tempBookingTotalRevMax;
    this.airbnbRevScoreMin = this.tempAirbnbRevScoreMin;
    this.airbnbRevScoreMax = this.tempAirbnbRevScoreMax;
    this.airbnbTotalRevMin = this.tempAirbnbTotalRevMin;
    this.airbnbTotalRevMax = this.tempAirbnbTotalRevMax;
    this.vrboRevScoreMin = this.tempVrboRevScoreMin;
    this.vrboRevScoreMax = this.tempVrboRevScoreMax;
    this.vrboTotalRevMin = this.tempVrboTotalRevMin;
    this.vrboTotalRevMax = this.tempVrboTotalRevMax;

    // Apply the filters
    this.filterData();
  }

  // Get applied filters for badge display
  getAppliedFilters(): Array<{
    type: string;
    label: string;
    value: string;
    key: string;
  }> {
    const filters: Array<{
      type: string;
      label: string;
      value: string;
      key: string;
    }> = [];

    // Basic filters
    if (this.selectedArea) {
      filters.push({
        type: "basic",
        label: "Area",
        value: this.selectedArea,
        key: "selectedArea",
      });
    }
    if (this.selectedRoomType) {
      filters.push({
        type: "basic",
        label: "Room Type",
        value: this.selectedRoomType,
        key: "selectedRoomType",
      });
    }
    if (this.adrMin !== null || this.adrMax !== null) {
      const value = `$${this.adrMin || this.adrMinRange} - $${
        this.adrMax || this.adrMaxRange
      }`;
      filters.push({
        type: "range",
        label: "ADR Range",
        value: value,
        key: "adr",
      });
    }
    if (this.revparMin !== null || this.revparMax !== null) {
      const value = `$${this.revparMin || this.revparMinRange} - $${
        this.revparMax || this.revparMaxRange
      }`;
      filters.push({
        type: "range",
        label: "RevPAR Range",
        value: value,
        key: "revpar",
      });
    }
    if (this.mpiMin !== null || this.mpiMax !== null) {
      const value = `${this.mpiMin || this.mpiMinRange}% - ${
        this.mpiMax || this.mpiMaxRange
      }%`;
      filters.push({
        type: "range",
        label: "MPI Range",
        value: value,
        key: "mpi",
      });
    }
    if (
      this.minRateThresholdMin !== null ||
      this.minRateThresholdMax !== null
    ) {
      const value = `${this.minRateThresholdMin || 0}% - ${
        this.minRateThresholdMax || 100
      }%`;
      filters.push({
        type: "range",
        label: "Min Rate Threshold",
        value: value,
        key: "minRateThreshold",
      });
    }

    // Occupancy filters
    if (this.occupancyTMMin !== null || this.occupancyTMMax !== null) {
      const value = `${this.occupancyTMMin || 0}% - ${
        this.occupancyTMMax || 100
      }%`;
      filters.push({
        type: "range",
        label: "Occupancy TM",
        value: value,
        key: "occupancyTM",
      });
    }
    if (this.occupancyNMMin !== null || this.occupancyNMMax !== null) {
      const value = `${this.occupancyNMMin || 0}% - ${
        this.occupancyNMMax || 100
      }%`;
      filters.push({
        type: "range",
        label: "Occupancy NM",
        value: value,
        key: "occupancyNM",
      });
    }
    if (this.occupancy7DaysMin !== null || this.occupancy7DaysMax !== null) {
      const value = `${this.occupancy7DaysMin || 0}% - ${
        this.occupancy7DaysMax || 100
      }%`;
      filters.push({
        type: "range",
        label: "Occupancy 7 Days",
        value: value,
        key: "occupancy7Days",
      });
    }
    if (this.occupancy30DaysMin !== null || this.occupancy30DaysMax !== null) {
      const value = `${this.occupancy30DaysMin || 0}% - ${
        this.occupancy30DaysMax || 100
      }%`;
      filters.push({
        type: "range",
        label: "Occupancy 30 Days",
        value: value,
        key: "occupancy30Days",
      });
    }

    // Performance filters
    if (this.stlyVarOccMin !== null || this.stlyVarOccMax !== null) {
      const value = `${this.stlyVarOccMin || this.stlyVarOccMinRange}% - ${
        this.stlyVarOccMax || this.stlyVarOccMaxRange
      }%`;
      filters.push({
        type: "range",
        label: "STLY Var Occ",
        value: value,
        key: "stlyVarOcc",
      });
    }
    if (this.stlyVarADRMin !== null || this.stlyVarADRMax !== null) {
      const value = `${this.stlyVarADRMin || this.stlyVarADRMinRange}% - ${
        this.stlyVarADRMax || this.stlyVarADRMaxRange
      }%`;
      filters.push({
        type: "range",
        label: "STLY Var ADR",
        value: value,
        key: "stlyVarADR",
      });
    }
    if (this.stlyVarRevPARMin !== null || this.stlyVarRevPARMax !== null) {
      const value = `${
        this.stlyVarRevPARMin || this.stlyVarRevPARMinRange
      }% - ${this.stlyVarRevPARMax || this.stlyVarRevPARMaxRange}%`;
      filters.push({
        type: "range",
        label: "STLY Var RevPAR",
        value: value,
        key: "stlyVarRevPAR",
      });
    }

    // Platform filters (show non-'not-present' values)
    if (this.bookingGeniusFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking Genius",
        value: this.bookingGeniusFilter === "yes" ? "Yes" : "No",
        key: "bookingGenius",
      });
    }
    if (this.bookingMobileFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking Mobile",
        value: this.bookingMobileFilter === "yes" ? "Yes" : "No",
        key: "bookingMobile",
      });
    }
    if (this.bookingPrefFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking Preferred",
        value: this.bookingPrefFilter === "yes" ? "Yes" : "No",
        key: "bookingPref",
      });
    }
    if (this.bookingWeeklyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking Weekly",
        value: this.bookingWeeklyFilter === "yes" ? "Yes" : "No",
        key: "bookingWeekly",
      });
    }
    if (this.bookingMonthlyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking Monthly",
        value: this.bookingMonthlyFilter === "yes" ? "Yes" : "No",
        key: "bookingMonthly",
      });
    }
    if (this.bookingLMDiscFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Booking LM Discount",
        value: this.bookingLMDiscFilter === "yes" ? "Yes" : "No",
        key: "bookingLMDisc",
      });
    }
    if (this.airbnbWeeklyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Airbnb Weekly",
        value: this.airbnbWeeklyFilter === "yes" ? "Yes" : "No",
        key: "airbnbWeekly",
      });
    }
    if (this.airbnbMonthlyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Airbnb Monthly",
        value: this.airbnbMonthlyFilter === "yes" ? "Yes" : "No",
        key: "airbnbMonthly",
      });
    }
    if (this.airbnbMemberFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Airbnb Member",
        value: this.airbnbMemberFilter === "yes" ? "Yes" : "No",
        key: "airbnbMember",
      });
    }
    if (this.airbnbLMDiscFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "Airbnb LM Discount",
        value: this.airbnbLMDiscFilter === "yes" ? "Yes" : "No",
        key: "airbnbLMDisc",
      });
    }
    if (this.vrboWeeklyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "VRBO Weekly",
        value: this.vrboWeeklyFilter === "yes" ? "Yes" : "No",
        key: "vrboWeekly",
      });
    }
    if (this.vrboMonthlyFilter !== "not-present") {
      filters.push({
        type: "platform",
        label: "VRBO Monthly",
        value: this.vrboMonthlyFilter === "yes" ? "Yes" : "No",
        key: "vrboMonthly",
      });
    }

    // Reviews filters
    if (this.bookingRevScoreMin !== null || this.bookingRevScoreMax !== null) {
      const value = `${this.bookingRevScoreMin || 0} - ${
        this.bookingRevScoreMax || 10
      }`;
      filters.push({
        type: "range",
        label: "Booking Review Score",
        value: value,
        key: "bookingRevScore",
      });
    }
    if (this.airbnbRevScoreMin !== null || this.airbnbRevScoreMax !== null) {
      const value = `${this.airbnbRevScoreMin || 0} - ${
        this.airbnbRevScoreMax || 5
      }`;
      filters.push({
        type: "range",
        label: "Airbnb Review Score",
        value: value,
        key: "airbnbRevScore",
      });
    }

    return filters;
  }

  // Remove individual filter
  removeFilter(filterKey: string): void {
    switch (filterKey) {
      case "selectedArea":
        this.selectedArea = "";
        this.tempSelectedArea = "";
        break;
      case "selectedRoomType":
        this.selectedRoomType = "";
        this.tempSelectedRoomType = "";
        break;
      case "adr":
        this.adrMin = null;
        this.adrMax = null;
        this.tempAdrMin = null;
        this.tempAdrMax = null;
        break;
      case "revpar":
        this.revparMin = null;
        this.revparMax = null;
        this.tempRevparMin = null;
        this.tempRevparMax = null;
        break;
      case "mpi":
        this.mpiMin = null;
        this.mpiMax = null;
        this.tempMpiMin = null;
        this.tempMpiMax = null;
        break;
      case "minRateThreshold":
        this.minRateThresholdMin = null;
        this.minRateThresholdMax = null;
        this.tempMinRateThresholdMin = null;
        this.tempMinRateThresholdMax = null;
        break;
      case "occupancyTM":
        this.occupancyTMMin = null;
        this.occupancyTMMax = null;
        this.tempOccupancyTMMin = null;
        this.tempOccupancyTMMax = null;
        break;
      case "occupancyNM":
        this.occupancyNMMin = null;
        this.occupancyNMMax = null;
        this.tempOccupancyNMMin = null;
        this.tempOccupancyNMMax = null;
        break;
      case "occupancy7Days":
        this.occupancy7DaysMin = null;
        this.occupancy7DaysMax = null;
        this.tempOccupancy7DaysMin = null;
        this.tempOccupancy7DaysMax = null;
        break;
      case "occupancy30Days":
        this.occupancy30DaysMin = null;
        this.occupancy30DaysMax = null;
        this.tempOccupancy30DaysMin = null;
        this.tempOccupancy30DaysMax = null;
        break;
      case "stlyVarOcc":
        this.stlyVarOccMin = null;
        this.stlyVarOccMax = null;
        this.tempStlyVarOccMin = null;
        this.tempStlyVarOccMax = null;
        break;
      case "stlyVarADR":
        this.stlyVarADRMin = null;
        this.stlyVarADRMax = null;
        this.tempStlyVarADRMin = null;
        this.tempStlyVarADRMax = null;
        break;
      case "stlyVarRevPAR":
        this.stlyVarRevPARMin = null;
        this.stlyVarRevPARMax = null;
        this.tempStlyVarRevPARMin = null;
        this.tempStlyVarRevPARMax = null;
        break;
      case "bookingGenius":
        this.bookingGeniusFilter = "not-present";
        this.tempBookingGeniusFilter = "not-present";
        break;
      case "bookingMobile":
        this.bookingMobileFilter = "not-present";
        this.tempBookingMobileFilter = "not-present";
        break;
      case "bookingPref":
        this.bookingPrefFilter = "not-present";
        this.tempBookingPrefFilter = "not-present";
        break;
      case "bookingWeekly":
        this.bookingWeeklyFilter = "not-present";
        this.tempBookingWeeklyFilter = "not-present";
        break;
      case "bookingMonthly":
        this.bookingMonthlyFilter = "not-present";
        this.tempBookingMonthlyFilter = "not-present";
        break;
      case "bookingLMDisc":
        this.bookingLMDiscFilter = "not-present";
        this.tempBookingLMDiscFilter = "not-present";
        break;
      case "airbnbWeekly":
        this.airbnbWeeklyFilter = "not-present";
        this.tempAirbnbWeeklyFilter = "not-present";
        break;
      case "airbnbMonthly":
        this.airbnbMonthlyFilter = "not-present";
        this.tempAirbnbMonthlyFilter = "not-present";
        break;
      case "airbnbMember":
        this.airbnbMemberFilter = "not-present";
        this.tempAirbnbMemberFilter = "not-present";
        break;
      case "airbnbLMDisc":
        this.airbnbLMDiscFilter = "not-present";
        this.tempAirbnbLMDiscFilter = "not-present";
        break;
      case "vrboWeekly":
        this.vrboWeeklyFilter = "not-present";
        this.tempVrboWeeklyFilter = "not-present";
        break;
      case "vrboMonthly":
        this.vrboMonthlyFilter = "not-present";
        this.tempVrboMonthlyFilter = "not-present";
        break;
      case "bookingRevScore":
        this.bookingRevScoreMin = null;
        this.bookingRevScoreMax = null;
        this.tempBookingRevScoreMin = null;
        this.tempBookingRevScoreMax = null;
        break;
      case "airbnbRevScore":
        this.airbnbRevScoreMin = null;
        this.airbnbRevScoreMax = null;
        this.tempAirbnbRevScoreMin = null;
        this.tempAirbnbRevScoreMax = null;
        break;
    }
    this.filterData();
  }

  // Update clear all filters method
  clearAllFilters(): void { 
    this.loading = true;
    // Clear active filters
    this.selectedArea = "";
    this.selectedRoomType = "";
    this.adrMin = null;
    this.adrMax = null;
    this.revparMin = null;
    this.revparMax = null;
    this.mpiMin = null;
    this.mpiMax = null;
    this.minRateThresholdMin = null;
    this.minRateThresholdMax = null;

    // Occupancy filters
    this.occupancyTMMin = null;
    this.occupancyTMMax = null;
    this.occupancyNMMin = null;
    this.occupancyNMMax = null;
    this.occupancy7DaysMin = null;
    this.occupancy7DaysMax = null;
    this.occupancy30DaysMin = null;
    this.occupancy30DaysMax = null;
    this.pickUpOcc7DaysMin = null;
    this.pickUpOcc7DaysMax = null;
    this.pickUpOcc14DaysMin = null;
    this.pickUpOcc14DaysMax = null;
    this.pickUpOcc30DaysMin = null;
    this.pickUpOcc30DaysMax = null;

    // Performance filters
    this.stlyVarOccMin = null;
    this.stlyVarOccMax = null;
    this.stlyVarADRMin = null;
    this.stlyVarADRMax = null;
    this.stlyVarRevPARMin = null;
    this.stlyVarRevPARMax = null;
    this.stlmVarOccMin = null;
    this.stlmVarOccMax = null;
    this.stlmVarADRMin = null;
    this.stlmVarADRMax = null;
    this.stlmVarRevPARMin = null;
    this.stlmVarRevPARMax = null;

    // Platform filters
    this.bookingGeniusFilter = "not-present";
    this.bookingMobileFilter = "not-present";
    this.bookingPrefFilter = "not-present";
    this.bookingWeeklyFilter = "not-present";
    this.bookingMonthlyFilter = "not-present";
    this.bookingLMDiscFilter = "not-present";
    this.airbnbWeeklyFilter = "not-present";
    this.airbnbMonthlyFilter = "not-present";
    this.airbnbMemberFilter = "not-present";
    this.airbnbLMDiscFilter = "not-present";
    this.vrboWeeklyFilter = "not-present";
    this.vrboMonthlyFilter = "not-present";

    // Reviews filters
    this.bookingRevScoreMin = null;
    this.bookingRevScoreMax = null;
    this.bookingTotalRevMin = null;
    this.bookingTotalRevMax = null;
    this.airbnbRevScoreMin = null;
    this.airbnbRevScoreMax = null;
    this.airbnbTotalRevMin = null;
    this.airbnbTotalRevMax = null;
    this.vrboRevScoreMin = null;
    this.vrboRevScoreMax = null;
    this.vrboTotalRevMin = null;
    this.vrboTotalRevMax = null;

    // Clear temporary filters
    this.initializeTempFilters();

    // Clear selected preset
    this.selectedPresetId = '';

    // Clear property selection when clearing all filters
    this.clearPropertySelection();

    this.filterData();
  }

  // Infinite scroll method
  loadMoreData(): void {
    if (this.hasMoreData && !this.isLoadingMore && !this.loading) {
      this.isLoadingMore = true;
      this.currentPage++;
      
      // Clear property selection when loading more data since new data might not include previously selected properties
      this.clearPropertySelection();
      
      this.loadFilteredPropertiesData();
    }
  }

  // Scroll event handler for infinite scroll
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom
    
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.loadMoreData();
    }
  }

  // Column visibility methods
  toggleColumnVisibility(columnKey: keyof typeof this.columnVisibility): void {
    this.columnVisibility[columnKey] = !this.columnVisibility[columnKey];
  }

  getVisibleColumnsCount(): number {
    return Object.values(this.columnVisibility).filter((visible) => visible)
      .length;
  }

  resetToDefaultColumns(): void {
    this.columnVisibility = {
      propertyName: true,
      occupancyTM: true,
      occupancyNM: true,
      adr: true,
      revpar: true,
      mpi: true,
      reviews: true,
      cxlPolicy: true,
      adultChildConfig: true,
      pickupOcc: true,
      minRateThreshold: true,
      stlyVarOcc: true,
      stlyVarRevPAR: true,
      lastReviewScore: true,
      lastReviewDate: true,
      actions: true,
    };
  }

  showAllColumns(): void {
    Object.keys(this.columnVisibility).forEach((key) => {
      this.columnVisibility[key as keyof typeof this.columnVisibility] = true;
    });
  }

  hideAllColumns(): void {
    // Keep property name and actions always visible
    Object.keys(this.columnVisibility).forEach((key) => {
      if (key !== "propertyName" && key !== "actions") {
        this.columnVisibility[key as keyof typeof this.columnVisibility] =
          false;
      }
    });
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

  // Filter Preset Methods
  loadFilterPresets(): void {
    this.presetLoading = true;
    
    if (!this.operatorId) {
      this.presetLoading = false;
      this.toastr.error('Operator ID is required to load presets');
      return;
    }
    
    this.filterPresetService.loadPresets(this.operatorId);
    
    this.filterPresetService.presets$.subscribe({
      next: (presets) => {
        this.filterPresets = presets;
        this.presetLoading = false;
      },
      error: (error) => {
        this.presetLoading = false;
        this.toastr.error('Failed to load filter presets');
      }
    });
  }

  // Method to refresh presets (useful for debugging)
  refreshPresets(): void {
    this.loadFilterPresets();
  }

  // Debug method to check current presets state
  debugPresets(): void {
    // Debug method - no console output needed
  }

  // Test method to simulate preset click
  testPresetClick(presetId: string): void {
    this.selectedPresetId = presetId;
    this.onPresetSelectionChange();
  }

  // Test method to debug delete functionality
  testDeletePreset(presetId: string): void {
    console.log('=== TESTING DELETE PRESET ===');
    console.log('Preset ID to delete:', presetId);
    console.log('Operator ID:', this.operatorId);
    
    const preset = this.filterPresetService.getPresetById(presetId);
    console.log('Found preset:', preset);
    
    if (preset) {
      console.log('Attempting to delete preset:', preset.name);
      this.deletePreset(presetId);
    }
  }

  // Helper method to safely handle dates
  getSafeDate(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  }

  // Helper method to check if date is valid
  isValidDate(date: any): boolean {
    if (!date) return false;
    if (date instanceof Date) return !isNaN(date.getTime());
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }
    return false;
  }

  getCurrentFilters(): FilterPreset['filters'] {
    return {
      // Basic filters
      selectedArea: this.selectedArea || undefined,
      selectedRoomType: this.selectedRoomType || undefined,
      
      // Range filters - only include non-null values
      adrMin: this.adrMin !== null ? this.adrMin : undefined,
      adrMax: this.adrMax !== null ? this.adrMax : undefined,
      revparMin: this.revparMin !== null ? this.revparMin : undefined,
      revparMax: this.revparMax !== null ? this.revparMax : undefined,
      mpiMin: this.mpiMin !== null ? this.mpiMin : undefined,
      mpiMax: this.mpiMax !== null ? this.mpiMax : undefined,
      minRateThresholdMin: this.minRateThresholdMin !== null ? this.minRateThresholdMin : undefined,
      minRateThresholdMax: this.minRateThresholdMax !== null ? this.minRateThresholdMax : undefined,
      
      // Occupancy filters - only include non-null values
      occupancyTMMin: this.occupancyTMMin !== null ? this.occupancyTMMin : undefined,
      occupancyTMMax: this.occupancyTMMax !== null ? this.occupancyTMMax : undefined,
      occupancyNMMin: this.occupancyNMMin !== null ? this.occupancyNMMin : undefined,
      occupancyNMMax: this.occupancyNMMax !== null ? this.occupancyNMMax : undefined,
      occupancy7DaysMin: this.occupancy7DaysMin !== null ? this.occupancy7DaysMin : undefined,
      occupancy7DaysMax: this.occupancy7DaysMax !== null ? this.occupancy7DaysMax : undefined,
      occupancy30DaysMin: this.occupancy30DaysMin !== null ? this.occupancy30DaysMin : undefined,
      occupancy30DaysMax: this.occupancy30DaysMax !== null ? this.occupancy30DaysMax : undefined,
      pickUpOcc7DaysMin: this.pickUpOcc7DaysMin !== null ? this.pickUpOcc7DaysMin : undefined,
      pickUpOcc7DaysMax: this.pickUpOcc7DaysMax !== null ? this.pickUpOcc7DaysMax : undefined,
      pickUpOcc14DaysMin: this.pickUpOcc14DaysMin !== null ? this.pickUpOcc14DaysMin : undefined,
      pickUpOcc14DaysMax: this.pickUpOcc14DaysMax !== null ? this.pickUpOcc14DaysMax : undefined,
      pickUpOcc30DaysMin: this.pickUpOcc30DaysMin !== null ? this.pickUpOcc30DaysMin : undefined,
      pickUpOcc30DaysMax: this.pickUpOcc30DaysMax !== null ? this.pickUpOcc30DaysMax : undefined,
      
      // Performance filters - only include non-null values
      stlyVarOccMin: this.stlyVarOccMin !== null ? this.stlyVarOccMin : undefined,
      stlyVarOccMax: this.stlyVarOccMax !== null ? this.stlyVarOccMax : undefined,
      stlyVarADRMin: this.stlyVarADRMin !== null ? this.stlyVarADRMin : undefined,
      stlyVarADRMax: this.stlyVarADRMax !== null ? this.stlyVarADRMax : undefined,
      stlyVarRevPARMin: this.stlyVarRevPARMin !== null ? this.stlyVarRevPARMin : undefined,
      stlyVarRevPARMax: this.stlyVarRevPARMax !== null ? this.stlyVarRevPARMax : undefined,
      stlmVarOccMin: this.stlmVarOccMin !== null ? this.stlmVarOccMin : undefined,
      stlmVarOccMax: this.stlmVarOccMax !== null ? this.stlmVarOccMax : undefined,
      stlmVarADRMin: this.stlmVarADRMin !== null ? this.stlmVarADRMin : undefined,
      stlmVarADRMax: this.stlmVarADRMax !== null ? this.stlmVarADRMax : undefined,
      stlmVarRevPARMin: this.stlmVarRevPARMin !== null ? this.stlmVarRevPARMin : undefined,
      stlmVarRevPARMax: this.stlmVarRevPARMax !== null ? this.stlmVarRevPARMax : undefined,
      
      // Platform filters
      bookingGeniusFilter: this.bookingGeniusFilter !== 'not-present' ? this.bookingGeniusFilter : undefined,
      bookingMobileFilter: this.bookingMobileFilter !== 'not-present' ? this.bookingMobileFilter : undefined,
      bookingPrefFilter: this.bookingPrefFilter !== 'not-present' ? this.bookingPrefFilter : undefined,
      bookingWeeklyFilter: this.bookingWeeklyFilter !== 'not-present' ? this.bookingWeeklyFilter : undefined,
      bookingMonthlyFilter: this.bookingMonthlyFilter !== 'not-present' ? this.bookingMonthlyFilter : undefined,
      bookingLMDiscFilter: this.bookingLMDiscFilter !== 'not-present' ? this.bookingLMDiscFilter : undefined,
      airbnbWeeklyFilter: this.airbnbWeeklyFilter !== 'not-present' ? this.airbnbWeeklyFilter : undefined,
      airbnbMonthlyFilter: this.airbnbMonthlyFilter !== 'not-present' ? this.airbnbMonthlyFilter : undefined,
      airbnbMemberFilter: this.airbnbMemberFilter !== 'not-present' ? this.airbnbMemberFilter : undefined,
      airbnbLMDiscFilter: this.airbnbLMDiscFilter !== 'not-present' ? this.airbnbLMDiscFilter : undefined,
      vrboWeeklyFilter: this.vrboWeeklyFilter !== 'not-present' ? this.vrboWeeklyFilter : undefined,
      vrboMonthlyFilter: this.vrboMonthlyFilter !== 'not-present' ? this.vrboMonthlyFilter : undefined,
      
      // Reviews filters - only include non-null values
      bookingRevScoreMin: this.bookingRevScoreMin !== null ? this.bookingRevScoreMin : undefined,
      bookingRevScoreMax: this.bookingRevScoreMax !== null ? this.bookingRevScoreMax : undefined,
      bookingTotalRevMin: this.bookingTotalRevMin !== null ? this.bookingTotalRevMin : undefined,
      bookingTotalRevMax: this.bookingTotalRevMax !== null ? this.bookingTotalRevMax : undefined,
      airbnbRevScoreMin: this.airbnbRevScoreMin !== null ? this.airbnbRevScoreMin : undefined,
      airbnbRevScoreMax: this.airbnbRevScoreMax !== null ? this.airbnbRevScoreMax : undefined,
      airbnbTotalRevMin: this.airbnbTotalRevMin !== null ? this.airbnbTotalRevMin : undefined,
      airbnbTotalRevMax: this.airbnbTotalRevMax !== null ? this.airbnbTotalRevMax : undefined,
      vrboRevScoreMin: this.vrboRevScoreMin !== null ? this.vrboRevScoreMin : undefined,
      vrboRevScoreMax: this.vrboRevScoreMax !== null ? this.vrboRevScoreMax : undefined,
      vrboTotalRevMin: this.vrboTotalRevMin !== null ? this.vrboTotalRevMin : undefined,
      vrboTotalRevMax: this.vrboTotalRevMax !== null ? this.vrboTotalRevMax : undefined
    };
  }

  getCurrentPropertyIds(): string[] {
    return Array.from(this.selectedPropertyIds);
  }

  // Property selection methods
  togglePropertySelection(propertyId: string): void {
    if (this.selectedPropertyIds.has(propertyId)) {
      this.selectedPropertyIds.delete(propertyId);
      // If no properties are selected after this deletion, switch to show all
      if (this.selectedPropertyIds.size === 0) {
        this.showOnlySelected = false;
      }
    } else {
      this.selectedPropertyIds.add(propertyId);
      // When first property is selected, switch to show selected only
      if (this.selectedPropertyIds.size === 1) {
        this.showOnlySelected = true;
      }
    }
    this.updateSelectAllState();
  }

  isPropertySelected(propertyId: string): boolean {
    return this.selectedPropertyIds.has(propertyId);
  }

  toggleSelectAllProperties(): void {
    const filteredData = this.getFilteredPropertyData();
    
    if (this.selectAllProperties) {
      // Deselect all visible properties
      filteredData.forEach(property => {
        if (property._id) {
          this.selectedPropertyIds.delete(property._id);
        }
      });
      this.selectAllProperties = false;
      // If no properties are selected, switch to show all
      if (this.selectedPropertyIds.size === 0) {
        this.showOnlySelected = false;
      }
    } else {
      // Select all visible properties
      filteredData.forEach(property => {
        if (property._id) {
          this.selectedPropertyIds.add(property._id);
        }
      });
      this.selectAllProperties = true;
      // Switch to show selected only when properties are selected
      this.showOnlySelected = true;
    }
  }

  updateSelectAllState(): void {
    const filteredData = this.getFilteredPropertyData();
    if (filteredData.length === 0) {
      this.selectAllProperties = false;
      return;
    }
    
    const visiblePropertyIds = filteredData
      .filter(property => property._id)
      .map(property => property._id);
    
    this.selectAllProperties = visiblePropertyIds.length > 0 && visiblePropertyIds.every(id => 
      this.selectedPropertyIds.has(id)
    );
  }

  getSelectedPropertiesCount(): number {
    return this.selectedPropertyIds.size;
  }

  // Get filtered data based on selection state
  getFilteredPropertyData(): any[] {
    // If we have selected properties and showOnlySelected is true, show only selected
    if (this.selectedPropertyIds.size > 0 && this.showOnlySelected) {
      return this.propertyData.filter(property => 
        property._id && this.selectedPropertyIds.has(property._id)
      );
    }
    // If no properties are selected, always show all properties
    if (this.selectedPropertyIds.size === 0) {
      return this.propertyData;
    }
    // When showOnlySelected is false but we have selections, show all
    return this.propertyData;
  }

  // Toggle between showing all properties and only selected ones
  toggleShowOnlySelected(): void {
    this.showOnlySelected = !this.showOnlySelected;
    // Update select all state when toggling view
    this.updateSelectAllState();
  }

  // Check if we should show the toggle button
  shouldShowToggleButton(): boolean {
    return this.selectedPropertyIds.size > 0 && this.hasActiveFilters();
  }

  clearPropertySelection(): void {
    this.selectedPropertyIds.clear();
    this.selectAllProperties = false;
    this.showOnlySelected = false; // When no selection, show all properties
  }

  applyPresetFilters(filters: FilterPreset['filters'], propertyIds?: string[]): void {
    console.log('applyPresetFilters called with filters:', filters, 'propertyIds:', propertyIds);
    this.loading = true;
    
    // Store property IDs to restore after data is loaded
    const presetPropertyIds = propertyIds || [];
    
    // Basic filters
    this.selectedArea = filters.selectedArea || '';
    this.selectedRoomType = filters.selectedRoomType || '';
    
    console.log('Applied basic filters - Area:', this.selectedArea, 'RoomType:', this.selectedRoomType);
    
    // Range filters
    this.adrMin = filters.adrMin || null;
    this.adrMax = filters.adrMax || null;
    this.revparMin = filters.revparMin || null;
    this.revparMax = filters.revparMax || null;
    this.mpiMin = filters.mpiMin || null;
    this.mpiMax = filters.mpiMax || null;
    this.minRateThresholdMin = filters.minRateThresholdMin || null;
    this.minRateThresholdMax = filters.minRateThresholdMax || null;
    
    // Occupancy filters
    this.occupancyTMMin = filters.occupancyTMMin || null;
    this.occupancyTMMax = filters.occupancyTMMax || null;
    this.occupancyNMMin = filters.occupancyNMMin || null;
    this.occupancyNMMax = filters.occupancyNMMax || null;
    this.occupancy7DaysMin = filters.occupancy7DaysMin || null;
    this.occupancy7DaysMax = filters.occupancy7DaysMax || null;
    this.occupancy30DaysMin = filters.occupancy30DaysMin || null;
    this.occupancy30DaysMax = filters.occupancy30DaysMax || null;
    this.pickUpOcc7DaysMin = filters.pickUpOcc7DaysMin || null;
    this.pickUpOcc7DaysMax = filters.pickUpOcc7DaysMax || null;
    this.pickUpOcc14DaysMin = filters.pickUpOcc14DaysMin || null;
    this.pickUpOcc14DaysMax = filters.pickUpOcc14DaysMax || null;
    this.pickUpOcc30DaysMin = filters.pickUpOcc30DaysMin || null;
    this.pickUpOcc30DaysMax = filters.pickUpOcc30DaysMax || null;
    
    // Performance filters
    this.stlyVarOccMin = filters.stlyVarOccMin || null;
    this.stlyVarOccMax = filters.stlyVarOccMax || null;
    this.stlyVarADRMin = filters.stlyVarADRMin || null;
    this.stlyVarADRMax = filters.stlyVarADRMax || null;
    this.stlyVarRevPARMin = filters.stlyVarRevPARMin || null;
    this.stlyVarRevPARMax = filters.stlyVarRevPARMax || null;
    this.stlmVarOccMin = filters.stlmVarOccMin || null;
    this.stlmVarOccMax = filters.stlmVarOccMax || null;
    this.stlmVarADRMin = filters.stlmVarADRMin || null;
    this.stlmVarADRMax = filters.stlmVarADRMax || null;
    this.stlmVarRevPARMin = filters.stlmVarRevPARMin || null;
    this.stlmVarRevPARMax = filters.stlmVarRevPARMax || null;
    
    // Platform filters
    this.bookingGeniusFilter = filters.bookingGeniusFilter || 'not-present';
    this.bookingMobileFilter = filters.bookingMobileFilter || 'not-present';
    this.bookingPrefFilter = filters.bookingPrefFilter || 'not-present';
    this.bookingWeeklyFilter = filters.bookingWeeklyFilter || 'not-present';
    this.bookingMonthlyFilter = filters.bookingMonthlyFilter || 'not-present';
    this.bookingLMDiscFilter = filters.bookingLMDiscFilter || 'not-present';
    this.airbnbWeeklyFilter = filters.airbnbWeeklyFilter || 'not-present';
    this.airbnbMonthlyFilter = filters.airbnbMonthlyFilter || 'not-present';
    this.airbnbMemberFilter = filters.airbnbMemberFilter || 'not-present';
    this.airbnbLMDiscFilter = filters.airbnbLMDiscFilter || 'not-present';
    this.vrboWeeklyFilter = filters.vrboWeeklyFilter || 'not-present';
    this.vrboMonthlyFilter = filters.vrboMonthlyFilter || 'not-present';
    
    // Reviews filters
    this.bookingRevScoreMin = filters.bookingRevScoreMin || null;
    this.bookingRevScoreMax = filters.bookingRevScoreMax || null;
    this.bookingTotalRevMin = filters.bookingTotalRevMin || null;
    this.bookingTotalRevMax = filters.bookingTotalRevMax || null;
    this.airbnbRevScoreMin = filters.airbnbRevScoreMin || null;
    this.airbnbRevScoreMax = filters.airbnbRevScoreMax || null;
    this.airbnbTotalRevMin = filters.airbnbTotalRevMin || null;
    this.airbnbTotalRevMax = filters.airbnbTotalRevMax || null;
    this.vrboRevScoreMin = filters.vrboRevScoreMin || null;
    this.vrboRevScoreMax = filters.vrboRevScoreMax || null;
    this.vrboTotalRevMin = filters.vrboTotalRevMin || null;
    this.vrboTotalRevMax = filters.vrboTotalRevMax || null;
    
    // Update temporary filters to match
    this.initializeTempFilters();
    
    console.log('All filters applied, reloading data...');
    console.log('Current filter state:', {
      selectedArea: this.selectedArea,
      selectedRoomType: this.selectedRoomType,
      adrMin: this.adrMin,
      adrMax: this.adrMax
    });
    
    // Apply the filters by reloading data with new filter values
    this.loadFilteredPropertiesDataWithPropertyRestore(presetPropertyIds);
    this.toastr.success('Preset filters applied successfully!');
  }

  onPresetSelectionChange(): void {
    console.log('onPresetSelectionChange called with selectedPresetId:', this.selectedPresetId);
    if (this.selectedPresetId) {
      const preset = this.filterPresetService.getPresetById(this.selectedPresetId);
      console.log('Found preset:', preset);
      if (preset) {
        console.log('Applying preset:', preset.name, preset.filters, preset.propertyIds);
        this.applyPresetFilters(preset.filters, preset.propertyIds);
      } else {
        this.toastr.error('Preset not found');
      }
    }
  }

  showSavePresetDialog(): void {
    const hasActiveFilters = this.hasActiveFilters();
    const hasPropertyIds = this.getCurrentPropertyIds().length > 0;
    
    if (!hasActiveFilters && !hasPropertyIds) {
      this.toastr.warning('Either filters or property selection is required to save a preset. Please apply some filters or select properties first.');
      return;
    }
    this.showSavePresetForm = true;
    this.newPresetName = '';
    this.newPresetDescription = '';
    this.presetSaveError = '';
  }

  cancelSavePreset(): void {
    this.showSavePresetForm = false;
    this.newPresetName = '';
    this.newPresetDescription = '';
    this.presetSaveError = '';
  }

  saveCurrentFiltersAsPreset(): void {
    if (!this.newPresetName.trim()) {
      this.presetSaveError = 'Please enter a preset name';
      return;
    }

    this.presetSaving = true;
    this.presetSaveError = '';

    try {
      const currentFilters = this.getCurrentFilters();
      console.log('Saving preset with filters:', currentFilters);
      
      // Get current property IDs (if any are selected)
      const currentPropertyIds = this.getCurrentPropertyIds();
      
      const savedPreset = this.filterPresetService.savePreset(
        this.newPresetName.trim(),
        currentFilters,
        this.newPresetDescription.trim() || undefined,
        this.operatorId || undefined,
        currentPropertyIds
      );
      
      // Note: The actual API call is asynchronous, so we'll handle the loading state in the service
      // For now, we'll set a timeout to reset the loading state
      setTimeout(() => {
        this.presetSaving = false;
        this.cancelSavePreset();
        this.toastr.success(`Filter preset "${this.newPresetName}" saved successfully!`);
        console.log('Preset saved:', savedPreset);
      }, 1000);
    } catch (error: any) {
      console.error('Error saving preset:', error);
      this.presetSaving = false;
      this.presetSaveError = error.message || 'Failed to save preset';
      this.toastr.error(this.presetSaveError);
    }
  }

  deletePreset(presetId: string): void {
    const preset = this.filterPresetService.getPresetById(presetId);
    if (!preset) {
      this.toastr.error('Preset not found');
      return;
    }

    this.toastService.showConfirm(
      'Delete Preset',
      `Are you sure you want to delete the preset "${preset.name}"?`,
      'Yes, delete it!',
      'No, cancel',
      () => {
        this.presetDeleting = true;
        console.log('Deleting preset:', preset.name, 'with ID:', presetId);
        
        // Store the original preset name for messages
        const presetName = preset.name;
        
        if (!this.operatorId || !presetId) {
          this.toastr.error('Operator ID and Preset ID are required to delete a preset');
          return;
        }

        // Call the service method which now returns an Observable
        this.filterPresetService.deletePreset(presetId, this.operatorId).subscribe({
          next: (success) => {
            console.log('Delete preset response:', success);
            this.presetDeleting = false;
            if (success) {
              this.toastr.success(`Preset "${presetName}" deleted successfully!`);
              if (this.selectedPresetId === presetId) {
                this.selectedPresetId = '';
              }
            } else {
              this.toastr.error('Failed to delete preset');
            }
          },
          error: (error) => {
            console.error('Error deleting preset:', error);
            this.presetDeleting = false;
            this.toastr.error('Failed to delete preset');
          }
        });
      }
    );
  }

  duplicatePreset(presetId: string): void {
    const preset = this.filterPresetService.getPresetById(presetId);
    if (preset) {
      this.toastService.showInput(
        'Duplicate Preset',
        'Enter name for the duplicate preset:',
        `${preset.name} (Copy)`,
        'Enter preset name',
        'Duplicate',
        'Cancel',
        (newName: string) => {
          if (newName && newName.trim()) {
            this.presetDuplicating = true;
            
            try {
              const duplicatedPreset = this.filterPresetService.duplicatePreset(presetId, newName.trim(), this.operatorId || undefined);
              // Note: The actual API call is asynchronous, so we'll handle the loading state in the service
              setTimeout(() => {
                this.presetDuplicating = false;
                this.toastr.success(`Preset duplicated as "${newName}"`);
                console.log('Preset duplicated:', duplicatedPreset);
              }, 1000);
            } catch (error: any) {
              console.error('Error duplicating preset:', error);
              this.presetDuplicating = false;
              this.toastr.error(error.message || 'Failed to duplicate preset');
            }
          }
        }
      );
    }
  }

  getPresetSummary(preset: FilterPreset): string[] {
    return this.filterPresetService.getPresetSummary(preset);
  }

  togglePresetManagement(): void {
    this.showPresetManagement = !this.showPresetManagement;
  }

  exportPresets(): void {
    this.presetExporting = true;
    
    try {
      const data = JSON.stringify(this.filterPresets, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filter_presets_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Reset loading state after a short delay
      setTimeout(() => {
        this.presetExporting = false;
        this.toastr.success('Filter presets exported successfully!');
        console.log('Presets exported:', data);
      }, 500);
    } catch (error: any) {
      console.error('Error exporting presets:', error);
      this.presetExporting = false;
      this.toastr.error(error.message || 'Failed to export presets');
    }
  }

  importPresets(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.presetImporting = true;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const importedPresets = JSON.parse(jsonData) as FilterPreset[];
          
          // Validate imported data
          if (!Array.isArray(importedPresets)) {
            throw new Error('Invalid preset data format');
          }

          // Validate each preset
          importedPresets.forEach((preset, index) => {
            if (!preset.id || !preset.name || !preset.filters) {
              throw new Error(`Invalid preset at index ${index}`);
            }
          });

          let importedCount = 0;
          const existingPresets = [...this.filterPresets];

          importedPresets.forEach(preset => {
            // Generate new ID to avoid conflicts
            const newPreset = {
              ...preset,
              id: 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Handle name conflicts
            let finalName = preset.name;
            let counter = 1;
            while (existingPresets.some(p => p.name.toLowerCase() === finalName.toLowerCase())) {
              finalName = `${preset.name} (${counter})`;
              counter++;
            }
            newPreset.name = finalName;

            existingPresets.push(newPreset);
            importedCount++;
          });

          // Update the component's filter presets array
          this.filterPresets = existingPresets;
          
          // Reset loading state after a short delay
          setTimeout(() => {
            this.presetImporting = false;
            this.toastr.success(`Successfully imported ${importedCount} preset(s)`);
            console.log('Presets imported:', importedCount);
          }, 500);
        } catch (error: any) {
          console.error('Error importing presets:', error);
          this.presetImporting = false;
          this.toastr.error(error.message || 'Failed to import presets');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  }


  // Property image methods
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
    // Fallback to placeholder
    return 'assets/images/placeholder.jpg';
  }

  onImageError(event: any): void {
    // Set fallback image when the main image fails to load
    event.target.src = 'assets/images/placeholder.jpg';
  }

  // Debug method to check property URLs
  debugPropertyUrls(property: PropertyData): void {
    // Method for debugging property URLs if needed
  }

  // Get color based on occupancy percentage
  getOccupancyColor(percentage: number, isLight: boolean = false): string {
    if (percentage >= 66) {
      // Green for high occupancy (70%+)
      return isLight ? '#C7E596' : '#78C000';
    } else if (percentage >= 33) {
      // Amber/Orange for medium occupancy (30-69%)
      return isLight ? '#FFE4B5' : '#FF8C00';
    } else {
      // Red for low occupancy (0-29%)
      return isLight ? '#FFC0CB' : '#FF6347';
    }
  }

  // Format guest configuration for display
  formatGuestConfig(guestConfig: any): string {
    if (!guestConfig) {
      return 'N/A';
    }

    // Handle different structures for Booking vs Airbnb
    if (guestConfig.max_guests && typeof guestConfig.max_guests === 'number') {
      // Airbnb structure: max_guests is a number
      return `${guestConfig.max_guests}`;
    } else {
      // Booking structure: extract numbers from strings like "6 adults", "5 children"
      const adults = this.extractNumber(guestConfig.max_adults) || 0;
      const children = this.extractNumber(guestConfig.max_children) || 0;
      const total = adults + children;

      return `${total} (${adults}+${children})`;
    }
  }

  // Helper method to extract number from string like "6 adults" -> 6
  private extractNumber(text: string): number {
    if (!text) return 0;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

}
