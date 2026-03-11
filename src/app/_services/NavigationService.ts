import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private previousUrl: string | null = null;
  private currentUrl: string | null = null;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.previousUrl = this.currentUrl; // On enregistre l'ancienne URL
        this.currentUrl = event.url; // On met à jour l'URL actuelle
      }
    });
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}
