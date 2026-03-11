import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { UserService } from '../../../../_services/user.service';
import { CommonModule } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';

export const PROFIL_LABELS: Partial<Record<ProfilEnum, string>> = {
  [ProfilEnum.PROMOTEUR]: 'Promoteur',
  //[ProfilEnum.SYNDIC]: 'Syndic',
  //[ProfilEnum.AGENCY]: 'Agence',
 // [ProfilEnum.PROPRIETAIRE]: 'Propriétaire',

};
/*  [ProfilEnum.TENANT]: 'Locataire',*/

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  profils = [
    ProfilEnum.PROMOTEUR,
   // ProfilEnum.SYNDIC,
   // ProfilEnum.AGENCY,
   // ProfilEnum.PROPRIETAIRE,
    //ProfilEnum.TENANT,
  ];

  profilLabels = PROFIL_LABELS;

  companyLabel = '';
  displayCompanyName = false;

  userForm!: FormGroup;
  loading = false;

  indicatifs = [
    { code: '+221', country: 'SN' },
    { code: '+33', country: 'FR' },
  ];

  // Nouvelle propriété pour afficher/masquer les mots de passe
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.onProfilChanges();
  }

  /* ================= FORM ================= */

  initForm(): void {
    this.userForm = this.fb.group(
      {
        prenom: ['', Validators.required],
        nom: ['', Validators.required],
        indicatif: ['+221', Validators.required],
        telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
        email: ['', [Validators.required, Validators.email]],
        profil: ['', Validators.required],
        adress: ['', Validators.required],
        password: ['', [
          Validators.required, 
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        ]],
        confirmPassword: ['', Validators.required],
        compagnyName: [''],
      },
      {
        validators: this.passwordsMatchValidator,
      },
    );
  }

  /* 🔒 Validator : mot de passe = confirmation */
  passwordsMatchValidator(group: AbstractControl) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (!password || !confirm) {
      return null;
    }

    return password === confirm ? null : { passwordMismatch: true };
  }

  // Méthodes pour basculer la visibilité des mots de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Getter pour vérifier si les mots de passe correspondent
  get passwordMismatchError(): boolean {
    return this.userForm.errors?.['passwordMismatch'] && 
           this.userForm.get('confirmPassword')?.touched;
  }

  // Getter pour récupérer les erreurs de validation du mot de passe
  get passwordErrors(): string[] {
    const errors = [];
    const passwordControl = this.userForm.get('password');
    
    if (passwordControl?.errors?.['required'] && passwordControl.touched) {
      errors.push('Mot de passe requis');
    }
    if (passwordControl?.errors?.['minlength'] && passwordControl.touched) {
      errors.push('Minimum 6 caractères');
    }
    if (passwordControl?.errors?.['pattern'] && passwordControl.touched) {
      errors.push('Doit contenir majuscule, minuscule, chiffre et caractère spécial');
    }
    
    return errors;
  }

  onProfilChanges(): void {
    this.userForm.get('profil')?.valueChanges.subscribe((profil) => {
      if (profil === 'AGENCY') {
        this.companyLabel = 'Nom agence';
        this.displayCompanyName = true;
        this.userForm.get('compagnyName')?.setValidators([Validators.required]);
      } else if (profil === 'BANK') {
        this.companyLabel = 'Nom banque';
        this.displayCompanyName = true;
        this.userForm.get('compagnyName')?.setValidators([Validators.required]);
      } else {
        this.displayCompanyName = false;
        this.userForm.get('compagnyName')?.clearValidators();
      }
      this.userForm.get('compagnyName')?.updateValueAndValidity();
    });
  }

  /* ================= SUBMIT ================= */

  onSubmit(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.userForm.markAllAsTouched();
    
    if (this.userForm.invalid) {
      Swal.fire('Erreur', 'Veuillez corriger les champs', 'error');
      return;
    }

    this.spinner.show();
    this.loading = true;

    const body = {
      nom: this.userForm.value.nom,
      prenom: this.userForm.value.prenom,
      email: this.userForm.value.email,
      profil: this.userForm.value.profil,
      telephone: this.userForm.value.indicatif + this.userForm.value.telephone,
      adress: this.userForm.value.adress,
      activated: true,
      compagnyName: this.userForm.value.compagnyName,
      password: this.userForm.value.password,
    };

    this.userService.saveAnyData(body, '/v1/auth/signup').subscribe({
      next: () => {
        this.spinner.hide();
        this.loading = false;

        Swal.fire({
          icon: 'success',
          html: 'Votre compte est créé avec succès.',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => this.onLogin());
      },
      error: (err) => {
        this.spinner.hide();
        this.loading = false;

        Swal.fire(
          'Erreur',
          err?.error?.message || 'Une erreur est survenue',
          'error',
        );
      },
    });
  }

  onLogin(): void {
    this.router.navigate(['auth/login']);
  }
}