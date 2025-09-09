import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Title } from "@angular/platform-browser";
import { LocalStorageService } from "../_services/local-storage.service";
import { finalize } from "rxjs";
import { AuthenticationService } from "../_services/authentication.service";
import { EventService } from "../_services/event.service";
import { ProfileService } from "../_services/profile.service";


@Component({
  selector: "app-signin",
  templateUrl: "./signin.component.html",
  styleUrl: "./signin.component.scss",
})
export class SigninComponent implements OnDestroy {
  loading: boolean = false;
  loginForm!: FormGroup;
  passwordType: string = "password";
  private routerSubscription: any;
  showLoginForm: boolean = true;

  constructor(
    private router: Router,
    // private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private titleService: Title,
    private localStorageService: LocalStorageService,
    private authService: AuthenticationService,
    private eventService: EventService<any>,
    private profileService: ProfileService
  ) {
    this.titleService.setTitle("Sign In: Strategy Cues");
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  showPassword(type: string) {
    this.passwordType = type === "password" ? "text" : "password";
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
      console.log("Form submitted with:", reqObj);
      this.authService.signin(reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (response: any) => {
            console.log('Signin response:', response);
            console.log('Response structure:', {
              success: response.success,
              data: response.data,
              token: response.data?.token,
              user: response.data?.user
            });
            
            if (response.success) {
              console.log('Login successful, storing data...');
              
              // Store token
              if (response.data?.token) {
                this.localStorageService.setItem(
                  "STRATEGY-CUES-USER-TOKEN",
                  response.data.token
                );
                console.log('Token stored:', response.data.token);
              } else {
                console.error('No token found in response');
              }
              
              // Store user data
              if (response.data?.user) {
                this.localStorageService.setItem(
                  "STRATEGY-CUES-USER",
                  JSON.stringify(response.data.user)
                );
                console.log('User data stored:', response.data.user);
              } else {
                console.error('No user data found in response');
                console.log('Available response keys:', Object.keys(response));
                console.log('Full response data:', response.data);
              }
              
              console.log('Data stored, dispatching LOGIN_CHANGE event...');
              this.eventService.dispatchEvent({ type: 'LOGIN_CHANGE' });
              
              // If no user data in response, fetch it from profile API
              if (!response.data?.user) {
                console.log('No user data in signin response, fetching from profile API...');
                this.fetchUserProfile();
              }
              
              console.log('Navigating to dashboard...');
              this.router.navigate(["/dashboard"]);
              this.toastr.success("Login successful!");
            } else {
              this.toastr.error(response.error?.detail || "Login failed. Please try again.");
            }
          },
          error: (error: any) => {
            console.error('Login error:', error);
            this.toastr.error(
              error.error?.detail || 
              error.error?.message || 
              "An error occurred during login. Please try again."
            );
          }
        });
    } else {
      console.log("Form is invalid");
    }
  }

  signInWithGoogle() {
    this.loading = true;
    // Simulate Google sign-in
    setTimeout(() => {
      try {
        // Store authentication token in localStorage
        this.localStorageService.setItem(
          "STRATEGY-CUES-USER-TOKEN",
          "google-mock-token-" + Date.now()
        );
        this.localStorageService.setItem(
          "STRATEGY-CUES-USER",
          JSON.stringify({
            email: "user@gmail.com",
            name: "Google User",
            id: "google-user-" + Date.now(),
          })
        );

        this.eventService.dispatchEvent({ type: 'LOGIN_CHANGE' });
        this.toastr.success("Google sign-in successful!");
        this.router.navigate(["/dashboard"]);
      } catch (error) {
        console.error('Google sign-in error:', error);
        this.toastr.error("Google sign-in failed. Please try again.");
      } finally {
        this.loading = false;
      }
    }, 1000);
  }

  fetchUserProfile() {
    console.log('Fetching user profile from API...');
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        console.log('Profile API response:', response);
        if (response.success && response.data) {
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify(response.data)
          );
          console.log('User profile stored:', response.data);
          this.eventService.dispatchEvent({ type: 'LOGIN_CHANGE' });
        } else {
          console.error('Failed to fetch user profile:', response);
        }
      },
      error: (error: any) => {
        console.error('Error fetching user profile:', error);
      }
    });
  }
}
