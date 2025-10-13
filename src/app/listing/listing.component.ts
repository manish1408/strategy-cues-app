import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { PropertiesService } from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { ToastService } from "../_services/toast.service";
import { EventService } from "../_services/event.service";
import { ListingService } from "../_services/listing.service";
import { ActivatedRoute } from "@angular/router";
import { PricelabsService } from "../_services/pricelabs.service";
import { CompetitorPropertiesService } from "../_services/competitor-properties.service";
import { Status, PropertyStatus } from "../_models/status.model";

@Component({
  selector: "app-listing",
  standalone: false,
  templateUrl: "./listing.component.html",
  styleUrls: ["./listing.component.scss"],
})
export class ListingComponent implements OnInit, OnDestroy {
  @ViewChild("closeButton") closeButton!: ElementRef;
  @ViewChild("fileInput") fileInput!: ElementRef;

  // Pagination and infinite scroll properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;
  
  // Loading states
  apiLoading: boolean = false;
  syncPriceLabsLoading: boolean = false;
  loading: boolean = false;
  loadingCompetitors: boolean = false;
  uploadingFile: boolean = false;
  
  // Data
  allListingList: any[] = [];
  isEdit: boolean = false;
  editingListingId: string | null = null;
  operatorId: string | null = null;
  addListingForm: FormGroup;
  sortOrder: string = 'desc';
  
