import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenueComponent } from './revenue.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';

const routes: Routes = [
  { path: '', component: RevenueComponent },
  { path: 'details/:id', component: PropertyDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RevenueRoutingModule { }
