import { Component, ElementRef, ViewChild, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { PropertiesService } from "../_services/properties.service";
import { LocalStorageService } from "../_services/local-storage.service";
import { ToastService } from "../_services/toast.service";
import { EventService } from "../_services/event.service";
import { ListingService } from "../_services/listing.service";

@Component({
  selector: "app-listing",
  standalone: false,
  templateUrl: "./listing.component.html",
  styleUrls: ["./listing.component.scss"],
})
export class ListingComponent implements OnInit {
  @ViewChild("closeButton") closeButton!: ElementRef;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  apiLoading: boolean = false;
  loading: boolean = false;
  allListingList: any[] = [];
  isEdit: boolean = false;
  editingListingId: string | null = null;
  operatorId: string | null = null;
  addListingForm: FormGroup;
  sortOrder: string = 'desc';
  constructor(
    private toastr: ToastrService,
    private fb: FormBuilder,
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private eventService: EventService<any>,
    private listingService: ListingService
  ) {
    this.addListingForm = this.fb.group({
      bookingComUrl: [
        "",
        [Validators.required, Validators.pattern("https?://.+")],
      ],
      airbnbUrl: [""],
      vrboUrl: [""],
    });
  }

  ngOnInit(): void {
    this.operatorId = this.localStorageService.getSelectedOperatorId() || null;
    this.loadListings();
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

  editListing(listing: any) {
    if (listing && listing.id) {
      this.isEdit = true;
      this.editingListingId = listing.id;
      this.addListingForm.patchValue({
        bookingComUrl: listing.property_urls?.Booking || "",
        airbnbUrl: listing.property_urls?.Airbnb || "",
        vrboUrl: listing.property_urls?.VRBO || "",
      });
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
    const { bookingComUrl, airbnbUrl, vrboUrl } = this.addListingForm.value;
    if (!bookingComUrl && !airbnbUrl && !vrboUrl) {
      this.toastr.error("At least one listing URL must be provided.");
      return;
    }
    if (this.addListingForm.valid) {
      this.loading = true;
      const formData = {
        operator_id: this.operatorId,
        Property_URLs: {
          Booking: bookingComUrl,
          Airbnb: airbnbUrl,
          VRBO: vrboUrl,
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
        bookingComUrl: "",
        airbnbUrl: "",
        vrboUrl: "",
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
}
