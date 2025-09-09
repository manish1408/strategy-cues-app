import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllOperatorsComponent } from './all-operators.component';

const routes: Routes = [
  {
    path: '',
    component: AllOperatorsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AllOperatorsRoutingModule { }
