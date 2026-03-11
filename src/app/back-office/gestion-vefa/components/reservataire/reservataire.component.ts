import {
  Component,
  Input,
  OnInit,
  LOCALE_ID,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { registerLocaleData, CommonModule } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-reservataire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservataire.component.html',
  styleUrls: ['./reservataire.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class ReservataireComponent implements OnInit {
  indicatifs = [
    { code: '+221', country: 'Sénégal' },
    { code: '+33', country: 'France' },
  ];
  @ViewChild('formUserModal') formUserModal!: TemplateRef<any>; // ng-template référencé ici
  @Input() singleLot!: any;
  @Input() currentuser!: any;
  userForm!: FormGroup;
  isEditMode = false;
  selectedAppelFond: any = {}; // Si tu veux éditer un appel fond spécifique
  public ProfilEnum = ProfilEnum;
  loading: boolean = false;
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private storageService: StorageService,
  ) {
    registerLocaleData(localeFr);
  }

  // Initialisation du formulaire réactif
  initForm() {
    this.userForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      indicatif: ['+221', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.email]],
      profil: [ProfilEnum.RESERVATAIRE],
      adress: ['', Validators.required],
      compagnyName: [''],
    });
  }

  // Appel au modal pour l'édition ou la création
  openFormModal(content: TemplateRef<any>, appelFond: any = null) {
    this.isEditMode = !!appelFond; // Si appelFond existe, mode édition
    this.selectedAppelFond = appelFond ? { ...appelFond } : {}; // Clonage des données pour éviter les références

    // Initialisation du formulaire
    this.initForm();

    // Si nous sommes en mode édition, pré-remplir le formulaire
    if (appelFond) {
      this.userForm.patchValue(appelFond); // Patch avec les données de l'appelFond
    }

    const modalRef = this.modalService.open(content, {
      size: 'md',
      centered: true,
    });

    // Capture de la fermeture du modal
    modalRef.dismissed.subscribe((reason) => {
      // Optionnellement, tu peux ajouter une fonction pour recharger les données ici
    });
  }

  // Fermeture du modal si nécessaire
  closeModal() {
    this.modalService.dismissAll();
  }

  ngOnInit(): void {
    // Initialisation ou récupération des données si nécessaire
    // this.getMe();
  }

  generateRandomPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  onSubmit() {
    const profil = this.storageService.getSubPlan();
    this.spinner.show();
    if (this.userForm.valid) {
      var mdp = this.generateRandomPassword();

      const body = {
        nom: this.userForm.get('nom')?.value,
        prenom: this.userForm.get('prenom')?.value,
        email: this.userForm.get('email')?.value,
        profil: profil === ProfilEnum.PROPRIETAIRE || profil === ProfilEnum.AGENCY?ProfilEnum.TENANT:this.userForm.get('profil')?.value,
        telephone: this.userForm.get('indicatif')?.value +
              this.userForm.get('telephone')?.value,
        adress: this.userForm.get('adress')?.value,
        activated: true,
        compagnyName: this.userForm.get('compagnyName')?.value,
        password: mdp,
        subject: 'Votre compte ',
        html: '',
      };


/*profil === ProfilEnum.PROPRIETAIRE || profil === ProfilEnum.AGENCY
            ? ProfilEnum.TENANT
            :*/
      if (!this.loading) {
        this.loading = true;
        // En mode création
        const endpoint = this.isEditMode
          ? `/v1/auth/reservataire/update/${this.singleLot.id}`
          : `/v1/auth/reservataire/${this.singleLot.id}`;

        if (!this.isEditMode) {
          this.userService
            .saveAnyData(body, `/v1/auth/reservataire/${this.singleLot.id}`)
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
                    html: 'Le réservataire est créé avec succès.',
                    showConfirmButton: false,
                    timer: 2000,
                  }).then(() => {
                    this.loading = false;
                    this.singleLot.recipient = data;
                  });
                  this.spinner.hide();
                  this.closeModal();
                }
              },
              error: (err) => {
                this.loading = false;
                let errorMessage =
                  'Une erreur est survenue. Veuillez réessayer.';
                this.spinner.hide();

                if (err?.error) {
                  errorMessage = err.error.message;
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
        } else {
          this.userService
            .updateAnyData(
              body,
              `/v1/user/update/${this.singleLot.recipient.id}`,
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
                    html: 'Information mise à jour avec succès',
                    showConfirmButton: false,
                    timer: 2000,
                  }).then(() => {
                    this.loading = false;
                    this.singleLot.recipient = data;
                  });
                  this.spinner.hide();
                  this.closeModal();
                }
              },
              error: (err) => {
                this.loading = false;
                let errorMessage =
                  'Une erreur est survenue. Veuillez réessayer.';
                this.spinner.hide();

                if (err?.error) {
                  errorMessage = err.error.message;;
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
      }
    } else {
      this.spinner.hide();
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Le formulaire est invalide.',
      });
    }
  }

  onDelete(): void {
    Swal.fire({
      title: 'Voulez vous vraiment annuler cette réservation ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: "Oui, j'annule",
      cancelButtonText: 'Fermer',
    }).then((result) => {
      if (result.isConfirmed) {
        this.delete();
      }
    });
  }

  delete(): void {
    this.loading = true;
    this.spinner.show();

    const endpoint = `/realestate/cancel/res/${this.singleLot.id}`;

    this.userService.getDatas(endpoint).subscribe({
      next: () => {
        this.loading = false;
        this.spinner.hide();

        Swal.fire({
          icon: 'success',
          html: 'Réservation annulée',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          this.singleLot.recipient = null;
        });
      },
      error: () => {
        this.loading = false;
        this.spinner.hide();

        Swal.fire({
          icon: 'warning',
          html: 'Un problème est survenu',
          showConfirmButton: false,
          timer: 2000,
        });
      },
    });
  }

  onEdit(recipientData: any) {
    this.isEditMode = true;
    this.selectedAppelFond = { ...recipientData };
    this.initForm();

    const fullPhone: string = recipientData.telephone || '';
    const indicatif = this.getIndicatif(fullPhone);
    const phoneWithoutIndicatif = fullPhone.replace(indicatif, '');

    this.userForm.patchValue({
      prenom: recipientData.prenom,
      nom: recipientData.nom,
      telephone: phoneWithoutIndicatif,
      indicatif: indicatif,
      email: recipientData.email,
      adress: recipientData.adress,
      compagnyName: recipientData.compagnyName || '',
    });

    this.modalService.open(this.formUserModal, { size: 'md', centered: true });
  }

  getIndicatif(fullPhone: string): string {
    const indicatifTrouve = this.indicatifs.find((i) =>
      fullPhone.startsWith(i.code),
    );
    return indicatifTrouve ? indicatifTrouve.code : '+221';
  }
}
