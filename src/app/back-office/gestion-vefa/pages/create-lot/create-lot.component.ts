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
import { Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  takeUntil,
  startWith,
  finalize, // IMPORTANT: Add this import
} from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import Swal from 'sweetalert2';

import { UserService } from '../../../../_services/user.service';
import { StorageService } from '../../../../_services/storage.service';
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
  selector: 'app-create-lot',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NgxMaskDirective,
  ],
  templateUrl: './create-lot.component.html',
  styleUrls: ['./create-lot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideNgxMask(),
  ],
})
export class CreateLotComponent implements OnInit, OnDestroy {
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
  previewUrl: string | null = null;

  // UI
  loading = false;
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1);
  
  // IDs
  id: string | null = null;

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
    this.id = this.route.snapshot.paramMap.get('dataId');
    this.initForm();
    this.loadInitialData();
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
      notaryId: [0],
      promoterId: [''],
      recipientId: [0],
      level: [0],
      discount: [0],
      parentPropertyId: [0, Validators.required],
      address: ['', Validators.required],
      latitude: ['14.750260'],
      longitude: ['-17.472360'],
      available: [true],
      number: [''],
      
      // Equipment (non utilisé pour les lots mais conservé pour compatibilité)
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
      plan: [null, Validators.required],
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
          this.realEstatePropertyForm.patchValue({ promoterId: data.id });
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading user:', err)
      });

    // Load notaries
    this.userService.getDatas('/v1/user/notaires')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notaireList = data;
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading notaires:', err)
      });

    // Load property types (lots only - parent !== true)
    this.userService.getDatas('/property-types/all')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.propertyTypeList = data.filter((item: PropertyType) => item.parent !== true);
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading property types:', err)
      });

    // Load parent property
    if (this.id) {
      this.getSingleBien();
    }
  }

  getSingleBien(): void {
    this.spinner.show();
    
    this.userService.getDatas(`/realestate/details/${this.id}`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.spinner.hide();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.singleBien = data.realEstateProperty;
          this.populateFormWithParentData();
        },
        error: (err) => {
          console.error('Error loading property:', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger les données du bien parent.',
            timer: 3000,
          });
        }
      });
  }

  private populateFormWithParentData(): void {
    this.realEstatePropertyForm.patchValue({
      address: this.singleBien.address,
      parentPropertyId: this.id,
      feesFile: this.singleBien.feesFile,
      reservationFee: this.singleBien.reservationFee,
      latitude: this.singleBien.latitude,
      longitude: this.singleBien.longitude,
      notaryId: this.singleBien.notary?.id || 0,
    });
    
    // Format fees file for display
    const feesFileControl = this.realEstatePropertyForm.get('feesFile');
    if (feesFileControl?.value) {
      feesFileControl.setValue(this.formatNumber(feesFileControl.value.toString()));
    }
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

  deleteImage(): void {
    this.plan = null;
    this.previewUrl = null;
    this.realEstatePropertyForm.patchValue({ plan: null });
    if (this.planInput) {
      this.planInput.nativeElement.value = '';
    }
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

    // Validate plan
    if (!this.plan) {
      Swal.fire({
        icon: 'warning',
        title: 'Plan requis',
        text: 'Veuillez télécharger le plan du lot.',
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
    
    // Log FormData for debugging (remove in production)
    console.log('Submitting lot form:');
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    
    this.userService.saveFormData(formData, '/realestate/save')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // This will ALWAYS execute, even on error
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

    if (profil) {
      formData.append('profil', profil);
    }

    // Basic fields
    formData.append('name', formValue.name || '');
    formData.append('description', formValue.description || '');
    formData.append('area', formValue.area?.toString() || '0');
    formData.append('address', formValue.address || '');
    formData.append('number', formValue.number || '');
    
    // Price fields (remove spaces)
    const rawPrice = formValue.price ? formValue.price.toString().replace(/\s/g, '') : '';
    formData.append('price', rawPrice);
    
    const rawFees = formValue.feesFile ? formValue.feesFile.toString().replace(/\s/g, '') : '';
    formData.append('feesFile', rawFees);

    // Location
    formData.append('latitude', formValue.latitude?.toString() || '14.750260');
    formData.append('longitude', formValue.longitude?.toString() || '-17.472360');

    // IDs
    formData.append('promoterId', formValue.promoterId?.toString() || '0');
    formData.append('propertyTypeId', formValue.propertyTypeId?.toString() || '0');
    formData.append('notaryId', formValue.notaryId?.toString() || '0');
    formData.append('parentPropertyId', formValue.parentPropertyId?.toString() || '0');
    
    // Numeric fields
    formData.append('numberOfRooms', formValue.numberOfRooms?.toString() || '0');
    formData.append('reservationFee', formValue.reservationFee?.toString() || '0');
    formData.append('discount', formValue.discount?.toString() || '0');
    formData.append('level', formValue.level?.toString() || '0');
    
    // Boolean fields
    formData.append('available', formValue.available ? 'true' : 'false');
    formData.append('mezzanine', formValue.mezzanine ? 'true' : 'false');
    
    // Equipment (false by default for lots)
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

    // Files - Add with filename
    if (this.plan) {
      formData.append('plan', this.plan, this.plan.name);
    }
    
    // Add all images with filenames
    this.images.forEach((file) => {
      formData.append('pictures', file, file.name);
    });

    return formData;
  }

  private handleSaveSuccess(response: any): void {
    console.log('Lot saved successfully:', response);
    
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Lot créé avec succès.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      if (this.singleBien?.id) {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([`/gestion-vente-vefa/${this.singleBien.id}/detail-bien`]);
        });
      } else {
        this.router.navigate(['/gestion-vente-vefa']);
      }
    });
  }

  private handleSaveError(error: any): void {
    console.error('Error saving lot:', error);
    
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
    if (this.singleBien?.id) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([`/gestion-vente-vefa/${this.singleBien.id}/detail-bien`]);
      });
    } else {
      this.router.navigate(['/gestion-vente-vefa']);
    }
  }

  // ========== GETTERS ==========

  get pictures(): FormArray {
    return this.realEstatePropertyForm.get('pictures') as FormArray;
  }
}