import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { finalize } from "rxjs";
import { ToastService } from "../_services/toast.service";
import { AuthenticationService } from "../_services/authentication.service";
import { CommonService } from "../_services/common.service";

@Component({
  selector: "app-all-users",
  templateUrl: "./all-users.component.html",
  styleUrl: "./all-users.component.scss",
})
export class AllUsersComponent {
  @ViewChild("closeButton") closeButton!: ElementRef;

  apiLoading: boolean = false;
  loading: boolean = false;
  allUsersList: any[] = [];
  isEdit: boolean = false;
  editingUserId: string | null = null;
  addUserForm: FormGroup;
  showPassword: boolean = false;
  
  // File upload properties
  imgFiles: any[] = [];
  imageTypes = ['jpeg', 'webp', 'jpg', 'png'];
  allowedMimes = ['image/jpeg', 'image/webp','image/jpg','image/png'];
  maxSize = 3 * 1024 * 1024;
  profileImage = 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
  

  constructor(
    private authService: AuthenticationService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private commonService: CommonService
  ) {
    this.addUserForm = this.fb.group({
      fullName: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      phone: ["", [Validators.required, Validators.pattern(/^\+?1?\d{9,15}$/)]],
      address: [""],
      city: [""],
      country: [""],
      zip: [""],
      profilePicture: [""],
    });
  }

  ngOnInit() {
    this.loadUsers();

    // Ensure proper modal accessibility
    this.setupModalAccessibility();
  }

  setupModalAccessibility() {
    // Wait for the modal element to be available
    setTimeout(() => {
      const modalElement = document.getElementById("addUser");
      if (modalElement) {
        // Listen for modal show/hide events to manage aria-hidden
        modalElement.addEventListener('show.bs.modal', () => {
          modalElement.setAttribute('aria-hidden', 'false');
        });
        
        modalElement.addEventListener('hide.bs.modal', () => {
          modalElement.setAttribute('aria-hidden', 'true');
        });
      }
    }, 100);
  }

  loadUsers() {
    this.apiLoading = true;
    this.authService
      .getUsersByAdmin()
      .pipe(finalize(() => (this.apiLoading = false)))
      .subscribe({
        next: (res: any) => {
          this.allUsersList = res.data?.users || [];
        },
        error: (error: any) => {
          this.toastr.error("Failed to load users");
          console.error("Error loading users:", error);
        },
      });
  }

  editUser(user: any) {
    if (user && (user._id || user.id)) {
      this.isEdit = true;
      this.editingUserId = user._id || user.id;
      this.addUserForm.patchValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        zip: user.zip || "",
        profilePicture: user.profilePicture || "",
      });
      
