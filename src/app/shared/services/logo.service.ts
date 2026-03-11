import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogoService {
  // Default logo URL
  private defaultLogoUrl: string = 'assets/images/logo-app-white.svg';

  // BehaviorSubject to store the logo URL, initially set to the default logo
  private logoSource = new BehaviorSubject<string>(this.defaultLogoUrl);

  // Observable to allow components to subscribe to logo changes
  currentLogo$ = this.logoSource.asObservable();

  // Method to update the logo
  updateLogo(newLogo: string): void {
    this.logoSource.next(newLogo);
  }

  // Method to restore the logo to the default
  restoreDefaultLogo(): void {
    this.logoSource.next(this.defaultLogoUrl); // Reset the logo to the default one
  }
}
