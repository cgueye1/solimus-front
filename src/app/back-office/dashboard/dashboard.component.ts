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
import { StorageService } from '../../_services/storage.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  selector: 'app-dashboard',
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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  IMG_URL: String = environment.fileUrl;
  currentYear: number = new Date().getFullYear();
  selectedYear: number = this.currentYear;
  years: number[] = [];
  isSubActive: any = null;
  chartVisible: boolean = true;

  bienList: any[] = [];
  searchPerformed = false;
  searchQuery: string = '';
  singleBien: any;
  currentUser: any;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  //lazy loading
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  pageSize = 12;

  ProfilEnum = ProfilEnum;
  animatedValue: { [key: number]: number } = {};
  responseError: any = null;

  // Données pour l'export
  exportData: any = null;

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

  indicateurs = [
    {
      id: 1,
      label: 'Total des projets',
      value: 0,
      icon: 'home',
      color: '#4A90E2',
      evolution: 0,
      suffix: 'Ensemble des biens',
    },
    {
      id: 2,
      label: 'Lots vendus',
      value: 0,
      icon: 'check_circle',
      color: '#2C3E50',
      evolution: 0,
      suffix: 'Déjà vendus',
    },
    {
      id: 3,
      label: 'Lots disponibles',
      value: 0,
      icon: 'layers',
      color: '#27AE60',
      evolution: 0,
      suffix: 'Encore disponibles',
    },
    {
      id: 4,
      label: 'Lots réservés',
      value: 0,
      icon: 'bookmark',
      color: '#E67E22',
      evolution: 0,
      suffix: 'Réservés mais non vendus',
    },
  ];

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#2C3E50', '#27AE60', '#E67E22'],
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
      '#1E90FF', '#FF69B4', '#FFD700', '#32CD32', '#FF4500', '#00CED1',
      '#FF6347', '#FFA500', '#8B4513', '#DC143C', '#800080', '#FFFFFF'
    ],
  };

  barChartData = [];
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

  constructor(
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.getMe();
    this.initializeYears();
  }

  // Getter pour le total des lots
  get totalLots(): number {
    return (this.indicateurs[1]?.value || 0) + 
           (this.indicateurs[2]?.value || 0) + 
           (this.indicateurs[3]?.value || 0);
  }

  initializeYears() {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    this.years = Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i
    ).reverse();
  }

  renewSubscription() {
    this.router.navigate(['/settings/accounts']);
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

  onYearChange() {
    this.chartVisible = false;
    this.currentYear = this.selectedYear;
    this.getMe();
  }

  animateCounter(id: number, endValue: number): void {
    let startValue = 0;
    this.animatedValue[id] = startValue;

    const duration = 2000;
    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = (endValue - startValue) / steps;

    const interval = setInterval(() => {
      startValue += increment;
      this.animatedValue[id] = Math.round(startValue);

      if (startValue >= endValue) {
        clearInterval(interval);
        this.animatedValue[id] = endValue;
      }
    }, stepTime);
  }

  getMe() {
    const profil = this.storageService.getSubPlan();
    const endpoint = '/v1/user/me';
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.currentUser = data;
        this.currentUser.profil = profil;
        this.getCurrentSub();
        this.getDash(data.id);
        this.getReservedDash(data.id);
        this.getSoldDash(data.id);
        this.getCallForChargeDash(data.id);
        this.chartVisible = true;
        this.loadMorePropreties();
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getCurrentSub() {
    const profil = this.storageService.getSubPlan();
    const endpoint = `/user-subscriptions/is-active/${this.currentUser.id}/${profil}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data: boolean) => {
        this.isSubActive = data;
      },
      error: (err) => {
        this.isSubActive = false;
      },
    });
  }

  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return parseFloat(percentage.toFixed(1));
  }

  getDash(id: any) {
    const profil = this.storageService.getSubPlan();
    this.spinner.show();
    const endpoint =
      this.singleBien == null
        ? `/realestate/dash/promoter/${id}/${profil}`
        : `/realestate/lots/dashboard?parentPropertyId=${this.singleBien.id}&planName=${profil}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.indicateurs[0].value = data.nombreDeBien;
        this.indicateurs[1].value = data.nombreDeLotsVendus;
        this.indicateurs[2].value = data.nombreDeLotsDisponible;
        this.indicateurs[3].value = data.nombreDeLotsReserve;

        // Sauvegarde pour l'export
        this.exportData = {
          stats: this.indicateurs.map(i => ({ ...i })),
          pieChart: this.pieChartData,
          lineChart: this.lineChartData,
          barChart: this.barChartData,
          callForCharge: this.callForChargeData
        };

        const total = data.nombreDeLotsVendus + data.nombreDeLotsDisponible + data.nombreDeLotsReserve;
        this.pieChartData = [
          {
            name: 'Vendus',
            value: this.calculatePercentage(data.nombreDeLotsVendus, total),
          },
          {
            name: 'Disponibles',
            value: this.calculatePercentage(data.nombreDeLotsDisponible, total),
          },
          {
            name: 'Réservés',
            value: this.calculatePercentage(data.nombreDeLotsReserve, total),
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

  getReservedDash(id: any) {
    this.spinner.show();
    const profil = this.storageService.getSubPlan();
    var endpoint =
      this.singleBien == null
        ? `/reservations/dashboard?year=${this.currentYear}&promoterId=${id}&planName=${profil}`
        : `/reservations/dashboard?year=${this.currentYear}&promoterId=${id}&parentPropertyId=${this.singleBien.id}&planName=${profil}`;

    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        this.lineChartData = [
          {
            name: 'Réservations',
            series: data.map((item: { month: string | number; value: any }) => ({
              name: monthMapping[item.month] || item.month,
              value: item.value,
            })),
          },
        ];
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
      },
    });
  }

  getSoldDash(id: any) {
    this.spinner.show();
    const endpoint =
      this.singleBien == null
        ? `/realestate/sales/dashboard?year=${this.currentYear}&promoterId=${id}`
        : `/realestate/sales/dashboard?year=${this.currentYear}&promoterId=${id}&parentPropertyId=${this.singleBien.id}`;
    
    this.userService.getDatas(endpoint).subscribe({
      next: (data) => {
        var newData: [] = data.map((item: { month: string | number; value: any }) => ({
          name: monthMapping[item.month] || item.month,
          value: item.value,
        }));
        this.barChartData = [...newData];
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error(err);
      },
    });
  }

  getCallForChargeDash(id: any) {
    const profil = this.storageService.getSubPlan();
    this.spinner.show();
    const endpoint =
      this.singleBien == null
        ? `/payment-calls/kpi?promoterId=${id}&planName=${profil}`
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

  // Nouvelle méthode d'export Excel
  exportToExcel(): void {
    this.spinner.show();
    
    try {
      // Création du workbook
      const wb = XLSX.utils.book_new();
      
      // Feuille 1: Statistiques générales
      const statsData = [
        ['Indicateur', 'Valeur', 'Évolution', 'Description'],
        ...this.indicateurs.map(i => [
          i.label,
          i.value,
          `${i.evolution}%`,
          i.suffix
        ])
      ];
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
      
      // Feuille 2: Répartition des lots
      const pieData = [
        ['Statut', 'Pourcentage'],
        ...this.pieChartData.map(item => [item.name, item.value])
      ];
      const wsPie = XLSX.utils.aoa_to_sheet(pieData);
      XLSX.utils.book_append_sheet(wb, wsPie, 'Répartition Lots');
      
      // Feuille 3: Ventes mensuelles
      if (this.barChartData.length > 0) {
        const salesData = [
          ['Mois', 'Ventes'],
          ...this.barChartData.map((item: any) => [item.name, item.value])
        ];
        const wsSales = XLSX.utils.aoa_to_sheet(salesData);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Ventes Mensuelles');
      }
      
      // Feuille 4: Appels de fonds
      const callData = [
        ['Statut', 'Montant (€)'],
        ...this.callForChargeData.map(item => [item.name, item.value])
      ];
      const wsCall = XLSX.utils.aoa_to_sheet(callData);
      XLSX.utils.book_append_sheet(wb, wsCall, 'Appels de Fonds');
      
      // Feuille 5: Réservations
      if (this.lineChartData[0]?.series?.length > 0) {
        const reservData = [
          ['Mois', 'Réservations'],
          ...this.lineChartData[0].series.map((item: any) => [item.name, item.value])
        ];
        const wsReserv = XLSX.utils.aoa_to_sheet(reservData);
        XLSX.utils.book_append_sheet(wb, wsReserv, 'Réservations');
      }
      
      // Génération du fichier
      const fileName = `dashboard_${this.selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      this.spinner.hide();
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      this.spinner.hide();
    }
  }

  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }

  loadMorePropreties() {
    if (!this.loading && !this.dataEnded) {
      this.loading = true;

      if (this.bienList && this.bienList.length > 0) {
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
            this.loading = false;
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
            this.loading = false;
          },
        });
      }
    }
  }
}