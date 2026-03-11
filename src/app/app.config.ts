import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import {
  bootstrapApplication,
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Route, RouterModule } from '@angular/router';
import { APP_ROUTES } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './interceptors/auth.interceptor';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';
import { AppComponent } from './app.component';

export const appConfig: ApplicationConfig = {
  providers: [
    
    provideRouter(APP_ROUTES ),
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      ReactiveFormsModule,
      RouterModule.forRoot(APP_ROUTES, {
        useHash: true,
        scrollOffset: [0, 0],
        scrollPositionRestoration: 'enabled',
      }),
      ToastrModule.forRoot({
        positionClass: 'toast-top-right', // Positionner à droite en haut
        timeOut: 6000, // Temps de visibilité du toast (en ms)
        progressBar: true, // Afficher une barre de progression
        closeButton: true, // Ajouter un bouton pour fermer le toast
      }),
      NgbModule
    ),
    { provide: LOCALE_ID, useValue: 'fr-FR'},

    
    provideClientHydration(),
    provideAnimationsAsync(),
    provideHttpClient(  withFetch(),withInterceptorsFromDi(),withInterceptors([authInterceptor])),
   

    provideAnimationsAsync(), provideAnimationsAsync(), provideAnimationsAsync(),    CurrencyPipe // Ajoutez le DecimalPipe ici

  ],
};
