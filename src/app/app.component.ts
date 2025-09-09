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
    console.log('AppComponent ngOnInit called');
    
    this.createOperatorForm = this.fb.group({
      operatorName: ["", Validators.required],
    });
    
    // Check authentication status
    this.isLoggedIn = this.authService.isAuthenticated();
    console.log('Initial isLoggedIn status:', this.isLoggedIn);
    
    // Load user data if logged in
    if (this.isLoggedIn) {
      this.user = this.profileService.getUserDetails();
      console.log('User loaded from ProfileService:', this.user);
      
      // If no user data found, fetch from API
      if (!this.user) {
        console.log('No user data in localStorage, fetching from profile API...');
        this.fetchUserProfile();
      }
      // Only call getAllOperators once here
      this.getAllOperators();
    }
    
    this.startWatchingAppEvents();

    // Load user data from localStorage
    const user_: any = localStorage.getItem("STRATEGY-CUES-USER");
    console.log('User data from localStorage:', user_);
    if (user_ && user_ !== 'undefined') {
      try {
        const userData = JSON.parse(user_);
        // Handle nested user structure: {user: {...}} -> {...}
        this.user = userData.user || userData;
          this.avatar = this.user?.profilePicture || this.avatar;
        console.log('User parsed and set:', this.user);
        console.log('Avatar set to:', this.avatar);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.avatar = "https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp";
      }
    } else {
      console.log('No user data found in localStorage');
    }
    
    console.log('Final state - isLoggedIn:', this.isLoggedIn, 'user:', this.user);
  }
  getAllOperators() {
    this.operatorService.getAllOperator().subscribe((res: any) => {
      console.log("All operators", res.data); 
      this.operators = res.data?.operators || [];
      this.user = this.profileService.getUserDetails();
      if (this.operators.length > 0) {
        const storedOperator = localStorage.getItem("selectedOperator");
          if (storedOperator) {
            this.selectedOperator = JSON.parse(storedOperator);
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
      }
    });
  }

  startWatchingAppEvents() {
    console.log('Starting to watch app events');
    this.eventService.events
      .pipe(takeUntil(this.$destroyWatching))
      .subscribe((e: any) => {
        console.log('Event received:', e);

        if (e.type === "LOGIN_CHANGE") {
          console.log('LOGIN_CHANGE event received');
          const user_:any = localStorage.getItem('STRATEGY-CUES-USER');
          console.log('User data from localStorage in LOGIN_CHANGE:', user_);
          if (user_ && user_ !== 'undefined') {
            try {
              const userData = JSON.parse(user_);
              // Handle nested user structure: {user: {...}} -> {...}
              this.user = userData.user || userData;
              this.avatar = this.user?.profilePicture || this.avatar;
              console.log('User set in LOGIN_CHANGE:', this.user);
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          } else {
            console.log('No user data found in LOGIN_CHANGE');
          }
          // Only call getAllOperators if not already called in ngOnInit
          if (!this.operators) {
            this.getAllOperators();
          }
          this.isLoggedIn = this.authService.isAuthenticated();
          console.log('isLoggedIn set to:', this.isLoggedIn);
        }
        if ( e.type === "PROFILE_UPDATED") {
          console.log('PROFILE_UPDATED event received');
          const user_:any = localStorage.getItem('STRATEGY-CUES-USER');
          if (user_ && user_ !== 'undefined') {
            try {
              const userData = JSON.parse(user_);
              // Handle nested user structure: {user: {...}} -> {...}
              this.user = userData.user || userData;
              this.avatar = this.user?.profilePicture || this.avatar;
              console.log('User set in PROFILE_UPDATED:', this.user);
            } catch (error) {
              console.error('Error parsing user data:', error);
            }
          } else {
            console.log('No user data found in PROFILE_UPDATED');
          }
          this.getAllOperators();
          this.isLoggedIn = this.authService.isAuthenticated();
          console.log('isLoggedIn set to:', this.isLoggedIn);
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
    console.log('AppComponent: Fetching user profile from API...');
    this.profileService.fetchUserDetail().subscribe({
      next: (response: any) => {
        console.log('AppComponent: Profile API response:', response);
        if (response.success && response.data) {
          this.localStorageService.setItem(
            "STRATEGY-CUES-USER",
            JSON.stringify(response.data)
          );
          this.user = response.data;
          console.log('AppComponent: User profile stored and set:', response.data);
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
