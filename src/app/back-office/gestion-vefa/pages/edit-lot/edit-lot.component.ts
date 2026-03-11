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
import { environment } from '../../../../../environments/environment.prod';

interface PropertyType {
  id: number;
  typeName: string;
  parent: boolean;
}

interface Notaire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
}

@Component({
  selector: 'app-edit-lot',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    NgbTypeaheadModule,
    NgxMaskDirective,
  ],
  templateUrl: './edit-lot.component.html',
  styleUrls: ['./edit-lot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgxMask(),
  ],
})
export class EditLotComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('planInput') planInput!: ElementRef<HTMLInputElement>;

  // Form
  realEstatePropertyForm!: FormGroup;
  formSubmitted = false;

  // Data
  singleBien: any;
  propertyTypeList: PropertyType[] = [];
  notaireList: Notaire[] = [];
  
  // Files
  images: File[] = [];
  plan: File | null = null;
  planPreview: string | null = null;
  legalStatusFile: File | null = null;

  // UI
  loading = false;
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1);
  
  // IDs
  id: string | null = null;

  // URLs
  IMG_URL: string = environment.fileUrl;

  // Notaire autocomplete
  notaireControl = new FormControl<string | Notaire>('');
  filteredNotaires$!: Observable<Notaire[]>;
  private notaireListSubject = new BehaviorSubject<Notaire[]>([]);

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('dataId');
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
      numberOfRooms: [0],
      feesFile: ['', Validators.required],
      reservationFee: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      propertyTypeId: [null, Validators.required],
      notaryId: [null, Validators.required],
      promoterId: [''],
      recipientId: [0],
      level: [null],
      discount: [0],
      parentPropertyId: [0],
      address: ['', Validators.required],
      latitude: ['14.750260'],
      longitude: ['-17.472360'],
      available: [true],
      number: [''],
      
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
      
      // Lot specific
      mezzanine: [false],
      
      // Files
      plan: [null],
      legalStatus: [null],
      pictures: this.fb.array([]),
    });
  }

  private loadInitialData(): void {
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

    // Load property types (lots only)
    this.userService.getDatas('/property-types/all')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.propertyTypeList = data.filter((item: PropertyType) => item.parent !== true);
          this.getSingleBien();
        },
        error: (err) => console.error('Error loading property types:', err)
      });

    // Load current user
    this.userService.getDatas('/v1/user/me')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.realEstatePropertyForm.patchValue({ promoterId: data.id });
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading user:', err)
      });
  }

  private setupAutocomplete(): void {
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

  // ========== DATA LOADING ==========

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
            text: 'Impossible de charger les données du lot.',
            timer: 3000,
          });
        }
      });
  }

  private populateForm(): void {
    const property = this.singleBien;
    
    // Calculate percentages
    const calculatedFee = property.reservationFee > 100 
      ? (property.reservationFee / property.price) * 100 
      : property.reservationFee;

    const calculatedDiscount = property.discount > 100 
      ? (property.discount / property.price) * 100 
      : property.discount;

    // Load notaire
    if (property.notary?.id) {
      this.getSingleNotaire(property.notary.id);
    }

    // Patch form values
    this.realEstatePropertyForm.patchValue({
      name: property.name,
      price: this.formatNumber(property.price.toString()),
      area: property.area,
      description: property.description,
      numberOfRooms: property.numberOfRooms,
      feesFile: this.formatNumber(property.feesFile.toString()),
      reservationFee: calculatedFee,
      discount: calculatedDiscount,
      propertyTypeId: property.propertyType.id,
      notaryId: property.notary.id,
      promoterId: property.promoter?.id,
      level: property.level,
      address: property.address,
      parentPropertyId: property.parentProperty?.id,
      mezzanine: property.mezzanine,
      
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

    // Update level validator based on mezzanine
    this.updateLevelValidator();
    
    // Subscribe to mezzanine changes
    this.realEstatePropertyForm.get('mezzanine')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateLevelValidator();
        this.cdr.markForCheck();
      });
  }

  private updateLevelValidator(): void {
    const mezzanine = this.realEstatePropertyForm.get('mezzanine')?.value;
    const levelControl = this.realEstatePropertyForm.get('level');
    
    if (!mezzanine) {
      levelControl?.setValidators([Validators.required, Validators.min(0)]);
    } else {
      levelControl?.clearValidators();
      levelControl?.setValue(null);
    }
    levelControl?.updateValueAndValidity();
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

  onPercentageDiscountSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.realEstatePropertyForm.patchValue({ discount: Number(select.value) });
  }

  // ========== NOTAIRE AUTOCOMPLETE ==========

  displayNotaireFn(notaire: Notaire | null): string {
    return notaire ? `${notaire.nom} ${notaire.prenom}` : '';
  }

  selectNotaire(event: MatAutocompleteSelectedEvent): void {
    const notaire = event.option.value as Notaire;
    this.notaireControl.setValue(notaire);
    this.realEstatePropertyForm.patchValue({ notaryId: notaire.id });
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
      Swal.fire({
        icon: 'warning',
        title: 'Format non supporté',
        text: 'Seuls les fichiers PNG, JPG ou JPEG sont autorisés.',
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }
    
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Fichier trop volumineux',
        text: 'Le fichier ne doit pas dépasser 5 Mo.',
        timer: 2000,
        showConfirmButton: false,
      });
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
    
    this.userService.updateFormData(formData, `/realestate/update/${this.singleBien.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSaveSuccess(),
        error: (err) => this.handleSaveError(err)
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.realEstatePropertyForm.value;

    // Basic fields
    formData.append('name', formValue.name);
    formData.append('description', formValue.description);
    formData.append('area', formValue.area);
    formData.append('address', formValue.address);
    formData.append('number', formValue.number || '');
    
    // Price fields (remove spaces)
    const rawPrice = formValue.price?.replace(/\s/g, '') || '';
    formData.append('price', rawPrice);
    
    const rawFees = formValue.feesFile?.replace(/\s/g, '') || '';
    formData.append('feesFile', rawFees);

    // Location
    formData.append('latitude', formValue.latitude);
    formData.append('longitude', formValue.longitude);

    // IDs
    formData.append('promoterId', formValue.promoterId || '0');
    formData.append('propertyTypeId', formValue.propertyTypeId);
    formData.append('notaryId', formValue.notaryId || '0');
    formData.append('parentPropertyId', this.singleBien.parentProperty?.id || '0');
    
    // Numeric fields
    formData.append('numberOfRooms', formValue.numberOfRooms || '0');
    formData.append('reservationFee', formValue.reservationFee || '0');
    formData.append('discount', formValue.discount || '0');
    formData.append('level', formValue.level || '0');
    
    // Boolean fields
    formData.append('available', formValue.available);
    formData.append('mezzanine', String(formValue.mezzanine));
    
    // Equipment (from parent)
    formData.append('hasHall', 'false');
    formData.append('hasParking', 'false');
    formData.append('hasElevator', 'false');
    formData.append('hasSwimmingPool', 'false');
    formData.append('hasGym', 'false');
    formData.append('hasPlayground', 'false');
    formData.append('hasSecurityService', 'false');
    formData.append('hasGarden', 'false');
    formData.append('hasSharedTerrace', 'false');
    formData.append('hasBicycleStorage', 'false');
    formData.append('hasLaundryRoom', 'false');
    formData.append('hasStorageRooms', 'false');
    formData.append('hasWasteDisposalArea', 'false');

    // Files
    if (this.plan) {
      formData.append('plan', this.plan);
    }
    
    this.images.forEach(file => {
      formData.append('pictures', file);
    });

    return formData;
  }

  private handleSaveSuccess(): void {
    this.loading = false;
    this.spinner.hide();
    
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Lot modifié avec succès.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      this.router.navigate([`/gestion-vente-vefa/${this.singleBien.parentProperty.id}/detail-bien`]);
    });
  }

  private handleSaveError(error: any): void {
    this.loading = false;
    this.spinner.hide();
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.error?.message || 'Une erreur est survenue lors de la modification.',
      timer: 3000,
      showConfirmButton: true,
    });
  }

  onReset(): void {
    this.router.navigate([`/gestion-vente-vefa/${this.singleBien?.parentProperty?.id}/detail-bien`]);
  }

  // ========== GETTERS ==========

  get pictures(): FormArray {
    return this.realEstatePropertyForm.get('pictures') as FormArray;
  }

  get notaireList$(): Observable<Notaire[]> {
    return this.notaireListSubject.asObservable();
  }
}