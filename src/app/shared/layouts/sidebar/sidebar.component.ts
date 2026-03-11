import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
} from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import Swal from 'sweetalert2';
import { MenuComponent } from '../menu/menu.component';
import { MENU_ITEMS1 } from '../menu/menu.constants';
import { LogoService } from '../../services/logo.service';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';
import { StorageService } from '../../../_services/storage.service';
interface IMenu {
  menId: number;
  menPath: string;
  menTitle: string;
  menIconType: string;
  type: 'link' | 'sub';
  childrens?: {
    menId: number;
    menPath: string;
    menTitle: string;
  }[];
}
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MenuComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush strategy
})
export class SidebarComponent {
  menuState: { [key: string]: boolean } = {};
  menuIconName = 'panel-right-close';
  menuItems: IMenu[] = [];
  @Input() user: any;
  logoUrl: string = '';
  menuItems_: any[] = [];

  currentUser: any;
  menuItems1: IMenu[] = [];

  ProfilEnum = ProfilEnum;
  constructor(
    private _router: Router,
    private logoService: LogoService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private storageService: StorageService, // Service de stockage pour conserver les menus
  ) {
    // Subscribe to logo changes
    this.logoService.currentLogo$.subscribe((logo) => {
      this.logoUrl = logo;
    });
  }
  ngOnInit(): void {
    const profil = this.storageService.getProfil();
    const storedMenu = this.storageService.getMenuItems(profil!);
    if (storedMenu) {
      this.menuItems = storedMenu; // Charge le menu stocké
    } else {
      this.getMe();
    }
  }

  getMe(): void {
    var profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        if (profil != null) {
          this.currentUser.profil = profil;
        }

        this.filterMenuByProfile(
          this.currentUser.profil as keyof typeof ProfilEnum,
        );
      },
      error: (error) => {
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          error,
        );
      },
    });
  }

  filterMenuByProfile(profil: keyof typeof ProfilEnum) {
    const allowedMenusByProfil: { [key in keyof typeof ProfilEnum]: IMenu[] } =
      {
        PROMOTEUR: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ), // Exclure le Simulateur d’acquisiton
        RESERVATAIRE: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ), // Exclure Tableau de bord
        NOTAIRE: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ),
        ADMIN: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Gestion Vente VEFA' &&
            menu.menTitle !== 'Agenda' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Copropriétaires'
        ),
        AGENCY: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Gestion Vente VEFA' &&
            menu.menTitle !== 'Agenda' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ),
        BANK: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ),
        SYNDIC: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Agenda' &&
            menu.menTitle !== 'Gestion Vente VEFA' &&
            menu.menTitle !== 'Gestion Location' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
        ),
        PROPRIETAIRE: MENU_ITEMS1.filter(
          (menu) =>
            menu.menTitle !== 'Simulateur d’acquisiton' &&
            menu.menTitle !== 'Tableau de bord' &&
            menu.menTitle !== 'Gestion utilisateurs' &&
            menu.menTitle !== 'Copropriétaires' &&
            menu.menTitle !== 'Vue analytique' &&
            menu.menTitle !== 'Gestion Vente VEFA' &&
            menu.menTitle !== 'Agenda' &&
            menu.menTitle !== 'Plan abonnements' &&
            menu.menTitle !== 'Types abonnements' &&
            menu.menTitle !== 'Historiques'&&
            menu.menTitle !== 'Types de biens',
            
            
            
            
        ),
        TENANT: [],
        COPROPRIETAIRE: [],
      };

    this.menuItems = allowedMenusByProfil[profil] || [];

    this.cdr.markForCheck();

    this.storageService.setMenuItems(this.menuItems, profil);
  }

  onViewCompte() {
    this._router.navigate(['/settings/accounts']);
  }
  
  
  
  
}
