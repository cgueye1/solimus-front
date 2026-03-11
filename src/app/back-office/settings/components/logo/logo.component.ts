import { Component, OnInit } from '@angular/core';
import { LogoService } from '../../../../shared/services/logo.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment.prod';
import { UserService } from '../../../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule,   ReactiveFormsModule, FormsModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent  implements OnInit {
  // Logo URL (initially set by the service)
  logoUrl: string = '';
  logoPreview :String ='';
  
  compagnyForm!: FormGroup;
  loading: boolean = false;
  IMG_URL: String = environment.fileUrl;
  id:any
  logo: File | null = null; // Renamed from singleImage to plan
  compagny:any
  currentUser:any

  constructor(private logoService: LogoService,  private spinner: NgxSpinnerService,
    private userService: UserService,  private fb: FormBuilder,) {
    // Subscribe to logo changes from the service
    this.logoService.currentLogo$.subscribe((logo) => {
      this.logoUrl = logo;
    });
  }
  ngOnInit(): void {
    this. getUser()
    this.  initForm()
  }
  singlePictureUrl() {
    if (this.logo) {
      this.logoPreview = URL.createObjectURL(this.logo);
     }  else {
       if(this.compagny.logo != ""){
        this.logoPreview=  this.getFullImageUrl(this.compagny.logo);

       }
     }
    
   }
   getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
  
  initForm() {
    this.compagnyForm= this.fb.group({
      name: [''],
      primaryColor: ['', ],
      secondaryColor: [''],
      logo: [''],
    });
  }

  getUser() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
       this. currentUser=data
       this. getCompagny() 
      },
      error: err => {
        console.error(err);
      }
    });
  
  
  }
  
  getCompagny() {
    const endpoint = "/companies/owner/"+this.currentUser.id;
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
        console.log("compagny")
     console.log(data)
       this. compagny=data
       this. singlePictureUrl()
       this.compagnyForm.get('name')?.setValue(this.compagny.name);
    
      },
      error: err => {
  
  
        console.error(err);
      }
    });
  
  
  }



  // Method to handle logo file change
  onLogoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newLogoUrl = e.target.result; // Get the new logo's data URL
       // this.logoService.updateLogo(newLogoUrl); // Update the logo in the service
      };
      
      this.logo = file;
      reader.readAsDataURL(file);
      this. singlePictureUrl()
    }
  }

  // Method to restore the logo to the default one
  restoreLogo(): void {
    this.logoService.restoreDefaultLogo(); // Call the restore method in the service
  }
  
  
  
  onSave() {
    
 
    if ( this.compagnyForm.valid && !this.loading) {
     // this.spinner.show();
    
      const formData = new FormData();
      formData.append('name',  this.compagnyForm.get('name')?.value);
      formData.append('primaryColor',  this.compagny.primaryColor);
      formData.append('secondaryColor', this.compagny.secondaryColor);

      // Append the file inputs
      if (this.logo) {
        formData.append('logo', this.logo, this.logo.name);
      }

      if (!this.loading) {
        this.loading = true;
        this.userService.updateAnyData(formData, `/companies/${this.compagny.id}`).subscribe({
          next: (data) => {
            this.loading = false;
            console.log(data)
          /*  this.spinner.hide();
            Swal.fire({
              icon: 'success',
              html: 'Property added successfully.',
              showConfirmButton: false,
              timer: 2000,
            }).then(() => {
       
            });*/
          },
          error: (err) => {
            console.error('Error during saving:', err);
            this.loading = false;
            this.spinner.hide();
          }
        });
      }
    } else {
      console.error('The form is invalid.');
      this.spinner.hide();
    }
  }
}
