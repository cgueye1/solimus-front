import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ibien } from '../../models/bien-model';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-card-bien-horiz-syndic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-bien-horiz-syndic.component.html',
  styleUrl: './card-bien-horiz-syndic.component.scss',
})
export class CardBienHorizSyndicComponent {
  @Input() data!: any;
  IMG_URL:String =  environment.fileUrl;
  @Output() callback = new EventEmitter<void>();

  onCardClick() {
    this.callback.emit();
  }
  formatSurface(value: number): string {
    return `${value.toLocaleString('fr-FR')} m²`;
  }
  
  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
      
  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
}
