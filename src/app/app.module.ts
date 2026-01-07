import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { JwtInterceptor } from './_guards/jwt.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { EventService } from './_services/event.service';
import { SharedModule } from './shared/sharedModule';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectDropDownModule } from "ngx-select-dropdown";
import { GALLERY_CONFIG, GalleryConfig } from 'ng-gallery';
import { SummaryPipe } from './summary.pipe';
@NgModule({
  declarations: [AppComponent, SummaryPipe],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    MonacoEditorModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,    
    SharedModule,
    SelectDropDownModule
  ],
  providers: [
    HttpClientModule, 
    EventService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },

      {
        provide: GALLERY_CONFIG,
        useValue: {
          autoHeight: true, 
          imageSize: 'cover'
        } as GalleryConfig
      },

    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
