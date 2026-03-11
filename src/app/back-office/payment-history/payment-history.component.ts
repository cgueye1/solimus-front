import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.css',
})
export class PaymentHistoryComponent implements OnInit {
  @ViewChild('validationModal') validationModal!: TemplateRef<any>;

  payments: any[] = [];
  loading = false;
  selectedPayment: any;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Recherche
  searchForm!: FormGroup;
  keyword = '';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initSearchForm();
    this.loadPayments();
  }

  /** Initialise le formulaire de recherche */
  initSearchForm(): void {
    this.searchForm = this.fb.group({
      keyword: [''],
    });
  }

  /** Charge la liste des paiements avec pagination et recherche */
  loadPayments(): void {
    this.loading = true;

    let url = `/payments-historics?page=${this.currentPage}&size=${this.pageSize}`;

    if (this.keyword.trim()) {
      url += `&keyword=${encodeURIComponent(this.keyword.trim())}`;
    }

    this.userService.getDatas(url).subscribe({
      next: (response) => {
        this.payments = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement historique:', err);
        this.loading = false;
        Swal.fire(
          'Erreur',
          "Impossible de charger l'historique des paiements",
          'error',
        );
      },
    });
  }

  /** Recherche avec le mot-clé */
  onSearch(): void {
    this.keyword = this.searchForm.get('keyword')?.value || '';
    this.currentPage = 0; // Retour à la première page
    this.loadPayments();
  }

  /** Réinitialise la recherche */
  resetSearch(): void {
    this.searchForm.reset({ keyword: '' });
    this.keyword = '';
    this.currentPage = 0;
    this.loadPayments();
  }

  /** Change de page */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  /** Formate la date depuis le tableau [année, mois, jour, heure, minute, seconde, nano] */
  formatDate(dateArray: any[]): string {
    if (!dateArray || dateArray.length < 6) return '-';

    const [year, month, day, hour, minute, second] = dateArray;
    return new Date(year, month - 1, day, hour, minute, second).toLocaleString(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  }

  /** Formate le nom complet */
  formatFullName(payment: any): string {
    return `${payment.prenom || ''} ${payment.nom || ''}`.trim() || '-';
  }

  /** Ouvre la modal de validation de paiement */
  openValidationModal(payment: any): void {
    this.selectedPayment = payment;
    this.modalService.open(this.validationModal, { centered: true });
  }

  /** Valide un paiement */
  validatePayment(): void {
    if (!this.selectedPayment) return;

    Swal.fire({
      title: 'Valider le paiement ?',
      text: `Confirmez-vous le paiement de ${this.formatFullName(this.selectedPayment)} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#28a745',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        const endpoint = `/payments-historics/validate?userId=${this.selectedPayment.userId}&planId=${this.selectedPayment.planId}`;

        this.userService.updateAnyData({}, endpoint).subscribe({
          next: () => {
            this.loading = false;
            this.modalService.dismissAll();
            Swal.fire('Succès', 'Paiement validé avec succès', 'success');
            this.loadPayments(); // Recharge la liste
          },
          error: (err) => {
            this.loading = false;
            console.error('Erreur validation:', err);
            Swal.fire('Erreur', 'Échec de la validation du paiement', 'error');
          },
        });
      }
    });
  }

  /** Ferme la modal */
  closeModal(): void {
    this.modalService.dismissAll();
    this.selectedPayment = null;
  }

  /** Obtient la classe CSS pour le badge de statut */
  getStatusBadgeClass(paid: boolean): string {
    return paid ? 'bg-success' : 'bg-warning';
  }

  /** Obtient le libellé du statut */
  getStatusLabel(paid: boolean): string {
    return paid ? 'Payé' : 'En attente';
  }

  /** Formate le montant */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  }
}
