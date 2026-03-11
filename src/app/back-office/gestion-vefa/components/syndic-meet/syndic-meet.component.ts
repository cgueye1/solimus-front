import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../../_services/user.service';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../../../environments/environment.prod';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';

// Interfaces
export interface Participant {
  id: number;
  nom: string;
  prenom: string;
  profil: string;
  email?: string;
}

export interface Meeting {
  id: number;
  title: string;
  address: string;
  description?: string;
  dateTime: string | number[];
  duration: number;
  isOnline?: boolean;
  participants?: Participant[];
  documents?: any[];
}

export interface MeetingFile {
  id: number;
  label: string;
  file: string;
  size?: number;
  meetId: number;
}

export interface PendingFile {
  file: File;
  label: string;
  preview?: string;
  size: number;
  name: string;
}

// Pipe personnalisé pour la taille des fichiers
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | undefined, decimals: number = 2): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

@Component({
  selector: 'app-meet-syndic',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    MatMenuModule,
    FileSizePipe,
  ],
  templateUrl: './syndic-meet.component.html',
  styleUrls: ['./syndic-meet.component.scss'],
})
export class MeetManagementComponent implements OnInit {
  @Input() propertyId!: number;
  @ViewChild('createModal') createModal!: TemplateRef<any>;
  @ViewChild('detailsModal') detailsModal!: TemplateRef<any>;

  IMG_URL = environment.fileUrl;
  creatingMeet = false;
  activeTab: 'UPCOMING' | 'PAST' = 'UPCOMING';

  meets: Meeting[] = [];
  selectedMeet: Meeting | null = null;
  files: MeetingFile[] = [];
  pendingFiles: PendingFile[] = [];

  loading = false;
  uploadingFile = false;

  meetForm!: FormGroup;

  fileLabel = '';
  selectedFile: File | null = null;

  page = 0;
  size = 12;
  totalPages = 1;
  currentUser: any;

  // Stats
  upcomingCount = 0;
  pastCount = 0;
  totalParticipants = 0;

  // Référence de la modal
  private modalRef: NgbModalRef | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUser();

