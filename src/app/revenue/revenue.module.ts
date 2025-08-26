import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RevenueRoutingModule } from './revenue-routing.module';
import { RevenueComponent } from './revenue.component';

@NgModule({
  declarations: [
    RevenueComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RevenueRoutingModule
  ]
})
export class RevenueModule { }
