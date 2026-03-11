import { CommonModule, Location } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ThemeService } from '../../../shared/services/theme.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InfosPersComponent } from '../components/infos-pers/infos-pers.component';
import { AbonnementsComponent } from '../components/abonnements/abonnements.component';
import { LogoComponent } from '../components/logo/logo.component';
import { FicheRenseignementComponent } from '../components/fiche-renseignement/fiche-renseignement.component';
import { MatTabsModule } from '@angular/material/tabs';
import { UserService } from '../../../_services/user.service';
import { environment } from '../../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProfilEnum } from '../../../enums/ProfilEnum';
import { StorageService } from '../../../_services/storage.service';
import { ProfileThemeService } from '../../../core/services/profile-theme.service';

@Component({
  selector: 'app-mon-compte',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    RouterModule,
    FormsModule,
    InfosPersComponent,
    AbonnementsComponent,
    LogoComponent,
    FicheRenseignementComponent,
    ReactiveFormsModule, // ici
  ],
  templateUrl: './mon-compte.component.html',
  styleUrl: './mon-compte.component.scss',
})
export class MonCompteComponent implements OnInit {
  userForm!: FormGroup;

  compagnyForm!: FormGroup;
  loading: boolean = false;
  IMG_URL: String = environment.fileUrl;
  id: any;
  ProfilEnum = ProfilEnum;
  logo: File | null = null; // Renamed from singleImage to plan
  planPreview: string | null = null;
  legalStatusFile: File | null = null;

  activeTabIndex = 1; // Default to first tab
  // Default colors
  defaultPrimaryColor: string = '#483C32'; // Default primary color (orange)
  defaultSecondaryColor: string = '#053C5E'; // Default secondary color (Columbia blue)

  primaryColor: string = this.defaultPrimaryColor;
  secondaryColor: string = this.defaultSecondaryColor;
  currentUser: any;
  compagny: any;

  subscriptions: any[] = [];
  @ViewChild('formDialog') formDialog!: TemplateRef<any>;

