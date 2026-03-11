import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';
import { StorageService } from '../../../_services/storage.service';

@Component({
  selector: 'app-menu-portail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-portail.component.html',
  styleUrl: './menu-portail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MenuPortailComponent implements OnInit {
  @Input() isDark: boolean = false;
  isScrolled: boolean = false;
  currentUser: any;

  logoWhite = 'assets/images/logo-app-white.svg';
  logoDark = 'assets/images/logo-app-black.svg';
  constructor(
    private userService: UserService,
    private router: Router,
    private storageService: StorageService,
  ) {}
  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const menuBtn = document.getElementById('menu-btn');
      const navLinks = document.getElementById('nav-links');
      const menuBtnIcon = menuBtn!.querySelector('i');

      menuBtn!.addEventListener('click', () => {
        if (!navLinks || !menuBtnIcon) {
          console.error('Menu button or navigation links not found');
          return;
        }

        // Toggle the 'open' class for navigation links
        navLinks.classList.toggle('open');

        // Toggle the icon text between 'menu' and 'close'
        const isOpen = navLinks.classList.contains('open');
        menuBtnIcon.textContent = isOpen ? 'close' : 'menu';
      });

      navLinks!.addEventListener('click', () => {
        navLinks!.classList.remove('open');
        menuBtnIcon!.setAttribute('class', 'menu');
      });
    }
    this.getUser();
  }

  getUser() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    // Set the scroll threshold, e.g., 100px
    if (scrollPosition > 100) {
      this.isScrolled = true;
    } else {
      this.isScrolled = false;
    }
  }

  monCompt() {
     this.router.navigate(['/auth/login']);
    /*if (this.currentUser) {
      if (this.currentUser.profil == 'ADMIN') {
        this.redirectUser('ADMIN');
      } else {
        const profil = this.storageService.getSubPlan();

        if (profil) {
          this.redirectUser(profil);
        }
      }
    } else {
      this.router.navigate(['/auth/login']);
    }*/
  }
  redirectUser(profil: any): void {
    switch (profil) {
      case 'ADMIN':
        this.router.navigate(['/dashbord-admin']);
        break;
      case 'PROMOTEUR':
        this.router.navigate(['/dashboard']);
        break;
      case 'BANK':
        this.router.navigate(['/gestion-vente-vefa']);
        break;
      case 'AGENCY':
        this.router.navigate(['/gestion-vente-vefa'], {
          queryParams: { rental: true },
        });
        break;
      case 'NOTAIRE':
        this.router.navigate(['/gestion-vente-vefa']);
        break;
      case 'RESERVATAIRE':
        this.router.navigate(['/gestion-vente-vefa']);
        break;

      case 'SYNDIC':
        this.router.navigate(['/gestion-syndic']);
        break;
      case 'PROPRIETAIRE':
        this.router.navigate(['/gestion-vente-vefa'], {
          queryParams: { rental: true },
        });
        break;

      default:
        break;
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
