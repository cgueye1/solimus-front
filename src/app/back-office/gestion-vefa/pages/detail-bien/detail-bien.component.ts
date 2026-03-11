import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardBienVerticalComponent } from '../../../../shared/components/card-bien-vertical/card-bien-vertical.component';
import { ListLotComponent } from '../list-lot/list-lot.component';
import { UserService } from '../../../../_services/user.service';
import { CommonModule } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-detail-bien',
  standalone: true,
  imports: [
    RouterLink,
    CardBienVerticalComponent,
    ListLotComponent,
    CommonModule,
  ],
  templateUrl: './detail-bien.component.html',
  styleUrl: './detail-bien.component.scss',
})
export class DetailBienComponent implements OnInit {
  id: any;
  singleBien: any;
  user: any;
  loading: boolean = false;
  constructor(
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.getMe();
    this.getSingleBien();
  }

  getMe() {
    const profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.user = data;
        if (profil) {
          this.user.profil = profil;
        }
      },
      error: (err) => {},
    });
  }

  getSingleBien() {
    this.spinner.show();
    this.id = this.route.snapshot.paramMap.get('dataId');

    const endpoint = '/realestate/details/' + this.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.singleBien = data.realEstateProperty;
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }

  onView(dataId: string) {
    this.router.navigate(['/gestion-vente-vefa', dataId, 'edit-bien']);
  }

  delete(): void {
    this.spinner.show();
    this.loading = true;
    const endpoint = '/realestate/delete/' + this.singleBien.id;
    this.userService.deleteData(endpoint).subscribe({
      next: (data) => {
        this.loading = false;
        this.spinner.hide();
        Swal.fire({
          icon: 'success',
          html: 'Le bien est supprimé avec succès',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          this.router.navigate(['/gestion-vente-vefa']);
        });
      },
      error: (error) => {
        Swal.fire({
          icon: 'warning',
          html: 'Un probleme est survenu',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {});
        this.loading = false;
        this.spinner.hide();
      },
    });
  }

  onDelete(): void {
    Swal.fire({
      title: 'Voulez vous vraiment supprimer ce bien ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, je supprime',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.delete();
      }
    });
  }
}
