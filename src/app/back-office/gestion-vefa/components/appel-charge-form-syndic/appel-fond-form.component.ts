import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserService } from '../../../../_services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-appel-charge-form-syndic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appel-fond-form.component.html',
  styleUrl: './appel-fond-form.component.scss',
})
export class AppelChargeFormSyndicComponent implements OnInit {
  @Input() singleLot!: any;
  @Input() formData: any = {};
  @Input() isEditMode: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();

  appelFondForm!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    public modal: NgbModal,
    private userService: UserService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.appelFondForm = this.fb.group({
      titre: [this.formData.titre || '', Validators.required],
      description: [this.formData.description || '', Validators.required],
      price: [this.formData.price || '', Validators.required],
      startDate: [
        this.convertDateToISOInverse(this.formData.startDate) || '',
        Validators.required,
      ],
      status: [this.formData.status || ''],
    });
  }

  convertDateToISOInverse(date: string): string {
    if (!date) return '';
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  convertDateToISO(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  onPercentageChange() {
    const percentage = parseFloat(this.appelFondForm.get('percentage')?.value);
    if (this.singleLot?.price && !isNaN(percentage)) {
      if (percentage > 100) {
        this.resetFormWithAlert(
          'Le pourcentage ne peut pas dépasser 100%. Tous les champs ont été réinitialisés.'
        );
        return;
      }
      const price = this.calculerMontant(this.singleLot.price, percentage);
      this.appelFondForm.get('price')?.setValue(price.toFixed(2));
    }
    //this.formatprice();
  }
  formatprice() {
    const rawValue = this.appelFondForm.get('price')?.value || '';
    const cleanedValue = rawValue.replace(/\s/g, '');
    const formatted = this.formatNumber(cleanedValue);
    this.appelFondForm.get('price')?.setValue(formatted, { emitEvent: false });
  }
  formatNumber(value: string): string {
    const cleanedValue = value.replace(/\s/g, '');
    const numberValue = parseInt(cleanedValue, 10);
    return isNaN(numberValue) ? '' : numberValue.toLocaleString('fr-FR'); // Exemple : 12 500
  }

  onPriceChange() {
    if (!this.singleLot.rental) {
      const price = parseFloat(
        this.appelFondForm.get('price')?.value.replace(/\s+/g, '')
      );
      if (this.singleLot?.price && !isNaN(price)) {
        const percentage = this.calculerPourcentage(
          this.singleLot.price,
          price
        );
        if (percentage > 100) {
          this.resetFormWithAlert(
            'Le montant dépasse 100% du lot. Tous les champs ont été réinitialisés.'
          );
          return;
        }
        this.appelFondForm.get('percentage')?.setValue(percentage.toFixed(2));
      }
    } else {
      this.appelFondForm.get('percentage')?.setValue(100);
    }

    this.formatprice();
  }

  calculerMontant(total: number, percentage: number): number {
    return (total * percentage) / 100;
  }

  calculerPourcentage(total: number, price: number): number {
    return (price / total) * 100;
  }

  resetFormWithAlert(message: string) {
    this.appelFondForm.reset();
    Swal.fire({
      icon: 'warning',
      html: message,
      showConfirmButton: true,
    });
  }

  onSubmit() {
    if (this.appelFondForm.valid && !this.loading) {
      this.spinner.show();
      this.loading = true;

      const body = {
        titre: this.appelFondForm.get('titre')?.value,
        description: this.appelFondForm.get('description')?.value,
        price: this.appelFondForm.get('price')?.value.replace(/\s+/g, ''),
        startDate: this.convertDateToISO(
          this.appelFondForm.get('startDate')?.value
        ),
        deliveryDate: this.convertDateToISO(
          this.appelFondForm.get('startDate')?.value
        ),
        generateCallForCharge: true,
      };

      const request =
        this.formData && Object.keys(this.formData).length > 0
          ? this.userService.updateAnyData(body, `/works/${this.formData.id}`)
          : this.userService.saveAnyData(body, `/works/${this.singleLot.id}`);

      request.subscribe({
        next: () => {
          this.loading = false;
          this.spinner.hide();
          Swal.fire({
            icon: 'success',
            html: this.isEditMode
              ? 'Appel de charges modifié avec succès.'
              : 'Appel de charges ajouté avec succès.',
            showConfirmButton: false,
            timer: 2000,
          }).then(() => this.modal.dismissAll());
        },
        error: (err) => {
          this.loading = false;
          this.spinner.hide();
          Swal.fire({
            icon: 'warning',
            html: 'Problème',
            showConfirmButton: false,
            timer: 2000,
          }).then(() => this.modal.dismissAll());
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        html: 'Problème',
        showConfirmButton: false,
        timer: 2000,
      });
      console.error('Le formulaire est invalide.');
      this.spinner.hide();
    }
  }
}
