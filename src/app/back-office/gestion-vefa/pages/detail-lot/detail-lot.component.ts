import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CardBienVerticalComponent } from '../../../../shared/components/card-bien-vertical/card-bien-vertical.component';
import { InfosLotComponent } from '../../components/infos-lot/infos-lot.component';
import { ListAttenteComponent } from '../../components/list-attente/list-attente.component';
import { EtatAvancementComponent } from '../../components/etat-avancement/etat-avancement.component';
import { AppelFondComponent } from '../../components/appel-fond/appel-fond.component';
import { ProprietaireComponent } from '../../components/proprietaire/proprietaire.component';
import { ReservataireComponent } from '../../components/reservataire/reservataire.component';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { NgxSpinnerService } from 'ngx-spinner';
import { StorageService } from '../../../../_services/storage.service';
import { RentalContractComponent } from '../../components/rental-contract/rental-contract.component';
import { EtatDesLieuxComponent } from '../../components/etat-des-lieux/etat-des-lieux.component';
import { AvisEcheanceComponent } from '../../components/avis-echeance/avis-echeance.component';
import { LocataireComponent } from '../../components/locataire/locataire.component';
import { DocumentListComponent } from '../../components/document-list/document-list.component';

@Component({
  selector: 'app-detail-lot',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    RouterLink,
    CardBienVerticalComponent,
    InfosLotComponent,
    ListAttenteComponent,
    EtatAvancementComponent,
    AppelFondComponent,
    
    ProprietaireComponent,
    ReservataireComponent,
    RentalContractComponent,
    EtatDesLieuxComponent,
    AvisEcheanceComponent,
    LocataireComponent,
    DocumentListComponent,
  ],
  templateUrl: './detail-lot.component.html',
  styleUrl: './detail-lot.component.scss',
})
export class DetailLotComponent implements OnInit {
  activeTabIndex = 0; // Default to first tab
  action: string | null = null;
  ProfilEnum = ProfilEnum;
  nomDuBien = '';
  id: any;
  singleBien: any;
  currentUser: any;

  // Tab Configuration: Titles and Button Labels
  tabsConfig = [
    { title: 'Informations du lot' },
    { title: 'Contrats et Formulaires' },
    { title: 'Appel de fond' },
    { title: 'Liste d’attente' },

    { title: 'Réservataire' },
    { title: 'Indicateurs' },
    { title: 'Propriétaire' },
  ];

  tabsConfigNotaire = [
    { title: 'Informations du lot' },
    { title: 'Contrats et Formulaires' },
    { title: 'Appel de fond' },
    { title: 'Promoteur' },

    { title: 'Réservataire' },
  ];
  tabsConfigR = [
    { title: 'Informations du lot' },
    { title: 'Contrats' },
    { title: 'État des lieux' },
    { title: 'Quitances de loyer' },
    { title: 'Locataire' },
    { title: 'Propriétaire' },
    { title: 'Réservataire' },
  ];

  tabsConfig1 = [
    { title: 'Informations du lot' },
    { title: 'Liste d’attente' },
    { title: 'Contrat' },

    { title: 'Appel de fond' },

    { title: 'Réservataire' },
  ];

  constructor(
    private spinner: NgxSpinnerService,
    private location: Location,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    // Récupérer l'action depuis les query params et définir l'onglet actif
    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
      this.setActiveTabBasedOnAction(this.action);
    });

    this.getMe();
    this.getSingleBien();
  }

  getMe() {
    const profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;

        /* if (profil === 'PROPRIETAIRE') {
          this.currentUser.profil = 'PROMOTEUR';
        } else {
          this.currentUser.profil = profil;
        }*/
      },
      error: (err) => {},
    });
  }

  getSingleBien() {
    this.spinner.show();
    this.id = this.route.snapshot.paramMap.get('dataId');

    const endpoint = '/realestate/details/' + this.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.singleBien = data.realEstateProperty;
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
      },
    });
  }

  // Définir l'onglet actif en fonction de l'action
  setActiveTabBasedOnAction(action: string | null) {
    switch (action) {
      case 'DETAILS':
        this.activeTabIndex = 0; // Onglet Réservation
        break;
      case 'DOCS':
        this.activeTabIndex = 1; // Onglet Suivi de l'avancement
        break;
      case 'APPEL_FOND':
        this.activeTabIndex = 2; // Onglet Appel de fond
        break;
      default:
        this.activeTabIndex = 0; // Par défaut, onglet Informations du lot
    }
  }

  goReturn() {
    this.location.back();
  }

  // Handle tab change
  onTabChange(event: number) {
    this.activeTabIndex = event;
  }

  // Get the current tab title
  getTabTitle(): string {
    if (this.currentUser.profil == 'NOTAIRE') {
      return this.tabsConfigNotaire[this.activeTabIndex].title;
    } else {
      return this.singleBien.rental
        ? this.tabsConfigR[this.activeTabIndex].title
        : this.tabsConfig[this.activeTabIndex].title;
    }
  }
}
