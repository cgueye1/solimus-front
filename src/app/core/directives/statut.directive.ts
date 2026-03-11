import { Directive, Input, ElementRef } from '@angular/core';

enum Color {
  White = 'rgba(255, 255, 255, 1)',
  DarkGray = 'rgba(75, 72, 72, 1)',
  Orange = 'rgba(247, 144, 9, 1)',
  Yellow = 'rgba(249, 194, 10, 1)',
  Green = 'rgba(10, 151, 72, 1)',
  Red = 'rgba(255, 77, 79, 1)',
  Blue = 'rgba(29, 74, 123, 1)',
}

enum Background {
  LightGray = 'rgba(245, 246, 250, 1)',
  OrangeLight = 'rgba(247, 144, 9, 0.20)',
  YellowLight = 'rgba(249, 194, 10, .20)',
  GreenLight = 'rgba(10, 151, 72, 0.20)',
  RedLight = 'rgba(255, 77, 79, 0.20)',
  BlueLight = 'rgba(29, 74, 123, .20)',
}

interface StatusStyle {
  backgroundColor: Background;
  color: Color;
  text: string;
}

@Directive({
    selector: '[appStatus]',
    standalone: true,
})
export class StatusDirective {
  constructor(private elementRef: ElementRef) { }

  private setStatusStyles(status: string | boolean): StatusStyle {
    switch (status) {
      case 'SOUMISE':
      case 'ENREGISTRER':
      case 'ENREGISTREER':

        return {
          backgroundColor: Background.LightGray,
          color: Color.DarkGray,
          text:
            status === 'SOUMISE'
              ? 'Soumise'
              : status === 'ENREGISTRER'
              ? 'Enregistré'
              : 'Enregistrée',
        };

      case 'REJETER':
      case 'REJETEER':
      case false:
        return {
          backgroundColor: Background.RedLight,
          color: Color.Red,
          text:
             status === false
              ? 'Inactif'
              : status === 'REJETER'
              ? 'Rejeté'
              : 'Rejetée',
        };

      case 'VALIDER':
      case 'VALIDEER':
      case true:
        return {
          backgroundColor: Background.GreenLight,
          color: Color.Green,
          text:
            status === true
              ? 'Actif'
              : status === 'VALIDEER'
              ? 'Validée'
              : 'Validé',
        };

      case 'EN_ATTENTE':
      case 'ENCOURS':
        return {
          backgroundColor: Background.YellowLight,
          color: Color.Yellow,
          text: status === 'ENCOURS' ? 'En cours' : 'En attente',
        };

      default:
        return {
          backgroundColor: Background.LightGray,
          color: Color.DarkGray,
          text: '',
        };
    }
  }

  @Input() set appStatus(status: string | boolean) {
    const statusStyles = this.setStatusStyles(status);
    this.elementRef.nativeElement.style.backgroundColor = statusStyles.backgroundColor;
    this.elementRef.nativeElement.style.color = statusStyles.color;
    this.elementRef.nativeElement.innerHTML = statusStyles.text;
  }
}
