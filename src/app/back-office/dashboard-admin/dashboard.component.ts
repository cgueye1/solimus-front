import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  OnInit,
} from '@angular/core';
import { UserService } from '../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardBienVerticalComponent } from '../../shared/components/card-bien-vertical/card-bien-vertical.component';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment.prod';
import { ProfilEnum } from '../../enums/ProfilEnum';
import { LucideAngularModule } from 'lucide-angular';
import { CountUpModule } from 'ngx-countup';
import { CountUp } from 'countup.js';

const monthMapping: { [key: string]: string } = {
  Janvier: 'Jan',
  Février: 'Fév',
  Mars: 'Mar',
  Avril: 'Avr',
  Mai: 'Mai',
  Juin: 'Juin',
  Juillet: 'Juil',
  Août: 'Août',
  Septembre: 'Sept',
  Octobre: 'Oct',
  Novembre: 'Nov',
  Décembre: 'Déc',
};
@Component({
  selector: 'app-dashboard-admin',
  standalone: true,

  imports: [
    CommonModule,
    LucideAngularModule,
    CountUpModule,
    NgxChartsModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    CardBienVerticalComponent,
    NgbTypeaheadModule,
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css',
})
export class DashboardAdminComponent implements OnInit {
  IMG_URL: String = environment.fileUrl;
  currentYear: number = new Date().getFullYear();
  selectedYear: number = this.currentYear;
  years: number[] = [];

  chartVisible: boolean = true;

  bienList: any[] = [];
  searchPerformed = false;
  searchQuery: string = '';
  singleBien: any;
  currentUser: any;
  totalRevenue: any = 0;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  pageSize = 12;

  ///end lazy

  ProfilEnum = ProfilEnum;
  animatedValue: { [key: number]: number } = {};
  responseError: any = null;

  colorSchemeCharges1 = {
    domain: ['#ff8c00', '#d62728', '#2ca02c'],
  };

  callForChargeData = [
    { name: 'Total', value: 0 },
    { name: 'Payées', value: 0 },
    { name: 'En retard', value: 0 },
  ];

  colorScheme1: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#4A90E2', '#28A745', '#E74C3C'],
  };

  constructor(
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
  ) {}
  indicateurs = [
    {
      id: 1,
      label: 'Total des utilisateurs',
      value: 0,
      icon: 'people',
      color: '#4A90E2',
      evolution: 5,
      suffix: 'Tous les utilisateurs',
    },
    {
      id: 2,
      label: 'Nombre de promoteurs',
      value: 0,
      icon: 'apartment',
      color: '#2C3E50',
      evolution: 12,
      suffix: 'Promoteurs actifs',
    },
    {
      id: 3,
      label: 'Nombre de syndics',
      value: 0,
      icon: 'groups',
      color: '#27AE60',
      evolution: 8,
      suffix: 'Syndics enregistrés',
    },
    {
      id: 4,
      label: 'Nombre de réservataires',
      value: 0,
      icon: 'bookmark',
      color: '#E67E22',
      evolution: 3,
      suffix: 'Réservataires actifs',
    },
    {
      id: 5,
      label: 'Nombre de propriétaires',
      value: 0,
      icon: 'home',
      color: '#9B59B6',
      evolution: 7,
      suffix: 'Propriétaires inscrits',
    },
    {
      id: 6,
      label: "Nombre d'agences",
      value: 0,
      icon: 'business',
      color: '#E74C3C',
      evolution: 4,
      suffix: 'Agences immobilières',
    },
    {
      id: 7,
      label: 'Nombre de locataires',
      value: 0,
      icon: 'person',
      color: '#1ABC9C',
      evolution: 6,
      suffix: 'Locataires inscrits',
    },
    {
      id: 8,
      label: 'Nombre de notaires',
      value: 0,
      icon: 'gavel',
      color: '#34495E',
      evolution: 2,
      suffix: 'Notaires enregistrés',
    },
  ];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
     domain: [
    '#2C3E50', // Promoteur
    '#27AE60', // Syndic
    '#E67E22', // Réservataire
    '#9B59B6', // Propriétaire
    '#E74C3C', // Agence
    '#1ABC9C', // Locataire
    '#34495E', // Notaire
  ],
  };
  colorSchemeReservations: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#E67E22'],
  };
  colorSchemeVentes: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#1E90FF', // Janvier - Bleu froid (hiver)
      '#FF69B4', // Février - Rose (Saint-Valentin)
      '#FFD700', // Mars - Jaune doré (début du printemps)
      '#32CD32', // Avril - Vert (printemps)
      '#FF4500', // Mai - Orange (chaleur qui arrive)
      '#00CED1', // Juin - Turquoise (début de l’été)
      '#FF6347', // Juillet - Rouge (été chaud)
      '#FFA500', // Août - Orange (fin de l’été)
      '#8B4513', // Septembre - Brun (début de l’automne)
      '#DC143C', // Octobre - Rouge foncé (feuilles d’automne)
      '#800080', // Novembre - Violet (transition vers l’hiver)
      '#FFFFFF', // Décembre - Blanc (neige et fêtes)
    ],
  };

  barChartData = [];

  defaultPieChartData = [
    { name: 'Vendus', value: 0 },
    { name: 'Disponibles', value: 0 },
    { name: 'Réservés', value: 0 },
  ];

  defaultLineChartData = [
    {
      name: 'Ventes',
      series: [],
    },
  ];

  defaultBarChartData = [];

  pieChartData = [
    { name: 'Vendus', value: 0 },
    { name: 'Disponibles', value: 0 },
    { name: 'Réservés', value: 0 },
  ];

  lineChartData = [
    {
      name: 'Ventes',
      series: [],
    },
  ];

  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
  renewSubscription() {
    this.router.navigate(['/settings/accounts']);
  }
  onIndicatorClick(indicator: any) {
    if (indicator.id == 1) {
      if (this.singleBien) {
        this.router.navigate(['/gestion-vente-vefa']);
      } else {
      }
    }
  }

  // Typeahead search function
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2
          ? []
          : this.bienList
              .filter((v) => v.name.toLowerCase().includes(term.toLowerCase()))
              .slice(0, 10),
      ),
    );

  // Formatter for the selected item
  formatter = (x: { name: string }) => x.name;

  // Method to handle the selected item from the Typeahead
  onSelect(selectedBien: any): void {
    this.chartVisible = false;
    this.singleBien = selectedBien;
    this.indicateurs[0].value = 0;
    this.indicateurs[1].value = 0;
    this.indicateurs[2].value = 0;
    this.indicateurs[3].value = 0;
    this.indicateurs[4].value = 0;
    this.indicateurs[5].value = 0;
    this.indicateurs[0].label = 'Total des lots';
    this.getMe();
  }

  onYearChange() {
    //this.chartVisible = false;
    this.currentYear = this.selectedYear;
  }

  animateCounter(id: number, endValue: number): void {
    let startValue = 0;
    this.animatedValue[id] = startValue;

    const duration = 2000; // Durée de l'animation en ms
    const stepTime = 50; // Temps entre chaque mise à jour
    const steps = duration / stepTime;
    const increment = (endValue - startValue) / steps;

    const interval = setInterval(() => {
      startValue += increment;
      this.animatedValue[id] = Math.round(startValue); // Met à jour l'animation

      if (startValue >= endValue) {
        clearInterval(interval);
        this.animatedValue[id] = endValue; // Pour s'assurer que la valeur finale est atteinte
      }
    }, stepTime);
  }

  onClick(indicateur: any): void {
    if (indicateur.id == 1) {
      if (this.singleBien == null) {
        this.router.navigate(['/gestion-vente-vefa']);
      } else {
        this.router.navigate([
          `/gestion-vente-vefa/${this.singleBien.id}/detail-bien`,
        ]);
      }
    } else {
      if (this.singleBien != null) {
        this.router.navigate([
          `/gestion-vente-vefa/${this.singleBien.id}/detail-bien`,
        ]);
      }
    }
  }

  ngOnInit(): void {
    this.getMe();
    this.initializeYears();
  }
  initializeYears() {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    this.years = Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i,
    ).reverse();

    this.getDash();
    this.getUsersEvolutionDash();
    this.getSoldDash();
  }
  getMe() {
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;

        this.getCallForChargeDash(data.id);
        this.chartVisible = true;
        this.loadMorePropreties();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return parseFloat(percentage.toFixed(1));
  }
  getDash() {
    this.spinner.show();
    const endpoint = `/v1/user/users/statistics`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.indicateurs[0].value = data.totalUsers;
        this.indicateurs[1].value = data.totalPromoteurs;
        this.indicateurs[2].value = data.totalSyndics;
        this.indicateurs[3].value = data.totalReservataires;
        this.indicateurs[4].value = data.totalProprietaires;
        this.indicateurs[5].value = data.totalAgencies;
        this.indicateurs[6].value = data.totalTenants;
        this.indicateurs[7].value = data.totalNotaires;

        const total =
          data.totalPromoteurs +
          data.totalSyndics +
          data.totalReservataires +
          data.totalProprietaires +
          data.totalAgencies +
          data.totalTenants +
          data.totalNotaires;

        this.pieChartData = [
          {
            name: 'Promoteur',
            value: this.calculatePercentage(data.totalPromoteurs, total),
          },
          {
            name: 'Syndic',
            value: this.calculatePercentage(data.totalSyndics, total),
          },
          {
            name: 'Réservataire',
            value: this.calculatePercentage(data.totalReservataires, total),
          },
          {
            name: 'Propriétaire',
            value: this.calculatePercentage(data.totalProprietaires, total),
          },
          {
            name: 'Agence',
            value: this.calculatePercentage(data.totalAgencies, total),
          },
          {
            name: 'Locataire',
            value: this.calculatePercentage(data.totalTenants, total),
          },
          {
            name: 'Notaire',
            value: this.calculatePercentage(data.totalNotaires, total),
          },
        ];

        this.indicateurs.forEach((indicateur) => {
          this.animateCounter(indicateur.id, indicateur.value);
        });

        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        this.responseError = err.error;
      },
    });
  }

  getUsersEvolutionDash() {
    this.spinner.show();

    var endpoint = `/v1/user/users/evolution`;
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.lineChartData = [
          {
            name: 'Utilisateurs ',
            series: data.map((item: { name: string | number; value: any }) => ({
              name: item.name,
              value: item.value,
            })),
          },
        ];

        //monthMapping[item.month] || item.month

        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
      },
    });
  }

  getSoldDash() {
    const endpoint = `/user-subscriptions/revenues/evolution`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        // Total revenu
        this.totalRevenue = data.totalRevenue;

        // Données du chart (ngx-charts attend [{name, value}])
        this.barChartData = data.monthlyRevenue.map(
          (item: { name: string; value: number }) => ({
            name: item.name,
            value: item.value,
          }),
        );
      },
      error: (err) => {
        console.error('Erreur chargement dashboard revenue', err);
      },
    });
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList)
        if (this.bienList.length === 0) {
        } else {
          this.currentPage = this.currentPage + 1;
        }

      var endpoint =
        this.currentUser.profil === ProfilEnum.PROMOTEUR
          ? `/realestate/search-by-promoter?page=${this.currentPage}&size=${this.pageSize}`
          : this.currentUser.profil === ProfilEnum.NOTAIRE
            ? `/realestate/notary/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`
            : `/reservations/user/${this.currentUser.id}?page=${this.currentPage}&size=${this.pageSize}`;

      var body = {
        promoterId: this.currentUser.id,
      };

      if (
        this.currentUser.profil === ProfilEnum.PROMOTEUR ||
        this.currentUser.profil === ProfilEnum.BANK ||
        this.currentUser.profil === ProfilEnum.AGENCY
      ) {
        if (
          this.currentUser.profil === ProfilEnum.BANK ||
          this.currentUser.profil === ProfilEnum.AGENCY
        ) {
          endpoint =
            this.currentUser.profil === ProfilEnum.BANK
              ? `/realestate/search-by-bank?page=${this.currentPage}&size=${this.pageSize}`
              : `/realestate/search-by-agency?page=${this.currentPage}&size=${this.pageSize}`;
        }

        this.userService.saveAnyData(body, endpoint).subscribe({
          next: (data) => {
            this.loading = false;
            this.totalPages = data.totalPages;
            this.bienList =
              this.searchQuery == ''
                ? this.bienList.concat(data.content)
                : (this.bienList = data.content);
            this.dataEnded = data.last;
          },
          error: (err) => {
            if (err.error) {
              try {
                this.loading = false;
                const res = JSON.parse(err.error);
                this.bienList = res.message;
              } catch {
                this.loading = false;
                //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
              }
            } else {
              this.loading = false;
              // this.offresContent= `Error with status_: ${err}`;
            }
          },
        });
      } else {
        this.userService.getDatas(endpoint).subscribe({
          next: (data) => {
            this.loading = false;
            this.totalPages = data.totalPages;
            this.bienList =
              this.searchQuery == ''
                ? this.bienList.concat(data.content)
                : (this.bienList = data.content);
            this.dataEnded = data.last;
          },
          error: (err) => {
            if (err.error) {
              try {
                this.loading = false;
                const res = JSON.parse(err.error);
                this.bienList = res.message;
              } catch {
                this.loading = false;
                //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
              }
            } else {
              this.loading = false;
              // this.offresContent= `Error with status_: ${err}`;
            }
          },
        });
      }
    }
  }

  getCallForChargeDash(id: any) {
    this.spinner.show();

    const endpoint =
      this.singleBien == null
        ? `/payment-calls/kpi?promoterId=${id}`
        : `/payment-calls/kpi?propertyId=${this.singleBien.id}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.callForChargeData = [
          { name: 'Total', value: data.totalAmount },
          { name: 'Payées', value: data.paidAmount },
          { name: 'En attente', value: data.unpaidAmount },
        ];
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }
}
