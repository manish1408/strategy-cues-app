import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Title } from "@angular/platform-browser";
import { LocalStorageService } from "../_services/local-storage.service";
import { AuthenticationService } from "../_services/authentication.service";
import { EventService } from "../_services/event.service";
import { ProfileService } from "../_services/profile.service";
import { OperatorService } from "../_services/operator.service";

@Component({
  selector: "app-signin",
  templateUrl: "./signin.component.html",
  styleUrl: "./signin.component.scss",
})
export class SigninComponent {
  loading: boolean = false;
  loginForm!: FormGroup;
  passwordType: string = "password";
  showLoginForm: boolean = true;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private titleService: Title,
    private localStorageService: LocalStorageService,
    private authService: AuthenticationService,
    private eventService: EventService<any>,
    private profileService: ProfileService,
    private operatorService: OperatorService
  ) {
    this.titleService.setTitle("Sign In: Strategy Cues - Listing Optimization Cues Dashboard");
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required],
    });
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

      this.authService.signin(reqObj).subscribe({
        next: (response: any) => {
          if (response.success) {
            try {
              this.handleSuccessfulLogin(response);
            } catch (error) {
              this.handleLoginError(error);
            }
          } else {
            this.handleLoginError(response);
          }
        },
        error: (error: any) => {
          this.handleLoginError(error);
        },
      });
    }
  }

  private handleSuccessfulLogin(response: any): void {
    this.storeAuthToken(response);
    this.storeUserData();
  }

  private handleLoginError(error: any): void {
    const errorMessage = error.error?.detail || 
                        error.error?.message || 
                        "An error occurred during login. Please try again.";
    this.toastr.error(errorMessage);
    this.finishLoginFlow();
  }

  private storeAuthToken(response: any): void {
    this.localStorageService.removeItem("STRATEGY-CUES-USER-TOKEN");
    this.localStorageService.removeItem("STRATEGY-CUES-USER");
    this.localStorageService.removeItem("selectedOperator");
    this.localStorageService.removeItem("operatorPresent");
    this.eventService.dispatchEvent({ type: "PROFILE_CLEARED" });
    
    if (response.data?.token) {
      this.localStorageService.setItem(
        "STRATEGY-CUES-USER-TOKEN",
        response.data.token
      );
    } else {
      throw new Error("Authentication token not found");
    }
  }

  private storeUserData(): void {
    this.localStorageService.removeItem("STRATEGY-CUES-USER");
    this.fetchUserProfile();
  }

  private fetchUserProfile(): void {
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify(response.data)
          );
          this.checkOperatorsAndRedirect();
        } else {
          this.toastr.warning("User profile could not be loaded");
          this.checkOperatorsAndRedirect();
        }
      },
      error: () => {
        this.toastr.warning("User profile could not be loaded");
        this.checkOperatorsAndRedirect();
      },
    });
  }

  private checkOperatorsAndRedirect(): void {
    this.operatorService.getAllOperator().subscribe({
      next: (response: any) => {
        if (response.success && response.data?.operators) {
          const operators = response.data.operators;
          this.handleOperatorsResponse(operators);
        } else {
          this.handleNoOperators();
        }
      },
      error: () => {
        this.handleOperatorsError();
      },
    });
  }

  private handleOperatorsResponse(operators: any[]): void {
    if (operators.length === 0) {
      this.handleNoOperators();
    } else {
      this.handleOperatorsFound(operators);
    }
  }

  private handleOperatorsFound(operators: any[]): void {
    const firstOperator = operators[0];
    this.localStorageService.setItem(
      "selectedOperator",
      JSON.stringify(firstOperator)
    );

    this.localStorageService.setItem("operatorPresent", "true");

    this.fireLoginEvents();

    const operatorId = firstOperator._id || firstOperator.id;
    this.router
      .navigate(["/revenue"], {
        queryParams: { operatorId: operatorId },
      })
      .then(
        () => this.finishLoginFlow(),
        () => this.finishLoginFlow()
      );
  }

  private handleNoOperators(): void {
    this.localStorageService.setItem("operatorPresent", "false");
    this.localStorageService.removeItem("selectedOperator");

    this.fireLoginEvents();

    this.router.navigate(["/all-operators"]).then(
      () => this.finishLoginFlow(),
      () => this.finishLoginFlow()
    );
  }

  private handleOperatorsError(): void {
    this.localStorageService.setItem("operatorPresent", "false");
    this.localStorageService.removeItem("selectedOperator");

    this.fireLoginEvents();

    this.router.navigate(["/all-operators"]).then(
      () => this.finishLoginFlow(),
      () => this.finishLoginFlow()
    );
  }

  private fireLoginEvents(): void {
    this.eventService.dispatchEvent({ type: "OPERATORS_UPDATED" });
    this.eventService.dispatchEvent({ type: "LOGIN_CHANGE" });
  }

  private finishLoginFlow(): void {
    this.loading = false;
  }
}
