import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MenuComponent } from '../menu/menu.component';
import { IMenu, MENU_ITEMS1 } from '../menu/menu.constants';
import { LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import Swal from 'sweetalert2';
import { LogoService } from '../../services/logo.service';
import { UserService } from '../../../_services/user.service';
import { environment } from '../../../../environments/environment.prod';
import { StorageService } from '../../../_services/storage.service';

import { ToastrModule, ToastrService } from 'ngx-toastr';

declare var bootstrap: any;

@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    SidebarComponent,
    MenuComponent,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' }, // Définir la locale en français
  ],
  encapsulation: ViewEncapsulation.None,
})
export class MainComponent {
  isNew: boolean = false; // Change to false to hide the badge

  menuState: { [key: string]: boolean } = {};
  menuIconName = 'menu';
  menuItems: IMenu[] = [];
  logoUrl: string = '';
  currentUser: any;
  IMG_URL: String = environment.fileUrl;
  notifications: any[] = [];
  showDropdown = false;

  constructor(
    private logoService: LogoService,
    private _router: Router,
    private renderer: Renderer2,
    private userService: UserService,
    private toastr: ToastrService,
    private storageService: StorageService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    // Subscribe to logo changes
    this.logoService.currentLogo$.subscribe((logo) => {
      this.logoUrl = logo;
    });
    registerLocaleData(localeFr);
  }

  ngOnInit(): void {
    const profil = this.storageService.getProfil();

    const storedMenu = this.storageService.getMenuItems(profil!);
    if (storedMenu) {
      this.menuItems = storedMenu; // Charge le menu stocké
    }

    this.getUser();
  }
  showInfo(message: any) {
    this.toastr.info(message, 'Notification');
  }

  translateProfil(profil: string): string {
    const map: Record<string, string> = {
      PROMOTEUR: 'Promoteur',
      NOTAIRE: 'Notaire',
      RESERVATAIRE: 'Réservataire',
      BANK: 'Banque',
      AGENCY: 'Agence',
      ADMIN: 'Administrateur',
      PROPRIETAIRE: 'Propriétaire',
      SYNDIC: 'Syndic',
      LOCATAIRE: 'Locataire',
      PRESTATAIRE: 'Prestataire',
      TOM: 'Tiers / Autre',
    };

    return map[profil] ?? profil;
  }

  translateProfilEnum(value: string): string {
    const translations: { [key: string]: string } = {
      PROMOTEUR: 'PROMOTEUR',
      NOTAIRE: 'NOTAIRE',
      RESERVATAIRE: 'RÉSERVATAIRE',
      BANK: 'BANQUE',
      AGENCY: 'AGENCE',
      ADMIN: 'ADMINISTRATEUR',
      PROPRIETAIRE: 'PROPRIÉTAIRE',
      SYNDIC: 'SYNDIC',
      LOCATAIRE: 'LOCATAIRE',
      PRESTATAIRE: 'PRESTATAIRE',
      TOM: 'TOM',
    };
    return translations[value] || value.toUpperCase();
  }
  loadNotifications() {
    const endpoint = `/notifications/user/${this.currentUser.id}?page=0&size=20`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        console.log('Données reçues :', data);

        if (data?.content && Array.isArray(data.content)) {
          this.notifications = data.content.map(
            (notification: { createdAt: any }) => {
              console.log('Avant conversion :', notification.createdAt);

              let date: Date | null = null;
              if (
                Array.isArray(notification.createdAt) &&
                notification.createdAt.length >= 3
              ) {
                date = new Date(
                  notification.createdAt[0], // Année
                  notification.createdAt[1] - 1, // Mois (JavaScript commence à 0)
                  notification.createdAt[2], // Jour
                );
              } else if (
                typeof notification.createdAt === 'string' ||
                typeof notification.createdAt === 'number'
              ) {
                date = new Date(notification.createdAt);
              }

              console.log('Après conversion :', date);
              return { ...notification, createdAt: date };
            },
          );

          if (this.notifications.length > 0) {
            const notificationId = this.storageService.getNotification();
            console.log(this.notifications[0].id.toString());
            console.log(notificationId);

            if (
              notificationId !== this.notifications[0].id.toString() &&
              this.notifications[0].status === false
            ) {
              this.isNew = true;
              this.showInfo(this.notifications[0].description);
            } else {
            }
          }
        } else {
          this.notifications = [];
        }
      },
      error: (err) => {
        console.error(err);
        this.notifications = [];
      },
    });
  }
  cl() {
    this.isNew = false;
    this.storageService.saveNotification(this.notifications[0].id.toString());
    this.readNotif(this.notifications[0].id);
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      this.loadNotifications(); // Charge les notifications au moment de l'affichage
    }
  }
  readNotif(id: any) {
    const endpoint = `/notifications/${id}/status?status=${true}`;
    this.userService.updateAnyData({}, endpoint).subscribe({
      next: (data) => {
        console.log(data);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getUser() {
    var profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        console.log(data);
        this.currentUser = data;

        if (profil != null) {
          this.currentUser.profil = profil ;
        }

        this.loadNotifications();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  logOut() {
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, me déconnecterdz',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this._router.navigate(['/auth/login']);
      }
    });
  }

  activeToggle(): void {
    if (window.innerWidth <= 767) {
      const offcanvasElement = document.getElementById('offcanvasSidebar');
      if (offcanvasElement) {
        const bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
        bsOffcanvas.toggle();
      }
    } else {
      const $wrapper = document.querySelector('#wrapper');
      const $sidebar = document.querySelector('#sidebar-wrapper');
      if ($wrapper && $sidebar) {
        $wrapper.classList.toggle('toggled');
        $sidebar.classList.toggle('active');

        // Change icon name based on sidebar state
        // this.menuIconName =
        //   this.menuIconName === "panel_right_open"
        //     ? "panel_right_close"
        //     : "panel_right_open";
      }
    }
  }

  onViewCompte() {
    this._router.navigate(['/settings/accounts']);
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
}
