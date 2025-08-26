import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeploymentRoutingModule } from './deployment-routing.module';
import { DeploymentComponent } from './deployment.component';

@NgModule({
  declarations: [
    DeploymentComponent
  ],
  imports: [
    CommonModule,
    DeploymentRoutingModule
  ]
})
export class DeploymentModule { }
