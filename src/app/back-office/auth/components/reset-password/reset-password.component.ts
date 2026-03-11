import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  hide = true;
  hideConfirmPassword = true;

  constructor(private router: Router) {}

  onSubmit() {
    Swal.fire({
      html: 'Votre mot de passe a été changé avec succès.',
      icon: 'success',
      showConfirmButton: false,
      timer: 2000,
    }).then(() => {
      this.router.navigate(['/dashboard']);
    });
  }
}
