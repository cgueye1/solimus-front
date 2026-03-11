import {
  Component,
  HostListener,
  LOCALE_ID,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuPortailComponent } from '../../shared/layouts/menu-portail/menu-portail.component';
import { FooterPortailComponent } from '../../shared/layouts/footer-portail/footer-portail.component';
import { environment } from '../../../environments/environment.prod';
import { UserService } from '../../_services/user.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import localeFr from '@angular/common/locales/fr';
import {
  LocationData,
  LocationInputComponent,
} from '../../map/location-input.component';
import { StandalonePacsViewerComponent } from './standalone-pacs-viewer.component';

interface PhotonSuggestModel {
  name: string;
  countryCode: string;
  // Ajoutez d'autres propriétés si nécessaire
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    RouterLink,
    MenuPortailComponent,
    FooterPortailComponent,
    CommonModule,
    ReactiveFormsModule,
    LocationInputComponent,
    StandalonePacsViewerComponent 

    
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class HomepageComponent implements OnInit {
  @ViewChild('descriptionModal') descriptionModal!: TemplateRef<any>;

  selectedDescription: string = '';
  googleMapsApiKey = 'AIzaSyAGd7ZK7kkDEr9NOWcQOzkbDL8ddUStX9A'; // Remplacez par votre clé API
  selectedLocation: LocationData | null = null;

  //place
  myControl = new FormControl('');
  filteredOptions: Observable<PhotonSuggestModel[]> | undefined;

  //
  IMG_URL: String = environment.fileUrl;
  searchForm!: FormGroup;
  currentUser: any;
  bienList: any[] = [];
  bienListLoc: any[] = [];
  promoterCount: any = 0;
  reservataireCount: any = 0;
  bienCount: any = 0;

  ownerCount: number = 0;
  syndicCount: number = 0;
  agencyCount: number = 0;
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  dataEndedLoc: boolean = false;
  searching: boolean = false;
  totalPages: number = 0;
  totalPagesLoc: number = 0;

  currentPageLoc: number = 0;
  ///end lazy
  pageSize = 3;
  propertyTypeList: any[] = [];

  //plan d'abonnement

  allPlans: any[] = [];
  plansByName: Record<string, any[]> = {};
  planNames: string[] = [];
  selectedPlanName: string = '';
  // Installation par défaut : 1 = annuelle, 12 = mensuelle
  planInstallments: Record<number, number> = {};

  // Ou simplement une adresse textuelle
  existingAddress = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    public modal: NgbModal,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private http: HttpClient,
    private modalService: NgbModal,
  ) {
    registerLocaleData(localeFr);
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((value) => !!value), // Ignore les valeurs null, undefined et vides
      switchMap((value) => this.fetchSuggestions(value as string)), // Cast explicite pour éviter les erreurs TypeScript
    );
  }

  onLocationSelected(location: LocationData) {
    this.selectedLocation = location;
  }
  ngOnInit(): void {
    this.loadMorePropreties();

    this.getPropretyTypes();

    this.initForm();

    this.getDash();
    this.getDash1();
    this.getUser();
    this.getPlans();
  }

  ////search place

  /*private _filter(value: string): PhotonSuggestModel[] {
    // Ici, vous pouvez appeler votre API pour récupérer les suggestions
    // Pour l'exemple, je vais simuler une liste de suggestions
    return this.fetchSuggestions(value);
  }*/

  fetchSuggestions(input: string | null): Observable<PhotonSuggestModel[]> {
    if (!input) {
      return of([]); // Retourne un Observable vide si l'entrée est null ou vide
    }

    const url = `https://photon.komoot.io/api/?q=${input}&limit=5&lang=fr&bbox=-17.6866,12.2374,-11.3455,16.5983`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        const allSuggestions = response.features.map((feature: any) => ({
          name: feature.properties.name,
          countryCode: feature.properties.countrycode, // Correction de "countryCode"
        }));

        // Filtrer par code de pays
        const filteredSuggestions = allSuggestions.filter(
          (suggestion: PhotonSuggestModel) => suggestion.countryCode === 'SN',
        );

        // Trier les suggestions par score de correspondance
        return filteredSuggestions.sort(
          (a: PhotonSuggestModel, b: PhotonSuggestModel) => {
            const scoreA = this.calculateMatchScore(a.name, input);
            const scoreB = this.calculateMatchScore(b.name, input);
            return scoreB - scoreA;
          },
        );
      }),
    );
  }

  calculateMatchScore(name: string, input: string): number {
    return name.toLowerCase().includes(input.toLowerCase()) ? 1 : 0;
  }

  //end search place

  getUser() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
      },
      error: (err) => {},
    });
  }

  getDash() {
    const endpoint = '/v1/user/user-count?profil=PROMOTEUR';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.promoterCount = data;
      },
      error: (err) => {},
    });
    const endpoint1 = '/v1/user/user-count?profil=RESERVATAIRE';
    this.userService.getDatas(endpoint1).subscribe({
      next: (data) => {
        this.reservataireCount = data;
      },
      error: (err) => {},
    });

    const endpoint2 = '/realestate/count-no-parent';
    this.userService.getDatas(endpoint2).subscribe({
      next: (data) => {
        this.bienCount = data;
      },
      error: (err) => {},
    });
  }

  getDash1() {
    // this.spinner.show();
    const endpoint = `/v1/user/users/statistics`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.promoterCount = data.totalPromoteurs;
        this.syndicCount = data.totalSyndics;
        this.reservataireCount = data.totalReservataires;
        //this.pro= data.totalProprietaires;
        this.agencyCount = data.totalAgencies;
        // = data.totalTenants;
        // this.indicateurs[7].value = data.totalNotaires;

        this.ownerCount = data.totalProprietaires;
        //  this.spinner.hide();
      },
      error: (err) => {
        //   this.spinner.hide();
      },
    });
  }

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }

  getPropretyTypes() {
    const endpoint = '/property-types/all';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.propertyTypeList = data.filter(
          (item: any) => item.parent === true,
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

    this.loadMorePropreties();
    this.loadMorePropretiesLoc();
  }
  onViewBien(id: number) {
    this.router.navigate(['/parent', id, 'detail']);
  }

  onViewBienLoc(id: number) {
    this.router.navigate(['/biens', id, 'detail']);
  }

  toggleCard(event: Event) {
    const card = event.currentTarget as HTMLElement;
    card.classList.toggle('active');
  }

  onViewAllBiens(rental: boolean) {
    this.router.navigate(['/biens'], {
      queryParams: { rental: rental },
    });
  }

  /*
  onSearch() {
    this.router.navigate(['/biens']);
  }*/

  onRegister() {
    this.router.navigate(['/auth/register']);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const btnScrollToTop = document.querySelector('#btnScrollToTop');

    if (window.scrollY > 200) {
      btnScrollToTop?.classList.add('show');
    } else {
      btnScrollToTop?.classList.remove('show');
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }
      var endpoint = `/realestate/search-portail?page=${this.currentPage}&size=${this.pageSize}`;

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
      this.userService.saveAnyData(body, endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.bienList = data.content;
          this.dataEnded = data.last;
          this.searching = false;
          this.spinner.hide();
          this.loadMorePropretiesLoc();
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
            this.loadMorePropretiesLoc();
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

  loadMorePropretiesLoc() {
    if (!this.loading && !this.dataEndedLoc) {
      this.loading = true;

      if (this.bienListLoc)
        if (this.bienListLoc.length === 0) {
        } else {
          this.currentPageLoc = this.currentPageLoc + 1;
        }
      var endpoint = `/realestate/rental/search-portail?page=${this.currentPageLoc}&size=${this.pageSize}`;

      var body = {
        propertyTypeId: this.searching
          ? this.searchForm.get('propertyTypeId')?.value
          : '',
        minPrice: this.searching ? this.searchForm.get('minPrice')?.value : '',
        maxPrice: this.searching ? this.searchForm.get('maxPrice')?.value : '',
        address: this.searching ? this.myControl.value : '',
        name: this.searching ? this.searchForm.get('name')?.value : '',
      };
      this.userService.saveAnyData(body, endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPagesLoc = data.totalPages;
          this.bienListLoc = data.content;
          this.dataEndedLoc = data.last;
          this.searching = false;
          this.spinner.hide();
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.bienListLoc = res.message;
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

  //plan
  formatPlanName(name: string): string {
    const map: Record<string, string> = {
      PROMOTEUR: 'Promoteur',
      NOTAIRE: 'Notaire',
      RESERVATAIRE: 'Réservataire',
      BANK: 'Banque',
      AGENCY: 'Agence',
      PROPRIETAIRE: 'Propriétaire',
      SYNDIC: 'Syndic',
      LOCATAIRE: 'Locataire',
      PRESTATAIRE: 'Prestataire',
      TOM: 'Autre',
    };

    return map[name] || name;
  }

  // Fonction pour calculer prix dynamique
  getPlanPrice(plan: any): number {
    const mode = this.planInstallments[plan.id] || 1;
    const monthlyPrice = plan.totalCost || 0;

    // 🔹 Annuel avec réduction
    if (mode === 12) {
      const discount = plan.yearlyDiscountRate || 0;
      return monthlyPrice * 12 * (1 - discount / 100);
    }

    // 🔹 Mensuel
    return monthlyPrice;
  }

  toggleInstallment(planId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.planInstallments[planId] = input.checked ? 12 : 1;
  }

  getPlans() {
    this.userService.getDatas('/subscriptions-plans').subscribe({
      next: (plans: any[]) => {
        this.allPlans = plans.filter((plan) => plan.active);
        // Initialisation après récupération des plans
        this.allPlans.forEach((plan) => {
          this.planInstallments[plan.id] = 1; // par défaut annuelle
        });

        // Grouper par name
        this.plansByName = this.allPlans.reduce(
          (acc, plan) => {
            if (!acc[plan.name]) acc[plan.name] = [];
            acc[plan.name].push(plan);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // Liste des noms pour les tabs
        this.planNames = Object.keys(this.plansByName);

        // Fallback
        this.selectedPlanName = this.planNames[0];
      },
      error: (err) => console.error('Erreur récupération des plans', err),
    });
  }

  selectPlan(plan: any) {
    this.onRegister();
  }

  /** Affiche la description complète dans une modal */
  showFullDescription(description: string): void {
    this.selectedDescription = description;
    this.modalService.open(this.descriptionModal, {
      centered: true,
      size: 'lg',
      scrollable: true,
    });
  }

  safeText(text: string): string {
    if (!text) return '';

    return (
      text
        // vrais retours à la ligne
        .replace(/\r\n|\n|\r/g, '<br>')

        // faux retours "nn" MAIS SEULEMENT quand ils séparent des phrases
        .replace(/\.nn/g, '.<br><br>')
        .replace(/nn\s*-/g, '<br>-')

        .trim()
    );
  }
}
