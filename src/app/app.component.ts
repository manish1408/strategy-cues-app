import { Component } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { AuthenticationService } from "./_services/authentication.service";
import { Subject, finalize, takeUntil } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { routeUrls } from "./constant/shared-constant";
import { EventService } from "./_services/event.service";
import { ProfileService } from "./_services/profile.service";
import { LocalStorageService } from "./_services/local-storage.service";
import { OperatorService } from "./_services/operator.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  isCollapsed = false;
  isLoggedIn = false;
  user: any;
  operators: any;
  selectedOperator: any;

  avatar =
    "https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp";
  $destroyWatching: Subject<any> = new Subject();
  createOperatorForm: FormGroup | any;
  formLoading: boolean = false;

  isOperatorPage = false;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private eventService: EventService<any>,
    private profileService: ProfileService,
    private localStorageService: LocalStorageService,
    private operatorService: OperatorService
  ) {
    
    this.eventService.events.pipe(
      takeUntil(this.$destroyWatching)
    ).subscribe((e: any) => {
      if (e.type === "PROFILE_UPDATED") {
        this.user = this.profileService.getUserDetails();
      }
    });
    router.events.forEach((event) => {
       if (event instanceof NavigationEnd) {
        if (routeUrls.includes(event.urlAfterRedirects)) {
          this.isLoggedIn = false;
          this.authService.signOut();
        }
      }
    });
  }

  async ngOnInit() {
    
    this.createOperatorForm = this.fb.group({
      operatorName: ["", Validators.required],
    });
    
    // Check authentication status
    this.isLoggedIn = this.authService.isAuthenticated();
    
    // Load user data if logged in
    if (this.isLoggedIn) {
      this.user = this.profileService.getUserDetails();
      
      // If no user data found, fetch from API
      if (!this.user) {
        this.fetchUserProfile();
      }
      // Only call getAllOperators once here
      this.getAllOperators();
    }
    
    this.startWatchingAppEvents();

    // Load user data from localStorage
    const user_: any = localStorage.getItem("STRATEGY-CUES-USER");
    if (user_ && user_ !== 'undefined') {
      try {
        const userData = JSON.parse(user_);
        // Handle nested user structure: {user: {...}} -> {...}
        this.user = userData.user || userData;
          this.avatar = this.user?.profilePicture || this.avatar;
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.avatar = "https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp";
      }
    }
  }
  getAllOperators() {
    this.operatorService.getAllOperator().subscribe({
      next: (res: any) => {
        this.operators = res.data?.operators || [];
        if (this.operators.length > 0) {
          const storedOperator = localStorage.getItem("selectedOperator");
          if (storedOperator) {
            const parsedOperator = JSON.parse(storedOperator);
            // Check if the stored operator still exists in the current operators list
            const operatorExists = this.operators.find((op: any) => op._id === parsedOperator._id);
            if (operatorExists) {
              this.selectedOperator = parsedOperator;
            } else {
              // Selected operator no longer exists, select the last one
              this.selectedOperator = {
                _id: this.operators.at(-1)?._id,
                name: this.operators.at(-1)?.name,
              };
              localStorage.setItem(
                "selectedOperator",
                JSON.stringify(this.selectedOperator)
              );
            }
          } else {
            this.selectedOperator = {
              _id: this.operators.at(-1)?._id,
              name: this.operators.at(-1)?.name,
            };
            localStorage.setItem(
              "selectedOperator",
              JSON.stringify(this.selectedOperator)
            );
          }
          localStorage.setItem('operatorPresent', 'true');
        } else {
          localStorage.setItem('operatorPresent', 'false');
          this.selectedOperator = null;
          localStorage.removeItem("selectedOperator");
        }
      },
      error: (error: any) => {
        console.error('Error loading operators in app component:', error);
        this.operators = [];
        this.selectedOperator = null;
        localStorage.setItem('operatorPresent', 'false');
      }
    });
  }

  selectOperator(operator: any) {
    this.selectedOperator = operator;
    localStorage.setItem("selectedOperator", JSON.stringify(operator));
  }

  startWatchingAppEvents() {
    this.eventService.events
      .pipe(takeUntil(this.$destroyWatching))
      .subscribe((e: any) => {

        if (e.type === "LOGIN_CHANGE") {
          const user_:any = localStorage.getItem('STRATEGY-CUES-USER');
          if (user_ && user_ !== 'undefined') {
            try {
              const userData = JSON.parse(user_);
              // Handle nested user structure: {user: {...}} -> {...}
              this.user = userData.user || userData;
              this.avatar = this.user?.profilePicture || this.avatar;
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          } else {
          }
          // Only call getAllOperators if not already called in ngOnInit
          if (!this.operators) {
            this.getAllOperators();
          }
          this.isLoggedIn = this.authService.isAuthenticated();
        }
        if ( e.type === "PROFILE_UPDATED") {
          const user_:any = localStorage.getItem('STRATEGY-CUES-USER');
          if (user_ && user_ !== 'undefined') {
            try {
              const userData = JSON.parse(user_);
              // Handle nested user structure: {user: {...}} -> {...}
              this.user = userData.user || userData;
              this.avatar = this.user?.profilePicture || this.avatar;
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          } else {
          }
          this.getAllOperators();
          this.isLoggedIn = this.authService.isAuthenticated();
        }
        if (e.type === "OPERATORS_UPDATED") {
          this.getAllOperators();
        }
      });
  }

  async signOut(): Promise<void> {
    this.isLoggedIn = false;
    setTimeout(()=>{ 
    this.authService.signOut();
    this.router.navigate(["/signin"]);
    },0)
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  fetchUserProfile() {
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify(response.data)
          );
          this.user = response.data;
          this.eventService.dispatchEvent({ type: 'PROFILE_UPDATED' });
        } else {
          console.error('AppComponent: Failed to fetch user profile:', response);
        }
      },
      error: (error: any) => {
        console.error('AppComponent: Error fetching user profile:', error);
      }
    });
  }
}
