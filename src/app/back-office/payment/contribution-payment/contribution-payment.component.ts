import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../_services/user.service';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-contribution-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen">
      <h2 class="text-xl font-semibold mb-4">Traitement du paiement...</h2>
      <p *ngIf="loading">
        Merci de patienter, redirection vers la plateforme de paiement.
      </p>
      <p *ngIf="!loading && error" class="text-red-500">{{ error }}</p>
    </div>
  `,
})
export class ContributionPaymentComponent implements OnInit {
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const donorId = Number(this.route.snapshot.paramMap.get('donorId'));
    const prescriptionId = Number(
      this.route.snapshot.paramMap.get('prescriptionId')
    );
    const amount = Number(this.route.snapshot.paramMap.get('amount'));

    if (!donorId || !prescriptionId || !amount) {
      this.error = 'Paramètres manquants pour le paiement.';
      this.loading = false;
      return;
    } else {
      this.callTouchPay(
        20,
        '', //email
        '', //pre,om
        '', //nom
        '', //telephone
        `https://wakana.online/pharma-delivery/api/contributions/contribute/${donorId}/${prescriptionId}/${amount}`
      );
      // Récupération des infos utilisateur
      /*this.userService.getDatas(`/v1/user/${userId}`).subscribe({
       next: (user) => {
          this.callTouchPay(
            20,
            user.email,
            user.prenom,
            user.nom,
            '', //telephone
            `https://wakana.online/pharma-delivery/api/delivery-wallet/recharge/${userId}/${amount}`
          );
        },
        error: () => {
          this.error = 'Impossible de récupérer les informations utilisateur.';
          this.loading = false;
        },
      });*/
    }
  }

  callTouchPay(
    amount: number,
    email: string,
    clientFirstName: string,
    clientLastName: string,
    clientPhone: string,
    ipnUrl: string
  ) {
    const currentOrigin = window.location.origin;
    const failedRedirectUrl = `${currentOrigin}/#/settings/accounts`;

    sendPaymentInfos(
      new Date().getTime().toString(),
      'SOLI26685',
      'SJeOJiLKfP2FUHWgTEzhX8Y0km36CwGkbJQTKdplZM3QORfQ6m',
      'solimus.net',
      ipnUrl,
      failedRedirectUrl,
      amount,
      'Dakar',
      email,
      clientFirstName,
      clientLastName,
      clientPhone
    );
  }
}
