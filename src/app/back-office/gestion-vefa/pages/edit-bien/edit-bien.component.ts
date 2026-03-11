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
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  takeUntil,
  startWith,
  shareReplay,
  filter,
} from 'rxjs/operators';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { NgbTypeaheadModule, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { UserService } from '../../../../_services/user.service';
import { StorageService } from '../../../../_services/storage.service';
import { environment } from '../../../../../environments/environment.prod';
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
  selector: 'app-edit-bien',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    NgbTypeaheadModule,
    LocationInputComponent,
    NgxMaskDirective,
      FormsModule,
  ],
  templateUrl: './edit-bien.component.html',
  styleUrls: ['./edit-bien.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgxMask(),
  ],
})
export class EditBienComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('planInput') planInput!: ElementRef<HTMLInputElement>;
  @ViewChild('legalStatusInput') legalStatusInput!: ElementRef<HTMLInputElement>;

  googleMapsApiKey = 'AIzaSyAGd7ZK7kkDEr9NOWcQOzkbDL8ddUStX9A';
  IMG_URL: string = environment.fileUrl+"/";

  // Form
  realEstatePropertyForm!: FormGroup;
  formSubmitted = false;

  // Data observables
  private notaireListSubject = new BehaviorSubject<Notaire[]>([]);
  notaireList$ = this.notaireListSubject.asObservable();
  filteredNotaires$!: Observable<Notaire[]>;

  // Autocomplete controls
  notaireControl = new FormControl<string | Notaire>('');

  // Lists
  propertyTypeList: PropertyType[] = [];
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

  // Location
  selectedLocation: LocationData | null = null;
  existingAddress = '';

  // Current property
  singleBien: any;
  id: string | null = null;

  // Files
  images: File[] = [];
  plan: File | null = null;
  legalStatusFile: File | null = null;
  planPreview: string | null = null;

  // Selected items
  selectedBank: Bank | null = null;
  selectedAgency: Agency | null = null;

  // Search queries for typeahead
  searchQuery: string = '';
  searchQuery1: string = '';

  // UI
  loading = false;

  // Search subjects
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
    this.initForm();
    this.loadInitialData();
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INITIALIZATION ==========

  private initForm(): void {
    this.realEstatePropertyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', Validators.required],
      area: ['', [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      numberOfLots: ['', [Validators.required, Validators.min(1)]],
      feesFile: ['', Validators.required],
      reservationFee: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      propertyTypeId: [null, Validators.required],
      notaryId: [null, Validators.required],
      promoterId: [null],
      recipientId: [0],
      parentPropertyId: [0],
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
    this.id = this.route.snapshot.paramMap.get('dataId');
    
    // Load notaires
    this.userService.getDatas('/v1/user/notaires')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notaireListSubject.next(data);
        },
        error: (err) => console.error('Error loading notaires:', err)
      });

    // Load property types
    this.userService.getDatas('/property-types/all')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.propertyTypeList = data.filter((item: PropertyType) => item.parent === true);
          this.getSingleBien();
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

  // ========== PROPERTY DATA LOADING ==========

  getSingleBien(): void {
    if (!this.id) return;
    
    this.spinner.show();
    
    this.userService.getDatas(`/realestate/details/${this.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.singleBien = data.realEstateProperty;
          this.populateForm();
          this.spinner.hide();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading property:', err);
          this.spinner.hide();
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger les données du bien.',
            timer: 3000,
          });
        }
      });
  }

  private populateForm(): void {
    const property = this.singleBien;
    
    // Calculate reservation fee percentage
    const calculatedFee = property.reservationFee > 100 
      ? (property.reservationFee / property.price) * 100 
      : property.reservationFee;

    // Set selected bank and agency
    if (property?.bank) {
      this.selectedBank = property.bank;
      this.searchQuery = property.bank.company.name;
    }

    if (property?.agency) {
      this.selectedAgency = property.agency;
      this.searchQuery1 = property.agency.company.name;
    }

    this.existingAddress = property.address;

    // Get notaire details
    if (property.notary?.id) {
      this.getSingleNotaire(property.notary.id);
    }

    // Patch form values
    this.realEstatePropertyForm.patchValue({
      name: property.name,
      price: this.formatNumber(property.price.toString()),
      area: property.area,
      description: property.description,
      numberOfLots: property.numberOfLots,
      feesFile: this.formatNumber(property.feesFile.toString()),
      reservationFee: calculatedFee,
      propertyTypeId: property.propertyType.id,
      notaryId: property.notary.id,
      promoterId: property.promoter?.id,
      latitude: property.latitude,
      longitude: property.longitude,
      
      // Equipment
      hasHall: property.hasHall,
      hasParking: property.hasParking,
      hasElevator: property.hasElevator,
      hasSwimmingPool: property.hasSwimmingPool,
      hasGym: property.hasGym,
      hasPlayground: property.hasPlayground,
      hasSecurityService: property.hasSecurityService,
      hasGarden: property.hasGarden,
      hasSharedTerrace: property.hasSharedTerrace,
      hasBicycleStorage: property.hasBicycleStorage,
      hasLaundryRoom: property.hasLaundryRoom,
      hasStorageRooms: property.hasStorageRooms,
      hasWasteDisposalArea: property.hasWasteDisposalArea,
    });
  }

  getSingleNotaire(id: number): void {
    this.userService.getDatas(`/v1/user/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notaireControl.setValue(data);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading notaire:', err)
      });
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

  onBankSelect(item: Bank): void {
    this.selectedBank = item;
  }

  onAgencySelect(item: Agency): void {
    this.selectedAgency = item;
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

  // ========== FORMATTING ==========

  formatNumber(value: string): string {
    if (!value) return '';
    const cleanedValue = value.replace(/\s/g, '');
    const numberValue = parseInt(cleanedValue, 10);
    return isNaN(numberValue) ? '' : numberValue.toLocaleString('fr-FR');
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatNumber(input.value);
  }

  onFeesFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatNumber(input.value);
  }

  onPercentageSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.realEstatePropertyForm.patchValue({ reservationFee: Number(select.value) });
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
        this.planPreview = reader.result as string;
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

  onDeletePlan(input: HTMLInputElement): void {
    this.plan = null;
    this.planPreview = null;
    this.realEstatePropertyForm.patchValue({ plan: null });
    input.value = '';
    this.cdr.markForCheck();
  }

  onDeleteLegalStatus(input: HTMLInputElement): void {
    this.legalStatusFile = null;
    this.realEstatePropertyForm.patchValue({ legalStatus: null });
    input.value = '';
    this.cdr.markForCheck();
  }

  // ========== FORM VALIDATION ==========

  isFieldInvalid(fieldName: string): boolean {
    const field = this.realEstatePropertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
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
    if (!this.selectedLocation && !this.singleBien?.address) {
      Swal.fire({
        icon: 'warning',
        title: 'Adresse requise',
        text: 'Veuillez sélectionner une adresse.',
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
    this.loading = true;
    this.spinner.show();
    
    const formData = this.buildFormData();
    
    this.userService.updateAnyData(formData, `/realestate/update/${this.singleBien.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.realEstatePropertyForm.value;
    const profil = this.storageService.getSubPlan();

    if (profil) {
      formData.append('profil', profil);
    }

    // Basic fields
    formData.append('name', formValue.name);
    formData.append('description', formValue.description);
    formData.append('area', formValue.area);
    formData.append('numberOfLots', formValue.numberOfLots);
    
    // Price fields (remove spaces)
    const rawPrice = formValue.price?.replace(/\s/g, '') || '';
    formData.append('price', rawPrice);
    
    const rawFees = formValue.feesFile?.replace(/\s/g, '') || '';
    formData.append('feesFile', rawFees);

    // Location
    if (this.selectedLocation) {
      formData.append('address', this.selectedLocation.name);
      formData.append('latitude', String(this.selectedLocation.latitude));
      formData.append('longitude', String(this.selectedLocation.longitude));
    } else {
      formData.append('address', this.singleBien.address);
      formData.append('latitude', this.singleBien.latitude);
      formData.append('longitude', this.singleBien.longitude);
    }

    // IDs
    formData.append('promoterId', formValue.promoterId || this.singleBien.promoter?.id || '0');
    formData.append('propertyTypeId', formValue.propertyTypeId);
    formData.append('notaryId', formValue.notaryId);
    formData.append('reservationFee', formValue.reservationFee || '0');

    // Selected entities
    formData.append('bankId', this.selectedBank?.id?.toString() || this.singleBien?.bank?.id?.toString() || '0');
    formData.append('agencyId', this.selectedAgency?.id?.toString() || this.singleBien?.agency?.id?.toString() || '0');

    // Files
    if (this.plan) {
      formData.append('plan', this.plan);
    }
    
    if (this.legalStatusFile) {
      formData.append('legalStatus', this.legalStatusFile);
    }

    // Equipment
    this.equipmentList.forEach(equipment => {
      formData.append(equipment.control, String(!!formValue[equipment.control]));
    });

    return formData;
  }

  private handleSaveSuccess(): void {
    this.loading = false;
    this.spinner.hide();
    
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Bien immobilier mis à jour avec succès.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      this.router.navigate(['/gestion-vente-vefa']);
    });
  }

  private handleSaveError(error: any): void {
    this.loading = false;
    this.spinner.hide();
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.error?.message || 'Une erreur est survenue lors de la mise à jour.',
      timer: 3000,
      showConfirmButton: true,
    });
  }

  onReset(): void {
    this.router.navigate(['/gestion-vente-vefa']);
  }

  // ========== GETTERS ==========

  get pictures(): FormArray {
    return this.realEstatePropertyForm.get('pictures') as FormArray;
  }
}