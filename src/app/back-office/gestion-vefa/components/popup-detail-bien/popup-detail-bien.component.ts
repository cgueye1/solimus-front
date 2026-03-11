import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ManifestantListComponent } from '../manifestant-list/manifestant-list.component';
import { UserService } from '../../../../_services/user.service';
import { environment } from '../../../../../environments/environment.prod';
import { ProfilEnum } from '../../../../enums/ProfilEnum';

import { EtatAvancementComponent } from '../etat-avancement/etat-avancement.component';
import { StorageService } from '../../../../_services/storage.service';

@Component({
  selector: 'app-popup-detail-bien',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    ManifestantListComponent,
 
    EtatAvancementComponent,
  ],
  templateUrl: './popup-detail-bien.component.html',
  styleUrl: './popup-detail-bien.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Suppresses unknown property errors
})
export class PopupDetailBienComponent implements OnInit {
  @Input() singleBien: any;
  IMG_URL: String = environment.fileUrl;
  currentUser: any;
  ProfilEnum = ProfilEnum;
  constructor(
    public modal: NgbModal,
    private userService: UserService,
    private storageService: StorageService,
  ) {}
  ngOnInit(): void {
    this.getUser();
  }

  getUser() {
    const profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        if (profil) {
          this.currentUser.profil = profil;
        }
      },
      error: (err) => {},
    });
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
  calculatePercentage(totalAmount: number, percentage: number): number {
    return (totalAmount * percentage) / 100;
  }

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
}
