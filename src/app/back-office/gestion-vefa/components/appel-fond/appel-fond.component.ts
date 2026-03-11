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
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../../../../environments/environment.prod';
import { jsPDF } from 'jspdf'; // Import jsPDF
import { StorageService } from '../../../../_services/storage.service';

import autoTable from 'jspdf-autotable';
import { DashboardCallComponent } from '../appel-fond-stats/appel-fond.component';
@Component({
  selector: 'app-appel-fond',
  standalone: true,
  imports: [CommonModule, AppelFondFormComponent,DashboardCallComponent],
  templateUrl: './appel-fond.component.html',
  styleUrl: './appel-fond.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class AppelFondComponent implements OnInit {
  callState: any;
   showSummary: boolean = true;

  @Input() singleLot!: any;
  data: any[] = [];
  public ProfilEnum = ProfilEnum; // Rendez l'enum disponible dans le template
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // 1 à 100
  loading: boolean = false;
  file: File | null = null; // Renamed from singleImage to plan
  IMG_URL: String = environment.fileUrl;

  paymentCalls: any[] = [];
  selectedAppelFond: any = {}; // Données pour l'édition
  isEditMode = false;
  hideActions = false;
  action: string | null = null; // Pour stocker l'action
  currentuser: any;
  selectedCall: any;
  constructor(
    public modal: NgbModal,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private userService: UserService,
    private storageService: StorageService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
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
    this.getMe();
    this.getPaymentCalls();
  }
  getMe() {
    const profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentuser = data;

        if (profil) {
          this.currentuser.profil = profil;
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
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
    this.spinner.show();

    const formData = new FormData();

    // Append the file inputs
    if (this.file) {
      formData.append('file', this.file, this.file.name);
    }

    if (!this.loading) {
      this.loading = true;
      this.userService
        .saveFormData(formData, `/payment-calls/${this.selectedCall.id}/file`)
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
  getPaymentCalls() {
    const endpoint = '/payment-calls/property/' + this.singleLot.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.paymentCalls = data;
      },
      error: (err) => {
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
          'success',
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
        this.onSubmit(data, `Le statut a été changé à ${confirmationText}.`);
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
        tom: data.tom,
        tva: data.tva,
      };

      if (!this.loading) {
        this.loading = true;

        this.userService
          .updateAnyData(body, `/payment-calls/${data.id}`)
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
    if (this.singleLot.rental) {
      this.downloadInvoiceRental(item);
    } else {
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
          { align: 'right' },
        );

        doc.text('Montant:', 10, 70);
        doc.text(`${item.amount} XOF`, pageWidth - 10, 70, { align: 'right' });

        doc.text('Échéance:', 10, 80);
        doc.text(`${item.expectedDate}`, pageWidth - 10, 80, {
          align: 'right',
        });

        // Client Information
        doc.text('Client:', 10, 90);
        doc.text(
          `${this.currentuser.prenom} ${this.currentuser.nom}`,
          pageWidth - 10,
          90,
          { align: 'right' },
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
  }
  /**
   * Calcule le montant du loyer à partir du total,
   * de la TVA (%) et de la TOM
   */
  calculateLoyerFromTotal(
    totalAmount: number,
    tvaPercent: number,
    tomAmount: number,
  ): number {
    if (!totalAmount || totalAmount <= 0) return 0;

    const tvaRate = tvaPercent ? tvaPercent / 100 : 0;
    const tom = tomAmount || 0;

    const loyer = (totalAmount - tom) / (1 + tvaRate);

    // Sécurité : pas de montant négatif
    return loyer > 0 ? Math.round(loyer) : 0;
  }
  async downloadInvoiceRental(item: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const logoBase64 = await this.loadLogo();

      /* =======================
       DONNÉES SAFE
    ======================== */

      const property = item?.realEstateProperty;
      const promoter = property?.promoter;
      const client = property?.recipient;

      // Promoteur
      const promoterFullName =
        `${promoter?.prenom ?? ''} ${promoter?.nom ?? ''}`.trim() ||
        'Nom non renseigné';
      const promoterAddress = promoter?.address ?? 'Adresse non renseignée';
      const promoterPhone = promoter?.telephone ?? 'Téléphone non renseigné';
      const promoterEmail = promoter?.email ?? 'Email non renseigné';

      // Client
      const clientFullName =
        `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() ||
        'Client non renseigné';
      const clientAddress = client?.address ?? 'Adresse non renseignée';
      const clientPhone = client?.telephone ?? 'Téléphone non renseigné';
      const clientEmail = client?.email ?? 'Email non renseigné';

      // Bien
      const propertyName = property?.name ?? 'Bien non renseigné';
      const propertyAddress =
        property?.address ?? 'Adresse du bien non renseignée';

      // Facture
      const referenceId = item?.id ?? '-';
      const expectedDate = item?.expectedDate ?? '-';

      const totalAmount = item?.amount ?? 0;
      const tom = item?.tom ?? 0;
      const tva = item?.tva ?? 0;

      const loyer = this.calculateLoyerFromTotal(totalAmount, tva, tom);

      /* =======================
       EN-TÊTE
    ======================== */

      doc.addImage(logoBase64, 'PNG', 10, 10, 45, 15);

      // Promoteur (droite)
      doc.setFontSize(9);
      doc.text(
        [promoterFullName, promoterAddress, promoterPhone, promoterEmail],
        pageWidth - 10,
        12,
        { align: 'right' },
      );

      /* =======================
       BIEN IMMOBILIER
    ======================== */

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Référence et adresse du bien :', 10, 35);

      doc.setFont('helvetica', 'normal');
      doc.text([propertyName, propertyAddress], 10, 42);

      /* =======================
       CLIENT
    ======================== */

      doc.setFont('helvetica', 'bold');
      doc.text('Client :', 10, 55);

      doc.setFont('helvetica', 'normal');
      doc.text(
        [clientFullName, clientAddress, clientPhone, clientEmail],
        10,
        62,
      );

      /* =======================
       TITRE
    ======================== */

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reçu', pageWidth / 2, 85, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Échéance : ${expectedDate}`, pageWidth / 2, 92, {
        align: 'center',
      });

      /* =======================
       TABLEAU DES MONTANTS
    ======================== */

      autoTable(doc, {
        startY: 105,
        margin: { left: 10, right: 10 },
        tableWidth: pageWidth - 20,
        head: [['Libellé écritures', 'Montant (FCFA)']],
        body: [
          ['LOYER', this.formatMoney(loyer)],
          ['PROVISION T.O.M.', this.formatMoney(tom)],
          [
            'TVA / LOYER',
            this.formatMoney(this.calculateTvaAmount(loyer, tva)),
          ],
          ['TOTAL REÇU', this.formatMoney(totalAmount)],
        ],
        styles: {
          fontSize: 11,
          cellPadding: 4,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [220, 220, 220],
          textColor: 0,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: pageWidth * 0.6 },
          1: { halign: 'right', cellWidth: pageWidth * 0.3 },
        },
      });

      /* =======================
       PIED DE PAGE
    ======================== */

      const finalY = (doc as any).lastAutoTable?.finalY ?? 150;

      doc.setFontSize(9);
      doc.text(`Référence : ${referenceId}`, 10, finalY + 10);

      doc.text(
        'Ce reçu est valable uniquement pour l’échéance en cours.',
        10,
        finalY + 18,
      );

      /* =======================
       SAUVEGARDE
    ======================== */

      doc.save(`Recu_${referenceId}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF :', error);
    }
  }

  formatMoney(value?: number): string {
    const safeValue = value ?? 0;

    return safeValue.toLocaleString('fr-FR').replace(/\u202F|\u00A0/g, ' '); // IMPORTANT
  }
  calculateTvaAmount(amount: number, tvaPercent: number): number {
    if (!amount || !tvaPercent) {
      return 0;
    }

    return (amount * tvaPercent) / 100;
  }
}
