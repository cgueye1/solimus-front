import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserService } from '../../../../_services/user.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment.prod';
import * as CryptoJS from 'crypto-js';

export interface Signatory {
  id: number;
  firstName: string;
  lastName: string;
  hasSigned: boolean;
  signedAt: Date | null;
  signatureNotes?: string | null;
}

export interface Document {
  id: number;
  title: string;
  initPdf: string;
  signedPdf: string | null;
  propertyId: number;
  lastUpdated: Date;
  signatories: Signatory[];
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss'],
})
export class DocumentListComponent implements OnInit, OnChanges {
  @Input() propertyId!: number;
  @Input() parentId!: number;
  @Input() lot!: any;
  @Input() canAdd!: boolean;

  private secretKey = 'innov-impact-secret-key';

  documents: Document[] = [];
  loading = false;
  showModal = false;
  documentForm: FormGroup;
  selectedFile: File | null = null;
  currentUser: any;

  signatoryOptions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private spinner: NgxSpinnerService,
  ) {
    // Initialisation du formulaire
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      signatoryIds: this.fb.array([]), // Utilisation de FormArray au lieu de FormGroup
    });
  }

  // Getter pour le FormArray des signataires
  get signatoryIdsArray(): FormArray {
    return this.documentForm.get('signatoryIds') as FormArray;
  }

  // -------------------- Encryption / Decryption --------------------
  encryptData(data: any): string {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(
      jsonString,
      this.secretKey,
    ).toString();
    return encodeURIComponent(encrypted);
  }

  decryptData(encrypted: string): any {
    const decoded = decodeURIComponent(encrypted);
    const bytes = CryptoJS.AES.decrypt(decoded, this.secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  // -------------------- Lifecycle --------------------
  ngOnInit(): void {
    this.initializeSignatoryOptions();
    this.getMe();
    if (this.propertyId) this.getDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lot'] && this.lot) {
      this.initializeSignatoryOptions();
    }
    if (
      changes['propertyId'] &&
      !changes['propertyId'].firstChange &&
      this.propertyId
    ) {
      this.getDocuments();
    }
  }

  // -------------------- Signatory Options --------------------
  initializeSignatoryOptions(): void {
    if (!this.lot) return;

    this.signatoryOptions = [
      this.lot?.recipient && {
        id: this.lot.recipient.id,
        label: 'Réservataire',
        name: `${this.lot.recipient.prenom || ''} ${this.lot.recipient.nom || ''}`.trim(),
      },
      this.lot?.promoter && {
        id: this.lot.promoter.id,
        label: 'Promoteur',
        name: `${this.lot.promoter.prenom || ''} ${this.lot.promoter.nom || ''}`.trim(),
      },
    ].filter(Boolean);
  }

  // -------------------- Utilisateur courant --------------------
  getMe(): void {
    this.userService.getDatas('/v1/user/me').subscribe({
      next: (data) => (this.currentUser = data),
      error: (err) => console.error('Erreur chargement utilisateur', err),
    });
  }

  // -------------------- Documents --------------------
  getDocuments(): void {
    this.loading = true;
    this.documents = [];

    this.userService.getDatas(`/docs/property/${this.propertyId}`).subscribe({
      next: (data: any) => {
        this.documents = data.map((doc: any) => ({
          ...doc,
          lastUpdated: Array.isArray(doc.lastUpdated)
            ? new Date(
                doc.lastUpdated[0],
                doc.lastUpdated[1] - 1,
                doc.lastUpdated[2],
                doc.lastUpdated[3],
                doc.lastUpdated[4],
                doc.lastUpdated[5],
                Math.floor(doc.lastUpdated[6] / 1000000),
              )
            : new Date(doc.lastUpdated),
          signatories:
            doc.signatories?.map((s: any) => ({
              ...s,
              signedAt: s.signedAt
                ? new Date(
                    s.signedAt[0],
                    s.signedAt[1] - 1,
                    s.signedAt[2],
                    s.signedAt[3],
                    s.signedAt[4],
                    s.signedAt[5],
                  )
                : null,
            })) || [],
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur chargement documents', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les documents.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
    });
  }

  // -------------------- Fichier PDF --------------------
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Format incorrect',
        text: 'Veuillez sélectionner un fichier PDF.',
        timer: 2000,
        showConfirmButton: false,
      });
      this.selectedFile = null;
    }
  }

  // Gestion des changements des checkboxes
  onCheckboxChange(event: any, id: number): void {
    if (event.target.checked) {
      this.signatoryIdsArray.push(new FormControl(id));
    } else {
      const index = this.signatoryIdsArray.controls.findIndex(
        (x) => x.value === id,
      );
      this.signatoryIdsArray.removeAt(index);
    }
    console.log('Current selected IDs:', this.signatoryIdsArray.value);
  }

  // Vérifier si un signataire est sélectionné
  isSelected(id: number): boolean {
    return this.signatoryIdsArray.controls.some((x) => x.value === id);
  }

  // -------------------- Signataires sélectionnés --------------------
  getSelectedSignatoryIds(): number[] {
    return this.signatoryIdsArray.value;
  }

  // -------------------- Sauvegarde document --------------------
  onSaveDocument(): void {
    if (this.documentForm.valid && this.selectedFile && !this.loading) {
      this.spinner.show();
      this.loading = true;

      const formData = new FormData();
      formData.append('propertyId', this.propertyId.toString());
      formData.append('titre', this.documentForm.get('title')?.value);
      formData.append('initPdf', this.selectedFile, this.selectedFile.name);

      const selectedIds = this.getSelectedSignatoryIds();
      console.log('Selected IDs to save:', selectedIds);

      selectedIds.forEach((id) =>
        formData.append('signatoryIds', id.toString()),
      );

      this.userService.saveFormData(formData, '/docs/save').subscribe({
        next: () => {
          this.spinner.hide();
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Document enregistré avec succès.',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeModal();
          this.getDocuments();
        },
        error: (err) => {
          this.spinner.hide();
          this.loading = false;
          console.error("Erreur lors de l'enregistrement:", err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Une erreur est survenue lors de l'enregistrement du document.",
          });
        },
      });
    } else if (!this.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner un fichier PDF.',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  }

  // -------------------- Suppression --------------------
  deleteDocument(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Cette action est irréversible!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.userService.deleteData(`/docs/${id}`).subscribe({
          next: () => {
            this.spinner.hide();
            this.getDocuments();
            Swal.fire({
              icon: 'success',
              title: 'Supprimé!',
              text: 'Le document a été supprimé avec succès.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            this.spinner.hide();
            Swal.fire({
              icon: 'error',
              title: 'Erreur!',
              text: 'Une erreur est survenue lors de la suppression.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  }

  // -------------------- Signatures --------------------
  canSignDocument(doc: Document): boolean {
    if (!this.currentUser) return false;
    const userSignatory = doc.signatories?.find(
      (s) => s.id === this.currentUser.id,
    );
    return !!userSignatory && !userSignatory.hasSigned;
  }

  signDocument(doc: Document): void {
    const payload = {
      ...doc,
      signerNumber: this.currentUser.telephone,
      signerId: this.currentUser.id,
      propertyId: this.propertyId,
      parentId: this.parentId,
    };
    const encrypted = this.encryptData(payload);
    const url = `${environment.pdfUrl}?pdfurl=${encrypted}`;

    window.open(url, '_self');
  }

  viewDocument(doc: Document): void {
    if (this.getDocumentToView(doc))
      window.open(
        `${environment.fileUrl}/${this.getDocumentToView(doc)}`,
        '_blank',
      );
  }

  isPdfSigned(doc: Document): boolean {
    if (!doc.signatories || doc.signatories.length === 0) return false;
    return doc.signatories.every((s) => s.hasSigned);
  }

  getSignatureStatus(doc: Document): string {
    if (!doc.signatories || doc.signatories.length === 0)
      return 'Aucun signataire';
    const signedCount = doc.signatories.filter((s) => s.hasSigned).length;
    const totalCount = doc.signatories.length;
    if (signedCount === 0) return 'En attente de signature';
    else if (signedCount === totalCount) return 'Complètement signé';
    else return `${signedCount}/${totalCount} signatures`;
  }

  // -------------------- Modal --------------------
  openModal(): void {
    // S'assurer que les options sont initialisées
    if (!this.signatoryOptions || this.signatoryOptions.length === 0) {
      this.initializeSignatoryOptions();
    }

    // Vider le FormArray
    while (this.signatoryIdsArray.length !== 0) {
      this.signatoryIdsArray.removeAt(0);
    }

    // Ajouter tous les signataires par défaut
    this.signatoryOptions.forEach((option: any) => {
      if (option && option.id) {
        this.signatoryIdsArray.push(new FormControl(option.id));
      }
    });

    // Réinitialiser le titre
    this.documentForm.get('title')?.setValue('');

    // Réinitialiser le fichier
    this.selectedFile = null;
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    this.showModal = true;
    console.log('Form after open:', this.documentForm.value);
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.documentForm.reset();
    // Vider le FormArray
    while (this.signatoryIdsArray.length !== 0) {
      this.signatoryIdsArray.removeAt(0);
    }
    this.selectedFile = null;
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // -------------------- Formats --------------------
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatSignedDate(date: Date | null): string {
    if (!date) return 'Pas encore signé';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getSignatoryLabel(id: number): string {
    const option = this.signatoryOptions.find((opt: any) => opt.id === id);
    return option ? `${option.label} (${option.name})` : `Signataire ${id}`;
  }

  getDocumentToView(doc: Document): string {
    //this.isPdfSigned(doc) &&
    if (doc.signedPdf) return doc.signedPdf;
    return doc.initPdf;
  }
}
