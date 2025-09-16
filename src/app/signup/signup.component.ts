import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PHONE_BOOK } from '../shared/component/phone-dropdown/phone-codes';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from '../_services/authentication.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  loading: boolean = false;
  signupForm!: FormGroup;
  passwordType: string = 'password';
  isVideoPlaying = false;
  templateSlug:any
  selectedCountry: any=PHONE_BOOK[231];
  loadingIp: boolean = false;
  constructor(
    private router: Router,
    // private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private titleService: Title,
    private authService: AuthenticationService
  ) {
    this.titleService.setTitle('Sign Up: Strategy Cues');
  }

  ngOnInit(): void {
   

    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required,Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      // phone: ['', Validators.required],
      password: [
        '',
        [Validators.required, Validators.minLength(8), this.passwordValidator],
      ],
    });
  }

  getUserCountryCode(){
    this.loadingIp = true;
  }
  playVideo(): void {
    this.isVideoPlaying = true;
  }
  hasError(controlName: keyof typeof this.signupForm.controls) {
    return (
      this.signupForm.controls[controlName].invalid &&
      this.signupForm.controls[controlName].touched
    );
  }
  getErrorMessage(controlName: keyof typeof this.signupForm.controls) {
    if (
      this.signupForm.controls[controlName].hasError('required') &&
      this.signupForm.controls[controlName].touched
    ) {
      return 'Password is required';
    }

    if (
      this.signupForm.controls[controlName].hasError('minlength') &&
      this.signupForm.controls[controlName].touched
    ) {
      return 'Password must be at least 8 characters long';
    }
    if (
      this.signupForm.controls[controlName].hasError('passwordStrength') &&
      this.signupForm.controls[controlName].touched
    ) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    return '';
  }
  passwordValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (hasUpperCase && hasLowerCase && hasNumber) {
      return null;
    }

    return { passwordStrength: true };
  }
  showPassword(type: string) {
    this.passwordType = type === 'password' ? 'text' : 'password';
  }

  onCountrySelected(country: any) {
    this.selectedCountry = country;
  }
  onSubmit(): void {
    this.signupForm.markAllAsTouched();
    if (this.signupForm.valid) {
      this.loading = true;
      const reqObj = {
        fullName: this.signupForm.value.fullName,
        email: this.signupForm.value.email,
        // phone: `${this.selectedCountry?.phone[0]} ${this.signupForm.value.phone}`,
        // phone: this.signupForm.value.phone,
        password: this.signupForm.value.password,
      };
      this.authService.signup(reqObj).subscribe((res: any) => {
        this.toastr.success('Sign up successful!');
        this.router.navigate(['/signin']);
        this.loading = false;
      });
     
    }
  }

  reportConversion(url?: string): void {
    const callback = () => {
      if (url) {
        window.location.href = url;
      }
    };
  }

  // signInWithGoogle() {
  //   this.loading = true;
  //   // Simulate Google sign-in
  //   setTimeout(() => {
  //     this.toastr.success('Google sign-in successful!');
  //     this.loading = false;
  //     this.router.navigate(['/signin']);
  //   }, 1000);
  // }
}
