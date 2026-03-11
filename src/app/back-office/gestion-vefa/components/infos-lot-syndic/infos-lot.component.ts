import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-infos-lot-syndic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './infos-lot.component.html',
  styleUrl: './infos-lot.component.scss',
})
export class InfosLotSyndicComponent implements OnInit {
  IMG_URL: String = environment.fileUrl;
  currentUser: any;
  ProfilEnum = ProfilEnum;

  selectedMonth: string = '';

  totalCalls: number = 0;
  totalAmount: number = 0;
  collectedAmount: number = 0;
  pendingAmount: number = 0;

  @Input() singleLot!: any;
  constructor(
    private userService: UserService,
    private spinner: NgxSpinnerService
  ) {}
  ngOnInit(): void {
    this.getMe();
    const today = new Date();
    this.selectedMonth = today.toISOString().slice(0, 7); // yyyy-MM
    this.loadStats();
  }

  onMonthChange() {
    this.loadStats();
  }

  loadStats() {
    // Simulations (tu remplaceras par API)

    const endpoint = `/works/property/${this.singleLot.id}/kpi?month=${this.selectedMonth}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.totalCalls = data.totalWorks;
        this.totalAmount = data.totalCharges;
        this.collectedAmount = data.totalCollected;
        this.pendingAmount = data.totalPending;
      },
      error: (err) => {},
    });
  }

  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
      },
      error: (err) => {},
    });
  }

  sold() {
    Swal.fire({
      title:
        this.singleLot.status === 'SOLD'
          ? 'Êtes-vous sûr de vouloir annuler la vente'
          : 'Êtes-vous sûr de vouloir valider la vente',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText:
        this.singleLot.status === 'SOLD' ? "Oui, j'annule" : 'Oui, je valide',
      cancelButtonText: 'Fermer',
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        const endpoint = '/realestate/sold/' + this.singleLot.id;
        this.userService.getDatas(endpoint).subscribe({
          next: (data) => {
            this.singleLot = data;
            this.spinner.hide();
            Swal.fire({
              icon: 'success',
              html:
                this.singleLot.status === 'SOLD'
                  ? 'La vente est validée .'
                  : 'La vente est annulée',
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {});
          },
          error: (err) => {
            this.spinner.hide();
          },
        });
      }
    });
  }

  // this.singleLot=data

  getStatusLot(status: string): { text: string; class: string } {
    switch (status) {
      case 'RESERVED':
        return {
          text: this.singleLot.rental ? 'Loué' : 'Réservé',
          class: 'danger',
        };
      case 'SOLD':
        return { text: 'Vendu', class: 'success' };
      case 'AVAILABLE':
        return { text: 'Disponible', class: 'warning' };
      case null:
        return { text: 'Disponible', class: 'warning' };
      default:
        return { text: 'En attente', class: 'bg-secondary' };
    }
  }
  openPdf() {
    if (this.singleLot.notary.technicalSheet) {
      const url = `${this.IMG_URL}/${this.singleLot.notary.technicalSheet}`;
      window.open(url, '_blank');
    }
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
