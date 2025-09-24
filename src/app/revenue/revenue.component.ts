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
  allPropertyData: PropertyData[] = []; // Complete dataset for range calculations
  filteredData: PropertyData[] = [];
  loading: boolean = false;
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

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 1;

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

  constructor(
    private propertiesService: PropertiesService, 
    private localStorageService: LocalStorageService, 
    private filterPresetService: FilterPresetService,
    private router: Router,
    private route: ActivatedRoute,
    private exportService: ExportService,
    private toastr: ToastrService
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

  ngOnInit(): void {
    // First try to get operatorId from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['operatorId']) {
        this.operatorId = params['operatorId'];
        console.log('Revenue ngOnInit - operatorId from query params:', this.operatorId);
      } else {
        // Fallback to localStorage
        this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
        console.log('Revenue ngOnInit - operatorId from localStorage:', this.operatorId);
      }
      
      // Load properties with the operatorId
      this.loadProperties();
    });
    
    this.loadFilterPresets();
  }

  loadProperties(): void {
    console.log('loadProperties called - setting loading to true');
    this.loading = true;
    this.error = null;

    // Load current page data first
    this.loadCurrentPageData();
  }

  loadCurrentPageData(): void {
    console.log('loadCurrentPageData called with:', {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      operatorId: this.operatorId,
      sortOrder: this.sortOrder
    });
    
    // Load current page data for display
    this.propertiesService
      .getProperties(
        this.currentPage,
        this.itemsPerPage,
        this.operatorId || "",
        this.sortOrder
      )
      .subscribe({
        next: (response: any) => {
          console.log('Revenue API Response:', response);
          console.log('Response success:', response.success);
          console.log('Response data:', response.data);
          
          if (response.success) {
            this.propertyData =
              PropertiesService.extractPropertiesArray(response);
            console.log('Extracted Property Data:', this.propertyData);
            console.log('Property Data Length:', this.propertyData.length);
            
            this.filteredData = [...this.propertyData];
            console.log('Filtered Data Length:', this.filteredData.length);

            // If this is the first load, also load additional data for range calculations
            if (this.currentPage === 1 && this.allPropertyData.length === 0) {
              this.loadDataForRanges();
            }

            this.calculateSummaryData();
            this.updatePagination();
          } else {
            console.error('API Response not successful:', response);
            this.error = response.message || "Failed to load properties data";
          }
          console.log('Setting loading to false');
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Revenue API Error:', error);
          this.error = "Error loading properties. Please try again.";
          this.loading = false;
        },
        complete: () => {
          console.log('Revenue API call completed');
          // Ensure loading is set to false even if there's an issue
          setTimeout(() => {
            if (this.loading) {
              console.log('Forcing loading to false after timeout');
              this.loading = false;
            }
          }, 1000);
        }
      });
  }

  loadDataForRanges(): void {
    // Load additional pages to get a better sample for range calculations and filtering
    // Use a reasonable limit that the API can handle
    this.propertiesService
      .getProperties(1, 50, this.operatorId || "", this.sortOrder)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.allPropertyData =
              PropertiesService.extractPropertiesArray(response);
            this.calculateRangeValues();
            this.extractFilterOptions();
            this.initializeTempFilters();

            // Apply current filters to the complete dataset
            this.filterData();
          }
        },
        error: (error: any) => {
          // Fallback to using current page data for ranges
          this.allPropertyData = [...this.propertyData];
          this.calculateRangeValues();
          this.extractFilterOptions();
          this.initializeTempFilters();

          // Apply current filters to the available data
          this.filterData();
        },
      });
  }

  calculateSummaryData(): void {
    // Use filtered data for summary calculations to show accurate totals
    const dataSource =
      this.filteredData && this.filteredData.length > 0
        ? this.filteredData
        : this.propertyData;

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
    // Use allPropertyData if available, otherwise fallback to current page data
    const dataSource =
      this.allPropertyData && this.allPropertyData.length > 0
        ? this.allPropertyData
        : this.propertyData;

    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      this.areas = [];
      this.roomTypes = [];
      return;
    }

    this.areas = [...new Set(dataSource.map((item) => item.Area))];
    this.roomTypes = [...new Set(dataSource.map((item) => item.Room_Type))];
  }

  calculateRangeValues(): void {
    // Use allPropertyData if available, otherwise fallback to current page data
    const dataSource =
      this.allPropertyData && this.allPropertyData.length > 0
        ? this.allPropertyData
        : this.propertyData;

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

    // Calculate MPI ranges from data source
    const mpiValues = dataSource.map((item) => this.safeParseNumber(item.MPI))
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

  // Filter data based on search term, area, room type, and all range filters
  filterData(): void {
    // Use complete dataset for filtering if available, otherwise use current page data
    const dataSource =
      this.allPropertyData && this.allPropertyData.length > 0
        ? this.allPropertyData
        : this.propertyData;

    if (!Array.isArray(dataSource) || dataSource.length === 0) {
      this.filteredData = [];
      this.updatePagination();
      return;
    }

    this.filteredData = dataSource.filter((item) => {
      // Basic search and category filters
      const matchesSearch =
        !this.searchTerm ||
        item.Listing_Name.toLowerCase().includes(
          this.searchTerm.toLowerCase()
        ) ||
        item.Area.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.Room_Type.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesArea = !this.selectedArea || item.Area === this.selectedArea;
      const matchesRoomType =
        !this.selectedRoomType || item.Room_Type === this.selectedRoomType;

      // Parse numeric values for filtering using safe parsing
      const adrTM = this.safeParseNumber(item.ADR.TM);
      const revparTM = this.safeParseNumber(item.RevPAR.TM);
      const mpi = this.safeParseNumber(item.MPI);
      const minRateThreshold = this.safeParseNumber(item.Min_Rate_Threshold);

      // Occupancy values
      const occupancyTM = this.safeParseNumber(item.Occupancy.TM);
      const occupancyNM = this.safeParseNumber(item.Occupancy.NM);
      const occupancy7Days = this.safeParseNumber(item.Occupancy["7_days"]);
      const occupancy30Days = this.safeParseNumber(item.Occupancy["30_days"]);
      const pickUpOcc7Days = this.safeParseNumber(item.Pick_Up_Occ["7_Days"]);
      const pickUpOcc14Days = this.safeParseNumber(item.Pick_Up_Occ["14_Days"]);
      const pickUpOcc30Days = this.safeParseNumber(item.Pick_Up_Occ["30_Days"]);

      // Performance values
      const stlyVarOcc = this.safeParseNumber(item.STLY_Var.Occ);
      const stlyVarADR = this.safeParseNumber(item.STLY_Var.ADR);
      const stlyVarRevPAR = this.safeParseNumber(item.STLY_Var.RevPAR);
      const stlmVarOcc = this.safeParseNumber(item.STLM_Var.Occ);
      const stlmVarADR = this.safeParseNumber(item.STLM_Var.ADR);
      const stlmVarRevPAR = this.safeParseNumber(item.STLM_Var.RevPAR);

      // Reviews values
      const bookingRevScore = this.safeParseNumber(
        item.Reviews.Booking.Rev_Score
      );
      const bookingTotalRev = this.safeParseNumber(
        item.Reviews.Booking.Total_Rev
      );
      const airbnbRevScore = this.safeParseNumber(
        item.Reviews.Airbnb.Rev_Score
      );
      const airbnbTotalRev = this.safeParseNumber(
        item.Reviews.Airbnb.Total_Rev
      );
      const vrboRevScore = this.safeParseNumber(item.Reviews.VRBO.Rev_Score);
      const vrboTotalRev = this.safeParseNumber(item.Reviews.VRBO.Total_Rev);

      // Basic range filters
      const matchesAdrMin = this.adrMin === null || adrTM >= this.adrMin;
      const matchesAdrMax = this.adrMax === null || adrTM <= this.adrMax;
      const matchesRevparMin =
        this.revparMin === null || revparTM >= this.revparMin;
      const matchesRevparMax =
        this.revparMax === null || revparTM <= this.revparMax;
      const matchesMpiMin = this.mpiMin === null || mpi >= this.mpiMin;
      const matchesMpiMax = this.mpiMax === null || mpi <= this.mpiMax;
      const matchesMinRateThresholdMin =
        this.minRateThresholdMin === null ||
        minRateThreshold >= this.minRateThresholdMin;
      const matchesMinRateThresholdMax =
        this.minRateThresholdMax === null ||
        minRateThreshold <= this.minRateThresholdMax;

      // Occupancy filters
      const matchesOccupancyTMMin =
        this.occupancyTMMin === null || occupancyTM >= this.occupancyTMMin;
      const matchesOccupancyTMMax =
        this.occupancyTMMax === null || occupancyTM <= this.occupancyTMMax;
      const matchesOccupancyNMMin =
        this.occupancyNMMin === null || occupancyNM >= this.occupancyNMMin;
      const matchesOccupancyNMMax =
        this.occupancyNMMax === null || occupancyNM <= this.occupancyNMMax;
      const matchesOccupancy7DaysMin =
        this.occupancy7DaysMin === null ||
        occupancy7Days >= this.occupancy7DaysMin;
      const matchesOccupancy7DaysMax =
        this.occupancy7DaysMax === null ||
        occupancy7Days <= this.occupancy7DaysMax;
      const matchesOccupancy30DaysMin =
        this.occupancy30DaysMin === null ||
        occupancy30Days >= this.occupancy30DaysMin;
      const matchesOccupancy30DaysMax =
        this.occupancy30DaysMax === null ||
        occupancy30Days <= this.occupancy30DaysMax;
      const matchesPickUpOcc7DaysMin =
        this.pickUpOcc7DaysMin === null ||
        pickUpOcc7Days >= this.pickUpOcc7DaysMin;
      const matchesPickUpOcc7DaysMax =
        this.pickUpOcc7DaysMax === null ||
        pickUpOcc7Days <= this.pickUpOcc7DaysMax;
      const matchesPickUpOcc14DaysMin =
        this.pickUpOcc14DaysMin === null ||
        pickUpOcc14Days >= this.pickUpOcc14DaysMin;
      const matchesPickUpOcc14DaysMax =
        this.pickUpOcc14DaysMax === null ||
        pickUpOcc14Days <= this.pickUpOcc14DaysMax;
      const matchesPickUpOcc30DaysMin =
        this.pickUpOcc30DaysMin === null ||
        pickUpOcc30Days >= this.pickUpOcc30DaysMin;
      const matchesPickUpOcc30DaysMax =
        this.pickUpOcc30DaysMax === null ||
        pickUpOcc30Days <= this.pickUpOcc30DaysMax;

      // Performance filters (STLY Var)
      const matchesStlyVarOccMin =
        this.stlyVarOccMin === null || stlyVarOcc >= this.stlyVarOccMin;
      const matchesStlyVarOccMax =
        this.stlyVarOccMax === null || stlyVarOcc <= this.stlyVarOccMax;
      const matchesStlyVarADRMin =
        this.stlyVarADRMin === null || stlyVarADR >= this.stlyVarADRMin;
      const matchesStlyVarADRMax =
        this.stlyVarADRMax === null || stlyVarADR <= this.stlyVarADRMax;
      const matchesStlyVarRevPARMin =
        this.stlyVarRevPARMin === null ||
        stlyVarRevPAR >= this.stlyVarRevPARMin;
      const matchesStlyVarRevPARMax =
        this.stlyVarRevPARMax === null ||
        stlyVarRevPAR <= this.stlyVarRevPARMax;

      // Performance filters (STLM Var)
      const matchesStlmVarOccMin =
        this.stlmVarOccMin === null || stlmVarOcc >= this.stlmVarOccMin;
      const matchesStlmVarOccMax =
        this.stlmVarOccMax === null || stlmVarOcc <= this.stlmVarOccMax;
      const matchesStlmVarADRMin =
        this.stlmVarADRMin === null || stlmVarADR >= this.stlmVarADRMin;
      const matchesStlmVarADRMax =
        this.stlmVarADRMax === null || stlmVarADR <= this.stlmVarADRMax;
      const matchesStlmVarRevPARMin =
        this.stlmVarRevPARMin === null ||
        stlmVarRevPAR >= this.stlmVarRevPARMin;
      const matchesStlmVarRevPARMax =
        this.stlmVarRevPARMax === null ||
        stlmVarRevPAR <= this.stlmVarRevPARMax;

      // Platform filters - Booking.com (three-state filtering)
      const matchesBookingGenius = this.matchesThreeStateFilter(
        this.bookingGeniusFilter,
        item.BookingCom.Genius
      );
      const matchesBookingMobile = this.matchesThreeStateFilter(
        this.bookingMobileFilter,
        item.BookingCom.Mobile
      );
      const matchesBookingPref = this.matchesThreeStateFilter(
        this.bookingPrefFilter,
        item.BookingCom.Pref
      );
      const matchesBookingWeekly = this.matchesThreeStateFilter(
        this.bookingWeeklyFilter,
        item.BookingCom.Weekly
      );
      const matchesBookingMonthly = this.matchesThreeStateFilter(
        this.bookingMonthlyFilter,
        item.BookingCom.Monthly
      );
      const matchesBookingLMDisc = this.matchesThreeStateFilter(
        this.bookingLMDiscFilter,
        item.BookingCom.LM_Disc
      );

      // Platform filters - Airbnb (three-state filtering)
      const matchesAirbnbWeekly = this.matchesThreeStateFilter(
        this.airbnbWeeklyFilter,
        item.Airbnb.Weekly
      );
      const matchesAirbnbMonthly = this.matchesThreeStateFilter(
        this.airbnbMonthlyFilter,
        item.Airbnb.Monthly
      );
      const matchesAirbnbMember = this.matchesThreeStateFilter(
        this.airbnbMemberFilter,
        item.Airbnb.Member
      );
      const matchesAirbnbLMDisc = this.matchesThreeStateFilter(
        this.airbnbLMDiscFilter,
        item.Airbnb.LM_Disc
      );

      // Platform filters - VRBO (three-state filtering)
      const matchesVrboWeekly = this.matchesThreeStateFilter(
        this.vrboWeeklyFilter,
        item.VRBO.Weekly
      );
      const matchesVrboMonthly = this.matchesThreeStateFilter(
        this.vrboMonthlyFilter,
        item.VRBO.Monthly
      );

      // Reviews filters - Booking.com
      const matchesBookingRevScoreMin =
        this.bookingRevScoreMin === null ||
        bookingRevScore >= this.bookingRevScoreMin;
      const matchesBookingRevScoreMax =
        this.bookingRevScoreMax === null ||
        bookingRevScore <= this.bookingRevScoreMax;
      const matchesBookingTotalRevMin =
        this.bookingTotalRevMin === null ||
        bookingTotalRev >= this.bookingTotalRevMin;
      const matchesBookingTotalRevMax =
        this.bookingTotalRevMax === null ||
        bookingTotalRev <= this.bookingTotalRevMax;

      // Reviews filters - Airbnb
      const matchesAirbnbRevScoreMin =
        this.airbnbRevScoreMin === null ||
        airbnbRevScore >= this.airbnbRevScoreMin;
      const matchesAirbnbRevScoreMax =
        this.airbnbRevScoreMax === null ||
        airbnbRevScore <= this.airbnbRevScoreMax;
      const matchesAirbnbTotalRevMin =
        this.airbnbTotalRevMin === null ||
        airbnbTotalRev >= this.airbnbTotalRevMin;
      const matchesAirbnbTotalRevMax =
        this.airbnbTotalRevMax === null ||
        airbnbTotalRev <= this.airbnbTotalRevMax;

      // Reviews filters - VRBO
      const matchesVrboRevScoreMin =
        this.vrboRevScoreMin === null || vrboRevScore >= this.vrboRevScoreMin;
      const matchesVrboRevScoreMax =
        this.vrboRevScoreMax === null || vrboRevScore <= this.vrboRevScoreMax;
      const matchesVrboTotalRevMin =
        this.vrboTotalRevMin === null || vrboTotalRev >= this.vrboTotalRevMin;
      const matchesVrboTotalRevMax =
        this.vrboTotalRevMax === null || vrboTotalRev <= this.vrboTotalRevMax;

      return (
        matchesSearch &&
        matchesArea &&
        matchesRoomType &&
        // Basic filters
        matchesAdrMin &&
        matchesAdrMax &&
        matchesRevparMin &&
        matchesRevparMax &&
        matchesMpiMin &&
        matchesMpiMax &&
        matchesMinRateThresholdMin &&
        matchesMinRateThresholdMax &&
        // Occupancy filters
        matchesOccupancyTMMin &&
        matchesOccupancyTMMax &&
        matchesOccupancyNMMin &&
        matchesOccupancyNMMax &&
        matchesOccupancy7DaysMin &&
        matchesOccupancy7DaysMax &&
        matchesOccupancy30DaysMin &&
        matchesOccupancy30DaysMax &&
        matchesPickUpOcc7DaysMin &&
        matchesPickUpOcc7DaysMax &&
        matchesPickUpOcc14DaysMin &&
        matchesPickUpOcc14DaysMax &&
        matchesPickUpOcc30DaysMin &&
        matchesPickUpOcc30DaysMax &&
        // Performance filters
        matchesStlyVarOccMin &&
        matchesStlyVarOccMax &&
        matchesStlyVarADRMin &&
        matchesStlyVarADRMax &&
        matchesStlyVarRevPARMin &&
        matchesStlyVarRevPARMax &&
        matchesStlmVarOccMin &&
        matchesStlmVarOccMax &&
        matchesStlmVarADRMin &&
        matchesStlmVarADRMax &&
        matchesStlmVarRevPARMin &&
        matchesStlmVarRevPARMax &&
        // Platform filters
        matchesBookingGenius &&
        matchesBookingMobile &&
        matchesBookingPref &&
        matchesBookingWeekly &&
        matchesBookingMonthly &&
        matchesBookingLMDisc &&
        matchesAirbnbWeekly &&
        matchesAirbnbMonthly &&
        matchesAirbnbMember &&
        matchesAirbnbLMDisc &&
        matchesVrboWeekly &&
        matchesVrboMonthly &&
        // Reviews filters
        matchesBookingRevScoreMin &&
        matchesBookingRevScoreMax &&
        matchesBookingTotalRevMin &&
        matchesBookingTotalRevMax &&
        matchesAirbnbRevScoreMin &&
        matchesAirbnbRevScoreMax &&
        matchesAirbnbTotalRevMin &&
        matchesAirbnbTotalRevMax &&
        matchesVrboRevScoreMin &&
        matchesVrboRevScoreMax &&
        matchesVrboTotalRevMin &&
        matchesVrboTotalRevMax
      );
    });

    this.currentPage = 1;
    this.updatePagination();
    this.calculateSummaryData(); // Recalculate summary data based on filtered results
  }

  // Sort data by field
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }

    this.filteredData.sort((a, b) => {
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
          aVal = this.safeParseNumber(a.MPI);
          bVal = this.safeParseNumber(b.MPI);
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

  // Pagination methods
  updatePagination(): void {
    // For API-based pagination, we'll need to get total count from the API response
    // For now, using filtered data length as fallback
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page !== this.currentPage && page <= this.totalPages) {
      this.currentPage = page;
      // No need to load new data since we're using client-side pagination with filtered data
    }
  }

  getPageNumbers(): number[] {
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
      console.error("Property ID is undefined");
      return;
    }
    this.router.navigate(["/revenue/property-details", propertyId]);
  }

  compareProperty(item: PropertyData): void {
    console.log("Compare property:", item);
    // Implement property comparison logic
    // This could open a comparison modal, navigate to a comparison page, etc.
  }

  exportToCSV() {
    this.loading = true;
    this.exportService.exportToCSV(this.operatorId || "").subscribe({
      next: (res: any) => {
        this.loading = false;
          // Check if res.data is a URL (starts with http or https)
          if (typeof res.data.file_url === "string" && res.data.file_url.startsWith("https")) {
            // Open the link in a new tab
            window.open(res.data.file_url, "_blank");
            this.toastr.success("Properties exported successfully");
          } else {
            // Fallback: treat as CSV string and download as file
            const blob = new Blob([res.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `properties_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            this.toastr.success("Properties exported successfully");
          }
        
      },
      error: (error) => {
        this.loading = false;
        this.toastr.error(error.error?.error || "Failed to export properties");
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
    itemValue: string
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
  getPaginatedData(): PropertyData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

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
    // Apply filters immediately for real-time feedback
    this.filterData();
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

    this.filterData();
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
    if (property.Property_URLs && property.Property_URLs[platform]) {
      const url = property.Property_URLs[platform];
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      console.warn(
        `No URL found for ${platform} platform for property: ${property.Listing_Name}`
      );
    }
  }

  // Filter Preset Methods
  loadFilterPresets(): void {
    this.filterPresetService.presets$.subscribe(presets => {
      this.filterPresets = presets;
    });
  }

  getCurrentFilters(): FilterPreset['filters'] {
    return {
      // Basic filters
      selectedArea: this.selectedArea || undefined,
      selectedRoomType: this.selectedRoomType || undefined,
      
      // Range filters
      adrMin: this.adrMin,
      adrMax: this.adrMax,
      revparMin: this.revparMin,
      revparMax: this.revparMax,
      mpiMin: this.mpiMin,
      mpiMax: this.mpiMax,
      minRateThresholdMin: this.minRateThresholdMin,
      minRateThresholdMax: this.minRateThresholdMax,
      
      // Occupancy filters
      occupancyTMMin: this.occupancyTMMin,
      occupancyTMMax: this.occupancyTMMax,
      occupancyNMMin: this.occupancyNMMin,
      occupancyNMMax: this.occupancyNMMax,
      occupancy7DaysMin: this.occupancy7DaysMin,
      occupancy7DaysMax: this.occupancy7DaysMax,
      occupancy30DaysMin: this.occupancy30DaysMin,
      occupancy30DaysMax: this.occupancy30DaysMax,
      pickUpOcc7DaysMin: this.pickUpOcc7DaysMin,
      pickUpOcc7DaysMax: this.pickUpOcc7DaysMax,
      pickUpOcc14DaysMin: this.pickUpOcc14DaysMin,
      pickUpOcc14DaysMax: this.pickUpOcc14DaysMax,
      pickUpOcc30DaysMin: this.pickUpOcc30DaysMin,
      pickUpOcc30DaysMax: this.pickUpOcc30DaysMax,
      
      // Performance filters
      stlyVarOccMin: this.stlyVarOccMin,
      stlyVarOccMax: this.stlyVarOccMax,
      stlyVarADRMin: this.stlyVarADRMin,
      stlyVarADRMax: this.stlyVarADRMax,
      stlyVarRevPARMin: this.stlyVarRevPARMin,
      stlyVarRevPARMax: this.stlyVarRevPARMax,
      stlmVarOccMin: this.stlmVarOccMin,
      stlmVarOccMax: this.stlmVarOccMax,
      stlmVarADRMin: this.stlmVarADRMin,
      stlmVarADRMax: this.stlmVarADRMax,
      stlmVarRevPARMin: this.stlmVarRevPARMin,
      stlmVarRevPARMax: this.stlmVarRevPARMax,
      
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
      
      // Reviews filters
      bookingRevScoreMin: this.bookingRevScoreMin,
      bookingRevScoreMax: this.bookingRevScoreMax,
      bookingTotalRevMin: this.bookingTotalRevMin,
      bookingTotalRevMax: this.bookingTotalRevMax,
      airbnbRevScoreMin: this.airbnbRevScoreMin,
      airbnbRevScoreMax: this.airbnbRevScoreMax,
      airbnbTotalRevMin: this.airbnbTotalRevMin,
      airbnbTotalRevMax: this.airbnbTotalRevMax,
      vrboRevScoreMin: this.vrboRevScoreMin,
      vrboRevScoreMax: this.vrboRevScoreMax,
      vrboTotalRevMin: this.vrboTotalRevMin,
      vrboTotalRevMax: this.vrboTotalRevMax
    };
  }

  applyPresetFilters(filters: FilterPreset['filters']): void {
    // Basic filters
    this.selectedArea = filters.selectedArea || '';
    this.selectedRoomType = filters.selectedRoomType || '';
    
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
    
    // Apply the filters
    this.filterData();
  }

  onPresetSelectionChange(): void {
    if (this.selectedPresetId) {
      const preset = this.filterPresetService.getPresetById(this.selectedPresetId);
      if (preset) {
        this.applyPresetFilters(preset.filters);
      }
    }
  }

  showSavePresetDialog(): void {
    if (!this.hasActiveFilters()) {
      alert('No active filters to save. Please apply some filters first.');
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

    try {
      const currentFilters = this.getCurrentFilters();
      this.filterPresetService.savePreset(
        this.newPresetName.trim(),
        currentFilters,
        this.newPresetDescription.trim() || undefined
      );
      
      this.cancelSavePreset();
      alert(`Filter preset "${this.newPresetName}" saved successfully!`);
    } catch (error: any) {
      this.presetSaveError = error.message || 'Failed to save preset';
    }
  }

  deletePreset(presetId: string): void {
    const preset = this.filterPresetService.getPresetById(presetId);
    if (preset && confirm(`Are you sure you want to delete the preset "${preset.name}"?`)) {
      this.filterPresetService.deletePreset(presetId);
      if (this.selectedPresetId === presetId) {
        this.selectedPresetId = '';
      }
    }
  }

  duplicatePreset(presetId: string): void {
    const preset = this.filterPresetService.getPresetById(presetId);
    if (preset) {
      const newName = prompt(`Enter name for the duplicate preset:`, `${preset.name} (Copy)`);
      if (newName && newName.trim()) {
        try {
          this.filterPresetService.duplicatePreset(presetId, newName.trim());
          alert(`Preset duplicated as "${newName}"`);
        } catch (error: any) {
          alert(error.message || 'Failed to duplicate preset');
        }
      }
    }
  }

  getPresetSummary(preset: FilterPreset): string[] {
    return this.filterPresetService.getPresetSummary(preset);
  }

  togglePresetManagement(): void {
    this.showPresetManagement = !this.showPresetManagement;
  }

  exportPresets(): void {
    try {
      const data = this.filterPresetService.exportPresets();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filter_presets_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export presets');
    }
  }

  importPresets(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const importedCount = this.filterPresetService.importPresets(jsonData, false);
          alert(`Successfully imported ${importedCount} preset(s)`);
        } catch (error: any) {
          alert(error.message || 'Failed to import presets');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  }
}
