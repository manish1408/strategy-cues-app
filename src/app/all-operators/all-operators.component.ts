import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OperatorService } from '../_services/operator.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { ToastService } from '../_services/toast.service';

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

  constructor(
    private operatorService: OperatorService, 
    private toastr: ToastrService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.addOperatorForm = this.fb.group({
      name: ['', Validators.required],
      priceLabsApiKey: [''],
      bookingUsername: [''],
      bookingPassword: [''],
      airbnbUsername: [''],
      airbnbPassword: [''],
      vrboUsername: [''],
      vrboPassword: ['']
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
          this.allOperatorList = res.data?.operators || [];
        },
        error: (error: any) => {
          console.error('Error loading operators:', error);
          this.toastr.error('Failed to load operators');
        }
      });
  }

  editOperator(operator: any) {
    this.isEdit = true;
    this.editingOperatorId = operator._id;
    this.addOperatorForm.patchValue({
      name: operator.name,
      priceLabsApiKey: operator.priceLabsApiKey || '',
      bookingUsername: operator.bookingUsername || '',
      bookingPassword: operator.bookingPassword || '',
      airbnbUsername: operator.airbnbUsername || '',
      airbnbPassword: operator.airbnbPassword || '',
      vrboUsername: operator.vrboUsername || '',
      vrboPassword: operator.vrboPassword || ''
    });
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
              if (res.result) {
                this.toastr.success('Operator Deleted Successfully');
                this.loadOperators();
              } else {
                this.toastr.error(res.msg);
              }
            },
            error: (err) => {
              console.log(err);
              this.toastr.error(err.error.msg);
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
    this.addOperatorForm.markAllAsTouched();
    if (this.addOperatorForm.valid) {
      this.loading = true;
      const formData = this.addOperatorForm.value;
      
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
