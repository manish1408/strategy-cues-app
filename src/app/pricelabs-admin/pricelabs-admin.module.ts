import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PricelabsAdminRoutingModule } from './pricelabs-admin-routing.module';
import { PricelabsAdminComponent } from './pricelabs-admin.component';

@NgModule({
  declarations: [
    PricelabsAdminComponent
  ],
  imports: [
    CommonModule,
    PricelabsAdminRoutingModule
  ]
})
export class PricelabsAdminModule { }


