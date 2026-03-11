import { CommonModule, Location } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UserService } from '../../_services/user.service';
import { environment } from '../../../environments/environment.prod';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-single-bien',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './single-bien.component.html',
  styleUrl: './single-bien.component.scss',
})
export class SingleBienComponent1 implements OnInit, AfterViewInit {
  @ViewChild('zoomImage', { static: false }) imageRef!: ElementRef;
  zoomLevel = 1;
  selectedImage: string = '';
  pictures: string[] = [];
  id: any;
  singleBien: any;
  IMG_URL: String = environment.fileUrl;
  currentUser: any;
  showFullText = false;

  equipements: any[] = [];
  showAllEquipements = false;

  bienList: any[] = [];
  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  searching: boolean = false;
  totalPages: number = 0;
  ///end lazy
  pageSize = 50;
  propertyTypeList: any[] = [];
  isModalOpen = false;

  constructor(
    private spinner: NgxSpinnerService,
    private location: Location,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  get displayedEquipements(): any[] {
    return this.showAllEquipements
      ? this.equipements
      : this.equipements.slice(0, 3);
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
  toggleShowAllEquipements() {
    this.showAllEquipements = !this.showAllEquipements;
  }

  ngOnInit(): void {
    this.getSingleBien();

    this.getUser();
  }

  ngAfterViewInit(): void {
    const container = document.querySelector('.image-zoom-container');

    if (container) {
      container.addEventListener('wheel', (event) => {
        const wheelEvent = event as WheelEvent;
        wheelEvent.preventDefault();
        const delta = Math.sign(wheelEvent.deltaY);
        this.zoomLevel += delta * -0.1;
        this.zoomLevel = Math.min(Math.max(this.zoomLevel, 1), 3);

        const image = container.querySelector('.zoomable-image') as HTMLElement;
        if (image) {
          image.style.transform = `scale(${this.zoomLevel})`;
        }
      });
    }
  }

  toggleText(event: Event): void {
    event.preventDefault();
    this.showFullText = !this.showFullText;
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

        this.selectedImage = this.singleBien.plan;
        this.pictures.push(this.singleBien.plan);
        this.spinner.hide();
        const b = this.singleBien;
        this.equipements = [
          b.hasHall && {
            icon: 'assets/icons/hall.svg',
            label: 'Hall d’entrée',
            desc: 'Espace d’accueil de l’immeuble',
          },
          b.hasElevator && {
            icon: 'assets/icons/escalier.svg',
            label: 'Escaliers et ascenseurs',
            desc: 'Zones d’accès aux niveaux',
          },
          {
            icon: 'assets/icons/couloirs.svg',
            label: 'Couloirs',
            desc: 'Espaces de circulation',
          },
          b.hasGarden && {
            icon: 'assets/icons/gardens.svg',
            label: 'Jardin ou cour commune',
            desc: 'Espaces extérieurs accessibles à tous',
          },
          b.hasSharedTerrace && {
            icon: 'assets/icons/terrace.svg',
            label: 'Terrasse commune',
            desc: 'Espaces extérieurs partagés',
          },
          b.hasParking && {
            icon: 'assets/icons/ph_garage-light.svg',
            label: 'Parkings communs',
            desc: 'Espaces de stationnement',
          },
          b.hasSwimmingPool && {
            icon: 'assets/icons/pool-sharp.svg',
            label: 'Piscine commune',
            desc: 'Installation aquatique partagée',
          },
          b.hasGym && {
            icon: 'assets/icons/games.svg',
            label: 'Salle de sport',
            desc: "Espace d'entraînement partagé",
          },
          b.hasPlayground && {
            icon: 'assets/icons/gym.svg',
            label: 'Aire de jeux',
            desc: 'Espace pour les enfants',
          },
          b.hasSecurityService && {
            icon: 'assets/icons/security-worker.svg',
            label: 'Sécurité (gardiennage)',
            desc: 'Surveillance et sécurité',
          },
          b.hasLaundryRoom && {
            icon: 'assets/icons/roomslaundryroom.svg',
            label: 'Buanderie commune',
            desc: 'Laverie partagée',
          },
          b.hasStorageRooms && {
            icon: 'assets/icons/vaadin_storage.svg',
            label: 'Locaux de stockage',
            desc: 'Espaces de rangement',
          },
          b.hasBicycleStorage && {
            icon: 'assets/icons/bike.svg',
            label: 'Local pour vélos',
            desc: 'Stockage sécurisé des vélos',
          },
        ].filter(Boolean); // retire les falsy (false/null)

        this.loadMorePropreties();
      },
      error: (err) => {},
    });
  }
  onViewBien(id: number) {
    this.router.navigate(['/biens', id, 'detail']);
  }
  goReturn() {
    this.location.back();
  }
  calculatePercentage(totalAmount: number, percentage: number): number {
    return (totalAmount * percentage) / 100;
  }
  onManifest() {
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
  }

  showImage(image: string): void {
    if (image !== this.selectedImage) {
      this.selectedImage = image;
    }
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  send() {
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
  }

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }
      var endpoint = `/realestate/search-lot-by-parent?page=${this.currentPage}&size=${this.pageSize}`;

      var body = {
        parentPropertyId: this.singleBien.id,
      };
      this.userService.saveAnyData(body, endpoint).subscribe({
        next: (data) => {
          this.loading = false;
          this.totalPages = data.totalPages;
          this.bienList = data.content;
          this.dataEnded = data.last;
          this.searching = false;

          this.spinner.hide();
        },
        error: (err) => {
          if (err.error) {
            try {
              this.loading = false;
              const res = JSON.parse(err.error);
              this.bienList = res.message;
              this.searching = false;
              this.spinner.hide();
            } catch {
              this.loading = false;
              this.searching = false;
              this.spinner.hide();
              //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
            }
          } else {
            this.loading = false;
            this.searching = false;
            this.spinner.hide();
            // this.offresContent= `Error with status_: ${err}`;
          }
        },
      });
    }
  }
  
  
  scrollImage() {
  // Fait défiler légèrement vers le bas
  const content = document.querySelector('.modal-content');
  if (content) {
    content.scrollBy({ top: 50, behavior: 'smooth' });
  }
}

}
