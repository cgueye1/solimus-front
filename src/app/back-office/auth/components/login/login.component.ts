import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  provideRouter,
  Router,
} from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../../../_services/auth.service';
import { StorageService } from '../../../../_services/storage.service';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { FormsModule } from '@angular/forms';
import { APP_ROUTES } from '../../../../app.routes';
import { NavigationService } from '../../../../_services/NavigationService';
import Swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ProfileThemeService } from '../../../../core/services/profile-theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  hide = true;
  form: any = {
    username: null,
    password: null,
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  previousUrl: string | null = null;
  @ViewChild('subscriptionModal') subscriptionModal!: TemplateRef<any>;
  subscriptions: any[] = [];
  private modalRef!: NgbModalRef;

  // Default colors
  defaultPrimaryColor: string = '#0323B4';
  defaultSecondaryColor: string = '#053C5E';

  constructor(
    private router: Router,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private storageService: StorageService,
    private userService: UserService,
    private navigationService: NavigationService,
    private modalService: NgbModal,
    private profileThemeService: ProfileThemeService,
  ) {}

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      // Apply colors based on stored profile if logged in
      const storedProfil = this.storageService.getProfil();
      if (storedProfil) {
        this.profileThemeService.applyProfileTheme(storedProfil);
      }
    }

    this.previousUrl = this.navigationService.getPreviousUrl();
  }

  openModal() {
    this.modalRef = this.modalService.open(this.subscriptionModal, {
      centered: true,
      backdrop: 'static',
      size: 'md',
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onSelectPlan(planName: any) {
    console.log('Plan sélectionné :', planName);
    this.storageService.saveSubPlan(planName);

    // Apply colors for selected plan
    this.profileThemeService.applyProfileTheme(planName);

    this.redirectUser(planName);
    this.closeModal();
  }

  /** Traduction des ENUM en français */
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

  getUser() {
    this.spinner.show();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        if (data.profil == 'ADMIN') {
          this.profileThemeService.applyProfileTheme('ADMIN');
          this.redirectUser('ADMIN');
        } else if (
          data.profil == 'PROMOTEUR' ||
          data.profil == 'RESERVATAIRE' ||
          data.profil == 'NOTAIRE' ||
          data.profil == 'BANK'
        ) {
          this.profileThemeService.applyProfileTheme(data.profil);
            this.storageService.saveSubPlan(data.profil);
          this.redirectUser(data.profil);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Vous n'êtes pas autorisé à vous connecter.",
          });
          this.spinner.hide();
          // this.getSubs(data.id, data.profil);
        }
      },
      error: (err) => {
        console.error(err);
        this.spinner.hide();
      },
    });
  }

  getSubs(id: any, profil: any) {
    const endpoint = `/user-subscriptions/user/${id}`;
    this.spinner.show();

    this.userService.getDatas(endpoint).subscribe({
      next: (data: any[]) => {
        this.subscriptions = data;
        this.spinner.hide();

        if (this.subscriptions.length > 1) {
          // Plusieurs abonnements → ouvrir le modal pour choisir
          this.openModal();
        } else if (this.subscriptions.length === 1) {
          // Un seul abonnement → rediriger directement
          const planName = this.subscriptions[0].subscriptionPlans.name;
          this.storageService.saveSubPlan(planName);
          this.profileThemeService.applyProfileTheme(planName);
          this.redirectUser(planName);
        } else {
          // Aucun abonnement → utiliser le profil par défaut
          this.storageService.saveSubPlan(profil);
          this.profileThemeService.applyProfileTheme(profil);
          this.redirectUser(profil);
        }
      },
      error: (err) => {
        this.spinner.hide();
        // En cas d'erreur, rediriger avec le profil par défaut
        this.storageService.saveSubPlan(profil);
        this.profileThemeService.applyProfileTheme(profil);
        this.redirectUser(profil);
        console.error(err);
      },
    });
  }

  onLogin() {
    /** spinner starts on init */
    this.spinner.show();

    const { username, password } = this.form;

    this.authService.login(username, password).subscribe({
      next: (data) => {
        this.storageService.saveUser(data.user);
        this.storageService.saveToken(data.token);
        this.storageService.saveRefreshToken(data.refreshToken);
        this.spinner.hide();

        if (this.previousUrl && this.previousUrl.includes('detail')) {
          this.router.navigateByUrl(this.previousUrl);
        } else {
          this.getUser();
        }

        this.isLoginFailed = false;
        this.isLoggedIn = true;
      },
      error: (err) => {
        this.spinner.hide();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error.message,
        });

        this.errorMessage = err.error;
        this.isLoginFailed = true;
      },
    });
  }

  onRegister() {
    this.router.navigate(['/auth/register']);
  }

  onForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  redirectUser(profil: keyof typeof ProfilEnum): void {
    this.storageService.setProfil(profil.toString());

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

  reloadPage(): void {
    window.location.reload();
  }
}
