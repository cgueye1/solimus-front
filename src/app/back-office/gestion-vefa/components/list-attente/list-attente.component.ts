import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-list-attente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-attente.component.html',
  styleUrl: './list-attente.component.scss',
})
export class ListAttenteComponent {
  IMG_URL: String = environment.fileUrl;
  pageSize = 12;
  selectedLotId: number = 0;
  selectedReservationId: number = 0;
  //lazy loading
  currentPage: number = 0;
  selectedReservation: any;

  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;

  @Input() singleLot!: any;
  data: any = [];

  constructor(
    public modal: NgbModal,
    private userService: UserService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.onSearch();
  }

  onSearch() {
    this.currentPage = 0;
    this.dataEnded = false;
    this.data = [];
    this.loadMorePropreties();
  }

  getStatusLot(status: string): { text: string; class: string } {
    return status === 'RESERVED'
      ? { text: this.singleLot.rental?'Locataire':'Réservataire', class: 'success' }
      : { text: 'Prospect', class: 'warning' };
  }

  openModal(template: any, item: any) {
    this.selectedReservation = item;
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      size: 'lg',
    });
  }

  onSave() {
    Swal.fire({
      icon: 'success',
      html: 'Information enregistrée avec succès.',
      showConfirmButton: false,
      timer: 2000,
    });
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Vous ne pourrez pas revenir en arrière!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        /*this.data = this.data.filter((item) => item.id !== id);
        Swal.fire(
          'Supprimé!',
          'Appel de fond supprimé avec succès.',
          'success'
        );*/
      }
    });
  }

  validReservation() {
    this.spinner.show();
    const endpoint = '/reservations/valid/' + this.selectedReservation.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.selectedReservation = data;
        this.spinner.hide();
        Swal.fire('Félicitations!', 'Reservation validé', 'success');
         this.onSearch()
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.data)
        if (this.data.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }

      var endpoint = `/reservations/lot/${this.singleLot.id}?page=${this.currentPage}&size=${this.pageSize}`;

      this.userService.getDatas(endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.data = data.content;
          this.dataEnded = data.last;
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.data = res.message;
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
}
