import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CardLotSelectionComponent } from "../../../../shared/components/card-lot-selection/card-lot-selection.component";
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';

@Component({
  selector: 'app-popup-manifestant-list',
  standalone: true,
  imports: [CommonModule, CardLotSelectionComponent],
  templateUrl: './popup-manifestant-list.component.html',
  styleUrl: './popup-manifestant-list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Suppresses unknown property errors

})
export class PopupManifestantListComponent  implements OnInit {
  @Input()  singleBien: any; 
  
  constructor(public modal: NgbModal, private userService: UserService, ) {}
  ngOnInit(): void {
    this.loadMorePropreties()
  }
  bienList: any[] = [];
  data:any[] = [];
  pageSize = 12;
  //lazy loading 
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  ///end lazy


  getStatusLot(status: string): { text: string; class: string } {
    return status === 'PAID'
      ? { text: 'Payé', class: 'success' }
      : { text: 'En attente', class: 'warning' };
  }

  openModal(template: any) {
    this.modal.open(template, {
      centered: true,
      scrollable: true,
    });
  }

  onSave() {
    Swal.fire({
      icon: 'success',
      html: 'Information enregistrée avec succès.',
      showConfirmButton: false,
      timer: 2000,
    })
  }
  
  
  
  
  
  
  
  loadMorePropreties() {
    if (!this.loading && !this.dataEnded ) {
      this.loading = true;
    
      if(this.  bienList)
        if (this.  bienList.length === 0) {
        } else {
          this.currentPage=this.currentPage+1;
  
        
        }
        
        
          var  endpoint= `/reservations/property/${this.singleBien.id}?page=${this.currentPage}&size=${this.pageSize}`;

      

        this.userService.getDatas(endpoint).subscribe({
          next: data => {
            this.loading = false;
            this.totalPages=data.totalPages
            this. bienList= data.content;  
            this.dataEnded = data.last

             
         
          },
          error: err => {
            if (err.error) {
           
              try {
                this.loading = false;
                const res = JSON.parse(err.error);
                this. bienList= res.message;
                
              
              } catch {
                this.loading = false;
              //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
              }
            } else {
              this.loading = false;
             // this.offresContent= `Error with status_: ${err}`;
            }
          }
        });
      
     
      
      
      
      
      
      
    }
  }
}
