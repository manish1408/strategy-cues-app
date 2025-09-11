import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ListingRoutingModule } from './listing-routing.module';
import { ListingComponent } from './listing.component';

@NgModule({
  declarations: [
    ListingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ListingRoutingModule
  ]
})
export class ListingModule { }
