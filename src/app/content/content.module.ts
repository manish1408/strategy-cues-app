import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContentRoutingModule } from './content-routing.module';
import { ContentComponent } from './content.component';
import { PhotoDetailsComponent } from './photo-details/photo-details.component';

@NgModule({
  declarations: [
    ContentComponent,
    PhotoDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ContentRoutingModule
  ]
})
export class ContentModule { }
