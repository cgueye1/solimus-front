import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';
import { StorageService } from '../../../_services/storage.service';

interface IMenu {
  menId: number;
  menPath: string;
  menTitle: string;
  menIconType: string;
  type: 'link' | 'sub';
    menQueryParams?: {
    [key: string]: any;
  };

  childrens?: {
    menId: number;
    menPath: string;
    menTitle: string;
  }[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit {
  @Input() menuItems: IMenu[] = [];
  menuItems1: IMenu[] = [];
  @Input() menuState: { [key: string]: boolean } = {};
  currentUser: any;
  ProfilEnum = ProfilEnum;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  
   // this.getMe(); // Récupération des informations de l'utilisateur
  }

  getMe(): void {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        this.filterMenuItems(); // Filtrer le menu après avoir récupéré l'utilisateur
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      },
    });
  }

  filterMenuItems(): void {
    if (this.currentUser?.profil == this.ProfilEnum.RESERVATAIRE) {
      // Supprime le menu Simulateur d'acquisition si l'utilisateur n'est pas "RESERVATAIRE"
      this.menuItems1 = this.menuItems;
    } 
    
    if (this.currentUser?.profil != this.ProfilEnum.PROMOTEUR  || this.currentUser?.profil != this.ProfilEnum.AGENCY ) {
      this.menuItems1=  this.menuItems1.filter(
        (menu) => menu.menTitle !== 'Tableau de bord'
      );
    }
    this.cdr.markForCheck(); // Marque le composant pour vérification (OnPush)
  }

  isSubMenuActive(menu: IMenu): boolean {
    return (
      menu.childrens?.some((subMenu) =>
        location.pathname.includes(subMenu.menPath)
      ) || false
    );
  }

  toggleSubMenu(menu: IMenu) {
    this.menuState[menu.menPath] = !this.menuState[menu.menPath];
  }

  closeMenuIfNotSubMenu(event: MouseEvent, menu: IMenu) {
    event.stopPropagation();
  }

  logOut(): void {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, me déconnecter',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.storageService.clean();
        this.router.navigate(['/']);
      }
    });
  }
  
  
  isMenuActive(menu: IMenu): boolean {
  const url = this.router.url;

  const hasRentalInUrl = url.includes('rental=true');

  // Gestion Location
  if (menu.menQueryParams?.['rental'] === true) {
    return url.startsWith(menu.menPath) && hasRentalInUrl;
  }

  // Gestion Vente VEFA (par défaut)
  if (!menu.menQueryParams) {
    return url.startsWith(menu.menPath) && !hasRentalInUrl;
  }

  return false;
}

}
