import { Component, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Title } from "@angular/platform-browser";
import { LocalStorageService } from "../_services/local-storage.service";
import { finalize } from "rxjs";
import { AuthenticationService } from "../_services/authentication.service";
import { EventService } from "../_services/event.service";


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
    private eventService: EventService<any>
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
            if (response.success) {
              this.localStorageService.setItem(
                "STRATEGY-CUES-USER-TOKEN",
                response.data.token
              );
              this.localStorageService.setItem(
                "STRATEGY-CUES-USER",
                JSON.stringify(response.data.user)
              );

              this.eventService.dispatchEvent({ type: 'LOGIN_CHANGE' });
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
}
