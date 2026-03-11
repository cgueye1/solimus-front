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
  selector: 'app-appel-fond-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appel-fond-form.component.html',
  styleUrl: './appel-fond-form.component.scss',
})
export class AppelFondFormComponent implements OnInit {
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
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.appelFondForm = this.fb.group({
      label: [this.formData.label || '', Validators.required],
      percentage: [
        this.formData.percentage || '',
        [ Validators.min(0), Validators.max(100)],
      ],
      amount: [this.formData.amount || '', Validators.required],

      tom: [this.formData.tom || ''],
      tva: [this.formData.tva || 0],
      expectedDate: [
        this.convertDateToISOInverse(this.formData.expectedDate) || '',
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
          'Le pourcentage ne peut pas dépasser 100%. Tous les champs ont été réinitialisés.',
        );
        return;
      }
      const amount = this.calculerMontant(this.singleLot.price, percentage);
      this.appelFondForm.get('amount')?.setValue(amount.toFixed(2));
    }
    this.formatAmount();
  }
  formatAmount() {
    const rawValue = this.appelFondForm.get('amount')?.value || '';
    const cleanedValue = rawValue.replace(/\s/g, '');
    const formatted = this.formatNumber(cleanedValue);
    this.appelFondForm.get('amount')?.setValue(formatted, { emitEvent: false });
  }

  formatAmountTOM() {
    const rawValue = this.appelFondForm.get('tom')?.value || '';
    const cleanedValue = rawValue.replace(/\s/g, '');
    const formatted = this.formatNumber(cleanedValue);
    this.appelFondForm.get('tom')?.setValue(formatted, { emitEvent: false });
  }
  formatNumber(value: string): string {
    const cleanedValue = value.replace(/\s/g, '');
    const numberValue = parseInt(cleanedValue, 10);
    return isNaN(numberValue) ? '' : numberValue.toLocaleString('fr-FR'); // Exemple : 12 500
  }

  onAmountChange() {
    if (!this.singleLot.rental) {
      const amount = parseFloat(
        this.appelFondForm.get('amount')?.value.replace(/\s+/g, ''),
      );
      if (this.singleLot?.price && !isNaN(amount)) {
        const percentage = this.calculerPourcentage(
          this.singleLot.price,
          amount,
        );
        if (percentage > 100) {
          this.resetFormWithAlert(
            'Le montant dépasse 100% du lot. Tous les champs ont été réinitialisés.',
          );
          return;
        }
        this.appelFondForm.get('percentage')?.setValue(percentage.toFixed(2));
      }
    } else {
      this.appelFondForm.get('percentage')?.setValue(100);
    }

    this.formatAmount();
  }

  calculerMontant(total: number, percentage: number): number {
    return (total * percentage) / 100;
  }

  calculerPourcentage(total: number, amount: number): number {
    return (amount / total) * 100;
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
        label: this.appelFondForm.get('label')?.value,
        percentage: this.appelFondForm.get('percentage')?.value,
        amount: this.appelFondForm.get('amount')?.value.replace(/\s+/g, ''),
        expectedDate: this.convertDateToISO(
          this.appelFondForm.get('expectedDate')?.value,
        ),
        status: this.appelFondForm.get('status')?.value,
        realEstatePropertyId: this.singleLot.id,
        tom: this.appelFondForm.get('tom')?.value?.replace(/\s+/g, ''),
        tva: this.appelFondForm.get('tva')?.value,
      };

      const request =
        this.formData && Object.keys(this.formData).length > 0
          ? this.userService.updateAnyData(
              body,
              `/payment-calls/${this.formData.id}`,
            )
          : this.userService.saveAnyData(body, `/payment-calls`);
          
      

      request.subscribe({
        next: () => {
          this.loading = false;
          this.spinner.hide();
          Swal.fire({
            icon: 'success',
            html: this.isEditMode
              ? 'Appel de fond modifié avec succès.'
              : 'Appel de fond ajouté avec succès.',
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
