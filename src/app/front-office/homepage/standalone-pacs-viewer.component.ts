// standalone-pacs-viewer.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Interface pour typer la réponse
interface PacsResponse {
  studies: string[];
  series: {
    [key: string]: string[];
  };
}

@Component({
  selector: 'app-standalone-pacs-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pacs-viewer-container">
      <!-- Header -->
      <div class="header">
        <h2>🔍 Visualiseur PACS - {{ accessionNumber }}</h2>
      </div>

      <!-- État de chargement -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner-large"></div>
        <p>Chargement des images...</p>
      </div>

      <!-- Message d'erreur -->
      <div *ngIf="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Viewer OHIF Intégré -->
      <div *ngIf="!isLoading && viewerUrl" class="viewer-wrapper">
        <iframe 
          [src]="safeViewerUrl" 
          class="ohif-viewer"
          allow="fullscreen"
          allowfullscreen
          frameborder="0">
        </iframe>
      </div>

      <!-- Message si pas d'images -->
      <div *ngIf="!isLoading && !viewerUrl && !errorMessage" class="no-images">
        <div class="no-images-content">
          <span class="no-images-icon">🖼️</span>
          <h3>Aucune image disponible</h3>
          <p>Aucune série trouvée pour l'accession number: "{{ accessionNumber }}"</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pacs-viewer-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #1a1a1a;
    }

    .header {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      border-bottom: 2px solid #3498db;
    }

    .header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: normal;
    }

    .loading-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      background: #1a1a1a;
    }

    .spinner-large {
      width: 50px;
      height: 50px;
      border: 5px solid #34495e;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: #c0392b;
      color: white;
      padding: 1rem;
      margin: 1rem;
      border-radius: 5px;
      text-align: center;
    }

    .viewer-wrapper {
      flex: 1;
      width: 100%;
      background: #000;
      position: relative;
    }

    .ohif-viewer {
      width: 100%;
      height: 100%;
      border: none;
      background: #000;
    }

    .no-images {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: white;
    }

    .no-images-content {
      text-align: center;
      padding: 2rem;
    }

    .no-images-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-images h3 {
      color: #ecf0f1;
      margin-bottom: 0.5rem;
    }

    .no-images p {
      color: #95a5a6;
    }
  `]
})
export class StandalonePacsViewerComponent implements OnInit {
  // Input pour recevoir l'accessionNumber
  @Input() accessionNumber: string = '';
  
  // Propriétés
  viewerUrl: string | null = null;
  safeViewerUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // URL de l'API
  private apiUrl = 'https://wakana.online/pharma-delivery/api/imaging/viewers';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.accessionNumber) {
      this.loadViewerUrl();
    } else {
      this.errorMessage = 'Accession Number non fourni';
      this.isLoading = false;
    }
  }

  // Charger l'URL du viewer
  private loadViewerUrl() {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<PacsResponse>(`${this.apiUrl}/${this.accessionNumber}`).subscribe({
      next: (data) => {
        // Prendre la première série de la première étude
        if (data.studies && data.studies.length > 0) {
          const firstStudyId = data.studies[0];
          const seriesUrls = data.series[firstStudyId];
          
          if (seriesUrls && seriesUrls.length > 0) {
            // Prendre la première URL de viewer
            this.viewerUrl = seriesUrls[0];
            // Nettoyer l'URL pour le iframe
            this.safeViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerUrl);
          } else {
            this.errorMessage = 'Aucune série disponible pour cette étude';
          }
        } else {
          this.errorMessage = 'Aucune étude trouvée';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Erreur lors du chargement des images';
        this.isLoading = false;
      }
    });
  }

  // Recharger avec un nouvel accession number
  loadNewAccession(accessionNumber: string) {
    this.accessionNumber = accessionNumber;
    this.loadViewerUrl();
  }
}