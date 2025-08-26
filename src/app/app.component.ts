import { Component } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { AuthenticationService } from "./_services/authentication.service";
import { Subject, finalize, takeUntil } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  isCollapsed = false;
  isLoggedIn = true;
  user: any;
  operators: any;
  selectedOperator: any;

  avatar =
    "https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp";
  $destroyWatching: Subject<any> = new Subject();
  createChatbotForm: FormGroup | any;
  formLoading: boolean = false;

  isChatbotPage = false;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    // this.router.events.subscribe(() => {
    //   this.isChatbotPage = this.router.url.includes('/milo-chatbot');
    // });
    // this.eventService.events.pipe(
    //   takeUntil(this.$destroyWatching)
    // ).subscribe((e: any) => {
    //   if (e.type === "PROFILE_UPDATED") {
    //     this.user = this.userService.getUserDetails();
    //   }
    // });
    // router.events.forEach((event) => {
    //   if (event instanceof NavigationStart) {
    //     this.isChatbotPage = event.url.includes('/milo-chatbot');
    //     this.isLoggedIn = this.authService.isAuthenticated();
    //   } else if (event instanceof NavigationEnd) {
    //     if (routeUrls.includes(event.urlAfterRedirects)) {
    //       this.isLoggedIn = false;
    //       this.authService.signOut();
    //     }
    //   }
    // });
  }

  async ngOnInit() {
    this.createChatbotForm = this.fb.group({
      chatbotName: ["", Validators.required],
    });
    // this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.getAllOperators();
    }
    this.startWatchingAppEvents();

    const user_: any = localStorage.getItem("MILO-USER");
    const user = JSON.parse(user_);
    this.avatar = user?.profilePic;
  }
  getAllOperators(refresh = false) {
    // this.chatService.getAllChatbots(refresh).subscribe((res: any) => {
    //   console.log("All chat",res.data);
    //   this.chatbots = res.data.data;
    //   this.user = this.userService.getUserDetails();
    //   if (res.data.data.length > 0) {
    //     const storedChatbot = localStorage.getItem("selectedChatbot");
    //       if (storedChatbot) {
    //         this.selectedChatbot = JSON.parse(storedChatbot);
    //       } else {
    //         this.selectedChatbot = {
    //           chatbotId: res.data.data.at(-1)?._id,
    //           chatbotName: res.data.data.at(-1)?.themeDetails?.chatbotName,
    //         };
    //         localStorage.setItem(
    //           "selectedChatbot",
    //           JSON.stringify(this.selectedChatbot)
    //         );
    //       }
    //     localStorage.setItem('chatbotPresent', 'true');
    //   } else {
    //     localStorage.setItem('chatbotPresent', 'false');
    //     this.selectedChatbot=null
    //   }
    // });
  }

  startWatchingAppEvents() {
    // this.eventService.events
    //   .pipe(takeUntil(this.$destroyWatching))
    //   .subscribe((e: any) => {
    //     if (e.type === "LOGIN_CHANGE") {
    //       const user_:any = localStorage.getItem('MILO-USER');
    //       const user = JSON.parse(user_);
    //       this.avatar = user?.profilePic;
    //       this.getAllChatbots();
    //       this.isLoggedIn = this.authService.isAuthenticated();
    //     }
    //     if ( e.type === "PROFILE_UPDATED") {
    //       const user_:any = localStorage.getItem('MILO-USER');
    //       const user = JSON.parse(user_);
    //       this.avatar = user?.profilePic;
    //       this.getAllChatbots(true);
    //       this.isLoggedIn = this.authService.isAuthenticated();
    //     }
    //     // if (e.type === 'LOGIN_CHANGE' || e.type === 'PROFILE_UPDATED') {
    //     //   console.log('check app user ', this.user);
    //     //   this.getAllChatbots();
    //     //   this.isLoggedIn = this.authService.isAuthenticated();
    //     //   this.user = this.userService.getUserDetails();
    //     //   const storedChatbot = localStorage.getItem('selectedChatbot');
    //     //   if (storedChatbot) {
    //     //     this.selectedChatbot = JSON.parse(storedChatbot);
    //     //   } else {
    //     //     this.selectedChatbot = this.user?.chatbots[0] ?? null;
    //     //   }
    //     // }
    //   });
  }

  async signOut(): Promise<void> {
    this.isLoggedIn = false;
    // setTimeout(()=>{
    // this.authService.signOut();
    this.router.navigate(["/login"]);
    // },0)
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
