import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { StorageService } from './storage.service';

const AUTH_API = environment.apiUrl;

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  withCredentials: true  // Inclure les credentials pour les requêtes CORS
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private storageService: StorageService) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + '/v1/auth/signin',
      {
        email: username,
        password: password,
      },
      httpOptions
    );
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'v1/auth/signup',
      {
        username,
        email,
        password,
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', {}, httpOptions);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.storageService.getRefreshToken();
    if (refreshToken) {
      return this.http.post(
        AUTH_API + '/v1/auth/refresh',
        {
          refreshToken: refreshToken,
        },
        httpOptions
      ).pipe(
        catchError(this.handleError)
      );
    }
    return throwError('No refresh token available');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      // If the error is 401 (Unauthorized), log out the user
      this.storageService.clean();
    }
    return throwError(error);
  }
}
