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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private localStorageService: LocalStorageService,
    private eventService: EventService<any>
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
    console.log('Loaded user data:', this.user);
    if (this.user) {
      this.patchForm();
    } else {
      // If no user data in localStorage, fetch from API
      this.fetchUserProfile();
    }
  }

  fetchUserProfile() {
    console.log('Fetching user profile from API...');
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        console.log('Profile API response:', response);
        if (response.success && response.data) {
          this.user = response.data;
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify({ user: response.data })
          );
          this.patchForm();
        } else {
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
    this.settingsForm.patchValue({
      fullName: this.user.fullName || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      address: this.user.address || '',
      city: this.user.city || '',
      country: this.user.country || '',
      zip: this.user.zip || '',
      profilePicture: this.user.profilePicture || this.profileImage,
    });
    this.profileImage = this.user.profilePicture || this.profileImage;
  }

  hasError(controlName: keyof typeof this.settingsForm.controls) {
    return (
      this.settingsForm.controls[controlName].invalid &&
      this.settingsForm.controls[controlName].touched
    );
  }
  onSubmit(): void {
    console.log(this.settingsForm)
    this.settingsForm.markAllAsTouched();
    if (this.settingsForm.valid) {
      this.loading = true;
      this.updateProfile();
    } else {
      console.log('Form is invalid');
    }
  }

  changePasswordRequest(reqObj:any){
    
    // this.authService
    // .changePassword(reqObj)
    // .pipe(finalize(() => (this.loading = false)))
    // .subscribe({
    //   next: (res) => {
    //     if (res.result) {
    //       this.updateProfile();
    //     } else {
    //       this.toastr.error(res.msg);
    //     }
    //   },
    //   error: (err) => {
    //     console.log(err);
    //     this.toastr.error(err.error.msg);
    //   },
    // });
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
    
    console.log('Updating user profile with:', reqObj);
    
    this.profileService.updateUser(reqObj)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          console.log('Update profile response:', res);
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
      console.log('Image files to upload:', this.imgFiles.length);
      // For now, we'll save the profile with the base64 image
      // In a real implementation, you'd upload the image first and get a URL
      this.saveUserDetails();
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
