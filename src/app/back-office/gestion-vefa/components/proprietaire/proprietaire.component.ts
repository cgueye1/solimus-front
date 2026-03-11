import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-proprietaire',
  standalone: true,
 imports: [CommonModule],
  templateUrl: './proprietaire.component.html',
  styleUrl: './proprietaire.component.scss'
})
export class ProprietaireComponent {
  @Input() singleLot!: any;
  
  
  getPromoter() {
  return this.singleLot?.rental
    ? this.singleLot?.promoter
    : this.singleLot?.parentProperty?.promoter;
}

}
