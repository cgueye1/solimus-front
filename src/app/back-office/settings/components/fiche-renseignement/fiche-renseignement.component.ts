import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-fiche-renseignement',
  standalone: true,
  imports: [CommonModule,   ReactiveFormsModule, FormsModule],
  templateUrl: './fiche-renseignement.component.html',
  styleUrl: './fiche-renseignement.component.scss',
}) 
export class FicheRenseignementComponent  implements OnInit  {
  sheetForm!: FormGroup;
  loading: boolean = false;
  IMG_URL: String = environment.fileUrl;
  id:any
  file: File | null = null; 
  currentUser:any

  constructor(public modal: NgbModal,  private spinner: NgxSpinnerService,
    private userService: UserService,  private fb: FormBuilder,) {}
  ngOnInit(): void {
   this.initForm()
   this.getUser() 
  }
  
  
  getUser() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
       this. currentUser=data
   
      },
      error: err => {
      }
    });
  
  
  }
  
  
  initForm() {
    this.sheetForm= this.fb.group({
      file: [null],
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newLogoUrl = e.target.result; // Get the new logo's data URL
       // this.logoService.updateLogo(newLogoUrl); // Update the logo in the service
      };
      
      this.file = file;
      reader.readAsDataURL(file);
    }
  }
  openModal(template: any) {
    this.modal.open(template, {
      centered: true,
      scrollable: true,
      // size: 'sm',
    });
  }

  openPdf(technicalSheet:any) {
    const url =  `${this.IMG_URL}/${technicalSheet}`;
    window.open(url, '_blank');
  }
  
  
  onSave() {
    
 
    if ( this.sheetForm.valid && !this.loading) {
      this.spinner.show();
    
      const formData = new FormData();
      formData.append('id',   this. currentUser.id);


      // Append the file inputs
      if (this.file) {
        formData.append('file', this.file, this.file.name);
      }

      if (!this.loading) {
        this.loading = true;
        this.userService.updateAnyData(formData, `/v1/user/technical-sheet`).subscribe({
          next: (data) => {
            this.loading = false;
        
            this.currentUser = data
            Swal.fire({
              icon: 'success',
              html: 'Fiche de rensignement enregistrée avec succès.',
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
              this.modal.dismissAll();
              this.spinner.hide();
             
            }
            )
          },
          error: (err) => {
            this.loading = false;
            this.spinner.hide();
          }
        });
      }
    } else {
      this.spinner.hide();
    }
  }
}
