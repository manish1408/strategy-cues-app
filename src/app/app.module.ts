import { NgModule, importProvidersFrom } from '@angular/core';
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
// import { SharedPipesModule } from './_pipes/shared.pipe';
import { ReactiveFormsModule } from '@angular/forms';
// import 'event-source-polyfill';
import { SelectDropDownModule } from "ngx-select-dropdown";
@NgModule({
  declarations: [AppComponent],
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
    ReactiveFormsModule,    
    SharedModule,
    // SharedPipesModule,
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
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
