import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { UserService } from '../../_services/user.service';

@Component({
  selector: 'app-property-type',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './property-type.component.html',
  styleUrl: './property-type.component.css',
})
export class PropertyTypeComponent implements OnInit {
  @ViewChild('propertyTypeModal') propertyTypeModal!: TemplateRef<any>;

  propertyTypes: any[] = [];
  loading = false;
  editing = false;
  selectedPropertyType: any;

  propertyTypeForm!: FormGroup;

  // Filtres
  filterParent: string = 'all'; // 'all', 'parent', 'child'
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPropertyTypes();
  }

  /** Initialise le formulaire */
  initForm(): void {
    this.propertyTypeForm = this.fb.group({
      id: [0],
      typeName: ['', Validators.required],
      parent: [false, Validators.required],
    });
  }

  /** Charge la liste des types de propriétés */
  loadPropertyTypes(): void {
    this.loading = true;
    this.userService.getDatas('/property-types/all').subscribe({
      next: (data) => {
        this.propertyTypes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement types de propriétés:', err);
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les types de propriétés', 'error');
      },
    });
  }

  /** Ouvre la modal pour créer un nouveau type */
  openCreate(): void {
    this.editing = false;
    this.selectedPropertyType = null;
    this.propertyTypeForm.reset({
      id: 0,
      typeName: '',
      parent: false,
    });
    
    this.modalService.open(this.propertyTypeModal, { 
      centered: true, 
      size: 'md',
      backdrop: 'static'
    });
  }

  /** Ouvre la modal pour éditer un type existant */
  openEdit(propertyType: any): void {
    this.editing = true;
    this.selectedPropertyType = propertyType;

    this.propertyTypeForm.patchValue({
      id: propertyType.id,
      typeName: propertyType.typeName,
      parent: propertyType.parent,
    });

    this.modalService.open(this.propertyTypeModal, { 
      centered: true, 
      size: 'md',
      backdrop: 'static'
    });
  }

  /** Ferme la modal */
  closeModal(): void {
    this.modalService.dismissAll();
    this.propertyTypeForm.reset();
    this.selectedPropertyType = null;
  }

  /** Soumet le formulaire */
  submit(): void {
    if (this.propertyTypeForm.invalid) {
      Object.keys(this.propertyTypeForm.controls).forEach(key => {
        const control = this.propertyTypeForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const formData = this.propertyTypeForm.value;
    this.loading = true;

    let endpoint = '/property-types/save';
    let request$;

    if (this.editing && this.selectedPropertyType) {
      // Mode édition - PUT
      endpoint = `/property-types/${this.selectedPropertyType.id}`;
      request$ = this.userService.updateAnyData(formData, endpoint);
    } else {
      // Mode création - POST
      request$ = this.userService.saveAnyData(formData, endpoint);
    }

    request$.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: this.editing 
            ? 'Type de propriété modifié avec succès' 
            : 'Type de propriété créé avec succès',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeModal();
        this.loadPropertyTypes();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur:', err);
        
        let errorMessage = 'Opération échouée';
        if (err.status === 409) {
          errorMessage = 'Ce nom de type de propriété existe déjà';
        } else if (err.status === 400) {
          errorMessage = 'Données invalides';
        }
        
        Swal.fire('Erreur', errorMessage, 'error');
      },
    });
  }

  /** Supprime un type de propriété */
  delete(propertyType: any): void {
    // Vérifier si c'est un parent avec des enfants
    const hasChildren = this.propertyTypes.some(
      type => type.parent === false && this.isChildOf(propertyType.id, type)
    );

    let warningText = 'Cette action est irréversible.';
    if (propertyType.parent && hasChildren) {
      warningText = 'Ce type contient des sous-types. La suppression affectera également tous les sous-types associés.';
    }

    Swal.fire({
      title: 'Supprimer ?',
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService
          .deleteData(`/property-types/${propertyType.id}`)
          .subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Supprimé !',
                text: 'Le type de propriété a été supprimé.',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadPropertyTypes();
            },
            error: (err) => {
              console.error('Erreur suppression:', err);
              
              let errorMessage = 'Impossible de supprimer le type de propriété';
              if (err.status === 409) {
                errorMessage = 'Ce type est utilisé et ne peut pas être supprimé';
              }
              
              Swal.fire('Erreur', errorMessage, 'error');
            }
          });
      }
    });
  }

  /** Vérifie si un type est enfant d'un parent */
  isChildOf(parentId: number, childType: any): boolean {
    // Cette logique dépend de comment vous gérez la relation parent-enfant dans votre API
    // Pour l'instant, nous n'avons pas de champ parentId, donc nous retournons false
    // Vous pouvez adapter cette méthode selon votre structure de données
    return false;
  }

  /** Filtre les types de propriétés */
  get filteredPropertyTypes(): any[] {
    return this.propertyTypes.filter(type => {
      // Filtre par type (parent/enfant)
      if (this.filterParent === 'parent' && !type.parent) return false;
      if (this.filterParent === 'child' && type.parent) return false;
      
      // Filtre par recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return type.typeName.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }

  /** Obtient le nombre de types parents */
  get parentCount(): number {
    return this.propertyTypes.filter(t => t.parent).length;
  }

  /** Obtient le nombre de types enfants */
  get childCount(): number {
    return this.propertyTypes.filter(t => !t.parent).length;
  }

  /** Réinitialise les filtres */
  resetFilters(): void {
    this.filterParent = 'all';
    this.searchTerm = '';
  }

  /** Vérifie si un type parent peut être supprimé */
  canDeleteParent(parent: any): boolean {
    // Vérifie si le parent a des enfants
    return !this.propertyTypes.some(
      type => !type.parent && this.isChildOf(parent.id, type)
    );
  }

  /** Formate le nom du type pour l'affichage */
  formatTypeName(type: any): string {
    if (type.parent) {
      return `<strong>${type.typeName}</strong>`;
    }
    return `&nbsp;&nbsp;&nbsp;↳ ${type.typeName}`;
  }

  /** Obtient la classe CSS pour le badge */
  getTypeBadgeClass(isParent: boolean): string {
    return isParent ? 'bg-primary' : 'bg-secondary';
  }

  /** Obtient le libellé du type */
  getTypeLabel(isParent: boolean): string {
    return isParent ? 'Type parent' : 'Sous-type';
  }
}