import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CardLotSelectionComponent } from '../../../../shared/components/card-lot-selection/card-lot-selection.component';
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppelFondSyndicComponent } from '../appel-fond-syndic/appel-fond.component';

@Component({
  selector: 'app-owner-list',
  standalone: true,
  imports: [
    CommonModule,
    CardLotSelectionComponent,
    ReactiveFormsModule,
    AppelFondSyndicComponent,
  ],
  templateUrl: './manifestant-list.component.html',
  styleUrl: './manifestant-list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Suppresses unknown property errors
})
export class OwnerListComponent {
  @Input() singleBien: any;

  indicatifs = [
    { code: '+221', country: 'Sénégal' },
    { code: '+33', country: 'France' },
  ];

  constructor(
    private fb: FormBuilder,
    public modal: NgbModal,

    private userService: UserService,
    private spinner: NgxSpinnerService,
  ) {}
  userForm!: FormGroup;
  isEditMode = false;
  bienList: any[] = [];
  data: any[] = [];
  lots: any[] = [];
  pageSize = 12;
  selectedLotId: number = 0;
  selectedReservationId: number = 0;
  currentIndex: number = 0;
  //lazy loading
  currentPage: number = 0;
  ownerId: number = 0;

  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  currentUser: any;
  ProfilEnum = ProfilEnum;
  selectedAppelFond: any = {}; // Si tu veux éditer un appel fond spécifique

  // Initialisation du formulaire réactif
  initForm() {
    this.userForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      indicatif: ['+221', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.email]],
      profil: [ProfilEnum.COPROPRIETAIRE],
      adress: ['', Validators.required],
      area: ['', Validators.required],
    });
  }

  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
      },
      error: (err) => {},
    });
  }
  ///end lazy
  ngOnInit(): void {
    this.loadMorePropreties();
    this.loadMoreLots();
    this.getMe();
  }

  // Function to handle selected option
  onOptionSelected(optionId: number) {
    this.selectedLotId = optionId;
  }

  getStatusLot(status: string): { text: string; class: string } {
    return status === 'RESERVED'
      ? { text: 'Réservé', class: 'success' }
      : { text: 'Prospect', class: 'warning' };
  }

  openModal(template: any, id: any, index: any) {
    this.ownerId = id;
    this.lots = this.lots.filter(
      (option) =>
        option.status !== 'RESERVED' &&
        option.status !== 'SOLD' &&
        option.id !== this.bienList[index].property.id,
    );

    this.selectedReservationId = id;
    this.currentIndex = index;
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      size: 'xl',
    });
  }

  onSave() {
    if (this.selectedLotId > 0 && this.selectedReservationId > 0) {
      this.send();
    }
  }

  getLotIndexById(id: number): number {
    return this.lots.findIndex((lot) => lot.id === id);
  }
  send() {
    var endpoint = `/reservations/${this.selectedReservationId}`;

    var body = {
      propertyId: this.selectedLotId,
      userId: 0,
    };

    this.userService.updateAnyData(body, endpoint).subscribe({
      next: (data) => {
        this.lots[this.getLotIndexById(this.selectedLotId)] = data.property;
        this.bienList[this.currentIndex] = data;

        this.loadMorePropreties();

        Swal.fire({
          icon: 'success',
          html: 'Information enregistrée avec succès.',
          showConfirmButton: false,
          timer: 2000,
        });
      },
      error: (err) => {
        if (err.error) {
          try {
          } catch {
            //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          // this.offresContent= `Error with status_: ${err}`;
        }
      },
    });
  }

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }

      //  var  endpoint= `/reservations/property/${this.singleBien.id}?page=${this.currentPage}&size=${this.pageSize}`;

      var endpoint = `/v1/user/${this.singleBien.id}/owners`;

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          //this.totalPages=data.totalPages
          this.bienList = data;
          this.loading = false;
          // this.dataEnded = data.last
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.bienList = res.message;
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

  loadMoreLots() {
    this.loading = true;

    if (this.lots)
      if (this.lots.length === 0) {
      } else {
        this.currentPage1 = this.currentPage1 + 1;
      }
    var endpoint = `/realestate/search-by-parent?page=${
      this.currentPage1
    }&size=${200}`;

    var body = {
      parentPropertyId: this.singleBien.id,
    };
    this.userService.saveAnyData(body, endpoint).subscribe({
      next: (data) => {
        this.loading = false;
        this.lots = data.content;
      },
      error: (err) => {
        if (err.error) {
          try {
            this.loading = false;
            const res = JSON.parse(err.error);
            this.bienList = res.message;
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

  /*getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }*/

  ///add Uuer

  onSubmit() {
    this.spinner.show();
    if (this.userForm.valid) {
      var mdp = this.generateRandomPassword();
      const body = {
        nom: this.userForm.get('nom')?.value,
        prenom: this.userForm.get('prenom')?.value,
        email: this.userForm.get('email')?.value,
        profil: this.userForm.get('profil')?.value,
        area: this.userForm.get('area')?.value,
        telephone:
          this.userForm.get('indicatif')?.value +
          this.userForm.get('telephone')?.value,
        adress: this.userForm.get('adress')?.value,
        activated: true,
        compagnyName: this.userForm.get('compagnyName')?.value,
        password: mdp,
        subject: 'Votre compte',
        html: '',
        propretyId: this.singleBien.id,
      };

      if (!this.loading) {
        this.loading = true;
        // En mode création
        const endpoint = this.isEditMode ? `/v1/user/save` : `/v1/user/save`;

        if (!this.isEditMode) {
          this.userService.saveAnyData(body, endpoint).subscribe({
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
                  html: 'Le propriétaire est créé avec succès.',
                  showConfirmButton: false,
                  timer: 2000,
                }).then(() => {
                  this.loading = false;
                });
                this.spinner.hide();
                this.closeModal();
                this.loadMorePropreties();
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
          /* this.userService
            .updateAnyData(
              body,
              `/v1/user/update/${this.singleLot.recipient.id}`
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
            });*/
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

  generateRandomPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
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

    const modalRef = this.modal.open(content, { size: 'md', centered: true });

    // Capture de la fermeture du modal
    modalRef.dismissed.subscribe((reason) => {
      // Optionnellement, tu peux ajouter une fonction pour recharger les données ici
    });
  }

  // Fermeture du modal si nécessaire
  closeModal() {
    this.modal.dismissAll();
  }

  getIndicatif(fullPhone: string): string {
    const indicatifTrouve = this.indicatifs.find((i) =>
      fullPhone.startsWith(i.code),
    );
    return indicatifTrouve ? indicatifTrouve.code : '+221';
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

        this.userService
          .deleteData(`/realestate/${this.singleBien.id}/owners/${data.id}`)
          .subscribe({
            next: (data) => {
              this.loading = false;
            },
          });
        const index = this.bienList.indexOf(data);

        if (index > -1) {
          this.bienList.splice(index, 1);
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
}
