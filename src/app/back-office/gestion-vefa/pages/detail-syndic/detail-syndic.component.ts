import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CardBienVerticalComponent } from "../../../../shared/components/card-bien-vertical/card-bien-vertical.component";
import { InfosLotComponent } from "../../components/infos-lot/infos-lot.component";
import { ListAttenteComponent } from "../../components/list-attente/list-attente.component";
import { EtatAvancementComponent } from "../../components/etat-avancement/etat-avancement.component";
import { AppelFondComponent } from "../../components/appel-fond/appel-fond.component";
import { ProprietaireComponent } from "../../components/proprietaire/proprietaire.component";
import { ReservataireComponent } from "../../components/reservataire/reservataire.component";
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { NgxSpinnerService } from 'ngx-spinner';
import { CardBienVerticalSyndicComponent } from '../../../../shared/components/card-bien-vertical-syndic/card-bien-vertical.component';
import { InfosLotSyndicComponent } from '../../components/infos-lot-syndic/infos-lot.component';
import { OwnerListComponent } from '../../components/owner-list-syndic/manifestant-list.component';
import { AppelChargeWorkComponent } from '../../components/appel-charge-work/appel-fond.component';
import { MeetManagementComponent } from '../../components/syndic-meet/syndic-meet.component';

@Component({
  selector: 'app-detail-syndic',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    RouterLink,
   CardBienVerticalSyndicComponent,
     InfosLotSyndicComponent ,
    ListAttenteComponent,
    EtatAvancementComponent,
    AppelFondComponent,

    ProprietaireComponent,
    ReservataireComponent,
    OwnerListComponent ,
     AppelChargeWorkComponent ,
     MeetManagementComponent
  ],
  templateUrl: './detail-syndic.component.html',
  styleUrl: './detail-syndic.component.scss',
})
export class DetailSyndicComponent implements OnInit {
  activeTabIndex = 0; // Default to first tab
  action: string | null = null;
  ProfilEnum = ProfilEnum; 
  nomDuBien = '';
  id: any;
  singleBien:any;
  currentUser:any

  // Tab Configuration: Titles and Button Labels
  tabsConfig = [
    { title: 'Général' },
    { title: 'Propriétaires' },
    { title: 'Appels de charges' },
    { title: 'Réunions' },
    { title: 'Indicateurs' },
    { title: 'Propriétaire' },
    { title: 'Réservataire' },
  ];
  
  tabsConfig1 = [
    { title: 'Général' },
    { title: 'Propriétaires' },
        { title: 'Appels de charges' },
       { title: 'Contrat' },
    { title: 'Réunions' },
    { title: 'Appel de fond' },

    { title: 'Réservataire' },
  ];




  constructor( private spinner: NgxSpinnerService,private location:Location,private router: Router,  private userService: UserService,    private route: ActivatedRoute,) {}
  
  ngOnInit(): void {
    // Récupérer l'action depuis les query params et définir l'onglet actif
    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
     // this.setActiveTabBasedOnAction(this.action);
     
    });
    
   
    this. getMe()
    this. getSingleBien()
  }
  
  getMe() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
       this.currentUser = data
    
      },
      error: err => {
  
  
     
      }
    });
  
  
  }
  
  getSingleBien() {
    this.spinner.show()
    this.id = this.route.snapshot.paramMap.get('dataId');

    const endpoint = "/realestate/details/"+this.id;
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
        
 
       this. singleBien=data.realEstateProperty
       this.spinner.hide()
      },
      error: err => {
  
        this.spinner.hide()
        console.error(err);
      }
    });
  
  
  }
  

  // Définir l'onglet actif en fonction de l'action
  setActiveTabBasedOnAction(action: string | null) {
    switch (action) {
      case 'RESERVER':
        this.activeTabIndex = 1; // Onglet Réservation
        break;
      case 'SUIVI':
        this.activeTabIndex = 2; // Onglet Suivi de l'avancement
        break;
      case 'APPEL_FOND':
        this.activeTabIndex = 3; // Onglet Appel de fond
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
    return this.currentUser .profil===ProfilEnum.PROMOTEUR ? this.tabsConfig1[this.activeTabIndex].title:this.tabsConfig[this.activeTabIndex].title;
  }
}
