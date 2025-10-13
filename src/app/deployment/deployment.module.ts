import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DeploymentRoutingModule } from './deployment-routing.module';
import { DeploymentComponent } from './deployment.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { SharedModule } from '../shared/sharedModule';

@NgModule({
  declarations: [
    DeploymentComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DeploymentRoutingModule,
    SharedModule,

    NgCircleProgressModule.forRoot()
  ]
})
export class DeploymentModule { }

