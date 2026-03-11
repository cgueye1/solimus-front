import { Component, HostListener, OnInit } from '@angular/core';
import { CardBienHorizComponent } from '../../../../shared/components/card-bien-horiz/card-bien-horiz.component';
import { Ibien } from '../../../../shared/models/bien-model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';
import { CardBienHorizSyndicComponent } from '../../../../shared/components/card-bien-horiz-syndic/card-bien-horiz-syndic.component';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-list-bien-syndic',
  standalone: true,
  imports: [CardBienHorizSyndicComponent, CommonModule, FormsModule],
  templateUrl: './list-bien-syndic.component.html',
  styleUrl: './list-bien-syndic.component.scss',
})
export class ListBienSyndicComponent implements OnInit {
  statusOptions = ['RESERVED', 'SOLD'];
  statusFilter: string = '';
  searchTextNotaire: string = '';
  isSubActive: any = null;
  statusLabels: { [key: string]: string } = {
    RESERVED: 'Réservé',
    SOLD: 'Vendu',
  };
  searchText: string = '';
  IMG_URL: String = environment.fileUrl;
  bienList: any[] = [];
  currentUser: any;

  pageSize = 15;
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy
  ProfilEnum = ProfilEnum;
  responseError: any = null;
  rental = false;
  isCanAdd: any = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private storageService: StorageService,
  ) {}

  translateStatus(status: string): string {
    return this.statusLabels[status] || status;
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['rental'] !== undefined) {
        this.rental = params['rental'] === 'true';
      } else {
        this.rental = false;
      }

      this.getMe();
    });

    //this.getAllBiens();
  }
  
  
  checkCanAdd() {
    const profil = this.storageService.getSubPlan();
    const endpoint = `/user-subscriptions/can-create-project/${this.currentUser.id}/${profil}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data: boolean) => {
        this.isCanAdd = data;
      },
      error: (err) => {
        this.isCanAdd = false; // sécurité
      },
    });
  }
  getCurrentSub() {
    const profil = this.storageService.getSubPlan();
    const endpoint = `/user-subscriptions/is-active/${this.currentUser.id}/${profil}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data: boolean) => {
        this.isSubActive = data;
      },
      error: (err) => {
        this.isSubActive = false; // sécurité
      },
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

    if (nearBottom && !this.loading && !this.dataEnded) {
      this.loadMorePropreties();
    }
  }

  renewSubscription() {
    this.router.navigate(['/settings/accounts']);
  }
  getMe() {
    this.spinner.show();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        //  this.loadMorePropreties();
        this.onSearch();
        this.getCurrentSub();
        this. checkCanAdd()
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }
  onSearch() {
    this.currentPage = 0;
    this.dataEnded = false;
    this.bienList = [];
    this.loadMorePropreties();
  }

  onCreate() {
    this.router.navigate(['/gestion-syndic/create-bien-syndic']);
  }

  onView(data: any) {
    this.router.navigate([data.id, 'detail-syndic'], {
      relativeTo: this.activatedRoute,
    });
  }
  loadMorePropreties() {
    if (this.loading || this.dataEnded) return;
    this.spinner.show();
    this.loading = true;

    let endpoint = '';
    const pageParams = `?page=${this.currentPage}&size=${this.pageSize}`;
    const profil = this.storageService.getSubPlan();
    switch (this.currentUser.profil) {
      case ProfilEnum.PROMOTEUR:
        endpoint = this.rental
          ? `/realestate/rental/search-by-promoter${pageParams}`
          : `/realestate/search-by-promoter${pageParams}`;
        break;

      case ProfilEnum.SYNDIC:
        endpoint = `/realestate/search-by-syndic${pageParams}`;
        break;
      case ProfilEnum.NOTAIRE:
        endpoint = `/realestate/notary/${this.currentUser.id}${pageParams}`;
        if (this.statusFilter)
          endpoint += `&status=${encodeURIComponent(this.statusFilter)}`;
        if (this.searchTextNotaire)
          endpoint += `&search=${encodeURIComponent(this.searchTextNotaire)}`;
        break;
      case ProfilEnum.BANK:
        endpoint = `/realestate/search-by-bank${pageParams}`;
        break;
      case ProfilEnum.AGENCY:
        endpoint = `/realestate/search-by-agency${pageParams}`;
        break;
      default:
        endpoint = this.rental
          ? `/reservations/user/${this.currentUser.id}/rental${pageParams}`
          : `/reservations/user/${this.currentUser.id}${pageParams}`;
    }

    const isPostRequest = [
      ProfilEnum.PROMOTEUR,
      ProfilEnum.BANK,
      ProfilEnum.AGENCY,
      ProfilEnum.SYNDIC,
    ].includes(this.currentUser.profil);

    const body = { promoterId: this.currentUser.id, planName: profil };

    const onSuccess = (data: any) => {
      this.totalPages = data.totalPages;
      this.bienList = this.bienList.concat(data.content);
      this.dataEnded = data.last;
      this.currentPage += 1;
      this.loading = false;
      this.spinner.hide();

      console.log(this.bienList);
    };

    const onError = (err: any) => {
      this.loading = false;
      this.spinner.hide();
      if (err.error) {
        this.responseError = err.error;
        try {
          const res = JSON.parse(err.error);
          this.bienList = res.message;
        } catch {
          // Erreur silencieuse
        }
      }
    };

    if (isPostRequest) {
      this.userService
        .saveAnyData(body, endpoint)
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this.userService
        .getDatas(endpoint)
        .subscribe({ next: onSuccess, error: onError });
    }
  }

  /* loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }

      var endpoint =
        this.currentUser.profil === ProfilEnum.PROMOTEUR
          ? `/realestate/search-by-promoter?page=${this.currentPage}&size=${this.pageSize}`
          : this.currentUser.profil === ProfilEnum.NOTAIRE
          ? `/realestate/notary/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`
          : `/reservations/user/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`;

      var body = {
        promoterId: this.currentUser.id,
      };

      if (
        this.currentUser.profil === ProfilEnum.PROMOTEUR ||
        this.currentUser.profil === ProfilEnum.BANK ||
        this.currentUser.profil === ProfilEnum.AGENCY
      ) {
        if (
          this.currentUser.profil === ProfilEnum.BANK ||
          this.currentUser.profil === ProfilEnum.AGENCY
        ) {
          endpoint =
            this.currentUser.profil === ProfilEnum.BANK
              ? `/realestate/search-by-bank?page=${this.currentPage}&size=${this.pageSize}`
              : `/realestate/search-by-agency?page=${this.currentPage}&size=${this.pageSize}`;
        }

        this.userService.saveAnyData(body, endpoint).subscribe({
          next: (data) => {
            this.loading = false;
            this.totalPages = data.totalPages;
            this.bienList =
              this.searchText == ''
                ? this.bienList.concat(data.content)
                : (this.bienList = data.content);
            this.dataEnded = data.last;
          },
          error: (err) => {
            if (err.error) {
              this.responseError = err.error;
              try {
                this.loading = false;
                const res = JSON.parse(err.error);
                this.bienList = res.message;
                this.responseError = err.error;
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
      } else {
        this.userService.getDatas(endpoint).subscribe({
          next: (data) => {
            this.loading = false;
            this.totalPages = data.totalPages;
            this.bienList =
              this.searchText == ''
                ? this.bienList.concat(data.content)
                : (this.bienList = data.content);
            this.dataEnded = data.last;
          },
          error: (err) => {
            if (err.error) {
              this.responseError = err.error;

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
  }*/

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
}
