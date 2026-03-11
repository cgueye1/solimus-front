import { CommonModule, registerLocaleData } from '@angular/common';
import {
  Component,
  Input,
  LOCALE_ID,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import localeFr from '@angular/common/locales/fr';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../../../environments/environment.prod';

@Component({
  selector: 'app-rental-contract',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rental-contract.component.html',
  styleUrl: './rental-contract.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class RentalContractComponent implements OnInit {
  @Input() singleLot!: any;
  @ViewChild('fileInput') fileInput!: ElementRef;

  contracts: any[] = [];
  public ProfilEnum = ProfilEnum;
  loading: boolean = false;
  file: File | null = null;
  fileName: string = '';
  IMG_URL: String = environment.fileUrl;
  pageSize = 5;
  page = 0;

  selectedContract: any = {};
  isEditMode = false;
  hideActions = false;
  action: string | null = null;
  currentuser: any;

  activeTab: 'ACTIVE' | 'ARCHIVED' = 'ACTIVE';
  activeCount = 0;
  archivedCount = 0;

  // Formulaire réactif
  contractForm!: FormGroup;

  // Propriété pour la date du jour dans le template
  todayDate: string = '';

  constructor(
    public modal: NgbModal,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
  ) {
    registerLocaleData(localeFr);
  }

  ngOnInit(): void {
    this.initForm();
    this.todayDate = this.formatDateForInput(new Date());

    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
      if (this.action === 'DETAILS') {
        this.hideActions = true;
      }
    });
    this.getMe();
    this.getContracts();
  }

  initForm() {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    this.contractForm = this.fb.group({
      startDate: [this.formatDateForInput(today), [Validators.required]],
      endDate: [this.formatDateForInput(nextYear), [Validators.required]],
    });
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD pour l'input date
  }

  changeTab(status: 'ACTIVE' | 'ARCHIVED') {
    if (this.activeTab === status) return;
    this.activeTab = status;
    this.page = 0;
    this.getContracts();
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentuser = data;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeTabParent'] && !changes['activeTabParent'].firstChange) {
      this.getContracts();
    }
  }

  // Gestionnaire pour le drag & drop
  handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // Upload de fichier avec gestion améliorée
  onUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  // Traitement du fichier (validation)
  processFile(file: File) {
    // Vérification du type de fichier
    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        html: 'Seuls les fichiers PDF sont acceptés.',
        showConfirmButton: false,
        timer: 2000,
      });
      this.resetFileInput();
      return;
    }

    // Vérification de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        html: 'Le fichier ne doit pas dépasser 10 Mo.',
        showConfirmButton: false,
        timer: 2000,
      });
      this.resetFileInput();
      return;
    }

    this.file = file;
    this.fileName = file.name;
  }

  // Supprimer le fichier sélectionné
  removeFile() {
    this.file = null;
    this.fileName = '';
    this.resetFileInput();
  }

  // Réinitialiser l'input file
  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  openModal(template: any, item: any) {
    this.selectedContract = item;
    this.removeFile(); // Réinitialiser le fichier à chaque ouverture
    this.initForm(); // Réinitialiser le formulaire
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      size: 'lg',
      backdrop: 'static',
    });
  }

  openFile(contractFile: any) {
    const url = `${this.IMG_URL}/${contractFile}`;
    window.open(url, '_blank');
  }

  // Validation des dates
  validateDates(): boolean {
    const startDate = new Date(this.contractForm.get('startDate')?.value);
    const endDate = new Date(this.contractForm.get('endDate')?.value);

    if (endDate <= startDate) {
      Swal.fire({
        icon: 'error',
        html: 'La date de fin doit être postérieure à la date de début.',
        showConfirmButton: false,
        timer: 3000,
      });
      return false;
    }
    return true;
  }

  // Ajout d'un nouveau contrat
  onSaveContract() {
    if (this.contractForm.invalid) {
      Swal.fire({
        icon: 'warning',
        html: 'Veuillez remplir tous les champs obligatoires.',
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    if (!this.file) {
      Swal.fire({
        icon: 'warning',
        html: 'Veuillez sélectionner un fichier de contrat.',
        showConfirmButton: false,
        timer: 2000,
      });
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    const formData = new FormData();
    formData.append('propertyId', this.singleLot.id.toString());
    formData.append('recipientId', this.singleLot.recipient.id.toString());

    const startDate = this.formatDateForApi(
      new Date(this.contractForm.get('startDate')?.value),
    );
    const endDate = this.formatDateForApi(
      new Date(this.contractForm.get('endDate')?.value),
    );

    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('contractFile', this.file, this.file.name);

    if (!this.loading) {
      this.loading = true;
      this.spinner.show();

      this.userService.saveFormData(formData, '/rental-contracts').subscribe({
        next: (data) => {
          this.loading = false;
          this.spinner.hide();
          Swal.fire({
            icon: 'success',
            html: 'Contrat ajouté avec succès.',
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            this.modalService.dismissAll();
            this.removeFile();
            this.getContracts();
          });
        },
        error: (err) => {
          console.error('Error during saving:', err);
          this.loading = false;
          this.spinner.hide();
          Swal.fire({
            icon: 'error',
            html: "Erreur lors de l'ajout du contrat.",
            showConfirmButton: false,
            timer: 2000,
          });
        },
      });
    }
  }

  // Archiver un contrat
  archiveContract(contractId: number) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Voulez-vous archiver ce contrat ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, archiver!',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.userService
          .updateAnyData({}, `/rental-contracts/${contractId}/archive`)
          .subscribe({
            next: (data) => {
              this.spinner.hide();
              Swal.fire({
                icon: 'success',
                html: 'Contrat archivé avec succès.',
                showConfirmButton: false,
                timer: 2000,
              }).then(() => {
                this.getContracts();
              });
            },
            error: (err) => {
              console.error('Error during archiving:', err);
              this.spinner.hide();
              Swal.fire({
                icon: 'error',
                html: "Erreur lors de l'archivage.",
                showConfirmButton: false,
                timer: 2000,
              });
            },
          });
      }
    });
  }

  // Récupérer les contrats - CORRIGÉ
  getContracts() {
 

    if (this.singleLot.recipient != null) {
         this.loading = true;
      let endpoint = '';

      if (this.activeTab === 'ACTIVE') {
        endpoint = `/rental-contracts/recipient/${this.singleLot.recipient.id}`;
      } else {
        endpoint = `/rental-contracts/archived/property/${this.singleLot.id}`;
      }

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.contracts = data;
          this.updateCounters();
          this.loading = false; // <- AJOUTÉ : réinitialiser loading en cas de succès
        },
        error: (err) => {
          console.error(err.message);
          this.contracts = []; // <- AJOUTÉ : vider la liste en cas d'erreur
          this.loading = false; // <- AJOUTÉ : réinitialiser loading en cas d'erreur
        },
      });
    }
  }

  updateCounters() {
    if (this.activeTab === 'ACTIVE') {
      this.activeCount = this.contracts.length;
    } else {
      this.archivedCount = this.contracts.length;
    }
  }

  getStatusContract(
    active: boolean,
    archived: boolean,
  ): { text: string; class: string } {
    if (archived) {
      return { text: 'Archivé', class: 'secondary' };
    } else if (active) {
      return { text: 'Actif', class: 'success' };
    } else {
      return { text: 'Inactif', class: 'warning' };
    }
  }

  formatDateForApi(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  getEmptyStateMessage(): { icon: string; title: string; message: string } {
    if (this.activeTab === 'ACTIVE') {
      return {
        icon: 'description',
        title: 'Aucun contrat actif',
        message:
          "Il n'y a actuellement aucun contrat actif pour ce bénéficiaire.",
      };
    } else if (this.activeTab === 'ARCHIVED') {
      return {
        icon: 'archive',
        title: 'Aucun contrat archivé',
        message: "Aucun contrat n'a été archivé pour le moment.",
      };
    }
    return {
      icon: 'list',
      title: 'Aucun élément',
      message: 'La liste est vide.',
    };
  }
}
