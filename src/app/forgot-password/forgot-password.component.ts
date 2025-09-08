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
  passwordType: string = "password";
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
      new_password: ['', [Validators.required]],
    });
    this.titleService.setTitle('Reset Password: MiloAssistant.ai');
  }

  ngOnInit(): void {
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
  onOtpChange(otp: any) {
    this.code.setValue(otp);
    if (otp && otp.length === 6) {
      this.code.markAsTouched();
    }
  }
  onSubmit(): void {
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.valid) {
      this.loading = true;
      const reqObj = {
        email: this.forgotForm.value.email,
      };

      this.authService
        .forgotPassword(reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            console.log('Forgot password response:', res);
         
            if (res.result || res.success || res.status === 'success' || (res.data && res.data.success)) {
              this.otpSuccess = true;
              this.resetForm.patchValue({
                email: this.forgotForm.value.email,
              });
              this.toastr.success('OTP sent successfully!');
            } else {
              this.toastr.error(res.error?.details || res.message || 'Failed to send OTP. Please try again.');
            }
          },
          error: (err) => {
            console.error('Forgot password error:', err);
            this.toastr.error(
              err.error?.details || 
              err.error?.message || 
              'An error occurred. Please try again.'
            );
          },
        });
    } else {
      console.log('Form is invalid');
    }
  }
  onSubmitReset(): void {
    this.resetForm.markAllAsTouched();
    this.code.markAsTouched();
    
    if (this.resetForm.valid && this.code.valid) {
      this.loading = true;
      const reqObj = {
        email: this.resetForm.value.email,
        otp: this.code.value,
        new_password: this.resetForm.value.new_password,
      };

      console.log('Reset password request:', reqObj);

   
      this.authService
        .resetPassword(reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            console.log('Reset password response:', res);
            // Check for different possible response structures
            if (res.result || res.success || res.status === 'success' || (res.data && res.data.success)) {
              this.toastr.success('Password changed successfully!');
              this.router.navigate(['/signin']);
            } else {
              this.toastr.error(res.error?.details || res.message || 'Failed to reset password. Please try again.');
            }
          },
          error: (err) => {
            console.error('Reset password error:', err);
            this.toastr.error(
              err.error?.details || 
              err.error?.message || 
              'An error occurred. Please try again.'
            );
          },
        });
    } else {
      if (!this.code.value) {
        this.toastr.error('OTP is required');
      }
      console.log('Form is invalid');
    }
  }
  
  showPassword(type: string) {
    this.passwordType = type === "password" ? "text" : "password";
  }
}
