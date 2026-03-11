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
import { ProfilEnum, PROFIL_LABELS } from './subscription.enums';

@Component({
  selector: 'app-subscription-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './subscription-plan.component.html',
  styleUrl: './subscription-plan.component.css',
})
export class SubscriptionPlanComponent implements OnInit {
  @ViewChild('planModal') planModal!: TemplateRef<any>;
  @ViewChild('descriptionModal') descriptionModal!: TemplateRef<any>;

  selectedDescription: string = '';
  plans: any[] = [];
  planTypes: any[] = [];
  loading = false;
  editing = false;
  selectedPlan: any;

  planForm!: FormGroup;

  profils = Object.values(ProfilEnum);
  profilLabels = PROFIL_LABELS;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.getPlanTypes();
    this.initForm();
    this.loadPlans();
  }

  getPlanTypes() {
    const endpoint = '/subscription-plan-types';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.planTypes = data;
      },
      error: (err) => {
        console.error('Erreur chargement types de plans:', err);
      },
    });
  }

  /** Ferme la modal */
  closeModal(): void {
    this.modalService.dismissAll();
    this.resetForm();
  }

  /** Réinitialise le formulaire */
  resetForm(): void {
    this.planForm.reset({
      id: 0,
      subscriptionPlanTypeId: '',
      name: '',
      description: '',
      totalCost: 0,
      installmentCount: 1,
      projectLimit: 0,
      unlimitedProjects: false,
      yearlyDiscountRate: 0,
      active: true,
    });

    // Réinitialise les états des champs
    this.planForm.get('installmentCount')?.disable();
    this.planForm.get('projectLimit')?.enable();
  }

  /** Initialise le formulaire avec tous les champs */
  initForm(): void {
    this.planForm = this.fb.group({
      id: [0],
      subscriptionPlanTypeId: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      installmentCount: [{ value: 1, disabled: true }, Validators.required],
      projectLimit: [0, Validators.min(0)],
      unlimitedProjects: [false],
      yearlyDiscountRate: [0, [Validators.min(0), Validators.max(100)]],
      active: [true],
    });
  }

  /** Charge la liste des plans */
  loadPlans(): void {
    this.loading = true;
    this.userService.getDatas('/subscriptions-plans').subscribe({
      next: (data) => {
        this.plans = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Erreur', 'Impossible de charger les plans', 'error');
      },
    });
  }

  /** Ouvre la modal pour créer un nouveau plan */
  openCreate(): void {
    this.editing = false;
    this.selectedPlan = null;
    this.resetForm();

    // Réactive les champs nécessaires pour la création
    this.planForm.get('projectLimit')?.enable();
    this.planForm.get('installmentCount')?.disable(); // Reste désactivé

    this.modalService.open(this.planModal, { centered: true, size: 'lg' });
  }

  /** Ouvre la modal pour éditer un plan existant */
  openEdit(plan: any): void {
    this.editing = true;
    this.selectedPlan = plan;

    // Réinitialise le formulaire avant de patcher
    this.resetForm();

    // Extrait l'ID du type de plan depuis l'objet planType
    const planTypeId = plan.planType?.id || '';

    // Patch toutes les valeurs
    this.planForm.patchValue({
      id: plan.id, // Correction: c'est plan.id, pas planTypeId
      subscriptionPlanTypeId: planTypeId,
      name: plan.name,
      description: plan.description,
      totalCost: plan.totalCost,
      installmentCount: plan.installmentCount,
      projectLimit: plan.projectLimit || 0,
      unlimitedProjects: plan.unlimitedProjects || false,
      yearlyDiscountRate: plan.yearlyDiscountRate || 0,
      active: plan.active,
    });

    // Désactive le champ installmentCount
    this.planForm.get('installmentCount')?.disable();

    // Désactive le champ projectLimit si unlimitedProjects est true
    if (plan.unlimitedProjects) {
      this.planForm.get('projectLimit')?.disable();
    } else {
      this.planForm.get('projectLimit')?.enable();
    }

    this.modalService.open(this.planModal, { centered: true, size: 'lg' });
  }

  /** Formate le prix en CFA pendant la saisie */
  formatCFA(): void {
    const control = this.planForm.get('totalCost');
    let value = control?.value;

    if (value == null) return;

    // Supprime tout sauf les chiffres
    value = value.toString().replace(/\D/g, '');

    // Convertit en nombre pour le format
    const numericValue = parseInt(value, 10) || 0;

    // Mise à jour avec le format
    control?.setValue(numericValue, { emitEvent: false });
  }

  /** Gestion du changement pour unlimitedProjects */
  onUnlimitedProjectsChange(): void {
    const unlimited = this.planForm.get('unlimitedProjects')?.value;
    const projectLimitControl = this.planForm.get('projectLimit');

    if (unlimited) {
      projectLimitControl?.disable();
      projectLimitControl?.setValue(0);
    } else {
      projectLimitControl?.enable();
    }
  }

  /** Soumet le formulaire pour créer ou mettre à jour un plan */
  /** Soumet le formulaire pour créer ou mettre à jour un plan */
  submit(): void {
    // Marque tous les champs comme touchés pour afficher les erreurs
    Object.keys(this.planForm.controls).forEach((key) => {
      const control = this.planForm.get(key);
      if (control && !control.disabled) {
        control.markAsTouched();
      }
    });

    if (this.planForm.invalid) {
      Swal.fire({
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs obligatoires correctement.',
        icon: 'error',
      });
      return;
    }

    const formData = this.planForm.getRawValue();

    // Construction du payload de base
    let payload: any = {
      label: formData.name, // Transformation de 'name' en 'label'
      description: formData.description,
      totalCost: formData.totalCost,
      installmentCount: formData.installmentCount,
      projectLimit: formData.unlimitedProjects ? null : formData.projectLimit,
      unlimitedProjects: formData.unlimitedProjects,
      yearlyDiscountRate: formData.yearlyDiscountRate,
      active: formData.active,
    };

    // Ajout de l'ID seulement en mode édition
    if (this.editing) {
      payload.id = formData.id;
    } else {
      // Pour la création, ajouter subscriptionPlanTypeId si nécessaire
      // payload.subscriptionPlanTypeId = formData.subscriptionPlanTypeId;
    }

    this.loading = true;

    const endpoint = this.editing
      ? `/subscriptions-plans/${this.selectedPlan.id}`
      : '/subscriptions-plans';

    const request$ = this.editing
      ? this.userService.updateAnyData(payload, endpoint)
      : this.userService.saveAnyData(payload, endpoint);

    request$.subscribe({
      next: () => {
        Swal.fire('Succès', 'Plan enregistré avec succès', 'success');
        this.modalService.dismissAll();
        this.loadPlans();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur:', err);

        // Afficher plus de détails sur l'erreur 400
        if (err.status === 400) {
          Swal.fire({
            title: 'Erreur de validation',
            text: "Les données envoyées ne correspondent pas à ce qu'attend le serveur. Vérifiez les champs.",
            icon: 'error',
          });
        } else {
          Swal.fire('Erreur', 'Opération échouée', 'error');
        }
      },
    });
  }
  /* submit(): void {
    // Marque tous les champs comme touchés pour afficher les erreurs
    Object.keys(this.planForm.controls).forEach(key => {
      const control = this.planForm.get(key);
      if (control && !control.disabled) {
        control.markAsTouched();
      }
    });

    if (this.planForm.invalid) {
      // Affiche un message d'erreur plus explicite
      Swal.fire({
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs obligatoires correctement.',
        icon: 'error'
      });
      return;
    }

    const formData = this.planForm.getRawValue();
    
    const payload = {
      id: formData.id,
      subscriptionPlanTypeId: formData.subscriptionPlanTypeId,
      name: formData.name,
      description: formData.description,
      totalCost: formData.totalCost,
      installmentCount: formData.installmentCount,
      projectLimit: formData.unlimitedProjects ? null : formData.projectLimit,
      unlimitedProjects: formData.unlimitedProjects,
      yearlyDiscountRate: formData.yearlyDiscountRate,
      active: formData.active
    };
    
    this.loading = true;

    const endpoint = this.editing 
      ? `/subscriptions-plans/${this.selectedPlan.id}`
      : '/subscriptions-plans';

    const request$ = this.editing
      ? this.userService.updateAnyData(payload, endpoint)
      : this.userService.saveAnyData(payload, endpoint);

    request$.subscribe({
      next: () => {
        Swal.fire('Succès', 'Plan enregistré avec succès', 'success');
        this.modalService.dismissAll();
        this.loadPlans();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur:', err);
        Swal.fire('Erreur', 'Opération échouée', 'error');
      },
    });
  }*/

  /** Supprime un plan */
  delete(plan: any): void {
    Swal.fire({
      title: 'Supprimer ?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService
          .deleteData(`/subscriptions-plans/${plan.id}`)
          .subscribe({
            next: () => {
              Swal.fire('Supprimé !', 'Le plan a été supprimé.', 'success');
              this.loadPlans();
            },
            error: () => {
              Swal.fire('Erreur', 'Impossible de supprimer le plan', 'error');
            },
          });
      }
    });
  }

  /** Affiche le nom du profil en clair */
  displayProfil(value: string): string {
    return this.profilLabels[value] || value;
  }

  /** Affiche le label du type de plan */
  displayPlanType(plan: any): string {
    return plan.planType?.label || 'Non défini';
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

  return text
    // vrais retours à la ligne
    .replace(/\r\n|\n|\r/g, '<br>')

    // faux retours "nn" MAIS SEULEMENT quand ils séparent des phrases
    .replace(/\.nn/g, '.<br><br>')
    .replace(/nn\s*-/g, '<br>-')

    .trim();
}


}
