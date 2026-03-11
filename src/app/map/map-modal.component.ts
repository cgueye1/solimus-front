// map-modal.component.ts
import { Component, Inject, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LocationData } from './location-input.component';

declare var google: any;

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  template: `
    <div class="map-modal-container">
      <div class="modal-header">
        <h2>Sélectionner un lieu sur la carte</h2>
        <button mat-icon-button (click)="closeModal()">
          <i class="material-icons">close</i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher un lieu</mat-label>
            <input
              matInput
              [(ngModel)]="searchQuery"
              (keyup.enter)="searchPlace()"
              placeholder="Entrez une adresse ou un lieu"
            />
            <button mat-icon-button matSuffix (click)="searchPlace()">
              <i class="material-icons">search</i>
            </button>
          </mat-form-field>
        </div>
        
        <div #mapContainer class="map-container"></div>
        
        <div class="selected-location" *ngIf="selectedLocation">
          <p><strong>Lieu sélectionné:</strong> {{ selectedLocation.address }}</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button mat-button (click)="closeModal()">Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!selectedLocation"
          (click)="confirmSelection()"
        >
          Confirmer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .map-modal-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }
    
    .modal-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24px;
      overflow: hidden;
    }
    
    .search-section {
      margin-bottom: 16px;
    }
    
    .search-field {
      width: 100%;
    }
    
    .map-container {
      flex: 1;
      min-height: 400px;
      width: 100%;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .selected-location {
      margin-top: 16px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `]
})
export class MapModalComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private map: any;
  private marker: any;
  private geocoder: any;
  
  searchQuery: string = 'Dakar';
  selectedLocation: LocationData | null = null;
  
  constructor(
    private dialogRef: MatDialogRef<MapModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { apiKey: string; initialLocation: string },
    private ngZone: NgZone
  ) {}
  
  async ngOnInit() {
    await this.loadGoogleMapsAPI();
    this.initMap();
    this. searchPlace()
  }
  
  private loadGoogleMapsAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.data.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  private initMap() {
    // Position par défaut (Paris)
    const defaultLocation = { lat: 48.856614, lng: 2.3522219 };
    
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: defaultLocation,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });
    
    this.geocoder = new google.maps.Geocoder();
    
    // Ajouter un listener pour le clic sur la carte
    this.map.addListener('click', (event: any) => {
      this.ngZone.run(() => {
        this.placeMarker(event.latLng);
        this.getAddressFromLatLng(event.latLng);
      });
    });
    
    // Chercher le lieu initial si fourni
    if (this.data.initialLocation) {
      this.searchQuery = this.data.initialLocation;
      setTimeout(() => this.searchPlace(), 500);
    }
  }
  
  private placeMarker(location: any) {
    if (this.marker) {
      this.marker.setMap(null);
    }
    
    this.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      animation: google.maps.Animation.DROP,
      draggable: true
    });
    
    // Rendre le marqueur déplaçable
    this.marker.addListener('dragend', () => {
      const position = this.marker.getPosition();
      this.ngZone.run(() => {
        this.getAddressFromLatLng(position);
      });
    });
  }
  
  private getAddressFromLatLng(latLng: any) {
    this.geocoder.geocode({ location: latLng }, (results: any[], status: any) => {
      if (status === 'OK' && results[0]) {
        this.ngZone.run(() => {
          this.selectedLocation = {
            name: results[0].address_components[0]?.long_name || 'Lieu sélectionné',
            address: results[0].formatted_address,
            latitude: latLng.lat(),
            longitude: latLng.lng(),
            placeId: results[0].place_id
          };
        });
      }
    });
  }
  
  searchPlace() {
    if (!this.searchQuery.trim()) return;
    
    const request = {
      query: this.searchQuery,
      fields: ['name', 'geometry', 'formatted_address']
    };
    
    const service = new google.maps.places.PlacesService(this.map);
    service.findPlaceFromQuery(request, (results: any[], status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0];
        
        // Centrer la carte sur le lieu trouvé
        this.map.setCenter(place.geometry.location);
        this.map.setZoom(15);
        
        // Placer un marqueur
        this.placeMarker(place.geometry.location);
        
        // Mettre à jour le lieu sélectionné
        this.selectedLocation = {
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          placeId: place.place_id
        };
      }
    });
  }
  
  confirmSelection() {
    this.dialogRef.close(this.selectedLocation);
  }
  
  closeModal() {
    this.dialogRef.close();
  }
}