import { CommonModule, registerLocaleData } from '@angular/common';
import {
  Component,
  Input,
  LOCALE_ID,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppelFondFormComponent } from '../appel-fond-form/appel-fond-form.component';
import { ActivatedRoute } from '@angular/router';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import localeFr from '@angular/common/locales/fr';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../../../environments/environment.prod';
import { jsPDF } from 'jspdf'; // Import jsPDF
import { AppelChargeFormSyndicComponent } from '../appel-charge-form-syndic/appel-fond-form.component';
import { DashboardCallComponent } from '../appel-fond-stats/appel-fond.component';

@Component({
  selector: 'app-appel-charge-work',
  standalone: true,
  imports: [
    CommonModule,
    AppelChargeFormSyndicComponent,
    FormsModule,DashboardCallComponent,
    ReactiveFormsModule,
    
  ],
  templateUrl: './appel-fond.component.html',
  styleUrl: './appel-fond.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class AppelChargeWorkComponent implements OnInit {
    callState: any;
   showSummary: boolean = true;

  @Input() singleLot!: any;
  data: any[] = [];
  fileLabel: string = '';
  public ProfilEnum = ProfilEnum; // Rendez l'enum disponible dans le template
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // 1 à 100
  loading: boolean = false;
  file: File | null = null; // Renamed from singleImage to plan
  IMG_URL: String = environment.fileUrl;
  selectedMonth: string = '';
  paymentCalls: any[] = [];
  selectedAppelFond: any = {}; // Données pour l'édition
  isEditMode = false;
  hideActions = false;
  action: string | null = null; // Pour stocker l'action
  currentuser: any;
  selectedCall: any;
  totalCalls: number = 0;
  totalAmount: number = 0;
  collectedAmount: number = 0;
  pendingAmount: number = 0;
  files: any[] = [];
  images: File[] = [];
  progressAlbuForm!: FormGroup;
  work: any;
  constructor(
    public modal: NgbModal,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private userService: UserService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService
  ) {
    registerLocaleData(localeFr);
  }

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
  ngOnInit(): void {
    // Récupérer l'action via les queryParams
    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
      // Si l'action est 'DETAILS', on masque les actions
      if (this.action === 'DETAILS') {
        this.hideActions = true;
      }
    });
    const today = new Date();
    this.selectedMonth = today.toISOString().slice(0, 7); // yyyy-MM
    this.getMe();
    this.getPaymentCalls();
    this.initForm();
  }

  initForm() {
    this.progressAlbuForm = this.fb.group({
      pictures: this.fb.array([]),
    });
  }

  get pictures() {
    return this.progressAlbuForm.get('pictures') as FormArray;
  }
  onDeleteGalleryImage(index: number) {
    this.pictures.removeAt(index);
    this.images.splice(index, 1);
  }
  onMultipleFilesSelected(event: any) {
    const files = event.target.files;
    this.images.push(...files);

    for (let file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        this.pictures.push(this.fb.control(reader.result));
      };
      reader.readAsDataURL(file);
    }
  }

  onMonthChange() {
    this.getPaymentCalls();
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
  // Open modal for both Add and Edit // Open modal for both Add and Edit
  openFormModal(content: TemplateRef<any>, appelFond: any = null) {
    this.totalCalls = 0;
    this.totalAmount = 0;
    this.collectedAmount = 0;
    this.pendingAmount = 0;
    this.files = [];
    this.isEditMode = !!appelFond; // Si on modifie
    this.selectedAppelFond = appelFond ? { ...appelFond } : {}; // Clonage des données
    this.work = appelFond;

    if (this.work) {
      this.loadStats();
      this.getDocuments();
    }

    const modalRef = this.modalService.open(content, {
      size: this.work?'xl':'',
      centered: true,
    });

    // Capturer l'événement de fermeture ou de rejet du modal
    modalRef.dismissed.subscribe((reason) => {
      //  this.getPaymentCalls();
    });
  }

  // Method to handle logo file change
  onUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newLogoUrl = e.target.result; // Get the new logo's data URL
        // this.logoService.updateLogo(newLogoUrl); // Update the logo in the service
      };

      this.file = file;
      reader.readAsDataURL(file);
    }
  }

  openModal(template: any, item: any) {
    this.selectedCall = item;
    this.work = item;
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      //  size: 'sm',
    });
  }

  openPdf(technicalSheet: any) {
    const url = `${this.IMG_URL}/${technicalSheet}`;
    window.open(url, '_blank');
  }

  onSave() {
    this.spinner.show();

    const formData = new FormData();

    // Append the file inputs
    if (this.file) {
      formData.append('file', this.file, this.file.name);
      formData.append('meetId', `${this.selectedCall.id}`);
      formData.append('label', this.fileLabel);
    }

    if (!this.loading && this.file) {
      this.loading = true;
      this.userService.saveFormData(formData, `/works/add/file`).subscribe({
        next: (data) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            html: 'Document enregistrée avec succès.',
            showConfirmButton: false,
            timer: 2000,
          }).then(() => {
            this.modal.dismissAll();
            this.spinner.hide();
            this.getPaymentCalls();
          });
        },
        error: (err) => {
          console.error('Error during saving:', err);
          this.loading = false;
          this.spinner.hide();
        },
      });
    }
  }
  getPaymentCalls() {
    this.loading = true;
    const endpoint = `/works/property/${this.singleLot.id}?page=0&size=30&month=${this.selectedMonth}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.paymentCalls = data.content;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  getDocuments() {
    this.loading = true;
    const endpoint = `/works/workfiles/${this.work.id}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.files = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  // Handle form submission (Add or Edit)
  onFormSubmit(formData: any) {
    if (this.isEditMode) {
      const index = this.data.findIndex((item) => item.id === formData.id);
      this.data[index] = formData;
      Swal.fire('Modifié', 'Appel de fond modifié avec succès.', 'success');
    } else {
      this.data.push(formData);
      Swal.fire('Ajouté', 'Appel de fond ajouté avec succès.', 'success');
    }
    this.modalService.dismissAll();
  }

  // Handle delete
  onDelete(item: any) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Vous ne pourrez pas revenir en arrière!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        const endpoint = '/payment-calls/' + item.id;
        this.userService.deleteData(endpoint).subscribe({
          next: (data) => {
            this.getPaymentCalls();
          },
          error: (err) => {
            console.error(err);
          },
        });
        Swal.fire(
          'Supprimé!',
          'Appel de fond supprimé avec succès.',
          'success'
        );
      }
    });
  }

  getStatusLot(status: string): { text: string; class: string } {
    return status === 'COMPLETED'
      ? { text: 'Éffectué', class: 'success' }
      : { text: 'En attente', class: 'warning' };
  }

  onSwitchChange(event: Event, data: any) {
    const input = event.target as HTMLInputElement;
    const newStatus = input.checked ? 'COMPLETED' : 'PENDING';
    const confirmationText =
      newStatus === 'COMPLETED' ? 'éffectué' : 'en attente';

    Swal.fire({
      title: 'Confirmation',
      html: `Souhaitez-vous changer le statut à <b>${confirmationText}</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        // Si l'utilisateur confirme, mettez à jour le statut de l'élément
        data.status = newStatus;
        this.onSubmit(
          data,
          `Le statut a été changé à ${confirmationText}.`,
          newStatus
        );
        // Affichez un message de succès
      } else {
        // Si l'utilisateur annule, rétablissez l'état initial de l'interrupteur
        input.checked = !input.checked;
      }
    });
  }

  onSubmit(data: any, message: any, status: any) {
    if (!this.loading) {
      this.spinner.show();

      if (!this.loading) {
        this.loading = true;

        this.userService
          .updateAnyData({}, `/works/${data.id}/status?status=${status}`)
          .subscribe({
            next: (data) => {
              this.loading = false;
              this.spinner.hide();
              Swal.fire({
                icon: 'success',
                html: message,
                showConfirmButton: false,
                timer: 2000,
              }).then(() => {
                this.getPaymentCalls();
              });
            },
            error: (err) => {
              console.error('Error during saving:', err);
              this.loading = false;
              Swal.fire({
                icon: 'warning',
                html: "'Error during saving:",
                showConfirmButton: false,
                timer: 2000,
              }).then(() => {
                this.getPaymentCalls();
              });
              alert(`/works/${data.id}/status?status=${status}`);
              this.spinner.hide();
            },
          });
      }
    } else {
      console.error('The form is invalid.');
      this.spinner.hide();
    }
  }

  loadLogo(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = './assets/images/logo-app-black.svg'; // Adjust the path if needed
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png')); // Convert to PNG base64
      };
      img.onerror = (error) => reject(error);
    });
  }

  async downloadInvoice(item: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // Get page width for right alignment

    try {
      const logoBase64 = await this.loadLogo(); // Load the logo from assets

      // Add the logo image at the top
      doc.addImage(logoBase64, 'PNG', 10, 10, 50, 15); // Adjust position and size as needed

      // Invoice Title
      doc.setFontSize(16);
      doc.text('FACTURE', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(12);

      // Invoice Information (Left and Right Alignment)
      doc.text('PRO FORMA No:', 10, 50); // Label on the left
      doc.text(`${item.id}`, pageWidth - 10, 50, { align: 'right' }); // Value on the right

      doc.text('Date:', 10, 60);
      doc.text(
        `${new Date(item.updatedAt).toLocaleDateString()}`,
        pageWidth - 10,
        60,
        { align: 'right' }
      );

      doc.text('Montant:', 10, 70);
      doc.text(`${item.amount} XOF`, pageWidth - 10, 70, { align: 'right' });

      doc.text('Échéance:', 10, 80);
      doc.text(`${item.expectedDate}`, pageWidth - 10, 80, { align: 'right' });

      // Client Information
      doc.text('Client:', 10, 90);
      doc.text(
        `${this.currentuser.prenom} ${this.currentuser.nom}`,
        pageWidth - 10,
        90,
        { align: 'right' }
      );

      doc.text('Adresse:', 10, 100);
      doc.text(`${this.currentuser.adress}`, pageWidth - 10, 100, {
        align: 'right',
      });

      // Banking Information
      /* doc.text('IBAN:', 10, 110);  
      doc.text('BE21 9670 1477 6803', pageWidth - 10, 110, { align: 'right' });
  
      doc.text('Swift code:', 10, 120);  
      doc.text('TRWIBEB1XXX', pageWidth - 10, 120, { align: 'right' });*/

      // Save the PDF
      doc.save(`Facture appel de fonds ${item.id}.pdf`);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  formatDate(input: any): string {
    if (!input) return '';

    // Si input est déjà un objet Date
    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'string') {
      // Exemple : "2026,1,15" ou "2026-01-15"
      // Remplace les virgules par des tirets si nécessaire
      const parts = input
        .toString()
        .split(/[-,]/)
        .map((p) => parseInt(p, 10));
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Attention : JS Date month commence à 0
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(input);
      }
    } else if (Array.isArray(input)) {
      const [year, month, day] = input;
      date = new Date(year, month - 1, day);
    } else {
      return '';
    }

    // Formater en dd/MM/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  openImage(url: string) {
    window.open(`${this.IMG_URL}/${encodeURIComponent(url)}`, '_blank');
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  loadStats() {
    // Simulations (tu remplaceras par API)

    const endpoint = `/works/${this.work.id}/kpi`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.totalCalls = data.totalInvoices;
        this.totalAmount = data.totalCharges;
        this.collectedAmount = data.totalPaid;
        this.pendingAmount = data.totalPending;
      },
      error: (err) => {},
    });
  }

  onSaveImages() {
    if (this.progressAlbuForm.valid && !this.loading) {
      this.spinner.show();
      const isEntrance = this.progressAlbuForm.get('isEntrance')?.value;
      const formData = new FormData();

      this.images.forEach((file, index) => {
        formData.append(`files`, file, file.name);
      });

      if (!this.loading) {
        //  this.loading = true;
        this.userService
          .saveFormData(formData, `/works/${this.work.id}/pictures`)
          .subscribe({
            next: (data) => {
              this.loading = false;

              this.spinner.hide();
              Swal.fire({
                icon: 'success',
                html: 'Images ajoutées .',
                showConfirmButton: false,
                timer: 2000,
              }).then(() => {
                this.getPaymentCalls();
                this.modal.dismissAll();
              });
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
}
