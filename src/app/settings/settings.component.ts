import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../_services/authentication.service';
import { Route, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { PHONE_BOOK } from '../shared/component/phone-dropdown/phone-codes';

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
    private authService: AuthenticationService,
    private toastr: ToastrService,
  ) {
    this.settingsForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      companyName: ['', Validators.required],
      country: ['India', Validators.required],
      address: [''],
      state: [''],
      zip: [''],
      taxId: [''],
      profilePic: [''],
    });
  }

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.patchForm();
  }

  patchForm() {
    this.settingsForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone,
      companyName: this.user.companyName,
      address: this.user.address,
      state: this.user.state,
      country: this.user.country,
      zip: this.user.zip,
      taxId: this.user.taxId,
      profilePic:this.user.profilePic,
     
    });
    this.profileImage = this.user.profilePic;
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
      name: this.settingsForm.value.name,
      phone: this.settingsForm.value.phone,
      companyName: this.settingsForm.value.companyName,
      address: this.settingsForm.value.address,
      state: this.settingsForm.value.state,
      country: this.settingsForm.value.country,
      zip: this.settingsForm.value.zip,
      taxId: this.settingsForm.value.taxId,
      profilePic: this.profileImage || '',
    };
    // TODO: Implement update profile API
    // this.authService
    // .updateProfile(reqObj)
    // .pipe(finalize(() => (this.loading = false)))
    // .subscribe({
    //   next: (res) => {
    //     if (res.result) {
    //       this.localStorageService.setItem(
    //         'MILO-USER',
    //         JSON.stringify(res.data)
    //       );
    //       this.eventService.dispatchEvent({ type: 'PROFILE_UPDATED' });
    //       this.toastr.success('Profile Updated Successfully');
    //       this.loadUser();
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


  updateProfile() {
    this.loading = true;
    if (this.imgFiles.length > 0) {
      console.log('this.imgFiles.length: ', this.imgFiles.length);
      const filesToAdd = this.imgFiles.filter((file) => file);
      let fd = new FormData();
      filesToAdd.forEach((f) => {
        fd.append('files', f.file);
        fd.append('types', f.type);
      });
      fd.append('userId', this.user._id);
      // this.authService
      //   .saveProfileImage(fd)
      //   .pipe(finalize(() => (this.loading = false)))
      //   .subscribe((res: any) => {

      //     if (res?.data?.profilePic) {
      //       this.profileImage = res.data.profilePic
      //       this.saveUserDetails();
      //     }
      //   });
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
				if (type === 'profilePic') {
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
