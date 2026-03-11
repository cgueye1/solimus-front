import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isBrowser: boolean;

  constructor() {
    this.isBrowser =
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined';
  }

  // Fonction pour générer une version plus claire ou plus sombre d'une couleur hexadécimale
  private shadeColor(hex: string, percent: number) {
    let f = parseInt(hex.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff;
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1)
    );
  }

  // Appliquer les variantes d'une couleur (10% à 90% plus claires ou plus sombres)
  private applyHexVariants(hexColor: string, cssVarName: string) {
    document.documentElement.style.setProperty(cssVarName, hexColor);

    // Appliquer des variantes de teintes plus sombres (1 à 9)
    for (let i = 1; i <= 9; i++) {
      const darkerShade = this.shadeColor(hexColor, -i / 10); // Couleur plus sombre
      const lighterShade = this.shadeColor(hexColor, i / 10); // Couleur plus claire
      document.documentElement.style.setProperty(
        `${cssVarName}-${i * 10}`,
        lighterShade
      );
    }
  }

  changePrimaryColor(hexColor: string) {
    if (this.isBrowser) {
      this.applyHexVariants(hexColor, '--primary-color');
      localStorage.setItem('primaryColor', hexColor);
    }
  }

  changeSecondaryColor(hexColor: string) {
    if (this.isBrowser) {
      this.applyHexVariants(hexColor, '--secondary-color');
      localStorage.setItem('secondaryColor', hexColor);
    }
  }

  // Charger les couleurs sauvegardées
  loadTheme() {
    if (this.isBrowser) {
      const primaryColor = localStorage.getItem('primaryColor');
      const secondaryColor = localStorage.getItem('secondaryColor');

      if (primaryColor) {
        this.changePrimaryColor(primaryColor);
      }

      if (secondaryColor) {
        this.changeSecondaryColor(secondaryColor);
      }
    }
  }
}
