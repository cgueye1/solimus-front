import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { LucideAngularModule } from 'lucide-angular';
//import { StatusDirective } from '../../../core/directives/statut.directive';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';
import { NgxSpinnerService } from 'ngx-spinner';
import { AbonnementsComponent } from '../../settings/components/abonnements/abonnements.component';

@Component({
  selector: 'app-list-utilisateur',
  standalone: true,
  imports: [
    NgbPaginationModule,
    FormsModule,
    CommonModule,
    AbonnementsComponent,
    // StatusDirective,
    LucideAngularModule,
    ReactiveFormsModule,
  ],
  templateUrl: './list-utilisateur.component.html',
  styleUrl: './list-utilisateur.component.css',
})
export class ListUtilisateurComponent implements OnInit {
  @ViewChild('formUserModal') formUserModal!: TemplateRef<any>; // ng-template référencé ici
  selectedUser: any = null;
  indicatifs = [
    { code: '+221', country: 'Sénégal' },
    { code: '+33', country: 'France' },
  ];
  profils = Object.values(ProfilEnum);
  userForm!: FormGroup;
  isEditMode = false;
  public ProfilEnum = ProfilEnum;
  //
  searchText: string = '';
  selectedProfil: string = '';

  headers: string[] = [
    'Prénom & Nom',
    'Téléphone',
    'Email',
    'Profil',
    'STATUT',
    'ACTIONS',
  ];
  dataList: any[] = [];
  page = 1;
  pageSize = 100;
  collectionSize = this.dataList.length;

  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy

  constructor(
    private router: Router,
    private route: ActivatedRoute,

    private userService: UserService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
  ) {}

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

  onViewUser(user: any, modalRef: any): void {
    this.selectedUser = user;
    if (this.selectedUser && Array.isArray(this.selectedUser.createdAt)) {
      this.selectedUser.createdAt = new Date(
        this.selectedUser.createdAt[0],
        this.selectedUser.createdAt[1] - 1,
        this.selectedUser.createdAt[2],
        this.selectedUser.createdAt[3],
        this.selectedUser.createdAt[4],
        this.selectedUser.createdAt[5],
        this.selectedUser.createdAt[6],
      );
    }
    this.modalService.open(modalRef, { centered: true });
  }

  onViewInvoices(user: any, modalRef: any): void {
    this.selectedUser = user;

    this.modalService.open(modalRef, { centered: true, size: 'lg' }); // grand modal
  }

