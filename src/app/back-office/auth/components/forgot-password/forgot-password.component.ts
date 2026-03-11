import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,

  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  form: any = {
    username: null,
  };
  constructor(
    private router: Router,
    private userService: UserService,
    private spinner: NgxSpinnerService
  ) {}

  onSubmit() {
    this.spinner.show();

    const { username } = this.form;

    const body = {
      email: username,
      password: '',
      newPassword: '',
    };

    this.userService.saveAnyData(body, `/v1/auth/password/reset`).subscribe({
      next: (data) => {
                this.spinner.hide();
        Swal.fire({
          html: 'Votre demande de changement de mot de passe est bien prise en compte. Merci de réinitialiser votre mot de passe.',
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK',
        }).then(() => {
          // this.router.navigate(['auth/reset-password']);
          this.router.navigate(['auth/login']);
        });
      },
      error: (err) => {
        
        
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'+err?.status ;
        this.spinner.hide();
        
         
        console.log(err);

        if (err?.error) {
        //  errorMessage = err.message
        } else if (err?.status === 400) {
          errorMessage =
            "Les données fournies sont incorrectes ou l'utilisateur existe déjà.";
        }
       
        this.spinner.hide();
        
         if (err?.status ===200) {
                 
        Swal.fire({
          html: 'Votre demande de changement de mot de passe est bien prise en compte. Merci de réinitialiser votre mot de passe.',
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'OK',
        }).then(() => {
          // this.router.navigate(['auth/reset-password']);
          this.router.navigate(['auth/login']);
        });
        } else {
           Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        });
        }

       /* Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        });*/
      },
    });
  }

  onReset() {
    this.router.navigate(['auth/login']);
  }
}
