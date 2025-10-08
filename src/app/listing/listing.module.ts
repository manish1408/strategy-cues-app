import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ListingRoutingModule } from './listing-routing.module';
import { ListingComponent } from './listing.component';

@NgModule({
  declarations: [
    ListingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ListingRoutingModule
  ]
})
export class ListingModule { }
