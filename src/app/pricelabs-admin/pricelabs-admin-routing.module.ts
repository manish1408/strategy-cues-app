import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PricelabsAdminComponent } from './pricelabs-admin.component';

const routes: Routes = [
  {
    path: '',
    component: PricelabsAdminComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PricelabsAdminRoutingModule { }


