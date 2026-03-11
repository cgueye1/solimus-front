import { CommonModule, registerLocaleData } from '@angular/common';
import {
  Component,
  Input,
  LOCALE_ID,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import localeFr from '@angular/common/locales/fr';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { jsPDF } from 'jspdf'; // Import jsPDF
import { environment } from '../../../../../environments/environment.prod';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule],
  templateUrl: './abonnements.component.html',
  styleUrl: './abonnements.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class AbonnementsComponent implements OnInit {
   @ViewChild('descriptionModal') descriptionModal!: TemplateRef<any>;

  selectedDescription: string = '';
  @ViewChild('plansModal') plansModal!: TemplateRef<any>;
  @Input() currentUser: any;
  abo: any;
  selectedAbo: any;
  installationOptions: number[] = Array.from({ length: 12 }, (_, i) => i + 1); // 1 à 100
  form!: FormGroup; // Déclarez un FormGroup

  pageSize = 12;
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy
  data: any[] = [];
  subscriptionDetails: any = null;
  loadingSubDetails = false;
  invoices: any[] = [];

  //plan d'abonnement

  allPlans: any[] = [];
  plansByName: Record<string, any[]> = {};
  planNames: string[] = [];
  selectedPlanName: string = '';
  // Installation par défaut : 1 = annuelle, 12 = mensuelle
  planInstallments: Record<number, number> = {};

  constructor(
    public modal: NgbModal,
    private userService: UserService,
    private fb: FormBuilder,
    private storageService: StorageService,
    private modalService: NgbModal,
  ) {
    this.form = this.fb.group({
      installmentCount: [
        '',
        [Validators.required, Validators.min(1), Validators.max(12)],
      ],
    }); // Initialiser le FormGroup

    registerLocaleData(localeFr);
  }
  ngOnInit(): void {
    if (this.currentUser) {
      this.loadMoreSubs(); // 👈 Si currentUser est fourni, on ne fait pas l'appel API
      this.loadMoreInvoices();
    } else {
      this.getUser(); // 👈 Sinon on récupère l'utilisateur
    }
  }
  formatPlanName(name: string): string {
    const map: Record<string, string> = {
      PROMOTEUR: 'Promoteur',
      NOTAIRE: 'Notaire',
      RESERVATAIRE: 'Réservataire',
      BANK: 'Banque',
      AGENCY: 'Agence',
      PROPRIETAIRE: 'Propriétaire',
      SYNDIC: 'Syndic',
      LOCATAIRE: 'Locataire',
      PRESTATAIRE: 'Prestataire',
      TOM: 'Autre',
    };

    return map[name] || name;
  }

  // Fonction pour calculer prix dynamique
  getPlanPrice(plan: any): number {
    const installments = this.planInstallments[plan.id] || 1;

    if (installments === 12) {
      // Mode annuel : appliquer réduction annuelle
      const discountRate = plan.yearlyDiscountRate || 0;
      return plan.totalCost * installments * (1 - discountRate / 100);
    } else {
      // Mode mensuel : pas de réduction
      return plan.totalCost * installments;
    }
  }

  toggleInstallment(planId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.planInstallments[planId] = input.checked ? 12 : 1;
  }

  openPlansModal() {
    this.userService.getDatas('/subscriptions-plans').subscribe({
      next: (plans: any[]) => {
        this.allPlans = plans.filter((plan) => plan.active);
        // Initialisation après récupération des plans
        this.allPlans.forEach((plan) => {
          this.planInstallments[plan.id] = 1; // par défaut annuelle
        });

        // Grouper par name
        this.plansByName = this.allPlans.reduce(
          (acc, plan) => {
            if (!acc[plan.name]) acc[plan.name] = [];
            acc[plan.name].push(plan);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // Liste des noms pour les tabs
        this.planNames = Object.keys(this.plansByName);

        if (
          this.subscriptionDetails == null &&
          this.planNames.includes(this.currentUser.profil)
        ) {
          // Profil du user trouvé dans les plans
          this.selectedPlanName = this.currentUser.profil;
        } else {
          // Fallback
          this.selectedPlanName = this.planNames[0];
        }

        // Ouvrir le modal
        this.modalService.open(this.plansModal, { size: 'xl', centered: true });
      },
      error: (err) => console.error('Erreur récupération des plans', err),
    });
  }

  loadMoreInvoices() {
    if (this.loading || this.dataEnded) return;

    this.loading = true;

    const plan = this.storageService.getSubPlan(); // PROMOTEUR, AGENCY, etc.
    const endpoint = `/user-subscriptions/invoices/${this.currentUser.id}/plan/${plan}?page=${this.currentPage}&size=${this.pageSize}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (res) => {
        this.loading = false;

        // pagination
        this.totalPages = res.totalPages;
        this.dataEnded = res.last;

        // concat pour load more
        this.invoices =
          this.currentPage === 0
            ? res.content
            : [...this.invoices, ...res.content];

        this.currentPage++;
      },
      error: (err) => {
        console.error('Erreur chargement factures', err);
        this.loading = false;
      },
    });
  }

  getUserSubscriptionDetails() {
    const profil = this.storageService.getSubPlan(); // ex: AGENCY
    const endpoint = `/user-subscriptions/user/${this.currentUser.id}/plan/${profil}`;

    this.loadingSubDetails = true;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.subscriptionDetails = data;
        this.loadingSubDetails = false;
        console.log('Subscription details:', data);
      },
      error: (err) => {
        console.error('Erreur récupération abonnement', err);
        this.subscriptionDetails = null;
        this.loadingSubDetails = false;
      },
    });
  }

  onInstallationSelect(event: Event) {
    const target = event.target as HTMLSelectElement; // Assurez-vous que target est un élément select
    const installions = Number(target.value); // Convertir la valeur en nombre
    this.form.get('installmentCount')?.setValue(installions);
  }

  getUser() {
    const profil = this.storageService.getSubPlan(); // ex: AGENCY
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        this.currentUser.profil = profil;
        this.getUserSubscriptionDetails();
        this.loadMoreInvoices();
      },
      error: (err) => {},
    });
  }

  formatDate(dateArray: number[]): string {
    if (!dateArray || dateArray.length !== 3) return '-';
    const [year, month, day] = dateArray;
    return `${day.toString().padStart(2, '0')}/${month
      .toString()
      .padStart(2, '0')}/${year}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Payé';
      case 'PENDING':
        return 'En attente';
      case 'EXPIRED':
        return 'Expiré';
      default:
        return status;
    }
  }

  getStatusLot(status: string): { text: string; class: string } {
    return status === 'PAID'
      ? { text: 'Payé', class: 'success' }
      : { text: 'En attente', class: 'warning' };
  }

  openModal(template: any, item: any) {
    this.form.get('installmentCount')?.setValue(item.installmentCount);
    this.selectedAbo = item;
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      // size: 'sm',
    });
  }

  onSave() {
    const endpoint = `/subscriptions/${this.selectedAbo.id}/${
      this.form.get('installmentCount')?.value
    }/process-payment`;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        Swal.fire({
          icon: 'success',
          html: 'Paiement éffectué avec succès.',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          const index = this.data.findIndex(
            (item) => item.id === this.selectedAbo.id,
          );

          if (index !== -1) {
            this.data[index] = data;
          } else {
          }
          this.modal.dismissAll();
        });
      },
      error: (err) => {},
    });
  }

  loadMoreSubs() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.data)
        if (this.data.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }
      var endpoint = `/subscriptions/user/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`;

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.data = data.content;
          this.dataEnded = data.last;
        },
        error: (err) => {
          if (err.error) {
            try {
            } catch {
              this.loading = false;
              //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.loading = false;
            // this.offresContent= `Error with status_: ${err}`;
          }
        },
      });
    }
  }

  //pdf
  // Function to load SVG logo from assets and convert it to PNG base64
  loadLogo(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = './assets/images/logo-app-black.svg'; // Adjust the path if needed
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png')); // Convert to PNG base64
      };
      img.onerror = (error) => reject(error);
    });
  }
  async downloadInvoice(item: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const logoBase64 = await this.loadLogo();

      /* =========================
       HEADER
    ========================== */
      doc.addImage(logoBase64, 'PNG', 10, 10, 50, 15);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURE', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      /* =========================
       INFOS FACTURE
    ========================== */
      const startY = 50;

      doc.text('N° Facture :', 10, startY);
      doc.text(item.invoiceNumber, pageWidth - 10, startY, { align: 'right' });

      doc.text('Date :', 10, startY + 8);
      doc.text(item.createdAt, pageWidth - 10, startY + 8, {
        align: 'right',
      });

      doc.text('Statut :', 10, startY + 16);
      doc.text(
        item.paid ? 'Payée' : 'En attente',
        pageWidth - 10,
        startY + 16,
        { align: 'right' },
      );

      /* =========================
       CLIENT
    ========================== */
      doc.setFont('helvetica', 'bold');
      doc.text('Client', 10, startY + 30);

      doc.setFont('helvetica', 'normal');
      doc.text('Nom :', 10, startY + 38);
      doc.text(item.userName, pageWidth - 10, startY + 38, {
        align: 'right',
      });

      /* =========================
       PLAN & MONTANT
    ========================== */
      doc.setFont('helvetica', 'bold');
      doc.text('Détails de l’abonnement', 10, startY + 55);

      doc.setFont('helvetica', 'normal');
      doc.text('Plan :', 10, startY + 63);
      doc.text(item.planLabel, pageWidth - 10, startY + 63, {
        align: 'right',
      });

      doc.text('Montant :', 10, startY + 71);
      doc.text(`${item.amount | 0} XOF`, pageWidth - 10, startY + 71, {
        align: 'right',
      });

      /* =========================
       FOOTER
    ========================== */
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text('Merci pour votre confiance.', pageWidth / 2, 280, {
        align: 'center',
      });

      doc.text(
        'Document généré automatiquement – Solimus',
        pageWidth / 2,
        286,
        { align: 'center' },
      );

      /* =========================
       SAVE
    ========================== */
      doc.save(`Facture_${item.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Erreur génération facture', error);
    }
  }

  // Close class here

  callTouchPay(
    amount: number,
    email: string,
    clientFirstName: string,
    clientLastName: string,
    clientPhone: string,
    planId: number,
    installmentCount: number,
  ) {
    const currentOrigin = window.location.origin; // récupère le domaine actuel (ex: http://localhost:4200 ou https://app.solimus.net)
    const failedRedirectUrl = `${currentOrigin}/#/settings/accounts`;
    var number = new Date().getTime().toString();

    var data = {
      userId: this.currentUser.id,
      planId: planId,
      amount: amount,
      installmentCount: installmentCount,
      number: number,
    };
    this.onSaveHistory(data);
    sendPaymentInfos(
      number, // order_number
      'SOLI26685', // agency_code
      'SJeOJiLKfP2FUHWgTEzhX8Y0km36CwGkbJQTKdplZM3QORfQ6m', // secure_code
      'solimus.net', // domain_name
      `${environment.apiUrl}/user-subscriptions/create/${this.currentUser.id}/${planId}/${installmentCount}`, // url_redirection_success
      failedRedirectUrl, // url_redirection_failed
      1, // amount dynamique
      'Dakar', // city
      email, // email dynamique
      clientFirstName, // prénom dynamique
      clientLastName, // nom dynamique
      clientPhone, // téléphone dynamique
    );
  }

  onPay() {
    /* this.callTouchPay(
      this.selectedAbo.subscriptionPlan.totalCost *
        this.form.get('installmentCount')?.value, // amount
      `${this.currentUser.email} `, // email
      `${this.currentUser.prenom}`, // clientFirstName
      `${this.currentUser.nom}`, // clientLastName
      ``, // clientPhone
      this.selectedAbo.id, // subscriptionId
      this.form.get('installmentCount')?.value, // installmentCount
    );*/
  }

  renewSubscription() {}

  selectPlan(plan: any) {
    const installments = this.planInstallments[plan.id] || 1;
    const price = this.getPlanPrice(plan);
    this.callTouchPay(
      price, // amount
      `${this.currentUser.email} `, // email
      `${this.currentUser.prenom}`, // clientFirstName
      `${this.currentUser.nom}`, // clientLastName
      ``, // clientPhone
      plan.id, // subscriptionId
      installments, // installmentCount
    );
    console.log('Plan choisi :', {
      planId: plan.id,
      installments,
      price,
    });
  }

  onSaveHistory(data: any) {
    const endpoint = `/payments-historics`;

    this.userService.saveAnyData(data, endpoint).subscribe({
      next: (data) => {},
      error: (err) => {},
    });
  }
  
  
  
  
  /** Affiche la description complète dans une modal */
  showFullDescription(description: string): void {
    this.selectedDescription = description;
    this.modalService.open(this.descriptionModal, {
      centered: true,
      size: 'lg',
      scrollable: true,
    });
  }

  safeText(text: string): string {
    if (!text) return '';

    return (
      text
        // vrais retours à la ligne
        .replace(/\r\n|\n|\r/g, '<br>')

        // faux retours "nn" MAIS SEULEMENT quand ils séparent des phrases
        .replace(/\.nn/g, '.<br><br>')
        .replace(/nn\s*-/g, '<br>-')

        .trim()
    );
  }
}
