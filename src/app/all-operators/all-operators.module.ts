import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AllOperatorsRoutingModule } from './all-operators-routing.module';
import { AllOperatorsComponent } from './all-operators.component';


@NgModule({
  declarations: [
    AllOperatorsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AllOperatorsRoutingModule
  ]
})
export class AllOperatorsModule { }