      // Set profile image for preview
      this.profileImage = user.profilePicture || this.profileImage;
      
      
      // Remove password requirement when editing
      this.addUserForm.get("password")?.clearValidators();
      this.addUserForm.get("password")?.updateValueAndValidity();
    } else {
      console.error("Invalid user object:", user);
    }
  }

  deleteUser(userId: string) {
    this.toastService.showConfirm(
      "Are you sure?",
      "Delete the selected user?",
      "Yes, delete it!",
      "No, cancel",
      () => {
        this.authService
          .deleteUser(userId)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: (res: any) => {
              if (res.success) {
                this.toastr.success("User Deleted Successfully");
                this.loadUsers();
              } else {
                this.toastr.error(res.detail || "Failed to delete user");
              }
            },
            error: (err: any) => {
              this.toastr.error(err.error?.detail || "Failed to delete user");
            },
          });
      },
      () => {
        // Cancel callback
      }
    );
  }

  hasError(controlName: string) {
    const control = this.addUserForm.get(controlName);
    return control?.invalid && control?.touched;
  }

  onSubmit() {
    this.addUserForm.markAllAsTouched();
    if (this.addUserForm.valid) {
      this.loading = true;
      
      // Handle file upload first if there are files
      if (this.imgFiles.length > 0) {
        this.uploadProfileImage();
      } else {
        this.saveUserDetails();
      }
    }
  }

  uploadProfileImage() {
    const filesToAdd = this.imgFiles.filter((file) => file);
    let fd = new FormData();
    
    filesToAdd.forEach((f) => {
      fd.append('file', f.file);
    });
    
    // Add userId for existing users
    if (this.isEdit && this.editingUserId) {
      fd.append('userId', this.editingUserId);
    }
    
    this.commonService
      .uploadFile(fd)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          if (res?.success && res?.data) {
            const fileUrl = res.data;
            if (fileUrl) {
              this.profileImage = fileUrl;
              this.saveUserDetails();
            } else {
              this.saveUserDetails();
            }
          } else {
            console.error('Upload failed:', res);
            this.toastr.error('Failed to upload profile image: ' + (res?.error || 'Unknown error'));
            this.loading = false;
          }
        },
        error: (err: any) => {
          console.error('File upload error:', err);
          this.toastr.error('Error uploading profile image: ' + (err.error?.message || err.message || 'Unknown error'));
          this.loading = false;
        }
      });
  }

  saveUserDetails() {
    const formData = this.addUserForm.value;
    
    // Use the uploaded profile image or form value
    const reqObj: any = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      zip: formData.zip,
      profilePicture: this.profileImage !== 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp' 
        ? this.profileImage 
        : (formData.profilePicture || ''),
    };

    // Include password for new users only
    if (!this.isEdit && formData.password) {
      reqObj.password = formData.password;
    }

    // Remove empty fields
    if (!reqObj.address || reqObj.address.trim() === '') {
      delete reqObj.address;
    }
    if (!reqObj.city || reqObj.city.trim() === '') {
      delete reqObj.city;
    }
    if (!reqObj.country || reqObj.country.trim() === '') {
      delete reqObj.country;
    }
    if (!reqObj.zip || reqObj.zip.trim() === '') {
      delete reqObj.zip;
    }
    if (!reqObj.profilePicture || reqObj.profilePicture.trim() === '') {
      delete reqObj.profilePicture;
    }

    if (this.isEdit && this.editingUserId) {
      // Update existing user
      this.authService
        .updateUser(this.editingUserId, reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res: any) => {
            this.toastr.success("User updated successfully");
            this.loadUsers();
            this.resetForm();
            this.closeModal();
          },
          error: (error: any) => {
            this.toastr.error(error.error?.detail || "Failed to update user");
          },
        });
    } else {
      // Create new user
      this.authService
        .createUserByAdmin(reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res: any) => {
            this.toastr.success("User created successfully");
            this.loadUsers();
            this.resetForm();
            this.closeModal();
          },
          error: (error: any) => {
            this.toastr.error(error.error?.detail || "Failed to create user");
          },
        });
    }
  }

  resetForm() {
    this.addUserForm.reset({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      zip: "",
      profilePicture: "",
    });
    this.isEdit = false;
    this.editingUserId = null;
    this.showPassword = false;
    this.profileImage = 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
    
    this.imgFiles = [];
    
    // Reset password validators
    this.addUserForm
      .get("password")
      ?.setValidators([Validators.required, Validators.minLength(8)]);
    this.addUserForm.get("password")?.updateValueAndValidity();
    
    // Reset phone validators
    this.addUserForm
      .get("phone")
      ?.setValidators([Validators.required, Validators.pattern(/^\+?1?\d{9,15}$/)]);
    this.addUserForm.get("phone")?.updateValueAndValidity();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  closeModal() {
    const modalElement = document.getElementById("addUser");
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

  onFileSelected(event: any, type: string): void {
		const file: File = event.target.files[0];
		if (file) {
			const fileType = file.type.split('/')[1];
			if (!this.imageTypes.includes(fileType)) {
				this.toastr.error('Unsupported File type.');
				return;
			}

			// Validate file size
			if (file.size > this.maxSize) {
				this.toastr.error('File exceeds the maximum size of 3MB.');
				return;
			}
			const reader = new FileReader();
			reader.onload = (e: any) => {
				if (type === 'profilePicture') {
					this.profileImage = e.target.result;
				}
			
			};
			reader.readAsDataURL(file);

			const existingIndex = this.imgFiles.findIndex((img) => img.type === type);

			if (existingIndex !== -1) {
				this.imgFiles[existingIndex] = { type, file };
			} else {
				this.imgFiles.push({ type, file });
			}
		}
	}
}
