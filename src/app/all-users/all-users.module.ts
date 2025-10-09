import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AllUsersRoutingModule } from './all-users-routing.module';
import { AllUsersComponent } from './all-users.component';
import { SharedModule } from '../shared/sharedModule';


@NgModule({
  declarations: [
    AllUsersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AllUsersRoutingModule,
    SharedModule
  ]
})
export class AllUsersModule { }

