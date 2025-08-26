import { Component, OnInit } from '@angular/core';

interface RevenueItem {
  id: number;
  listingName: string;
  address: string;
  category: string;
  dateCreated: Date;
  price: number;
  revenue: number;
  commission: number;
  status: string;
  agent: string;
  agentPhoto?: string;
}

@Component({
  selector: 'app-revenue',
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.scss',
})
export class RevenueComponent implements OnInit {
  
  // Summary data
  totalRevenue: number = 2847560.75;
  totalListings: number = 156;
  averageRevenue: number = 18254.36;
  growthRate: number = 15.8;

  // Table data
  revenueData: RevenueItem[] = [
    {
      id: 1,
      listingName: 'Luxury Downtown Condo',
      address: '123 Main St, Downtown',
      category: 'Residential',
      dateCreated: new Date('2024-01-15'),
      price: 750000,
      revenue: 45000,
      commission: 22500,
      status: 'Sold',
      agent: 'John Smith',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    },
    {
      id: 2,
      listingName: 'Modern Office Space',
      address: '456 Business Ave, CBD',
      category: 'Commercial',
      dateCreated: new Date('2024-01-20'),
      price: 1200000,
      revenue: 72000,
      commission: 36000,
      status: 'Active',
      agent: 'Sarah Johnson',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    },
    {
      id: 3,
      listingName: 'Family Home with Garden',
      address: '789 Oak Street, Suburbs',
      category: 'Residential',
      dateCreated: new Date('2024-01-25'),
      price: 450000,
      revenue: 27000,
      commission: 13500,
      status: 'Pending',
      agent: 'Mike Wilson',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    },
    {
      id: 4,
      listingName: 'Industrial Warehouse',
      address: '321 Industrial Rd, Port',
      category: 'Industrial',
      dateCreated: new Date('2024-02-01'),
      price: 2500000,
      revenue: 150000,
      commission: 75000,
      status: 'Sold',
      agent: 'Emily Davis',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    },
    {
      id: 5,
      listingName: 'Retail Store Front',
      address: '654 Shopping Mall, Center',
      category: 'Commercial',
      dateCreated: new Date('2024-02-05'),
      price: 850000,
      revenue: 51000,
      commission: 25500,
      status: 'Active',
      agent: 'David Brown',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    },
    {
      id: 6,
      listingName: 'Beachfront Villa',
      address: '987 Ocean View, Coastal',
      category: 'Residential',
      dateCreated: new Date('2024-02-10'),
      price: 1800000,
      revenue: 108000,
      commission: 54000,
      status: 'Active',
      agent: 'Lisa Garcia',
      agentPhoto: 'assets/images/icons8-avatar.svg'
    }
  ];

  filteredData: RevenueItem[] = [...this.revenueData];
  
  // Search and filter properties
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Sorting properties
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Utility property for template
  Math = Math;

  constructor() { }

  ngOnInit(): void {
    this.updatePagination();
  }

  // Filter data based on search term, category, and status
  filterData(): void {
    this.filteredData = this.revenueData.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.listingName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.address.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.agent.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || item.category === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || item.status === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  // Sort data by field
  sortBy(field: keyof RevenueItem): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle different data types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      // if (aVal < bVal) {
      //   return this.sortDirection === 'asc' ? -1 : 1;
      // }
      // if (aVal > bVal) {
      //   return this.sortDirection === 'asc' ? 1 : -1;
      // }
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

  // Utility methods for styling
  getCategoryClass(category: string): string {
    switch (category) {
      case 'Residential': return 'badge-residential';
      case 'Commercial': return 'badge-commercial';
      case 'Industrial': return 'badge-industrial';
      default: return 'badge-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Sold': return 'badge-success';
      case 'Active': return 'badge-primary';
      case 'Pending': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Sold': return 'fa-check-circle';
      case 'Active': return 'fa-circle';
      case 'Pending': return 'fa-clock';
      default: return 'fa-question-circle';
    }
  }

  // Action methods
  viewDetails(item: RevenueItem): void {
    console.log('View details for:', item);
    // Implement view details logic
  }

  editListing(item: RevenueItem): void {
    console.log('Edit listing:', item);
    // Implement edit listing logic
  }

  duplicateListing(item: RevenueItem): void {
    console.log('Duplicate listing:', item);
    // Implement duplicate listing logic
  }

  archiveListing(item: RevenueItem): void {
    console.log('Archive listing:', item);
    // Implement archive listing logic
  }

  deleteListing(item: RevenueItem): void {
    console.log('Delete listing:', item);
    // Implement delete listing logic with confirmation
  }
}
