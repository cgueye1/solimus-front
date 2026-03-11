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
  selector: 'app-subscription-plan-type',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './subscription-plan-type.component.html',
  styleUrl: './subscription-plan-type.component.css',
})
export class SubscriptionPlanTypeComponent implements OnInit {
  @ViewChild('typeModal') typeModal!: TemplateRef<any>;

  planTypes: any[] = [];
  loading = false;
  editing = false;
  selectedType: any;

  typeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPlanTypes();
  }

  /** Ferme la modal */
  closeModal(): void {
    this.modalService.dismissAll();
    this.typeForm.reset();
  }

  /** Initialise le formulaire */
  initForm(): void {
    this.typeForm = this.fb.group({
      id: [0],
      label: ['', [Validators.required, Validators.maxLength(100)]],
      level: [0, [Validators.required, Validators.min(0)]],
    });
  }

  /** Charge la liste des types de plans */
  loadPlanTypes(): void {
    this.loading = true;
    const endpoint = '/subscription-plan-types';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.planTypes = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur chargement types de plans:', err);
        Swal.fire(
          'Erreur',
          'Impossible de charger les types de plans',
          'error',
        );
      },
    });
  }

  /** Ouvre la modal pour créer un nouveau type */
  openCreate(): void {
    this.editing = false;
    this.typeForm.reset({
      id: 0,
      label: '',
      level: 0,
    });
    this.modalService.open(this.typeModal, { centered: true, size: 'md' });
  }

  /** Ouvre la modal pour éditer un type existant */
  openEdit(type: any): void {
    this.editing = true;
    this.selectedType = type;

    this.typeForm.patchValue({
      id: type.id,
      label: type.label,
      level: type.level,
    });

    this.modalService.open(this.typeModal, { centered: true, size: 'md' });
  }

  /** Soumet le formulaire pour créer ou mettre à jour un type */
  submit(): void {
    if (this.typeForm.invalid) {
      Object.keys(this.typeForm.controls).forEach((key) => {
        const control = this.typeForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const payload = this.typeForm.value;
    this.loading = true;

    const endpoint = '/subscription-plan-types';
    const request$ = this.editing
      ? this.userService.updateAnyData(
          payload,
          `${endpoint}/${this.selectedType.id}`,
        )
      : this.userService.saveAnyData(payload, endpoint);

    request$.subscribe({
      next: () => {
        Swal.fire('Succès', 'Type de plan enregistré avec succès', 'success');
        this.modalService.dismissAll();
        this.loadPlanTypes();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur:', err);
        Swal.fire('Erreur', 'Opération échouée', 'error');
      },
    });
  }

  /** Supprime un type de plan */
  delete(type: any): void {
    Swal.fire({
      title: 'Supprimer ?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed) {
        const endpoint = `/subscription-plan-types/${type.id}`;
        this.userService.deleteData(endpoint).subscribe({
          next: () => {
            Swal.fire(
              'Supprimé !',
              'Le type de plan a été supprimé.',
              'success',
            );
            this.loadPlanTypes();
          },
          error: (err) => {
            console.error('Erreur suppression:', err);
            Swal.fire(
              'Erreur',
              'Impossible de supprimer le type de plan',
              'error',
            );
          },
        });
      }
    });
  }
}
