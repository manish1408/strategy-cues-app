import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { PropertiesService } from '../_services/properties.service';
import { LocalStorageService } from '../_services/local-storage.service';

@Component({
  selector: 'app-listing',
  standalone: false,
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss']
})
export class ListingComponent implements OnInit {
  @ViewChild('closeButton') closeButton!: ElementRef;
  
  apiLoading: boolean = false;
  loading: boolean = false;
  allListingList: any[] = [];
  isEdit: boolean = false;
  editingListingId: string | null = null;
  operatorId: string = '';
  addListingForm: FormGroup;

  constructor(
    private toastr: ToastrService,
    private fb: FormBuilder,
    private propertiesService: PropertiesService,
    private localStorageService: LocalStorageService
  ) {
    this.addListingForm = this.fb.group({
      name: ['', Validators.required],
      location: [''],
      description: [''],
      price: [''],
      status: ['active'],
      bookingCom: [false],
      airbnb: [false],
      vrbo: [false]
    });
  }

  ngOnInit(): void {
    this.operatorId = ""; 
    this.loadListings();
  }
  // getOperatorId(): void {
  //   try {
  //     const selectedOperator = this.localStorageService.getItem('selectedOperator');
  //     if (selectedOperator) {
  //       const operator = JSON.parse(selectedOperator);
  //       this.operatorId = operator._id || '';
  //       console.log('Operator ID from localStorage:', this.operatorId);
  //     } else {
  //       console.warn('No selected operator found in localStorage');
  //       this.toastr.warning('No operator selected. Please select an operator first.');
  //     }
  //   } catch (error) {
  //     console.error('Error getting operator ID from localStorage:', error);
  //     this.toastr.error('Error getting operator information');
  //   }
  // }

  loadListings() {
    this.apiLoading = true;
   
      this.propertiesService.getProperties().subscribe((res: any) => {
      console.log(res);
      this.allListingList = res;
      this.apiLoading = false;
    }, (err: any) => {
      this.apiLoading = false;
      console.log(err?.error?.detail);
      this.toastr.error('Error loading listings');
    });
    
  } 
  

  editListing(listing: any) {
    this.isEdit = true;
    this.editingListingId = listing._id;
    this.addListingForm.patchValue({
      name: listing.name,
      location: listing.location || '',
      description: listing.description || '',
      price: listing.price || '',
      status: listing.status || 'active',
      bookingCom: listing.bookingCom || false,
      airbnb: listing.airbnb || false,
      vrbo: listing.vrbo || false
    });
  }

  deleteListing(listingId: string) {
    if (confirm('Are you sure you want to delete this listing?')) {
      this.loading = true;
      this.propertiesService.deleteProperty(listingId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res: any) => {
            this.toastr.success('Listing deleted successfully');
            this.loadListings();
          },
          error: (error: any) => {
            console.error('Error deleting listing:', error);
            this.toastr.error('Failed to delete listing');
          }
        });
    }
  }

  hasError(controlName: string) {
    const control = this.addListingForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
    this.addListingForm.markAllAsTouched();
    if (this.addListingForm.valid) {
      this.loading = true;
      const formData = {
        ...this.addListingForm.value,
        operatorId: this.operatorId // Will be empty string ""
      };
      
      if (this.isEdit && this.editingListingId) {
        // Update existing listing
        this.propertiesService.updateProperty(formData, this.editingListingId)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (res: any) => {
              this.toastr.success('Listing updated successfully');
              this.loadListings();
              this.resetForm();
              this.closeModal();
            },
            error: (error: any) => {
              console.error('Error updating listing:', error);
              this.toastr.error('Failed to update listing');
            }
          });
      } else {
        // Create new listing
        this.propertiesService.createProperty(formData)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (res: any) => {
              this.toastr.success('Listing created successfully');
              this.loadListings();
              this.resetForm();
              this.closeModal();
            },
            error: (error: any) => {
              console.error('Error creating listing:', error);
              this.toastr.error('Failed to create listing');
            }
          });
      }
    }
  }

  resetForm() {
    this.addListingForm.reset();
    this.addListingForm.patchValue({
      status: 'active',
      bookingCom: false,
      airbnb: false,
      vrbo: false
    });
    this.isEdit = false;
    this.editingListingId = null;
  }

  closeModal() {
    const modalElement = document.getElementById('addListing');
    if (modalElement) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }
}
