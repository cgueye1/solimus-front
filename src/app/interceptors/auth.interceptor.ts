
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../_services/auth.service';
import { StorageService } from '../_services/storage.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const storageService = inject(StorageService);

  let authReq = req;
  const token = storageService.getToken();

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + token)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap((data: any) => {
            storageService.saveToken(data.token);
            const newAuthReq = req.clone({
              headers: req.headers.set('Authorization', 'Bearer ' + data.token)
            });
            return next(newAuthReq);
          }),
          catchError((err) => {
            storageService.clean();
            return throwError(err);
          })
        );
      }
      return throwError(error);
    })
  );
};





/*import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../_services/auth.service';
import { StorageService } from '../_services/storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private storageService: StorageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = this.storageService.getToken();
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token)
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token might be expired, try to refresh it
          return this.authService.refreshToken().pipe(
            switchMap((data: any) => {
              this.storageService.saveToken(data.token);
              const newAuthReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + data.token)
              });
              return next.handle(newAuthReq);
            }),
            catchError((err) => {
              // If refreshing the token fails, log out the user
              this.storageService.clean();
              return throwError(err);
            })
          );
        }
        return throwError(error);
      })
    );
  }
}
*/

/*
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
*/