import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PropertyDetailsComponent } from './property-details.component';
import { SharedModule } from '../../shared/sharedModule';

const routes: Routes = [
  { path: '', component: PropertyDetailsComponent }
];

@NgModule({
  declarations: [PropertyDetailsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class PropertyDetailsModule {}
