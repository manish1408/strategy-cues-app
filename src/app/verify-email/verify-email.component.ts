import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { NgOtpInputComponent, NgOtpInputConfig } from 'ng-otp-input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent {
  isVideoPlaying = false;
  email!: string;
  isCheckingOTP: boolean = false;
  config: NgOtpInputConfig = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    containerClass: 'd-flex gap-3 justify-content-center align-items-center',
    inputStyles: {
      background: '#ffffff',
      border: '2px solid rgb(180 193 212)',
      'border-radius': '0.5rem',
      'font-weight': '500',
      'margin-bottom': '0',
      'margin-right': '0',
      width: '44px',
      height: '44px',
      'font-size': '16px',
    },
    inputClass: 'otp-input-box',
  };
  @ViewChild('ngOtpInput') ngOtpInputRef!: NgOtpInputComponent;
  code: FormControl = new FormControl(null, {
    validators: [Validators.required, Validators.minLength(6)],
  });
  templateSlug:any
  constructor(
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Verify Email: MiloAssistant.ai');
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      this.email = params['email'];
      this.templateSlug = params['t'];
    });
  }
  playVideo(): void {
    this.isVideoPlaying = true;
  }
  onOtpChange(otp: any) {}
  onSubmit() {
    if (this.code.value.length === 6) {
      this.isCheckingOTP = true;
      const reqObj = {
        otp: this.code.value,
        email: this.email,
      };
        // this.authService
        //   .validateLogin(reqObj)
        //   .pipe(
        //     tap(() => (this.isCheckingOTP = true)),
        //     switchMap((res) => {
        //       if (!res.result) {
        //         this.toastr.error(res.msg);
        //         throw new Error('Login validation failed');
        //       }
        //       this.localStorageService.setItem(
        //         'MILO-USER-TOKEN',
        //         res.data.authToken
        //       );
        //       const userId = res.data.user._id;


        //       return this.authService.onboardUser({ userId }).pipe(
        //         tap((_res) => {
        //           if (_res.result) {
        //             this.localStorageService.setItem(
        //               'MILO-USER',
        //               JSON.stringify(_res.data.user)
        //             );
        //             this.createChatbot(userId)
        //             this.createCustomerOnRazorPay(res.data.user);

        //             this.eventService.dispatchEvent({ type: 'LOGIN_CHANGE' });
        //             this.router.navigate(['/onboard-knowledge'],{ queryParams: { t: this.templateSlug } })
                    
        //           }
        //         })
        //       );
        //     }),
        //     finalize(() => (this.isCheckingOTP = false))
        //   )
        //   .subscribe({
        //     error: (err) => {
        //       this.ngOtpInputRef.otpForm.enable();
        //       if (err.message !== 'Login validation failed') {
        //         this.toastr.error(err.error?.msg ?? 'An error occurred');
        //       }
        //     },
        //   });
    } else {
      this.toastr.error('Code is required');
    }
  }

  createCustomerOnRazorPay(userDetail:any){
    const customerDetail ={
     name: userDetail.name,
     contact: userDetail.phone,
     email: userDetail.email,
     userId:userDetail._id
    }
    // this.razorPaymentService.createCustomer(customerDetail).subscribe({
    //   next: (res) => {
    //     console.log('res: create customer', res);
    //   },
    //   error: (err) => {
    //     console.log(err);
    //   },
    // });

  }

  onResendOTP() {
      const reqObj = {
        email: this.email,
      };
      // this.authService
      //   .resendOtp(reqObj).
      //  subscribe({
      //   next: (res) => {
      //     if (res.result) {
      //       this.toastr.success('Otp sent to your email');
      //     } else {
      //       this.toastr.error(res.msg);
      //     }
      //   },
      //   error: (err) => {
      //     console.log(err);
      //     this.toastr.error(err.error.msg);
      //   },
      //   });
  }

  createChatbot(userId:any) {
      const reqObj = {
        chatbotName: 'Customer Support chatbot',
        chatbotDescription: 'Customer Support chatbot',
        userId: userId,
      };
      // this.chatService
      //   .createChatbot(reqObj)
      //   .subscribe({
      //     next: (res) => {
      //       if (res.result) {
      //         console.log('CratechatbotResult',res)
      //         localStorage.removeItem('selectedChatbot');
      //         this.getChatBotDetails();
      //         this.eventService.dispatchEvent({ type: 'PROFILE_UPDATED' });
      //       } else {
      //         this.toastr.error(res.msg);
      //       }
      //     },
      //     error: (err) => {
      //       console.log(err);
      //       this.toastr.error(err.error.msg);
      //     },
      //   });
  }

  getChatBotDetails() {
    // this.chatService
    //   .getAllChatbots(true,1,10)
    //   .subscribe({
    //     next: (res) => {
    //       if (res) {
        // console.log('this.chatbots: ', res.data.data);
        // if (res.data.data.length > 0) {
        //   const chatbot = {
        //     chatbotId: res?.data?.data[0]?._id,
        //     chatbotName: res?.data?.data[0]?.themeDetails?.chatbotName
        // }
        // localStorage.setItem(
        //   'selectedChatbot',
        //   JSON.stringify(chatbot ?? {})
        // );
        //   localStorage.setItem('chatbotPresent', 'true');
        // } else {
        //   localStorage.setItem('chatbotPresent', 'false');
        // }
      // }
    //   },
    //   error: (err) => {
    //     this.toastr.error(err.error.msg);
    //   },
    // });
  }
}