  // Initialisation du formulaire réactif
  initForm() {
    this.userForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      indicatif: ['+221', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.email]],
      profil: [Validators.required],
      adress: ['', Validators.required],
      compagnyName: [''],
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadMoreUsers();
  }

  onSearch() {
    this.currentPage = 0;
    this.dataEnded = false;
    this.dataList = [];
    this.loadMoreUsers();
  }

  onAddUser() {
    this.router.navigate(['add-utilisateur'], { relativeTo: this.route });
  }

  onEditUser(data: any) {
    this.router.navigate([data.id, 'edit-utilisateur'], {
      relativeTo: this.route,
    });
  }

  onDeleteUser(data: any) {
    Swal.fire({
      title: 'Confirmation',
      text: 'Voulez-vous supprimer cet utilisateur ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(234, 190, 143,1)',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        this.userService.deleteData(`/v1/user/${data.id}`).subscribe({
          next: (data) => {
            this.loading = false;
          },
        });
        const index = this.dataList.indexOf(data);

        if (index > -1) {
          this.dataList.splice(index, 1);
        }

        this.loading = false;
        Swal.fire({
          html: 'utilisateur supprimé',
          icon: 'success',
          timer: 1500,
          showCancelButton: false,
          showConfirmButton: false,
        }).then(() => {});
      }
    });
  }

  formatRoles(roles: {
    canRead: boolean;
    canWrite: boolean;
    canEdit: boolean;
  }): string {
    const roleNames = [];
    if (roles.canRead) roleNames.push('Lecture');
    if (roles.canWrite) roleNames.push('Écriture');
    if (roles.canEdit) roleNames.push('Modification');
    return roleNames.join(', ');
  }

  /* toggleStatus(data: any) {
    const newStatus = data.activated === true ? 'DESACTIVATE' : 'ACTIVATE';
    const confirmationText = newStatus === 'ACTIVATE' ? 'activé' : 'désactivé';

    Swal.fire({
      title: 'Confirmation',
      html: `Voulez-vous vraiment <b>${confirmationText}</b> cet utilisateur ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(234, 190, 143,1)',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        this.userService.updateAnyData({}, `/v1/user/${data.id}`).subscribe({
          next: (data) => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              html: 'Le statut de cet utilisateur a été modifié avec succès.',
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              this.loading = false;
              const index = this.dataList.findIndex(
                (item) => item.id === data.id,
              );
              this.dataList[index] = data;
            });
          },
          error: (err) => {
            if (err.error) {
              try {
                const res = JSON.parse(err.error);
              } catch {
                console.error(
                  "Une erreur s'est produite lors de la mise à jour.",
                );
              }
            } else {
              console.error(
                "Une erreur s'est produite lors de la mise à jour.",
              );
            }
            this.loading = false;
          },
        });
      }
    });
  }*/

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

  loadMoreUsers() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.dataList)
        if (this.dataList.length === 0) {
          console.log('La variable content est vide.');
        } else {
          this.currentPage = this.currentPage + 1;
        }
      var endpoint = `/v1/user/search?keyword=${this.searchText}&profil=${this.selectedProfil}&page=${this.currentPage}&size=${this.pageSize}`;

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.dataList =
            this.searchText == ''
              ? this.dataList.concat(data.content)
              : (this.dataList = data.content);
          this.dataEnded = data.last;
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.dataList = res.message;
            } catch {
              this.loading = false;
              //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.loading = false;
            // this.offresContent= `Error with status_: ${err}`;
          }
        },
      });
    }
  }

  /// gestion
  // Appel au modal pour l'édition ou la création
  openFormModal(content: TemplateRef<any>, user: any = null) {
    this.isEditMode = !!user; // Si appelFond existe, mode édition

    // Initialisation du formulaire
    this.initForm();

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
    this.spinner.show();
    if (this.userForm.valid) {
      var mdp = this.generateRandomPassword();

      const body = {
        nom: this.userForm.get('nom')?.value,
        prenom: this.userForm.get('prenom')?.value,
        email: this.userForm.get('email')?.value,
        profil: this.userForm.get('profil')?.value,
        telephone:
          this.userForm.get('indicatif')?.value +
          this.userForm.get('telephone')?.value,
        adress: this.userForm.get('adress')?.value,
        activated: true,
        compagnyName: this.userForm.get('compagnyName')?.value,
        password: 'P@sser123',
        subject: 'Votre compte ',
        html: '',
      };

      if (!this.loading) {
        this.loading = true;
        // En mode création

        if (!this.isEditMode) {
          this.userService.saveAnyData(body, `/v1/auth/signup`).subscribe({
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
                  this.onSearch();
                });
                this.spinner.hide();
                this.closeModal();
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
        } else {
          this.userService
            .updateAnyData(body, `/v1/user/update/${this.selectedUser.id}`)
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
                  });
                  this.spinner.hide();
                  this.closeModal();
                  this.onSearch();
                }
              },
              error: (err) => {
                this.loading = false;
                let errorMessage =
                  'Une erreur est survenue. Veuillez réessayer.';
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

  onEdit(recipientData: any) {
    this.isEditMode = true;
    this.initForm();
    this.selectedUser = recipientData;

    const fullPhone: string = recipientData.telephone || '';
    const indicatif = this.getIndicatif(fullPhone);
    const phoneWithoutIndicatif = fullPhone.replace(indicatif, '');

    this.userForm.patchValue({
      prenom: recipientData.prenom,
      nom: recipientData.nom,
      telephone: phoneWithoutIndicatif,
      indicatif: indicatif,
      email: recipientData.email,
      profil: recipientData.profil,
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

  toggleStatus(user: any) {
    // Déterminer le nouveau statut
    const newStatus = !user.activated; // si activé = false, on active, sinon on désactive
    const confirmationText = newStatus ? 'activer' : 'désactiver';

    Swal.fire({
      title: 'Confirmation',
      html: `Voulez-vous vraiment <b>${confirmationText}</b> cet utilisateur ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(234, 190, 143,1)',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        // Appel API PUT
        const endpoint = `/v1/user/${user.id}/activation?activated=${newStatus}`;
        this.userService.updateAnyData({}, endpoint).subscribe({
          next: (updatedUser: any) => {
            this.loading = false;

            // Mettre à jour la liste localement
            const index = this.dataList.findIndex(
              (u) => u.id === updatedUser.id,
            );
            if (index > -1) {
              this.dataList[index] = updatedUser;
            }

            Swal.fire({
              icon: 'success',
              html: `L'utilisateur a été <b>${newStatus ? 'activé' : 'désactivé'}</b> avec succès.`,
              showConfirmButton: false,
              timer: 2000,
            });
          },
          error: (err) => {
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Impossible de modifier le statut de l’utilisateur.',
            });
            console.error(err);
          },
        });
      }
    });
  }
}
