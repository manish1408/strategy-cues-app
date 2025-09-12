import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OperatorService } from '../_services/operator.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { ToastService } from '../_services/toast.service';
import { EventService } from '../_services/event.service';

@Component({
  selector: 'app-all-operators',
  templateUrl: './all-operators.component.html',
  styleUrl: './all-operators.component.scss'
})
export class AllOperatorsComponent {
  @ViewChild('closeButton') closeButton!: ElementRef;
  
  apiLoading: boolean = false;
  loading: boolean = false;
  allOperatorList: any[] = [];
  isEdit: boolean = false;
  editingOperatorId: string | null = null;
  
  addOperatorForm: FormGroup;
  showPassword: boolean = false;
  activeTab: string = 'pricelabs';

  constructor(
    private operatorService: OperatorService, 
    private toastr: ToastrService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private eventService: EventService<any>
  ) {
    this.addOperatorForm = this.fb.group({
      name: ['', Validators.required],
      priceLabs: this.fb.group({
        userName: '',
        password: '',
        apiKey: '',
        status: 'PENDING',
        cookies: this.fb.array([]),
      }),
      booking: this.fb.group({
        userName: '',
        password: '',
        apiKey: '',
        status: 'PENDING',
        cookies: this.fb.array([]),
        session_id: '',
      }),
      airbnb: this.fb.group({
        userName: '',
        password: '',
        apiKey: '',
        status: 'PENDING',
        cookies: this.fb.array([]),
      }),
      vrbo: this.fb.group({
        userName: '',
        password: '',
        apiKey: '',
        status: 'PENDING',
        cookies: this.fb.array([]),
      })
    });
  }

  ngOnInit() {
    this.loadOperators();
  }

  loadOperators() {
    this.apiLoading = true;
    this.operatorService.getAllOperator()
      .pipe(finalize(() => this.apiLoading = false))
      .subscribe({
        next: (res: any) => {
          console.log('Operators loaded:', res);
          this.allOperatorList = res.data?.operators.map((operator: any) => ({
            _id: operator._id,
            name: operator.name,
            priceLabs: {
              userName: operator.priceLabs?.userName || '',
              password: operator.priceLabs?.password || '',
              apiKey: operator.priceLabs?.apiKey || '',
              status: operator.priceLabs?.status || 'PENDING',
              cookies: operator.priceLabs?.cookies || [],
            },
            booking: {
              userName: operator.booking?.userName || '',
              password: operator.booking?.password || '',
              apiKey: operator.booking?.apiKey || '',
              status: operator.booking?.status || 'PENDING',
              cookies: operator.booking?.cookies || [],
              session_id: operator.booking?.session_id || '',
            },
            airbnb: {
              userName: operator.airbnb?.userName || '',
              password: operator.airbnb?.password || '',
              apiKey: operator.airbnb?.apiKey || '',
              status: operator.airbnb?.status || 'PENDING',
              cookies: operator.airbnb?.cookies || [],
            },
            vrbo: {
              userName: operator.vrbo?.userName || '',
              password: operator.vrbo?.password || '',
              apiKey: operator.vrbo?.apiKey || '',
              status: operator.vrbo?.status || 'PENDING',
              cookies: operator.vrbo?.cookies || [],
            }
          })) || [];
          console.log('allOperatorList after assignment:', this.allOperatorList);
          console.log('allOperatorList length:', this.allOperatorList.length);
        },
        error: (error: any) => {
          console.error('Error loading operators:', error);
          this.toastr.error('Failed to load operators');
        }
      });
  }

  editOperator(operator: any) {
    if (operator && operator._id) {
    console.log('Editing Operator:', operator);
    this.isEdit = true;
    this.editingOperatorId = operator._id;
    console.log('Editing Operator ID:', this.editingOperatorId);
    this.addOperatorForm.patchValue({
      name: operator.name,

      priceLabs: {
        userName: operator.priceLabs?.userName || '',
        password: operator.priceLabs?.password || '',
        apiKey: operator.priceLabs?.apiKey || '',
      },
      booking: {
        userName: operator.booking?.userName || '',
        password: operator.booking?.password || '',
      },
      airbnb: {
        userName: operator.airbnb?.userName || '',
        password: operator.airbnb?.password || '',
      },
      vrbo: {
        userName: operator.vrbo?.userName || '',
        password: operator.vrbo?.password || '',
      }
    });
  } else {
    console.error('Invalid operator object:', operator);
    }
  }

  
  deleteOperator(operatorId: string) {
    this.toastService.showConfirm(
      'Are you sure?',
      'Delete the selected operator?',
      'Yes, delete it!',
      'No, cancel',
      () => {
        this.operatorService
          .deleteOperator(operatorId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success('Operator Deleted Successfully');
                this.loadOperators();
                // Dispatch event to update app component dropdown
                this.eventService.dispatchEvent({ type: 'OPERATORS_UPDATED' });
              } else {
                this.toastr.error(res.detail);
              }
            },
            error: (err) => {
              console.log(err);
              this.toastr.error(err.error.detail);
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  hasError(controlName: string) {
    const control = this.addOperatorForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
    console.log('Form Data:', this.addOperatorForm.value);
    this.addOperatorForm.markAllAsTouched();
    if (this.addOperatorForm.valid) {
      this.loading = true;
      const formData = this.addOperatorForm.value;
      console.log('Form Data:', formData);
      if (this.isEdit && this.editingOperatorId) {
        // Update existing operator
        this.operatorService.updateOperator(formData, this.editingOperatorId)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (res: any) => {
              this.toastr.success('Operator updated successfully');
              this.loadOperators(); // Reload the list
              this.resetForm();
              this.closeModal();
              // Dispatch event to update app component dropdown
              this.eventService.dispatchEvent({ type: 'OPERATORS_UPDATED' });
            },
            error: (error: any) => {
              console.error('Error updating operator:', error);
              this.toastr.error('Failed to update operator');
            }
          });
      } else {
        // Create new operator
        this.operatorService.createOperator(formData)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (res: any) => {
              this.toastr.success('Operator created successfully');
              this.loadOperators(); // Reload the list
              this.resetForm();
              this.closeModal();
              // Dispatch event to update app component dropdown
              this.eventService.dispatchEvent({ type: 'OPERATORS_UPDATED' });
            },
            error: (error: any) => {
              console.error('Error creating operator:', error);
              this.toastr.error('Failed to create operator');
            }
          });
      }
    }
  }

  resetForm() {
    this.addOperatorForm.reset();
    this.isEdit = false;
    this.editingOperatorId = null;
    this.showPassword = false;
    this.activeTab = 'pricelabs';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  closeModal() {
    // Close the modal using Bootstrap's modal API
    const modalElement = document.getElementById('addOperator');
    if (modalElement) {
      const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        // Fallback: trigger the close button click
        const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  }
}
