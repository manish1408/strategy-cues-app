import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { PropertiesService } from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { ToastService } from "../_services/toast.service";
import { EventService } from "../_services/event.service";
import { ListingService } from "../_services/listing.service";
import { ActivatedRoute } from "@angular/router";
import { PricelabsService } from "../_services/pricelabs.service";
import { Status, PropertyStatus } from "../_models/status.model";

@Component({
  selector: "app-listing",
  standalone: false,
  templateUrl: "./listing.component.html",
  styleUrls: ["./listing.component.scss"],
})
export class ListingComponent implements OnInit, OnDestroy {
  @ViewChild("closeButton") closeButton!: ElementRef;

  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 0;
  apiLoading: boolean = false;
  syncPriceLabsLoading: boolean = false;
  loading: boolean = false;
  allListingList: any[] = [];
  isEdit: boolean = false;
  editingListingId: string | null = null;
  operatorId: string | null = null;
  addListingForm: FormGroup;
  sortOrder: string = 'desc';
  bookingComId: string | null = null;
  airbnbId: string | null = null;
  vrboId: string | null = null;
  pricelab: string | null = null;
  // Status management
  Status = Status; // Make Status enum available in template
  propertyStatuses: { [key: string]: PropertyStatus } = {}; // Store status for each property
  statusPollingIntervals: { [key: string]: any } = {}; // Store polling intervals for each property
  constructor(
    private toastr: ToastrService,
    private fb: FormBuilder,
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private eventService: EventService<any>,
    private listingService: ListingService,
    private route: ActivatedRoute,
    private pricelabsService: PricelabsService
  ) {
    this.addListingForm = this.fb.group({
      bookingCom: this.fb.group({
        url: [""],
        id: [""],
      }),
      airbnb: this.fb.group({
        url: [""],
        id: [""],
      }),
      vrbo: this.fb.group({
        url: [""],
        id: [""],
      }),
      pricelab: this.fb.group({
        url: [""],
        id: [""],
      }),
    });
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
        this.loadListings();
      });
   
  }
 

 

  loadListings() {
    this.apiLoading = true;
   
    this.listingService.getListings(this.currentPage, this.itemsPerPage, this.operatorId || '', this.sortOrder)
  .subscribe(
    (res: any) => {
      if (res.success) {
        // Ensure properties is an array
        if (Array.isArray(res.data.properties)) {
          this.allListingList = res.data.properties.map((listing: any) => ({
            id: listing.id,
            property_urls: {
              Booking: {
                id: listing.urls.BookingId,
                url: listing.urls.BookingUrl
              },
              Airbnb: {
                id: listing.urls.AirbnbId,
                url: listing.urls.AirbnbUrl
              },
              VRBO: {
                id: listing.urls.VRBOId,
                url: listing.urls.VRBOUrl
              },
              Pricelab: {
                id: listing.urls.PricelabsId,
                url: listing.urls.PricelabsUrl
              }
            },
            urls: listing.urls // Keep original structure for status access
          }));
          
          // Initialize property statuses from the main API response
          this.initializePropertyStatuses(res.data.properties);
        }

        // Update pagination data
        this.totalPages = res.data.pagination.total_pages;
        this.currentPage = res.data.pagination.page;
        this.itemsPerPage = res.data.pagination.limit;
      }
      this.apiLoading = false;
    },
    (error: any) => {
      console.error('Error loading listings:', error);
      this.apiLoading = false;
    }
  );
  }

  initializePropertyStatuses(properties: any[]) {
    // Initialize property statuses from the main API response
    properties.forEach((property: any) => {
      if (property.id && this.operatorId) {
        const apiStatus = property.urls?.status || 'pending';
        
        this.propertyStatuses[property.id] = {
          propertyId: property.id,
          operatorId: this.operatorId!,
          syncStatus: apiStatus,
          mappingStatus: apiStatus,
          lastUpdated: new Date()
        };
        
        // Start polling if any operation is in progress
        if (apiStatus === 'scraping_in_progress' || apiStatus === 'mapping_in_progress') {
          this.startStatusPolling(property.id);
        }
      }
    });
  }



  isPollingActive(propertyId: string): boolean {
    // Check if there's an active polling interval for this property
    return !!this.statusPollingIntervals[propertyId];
  }



  isStatusLoading(propertyId: string): boolean {
    const status = this.propertyStatuses[propertyId];
    return !status;
  }

  isScrapeAndMapDisabled(propertyId: string): boolean {
    const status = this.propertyStatuses[propertyId];
    if (!status) return false;
    
    // Disable if scraping or mapping is in progress
    return status.syncStatus === 'scraping_in_progress' || status.syncStatus === 'mapping_in_progress';
  }

  getCombinedStatusText(propertyId: string): string {
    const status = this.propertyStatuses[propertyId];
    if (!status) return 'Loading';
    
    // Return the actual status from API response
    return status.syncStatus || status.mappingStatus || 'pending';
  }

  getCombinedStatusClass(propertyId: string): string {
    const status = this.propertyStatuses[propertyId];
    if (!status) return 'bg-secondary';
    
    const combinedStatus = this.getCombinedStatusText(propertyId);
    switch (combinedStatus) {
      case 'completed': return 'bg-success';
      case 'scraping_in_progress': return 'bg-primary';
      case 'mapping_in_progress': return 'bg-info';
      case 'error_in_scraping': return 'bg-danger';
      case 'error_in_mapping': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }


  startStatusPolling(propertyId: string) {
    // Clear any existing polling for this property
    this.stopStatusPolling(propertyId);
    
    // Start polling every 30 seconds (30000ms) for faster updates
    this.statusPollingIntervals[propertyId] = setInterval(() => {
      this.checkPropertyStatus(propertyId);
    }, 5000);
    
  }

  stopStatusPolling(propertyId: string) {
    if (this.statusPollingIntervals[propertyId]) {
      clearInterval(this.statusPollingIntervals[propertyId]);
      delete this.statusPollingIntervals[propertyId];
    }
  }

  checkPropertyStatus(propertyId: string) {
    if (propertyId && this.operatorId) {
      this.propertiesService.getProperty(propertyId, this.operatorId).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            const newStatus = res.data.status || 'pending';
            const oldStatus = this.propertyStatuses[propertyId];
            
            // Update status
            this.propertyStatuses[propertyId] = {
              propertyId: propertyId,
              operatorId: this.operatorId!,
              syncStatus: newStatus,
              mappingStatus: newStatus,
              lastUpdated: new Date()
            };
            
            // Show toast notifications for status changes and stop polling when operations complete
            if (oldStatus) {
              // Show toast if operation completed
              if (newStatus === 'completed' && oldStatus.syncStatus !== 'completed') {
                this.toastr.success(`Scraping and mapping completed successfully for Property ID: ${propertyId}!`);
                this.stopStatusPolling(propertyId);
              } else if (newStatus === 'error_in_scraping' && oldStatus.syncStatus !== 'error_in_scraping') {
                this.toastr.error(`Scraping failed for Property ID: ${propertyId}. Please try again.`);
                this.stopStatusPolling(propertyId); // Stop polling when failed
              } else if (newStatus === 'error_in_mapping' && oldStatus.syncStatus !== 'error_in_mapping') {
                this.toastr.error(`Mapping failed for Property ID: ${propertyId}. Please try again.`);
                this.stopStatusPolling(propertyId); // Stop polling when failed
              }
            }
            
          }
        },
        error: (error: any) => {
          console.error(`Error polling status for property ${propertyId}:`, error);
        }
      });
    }
  }

  fetchUpdatedPropertyStatus(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    // Find the property that matches the provided IDs
    const matchingProperty = this.allListingList.find((listing: any) => {
      const listingBookingId = listing?.urls?.Booking?.id || listing?.property_urls?.Booking?.id;
      const listingAirbnbId = listing?.urls?.Airbnb?.id || listing?.property_urls?.Airbnb?.id;
      const listingVrboId = listing?.urls?.VRBO?.id || listing?.property_urls?.VRBO?.id;
      const listingPricelabId = listing?.urls?.Pricelab?.id || listing?.property_urls?.Pricelab?.id;
      
      return (bookingId && listingBookingId === bookingId) ||
             (airbnbId && listingAirbnbId === airbnbId) ||
             (vrboId && listingVrboId === vrboId) ||
             (pricelabsId && listingPricelabId === pricelabsId);
    });

    if (matchingProperty && matchingProperty.id) {
      // Update status to scraping_in_progress and start polling
      this.propertyStatuses[matchingProperty.id] = {
        propertyId: matchingProperty.id,
        operatorId: this.operatorId!,
        syncStatus: 'scraping_in_progress',
        mappingStatus: 'scraping_in_progress',
        lastUpdated: new Date()
      };
      
      // Start polling for this property to check status every 5 seconds
      this.startStatusPolling(matchingProperty.id);
    }
  }

  editListing(listing: any) {
    
    if (listing && listing.id) {
      this.isEdit = true;
      this.editingListingId = listing.id;
      
      const formData = {
        bookingCom: {
          url: listing.property_urls?.Booking?.url || "",
          id: listing.property_urls?.Booking?.id || "",
        },
        airbnb: {
          url: listing.property_urls?.Airbnb?.url || "",
          id: listing.property_urls?.Airbnb?.id || "",
        },
        vrbo: {
          url: listing.property_urls?.VRBO?.url || "",
          id: listing.property_urls?.VRBO?.id || "",
        },
        pricelab: {
          url: listing.property_urls?.Pricelab?.url || "",
          id: listing.property_urls?.Pricelab?.id || "",
        },
      };
      
      
      this.addListingForm.patchValue(formData);
      
    } else {
      console.error('Invalid listing object:', listing);
    }
  }

 

  deleteListing(listingId: string) {
  
    this.toastService.showConfirm(
      'Are you sure?',
      'Delete the selected listing?',
      'Yes, delete it!',
      'No, cancel',
      () => {
        this.propertiesService
          .deleteProperty(listingId, this.operatorId || '') // Ensure operatorId is passed
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              this.toastr.success("Listing deleted successfully");
              this.loadListings();
            },
            error: (error: any) => {
              console.error("Error deleting listing:", error);
              this.toastr.error("Failed to delete listing");
            },
          });
      },
      () => {
      }
    );
  }



  hasError(controlName: string) {
    const control = this.addListingForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
  
    this.addListingForm.markAllAsTouched();
    const { bookingCom, airbnb, vrbo, pricelab } = this.addListingForm.value;
    if ((bookingCom.url && !bookingCom.id) || (airbnb.url && !airbnb.id) || (vrbo.url && !vrbo.id) || (pricelab.url && !pricelab.id)) {
      this.toastr.error("Please provide an ID for each URL you entered.");
      return;
    }
    if (!bookingCom.id && !airbnb.id && !vrbo.id && !pricelab.id) {
      this.toastr.error("At least one listing ID must be provided.");
      return;
    }
  
    if (this.addListingForm.valid) {
      this.loading = true;
      const formData = {
        operator_id: this.operatorId,
        Property_URLs: {
          Booking: {
            url: bookingCom.url,
            id: bookingCom.id || '',
          },
          Airbnb: {
            url: airbnb.url,
            id: airbnb.id || '',
          },
          VRBO: {
            url: vrbo.url,
            id: vrbo.id || '',
          },
         
          Pricelab: {
            url: pricelab.url,
            id: pricelab.id || '',
          },
        },
      };
  
      if (this.isEdit && this.editingListingId) {
        this.propertiesService
          .updateProperty(formData, this.editingListingId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              this.toastr.success("Listing updated successfully");
              this.loadListings();
              this.resetForm();
              this.closeModal();
            },
            error: (error: any) => {
              console.error("Error updating listing:", error);
              this.toastr.error("Failed to update listing");
            },
          });
      } else {
        this.propertiesService
          .createProperty(formData)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              this.toastr.success("Listing created successfully");
              this.loadListings();
              this.resetForm();
              this.closeModal();
            },
            error: (error: any) => {
              console.error("Error creating listing:", error);
              this.toastr.error("Failed to create listing");
            },
          });
      }
    }
  }

  resetForm() {
    this.addListingForm.reset();
    this.addListingForm.patchValue({
      operator_id: this.operatorId,
      Property_URLs: {
        bookingCom: {
          url: "",
          id: "",
        },
        airbnb: {
          url: "",
          id: "",
        },
        vrbo: {
          url: "",
          id: "",
        },
        pricelab: {
          url: "",
          id: "",
        },
      },
    });
    this.isEdit = false;
    this.editingListingId = null;
  }

  closeModal() {
    const modalElement = document.getElementById("addListing");
    if (modalElement) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        const closeButton = modalElement.querySelector(
          '[data-bs-dismiss="modal"]'
        ) as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }

 
  // Pagination methods
  updatePagination(): void {
    // For API-based pagination, we'll need to get total count from the API response
    this.totalPages = Math.ceil(this.allListingList.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page !== this.currentPage && page <= this.totalPages) {
      this.currentPage = page;
      this.loadListings(); // Trigger API call with new page
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

  getPaginatedListings(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.allListingList.slice(startIndex, endIndex);
  }


  scrapeAndMapListing(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    if (!this.operatorId) {
      console.error('Field required: operator_id');
      this.toastr.error('Operator ID is required');
      return;
    }

    if (!bookingId && !airbnbId && !vrboId && !pricelabsId) {
      this.toastr.error('No valid ID found. Please ensure the listing has at least one platform ID (Booking.com, Airbnb, VRBO, or Pricelabs)');
      return;
    }

    // Find the property ID for error handling
    const matchingProperty = this.allListingList.find((listing: any) => {
      const listingBookingId = listing?.urls?.Booking?.id || listing?.property_urls?.Booking?.id;
      const listingAirbnbId = listing?.urls?.Airbnb?.id || listing?.property_urls?.Airbnb?.id;
      const listingVrboId = listing?.urls?.VRBO?.id || listing?.property_urls?.VRBO?.id;
      const listingPricelabId = listing?.urls?.Pricelab?.id || listing?.property_urls?.Pricelab?.id;
      
      return (bookingId && listingBookingId === bookingId) ||
             (airbnbId && listingAirbnbId === airbnbId) ||
             (vrboId && listingVrboId === vrboId) ||
             (pricelabsId && listingPricelabId === pricelabsId);
    });

    this.listingService.scrapeAndMapListing(this.operatorId, bookingId, airbnbId, vrboId, pricelabsId).subscribe({
      next: (res: any) => {
        this.toastr.success(res.data.message || 'Scraping and mapping started successfully');
        // Start polling for status updates
        this.fetchUpdatedPropertyStatus(bookingId, airbnbId, vrboId, pricelabsId);
      },
      error: (error: any) => {
        console.error('Scrape and map error:', error);
        this.toastr.error(`Failed to scrape and map listing for Property ID: ${matchingProperty?.id || 'Unknown'}. ${error.error?.detail || error.message || 'Unknown error'}`);
        
        // Update status to scraping error
        if (matchingProperty && matchingProperty.id) {
          this.propertyStatuses[matchingProperty.id] = {
            propertyId: matchingProperty.id,
            operatorId: this.operatorId!,
            syncStatus: 'error_in_scraping',
            mappingStatus: 'error_in_scraping',
            lastUpdated: new Date()
          };
        }
      }
    });
  }

  


  ngOnDestroy() {
    // Stop all polling intervals when component is destroyed
    Object.keys(this.statusPollingIntervals).forEach(propertyId => {
      this.stopStatusPolling(propertyId);
    });
  }

  syncPriceLabsListings() {
    this.syncPriceLabsLoading = true;
    this.pricelabsService.syncPricelabs(this.operatorId || '').subscribe({
      next: (res: any) => { 
        this.toastr.success("PriceLabs data synced successfully");
        this.syncPriceLabsLoading = false;
        // Refresh listings to show updated data
        this.loadListings();
      },
      error: (error: any) => {
        console.error('PriceLabs error:', error);
        this.toastr.error("Failed to sync PriceLabs data");
        this.syncPriceLabsLoading = false;
      }
    });
  }

  // Property image and name methods for listing
  getListingPropertyImage(listing: any): string {
    // Try to get image from any available platform
    // Priority: Booking.com -> Airbnb -> VRBO -> Pricelab -> Placeholder
    if (listing?.urls?.Photos?.booking && listing.urls.Photos.booking.length > 0) {
      return listing.urls.Photos.booking[0].url;
    }
    if (listing?.urls?.Photos?.airbnb && listing.urls.Photos.airbnb.length > 0) {
      return listing.urls.Photos.airbnb[0].url;
    }
    if (listing?.urls?.Photos?.vrbo && listing.urls.Photos.vrbo.length > 0) {
      return listing.urls.Photos.vrbo[0].url;
    }
    // Fallback to placeholder
    return 'assets/images/placeholder.jpg';
  }

  getListingPropertyName(listing: any): string {
    // Use the PropertyName directly from the API response
    if (listing?.urls?.PropertyName) {
      return listing.urls.PropertyName;
    }
    
    // Fallback to listing ID or default name
    return `Property ${listing?.id || 'Unknown'}`;
  }

  onListingImageError(event: any): void {
    // Set fallback image when the main image fails to load
    event.target.src = 'assets/images/placeholder.jpg';
  }
}
