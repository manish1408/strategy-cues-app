import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../_services/authentication.service';
import { Route, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { PHONE_BOOK } from '../shared/component/phone-dropdown/phone-codes';
import { ProfileService } from '../_services/profile.service';
import { LocalStorageService } from '../_services/local-storage.service';
import { EventService } from '../_services/event.service';
import { CommonService } from '../_services/common.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  loading: boolean = false;
  settingsForm!: FormGroup;
  user: any;
  imgFiles: any[] = [];
  imageTypes = ['jpeg', 'webp', 'jpg', 'png'];
  allowedMimes = ['image/jpeg', 'image/webp','image/jpg','image/png'];
  maxSize = 3 * 1024 * 1024;
  widgetImageDetail:any;
  countries: any = PHONE_BOOK;  
  profileImage = 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
  initialFormValues: any = {}; // Store initial form values

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private localStorageService: LocalStorageService,
    private eventService: EventService<any>,
    private commonService: CommonService
  ) {
    this.settingsForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: [''],
      city: [''],
      country: [''],
      zip: [''],
      profilePicture: [''],
    });
  }

  ngOnInit() {  
    this.loadUser();
  }

  loadUser() {
    this.user = this.profileService.getUserDetails();
    
    if (this.user && this.user.id) {
      this.patchForm();
    } else {
      // If no user data in localStorage, fetch from API
      this.fetchUserProfile();
    }
  }

  fetchUserProfile() {
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.user = response.data.user;
          
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify({ user: response.data })
          );
          this.patchForm();
        } else {
          console.error('Failed to load user profile - no data in response');
          this.toastr.error('Failed to load user profile');
        }
      },
      error: (error: any) => {
        console.error('Error fetching user profile:', error);
        this.toastr.error('Error loading user profile');
      }
    });
  }

  patchForm() {
    const formData = {
      fullName: this.user.fullName || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      address: this.user.address || '',
      city: this.user.city || '',
      country: this.user.country || '',
      zip: this.user.zip || '',
      profilePicture: this.user.profilePicture || this.profileImage,
    };
    
    this.settingsForm.patchValue(formData);
    this.profileImage = this.user.profilePicture || this.profileImage;
    
    // Store initial form values for comparison
    this.initialFormValues = { ...formData };
    this.initialFormValues.profilePicture = this.profileImage; // Store the actual profile image
  }

  hasError(controlName: keyof typeof this.settingsForm.controls) {
    return (
      this.settingsForm.controls[controlName].invalid &&
      this.settingsForm.controls[controlName].touched
    );
  }

  hasFormChanges(currentValues: any): boolean {
    // Compare each field with initial values
    for (const key in currentValues) {
      if (currentValues.hasOwnProperty(key)) {
        const currentValue = currentValues[key] || '';
        const initialValue = this.initialFormValues[key] || '';
        
        // Handle profile picture comparison (URLs might be different but same image)
        if (key === 'profilePicture') {
          // If both are default images or both are custom URLs, consider them same
          const isCurrentDefault = currentValue === 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
          const isInitialDefault = initialValue === 'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
          
          if (isCurrentDefault && isInitialDefault) {
            continue; // Both are default, no change
          }
          if (isCurrentDefault !== isInitialDefault) {
            return true; // One is default, other is custom - change detected
          }
          // Both are custom URLs, compare them
          if (currentValue !== initialValue) {
            return true; // Different URLs - change detected
          }
        } else {
          // For other fields, simple string comparison
          if (currentValue !== initialValue) {
            return true; // Change detected
          }
        }
      }
    }
    return false; // No changes detected
  }
  onSubmit(): void {
    this.settingsForm.markAllAsTouched();
    
    if (this.settingsForm.valid) {
      // Check if any changes were made
      const currentValues = {
        ...this.settingsForm.value,
        profilePicture: this.profileImage
      };
      
      const hasChanges = this.hasFormChanges(currentValues);
      
      if (!hasChanges) {
        this.toastr.info('No changes made');
        return;
      }
      
      this.loading = true;
      this.updateProfile();
    } else {
      // console.log('Form is invalid');
    }
  }

  

  saveUserDetails() {
    const reqObj = {
      fullName: this.settingsForm.value.fullName,
      email: this.settingsForm.value.email,
      phone: this.settingsForm.value.phone,
      address: this.settingsForm.value.address,
      city: this.settingsForm.value.city,
      country: this.settingsForm.value.country,
      zip: this.settingsForm.value.zip,
      profilePicture: this.profileImage || this.settingsForm.value.profilePicture,
    };
    
    // console.log('Updating user profile with:', reqObj);
    
    this.profileService.updateUser(reqObj)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          // console.log('Update profile response:', res);
          if (res.success) {
            // Update localStorage with new user data
            const updatedUser = { ...this.user, ...reqObj };
            this.localStorageService.setItem(
              'STRATEGY-CUES-USER',
              JSON.stringify({ user: updatedUser })
            );
            
            // Dispatch event to update app component
            this.eventService.dispatchEvent({ type: 'PROFILE_UPDATED' });
            
            this.toastr.success('Profile Updated Successfully');
            this.user = updatedUser;
            
            // Update initial form values to current values after successful save
            this.initialFormValues = { ...reqObj };
          } else {
            this.toastr.error(res.error?.detail || res.message || 'Failed to update profile');
          }
        },
        error: (err) => {
          console.error('Update profile error:', err);
          this.toastr.error(
            err.error?.detail || 
            err.error?.message || 
            'An error occurred while updating profile'
          );
        },
      });
  }


  updateProfile() {
    this.loading = true;
    if (this.imgFiles.length > 0) {
      const filesToAdd = this.imgFiles.filter((file) => file);
      let fd = new FormData();
      
      filesToAdd.forEach((f) => {
        fd.append('file', f.file);  // Single file field as per API docs
      });
      
      // Only append userId if it exists
      if (this.user.id) {
        fd.append('userId', this.user.id);
      } else {
        console.error('User ID is undefined! Cannot upload file.');
        this.toastr.error('User ID not found. Please refresh and try again.');
        this.loading = false;
        return;
      }
      this.commonService
        .uploadFile(fd)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res: any) => {
            
            // API returns: { "data": "https://...", "success": true }
            if (res?.success && res?.data) {
              
              // The API returns the file URL directly in the data field
              const fileUrl = res.data;
              
              if (fileUrl) {
                this.profileImage = fileUrl;
                // Update initial form values to reflect the new profile image
                this.initialFormValues.profilePicture = fileUrl;
                this.saveUserDetails();
              } else {
                // Even if no URL, proceed to save user details
                this.saveUserDetails();
              }
            } else {
              console.error('Upload failed:', res);
              this.toastr.error('Failed to upload profile image: ' + (res?.error || 'Unknown error'));
            }
          },
          error: (err: any) => {
            console.error('File upload error:', err);
            this.toastr.error('Error uploading profile image: ' + (err.error?.message || err.message || 'Unknown error'));
          }
        });
    } else {
      this.saveUserDetails();
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
				this.toastr.error('File exceeds the maximum size of 10MB.');
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
