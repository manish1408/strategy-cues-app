import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  // HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { LocalStorageService } from '../_services/local-storage.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../_services/authentication.service';
import { AUTHORIZATION_ERROR } from '../constant/shared-constant';

@Injectable()
export class JwtInterceptor {
  constructor(
    private localStorageService: LocalStorageService,
    private authService: AuthenticationService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
      const token = this.localStorageService.getItem('STRATEGY-CUES-USER-TOKEN');

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('err: ', err);
        if (err.error.err_msg === AUTHORIZATION_ERROR || err.status === 401) {
          // this.toastr.error('Token Expired');
          this.authService.signOut(); 
          this.router.navigate(['/signin']);
        }
        return throwError(err);
      })
    );
  }
}
