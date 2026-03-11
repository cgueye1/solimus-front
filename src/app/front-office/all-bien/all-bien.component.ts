import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardBienHorizComponent } from '../../shared/components/card-bien-horiz/card-bien-horiz.component';
import { Ibien } from '../../shared/models/bien-model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { environment } from '../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../_services/user.service';
import { CardBienHorizoComponent } from '../../shared/components/card-bien-horiz-front/card-bien-horiz.component';
import {
  LocationData,
  LocationInputComponent,
} from '../../map/location-input.component';

@Component({
  selector: 'app-all-bien',
  standalone: true,
  imports: [
    CardBienHorizoComponent,
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    LocationInputComponent,
  ],
  templateUrl: './all-bien.component.html',
  styleUrl: './all-bien.component.scss',
})
export class AllBienComponent implements OnInit {
  googleMapsApiKey = 'AIzaSyAGd7ZK7kkDEr9NOWcQOzkbDL8ddUStX9A'; // Remplacez par votre clé API
  selectedLocation: LocationData | null = null;
  prix: number = 200000000; // Default value, adjust as needed
  minPrix: number = 0;
  maxPrix: number = 1000000000; // Maximum value (1 billion)

  rental!: boolean;

  IMG_URL: String = environment.fileUrl;
  searchForm!: FormGroup;

  bienList: any[] = [];
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  searching: boolean = false;
  totalPages: number = 0;
  ///end lazy
  pageSize = 100;
  propertyTypeList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private fb: FormBuilder,
    public modal: NgbModal,
    private userService: UserService,
    private spinner: NgxSpinnerService,
  ) {}

  goReturn() {
    this.location.back();
  }

  onLocationSelected(location: LocationData) {
    this.selectedLocation = location;
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['rental'] !== undefined) {
        this.rental = params['rental'] === 'true';
        this.loadMorePropreties(this.rental);
      } else {
        this.rental = false;
      }

      this.getPropretyTypes();
    });

    this.initForm();
  }

  onPrixChange(event: any) {
    this.prix = event.target.value;
  }
  getPropretyTypes() {
    const endpoint = '/property-types/all';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.propertyTypeList = data.filter(
          (item: any) => item.parent === !this.rental,
        );
      },
      error: (err) => {},
    });
  }
  onSearch() {
    this.spinner.show();
    this.currentPage = 0;
    this.dataEnded = false;
    this.bienList = [];
    this.searching = true;

    this.loadMorePropreties(this.rental);
  }
  onCreate() {
    this.router.navigate(['/gestion-vente-vefa/create-bien']);
  }

  onView(data: any) {
    console.log(this.rental);

    if (this.rental) {
      console.log(data.id);
      this.router.navigate(['/biens', data.id, 'detail']);
    } else {
      this.router.navigate(['/parent', data.id, 'detail']);
    }
  }

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }

  initForm() {
    this.searchForm = this.fb.group({
      propertyTypeId: [''],
      minPrice: [''],
      maxPrice: [''],
      address: [''],
      name: [''],
    });
  }

  loadMorePropreties(rental: boolean) {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }
      var endpoint = rental
        ? `/realestate/rental/search-portail?page=${this.currentPage}&size=${this.pageSize}`
        : `/realestate/search-portail?page=${this.currentPage}&size=${this.pageSize}`;

      var body = {
        propertyTypeId: this.searching
          ? this.searchForm.get('propertyTypeId')?.value
          : '',
        minPrice: this.searching ? this.searchForm.get('minPrice')?.value : '',
        maxPrice: this.searching ? this.searchForm.get('maxPrice')?.value : '',
        address: this.searching
          ? this.selectedLocation != null
            ? this.selectedLocation!.name
            : ''
          : '',
        name: this.searching ? this.searchForm.get('name')?.value : '',

        latitude: this.searching
          ? this.selectedLocation != null
            ? this.selectedLocation!.latitude
            : null
          : null,
        longitude: this.searching
          ? this.selectedLocation != null
            ? this.selectedLocation!.longitude
            : null
          : null,
      };
      this.spinner.show();
      this.userService.saveAnyData(body, endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.bienList = data.content;
          this.dataEnded = data.last;
          this.searching = false;

          this.spinner.hide();
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.bienList = res.message;
              this.searching = false;
              this.spinner.hide();
            } catch {
              this.loading = false;
              this.searching = false;
              this.spinner.hide();
              //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.loading = false;
            this.searching = false;
            this.spinner.hide();
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
