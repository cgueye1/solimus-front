import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../_services/user.service';
import { environment } from '../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-single-bien',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './single-bien.component.html',
  styleUrl: './single-bien.component.scss',
})
export class SingleBienComponent implements OnInit {
  selectedImage: string = '';
  pictures: string[] = [];
  id: any;
  singleBien: any;
  IMG_URL: String = environment.fileUrl;
  currentUser: any;
  manifestForm = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
  };
  showManifestModal = false;
  constructor(
    private spinner: NgxSpinnerService,
    private location: Location,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit(): void {
    this.getSingleBien();

    this.getUser();
  }
  getUser() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
      },
      error: (err) => {},
    });
  }
  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }

  getSingleBien() {
    this.spinner.show();
    this.id = this.route.snapshot.paramMap.get('dataId');

    const endpoint = '/realestate/details/' + this.id;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.singleBien = data.realEstateProperty;
        this.pictures = this.singleBien.pictures;

        if (this.singleBien.plan && this.singleBien.plan.trim() !== '') {
          this.selectedImage = this.singleBien.plan;
          this.pictures.push(this.singleBien.plan);
        } else if (
          this.singleBien.pictures &&
          this.singleBien.pictures.length > 0
        ) {
          this.selectedImage = this.singleBien.pictures[0];
        }

        this.spinner.hide();
      },
      error: (err) => {},
    });
  }
  goReturn() {
    this.location.back();
  }
  calculatePercentage(totalAmount: number, percentage: number): number {
    return (totalAmount * percentage) / 100;
  }
  openManifestModal() {
    this.loadManifestData();
    this.showManifestModal = true;
  }

  closeManifestModal() {
    this.showManifestModal = false;
  }

  saveManifestData() {
    localStorage.setItem(
      'manifest_user_data',
      JSON.stringify(this.manifestForm),
    );
  }
  loadManifestData() {
    const savedData = localStorage.getItem('manifest_user_data');
    if (savedData) {
      this.manifestForm = JSON.parse(savedData);
    }
  }
  submitManifest() {
    // Sauvegarde pour la prochaine fois
    this.saveManifestData();

    // Envoi vers backend
    const body = {
      propertyId: this.singleBien.id,
      prenom: this.manifestForm.prenom,
      nom: this.manifestForm.nom,
      email: this.manifestForm.email,
      telephone: this.manifestForm.telephone,
      manifest: true,
      tenant: this.singleBien.rental,
    };

    this.spinner.show();

    this.userService.saveAnyData(body, '/reservations').subscribe({
      next: () => {
        this.spinner.hide();
        this.showManifestModal = false;

        Swal.fire({
          icon: 'success',
          text: 'Votre manifestation d’intérêt a bien été envoyée',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (e) => {
        this.saveManifestData();
        this.spinner.hide();

        this.spinner.hide();

        const message =
          e?.error?.message || e?.message || 'Une erreur est survenue';

        Swal.fire({
          icon: 'error',
          text: message,
          showConfirmButton: true,
        });
      },
    });
  }

  /* onManifest() {
    if (this.currentUser) {
      this.send();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Connectez-vouxs',
        text: 'Vous devez vous connecter avant de pouvoir manifester votre intêret!',
        showCancelButton: true,
        confirmButtonText: 'Se connecter',
        cancelButtonText: 'Annuler',
        footer:
          '<p>Vous n\'avez pas de compte ? <a href="/#/auth/register" class="text-link" target="_blank">S\'inscrire</a></p>',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }*/

  showImage(image: string): void {
    if (image !== this.selectedImage) {
      this.selectedImage = image;
    }
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  /*send() {
    var endpoint = `/reservations`;

    var body = {
      propertyId: this.singleBien.id,
      userId: this.currentUser.id,
    };

    this.spinner.show();
    this.userService.saveAnyData(body, endpoint).subscribe({
      next: (data) => {
        this.spinner.hide();
        Swal.fire({
          icon: 'success',
          html: 'Votre demande est envoyé avec succès',
          showConfirmButton: false,
          timer: 1500,
        });
      },
      error: (err) => {
        if (err.error) {
          try {
            this.spinner.hide();
          } catch {
            Swal.fire({
              icon: 'warning',
              html: 'Vous avez déjà manifesté votre intêret pour ce bien',
              showConfirmButton: false,
              timer: 1500,
            });
            this.spinner.hide();
            //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          Swal.fire({
            icon: 'warning',
            html: 'Vous avez déjà manifesté votre intêret pour ce bien',
            showConfirmButton: false,
            timer: 1500,
          });
          this.spinner.hide();
          // this.offresContent= `Error with status_: ${err}`;
        }
      },
    });
  }*/
}
