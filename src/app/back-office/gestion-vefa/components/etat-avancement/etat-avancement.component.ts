import { CommonModule, registerLocaleData } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  LOCALE_ID,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CanvasJS,
  CanvasJSAngularChartsModule,
} from '@canvasjs/angular-charts';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from '../../../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';
import localeFr from '@angular/common/locales/fr';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-etat-avancement',
  standalone: true,
  imports: [CanvasJSAngularChartsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './etat-avancement.component.html',
  styleUrls: ['./etat-avancement.component.scss'],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
})
export class EtatAvancementComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @Input() singleLot!: any;

  sheetForm!: FormGroup;
  progressAlbuForm!: FormGroup;
  indicateursForm!: FormGroup;
  loading: boolean = false;
  IMG_URL: string = environment.fileUrl;

  private modalRef?: NgbModalRef;
  currentuser: any;

  // Data
  progressAlbums: any[] = [];
  rapports: any[] = [];
  data: any[] = [];
  dataParent: any[] = [];
  selectedAlbum: any;
  images: File[] = [];
  file: File | null = null;

  // View management
  activeView: string = 'albums';
  hideActions: boolean = false;
  action: string | null = null;
  public ProfilEnum = ProfilEnum;

  // Variables pour le zoom
  currentImageIndex: number = 0;
  selectedImage: string = '';
  zoomLevel: number = 1;
  zoomOrigin: string = 'center center';

  // Pour les indicateurs
  percentageOptions: number[] = Array.from({ length: 100 }, (_, i) => i + 1); // 1 à 100

  // Chart options
  chartOptions: any;
  chartOptions2: any;
  colors1 = CanvasJS.addColorSet('customColor', [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
  ]);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private userService: UserService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private storageService: StorageService,
  ) {
    registerLocaleData(localeFr);
  }

  ngOnInit(): void {
    if (this.singleLot.rental) {
      this.activeView = 'albums';
    }

    this.initForms();

    this.route.queryParams.subscribe((params) => {
      this.action = params['action'] || null;
      this.hideActions = this.action === 'DETAILS';
    });

    this.getMe();
    this.loadInitialData();
  }

  initForms(): void {
    this.progressAlbuForm = this.fb.group({
      phaseName: ['', Validators.required],
      description: ['', Validators.required],
      pictures: this.fb.array([]),
      isEntrance: [true],
    });

    this.sheetForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
    });

    this.indicateursForm = this.fb.group({});
  }

  getMe(): void {
    const profil = this.storageService.getSubPlan();
    this.userService.getDatas('/v1/user/me').subscribe({
      next: (data) => {
        this.currentuser = data;
        if (profil) {
          this.currentuser.profil = profil;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil', err);
      },
    });
  }

  loadInitialData(): void {
    this.getProgressAlbums();
    this.getRapport();
    this.getIndicateurs();
    this.getIndicateursParent();
  }

  setView(view: string): void {
    this.activeView = view;
    if (view === 'graphique') {
      this.getIndicateurs();
    }
  }

  canAddContent(): boolean {
    return this.currentuser && 
           (this.currentuser.profil === ProfilEnum.PROMOTEUR ||
            this.currentuser.profil === ProfilEnum.PROPRIETAIRE ||
            this.currentuser.profil === ProfilEnum.AGENCY);
  }

  canManageContent(): boolean {
    return this.currentuser && 
           (this.currentuser.profil === ProfilEnum.PROMOTEUR ||
            this.currentuser.profil === ProfilEnum.PROPRIETAIRE);
  }

  canEditIndicators(): boolean {
    return this.currentuser && 
           (this.currentuser.profil === ProfilEnum.PROMOTEUR ||
            this.currentuser.profil === ProfilEnum.PROPRIETAIRE);
  }

  openAddModal(): void {
    if (this.activeView === 'albums') {
      this.openModal(this.ADD_FORM, 'lg');
    } else if (this.activeView === 'rapport') {
      this.openModal(this.ADD_RAPPORT, 'lg');
    }
  }

  // Album methods
  getProgressAlbums(): void {
    this.progressAlbums = [];
    this.loading = true;
    const endpoint = '/progress-album/by-property/' + this.singleLot.id;

    this.userService.getDatas(endpoint).subscribe({
      next: (data: any[]) => {
        this.progressAlbums = data.map((album) => ({
          ...album,
          lastUpdated: this.convertToDate(album.lastUpdated?.toString()),
        }));
        this.loading = false;

        if (this.progressAlbums.length > 0 && this.progressAlbums[0].pictures?.length > 0) {
          this.selectedImage = this.progressAlbums[0].pictures[0];
          this.resetZoom();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur chargement progress albums', err);
      },
    });
  }

  getRapport(): void {
    this.loading = true;
    this.rapports = [];
    const endpoint = `/rapports/${this.singleLot.id}?page=0&size=1000`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data: any) => {
        this.rapports = data.content?.map((rapport: any) => ({
          ...rapport,
          lastUpdated: new Date(rapport.lastUpdated),
        })) || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur chargement rapports', err);
      },
    });
  }

  onDeleteAlbum(id: number): void {
    Swal.fire({
      title: 'Supprimer cet album ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteData(`/progress-album/delete/${id}`).subscribe({
          next: () => {
            this.getProgressAlbums();
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: "L'album a été supprimé avec succès.",
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de la suppression.',
            });
          },
        });
      }
    });
  }

  // Rapport methods
  deleteRapport(id: number): void {
    Swal.fire({
      title: 'Supprimer ce document ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteData(`/rapports/delete/${id}`).subscribe({
          next: () => {
            this.getRapport();
            Swal.fire({
              icon: 'success',
              title: 'Supprimé !',
              text: 'Le document a été supprimé avec succès.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de la suppression.',
            });
          },
        });
      }
    });
  }

  // Modal methods
  openModal(
    template: any,
    size: string = 'lg',
    selectedAlbum: any | null = null,
  ): void {
    this.selectedAlbum = selectedAlbum;
    if (selectedAlbum && selectedAlbum.pictures?.length > 0) {
      this.currentImageIndex = 0;
      this.selectedImage = selectedAlbum.pictures[0];
      this.resetZoom();
    }
    this.modalRef = this.modalService.open(template, {
      centered: true,
      scrollable: true,
      size: size,
      windowClass: 'modal-modern',
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = undefined;
      this.resetZoom();
    }
  }

  // Form methods
  get pictures(): FormArray {
    return this.progressAlbuForm.get('pictures') as FormArray;
  }

  onMultipleFilesSelected(event: any): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let file of files) {
      if (file.type.startsWith('image/')) {
        this.images.push(file);
        const reader = new FileReader();
        reader.onload = () => {
          this.pictures.push(this.fb.control(reader.result));
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onDeleteGalleryImage(index: number): void {
    this.pictures.removeAt(index);
    this.images.splice(index, 1);
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.file = file;
    }
  }

  onSave(): void {
    if (this.progressAlbuForm.valid && this.images.length > 0 && !this.loading) {
      this.spinner.show();
      this.loading = true;

      const formData = new FormData();
      formData.append('realEstatePropertyId', this.singleLot.id);
      formData.append('phaseName', this.progressAlbuForm.get('phaseName')?.value);
      formData.append('description', this.progressAlbuForm.get('description')?.value);

      if (this.singleLot.rental) {
        const isEntrance = this.progressAlbuForm.get('isEntrance')?.value === 'true';
        formData.append('entrance', isEntrance.toString());
      }

      this.images.forEach((file) => {
        formData.append('pictures', file, file.name);
      });

      this.userService.saveFormData(formData, '/progress-album/save').subscribe({
        next: () => {
          this.spinner.hide();
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Album créé avec succès.',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeModal();
          this.resetAlbumForm();
          this.getProgressAlbums();
        },
        error: (err) => {
          this.spinner.hide();
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Une erreur est survenue lors de la création de l'album.",
          });
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Champs manquants',
        text: 'Veuillez remplir tous les champs obligatoires et ajouter au moins une image.',
      });
    }
  }

  onSaveRapport(): void {
    if (this.sheetForm.valid && this.file && !this.loading) {
      this.spinner.show();
      this.loading = true;

      const formData = new FormData();
      formData.append('propertyId', this.singleLot.id);
      formData.append('titre', this.sheetForm.get('titre')?.value);
      formData.append('description', this.sheetForm.get('description')?.value || '');
      formData.append('file', this.file, this.file.name);

      this.userService.saveFormData(formData, '/rapports/save').subscribe({
        next: () => {
          this.spinner.hide();
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Document enregistré avec succès.',
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeModal();
          this.resetRapportForm();
          this.getRapport();
        },
        error: (err) => {
          this.spinner.hide();
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Une erreur est survenue lors de l'enregistrement du document.",
          });
        },
      });
    }
  }

  resetAlbumForm(): void {
    this.progressAlbuForm.reset({
      phaseName: '',
      description: '',
      isEntrance: true,
    });
    while (this.pictures.length) {
      this.pictures.removeAt(0);
    }
    this.images = [];
  }

  resetRapportForm(): void {
    this.sheetForm.reset({
      titre: '',
      description: '',
    });
    this.file = null;
  }

  // Utility methods
  getFullImageUrl(img: string): string {
    if (!img) return 'assets/images/placeholder.jpg';
    if (img.startsWith('data:image')) return img;
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  viewRapport(pdfPath: string): void {
    if (pdfPath) {
      const url = `${this.IMG_URL}/${pdfPath}`;
      window.open(url, '_blank');
    }
  }

  // Indicateurs methods
  getIndicateurs(): void {
    const endpoint = '/indicators/property/' + this.singleLot.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.data = data.map((indicator: any) => ({
          ...indicator,
          lastUpdated: this.convertToDate(indicator.lastUpdated?.toString()),
          progressPercentage: indicator.progressPercentage || 0,
        }));
        this.initializeIndicateursForm();
        this.updateChartOptions();
      },
      error: (err) => {
        console.error('Erreur chargement indicateurs', err);
      },
    });
  }

  getIndicateursParent(): void {
    const endpoint = '/indicators/property/' + (this.singleLot.parentProperty?.id || this.singleLot.id);
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.dataParent = data.map((indicator: any) => ({
          ...indicator,
          lastUpdated: this.convertToDate(indicator.lastUpdated?.toString()),
          progressPercentage: indicator.progressPercentage || 0,
        }));
        this.updateParentChartOptions();
      },
      error: (err) => {
        console.error('Erreur chargement indicateurs parent', err);
      },
    });
  }

  initializeIndicateursForm(): void {
    // Réinitialiser le formulaire
    this.indicateursForm = this.fb.group({});
    
    // Créer les contrôles de formulaire pour chaque indicateur
    this.data.forEach(indicator => {
      this.indicateursForm.addControl(
        indicator.id.toString(), 
        this.fb.control(indicator.progressPercentage)
      );
    });
  }

  onPercentageSelect(event: Event, item: any): void {
    const target = event.target as HTMLSelectElement;
    const percentage = Number(target.value);
    
    // Mettre à jour localement
    item.progressPercentage = percentage;
    
    // Mettre à jour le formulaire
    this.indicateursForm.get(item.id.toString())?.setValue(percentage);
    
    // Mettre à jour immédiatement les graphiques pour un feedback visuel instantané
    this.updateChartOptions();
    
    // Sauvegarder
    this.saveIndicator(item.id, percentage);
  }

  saveIndicator(id: any, progressPercentage: any): void {
    const endpoint = `/indicators/update/${id}?progressPercentage=${progressPercentage}`;
    this.userService.updateAnyData({}, endpoint).subscribe({
      next: () => {
        // Recharger les données pour s'assurer que tout est synchronisé
        this.getIndicateursParent(); // Recharger les données parent pour le pie chart
           this.getIndicateurs();
        
        // Afficher un petit message de succès (optionnel)
        Swal.fire({
          icon: 'success',
          title: 'Mis à jour',
          text: 'Pourcentage mis à jour avec succès.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la mise à jour.',
        });
        
        // En cas d'erreur, recharger les données pour revenir à l'état précédent
        this.getIndicateurs();
      }
    });
  }

  updateChartOptions(): void {
    // Filtrer les données valides
    const validData = this.data.filter(item => 
      item.phaseName && 
      item.phaseName.trim() !== '' && 
      item.progressPercentage !== null && 
      item.progressPercentage !== undefined &&
      !isNaN(item.progressPercentage)
    );

    // Créer une nouvelle instance d'options pour forcer le rafraîchissement du graphique
    this.chartOptions = {
      theme: 'light2',
      exportEnabled: true,
      animationEnabled: true,
      colorSet: 'customColor',
      title: {
        text: '',
      },
      axisY: {
        title: 'Pourcentage',
        suffix: '%',
        maximum: 100,
        minimum: 0,
      },
      data: [
        {
          type: 'column',
          showInLegend: false,
          dataPoints: validData.map((item: any) => ({
            label: item.phaseName || 'Sans nom',
            y: Number(item.progressPercentage) || 0,
          })),
        },
      ],
    };
    
    // Forcer la détection de changement en créant une copie
    this.chartOptions = { ...this.chartOptions };
  }

  updateParentChartOptions(): void {
    // Filtrer les données valides pour le pie chart
    const validData = this.dataParent.filter(item => 
      item.phaseName && 
      item.phaseName.trim() !== '' && 
      item.progressPercentage !== null && 
      item.progressPercentage !== undefined &&
      !isNaN(item.progressPercentage) &&
      Number(item.progressPercentage) > 0
    );

    if (validData.length === 0) {
      this.chartOptions2 = {
        theme: 'light2',
        animationEnabled: true,
        exportEnabled: true,
        colorSet: 'customColor',
        title: {
          text: 'Aucune donnée disponible',
        },
        data: [
          {
            type: 'pie',
            showInLegend: true,
            legendText: '{label}',
            indexLabel: '{label}: {y}%',
            dataPoints: [
              { label: 'Aucune progression', y: 100 }
            ],
          },
        ],
      };
      return;
    }

    this.chartOptions2 = {
      theme: 'light2',
      animationEnabled: true,
      exportEnabled: true,
      colorSet: 'customColor',
      title: {
        text: '',
      },
      data: [
        {
          type: 'pie',
          showInLegend: true,
          legendText: '{label}',
          indexLabel: '{label}: {y}%',
          dataPoints: validData.map((item: any) => ({
            label: item.phaseName || 'Sans nom',
            y: Number(item.progressPercentage) || 0,
          })),
        },
      ],
    };
    
    // Forcer la détection de changement en créant une copie
    this.chartOptions2 = { ...this.chartOptions2 };
  }

  convertToDate(dateString: string): Date {
    if (!dateString) return new Date();

    try {
      if (dateString.includes(',')) {
        const dateParts = dateString
          .split(',')
          .map((part) => parseInt(part, 10));
        return new Date(
          Date.UTC(
            dateParts[0],
            dateParts[1] - 1,
            dateParts[2],
            dateParts[3] || 0,
            dateParts[4] || 0,
            dateParts[5] || 0,
            dateParts[6] / 1000 || 0,
          ),
        );
      } else {
        return new Date(dateString);
      }
    } catch (error) {
      console.error('Erreur de conversion de date:', error);
      return new Date();
    }
  }

  // Zoom methods
  selectImage(index: number): void {
    this.currentImageIndex = index;
    this.selectedImage = this.selectedAlbum.pictures[index];
    this.resetZoom();
  }

  nextImage(): void {
    if (this.hasNextImage()) {
      this.currentImageIndex++;
      this.selectedImage = this.selectedAlbum.pictures[this.currentImageIndex];
      this.resetZoom();
    }
  }

  previousImage(): void {
    if (this.hasPreviousImage()) {
      this.currentImageIndex--;
      this.selectedImage = this.selectedAlbum.pictures[this.currentImageIndex];
      this.resetZoom();
    }
  }

  hasNextImage(): boolean {
    return this.selectedAlbum?.pictures?.length > this.currentImageIndex + 1;
  }

  hasPreviousImage(): boolean {
    return this.currentImageIndex > 0;
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.zoomOrigin = 'center center';
  }

  onImageMouseMove(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      this.zoomOrigin = `${x}% ${y}%`;
    }
  }

  onImageWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  // Template references
  @ViewChild('ADD_FORM') ADD_FORM: any;
  @ViewChild('ADD_RAPPORT') ADD_RAPPORT: any;
  @ViewChild('VIEW_IMAGE') VIEW_IMAGE: any;
}