import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfilEnum } from '../../../../enums/ProfilEnum';
import { Router } from '@angular/router';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-infos-pers',
  standalone: true,
  imports: [CommonModule,  ReactiveFormsModule, FormsModule],

  templateUrl: './infos-pers.component.html',
  styleUrl: './infos-pers.component.scss'
})
export class InfosPersComponent implements OnInit {
  
  userForm!: FormGroup;
  loading: boolean = false;
  profils = Object.values(ProfilEnum);
  currentUser:any
  
  indicatifs = [
    { code: '+221', country: 'Sénégal' },
    { code: '+33', country: 'France' },
 
  ];
  constructor(private router: Router,  private fb: FormBuilder,    private userService: UserService, private spinner: NgxSpinnerService,) {}
  
  
  ngOnInit(): void {
    this. getUser() ;
    
      }




  
  
  
  getUser() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
        this.currentUser=data
        const phone = data.telephone;
        let indicatif = '';
        let telephone = phone;

        this.indicatifs.forEach(item => {
          if (phone.startsWith(item.code)) {
            indicatif = item.code;
            telephone = phone.substring(item.code.length);
          }
        });
 
        this.userForm = this.fb.group({
          prenom: [data.prenom, Validators.required],
          nom: [data.nom, Validators.required],
          indicatif: [ indicatif , Validators.required], 
          telephone: [telephone, Validators.required],
          email: [data.email, [Validators.required, Validators.email]],
          profil: [data.profil, Validators.required],
          adress: [data.adress, Validators.required],
        });
      },
      error: err => {
  
  
        console.error(err);
      }
    });
  
  
  }




  onSubmit() {
    this.spinner.show();
    if (this.userForm.valid) {

    
      
      const body = {
        nom: this.userForm.get('nom')?.value,
        prenom: this.userForm.get('prenom')?.value,
        email: this.userForm.get('email')?.value,
        profil: this.userForm.get('profil')?.value,
        telephone: this.userForm.get('indicatif')?.value + this.userForm.get('telephone')?.value,
        adress: this.userForm.get('adress')?.value, // Ajouter l'adresse ici
        activated: true,
     
        
      };
     console.log(body )
      if (!this.loading) {
        this.loading = true;

        this.userService.updateAnyData(body, `/v1/user/update/${this.currentUser.id}`).subscribe({
          next: (data) => {
            if (data && data.error) {
              this.loading = false;

              Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: data.error,
              });
              this.spinner.hide();

            } else {
              this.loading = false;
              Swal.fire({
                icon: 'success',
                html: 'Votre profil est mise à jour  avec succès.',
                showConfirmButton: false,
                timer: 2000,
              }).then(() => {
                this.loading = false;
              });
              this.spinner.hide();

            }
          },
          error: (err) => {
            this.loading = false;
            let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
            this.spinner.hide();
            console.log(err)

            if (err?.error) {
              errorMessage = err.error;
            } else if (err?.status === 400) {
              errorMessage = "Les données fournies sont incorrectes ou l'utilisateur existe déjà.";
            }
            this.spinner.hide();

            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: errorMessage,
            });
          },
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Le formulaire est invalide.',
      });
    }
  }
  
  
  
  
  
}
