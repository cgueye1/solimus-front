import { Injectable } from '@angular/core';
import { IMenu } from '../shared/layouts/menu/menu.constants';

const USER_KEY = 'auth-user';
const TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'auth-refresh-token';

const NOTIFICATION = 'solimus_notification';

const CURRENT_SUB_PLAN = 'solimus_current_sub_plan';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  clean(): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(USER_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      window.sessionStorage.removeItem(CURRENT_SUB_PLAN);
      window.sessionStorage.removeItem('vefa_profil');

      window.sessionStorage.clear();
      localStorage.clear();
    }
  }

  public saveUser(user: any): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(USER_KEY);
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  public saveSubPlan(planName: string): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(CURRENT_SUB_PLAN);
      window.sessionStorage.setItem(CURRENT_SUB_PLAN, planName);
    }
  }
  public saveToken(token: string): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  public saveRefreshToken(refreshToken: string): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  public getUser(): any {
    if (this.isBrowser()) {
      const user = window.sessionStorage.getItem(USER_KEY);
      if (user) {
        return JSON.parse(user);
      }
    }
    return null;
  }

  public getToken(): string | null {
    if (this.isBrowser()) {
      return window.sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  public getSubPlan(): string | null {
    if (this.isBrowser()) {
      return window.sessionStorage.getItem(CURRENT_SUB_PLAN);
    }
    return null;
  }
  public getRefreshToken(): string | null {
    if (this.isBrowser()) {
      return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Sauvegarder les éléments de menu
  setMenuItems(menuItems: IMenu[], profil: String) {
    localStorage.setItem('vefa_menuItems_' + profil, JSON.stringify(menuItems));

    if (this.isBrowser()) {
      window.sessionStorage.removeItem('vefa_menuItems_' + profil);
      window.sessionStorage.setItem(
        'vefa_menuItems_' + profil,
        JSON.stringify(menuItems),
      );
    }
  }

  // Récupérer les éléments de menu
  getMenuItems(profil: String): IMenu[] | null {
    const menuItems = localStorage.getItem('vefa_menuItems_' + profil);
    return menuItems ? JSON.parse(menuItems) : null;
  }

  // Sauvegarder les éléments de profil
  setProfil(profil: string) {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem('vefa_profil');
      window.sessionStorage.setItem('vefa_profil', profil);
    }
  }

  // Récupérer les éléments de profil
  getProfil(): string | null {
    if (this.isBrowser()) {
      return window.sessionStorage.getItem('vefa_profil');
    }
    return null;
  }

  public saveNotification(idNot: string): void {
    if (this.isBrowser()) {
      window.sessionStorage.removeItem(NOTIFICATION);
      window.sessionStorage.setItem(NOTIFICATION, idNot);
    }
  }

  public getNotification(): string | null {
    if (this.isBrowser()) {
      return window.sessionStorage.getItem(NOTIFICATION);
    }
    return null;
  }
}