    if (this.propertyId) {
      this.loadStats();
      this.loadMeets();
    }
  }

  private initForm(): void {
    this.meetForm = this.fb.group({
      title: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      dateTime: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(15)]],
      isOnline: [false],
    });
  }

  private loadUser(): void {
    this.userService.getDatas('/v1/user/me').subscribe({
      next: (data: any) => (this.currentUser = data),
      error: (err: any) => console.error('Erreur chargement user', err),
    });
  }

  private loadStats(): void {
    this.userService.getDatas(`/meets/stats?propertyId=${this.propertyId}`).subscribe({
      next: (stats: any) => {
        this.upcomingCount = stats?.upcoming || 0;
        this.pastCount = stats?.past || 0;
        this.totalParticipants = stats?.totalParticipants || 0;
      },
      error: (err: any) => console.error('Erreur chargement stats', err),
    });
  }

  loadMeets(): void {
    this.loading = true;
    const endpoint =
      this.activeTab === 'UPCOMING'
        ? `/meets/upcoming?realEstatePropertyId=${this.propertyId}&page=${this.page}&size=${this.size}`
        : `/meets/past?realEstatePropertyId=${this.propertyId}&page=${this.page}&size=${this.size}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (res: any) => {
        this.meets = res.content || res || [];
        this.totalPages = res.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showError('Impossible de charger les réunions');
      },
    });
  }

  changePage(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.page = newPage;
      this.loadMeets();
    }
  }

  switchTab(tab: 'UPCOMING' | 'PAST'): void {
    this.activeTab = tab;
    this.page = 0;
    this.loadMeets();
  }
openCreateModal(content: TemplateRef<any>): void {
  // Réinitialise le formulaire
  this.meetForm.reset({
    title: '',
    address: '',
    description: '',
    dateTime: this.getCurrentDateTime(),
    duration: 60,
    isOnline: false,
  });


  this.modalRef = this.modalService.open(content, {
    centered: true,
    backdrop: 'static',
    size: 'md',
    windowClass: 'meeting-modal',
  });

  this.modalRef.result.finally(() => (this.modalRef = null));
}

close(): void {
   this.modalService.dismissAll()
  this.resetUploadState();

  // Réinitialiser le formulaire pour la prochaine ouverture
  this.meetForm.reset({
    title: '',
    address: '',
    description: '',
    dateTime: this.getCurrentDateTime(),
    duration: 60,
    isOnline: false,
  });
}


  private getCurrentDateTime(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  loadMeetingFiles(meetId: number): void {
    this.userService.getDatas(`/meets/meetfiles/${meetId}`).subscribe({
      next: (res: any) => (this.files = res || []),
      error: () => (this.files = []),
    });
  }

  formatDate(dateValue: string | number[] | undefined): string {
    if (!dateValue) return '';
    try {
      if (Array.isArray(dateValue)) {
        if (dateValue.length < 5) return '';
        const [y, m, d, h, min] = dateValue;
        return new Date(y, m - 1, d, h, min).toISOString();
      }
      return dateValue;
    } catch {
      return '';
    }
  }

  formatDisplayDate(dateValue: string | number[] | undefined): string {
    if (!dateValue) return 'Date non définie';
    try {
      const date = new Date(this.formatDate(dateValue));
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  }

  isToday(dateValue: string | number[] | undefined): boolean {
    if (!dateValue) return false;
    try {
      const date = new Date(this.formatDate(dateValue));
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }

  getRelativeDate(dateValue: string | number[] | undefined): string {
    if (!dateValue) return '';
    try {
      const date = new Date(this.formatDate(dateValue));
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
      if (date.toDateString() === tomorrow.toDateString()) return 'Demain';

      const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `Dans ${diffDays} jours` : `Il y a ${Math.abs(diffDays)} jours`;
    } catch {
      return '';
    }
  }

  getInitials(participant: Participant | undefined): string {
    if (!participant?.nom || !participant?.prenom) return '?';
    return (participant.nom.charAt(0) + participant.prenom.charAt(0)).toUpperCase();
  }

  getParticipantName(participant: Participant | undefined): string {
    if (!participant) return '';
    return `${participant.nom} ${participant.prenom}`.trim();
  }

 
  private resetUploadState(): void {
    this.pendingFiles = [];
    this.selectedFile = null;
    this.fileLabel = '';
  }

  // Création réunion
  createMeeting(): void {
    if (this.meetForm.invalid) {
      Object.values(this.meetForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.creatingMeet = true;

    const f = this.meetForm.value;
    const payload = {
      title: f.title,
      address: f.address,
      description: f.description || '',
      dateTime: this.formatDateTimeForApi(new Date(f.dateTime)),
      duration: f.duration,
      isOnline: f.isOnline || false,
      propertyId: this.propertyId,
      userId: this.currentUser?.id,
    };

    this.userService.saveAnyData(payload, '/meets/cop').subscribe({
      next: () => {
        this.creatingMeet = false;
        this.modalRef?.close();
        this.loadMeets();
        this.loadStats();
        this.showSuccess('Réunion créée avec succès');
      },
      error: (err: any) => {
        this.creatingMeet = false;
        this.showError(err.error?.message || 'Erreur lors de la création');
      },
    });
  }

  private formatDateTimeForApi(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  openDetails(content: TemplateRef<any>, meet: Meeting): void {
    this.selectedMeet = meet;
    this.files = [];
    this.pendingFiles = [];
    this.loadMeetingFiles(meet.id);

    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      scrollable: true,
      windowClass: 'meeting-modal',
    });

    this.modalRef.result.finally(() => {
      this.modalRef = null;
      this.resetUploadState();
    });
  }

  // Gestion fichiers (upload, drag-drop)
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files?.length) this.addFilesToPending(files);
    event.target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files?.length) this.addFilesToPending(files);
  }

  private addFilesToPending(fileList: FileList): void {
    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return this.showError(`Le fichier ${file.name} dépasse 10MB`);
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) return this.showError(`Le type de fichier ${file.name} n'est pas accepté`);

      const pending: PendingFile = { file, label: file.name, name: file.name, size: file.size };
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => pending.preview = e.target.result;
        reader.readAsDataURL(file);
      }
      this.pendingFiles.push(pending);
    });
  }

  removePendingFile(index: number): void {
    this.pendingFiles.splice(index, 1);
  }

  uploadAllFiles(): void {
    if (!this.selectedMeet || !this.pendingFiles.length) return this.showError('Aucun fichier à uploader');

    this.uploadingFile = true;
    this.spinner.show();

    const uploads = this.pendingFiles.map(pf => {
      const formData = new FormData();
      formData.append('file', pf.file);
      formData.append('meetId', this.selectedMeet!.id.toString());
      formData.append('label', pf.label || pf.name);
      return this.http.post(`${environment.apiUrl}/meets/add/file`, formData).toPromise();
    });

    Promise.all(uploads)
      .then(() => {
        this.uploadingFile = false;
        this.spinner.hide();
        const count = this.pendingFiles.length;
        this.pendingFiles = [];
        this.loadMeetingFiles(this.selectedMeet!.id);
        this.showSuccess(`${count} fichier(s) ajouté(s) avec succès`);
      })
      .catch(() => {
        this.uploadingFile = false;
        this.spinner.hide();
        this.showError("Erreur lors de l'upload des fichiers");
      });
  }

  openFile(filePath: string): void {
    if (filePath) window.open(this.IMG_URL + '/' + filePath, '_blank');
  }

  copyLink(link: string | undefined): void {
    if (!link) return;
    navigator.clipboard.writeText(link)
      .then(() => this.showSuccess('Lien copié dans le presse-papier'))
      .catch(() => this.showError('Erreur lors de la copie'));
  }

  // Participant management
  openAddParticipant(): void {
    if (!this.selectedMeet) return;

    Swal.fire({
      title: 'Ajouter un participant',
      html: `
        <input type="email" id="email" class="swal2-input" placeholder="Email du participant">
        <select id="role" class="swal2-input">
          <option value="OWNER">Propriétaire</option>
          <option value="TENANT">Locataire</option>
          <option value="SYNDIC">Syndic</option>
        </select>
      `,
      confirmButtonText: 'Ajouter',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const role = (document.getElementById('role') as HTMLSelectElement).value;
        if (!email) Swal.showValidationMessage('Email requis');
        return this.userService.saveAnyData({ meetId: this.selectedMeet!.id, email, role }, '/meets/add-participant').toPromise();
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.showSuccess('Participant ajouté avec succès');
        this.loadMeets();
        if (this.selectedMeet) this.loadMeetingFiles(this.selectedMeet.id);
      }
    });
  }

  removeParticipant(participantId: number | undefined): void {
    if (!participantId) return;

    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Ce participant sera retiré de la réunion',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
    }).then(result => {
      if (result.isConfirmed) {
        this.userService.deleteData(`/meets/participant/${participantId}`).subscribe({
          next: () => {
            this.showSuccess('Participant retiré avec succès');
            this.loadMeets();
            if (this.selectedMeet) this.loadMeetingFiles(this.selectedMeet.id);
          },
          error: () => this.showError('Impossible de retirer le participant'),
        });
      }
    });
  }

  editMeeting(): void { this.showInfo('Modification en cours de développement'); }

  deleteMeeting(): void {
    if (!this.selectedMeet) return;

    Swal.fire({
      title: 'Supprimer la réunion',
      text: 'Cette action est irréversible. Toutes les données associées seront perdues.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    }).then(result => {
      if (result.isConfirmed) {
        this.userService.deleteData(`/meets/${this.selectedMeet!.id}`).subscribe({
          next: () => {
            this.showSuccess('Réunion supprimée avec succès');
            this.modalRef?.close();
            this.loadMeets();
            this.loadStats();
          },
          error: () => this.showError('Impossible de supprimer la réunion'),
        });
      }
    });
  }

  getParticipantsSlice(participants: Participant[] | undefined, start: number, end: number): Participant[] {
    return participants?.slice(start, end) || [];
  }

  hasParticipants(meet: Meeting | undefined): boolean {
    return !!(meet?.participants?.length);
  }

  getParticipantCount(meet: Meeting | undefined): number {
    return meet?.participants?.length || 0;
  }

  getDocumentCount(meet: Meeting | undefined): number {
    return meet?.documents?.length || 0;
  }

  get canEdit(): boolean { return ['SYNDIC', 'ADMIN'].includes(this.currentUser?.role); }
  get canDelete(): boolean { return ['SYNDIC', 'ADMIN'].includes(this.currentUser?.role); }

  private showSuccess(message: string): void {
    Swal.fire({ icon: 'success', title: 'Succès !', text: message, timer: 2000, showConfirmButton: false });
  }
  private showError(message: string): void {
    Swal.fire({ icon: 'error', title: 'Erreur', text: message });
  }
  private showInfo(message: string): void {
    Swal.fire({ icon: 'info', title: 'Information', text: message });
  }
}
