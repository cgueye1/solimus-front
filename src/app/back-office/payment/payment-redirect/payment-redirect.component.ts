import {
  Component,
  LOCALE_ID,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, registerLocaleData } from '@angular/common';
import { UserService } from '../../../_services/user.service';
import { environment } from '../../../../environments/environment.prod';
import localeFr from '@angular/common/locales/fr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-payment-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-redirect.component.html',
  styleUrl: './payment-redirect.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class PaymentRedirectComponent implements OnInit {
  @ViewChild('descriptionModal') descriptionModal!: TemplateRef<any>;

  selectedDescription: string = '';
  loader = true;
  error = '';

  //plan d'abonnement

  allPlans: any[] = [];
  plansByName: Record<string, any[]> = {};
  planNames: string[] = [];
  selectedPlanName: string = '';
  // Installation par défaut : 1 = annuelle, 12 = mensuelle
  planInstallments: Record<number, number> = {};
  profil: any;
  userId: any;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private modalService: NgbModal,
  ) {
    registerLocaleData(localeFr);
  }

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'));
    this.profil = this.route.snapshot.paramMap.get('profil');

    if (!this.userId || !this.profil) {
      this.error = 'Paramètres manquants pour le paiement.';
      this.loader = false;
      return;
    } else {
      this.getPlans();
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

  getPlans() {
    this.loader = true;
    this.userService.getDatas('/subscriptions-plans').subscribe({
      next: (plans: any[]) => {
        this.loader = false;
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
        this.selectedPlanName = this.profil;
        /*if (this.profil == null ) {
          
          // Profil du user trouvé dans les plans
          this.selectedPlanName = this.profil;
        } else {
        
          // Fallback
          this.selectedPlanName = this.planNames[0];
        }*/

        // Ouvrir le modal
        //   this.modalService.open(this.plansModal, { size: 'xl', centered: true });
      },
      error: (err) => {
        this.loader = true;
      },
    });
  }

  selectPlan(plan: any) {
    const installments = this.planInstallments[plan.id] || 1;
    const price = this.getPlanPrice(plan);
    this.callTouchPay(
      price, // amount
      ` `, // email
      ``, // clientFirstName
      ``, // clientLastName
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
    const failedRedirectUrl = `https://www.solimus.sn`;

    var number = new Date().getTime().toString();

    var data = {
      userId: this.userId,
      planId: planId,
      amount: amount,
      installmentCount: installmentCount,
      number: number,
    };
    this.onSaveHistory(data);
    sendPaymentInfos(
      new Date().getTime().toString(), // order_number
      'SOLI26685', // agency_code
      'SJeOJiLKfP2FUHWgTEzhX8Y0km36CwGkbJQTKdplZM3QORfQ6m', // secure_code
      'solimus.net', // domain_name
      `${environment.apiUrl}/user-subscriptions/create/${this.userId}/${planId}/${installmentCount}`, // url_redirection_success
      failedRedirectUrl, // url_redirection_failed
      amount, // amount dynamique
      'Dakar', // city
      email, // email dynamique
      clientFirstName, // prénom dynamique
      clientLastName, // nom dynamique
      clientPhone, // téléphone dynamique
    );
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
