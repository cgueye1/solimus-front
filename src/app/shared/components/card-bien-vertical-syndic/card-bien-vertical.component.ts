import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Ibien } from '../../models/bien-model';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { PopupDetailBienComponent } from '../../../back-office/gestion-vefa/components/popup-detail-bien/popup-detail-bien.component';
import { ManifestantListComponent } from '../../../back-office/gestion-vefa/components/manifestant-list/manifestant-list.component';
import { environment } from '../../../../environments/environment.prod';
import { UserService } from '../../../_services/user.service';
import { ProfilEnum } from '../../../enums/ProfilEnum';

@Component({
  selector: 'app-card-bien-vertical-syndic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-bien-vertical.component.html',
  styleUrl: './card-bien-vertical.component.scss',
})
export class CardBienVerticalSyndicComponent implements OnInit {
  @Input() data!: any;
  @Input() isActions = true;
  IMG_URL: String = environment.fileUrl;
  currentuser: any;
  public ProfilEnum = ProfilEnum;

  @Output() callback = new EventEmitter<void>();

  constructor(
    config: NgbModalConfig,
    private modalService: NgbModal,
    private userService: UserService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
  }
  ngOnInit(): void {
    this.getMe();
  }
  formatSurface(value: number): string {
    return `${value.toLocaleString('fr-FR')} m²`;
  }

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }

  onCardClick() {
    this.callback.emit();
  }

  openDetailModal() {
   /*
if( !this.data.rental)
   this.modalService.open(PopupDetailBienComponent, {
      centered: true,
      size: 'fullscreen',
      scrollable: true,
      // Pass the id of the bien you want to display details for
    }).componentInstance.singleBien = this.data; 
   
   
   */
   
   
  }

  openManifesantsModal() {
    this.modalService.open(ManifestantListComponent, {
      centered: true,
      size: 'xl',
      scrollable: true,
    });
  }

  openPdf() {
    if (this.data.notary.technicalSheet) {
      const url = `${this.IMG_URL}/${this.data.notary.technicalSheet}`;
      window.open(url, '_blank');
    }
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentuser = data;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }
}
