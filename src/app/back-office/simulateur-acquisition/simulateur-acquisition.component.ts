import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardBienVerticalComponent } from '../../shared/components/card-bien-vertical/card-bien-vertical.component';
import { FormsModule } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {
  NgbModal,
  NgbTypeaheadModule,
  NgbTypeahead,
  NgbTypeaheadSelectItemEvent,
} from '@ng-bootstrap/ng-bootstrap';
import { ProfilEnum } from '../../enums/ProfilEnum';
import { UserService } from '../../_services/user.service';
import { environment } from '../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-simulateur-acquisition',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardBienVerticalComponent,
    FormsModule,
    NgbTypeaheadModule,
  ],
  templateUrl: './simulateur-acquisition.component.html',
  styleUrl: './simulateur-acquisition.component.scss',
})
export class SimulateurAcquisitionComponent implements OnInit {
  @ViewChild('simulationResultContent') simulationResultContent!: ElementRef;

  IMG_URL: String = environment.fileUrl;
  bienList: any[] = [];
  currentUser: any;
  searchPerformed = false;
  searchQuery: string = '';
  singleBien: any;
  similateResult: any;

  lots: any[] = [];

  pageSize = 12;
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy
  ProfilEnum = ProfilEnum;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  constructor(
    private router: Router,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.getMe();
  }

  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        this.loadMoreLots();
      },
      error: (err) => {
        console.error('Error fetching user:', err);
      },
    });
  }

  simulate() {
    if (this.singleBien) {
      this.spinner.show();
      const endpoint = '/payment-calls/simulate-payments/' + this.singleBien.id;
      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.similateResult = data;
          this.searchPerformed = true;
          this.spinner.hide();
        },
        error: (err) => {
          this.spinner.hide();
          console.error('Error simulating payment:', err);
        },
      });
    }
  }

  calculatePercentage(totalAmount: number, percentage: number): number {
    return (totalAmount * percentage) / 100;
  }

  formatSurface(value: number): string {
    return `${value.toLocaleString('fr-FR')} m²`;
  }

  // Typeahead search function
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2
          ? []
          : this.lots
              .filter((v) => v.name.toLowerCase().includes(term.toLowerCase()))
              .slice(0, 10),
      ),
    );

  // Formatter for the selected item
  formatter = (x: { name: string }) => x.name;

  // Method to handle the search button click
  performSearch(): void {
    this.simulate();
  }

  // Method to handle the selected item from the Typeahead
  onSelect(selectedBien: any): void {
    this.singleBien = selectedBien;
  }

  loadMoreLots() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.lots.length === 0) {
        // First load
      } else {
        this.currentPage = this.currentPage + 1;
      }

      var endpoint = `/realestate/recipient/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`;

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.lots = data.content;
          this.dataEnded = data.last;
        },
        error: (err) => {
          this.loading = false;
          console.error('Error loading lots:', err);
        },
      });
    }
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  /**
   * IMPRESSION DU RÉSULTAT
   */
  printSimulation(): void {
    if (!this.singleBien || !this.similateResult) {
      return;
    }

    const printContent = document.getElementById('simulation-result-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Récupérer les informations du bien
    const bienInfo = this.singleBien;
    const overduePayments = this.similateResult.overduePayments || [];
    const totalAmount = this.formatPrix(this.similateResult.totalAmount);

    // Construire le contenu HTML pour l'impression
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Simulation d'acquisition - ${bienInfo.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #f2f2f2; text-align: left; padding: 8px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #d9534f; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
          .bien-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <h1>Simulation d'acquisition - ${bienInfo.name}</h1>
        
        <div class="bien-info">
          <h3>Informations du bien</h3>
          <p><strong>Nom:</strong> ${bienInfo.name || ''}</p>
          <p><strong>Prix total:</strong> ${this.formatPrix(bienInfo.price) || ''}</p>
          <p><strong>Surface:</strong> ${this.formatSurface(bienInfo.area) || ''}</p>
          <p><strong>Localisation:</strong> ${bienInfo.location || ''}</p>
        </div>

        <h2>Liste des Appels de Fonds Manqués</h2>
        <table>
          <thead>
            <tr>
              <th>Étape</th>
              <th>% Appelé</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${overduePayments
              .map(
                (apf: any) => `
              <tr>
                <td>${apf.label || ''}</td>
                <td>${apf.percentage || 0} %</td>
                <td>${this.formatPrix(this.calculatePercentage(bienInfo.price, apf.percentage))}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <h2>Détails du Paiement</h2>
        <div class="total">
          Montant Total à Verser: ${totalAmount}
        </div>

        <div class="footer">
          Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  /**
   * TÉLÉCHARGEMENT PDF DU RÉSULTAT
   */
  downloadPDF(): void {
    if (!this.singleBien || !this.similateResult) {
      return;
    }

    const bienInfo = this.singleBien;
    const overduePayments = this.similateResult.overduePayments || [];

    // Créer un nouveau document PDF
    const doc = new jsPDF();

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(51, 51, 51);
    doc.text("Simulation d'acquisition", 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(85, 85, 85);
    doc.text(bienInfo.name || '', 14, 30);

    // Ligne de séparation
    doc.setDrawColor(221, 221, 221);
    doc.line(14, 35, 196, 35);

    // Informations du bien
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Informations du bien', 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    doc.text(`Nom: ${bienInfo.name || ''}`, 14, 55);
    doc.text(`Prix total: ${this.formatPrix(bienInfo.price) || ''}`, 14, 62);
    doc.text(`Surface: ${this.formatSurface(bienInfo.area) || ''}`, 14, 69);
    doc.text(`Localisation: ${bienInfo.location || ''}`, 14, 76);

    // Liste des appels de fonds manqués
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Liste des Appels de Fonds Manqués', 14, 90);

    // Tableau des appels de fonds
    const tableData = overduePayments.map((apf: any) => [
      apf.label || '',
      `${apf.percentage || 0} %`,
      this.formatPrix(this.calculatePercentage(bienInfo.price, apf.percentage)),
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Désignation', '% Appelé', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [242, 242, 242], textColor: [51, 51, 51] },
    });

    // Récupérer la position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Détails du paiement
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Détails du Paiement', 14, finalY + 15);

    doc.setFontSize(14);
    doc.setTextColor(217, 83, 79);
    doc.text(
      `Montant Total à Verser: ${this.formatPrix(this.similateResult.totalAmount)}`,
      14,
      finalY + 25,
    );

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(119, 119, 119);
    const dateStr = `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    doc.text(dateStr, 14, 280);

    // Sauvegarder le PDF
    doc.save(`simulation-acquisition-${bienInfo.name || 'bien'}.pdf`);
  }

  formatPrix(montant: number | string): string {
    const value = Number(montant);
    if (!value) {
      return '0 FCFA';
    }

    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  }
  /**
   * CONTACTER LE PROPRIÉTAIRE
   */
  contactProprietaire(): void {
    if (!this.singleBien) {
      return;
    }

    // Récupérer les informations du propriétaire depuis le bien
    const proprietaire = this.singleBien.proprietaire || this.singleBien.owner;

    if (proprietaire) {
      // Si nous avons les coordonnées du propriétaire
      const tel = proprietaire.phone || proprietaire.telephone || '';
      const email = proprietaire.email || '';

      if (tel) {
        // Option 1: Appel téléphonique
        window.location.href = `tel:${tel}`;
      } else if (email) {
        // Option 2: Envoi d'email
        window.location.href = `mailto:${email}?subject=Demande%20d%27information%20concernant%20le%20bien%20${this.singleBien.name}`;
      } else {
        // Option 3: Redirection vers une page de contact
        this.router.navigate(['/contact-proprietaire', this.singleBien.id]);
      }
    } else {
      // Si pas d'info propriétaire, rediriger vers la page de contact générale
      this.router.navigate(['/contact'], {
        queryParams: {
          bien: this.singleBien.id,
          sujet: 'Demande information simulation acquisition',
        },
      });
    }
  }
}
