import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VerifyEmailRoutingModule } from './verify-email-routing.module';
import { VerifyEmailComponent } from './verify-email.component';
import { NgOtpInputModule } from 'ng-otp-input';

@NgModule({
  declarations: [VerifyEmailComponent],
  imports: [CommonModule, VerifyEmailRoutingModule, NgOtpInputModule],
})
export class VerifyEmailModule {}
