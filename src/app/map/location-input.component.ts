import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocomplete,
} from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, from, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { MapModalComponent } from './map-modal.component';

declare var google: any;

@Component({
  selector: 'app-location-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="location-input-wrapper">
      <div class="w-100">
        <input
          id="location-input"
          type="text"
          class="form-control"
          [formControl]="searchControl"
          [matAutocomplete]="auto"
          placeholder="Rechercher par lieu ou cliquer pour ouvrir la carte"
          (click)="openMapModal()"
          #inputRef
        />

        <mat-autocomplete
          #auto="matAutocomplete"
          (optionSelected)="onOptionSelected($event)"
        >
          <mat-option
            *ngFor="let option of filteredOptions | async"
            [value]="option.description"
          >
            {{ option.description }}
          </mat-option>
        </mat-autocomplete>
      </div>
    </div>
  `,
  styles: [
    `
      .location-input-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
      }

      .location-input-wrapper span {
        margin-top: 8px;
      }

      .w-100 {
        width: 100%;
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
      }

      label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.6);
      }
    `,
  ],
})
export class LocationInputComponent implements OnInit {
  @Input() placeholder = 'Rechercher par lieu';
  @Input() initialValue = '';
  @Input() apiKey = '';


  @Output() locationSelected = new EventEmitter<LocationData>();

  @ViewChild('inputRef') inputRef!: ElementRef;
  @ViewChild('auto') autoComplete!: MatAutocomplete;

  searchControl = new FormControl<string>('');
  filteredOptions!: Observable<any[]>;

  private autocompleteService!: any;
  private placesService!: any;

  constructor(
    private dialog: MatDialog,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.searchControl.setValue(this.initialValue);

    // Charger Google Maps
    this.loadGoogleMapsAPI().then(() => {
      this.autocompleteService = new google.maps.places.AutocompleteService();
    });

    // ✅ AUTOCOMPLETE CORRIGÉ
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(this.initialValue),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (typeof value === 'string' && value.length > 2) {
          return from(this.getPlacePredictions(value));
        }
        return of([]);
      }),
    );
  }

  // ================= GOOGLE MAPS =================

  private loadGoogleMapsAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private getPlacePredictions(input: string): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.autocompleteService) {
        resolve([]);
        return;
      }

      this.autocompleteService.getPlacePredictions(
        { input },
        (predictions: any[], status: any) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            resolve(predictions);
          } else {
            resolve([]);
          }
        },
      );
    });
  }

  // ================= SELECTION =================

  onOptionSelected(event: any): void {
    const placeDescription = event.option.value;
    this.getPlaceDetails(placeDescription);
  }

  private getPlaceDetails(placeDescription: string): void {
    const div = document.createElement('div');
    this.placesService = new google.maps.places.PlacesService(div);

    const request = {
      query: placeDescription,
      fields: ['name', 'geometry', 'formatted_address', 'place_id'],
    };

    this.placesService.findPlaceFromQuery(
      request,
      (results: any[], status: any) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results[0]
        ) {
          const place = results[0];

          const locationData: LocationData = {
            name: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            placeId: place.place_id,
          };

          this.ngZone.run(() => {
            this.searchControl.setValue(
              locationData.address || locationData.name,
            );
            this.locationSelected.emit(locationData);
          });
        }
      },
    );
  }

  // ================= MAP MODAL =================

  openMapModal(): void {
    const dialogRef = this.dialog.open(MapModalComponent, {
      width: '90%',
      maxWidth: '1200px',
      height: '80vh',
      data: {
        apiKey: this.apiKey,
        initialLocation: this.searchControl.value,
      },
    });

    dialogRef.afterClosed().subscribe((result: LocationData) => {
      if (result) {
        this.searchControl.setValue(result.address || result.name);
        this.locationSelected.emit(result);
      }
    });
  }
}

// ================= INTERFACE =================

export interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}
