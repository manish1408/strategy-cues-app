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
import { MapService } from "../_services/map.service";
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
    private mapService: MapService,
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
          console.log('Revenue ngOnInit - operatorId from query params:', this.operatorId);
        } else {
          // Fallback to localStorage
          this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
          console.log('Revenue ngOnInit - operatorId from localStorage:', this.operatorId);
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
            property_urls: listing.urls,
          }));
          
          // Fetch property statuses for each listing
          this.fetchPropertyStatuses();
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

  fetchPropertyStatuses() {
    // Fetch sync and mapping status for each property
    this.allListingList.forEach((listing: any) => {
      if (listing.id && this.operatorId) {
        this.propertiesService.getProperty(listing.id, this.operatorId).subscribe({
          next: (res: any) => {
            if (res.success && res.data) {
              const syncStatus = res.data.scraping_status || Status.PENDING;
              const mappingStatus = res.data.mapping_status || Status.PENDING;
              
              this.propertyStatuses[listing.id] = {
                propertyId: listing.id,
                operatorId: this.operatorId!,
                syncStatus: syncStatus,
                mappingStatus: mappingStatus,
                lastUpdated: new Date()
              };
              
              // Resume polling if any operation is in progress
              if (syncStatus === Status.IN_PROGRESS || mappingStatus === Status.IN_PROGRESS) {
                console.log(`Resuming polling for property ${listing.id} - operation in progress`);
                this.startStatusPolling(listing.id);
              }
            }
          },
          error: (error: any) => {
            console.error(`Error fetching status for property ${listing.id}:`, error);
            // Default to pending if error
            this.propertyStatuses[listing.id] = {
              propertyId: listing.id,
              operatorId: this.operatorId!,
              syncStatus: Status.PENDING,
              mappingStatus: Status.PENDING,
              lastUpdated: new Date()
            };
          }
        });
      }
    });
  }

  isSyncDisabled(propertyId: string): boolean {
    const status = this.propertyStatuses[propertyId];
    if (!status) return false;
    
    // Disable if sync is in progress
    return status.syncStatus === Status.IN_PROGRESS;
  }


  isPollingActive(propertyId: string): boolean {
    // Check if there's an active polling interval for this property
    return !!this.statusPollingIntervals[propertyId];
  }

  isMappingDisabled(propertyId: string): boolean {
    const status = this.propertyStatuses[propertyId];
    if (!status) return true; // Disable if no status available
    
    // Disable if mapping is in progress
    if (status.mappingStatus === Status.IN_PROGRESS) {
      return true;
    }
    
    // Disable if sync is not completed (must sync first)
    if (status.syncStatus !== Status.COMPLETED) {
      return true;
    }
    
    return false;
  }

  getSyncStatusText(propertyId: string): string {
    const status = this.propertyStatuses[propertyId];
    if (!status) return 'Loading';
    
    switch (status.syncStatus) {
      case Status.PENDING: return 'Pending';
      case Status.IN_PROGRESS: return 'In Progress';
      case Status.COMPLETED: return 'Completed';
      case Status.FAILED: return 'Failed';
      default: return 'Loading';
    }
  }

  getMappingStatusText(propertyId: string): string {
    const status = this.propertyStatuses[propertyId];
    if (!status) return 'Loading';
    
    switch (status.mappingStatus) {
      case Status.PENDING: return 'Pending';
      case Status.IN_PROGRESS: return 'In Progress';
      case Status.COMPLETED: return 'Completed';
      case Status.FAILED: return 'Failed';
      default: return 'Loading';
    }
  }

  isStatusLoading(propertyId: string): boolean {
    const status = this.propertyStatuses[propertyId];
    return !status;
  }

  getCombinedStatusText(propertyId: string): string {
    const syncStatus = this.getSyncStatusText(propertyId);
    const mappingStatus = this.getMappingStatusText(propertyId);
    return `Sync: ${syncStatus}, Mapping: ${mappingStatus}`;
  }

  startStatusPolling(propertyId: string) {
    // Clear any existing polling for this property
    this.stopStatusPolling(propertyId);
    
    // Start polling every 30 seconds (30000ms) for faster updates
    this.statusPollingIntervals[propertyId] = setInterval(() => {
      this.checkPropertyStatus(propertyId);
    }, 5000);
    
    console.log(`Started status polling for property ${propertyId}`);
  }

  stopStatusPolling(propertyId: string) {
    if (this.statusPollingIntervals[propertyId]) {
      clearInterval(this.statusPollingIntervals[propertyId]);
      delete this.statusPollingIntervals[propertyId];
      console.log(`Stopped status polling for property ${propertyId}`);
    }
  }

  checkPropertyStatus(propertyId: string) {
    if (propertyId && this.operatorId) {
      this.propertiesService.getProperty(propertyId, this.operatorId).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            const newSyncStatus = res.data.scraping_status || Status.PENDING;
            const newMappingStatus = res.data.mapping_status || Status.PENDING;
            const oldStatus = this.propertyStatuses[propertyId];
            
            // Update status
            this.propertyStatuses[propertyId] = {
              propertyId: propertyId,
              operatorId: this.operatorId!,
              syncStatus: newSyncStatus,
              mappingStatus: newMappingStatus,
              lastUpdated: new Date()
            };
            
            // Show toast notifications for status changes and stop polling when operations complete
            if (oldStatus) {
              // Show toast if sync status changed
              if (newSyncStatus === Status.COMPLETED && oldStatus.syncStatus !== Status.COMPLETED) {
                this.toastr.success('Sync completed successfully!');
                // Stop polling if sync completed (user can start mapping manually)
                this.stopStatusPolling(propertyId);
                console.log(`Stopped polling for property ${propertyId} - sync completed`);
              } else if (newSyncStatus === Status.FAILED && oldStatus.syncStatus !== Status.FAILED) {
                this.toastr.error('Sync failed. Please try again.');
                this.stopStatusPolling(propertyId); // Stop polling when failed
              }
              
              // Show toast if mapping status changed
              if (newMappingStatus === Status.COMPLETED && oldStatus.mappingStatus !== Status.COMPLETED) {
                this.toastr.success('Mapping completed successfully!');
                // Stop polling when mapping completed
                this.stopStatusPolling(propertyId);
                console.log(`Stopped polling for property ${propertyId} - mapping completed`);
              } else if (newMappingStatus === Status.FAILED && oldStatus.mappingStatus !== Status.FAILED) {
                this.toastr.error('Mapping failed. Please try again.');
                this.stopStatusPolling(propertyId); // Stop polling when failed
              }
            }
            
            // Stop polling when both sync and mapping are completed (additional safety check)
            if (newSyncStatus === Status.COMPLETED && newMappingStatus === Status.COMPLETED) {
              this.toastr.success('All operations completed successfully!');
              this.stopStatusPolling(propertyId);
              console.log(`Stopped polling for property ${propertyId} - both sync and mapping completed`);
            }
            
            console.log(`Status polled for property ${propertyId}: Sync ${oldStatus?.syncStatus} → ${newSyncStatus}, Mapping ${oldStatus?.mappingStatus} → ${newMappingStatus}`);
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
      // Start polling for this property to check status every 30 seconds
      this.startStatusPolling(matchingProperty.id);
    }
  }

  editListing(listing: any) {
    console.log('editListing called with:', listing);
    console.log('listing.property_urls:', listing.property_urls);
    
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
      
      console.log('Form data to patch:', formData);
      
      this.addListingForm.patchValue(formData);
      
      console.log('Form after patch:', this.addListingForm.value);
    } else {
      console.error('Invalid listing object:', listing);
    }
  }

 

  deleteListing(listingId: string) {
    console.log('Attempting to delete listing with ID:', listingId);
    console.log('Operator ID:', this.operatorId);
  
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
              console.log('Delete response:', res);
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
        console.log('Delete action cancelled');
      }
    );
  }



  hasError(controlName: string) {
    const control = this.addListingForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
    console.log('isEdit:', this.isEdit);
    console.log('editingListingId:', this.editingListingId);
    console.log('operatorId:', this.operatorId);
  
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
        console.log('Updating Listing');
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
        console.log('Creating Listing');
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

  // Extract property name from URL
  extractPropertyName(url: string, platform: string): string {
    if (!url) return '-';
    
    try {
      let propertyName = '';
      
      switch (platform.toLowerCase()) {
        case 'booking':
          // Extract from booking.com URLs like: /hotel/ae/breathtaking-views-ocean-heights.html
          const bookingMatch = url.match(/\/hotel\/[^\/]+\/([^\/]+)\.html/);
          if (bookingMatch) {
            propertyName = bookingMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          break;
          
        case 'airbnb':
          // For Airbnb, we'll use a generic name since the URL structure doesn't contain property names
          propertyName = 'Airbnb Listing';
          break;
          
        case 'vrbo':
          // For VRBO, we'll use a generic name
          propertyName = 'VRBO Listing';
          break;
          
        case 'pricelab':
          // For Pricelab, we'll use a generic name
          propertyName = 'Pricelab Listing';
          break;
          
        default:
          propertyName = platform;
      }
      
      return propertyName || platform;
    } catch (error) {
      console.error('Error extracting property name:', error);
      return platform;
    }
  }

  syncListing(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    if (!this.operatorId) {
      console.error('Field required: operator_id');
      this.toastr.error('Operator ID is required');
      return;
    }

    if (!bookingId && !airbnbId && !vrboId && !pricelabsId) {
      this.toastr.error('No valid ID found. Please ensure the listing has at least one platform ID (Booking.com, Airbnb, VRBO, or Pricelabs)');
      return;
    }

    // Find the property ID to update status
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
      // Update status to in_progress
      this.propertyStatuses[matchingProperty.id] = {
        propertyId: matchingProperty.id,
        operatorId: this.operatorId,
        syncStatus: Status.IN_PROGRESS,
        mappingStatus: this.propertyStatuses[matchingProperty.id]?.mappingStatus || Status.PENDING,
        lastUpdated: new Date()
      };
    }

    console.log('Syncing listing with:', {
      operatorId: this.operatorId,
      bookingId: bookingId,
      airbnbId: airbnbId,
      vrboId: vrboId,
      pricelabsId: pricelabsId
    });

     this.listingService.syncListing(this.operatorId, bookingId, airbnbId, vrboId, pricelabsId).subscribe({
       next: (res: any) => {
         console.log('Sync response:', res);
         this.toastr.success(res.data.message || 'Sync started successfully');
         // Start polling for status updates
         this.fetchUpdatedPropertyStatus(bookingId, airbnbId, vrboId, pricelabsId);
       },
       error: (error: any) => {
         console.error('Sync error:', error);
         this.toastr.error('Failed to sync listing: ' + (error.error?.detail || error.message || 'Unknown error'));
         
        // Update status to failed
        if (matchingProperty && matchingProperty.id) {
          this.propertyStatuses[matchingProperty.id] = {
            propertyId: matchingProperty.id,
            operatorId: this.operatorId!,
            syncStatus: Status.FAILED,
            mappingStatus: this.propertyStatuses[matchingProperty.id]?.mappingStatus || Status.PENDING,
            lastUpdated: new Date()
          };
        }
       }
     });
  }

  

  mapListing(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    if (!this.operatorId) {
      console.error('Field required: operator_id');
      this.toastr.error('Operator ID is required');
      return;
    }

    if (!bookingId && !airbnbId && !vrboId && !pricelabsId) {
      this.toastr.error('No valid ID found. Please ensure the listing has at least one platform ID (Booking.com, Airbnb, VRBO, or Pricelabs)');
      return;
    }

    // Find the property ID to update status
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
      // Update status to in_progress
      this.propertyStatuses[matchingProperty.id] = {
        propertyId: matchingProperty.id,
        operatorId: this.operatorId,
        syncStatus: this.propertyStatuses[matchingProperty.id]?.syncStatus || Status.PENDING,
        mappingStatus: Status.IN_PROGRESS,
        lastUpdated: new Date()
      };
    }

    console.log('Mapping listing with:', {
      operatorId: this.operatorId,
      bookingId: bookingId,
      airbnbId: airbnbId,
      vrboId: vrboId,
      pricelabsId: pricelabsId
    });

    this.mapService.mapListing(this.operatorId, bookingId, airbnbId, vrboId, pricelabsId).subscribe({
      next: (res: any) => {
        console.log('Map response:', res);
        this.toastr.success(res.message || 'Mapping started successfully');
        // Start polling for status updates
        this.fetchUpdatedPropertyStatus(bookingId, airbnbId, vrboId, pricelabsId);
      },
      error: (error: any) => {
        console.error('Map error:', error);
        this.toastr.error('Failed to map listing: ' + (error.error?.detail || error.message || 'Unknown error'));
        
        // Update status to failed
        if (matchingProperty && matchingProperty.id) {
          this.propertyStatuses[matchingProperty.id] = {
            propertyId: matchingProperty.id,
            operatorId: this.operatorId!,
            syncStatus: this.propertyStatuses[matchingProperty.id]?.syncStatus || Status.PENDING,
            mappingStatus: Status.FAILED,
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
        console.log('PriceLabs listings:', res);
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
}
