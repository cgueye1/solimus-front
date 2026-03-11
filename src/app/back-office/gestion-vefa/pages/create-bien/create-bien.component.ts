import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subject, of, BehaviorSubject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  takeUntil,
  startWith,
  shareReplay,
  finalize,
} from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { UserService } from '../../../../_services/user.service';
import { StorageService } from '../../../../_services/storage.service';
import { environment } from '../../../../../environments/environment.prod';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import {
  LocationData,
  LocationInputComponent,
} from '../../../../map/location-input.component';

interface Notaire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
}

interface PropertyType {
  id: number;
  typeName: string;
  parent: boolean;
}

interface Bank {
  id: number;
  company: {
    name: string;
    email?: string;
  };
}

interface Agency {
  id: number;
  company: {
    name: string;
    email?: string;
  };
}

interface Equipment {
  control: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-create-bien',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    NgbTypeaheadModule,
    LocationInputComponent,
    NgxMaskDirective,
  ],
  templateUrl: './create-bien.component.html',
  styleUrls: ['./create-bien.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgxMask(),
  ],
})
export class CreateBienComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('planInput') planInput!: ElementRef<HTMLInputElement>;
  @ViewChild('legalStatusInput') legalStatusInput!: ElementRef<HTMLInputElement>;

  // Form
  realEstatePropertyForm!: FormGroup;
  formSubmitted = false;

  // Data observables
  private propertyTypeSubject = new BehaviorSubject<PropertyType[]>([]);
  propertyTypeList$ = this.propertyTypeSubject.asObservable();

  private notaireListSubject = new BehaviorSubject<Notaire[]>([]);
  notaireList$ = this.notaireListSubject.asObservable();

  filteredNotaires$!: Observable<Notaire[]>;

  // Autocomplete controls
  notaireControl = new FormControl<string | Notaire>('');

  // User data
  currentUser: any;
  ProfilEnum = ProfilEnum;

  // Location
  googleMapsApiKey = 'AIzaSyAGd7ZK7kkDEr9NOWcQOzkbDL8ddUStX9A';
  selectedLocation: LocationData | null = null;

  // Files
  images: File[] = [];
  plan: File | null = null;
  legalStatusFile: File | null = null;
  previewUrl: string | null = null;

  // Selected items
  selectedBank: Bank | null = null;
  selectedAgency: Agency | null = null;

  // UI
  loading = false;
  rental = false;
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

  // Equipment list for template
  equipmentList: Equipment[] = [
    { control: 'hasHall', label: 'Hall', icon: 'meeting_room' },
    { control: 'hasParking', label: 'Parking', icon: 'local_parking' },
    { control: 'hasElevator', label: 'Ascenseur', icon: 'elevator' },
    { control: 'hasSwimmingPool', label: 'Piscine', icon: 'pool' },
    { control: 'hasGym', label: 'Salle de Gym', icon: 'fitness_center' },
    { control: 'hasPlayground', label: 'Aire de jeux', icon: 'toys' },
    { control: 'hasSecurityService', label: 'Sécurité', icon: 'security' },
    { control: 'hasGarden', label: 'Jardin', icon: 'yard' },
    { control: 'hasSharedTerrace', label: 'Terrasse', icon: 'deck' },
    { control: 'hasBicycleStorage', label: 'Rangement vélos', icon: 'pedal_bike' },
    { control: 'hasLaundryRoom', label: 'Salle de lavage', icon: 'local_laundry_service' },
    { control: 'hasStorageRooms', label: 'Stockage', icon: 'inventory' },
    { control: 'hasWasteDisposalArea', label: 'Zone déchets', icon: 'delete' },
  ];

  // Search subjects for typeahead
  private searchBankTerms = new Subject<string>();
  private searchAgencyTerms = new Subject<string>();

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private storageService: StorageService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initRouteParams();
    this.initForm();
    this.loadInitialData();
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INITIALIZATION ==========

  private initRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.rental = params['rental'] === 'true';
        this.cdr.markForCheck();
      });
  }

  private initForm(): void {
    this.realEstatePropertyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', this.rental ? [] : [Validators.required]],
      area: ['', [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      numberOfLots: ['', [Validators.required, Validators.min(1)]],
      feesFile: ['', Validators.required],
      reservationFee: ['', this.rental ? [] : [Validators.required, Validators.min(1), Validators.max(100)]],
      propertyTypeId: [null, Validators.required],
      notaryId: [null, this.rental ? [] : [Validators.required]],
      promoterId: [null],
      recipientId: [null],
      parentPropertyId: [null],
      available: [true],
      latitude: [null],
      longitude: [null],
      number: [''],
      numberOfRooms: [0],
      
      // Equipment
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
      
      // Files
      plan: [null],
      legalStatus: [null],
      pictures: this.fb.array([]),
    });
  }

  private loadInitialData(): void {
    // Load current user
    this.userService.getDatas('/v1/user/me')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.currentUser = data;
          this.realEstatePropertyForm.patchValue({ promoterId: data.id });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading user:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger les informations utilisateur.',
          });
        }
      });

    // Load notaires
    this.userService.getDatas('/v1/user/notaires')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notaireListSubject.next(data);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading notaires:', err)
      });

    // Load property types
    this.userService.getDatas('/property-types/all')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const filtered = data.filter((item: PropertyType) => 
            this.rental ? !item.parent : item.parent
          );
          this.propertyTypeSubject.next(filtered);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading property types:', err)
      });
  }

  private setupAutocomplete(): void {
    // Notaires autocomplete
    this.filteredNotaires$ = combineLatest([
      this.notaireControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        map(value => typeof value === 'string' ? value : this.displayNotaireFn(value))
      ),
      this.notaireList$
    ]).pipe(
      map(([searchTerm, notaires]) => {
        if (!searchTerm) return notaires;
        const term = searchTerm.toLowerCase();
        return notaires.filter(notaire => 
          notaire.nom.toLowerCase().includes(term) ||
          notaire.prenom.toLowerCase().includes(term) ||
          notaire.telephone.includes(term)
        );
      }),
      shareReplay(1)
    );
  }

  // ========== TYPEAHEAD METHODS ==========

  searchBanks = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => 
        term.length < 2 ? of([]) : this.getBank(term).pipe(
          catchError(() => of([]))
        )
      )
    );
  };

  searchAgencies = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => 
        term.length < 2 ? of([]) : this.getAgency(term).pipe(
          catchError(() => of([]))
        )
      )
    );
  };

  private getBank(keyword: string): Observable<Bank[]> {
    return this.userService.getDatas(`/v1/user/search/bank?keyword=${encodeURIComponent(keyword)}`);
  }

  private getAgency(keyword: string): Observable<Agency[]> {
    return this.userService.getDatas(`/v1/user/search/agency?keyword=${encodeURIComponent(keyword)}`);
  }

  bankFormatter = (bank: Bank): string => bank?.company?.name || '';
  agencyFormatter = (agency: Agency): string => agency?.company?.name || '';

  onBankSelect(event: NgbTypeaheadSelectItemEvent<Bank>): void {
    this.selectedBank = event.item;
  }

  onAgencySelect(event: NgbTypeaheadSelectItemEvent<Agency>): void {
    this.selectedAgency = event.item;
  }

  displayNotaireFn(notaire: Notaire | null): string {
    return notaire ? `${notaire.nom} ${notaire.prenom}` : '';
  }

  selectNotaire(event: MatAutocompleteSelectedEvent): void {
    const notaire = event.option.value as Notaire;
    this.notaireControl.setValue(notaire);
    this.realEstatePropertyForm.patchValue({ notaryId: notaire.id });
  }

  // ========== LOCATION ==========

  onLocationSelected(location: LocationData): void {
    this.selectedLocation = location;
    this.realEstatePropertyForm.patchValue({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    this.cdr.markForCheck();
  }

  // ========== FILE HANDLING ==========

  onPlanSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && this.validateImageFile(file)) {
      this.plan = file;
      this.realEstatePropertyForm.patchValue({ plan: file });
      
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  onLegalStatusSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file && this.validateDocumentFile(file)) {
      this.legalStatusFile = file;
      this.realEstatePropertyForm.patchValue({ legalStatus: file });
      this.cdr.markForCheck();
    }
  }

  onMultipleFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    const validFiles = files.filter(file => this.validateImageFile(file));
    
    this.images.push(...validFiles);
    
    const picturesArray = this.realEstatePropertyForm.get('pictures') as FormArray;
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        picturesArray.push(this.fb.control(reader.result));
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });
    
    this.cdr.markForCheck();
  }

  private validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      Swal.fire('Erreur', 'Format de fichier non supporté. Utilisez JPG ou PNG.', 'error');
      return false;
    }
    
    if (file.size > maxSize) {
      Swal.fire('Erreur', 'Le fichier ne doit pas dépasser 5 Mo.', 'error');
      return false;
    }
    
    return true;
  }

  private validateDocumentFile(file: File): boolean {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      Swal.fire('Erreur', 'Format de fichier non supporté. Utilisez PDF ou DOC.', 'error');
      return false;
    }
    
    if (file.size > maxSize) {
      Swal.fire('Erreur', 'Le fichier ne doit pas dépasser 10 Mo.', 'error');
      return false;
    }
    
    return true;
  }

  deleteImage(): void {
    this.plan = null;
    this.previewUrl = null;
    this.realEstatePropertyForm.patchValue({ plan: null });
    if (this.planInput) {
      this.planInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  onDeleteLegalStatus(input: HTMLInputElement): void {
    this.legalStatusFile = null;
    this.realEstatePropertyForm.patchValue({ legalStatus: null });
    input.value = '';
    this.cdr.markForCheck();
  }

  onDeleteGalleryImage(index: number): void {
    (this.realEstatePropertyForm.get('pictures') as FormArray).removeAt(index);
    this.images.splice(index, 1);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  // ========== FORM VALIDATION ==========

  isFieldInvalid(fieldName: string): boolean {
    const field = this.realEstatePropertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  // ========== FORMATTING ==========

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '');
    if (value) {
      const number = parseInt(value, 10);
      if (!isNaN(number)) {
        input.value = number.toLocaleString('fr-FR');
      }
    }
  }

  onFeesFileInput(event: Event): void {
    this.onPriceInput(event); // Same formatting
  }

  onPercentageSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.realEstatePropertyForm.patchValue({ reservationFee: Number(select.value) });
  }

  // ========== FORM SUBMISSION ==========

  onSave(): void {
    this.formSubmitted = true;
    
    // Validate form
    if (!this.realEstatePropertyForm.valid) {
      this.scrollToFirstError();
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs obligatoires.',
        timer: 3000,
        showConfirmButton: true,
      });
      return;
    }

    // Validate location
    if (!this.selectedLocation) {
      Swal.fire({
        icon: 'warning',
        title: 'Adresse requise',
        text: 'Veuillez sélectionner une adresse.',
        timer: 3000,
        showConfirmButton: true,
      });
      return;
    }

    // Validate files
    if (!this.rental && !this.plan) {
      Swal.fire({
        icon: 'warning',
        title: 'Plan requis',
        text: 'Veuillez télécharger le plan du bien.',
        timer: 3000,
        showConfirmButton: true,
      });
      return;
    }

    if (this.rental && this.images.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Images requises',
        text: 'Veuillez ajouter au moins une image.',
        timer: 3000,
        showConfirmButton: true,
      });
      return;
    }

    this.submitForm();
  }

  private scrollToFirstError(): void {
    const firstError = document.querySelector('.ng-invalid');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private submitForm(): void {
    // Prevent multiple submissions
    if (this.loading) {
      return;
    }
    
    this.loading = true;
    this.spinner.show();
    
    const formData = this.buildFormData();
    
    // Log the FormData contents for debugging (remove in production)
    console.log('Submitting form data:');
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    
    this.userService.saveFormData(formData, '/realestate/save')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // This ensures spinner and loading are always hidden when the request completes (success or error)
          this.loading = false;
          this.spinner.hide();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => this.handleSaveSuccess(response),
        error: (err) => this.handleSaveError(err)
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.realEstatePropertyForm.value;
    const profil = this.storageService.getSubPlan();

    // Add profile if exists
    if (profil) {
      formData.append('profil', profil);
    }

    // Basic fields
    formData.append('rental', String(this.rental));
    formData.append('name', formValue.name);
    formData.append('description', formValue.description);
    formData.append('area', formValue.area);
    formData.append('numberOfLots', formValue.numberOfLots);
    
    // Price fields (remove spaces)
    const priceValue = formValue.price ? formValue.price.toString().replace(/\s/g, '') : '';
    formData.append('price', priceValue);
    
    const feesFileValue = formValue.feesFile ? formValue.feesFile.toString().replace(/\s/g, '') : '';
    formData.append('feesFile', feesFileValue);

    // Location
    if (this.selectedLocation) {
      formData.append('address', this.selectedLocation.name);
      formData.append('latitude', String(this.selectedLocation.latitude));
      formData.append('longitude', String(this.selectedLocation.longitude));
    } else {
      // Add default values if needed
      formData.append('address', '');
      formData.append('latitude', '0');
      formData.append('longitude', '0');
    }

    // IDs
    const promoterId = formValue.promoterId || this.currentUser?.id || '0';
    formData.append('promoterId', promoterId.toString());
    
    formData.append('propertyTypeId', formValue.propertyTypeId?.toString() || '0');
    
    if (!this.rental) {
      formData.append('reservationFee', formValue.reservationFee?.toString() || '0');
      formData.append('notaryId', formValue.notaryId?.toString() || '0');
    }

    // Selected entities
    formData.append('bankId', this.selectedBank?.id?.toString() || '0');
    
    if (this.currentUser?.profil === ProfilEnum.AGENCY) {
      formData.append('agencyId', this.currentUser.id?.toString() || '0');
    } else {
      formData.append('agencyId', this.selectedAgency?.id?.toString() || '0');
    }

    // Files - Only append if they exist
    if (this.plan) {
      formData.append('plan', this.plan, this.plan.name);
    }
    
    if (this.legalStatusFile) {
      formData.append('legalStatus', this.legalStatusFile, this.legalStatusFile.name);
    }
    
    // Append all images with proper filenames
    this.images.forEach((file, index) => {
      formData.append('pictures', file, file.name);
    });

    // Equipment
    this.equipmentList.forEach(equipment => {
      formData.append(equipment.control, String(!!formValue[equipment.control]));
    });

    // Additional optional fields
    if (formValue.number) {
      formData.append('number', formValue.number);
    }
    
    if (formValue.numberOfRooms) {
      formData.append('numberOfRooms', formValue.numberOfRooms.toString());
    }
    
    if (formValue.parentPropertyId) {
      formData.append('parentPropertyId', formValue.parentPropertyId.toString());
    }
    
    if (formValue.recipientId) {
      formData.append('recipientId', formValue.recipientId.toString());
    }

    return formData;
  }

  private handleSaveSuccess(response: any): void {
    console.log('Save successful:', response);
    
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Bien immobilier créé avec succès.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      this.navigateBack();
    });
  }

  private handleSaveError(error: any): void {
    console.error('Save error:', error);
    
    let errorMessage = 'Une erreur est survenue lors de la création.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errorMessage,
      timer: 3000,
      showConfirmButton: true,
    });
  }

  onReset(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    const navigationExtras = this.rental ? { queryParams: { rental: true } } : {};
    this.router.navigate(['/gestion-vente-vefa'], navigationExtras);
  }

  // ========== GETTERS ==========

  get pictures(): FormArray {
    return this.realEstatePropertyForm.get('pictures') as FormArray;
  }
}