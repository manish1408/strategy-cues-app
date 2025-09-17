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
import { OperatorService } from "../_services/operator.service";

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
    private profileService: ProfileService,
    private operatorService: OperatorService
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
      
      this.authService
        .signin(reqObj)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.handleSuccessfulLogin(response);
            } else {
              this.handleLoginError(response);
            }
          },
          error: (error: any) => {
            this.handleLoginError(error);
          },
        });
    } else {
      console.log("Form is invalid");
    }
  }

  /**
   * Handle successful login response
   */
  private handleSuccessfulLogin(response: any): void {
    // Step 1: Store authentication token
    this.storeAuthToken(response);
    
    // Step 2: Store user data (if available) or fetch from profile API
    // Step 3: Check operators and handle redirection will be called from fetchUserProfile
    this.storeUserData();
    
    this.toastr.success("Login successful!");
  }

  /**
   * Handle login errors
   */
  private handleLoginError(error: any): void {
    const errorMessage = error.error?.detail || 
                        error.error?.message || 
                        "An error occurred during login. Please try again.";
    this.toastr.error(errorMessage);
  }

  /**
   * Step 1: Store authentication token
   */
  private storeAuthToken(response: any): void {
    // Clear all previous authentication data first
    this.localStorageService.removeItem("STRATEGY-CUES-USER-TOKEN");
    this.localStorageService.removeItem("STRATEGY-CUES-USER");
    this.localStorageService.removeItem("selectedOperator");
    this.localStorageService.removeItem("operatorPresent");
    
    // Clear any cached profile picture by dispatching a profile update event
    this.eventService.dispatchEvent({ type: "PROFILE_CLEARED" });
    
    if (response.data?.token) {
      this.localStorageService.setItem(
        "STRATEGY-CUES-USER-TOKEN",
        response.data.token
      );
      console.log("🔑 Authentication token stored successfully");
    } else {
      console.error("No token found in response");
      throw new Error("Authentication token not found");
    }
  }

  /**
   * Step 2: Store user data
   */
  private storeUserData(): void {
    // Clear any previous user data first to prevent interference
    this.localStorageService.removeItem("STRATEGY-CUES-USER");
    
    // Always fetch user data from profile API
    this.fetchUserProfile();
  }

  /**
   * Fetch user profile from API and store in localStorage
   */
  private fetchUserProfile(): void {
    console.log("🔍 Fetching user profile...");
    console.log("🔑 Token available:", !!this.localStorageService.getItem("STRATEGY-CUES-USER-TOKEN"));
    
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        console.log("✅ Profile API response:", response);
        if (response.success && response.data) {
          // Store the user data
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify(response.data)
          );
          console.log("💾 User profile stored successfully:", response.data);
          
          // Now that user data is stored, proceed with operators and events
          this.checkOperatorsAndRedirect();
        } else {
          console.error("❌ Failed to fetch user profile:", response);
          this.toastr.warning("User profile could not be loaded");
          // Still proceed with operators check even if profile fails
          this.checkOperatorsAndRedirect();
        }
      },
      error: (error: any) => {
        console.error("❌ Error fetching user profile:", error);
        this.toastr.warning("User profile could not be loaded");
        // Still proceed with operators check even if profile fails
        this.checkOperatorsAndRedirect();
      },
    });
  }

  /**
   * Step 3: Check operators and handle redirection
   */
  private checkOperatorsAndRedirect(): void {
    console.log("🔍 Checking operators...");
    this.operatorService.getAllOperator().subscribe({
      next: (response: any) => {
        console.log("📋 Operators API response:", response);
        if (response.success && response.data?.operators) {
          const operators = response.data.operators;
          console.log("👥 Found operators:", operators.length, operators);
          this.handleOperatorsResponse(operators);
        } else {
          console.log("⚠️ No operators data found");
          // No operators data, redirect to all-operators page
          this.handleNoOperators();
        }
      },
      error: (error: any) => {
        console.error("❌ Error fetching operators:", error);
        this.handleOperatorsError();
      },
    });
  }

  /**
   * Handle operators response based on operators count
   */
  private handleOperatorsResponse(operators: any[]): void {
    if (operators.length === 0) {
      // No operators found
      this.handleNoOperators();
    } else {
      // Operators exist, set first one as selected
      this.handleOperatorsFound(operators);
    }
  }

  /**
   * Handle case when operators are found
   */
  private handleOperatorsFound(operators: any[]): void {
    const firstOperator = operators[0];
    console.log("✅ Operators found, selecting first operator:", firstOperator);
    console.log("🔍 First operator ID:", firstOperator._id || firstOperator.id);
    
    // Store selected operator
    this.localStorageService.setItem(
      "selectedOperator",
      JSON.stringify(firstOperator)
    );

    // Set operatorPresent flag to true
    this.localStorageService.setItem("operatorPresent", "true");
    console.log("💾 operatorPresent flag set to true");

    // Fire events
    this.fireLoginEvents();

    // Navigate to revenue page with operator
    const operatorId = firstOperator._id || firstOperator.id;
    console.log("🚀 Navigating to revenue page with operatorId:", operatorId);
    this.router.navigate(["/revenue"], {
      queryParams: { operatorId: operatorId },
    });
  }

  /**
   * Handle case when no operators are found
   */
  private handleNoOperators(): void {
    // Set operatorPresent flag to false
    this.localStorageService.setItem("operatorPresent", "false");
    
    // Remove selected operator
    this.localStorageService.removeItem("selectedOperator");

    // Fire events
    this.fireLoginEvents();

    // Navigate to all-operators page
    this.router.navigate(["/all-operators"]);
  }

  /**
   * Handle operators API error
   */
  private handleOperatorsError(): void {
    // Set operatorPresent flag to false on error
    this.localStorageService.setItem("operatorPresent", "false");
    
    // Remove selected operator
    this.localStorageService.removeItem("selectedOperator");

    // Fire events
    this.fireLoginEvents();

    // Navigate to all-operators page
    this.router.navigate(["/all-operators"]);
  }

  /**
   * Fire all necessary events after successful login
   */
  private fireLoginEvents(): void {
    this.eventService.dispatchEvent({ type: "OPERATORS_UPDATED" });
    this.eventService.dispatchEvent({ type: "LOGIN_CHANGE" });
  }
}
