import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  LOCALE_ID,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from '../../../../../environments/environment.prod';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { GoogleMapsModule } from '@angular/google-maps';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../../../_services/storage.service';

declare const google: any; // Declare google variable for TypeScript
interface PhotonSuggestModel {
  name: string;
  countryCode: string;
  // Ajoutez d'autres propriétés si nécessaire
}

@Component({
  selector: 'app-create-bien',
  standalone: true,

  imports: [
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    FormsModule,
    NgbTypeaheadModule,
    MatAutocompleteModule,
    GoogleMapsModule,
  ],

  templateUrl: './create-bien-syndic.component.html',
  styleUrl: './create-bien-syndic.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    DecimalPipe, // Ajoutez le DecimalPipe ici
  ],
})
export class CreateBienSyndicComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;

  //place
  placeControl = new FormControl('');
  filteredOptions: Observable<PhotonSuggestModel[]> | undefined;
  realEstatePropertyForm!: FormGroup;
  loading: boolean = false;
  IMG_URL: String = environment.fileUrl;
  id: any;
  rental = false;
  images: File[] = [];
  plan: File | null = null; // Renamed from singleImage to plan
  planPreview: string | null = null;
  legalStatusFile: File | null = null;

  filteredNotaires: Observable<any[]> | undefined; // Observable for filtered notaires
  notaireControl = new FormControl(); // Control for the notaire input

  notaireList: any[] = [];

  propertyTypeList: any[] = [];

  latitude: number = 0;
  longitude: number = 0;
  isMapVisible: boolean = false;
  singleBien: any;

  selectedBank: any;
  selectedAgency: any;

  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // 1 à 100
  map!: google.maps.Map;
  marker!: google.maps.marker.AdvancedMarkerElement;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  focus1$ = new Subject<string>();
  click1$ = new Subject<string>();
  searchQuery: string = '';
  searchQuery1: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private currencyPipe: CurrencyPipe,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private storageService: StorageService,
  ) {
    this.realEstatePropertyForm = this.fb.group({
      price: ['', Validators.required],
      reservationFee: [
        '',
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
    });

    this.filteredOptions = this.placeControl.valueChanges.pipe(
      startWith(''),
      debounceTime(100),
      distinctUntilChanged(),
      filter((value) => !!value), // Ignore les valeurs null, undefined et vides
      switchMap((value) => this.fetchSuggestions(value as string)), // Cast explicite pour éviter les erreurs TypeScript
    );
  }

  //place search

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

  //
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['rental'] !== undefined) {
        this.rental = params['rental'] === 'true';
      } else {
        this.rental = false;
      }

      this.getMe();
    });

    this.initForm();
    this.getNotaries();
    this.getPropretyTypes();
    this.getMe();

    // this.loadGoogleMapsApi();
    this.filteredNotaires = this.notaireControl.valueChanges.pipe(
      startWith(''),
      map((value) =>
        typeof value === 'string' ? value : this.displayFn(value),
      ), // Conversion si nécessaire
      map((input) => (input ? this._filter(input) : this.notaireList.slice())), // Filtrage des notaires
    );
  }

  /////search bank

  getBank(word: string): Observable<any[]> {
    const endpoint = '/v1/user/search/bank?keyword=' + word;
    return this.userService.getDatas(endpoint).pipe(
      catchError((error) => {
        return of([]); // Return an empty array in case of an error
      }),
    );
  }

  // Typeahead search function
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => (term.length < 2 ? of([]) : this.getBank(term))),
    );
  // Method to handle the selected item from the Typeahead
  onSelect(bank: any): void {
    this.selectedBank = bank; // Set the selected property
  }
  ////en search bank

  /////search agency

  getAgency(keyword: string): Observable<any[]> {
    const endpoint = `/v1/user/search/agency?keyword=${keyword}`;
    return this.userService.getDatas(endpoint).pipe(
      catchError((error) => {
        return of([]); // Retourne un tableau vide en cas d'erreur
      }),
    );
  }

  // Fonction de recherche pour le Typeahead
  searchAgency = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term: string) =>
        term.length < 2 ? of([]) : this.getAgency(term),
      ),
    );

  // Méthode pour gérer l'agence sélectionnée
  onSelectAgency(agency: any): void {
    this.selectedAgency = agency; // Stocke l'agence sélectionnée
  }
  ////end search age agency

  // Formatter for the selected item (this ensures that the input field shows the bank's name)
  formatter = (x: { company: { name: string } }) => x.company.name;

  formatter1 = (x: { company: { name: string } }) => x.company.name;

  formatNumber(value: string): string {
    // Retirer les espaces et formater le nombre
    const cleanedValue = value.replace(/\s/g, ''); // Retirer les espaces
    if (!cleanedValue) return '';

    const numberValue = parseInt(cleanedValue, 10);
    return isNaN(numberValue) ? '' : numberValue.toLocaleString('fr-FR'); // Formater avec des espaces
  }

  onPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.formatNumber(input.value);
    input.value = formattedValue;
  }

  onFeesFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.formatNumber(input.value);
    input.value = formattedValue;
  }

  //%%
  onPercentageSelect(event: Event) {
    const target = event.target as HTMLSelectElement; // Assurez-vous que target est un élément select
    const percentage = Number(target.value); // Convertir la valeur en nombre
    this.realEstatePropertyForm.get('reservationFee')?.setValue(percentage);
  }

  //%%

  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.realEstatePropertyForm.patchValue({
          promoterId: data.id,
        });
      },
      error: (err) => {},
    });
  }

  getNotaries() {
    const endpoint = '/v1/user/notaires';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.notaireList = data;
      },
      error: (err) => {},
    });
  }
  getPropretyTypes() {
    const endpoint = '/property-types/all';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        if (this.rental) {
          this.propertyTypeList = data.filter(
            (item: any) => item.parent === false,
          );
        } else {
          this.propertyTypeList = data.filter(
            (item: any) => item.parent === true,
          );
        }
      },
      error: (err) => {},
    });
  }

  private _filter(libelle: string): any[] {
    const filterValue = libelle.toLowerCase();

    return this.notaireList.filter(
      (option) =>
        option.nom.toLowerCase().includes(filterValue) ||
        option.prenom.toLowerCase().includes(filterValue) ||
        option.telephone.toLowerCase().includes(filterValue),
    );
  }

  selectNotaire(event: MatAutocompleteSelectedEvent) {
    const notaire = event.option.value;
    this.notaireControl.setValue(notaire);
    this.realEstatePropertyForm.patchValue({ notaryId: notaire.id });
  }

  displayFn(notaire: any): string {
    return notaire ? `${notaire.nom} ${notaire.prenom}` : '';
  }
  initForm() {
    this.realEstatePropertyForm = this.fb.group({
      name: ['', Validators.required],
      number: [''],
      // address: ['', Validators.required],
      price: [''],
      numberOfRooms: [0],
      area: ['', Validators.required],
      latitude: ['14.750260'],
      longitude: ['-17.472360'],
      available: [true],
      reservationFee: [0],
      description: [''],
      numberOfLots: [0],
      feesFile: [0],
      promoterId: [''],
      recipientId: [0],
      notaryId: [''],
      parentPropertyId: [0],
      propertyTypeId: ['', Validators.required],
      plan: [null], // Plan file field
      legalStatus: [null], // Legal status file field
      pictures: this.fb.array([]),
      hasHall: [false],
      hasParking: [false],
      hasElevator: [false],
      hasSwimmingPool: [false],
      hasGym: [false],
      hasPlayground: [false],
      hasSecurityService: [false],
      hasGarden: [false],
      hasSharedTerrace: [false],
      hasBicycleStorage: [false],
      hasLaundryRoom: [false],
      hasStorageRooms: [false],
      hasWasteDisposalArea: [false],
    });
  }

  get pictures() {
    return this.realEstatePropertyForm.get('pictures') as FormArray;
  }

  onPlanSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.realEstatePropertyForm.patchValue({
          plan: file,
        });
        this.plan = file; // Renamed from singleImage
      };
      reader.readAsDataURL(file);
    }
  }

  onLegalStatusSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.realEstatePropertyForm.patchValue({
        legalStatus: file,
      });
      this.legalStatusFile = file;
    }
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

  onDeletePlan(fileInput: any) {
    this.realEstatePropertyForm.patchValue({ plan: null });
    this.plan = null;
    fileInput.value = '';
  }

  onDeleteLegalStatus(fileInput: any) {
    this.realEstatePropertyForm.patchValue({ legalStatus: null });
    this.legalStatusFile = null;
    fileInput.value = '';
  }

  onDeleteGalleryImage(index: number) {
    this.pictures.removeAt(index);
    this.images.splice(index, 1);

    // Reset input file
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSave() {
    const profil = this.storageService.getSubPlan();
    if (
      this.realEstatePropertyForm.valid &&
      !this.loading &&
      this.images &&
      this.images.length > 0
    ) {
      const formData = new FormData();

      if (profil) {
        formData.append('profil', profil);
      }
      formData.append('name', this.realEstatePropertyForm.get('name')?.value);

      formData.append('coOwner', 'true');

      if (this.placeControl.value) {
        formData.append('address', this.placeControl.value);
      }

      formData.append(
        'numberOfRooms',
        this.rental
          ? this.realEstatePropertyForm.get('numberOfLots')?.value
          : this.realEstatePropertyForm.get('numberOfRooms')?.value,
      );
      formData.append('area', this.realEstatePropertyForm.get('area')?.value);

      formData.append(
        'available',
        this.realEstatePropertyForm.get('available')?.value,
      );

      formData.append(
        'description',
        this.realEstatePropertyForm.get('description')?.value,
      );
      formData.append(
        'numberOfLots',
        this.realEstatePropertyForm.get('numberOfLots')?.value,
      );
      formData.append(
        'promoterId',
        this.realEstatePropertyForm.get('promoterId')?.value,
      );

      formData.append(
        'parentPropertyId',
        this.realEstatePropertyForm.get('parentPropertyId')?.value,
      );
      formData.append(
        'propertyTypeId',
        this.realEstatePropertyForm.get('propertyTypeId')?.value,
      );

      // Append the file inputs
      if (this.plan || this.images.length > 0) {
        //formData.append('plan', this.plan, this.plan.name);

        formData.append('plan', this.images[0], this.images[0].name);
      }
      if (this.legalStatusFile) {
        formData.append(
          'legalStatus',
          this.legalStatusFile,
          this.legalStatusFile.name,
        );
      }

      this.images.forEach((file, index) => {
        formData.append(`pictures`, file, file.name);
      });

      if (!this.loading) {
        this.spinner.show();

        this.loading = true;
        this.userService.saveFormData(formData, `/realestate/save`).subscribe({
          next: (data) => {
            this.loading = false;
            this.spinner.hide();
            Swal.fire({
              icon: 'success',
              html: 'Property added successfully.',
              showConfirmButton: false,
              timer: 1000,
            }).then(() => {
              this.router
                .navigateByUrl('/', { skipLocationChange: true })
                .then(() => {
                  this.router.navigate(['/gestion-syndic']);
                });
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              html: 'Error during saving:',
              showConfirmButton: false,
              timer: 2000,
            });
            this.loading = false;
            this.spinner.hide();
          },
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        html: 'The form is invalid.',
        showConfirmButton: false,
        timer: 2000,
      });
      this.spinner.hide();
    }
  }

  onReset() {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/gestion-vente-vefa']);
    });
  }
}
