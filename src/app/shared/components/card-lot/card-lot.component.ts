import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ILot } from '../../models/lot-model';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';
import Swal from 'sweetalert2';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';

@Component({
  selector: 'app-card-lot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-lot.component.html',
  styleUrl: './card-lot.component.scss',
})
export class CardLotComponent  implements OnInit {
  @Input() data!: any;
  IMG_URL:String =  environment.fileUrl;
  deleted:boolean=false
  loading:boolean=false
  currentuser:any
    public ProfilEnum = ProfilEnum;
  @Output() callback = new EventEmitter<void>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService,) {}
  ngOnInit(): void {
    this.getMe()
  }

  onCardClick() {
    this.callback.emit();
  }
  delete(): void {
    this.loading=true
    this.deleted=true
    const endpoint = "/realestate/delete/"+this.data.id;
    this.userService.deleteData(endpoint).subscribe({
      next: (data) => {
        this.loading=false
        this.deleted=true
              Swal.fire({
                  icon: 'success',
                  html: 'Le lot est supprimé avec succès',
                  showConfirmButton: false,
                  timer: 2000,
                }).then(() => {
                 
           
                });
      },
      error: (error) => {
        Swal.fire({
          icon: 'warning',
          html: 'Un probleme est survenu',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
         
   
        });
        this.loading=false
        this.deleted=false
      },
    });
  }
  onDelete() {
      Swal.fire({
          title: 'Voulez vous supprimer ce lot ?',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Oui, je supprime',
          cancelButtonText: 'Annuler',
        }).then((result) => {
          if (result.isConfirmed) {
            this.delete()
            
     
          }
        });
   
  }

  onViewLot(action: string) {
    // Naviguer vers la page detail-lot avec l'action dans les queryParams
    this.router.navigate([this.data.id, 'detail-lot'], {
      relativeTo: this.activatedRoute,
      queryParams: { action }, // Passer l'action (par exemple 'DETAILS', 'RESERVER')
    });
  }

  onEditLot() {
    // Redirection vers la page de modification du lot
    this.router.navigate([this.data.id, 'edit-lot'], {
      relativeTo: this.activatedRoute,
    });
  }

  // Fonction pour obtenir le texte et la classe selon l'état du lot
  getStatusLot(status: string): { text: string; class: string } {
    switch (status) {
      case 'RESERVED' :
        return { text: 'Réservé', class: 'danger' };
      case 'SOLD':
        return { text: 'Vendu', class: 'success' };
      case 'AVAILABLE':
        return { text: 'Disponible', class: 'warning' };
        case null:
          return { text: 'Disponible', class: 'warning' };
      default:
        return { text: 'En attente', class: 'bg-secondary' };
    }
  }
  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
  
  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
  
    getMe() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
 
        this.currentuser=data
      },
      error: err => {
  
  
        console.error(err);
      }
    });
  
  
  }
  
}
