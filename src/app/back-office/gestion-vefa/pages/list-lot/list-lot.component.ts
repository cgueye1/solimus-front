import { Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardLotComponent } from '../../../../shared/components/card-lot/card-lot.component';
import { ILot } from '../../../../shared/models/lot-model';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-list-lot',
  standalone: true,
  imports: [CommonModule, CardLotComponent],
  templateUrl: './list-lot.component.html',
  styleUrl: './list-lot.component.scss',
})
export class ListLotComponent implements OnInit {
  lots: any[] = [];
  @Input() data!: any;

  searchText: string = '';
  IMG_URL: String = environment.fileUrl;
  currentUser: any;
  user: any;
  pageSize = 40;
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.getMe();
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
        this.loadMoreLots();
      },
      error: (err) => {},
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      this.loadMoreLots();
    }
  }

  onCreateLot() {
    this.router.navigate([this.data.id, 'create-lot'], {
      relativeTo: this.activatedRoute,
    });
  }

  onViewLot(data: any) {
    this.router.navigate([data.id, 'detail-lot'], {
      relativeTo: this.activatedRoute,
    });
  }

  onSearch() {
    this.currentPage = 0;
    this.dataEnded = false;
    this.lots = [];
    this.loadMoreLots();
  }

  loadMoreLots() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.lots)
        if (this.lots.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }

      var endpoint = `/realestate/search-by-parent?page=${this.currentPage}&size=${this.pageSize}`;

      var body = {
        parentPropertyId: this.data.id,
      };
      this.userService.saveAnyData(body, endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.lots =
            this.searchText == ''
              ? this.lots.concat(data.content)
              : (this.lots = data.content);
          this.dataEnded = data.last;
          this.lots.sort((a, b) => {
            const nameA = a.name.match(/\d+/g);
            const nameB = b.name.match(/\d+/g);
            if (nameA && nameB) {
              return parseInt(nameA[0], 10) - parseInt(nameB[0], 10);
            }
            return a.name.localeCompare(b.name);
          });
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.lots = res.message;
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

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
}
