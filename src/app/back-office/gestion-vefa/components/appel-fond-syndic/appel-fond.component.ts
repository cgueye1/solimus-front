import { CommonModule, registerLocaleData } from '@angular/common';
import {
  Component,
  Input,
  LOCALE_ID,
  OnInit,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppelFondFormComponent } from '../appel-fond-form/appel-fond-form.component';
import { ActivatedRoute } from '@angular/router';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import localeFr from '@angular/common/locales/fr';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../../../environments/environment.prod';
import { jsPDF } from 'jspdf'; // Import jsPDF

@Component({
  selector: 'app-appel-fond-syndic',
  standalone: true,
  imports: [CommonModule, AppelFondFormComponent],
  templateUrl: './appel-fond.component.html',
  styleUrl: './appel-fond.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class AppelFondSyndicComponent implements OnInit {
  @Input() singleLot!: any;
  @Input() ownerId!: any;

  data: any[] = [];

  public ProfilEnum = ProfilEnum; // Rendez l'enum disponible dans le template
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // 1 à 100
  loading: boolean = false;
  file: File | null = null; // Renamed from singleImage to plan
  IMG_URL: String = environment.fileUrl;
  pageSize = 5;
  page = 0;

  paymentCalls: any[] = [];
  selectedAppelFond: any = {}; // Données pour l'édition
  isEditMode = false;
  hideActions = false;
  action: string | null = null; // Pour stocker l'action
  currentuser: any;
  selectedCall: any;

  activeTab: 'PENDING' | 'PAID' = 'PENDING';
  pendingCount = 0;
  paidCount = 0;

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

changeTab(status: 'PENDING' | 'PAID') {

  if (this.activeTab === status) return; // évite double clic inutile
  this.activeTab = status;
  this.page = 0; // reset pagination si nécessaire
  this.getPaymentCalls();
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
    this.getMe();
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
  
   ngOnChanges(changes: SimpleChanges) {
    if (changes['activeTabParent'] && !changes['activeTabParent'].firstChange) {
      // Quand le tab change, recharge les données

      this.getPaymentCalls();
    }
  }
  // Open modal for both Add and Edit // Open modal for both Add and Edit
  openFormModal(content: TemplateRef<any>, appelFond: any = null) {
    this.isEditMode = !!appelFond; // Si on modifie
    this.selectedAppelFond = appelFond ? { ...appelFond } : {}; // Clonage des données

    const modalRef = this.modalService.open(content, {
      size: 'md',
      centered: true,
    });

    // Capturer l'événement de fermeture ou de rejet du modal
    modalRef.dismissed.subscribe((reason) => {
      this.getPaymentCalls();
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
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      // size: 'sm',
    });
  }

  openPdf(technicalSheet: any) {
    const url = `${this.IMG_URL}/${technicalSheet}`;
    window.open(url, '_blank');
  }

  onSave() {


    const formData = new FormData();

    // Append the file inputs
    if (this.file) {
      formData.append('file', this.file, this.file.name);
    }

    if (!this.loading) {
      this.loading = true;
      this.userService
        .saveFormData(
          formData,
          `/call-for-charges/${this.selectedCall.id}/file`
        )
        .subscribe({
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
  
  updateCounters() {
  this.pendingCount =
    this.activeTab === 'PENDING'
      ? this.paymentCalls.length
      : this.pendingCount;

  this.paidCount =
    this.activeTab === 'PAID'
      ? this.paymentCalls.length
      : this.paidCount;
}
  getPaymentCalls() {
    const propertyId = this.singleLot.id;
    this.loading=true

    const endpoint =
      this.activeTab === 'PENDING'
        ? `/call-for-charges/proprety/pending?ownerId=${this.ownerId}&propertyId=${propertyId}&page=${this.page}&size=${this.pageSize}`
        : `/call-for-charges/proprety/paid?ownerId=${this.ownerId}&propertyId=${propertyId}&page=${this.page}&size=${this.pageSize}`;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
          this.loading=false
        this.paymentCalls = data.content;
        
        this.updateCounters();
      },
      error: (err) => {
        console.error(err.message);
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
    return status === 'PAID'
      ? { text: 'Payé', class: 'success' }
      : { text: 'En attente', class: 'warning' };
  }

  onSwitchChange(event: Event, data: any) {
    const input = event.target as HTMLInputElement;
    const newStatus = input.checked ? 'PAID' : 'PENDING';
    const confirmationText = newStatus === 'PAID' ? 'payé' : 'en attente';

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
        //   this.onSubmit(data, `Le statut a été changé à ${confirmationText}.`);

        this.paymentProcess(
          data.id,
          newStatus,
          `Le statut a été changé à ${confirmationText}.`
        );

        // Affichez un message de succès
        Swal.fire({
          title: 'Succès',
          text: `Le statut a été changé à ${confirmationText}.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Si l'utilisateur annule, rétablissez l'état initial de l'interrupteur
        input.checked = !input.checked;
      }
    });
  }

  onSubmit(data: any, message: any) {
    if (!this.loading) {
      this.spinner.show();

      var body = {
        label: data.label,
        percentage: data.percentage,
        amount: data.amount,
        expectedDate: data.expectedDate,
        status: data.status,
        realEstatePropertyId: this.singleLot.id,
      };

      if (!this.loading) {
        this.loading = true;

        this.userService
          .updateAnyData(body, `/call-for-charges/${data.id}`)
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
              }).then(() => {});
              this.spinner.hide();
            },
          });
      }
    } else {
      console.error('The form is invalid.');
      this.spinner.hide();
    }
  }

  paymentProcess(id: any, status: any, message: any) {
    if (!this.loading) {
      this.spinner.show();

      if (!this.loading) {
        this.loading = true;

        this.userService
          .updateAnyData({}, `/call-for-charges/${id}/status?status=${status}`)
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
              }).then(() => {});
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

  openFile(url: string) {
    if (!url) {
      return;
    }

    window.open(environment.fileUrl + '/' + url, '_blank');
  }
  
  
  
  getEmptyStateMessage(): { icon: string, title: string, message: string } {
  if (this.activeTab === 'PENDING') {
    return {
      icon: 'hourglass_empty',
      title: 'Aucun appel de fond en attente',
      message: 'Il n\'y a actuellement aucun paiement en attente.'
    };
  } else if (this.activeTab === 'PAID') {
    return {
      icon: 'check_circle_outline',
      title: 'Aucun appel de charges payé',
      message: 'Aucun paiement n\'a été effectué pour le moment.'
    };
  }
  return {
    icon: 'list',
    title: 'Aucun élément',
    message: 'La liste est vide.'
  };
}
}
