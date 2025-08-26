import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from '@angular/fire/auth';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnDestroy {
  loading: boolean = false;
  loginForm!: FormGroup;
  passwordType: string = 'password';
  private routerSubscription: any;
  showLoginForm: boolean = true;

  constructor(
    private router: Router,
    // private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private titleService: Title,
    // private afAuth: AngularFireAuth
  ) {
    this.titleService.setTitle('Sign In: Strategy Cues');
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  showPassword(type: string) {
    this.passwordType = type === 'password' ? 'text' : 'password';
  }

  hasError(controlName: keyof typeof this.loginForm.controls) {
    return (
      this.loginForm.controls[controlName].invalid &&
      this.loginForm.controls[controlName].touched
    );
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      this.loading = true;
      const reqObj = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };
      console.log('Form submitted with:', reqObj);
      // Simulate a successful login
      setTimeout(() => {
        this.toastr.success('Login successful!');
        this.loading = false;
        this.router.navigate(['/dashboard']);
      }, 1000);
    } else {
      console.log('Form is invalid');
    }
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
