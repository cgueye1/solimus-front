import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class DemandeService {
  constructor() {}

  validateForm(form: FormGroup): boolean {
    const formValues = form.value;
    return Object.values(formValues).every(
      (val) => val !== 'Non' && val !== ''
    );
  }

  saveDemande(callback: () => void): void {
    Swal.fire({
      html: 'Votre demande a été enregistrée avec succès.',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
    }).then(callback);;
  }

  submitDemande(callback: () => void): void {
    Swal.fire({
      html: 'Votre demande a été soumise avec succès.',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500,
    }).then(callback);;
  }

  confirmAnnulation(callback: () => void): void {
    Swal.fire({
      html: "Souhaitez-vous annuler l'enregistrement ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgba(249, 194, 10, 1)',
      confirmButtonText: 'Oui, Annuler !',
      cancelButtonText: 'Non',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          text: 'Enregistrement annulé.',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
        }).then(callback);
      }
    });
  }
}
