import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContentRoutingModule } from './content-routing.module';
import { ContentComponent } from './content.component';
import { PhotoDetailsComponent } from './photo-details/photo-details.component';
import { CompetitorReviewsComponent } from './competitor-reviews/competitor-reviews.component';
import { MyReviewsComponent } from './my-reviews/my-reviews.component';
import { AmenitiesAnalyzerComponent } from './amenities-analyzer/amenities-analyzer.component';
import { GalleryModule } from 'ng-gallery';


@NgModule({
  declarations: [
    ContentComponent,
    PhotoDetailsComponent,
    CompetitorReviewsComponent,
    MyReviewsComponent,
    AmenitiesAnalyzerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ContentRoutingModule,
 GalleryModule
]
})
export class ContentModule { }