  // Search
  searchTerm: string = '';
  bookingComId: string | null = null;
  airbnbId: string | null = null;
  vrboId: string | null = null;
  pricelab: string | null = null;
  savingCompetitor: boolean = false;
  competitorIds: string[] = [];
  // Keep original snapshots of prefilled competitors to verify before delete
  private competitorOriginalById: { [id: string]: { bookingComId: string; bookingComUrl: string; airbnbId: string; airbnbUrl: string; vrboId: string; vrboUrl: string; } } = {};
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
    private pricelabsService: PricelabsService,
    private competitorPropertiesService: CompetitorPropertiesService
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
      competitors: this.fb.array([])
    });
  }

  // Getter for competitors form array
  get competitorsFormArray(): FormArray {
    return this.addListingForm.get('competitors') as FormArray;
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
    // Only set main loading state for first page load, not for infinite scroll
    if (this.currentPage === 1) {
      this.apiLoading = true;
    }
   
    this.listingService.getListings(this.currentPage, this.itemsPerPage, this.operatorId || '', this.sortOrder)
  .subscribe({
    next: (res: any) => {
      if (res.success) {
        // Ensure properties is an array
        if (Array.isArray(res.data.properties)) {
          const newListings = res.data.properties.map((listing: any) => ({
            id: listing.id,
            urls: {
              BookingId: listing.urls?.BookingId,
              BookingUrl: listing.urls?.BookingUrl,
              AirbnbId: listing.urls?.AirbnbId,
              AirbnbUrl: listing.urls?.AirbnbUrl,
              VRBOId: listing.urls?.VRBOId,
              VRBOUrl: listing.urls?.VRBOUrl,
              PricelabsId: listing.urls?.PricelabsId,
              PricelabsUrl: listing.urls?.PricelabsUrl,
              status: listing.urls?.status,
              PropertyName: listing.urls?.PropertyName,
              Photos: listing.urls?.Photos
            }
          }));
          
          // For infinite scroll: append data instead of replacing
          if (this.currentPage === 1) {
            this.allListingList = newListings;
          } else {
            this.allListingList = [...this.allListingList, ...newListings];
          }
          
          // Initialize property statuses from the main API response
          this.initializePropertyStatuses(res.data.properties);
        }

        // Update pagination data
        this.totalPages = res.data.pagination.total_pages;
        this.totalItems = res.data.pagination.total || 0;
        this.currentPage = res.data.pagination.page;
        this.itemsPerPage = res.data.pagination.limit;
        this.hasMoreData = this.currentPage < this.totalPages;
      } else {
        this.toastr.error(res.message || 'Failed to load listings');
      }
      this.apiLoading = false;
      this.isLoadingMore = false;
    },
    error: (error: any) => {
      this.toastr.error('Error loading listings. Please try again.');
      this.apiLoading = false;
      this.isLoadingMore = false;
    }
  });
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
        }
      });
    }
  }

  fetchUpdatedPropertyStatus(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    // Find the property that matches the provided IDs
    const matchingProperty = this.allListingList.find((listing: any) => {
      const listingBookingId = listing?.urls?.BookingId;
      const listingAirbnbId = listing?.urls?.AirbnbId;
      const listingVrboId = listing?.urls?.VRBOId;
      const listingPricelabId = listing?.urls?.PricelabsId;
      
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
          url: listing.urls?.BookingUrl || "",
          id: listing.urls?.BookingId || "",
        },
        airbnb: {
          url: listing.urls?.AirbnbUrl || "",
          id: listing.urls?.AirbnbId || "",
        },
        vrbo: {
          url: listing.urls?.VRBOUrl || "",
          id: listing.urls?.VRBOId || "",
        },
        pricelab: {
          url: listing.urls?.PricelabsUrl || "",
          id: listing.urls?.PricelabsId || "",
        },
      };
      
      
      this.addListingForm.patchValue(formData);
      
      // Clear competitors array
      while (this.competitorsFormArray.length !== 0) {
        this.competitorsFormArray.removeAt(0);
      }
      this.competitorIds = [];
      
      // Fetch existing competitor data
      this.loadCompetitorData(listing.id);
      
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
      
      // First, create any new competitors
      this.createNewCompetitors().then(() => {
        // Then update/create the listing
        this.saveListing(bookingCom, airbnb, vrbo, pricelab);
      }).catch((error) => {
        this.toastr.error("Failed to create competitors");
        this.loading = false;
      });
    }
  }

  private async createNewCompetitors(): Promise<void> {
    const newCompetitors = this.getNewCompetitors();
    
    if (newCompetitors.length === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.competitorPropertiesService.createCompetitorProperty(newCompetitors).subscribe({
        next: (response: any) => {
          
          // Update competitor IDs with the new ones from API
          if (response.data && response.data.ids && response.data.ids.length > 0) {
            let newIdIndex = 0;
            for (let i = 0; i < this.competitorIds.length; i++) {
              if (this.competitorIds[i] && this.competitorIds[i].startsWith('temp_')) {
                this.competitorIds[i] = response.data.ids[newIdIndex];
                newIdIndex++;
              }
            }
          }
          
          resolve();
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  private getNewCompetitors(): any[] {
    const newCompetitors: any[] = [];
    
    for (let i = 0; i < this.competitorsFormArray.length; i++) {
      const form = this.competitorsFormArray.at(i);
      const competitorId = this.competitorIds[i];
      
      // Check if this is a new competitor (no ID or has temp ID)
      if (!competitorId || competitorId.startsWith('temp_')) {
        const bookingId = form.get('bookingComId')?.value || "";
        const airbnbId = form.get('airbnbId')?.value || "";
        const vrboId = form.get('vrboId')?.value || "";
        const bookingLink = form.get('bookingComUrl')?.value || "";
        const airbnbLink = form.get('airbnbUrl')?.value || "";
        const vrboLink = form.get('vrboUrl')?.value || "";
        
        // Only create competitor if at least one field has data
        if (bookingId || airbnbId || vrboId || bookingLink || airbnbLink || vrboLink) {
          const competitorData = {
            operatorId: this.operatorId,
            bookingId: bookingId,
            airbnbId: airbnbId,
            vrboId: vrboId,
            bookingLink: bookingLink,
            airbnbLink: airbnbLink,
            vrboLink: vrboLink,
            status: "pending"
          };
          
          newCompetitors.push(competitorData);
          
          // Assign temp ID if not already assigned
          if (!competitorId) {
            this.competitorIds[i] = 'temp_' + Date.now() + '_' + i;
          }
        }
      }
    }
    
    return newCompetitors;
  }

  private saveListing(bookingCom: any, airbnb: any, vrbo: any, pricelab: any): void {
    // For existing listings, only send newly created competitor IDs
    // For new listings, send all competitor IDs
    let competitorIdsToSend: string[] = [];
    
    if (this.isEdit && this.editingListingId) {
      // When editing, only send newly created competitors (those that were created in this session)
      competitorIdsToSend = this.competitorIds.filter(id => 
        id && !id.startsWith('temp_') && !this.competitorOriginalById[id]
      );
    } else {
      // When creating new listing, send all competitor IDs
      competitorIdsToSend = this.competitorIds.filter(id => id && !id.startsWith('temp_'));
    }


    const formData = {
      operator_id: this.operatorId,
      BookingId: bookingCom.id || '',
      BookingUrl: bookingCom.url || '',
      AirbnbId: airbnb.id || '',
      AirbnbUrl: airbnb.url || '',
      VRBOId: vrbo.id || '',
      VRBOUrl: vrbo.url || '',
      PricelabsId: pricelab.id || '',
      PricelabsUrl: pricelab.url || '',
      competitorIds: competitorIdsToSend,
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
            this.toastr.error("Failed to create listing");
          },
        });
    }
  }

  resetForm() {
    this.addListingForm.reset();
    this.addListingForm.patchValue({
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
    });
    
    // Clear competitors array and add one initial competitor
    while (this.competitorsFormArray.length !== 0) {
      this.competitorsFormArray.removeAt(0);
    }
    // Add one initial blank competitor form (without saving)
    this.addBlankCompetitorForm();
    this.competitorIds = [];
    this.competitorOriginalById = {};
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

 
  // Infinite scroll methods
  loadMoreData(): void {
    if (this.hasMoreData && !this.isLoadingMore && !this.apiLoading) {
      this.isLoadingMore = true;
      this.currentPage++;
      this.loadListings();
    }
  }

  // Scroll event handler for infinite scroll
  onScroll(event: any): void {
    try {
      const element = event.target;
      const threshold = 50; // pixels from bottom
      
      // Check if element has valid scroll properties
      if (element && element.scrollTop !== undefined && element.clientHeight && element.scrollHeight) {
        if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
          this.loadMoreData();
        }
      }
    } catch (error) {
      console.error('Scroll event error:', error);
    }
  }

  // Search functionality
  performSearch(): void {
    // Reset to first page
    this.currentPage = 1;
    this.hasMoreData = true;
    
    if (this.searchTerm && this.searchTerm.trim()) {
      // Use search API if search term exists
      this.apiLoading = true;
      this.propertiesService.searchProperties(this.searchTerm.trim(), this.operatorId || '')
        .subscribe({
          next: (response: any) => {
            if (response.success && response.data && response.data.properties) {
              // Map search results to listing format
              this.allListingList = response.data.properties.map((listing: any) => ({
                id: listing._id || listing.id,
                urls: {
                  BookingId: listing.BookingId || listing.urls?.BookingId,
                  BookingUrl: listing.BookingUrl || listing.urls?.BookingUrl,
                  AirbnbId: listing.AirbnbId || listing.urls?.AirbnbId,
                  AirbnbUrl: listing.AirbnbUrl || listing.urls?.AirbnbUrl,
                  VRBOId: listing.VRBOId || listing.urls?.VRBOId,
                  VRBOUrl: listing.VRBOUrl || listing.urls?.VRBOUrl,
                  PricelabsId: listing.PricelabsId || listing.urls?.PricelabsId,
                  PricelabsUrl: listing.PricelabsUrl || listing.urls?.PricelabsUrl,
                  status: listing.status || listing.urls?.status,
                  PropertyName: listing.Listing_Name || listing.PropertyName || listing.urls?.PropertyName,
                  Photos: listing.Photos || listing.urls?.Photos
                }
              }));
              
              // Initialize property statuses for search results
              this.initializePropertyStatuses(response.data.properties);
              
              // Disable infinite scroll for search results
              this.hasMoreData = false;
              this.totalItems = this.allListingList.length;
              this.totalPages = 1;
            } else {
              this.allListingList = [];
              this.toastr.info('No listings found matching your search');
            }
            this.apiLoading = false;
          },
          error: (error: any) => {
            this.toastr.error('Error searching listings. Please try again.');
            this.apiLoading = false;
          }
        });
    } else {
      // If search term is empty, reload all data
      this.loadListings();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.performSearch();
  }

  scrapeAndMapListing(bookingId: string, airbnbId: string, vrboId: string, pricelabsId: string) {
    if (!this.operatorId) {
      this.toastr.error('Operator ID is required');
      return;
    }

    if (!bookingId && !airbnbId && !vrboId && !pricelabsId) {
      this.toastr.error('No valid ID found. Please ensure the listing has at least one platform ID (Booking.com, Airbnb, VRBO, or Pricelabs)');
      return;
    }

    // Find the property ID for error handling
    const matchingProperty = this.allListingList.find((listing: any) => {
      const listingBookingId = listing?.urls?.BookingId;
      const listingAirbnbId = listing?.urls?.AirbnbId;
      const listingVrboId = listing?.urls?.VRBOId;
      const listingPricelabId = listing?.urls?.PricelabsId;
      
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

  // Competitor management methods
  addCompetitor(): void {
    // Simply add a new blank competitor form
    this.addBlankCompetitorForm();
    
    this.toastr.success('New competitor form added. Fill the details and click Update to save.');
  }

  deleteCompetitor(index: number): void {
    // Validate index
    if (index < 0 || index >= this.competitorsFormArray.length) {
      console.error('Invalid competitor index:', index);
      return;
    }

    // Check if this competitor has been saved (has an ID)
    const competitorId = this.competitorIds[index];
    const form = this.competitorsFormArray.at(index);
    const isDisabled = form?.disabled || false;
    
    
    // Check if it's a temporary ID (not yet saved to API)
    const isTemporaryId = competitorId && competitorId.startsWith('temp_');
    
    if (isTemporaryId) {
      // Just remove from form array if it's a temporary competitor
      this.competitorIds.splice(index, 1);
      this.competitorsFormArray.removeAt(index);
      this.toastr.success('Competitor removed from list');
    } else if (competitorId && !isTemporaryId) {
      // Verify current form content matches original snapshot before delete
      const original = this.competitorOriginalById[competitorId];
      if (original) {
        const current = {
          bookingComId: form.get('bookingComId')?.value || '',
          bookingComUrl: form.get('bookingComUrl')?.value || '',
          airbnbId: form.get('airbnbId')?.value || '',
          airbnbUrl: form.get('airbnbUrl')?.value || '',
          vrboId: form.get('vrboId')?.value || '',
          vrboUrl: form.get('vrboUrl')?.value || ''
        };
        const matches = JSON.stringify(original) === JSON.stringify(current);
        if (!matches) {
          this.toastr.warning('Competitor details changed. Revert changes or save before deleting.');
          return;
        }
      }
      // Show loading state
      this.toastr.info('Deleting competitor...');
      
      // Call delete API if competitor was saved to the server (prefilled competitors)
      this.competitorPropertiesService.deleteCompetitorProperty(competitorId).subscribe({
        next: (response: any) => {
          this.toastr.success('Competitor deleted successfully');
          
          // Remove from competitorIds array
          this.competitorIds.splice(index, 1);
          delete this.competitorOriginalById[competitorId];
          
          // Remove from form array
          this.competitorsFormArray.removeAt(index);
          
          // Reload the listing to refresh the data
          this.loadListings();
        },
        error: (error: any) => {
          console.error('Error deleting competitor:', error);
          const errorMessage = error?.error?.detail?.error || error?.message || 'Failed to delete competitor';
          this.toastr.error(errorMessage);
        }
      });
    } else {
      // Just remove from form array if not saved yet (no ID at all)
      this.competitorsFormArray.removeAt(index);
      this.competitorIds.splice(index, 1);
      this.toastr.success('Competitor removed from list');
    }
  }


  // Check if a competitor at given index has been saved
  isCompetitorSaved(index: number): boolean {
    const form = this.competitorsFormArray.at(index);
    const isDisabled = form?.disabled || false;
    const hasId = !!this.competitorIds[index];
    
    
    // A competitor is saved if the form is disabled OR if it has an ID
    return isDisabled || hasId;
  }


  // Add blank competitor form without saving
  addBlankCompetitorForm(): void {
    const competitorForm = this.createCompetitorForm();
    this.competitorsFormArray.push(competitorForm);
  }

  // Load competitor data from API
  loadCompetitorData(listingId: string): void {
    if (!this.operatorId) {
      console.error('Operator ID not available');
      return;
    }

    this.loadingCompetitors = true;
    this.competitorPropertiesService.getCompetitorProperties(listingId).subscribe({
      next: (response: any) => {
        
        // Check if response has data.competitors array
        const competitors = response?.data?.competitors || response?.competitors || response;
        
        if (competitors && competitors.length > 0) {
          // Populate forms with existing competitor data
          competitors.forEach((competitor: any, index: number) => {
            const competitorForm = this.createCompetitorForm();
            const formData = {
              bookingComId: competitor.bookingId || '',
              bookingComUrl: competitor.bookingLink || '',
              airbnbId: competitor.airbnbId || '',
              airbnbUrl: competitor.airbnbLink || '',
              vrboId: competitor.vrboId || '',
              vrboUrl: competitor.vrboLink || ''
            };
            competitorForm.patchValue(formData);
            
            // Disable the form since it's already saved
            competitorForm.disable();
            
            this.competitorsFormArray.push(competitorForm);
            this.competitorIds.push(competitor.id);
            // Save original snapshot for verification on delete
            if (competitor?.id) {
              this.competitorOriginalById[competitor.id] = { ...formData };
            }
          });
          
          // Always add a blank form after loading existing competitors
          this.addBlankCompetitorForm();
        } else {
          // No existing competitors, add one blank form
          this.addBlankCompetitorForm();
        }
        this.loadingCompetitors = false;
      },
      error: (error: any) => {
        console.error('Error loading competitor data:', error);
        // On error, still add one blank form
        this.addBlankCompetitorForm();
        this.loadingCompetitors = false;
      }
    });
  }

  createCompetitorForm(): FormGroup {
    return this.fb.group({
      bookingComId: [''],
      bookingComUrl: [''],
      airbnbId: [''],
      airbnbUrl: [''],
      vrboId: [''],
      vrboUrl: ['']
    });
  }

  // Check if a competitor with the same IDs already exists
  private checkForExistingCompetitor(bookingId: string, airbnbId: string, vrboId: string): boolean {
    // Check if any of the IDs are already in the competitorIds array
    // This is a simple check - in a real scenario, you might want to check against
    // the actual competitor data to see if the same IDs exist
    return this.competitorIds.some(id => id && id !== 'temp_' + Date.now());
  }

  // Check if the form has any data that could create a duplicate
  private hasDuplicateData(bookingId: string, airbnbId: string, vrboId: string): boolean {
    // If all fields are empty, no duplicate possible
    if (!bookingId && !airbnbId && !vrboId) {
      return false;
    }
    
    // Check if we already have competitors with these IDs
    // This is a basic check - you might want to enhance this based on your data structure
    return this.competitorIds.length > 0;
  }

  // Upload Excel file for listings
  uploadListings(): void {
    // Trigger the hidden file input
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const validExtensions = ['xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      this.toastr.error('Please upload a valid Excel file (.xlsx or .xls)');
      // Reset file input
      this.fileInput.nativeElement.value = '';
      return;
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.toastr.error('File size should not exceed 10MB');
      // Reset file input
      this.fileInput.nativeElement.value = '';
      return;
    }

    if (!this.operatorId) {
      this.toastr.error('Operator ID is required to upload listings');
      // Reset file input
      this.fileInput.nativeElement.value = '';
      return;
    }

    // Upload the file
    this.uploadingFile = true;
    this.listingService.uploadExcelForListing(file, this.operatorId).pipe(
      finalize(() => {
        this.uploadingFile = false;
        // Reset file input
        this.fileInput.nativeElement.value = '';
      })
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success(response.message || 'Listings uploaded successfully');
          // Reload listings to show the newly uploaded data
          this.currentPage = 1;
          this.loadListings();
        } else {
          this.toastr.error(response.message || 'Failed to upload listings');
        }
      },
      error: (error: any) => {
        console.error('Upload error:', error);
        const errorMessage = error?.error?.detail || error?.error?.message || error?.message || 'Failed to upload Excel file';
        this.toastr.error(errorMessage);
      }
    });
  }

}
