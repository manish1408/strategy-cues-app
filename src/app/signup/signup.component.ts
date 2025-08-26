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
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from '@angular/fire/auth';

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
    //  private afAuth: AngularFireAuth,
  ) {
    this.titleService.setTitle('Sign Up: Strategy Cues');
  }

  ngOnInit(): void {
   

    this.signupForm = this.fb.group({
      name: ['', [Validators.required,Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
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
        name: this.signupForm.value.name,
        email: this.signupForm.value.email,
        // phone: `${this.selectedCountry?.phone[0]} ${this.signupForm.value.phone}`,
        phone: this.signupForm.value.phone,
        password: this.signupForm.value.password,
      };
      console.log('Form submitted with:', reqObj);
      this.toastr.success('Sign up successful!');
      this.router.navigate(['/signin']);
      this.loading = false;
    } else {
      console.log('Form is invalid');
    }
  }

  reportConversion(url?: string): void {
    const callback = () => {
      if (url) {
        window.location.href = url;
      }
    };
  }

  // async signInWithGoogle() {
  //   try {
  //     this.loading = true;
  //     const provider = new GoogleAuthProvider();
  //     const result = await this.afAuth.signInWithPopup(provider).catch(error => {
  //       this.loading = false;
  //       throw error;
  //     });
  //     const user = result.user;
  //     if (!user) throw new Error('No user returned');

  //     const userData = {
  //       uid: user.uid,
  //       email: user.email,
  //       name: user.displayName || '',
  //       idToken: await user.getIdToken(),
  //     };
  //     console.log('User data:', userData);
  //     // Simulate a successful Google sign-in
  //     setTimeout(() => {
  //       this.toastr.success('Google sign-in successful!');
  //       this.loading = false;
  //       this.router.navigate(['/dashboard']);
  //     }, 1000);
  //   } catch (error) {
  //     console.error('Google sign-in error:', error);
  //     this.loading = false;
  //   }
  // }
}
