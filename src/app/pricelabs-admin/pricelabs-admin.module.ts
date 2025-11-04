import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgCircleProgressModule } from 'ng-circle-progress';

import { PricelabsAdminRoutingModule } from './pricelabs-admin-routing.module';
import { PricelabsAdminComponent } from './pricelabs-admin.component';
import { SharedModule } from '../shared/sharedModule';

@NgModule({
  declarations: [
    PricelabsAdminComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PricelabsAdminRoutingModule,
    SharedModule,
    NgCircleProgressModule.forRoot()
  ]
})
export class PricelabsAdminModule { }


