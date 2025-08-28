import { Component, OnInit } from '@angular/core';
import revenueData from '../json_data/dubai_revenue_magt_cues_50.json';

interface PropertyData {
  Listing_Name: string;
  Area: string;
  Room_Type: string;
  Occupancy: {
    '7_days': string;
    '30_days': string;
    TM: string;
    NM: string;
  };
  ADR: {
    TM: string;
    NM: string;
  };
  RevPAR: {
    TM: string;
    NM: string;
  };
  MPI: string;
  STLY_Var: {
    Occ: string;
    ADR: string;
    RevPAR: string;
  };
  STLM_Var: {
    Occ: string;
    ADR: string;
    RevPAR: string;
  };
  Pick_Up_Occ: {
    '7_Days': string;
    '14_Days': string;
    '30_Days': string;
  };
  Min_Rate_Threshold: string;
  BookingCom: {
    Genius: string;
    Mobile: string;
    Pref: string;
    Weekly: string;
    Monthly: string;
    LM_Disc: string;
  };
  Airbnb: {
    Weekly: string;
    Monthly: string;
    Member: string;
    LM_Disc: string;
  };
  VRBO: {
    Weekly: string;
    Monthly: string;
  };
  CXL_Policy: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
  Adult_Child_Config: {
    Booking: string;
    Airbnb: string;
    VRBO: string;
  };
  Reviews: {
    Booking: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string;
      Rev_Score: string;
      Total_Rev: string;
    };
    Airbnb: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string;
      Rev_Score: string;
      Total_Rev: string;
    };
    VRBO: {
      Last_Rev_Dt: string;
      Last_Rev_Score: string;
      Rev_Score: string;
      Total_Rev: string;
    };
  };
}

@Component({
  selector: 'app-revenue',
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.scss',
})
export class RevenueComponent implements OnInit {
  
  // Data from JSON
  propertyData: PropertyData[] = revenueData as PropertyData[];
  filteredData: PropertyData[] = [...this.propertyData];
  
  // View and tab management
  currentView: 'table' | 'cards' = 'table';
  activeTab: 'booking' | 'airbnb' | 'vrbo' = 'booking'; // Keep for backward compatibility
  cardActiveTabs: { [key: number]: 'booking' | 'airbnb' | 'vrbo' } = {};
  
  // Summary data calculated from JSON
  totalListings: number = 0;
  totalRevenueTM: number = 0;
  totalRevenueNM: number = 0;
  averageOccupancy: number = 0;
  
  // Search and filter properties
  searchTerm: string = '';
  selectedArea: string = '';
  selectedRoomType: string = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Sorting properties
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Utility property for template
  Math = Math;
  
  // Get unique values for filters
  areas: string[] = [];
  roomTypes: string[] = [];

  constructor() { }

  ngOnInit(): void {
    this.calculateSummaryData();
    this.extractFilterOptions();
    this.updatePagination();
  }
  
  calculateSummaryData(): void {
    this.totalListings = this.propertyData.length;
    
    this.totalRevenueTM = this.propertyData.reduce((sum, item) => {
      return sum + parseFloat(item.RevPAR.TM);
    }, 0);
    
    this.totalRevenueNM = this.propertyData.reduce((sum, item) => {
      return sum + parseFloat(item.RevPAR.NM);
    }, 0);
    
    this.averageOccupancy = this.propertyData.reduce((sum, item) => {
      return sum + parseFloat(item.Occupancy.TM.replace('%', ''));
    }, 0) / this.totalListings;
  }
  
  extractFilterOptions(): void {
    this.areas = [...new Set(this.propertyData.map(item => item.Area))];
    this.roomTypes = [...new Set(this.propertyData.map(item => item.Room_Type))];
  }

  // Filter data based on search term, area, and room type
  filterData(): void {
    this.filteredData = this.propertyData.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.Listing_Name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.Area.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesArea = !this.selectedArea || item.Area === this.selectedArea;
      const matchesRoomType = !this.selectedRoomType || item.Room_Type === this.selectedRoomType;

      return matchesSearch && matchesArea && matchesRoomType;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  // Sort data by field
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      // Handle nested object properties
      switch (field) {
        case 'occupancyTM':
          aVal = parseFloat(a.Occupancy.TM.replace('%', ''));
          bVal = parseFloat(b.Occupancy.TM.replace('%', ''));
          break;
        case 'adrTM':
          aVal = parseFloat(a.ADR.TM);
          bVal = parseFloat(b.ADR.TM);
          break;
        case 'revparTM':
          aVal = parseFloat(a.RevPAR.TM);
          bVal = parseFloat(b.RevPAR.TM);
          break;
        case 'mpi':
          aVal = parseFloat(a.MPI.replace('%', ''));
          bVal = parseFloat(b.MPI.replace('%', ''));
          break;
        default:
          aVal = (a as any)[field];
          bVal = (b as any)[field];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
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
  switchView(view: 'table' | 'cards'): void {
    this.currentView = view;
  }
  
  switchTab(tab: 'booking' | 'airbnb' | 'vrbo'): void {
    this.activeTab = tab;
  }
  
  // New methods for per-card tab management
  switchCardTab(cardIndex: number, tab: 'booking' | 'airbnb' | 'vrbo'): void {
    this.cardActiveTabs[cardIndex] = tab;
  }
  
  getActiveTab(cardIndex: number): 'booking' | 'airbnb' | 'vrbo' {
    return this.cardActiveTabs[cardIndex] || 'booking'; // Default to 'booking'
  }
  
  // Utility methods for styling
  getRoomTypeClass(roomType: string): string {
    switch (roomType) {
      case 'Studio': return 'badge-studio';
      case '1BR': return 'badge-1br';
      case '2BR': return 'badge-2br';
      case '3BR': return 'badge-3br';
      case 'Loft': return 'badge-loft';
      case 'Townhouse': return 'badge-townhouse';
      default: return 'badge-secondary';
    }
  }
  
  getPerformanceClass(value: string): string {
    const numValue = parseFloat(value.replace('%', ''));
    if (numValue > 0) return 'text-success';
    if (numValue < 0) return 'text-danger';
    return 'text-muted';
  }
  
  getOccupancyClass(occupancy: string): string {
    const numValue = parseFloat(occupancy.replace('%', ''));
    if (numValue >= 80) return 'bg-success';
    if (numValue >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  // Action methods
  viewDetails(item: PropertyData): void {
    // Find the index of the property in the original data array
    const propertyIndex = this.propertyData.findIndex(prop => 
      prop.Listing_Name === item.Listing_Name && prop.Area === item.Area
    );
    
    if (propertyIndex !== -1) {
      // Open the details page in a new tab
      const url = `/revenue/details/${propertyIndex}`;
      window.open(url, '_blank');
    }
  }

  editProperty(item: PropertyData): void {
    console.log('Edit property:', item);
    // Implement edit property logic
  }

  exportData(): void {
    console.log('Export data');
    // Implement export logic
  }
  
  // Helper methods for templates
  getPaginatedData(): PropertyData[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredData.slice(startIndex, endIndex);
  }

  // Helper method to get MPI TM value (using the current MPI value)
  getMPITM(property: PropertyData): string {
    return property.MPI;
  }

  // Helper method to get MPI NM value (for now, using same as TM - can be updated with actual data later)
  getMPINM(property: PropertyData): string {
    // For now, using the same value as TM
    // This can be updated when actual NM MPI data is available
    return property.MPI;
  }
}
