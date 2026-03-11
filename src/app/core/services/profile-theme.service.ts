import { Injectable } from '@angular/core';
import { ThemeService } from '../../shared/services/theme.service';

export interface ProfileTheme {
  primary: string;
  secondary: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileThemeService {
  constructor(private themeService: ThemeService) {}

  // 🔐 Mapping centralisé profil → couleurs
  private readonly profileColors: Record<string, ProfileTheme> = {
    ADMIN: {
      primary: '#2c3e50',
      secondary: '#34495e',
    },
    PROMOTEUR: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
    },
    BANK: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
    AGENCY: {
      primary: '#3498db',
      secondary: '#2980b9',
    },
    NOTAIRE: {
      primary: '#4c1d95',
      secondary: '#8b5cf6',
    },
    RESERVATAIRE: {
      primary: '#14532d' /* vert foncé */,
      secondary: '#22c55e' /* vert clair */,
    },
    SYNDIC: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
    PROPRIETAIRE: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
    LOCATAIRE: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
    PRESTATAIRE: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
    TOM: {
      primary: '#4361ee',
      secondary: '#95a5a6',
    },
  };

  /**
   * 🎯 Applique le thème selon le profil
   */
  applyProfileTheme(profile: string): void {
    const colors = this.profileColors[profile] ?? this.profileColors['TOM'];

    this.themeService.changePrimaryColor(colors.primary);
    this.themeService.changeSecondaryColor(colors.secondary);
  }

  /**
   * 🔎 Récupérer les couleurs sans les appliquer
   */
  getThemeByProfile(profile: string): ProfileTheme {
    return this.profileColors[profile] ?? this.profileColors['TOM'];
  }
}
