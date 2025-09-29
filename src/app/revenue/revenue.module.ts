import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RevenueRoutingModule } from './revenue-routing.module';
import { RevenueComponent } from './revenue.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { SharedModule } from '../shared/sharedModule';

@NgModule({
  declarations: [
    RevenueComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RevenueRoutingModule,
    SharedModule,

    NgCircleProgressModule.forRoot()
  ]
})
export class RevenueModule { }
