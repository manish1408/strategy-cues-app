import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileManagementComponent } from './file-management.component';

const routes: Routes = [{ path: '', component: FileManagementComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FileManagementRoutingModule { }