  tabsConfig = [
    { title: 'Informations personnelles' },
    { title: 'Abonnements' },
    { title: 'Logo' },
    { title: 'Fiche de renseignement' },
  ];

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private userService: UserService,
    private location: Location,
    public dialog: NgbModal,
    private storageService: StorageService,
    private themeService: ThemeService,
    private profileThemeService: ProfileThemeService,
  ) {}
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

  ngOnInit(): void {
    this.initColor();
    this.getUser();
    this.initForm();
    this.initFormPasswrd();
  }

  loadUserSubscriptions() {
    this.userService
      .getDatas(`/user-subscriptions/user/${this.currentUser.id}`)
      .subscribe({
        next: (data: any[]) => {
          this.subscriptions = data;
        },
        error: () => console.error('Erreur chargement abonnements'),
      });
  }

  switchProfile(planName: string) {
    this.storageService.saveSubPlan(planName);
    this.storageService.setProfil(planName);
    this.profileThemeService.applyProfileTheme(planName);
    window.location.reload();
  }

  initFormPasswrd() {
    this.userForm = this.fb.group({
      password: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  initForm() {
    this.compagnyForm = this.fb.group({
      name: [''],
      primaryColor: [''],
      secondaryColor: [''],
      logo: [''],
    });
  }

  getUser() {
    this.spinner.show();
    const profil = this.storageService.getSubPlan(); // ex: AGENCY

    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        
        this.currentUser = data;
        if(this.currentUser.profil=="NOTAIRE"){
          this.activeTabIndex=0
        }
     

        if (this.currentUser.profil != 'ADMIN') {
          this.currentUser.profil = profil;
        }

        this.getCompagny();
        this.spinner.hide();
        this.loadUserSubscriptions();
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
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

  getCompagny() {
    const endpoint = '/companies/owner/' + this.currentUser.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.compagny = data;

        if (
          this.currentUser.profil === ProfilEnum.PROMOTEUR ||
          this.currentUser.profil === ProfilEnum.NOTAIRE
        ) {
          //   this.themeService.changePrimaryColor(this. compagny.primaryColor);
          //   this.themeService.changeSecondaryColor(this. compagny.secondaryColor);
        }
      },
      error: (err) => {},
    });
  }

  initColor() {
    // Load saved colors from localStorage or apply defaults
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedSecondaryColor = localStorage.getItem('secondaryColor');

    if (savedPrimaryColor) {
      this.primaryColor = savedPrimaryColor;
    }

    if (savedSecondaryColor) {
      this.secondaryColor = savedSecondaryColor;
    }
  }

  hide = true;
  hideConfirmPassword = true;

  onUpdateInfos() {
    Swal.fire({
      icon: 'success',
      html: 'Informations modifiées avec succès.',
      showConfirmButton: false,
      timer: 1500,
    });
  }

  onUpdatePassword() {
    Swal.fire({
      html: 'Votre mot de passe a été changé avec succès.',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      this.onCloseDialog();
    });
  }

  openModal(): void {
    this.dialog.open(this.formDialog, {
      size: '600px',
    });
  }

  onCloseDialog() {
    this.dialog.dismissAll();
  }

  onReset() {
    this.location.back();
  }

  onPrimaryColorChange(event: any) {
    this.primaryColor = event.target.value;
  }

  onSecondaryColorChange(event: any) {
    this.secondaryColor = event.target.value;
  }

  applyColors() {
    this.themeService.changePrimaryColor(this.primaryColor);
    this.themeService.changeSecondaryColor(this.secondaryColor);
    this.onSave();
  }
  onSave() {
    if (this.compagnyForm.valid && !this.loading) {
      // this.spinner.show();

      const formData = new FormData();
      formData.append('name', this.compagnyForm.get('name')?.value);
      formData.append('primaryColor', this.primaryColor);
      formData.append('secondaryColor', this.secondaryColor);

      // Append the file inputs
      if (this.logo) {
        formData.append('logo', this.logo, this.logo.name);
      }

      if (!this.loading) {
        this.loading = true;
        this.userService
          .updateAnyData(formData, `/companies/${this.compagny.id}`)
          .subscribe({
            next: (data) => {
              this.loading = false;

              /*  this.spinner.hide();
            Swal.fire({
              icon: 'success',
              html: 'Property added successfully.',
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
       
            });*/
            },
            error: (err) => {
              this.loading = false;
              this.spinner.hide();
            },
          });
      }
    } else {
      this.spinner.hide();
    }
  }
  restoreDefaultColors() {
    // Restore default colors
    this.primaryColor = this.defaultPrimaryColor;
    this.secondaryColor = this.defaultSecondaryColor;
    this.applyColors(); // Apply the default colors
  }

  // Handle tab change
  onTabChange(event: number) {
    this.activeTabIndex = event;
  }

  // Get the current tab title
  getTabTitle(): string {
    return this.tabsConfig[this.activeTabIndex].title;
  }

  updatePassword() {
    this.spinner.show();
    if (
      this.userForm.valid &&
      this.userForm.get('newPassword')?.value ===
        this.userForm.get('newPassword')?.value
    ) {
      const body = {
        password: this.userForm.get('password')?.value,
        newPassword: this.userForm.get('newPassword')?.value,
      };

      if (!this.loading) {
        this.loading = true;

        this.userService
          .updateAnyData(
            body,
            `/v1/auth/password/change/${this.currentUser.id}`,
          )
          .subscribe({
            next: (data) => {
              if (data && data.error) {
                this.loading = false;

                Swal.fire({
                  icon: 'error',
                  title: 'Erreur',
                  text: data.error,
                });
                this.spinner.hide();
              } else {
                this.loading = false;
                Swal.fire({
                  icon: 'success',
                  html: 'Votre mot de passe est changé.',
                  showConfirmButton: false,
                  timer: 2000,
                }).then(() => {
                  this.loading = false;
                });
                this.spinner.hide();
                this.dialog.dismissAll();
              }
            },
            error: (err) => {
              this.loading = false;
              let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
              this.spinner.hide();

              if (err?.error) {
                errorMessage = err.error;
              } else if (err?.status === 400) {
                errorMessage =
                  "Les données fournies sont incorrectes ou l'utilisateur existe déjà.";
              }
              this.spinner.hide();

              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: errorMessage,
              });
            },
          });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Le formulaire est invalide.',
      });
    }
  }
}
