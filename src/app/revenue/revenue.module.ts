import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RevenueRoutingModule } from './revenue-routing.module';
import { RevenueComponent } from './revenue.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';
import { NgCircleProgressModule } from 'ng-circle-progress';

@NgModule({
  declarations: [
    RevenueComponent,
    PropertyDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RevenueRoutingModule,

    NgCircleProgressModule.forRoot()
  ]
})
export class RevenueModule { }
