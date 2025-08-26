import { Component, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthenticationService } from '../_services/authentication.service';
import { ToastrService } from 'ngx-toastr';
import { NgOtpInputComponent, NgOtpInputConfig } from 'ng-otp-input';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  isVideoPlaying = false;
  loading: boolean = false;
  otpSuccess: boolean = false;
  forgotForm!: FormGroup;
  resetForm!: FormGroup;
  code: FormControl = new FormControl('', [Validators.required]);
  noOtp = false;
  config: NgOtpInputConfig = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    containerClass: 'd-flex gap-3 justify-content-start align-items-center',
    inputStyles: {
      background: '#ffffff',
      border: '1px solid #ebedef',
      'border-radius': '0.5rem',
      'font-weight': '500',
      'margin-bottom': '0',
      'margin-right': '0',
      width: '44px',
      height: '44px',
      'font-size': '16px',
    },
    inputClass: 'otp-input-box',
  };
  @ViewChild('ngOtpInput') ngOtpInputRef!: NgOtpInputComponent;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required]],
    });
    this.titleService.setTitle('Reset Password: MiloAssistant.ai');
  }

  ngOnInit(): void {
    // const isLoggedIn = this.authService.isAuthenticated();

    // if (isLoggedIn) {
    //   this.router.navigate(["/dashboard"]);
    // }
  }
  playVideo(): void {
    this.isVideoPlaying = true;
  }
  hasError(controlName: keyof typeof this.forgotForm.controls) {
    return (
      this.forgotForm.controls[controlName].invalid &&
      this.forgotForm.controls[controlName].touched
    );
  }
  hasError2(controlName: keyof typeof this.resetForm.controls) {
    return (
      this.resetForm.controls[controlName].invalid &&
      this.resetForm.controls[controlName].touched
    );
  }
  onOtpChange(otp: any) {}
  onSubmit(): void {
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.valid) {
      this.loading = true;
      const reqObj = {
        email: this.forgotForm.value.email,
      };

        // this.authService
        //   .forgotPassword(reqObj) // TODO: Implement forgot password API
        //   .pipe(finalize(() => (this.loading = false)))
        //   .subscribe({
        //     next: (res) => {
        //       if (res.result) {
        //         this.otpSuccess = true;
        //         this.resetForm.patchValue({
        //           email: this.forgotForm.value.email,
        //         });
        //         this.toastr.success('Otp sent success');
        //       } else {
        //         this.toastr.error(res.msg);
        //       }
        //     },
        //     error: (err) => {
        //       console.log(err);
        //       this.toastr.error(err.error.msg);
        //     },
        //   });
    } else {
      console.log('Form is invalid');
    }
  }
  onSubmitReset(): void {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.valid) {
      if (!this.code.value) {
        this.toastr.error('Otp is required');
      }
      this.loading = true;
      const reqObj = {
        email: this.resetForm.value.email,
        otp: this.code.value,
        newPassword: this.resetForm.value.newPassword,
      };

      // this.authService
      //   .resetPassword(reqObj)
      //   .pipe(finalize(() => (this.loading = false)))
      //   .subscribe({
      //     next: (res) => {
      //       if (res.result) {
      //         this.toastr.success('Password Changed Success');
      //         this.router.navigate(['/login']);
      //       } else {
      //         this.toastr.error(res.msg);
      //       }
      //     },
      //     error: (err) => {
      //       console.log(err);
      //       this.toastr.error(err.error.msg);
      //     },
      //   });
    } else {
      console.log('Form is invalid');
    }
  }
}
