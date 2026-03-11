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
import { jsPDF } from 'jspdf';
import { StorageService } from '../../../../_services/storage.service';
import autoTable from 'jspdf-autotable';
import { AvisEcheanceFormComponent } from '../avis-echeance-form/avis-echeance-form.component';
import { DashboardCallComponent } from '../appel-fond-stats/appel-fond.component';

@Component({
  selector: 'app-avis-echeance',
  standalone: true,
  imports: [
    CommonModule,
    AppelFondFormComponent,
    DashboardCallComponent,
    AvisEcheanceFormComponent,
  ],
  templateUrl: './avis-echeance.component.html',
  styleUrl: './avis-echeance.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class AvisEcheanceComponent implements OnInit {
  callState: any=null;
  showSummary: boolean = true;
  @Input() singleLot!: any;
  data: any[] = [];
  public ProfilEnum = ProfilEnum;
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1);
  loading: boolean = false;
  file: File | null = null;
  IMG_URL: String = environment.fileUrl;

  paymentCalls: any[] = [];
  selectedAppelFond: any = {};
  isEditMode = false;
  hideActions = false;
  action: string | null = null;
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('XOF', 'FCFA');
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
      if (this.action === 'DETAILS') {
        this.hideActions = true;
      }
    });
     this.getCallStats()
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

  openFormModal(content: TemplateRef<any>, appelFond: any = null) {
    this.isEditMode = !!appelFond;
    this.selectedAppelFond = appelFond ? { ...appelFond } : {};
    const modalRef = this.modalService.open(content, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      windowClass: 'appointment-modal',
    });
    modalRef.dismissed.subscribe((reason) => {
      this.getPaymentCalls();
    });
  }

  onUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newLogoUrl = e.target.result;
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
      backdrop: 'static',
      windowClass: 'upload-modal',
    });
  }

  openPdf(technicalSheet: any) {
    const url = `${this.IMG_URL}/${technicalSheet}`;
    window.open(url, '_blank');
  }

  onSave() {
    this.spinner.show();
    const formData = new FormData();
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
              html: 'Document enregistré avec succès.',
              showConfirmButton: false,
              timer: 2000,
              background: '#fff',
              customClass: {
                popup: 'animated fadeInDown faster',
              },
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
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: "Une erreur est survenue lors de l'enregistrement",
              background: '#fff',
              customClass: {
                popup: 'animated fadeInDown faster',
              },
            });
          },
        });
    }
  }

  getPaymentCalls() {
    const endpoint = '/payment-calls/property/' + this.singleLot.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.paymentCalls = data;
        this.  getCallStats()
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  onFormSubmit(formData: any) {
    if (this.isEditMode) {
      const index = this.data.findIndex((item) => item.id === formData.id);
      this.data[index] = formData;
      Swal.fire({
        icon: 'success',
        title: 'Modifié!',
        text: 'Appel de fond modifié avec succès.',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown faster',
        },
      });
    } else {
      this.data.push(formData);
      Swal.fire({
        icon: 'success',
        title: 'Ajouté!',
        text: 'Appel de fond ajouté avec succès.',
        background: '#fff',
        customClass: {
          popup: 'animated fadeInDown faster',
        },
      });
    }
    this.modalService.dismissAll();
  }

  onDelete(item: any) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Vous ne pourrez pas revenir en arrière!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown faster',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const endpoint = '/payment-calls/' + item.id;
        this.userService.deleteData(endpoint).subscribe({
          next: (data) => {
            this.getPaymentCalls();
            Swal.fire({
              icon: 'success',
              title: 'Supprimé!',
              text: 'Appel de fond supprimé avec succès.',
              showConfirmButton: false,
              timer: 1500,
              background: '#fff',
              customClass: {
                popup: 'animated fadeInDown faster',
              },
            });
          },
          error: (err) => {
            console.error(err);
          },
        });
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
      html: `Souhaitez-vous changer le statut à <strong>${confirmationText}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      confirmButtonColor: '#4361ee',
      cancelButtonColor: '#95a5a6',
      background: '#fff',
      customClass: {
        popup: 'animated fadeInDown faster',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        data.status = newStatus;
        this.onSubmit(data, `Le statut a été changé à ${confirmationText}.`);
      } else {
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
                background: '#fff',
                customClass: {
                  popup: 'animated fadeInDown faster',
                },
              }).then(() => {
                this.getPaymentCalls();
              });
            },
            error: (err) => {
              console.error('Error during saving:', err);
              this.loading = false;
              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Une erreur est survenue lors de la mise à jour',
                showConfirmButton: false,
                timer: 2000,
                background: '#fff',
                customClass: {
                  popup: 'animated fadeInDown faster',
                },
              });
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
      img.src = './assets/images/logo-app-black.svg';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (error) => reject(error);
    });
  }

  async downloadInvoice(item: any) {
    if (this.singleLot.rental) {
      this.downloadInvoiceRental(item);
    } else {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      try {
        const logoBase64 = await this.loadLogo();
        doc.addImage(logoBase64, 'PNG', 10, 10, 50, 15);

        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURE PRO FORMA', pageWidth / 2, 30, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);

        // Cadre d'informations
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(10, 40, pageWidth - 20, 60, 3, 3, 'FD');

        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('N° Facture:', 15, 52);
        doc.text('Date:', 15, 62);
        doc.text('Montant:', 15, 72);
        doc.text('Échéance:', 15, 82);
        doc.text('Client:', 15, 92);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`${item.id}`, pageWidth - 15, 52, { align: 'right' });
        doc.text(
          `${new Date(item.updatedAt).toLocaleDateString('fr-FR')}`,
          pageWidth - 15,
          62,
          { align: 'right' },
        );
        doc.text(`${this.formatPrix(item.amount)}`, pageWidth - 15, 72, {
          align: 'right',
        });
        doc.text(`${item.expectedDate}`, pageWidth - 15, 82, {
          align: 'right',
        });
        doc.text(
          `${this.currentuser.prenom} ${this.currentuser.nom}`,
          pageWidth - 15,
          92,
          { align: 'right' },
        );

        doc.save(`Facture_${item.id}.pdf`);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
  }

  calculateLoyerFromTotal(
    totalAmount: number,
    tvaPercent: number,
    tomAmount: number,
  ): number {
    if (!totalAmount || totalAmount <= 0) return 0;

    const tvaRate = tvaPercent ? tvaPercent / 100 : 0;
    const tom = tomAmount || 0;

    const loyer = (totalAmount - tom) / (1 + tvaRate);
    return loyer > 0 ? Math.round(loyer) : 0;
  }

  async downloadInvoiceRental(item: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const logoBase64 = await this.loadLogo();

      const property = item?.realEstateProperty;
      const promoter = property?.promoter;
      const client = property?.recipient;

      const promoterFullName =
        `${promoter?.prenom ?? ''} ${promoter?.nom ?? ''}`.trim() ||
        'Nom non renseigné';
      const promoterAddress = promoter?.address ?? 'Adresse non renseignée';
      const promoterPhone = promoter?.telephone ?? 'Téléphone non renseigné';
      const promoterEmail = promoter?.email ?? 'Email non renseigné';

      const clientFullName =
        `${client?.prenom ?? ''} ${client?.nom ?? ''}`.trim() ||
        'Client non renseigné';
      const clientAddress = client?.address ?? 'Adresse non renseignée';
      const clientPhone = client?.telephone ?? 'Téléphone non renseigné';
      const clientEmail = client?.email ?? 'Email non renseigné';

      const propertyName = property?.name ?? 'Bien non renseigné';
      const propertyAddress =
        property?.address ?? 'Adresse du bien non renseignée';

      const referenceId = item?.id ?? '-';
      const expectedDate = item?.expectedDate ?? '-';

      const totalAmount = item?.amount ?? 0;
      const tom = item?.tom ?? 0;
      const tva = item?.tva ?? 0;

      const loyer = this.calculateLoyerFromTotal(totalAmount, tva, tom);

      // En-tête
      doc.addImage(logoBase64, 'PNG', 10, 10, 45, 15);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        [promoterFullName, promoterAddress, promoterPhone, promoterEmail],
        pageWidth - 10,
        12,
        { align: 'right' },
      );

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('REÇU DE LOYER', pageWidth / 2, 35, { align: 'center' });

      // Informations bien
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Bien immobilier', 10, 50);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(propertyName, 10, 57);
      doc.setFontSize(10);
      doc.text(propertyAddress, 10, 64);

      // Informations client
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Client', 10, 80);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      doc.text(
        [
          clientFullName,
          clientAddress,
          `Tél: ${clientPhone}`,
          `Email: ${clientEmail}`,
        ],
        10,
        87,
      );

      // Date échéance
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(`Échéance du : ${expectedDate}`, pageWidth / 2, 115, {
        align: 'center',
      });

      // Tableau des montants
      autoTable(doc, {
        startY: 125,
        margin: { left: 10, right: 10 },
        tableWidth: pageWidth - 20,
        head: [['Libellé', 'Montant (FCFA)']],
        body: [
          ['Loyer', this.formatMoney(loyer)],
          ['Provision T.O.M.', this.formatMoney(tom)],
          [
            'TVA / Loyer',
            this.formatMoney(this.calculateTvaAmount(loyer, tva)),
          ],
          ['TOTAL À PAYER', this.formatMoney(totalAmount)],
        ],
        styles: {
          fontSize: 11,
          cellPadding: 8,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [67, 97, 238],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' },
          1: { halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY ?? 150;

      // Pied de page
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Référence : ${referenceId}`, 10, finalY + 15);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Ce reçu est valable uniquement pour l'échéance en cours.",
        10,
        finalY + 22,
      );

      doc.save(`Recu_${referenceId}.pdf`);
    } catch (error) {
      console.error('Erreur génération PDF :', error);
    }
  }

  formatMoney(value?: number): string {
    const safeValue = value ?? 0;
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .format(safeValue)
        .replace(/\s/g, ' ') + ' FCFA'
    );
  }

  calculateTvaAmount(amount: number, tvaPercent: number): number {
    if (!amount || !tvaPercent) {
      return 0;
    }
    return (amount * tvaPercent) / 100;
  }

  getCallStats(): void {
    const endpoint = '/payment-calls/' + this.singleLot.id + '/kpi';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.callState=data
      },
      error: (err) => {
        console.error('Erreur chargement indicateurs', err);
      },
    });
  }
}
