import { Component, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthenticationService } from "../_services/authentication.service";
import { ToastrService } from "ngx-toastr";
import { NgOtpInputComponent, NgOtpInputConfig } from "ng-otp-input";

@Component({
  selector: "app-change-password",
  templateUrl: "./change-password.component.html",
  styleUrl: "./change-password.component.scss",
})
export class ChangePasswordComponent {
  loading: boolean = false;
  changeForm!: FormGroup;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private toastr: ToastrService
  ) {
    this.changeForm = this.fb.group({
      currentPassword: ["", [Validators.required]],
      newPassword: ["", [Validators.required]],
    });
  }

  ngOnInit(): void {}
  hasError(controlName: keyof typeof this.changeForm.controls) {
    return (
      this.changeForm.controls[controlName].invalid &&
      this.changeForm.controls[controlName].touched
    );
  }
  onSubmit(): void {
    this.changeForm.markAllAsTouched();
    if (this.changeForm.valid) {
      this.loading = true;
      const reqObj = {
        currentPassword: this.changeForm.value.currentPassword,
        newPassword: this.changeForm.value.newPassword,
      };

      // TODO: Implement change password API

      // this.authService
      //   .changePassword(reqObj)
      //   .pipe(finalize(() => (this.loading = false)))
      //   .subscribe({
      //     next: (res) => {
      //       if (res.result) {
      //         this.toastr.success('Password Changed');
      //         this.signOut();
      //       } else {
      //         this.toastr.error(res.msg);
      //       }
      //     },
      //     error: (err) => {
      //       this.toastr.error(err.error.msg);
      //     },
      //   });
    }
  }
  async signOut(): Promise<void> {
    // this.authService.signOut(); // TODO: Implement sign out API
    this.router.navigate(["/login"]);
  }
}
