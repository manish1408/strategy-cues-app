import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDropzoneModule } from 'ngx-dropzone';

import { FileManagementRoutingModule } from './file-management-routing.module';
import { FileManagementComponent } from './file-management.component';


@NgModule({
  declarations: [
    FileManagementComponent
  ],
  imports: [
    CommonModule,
    FileManagementRoutingModule,
    FormsModule,
    NgxDropzoneModule
  ]
})
export class FileManagementModule { }
