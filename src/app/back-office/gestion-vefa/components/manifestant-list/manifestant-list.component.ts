import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CardLotSelectionComponent } from "../../../../shared/components/card-lot-selection/card-lot-selection.component";
import Swal from 'sweetalert2';
import { UserService } from '../../../../_services/user.service';
import { ProfilEnum } from '../../../../enums/ProfilEnum';


@Component({
  selector: 'app-manifestant-list',
  standalone: true,
  imports: [CommonModule, CardLotSelectionComponent],
  templateUrl: './manifestant-list.component.html',
  styleUrl: './manifestant-list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Suppresses unknown property errors

})
export class ManifestantListComponent {
  @Input()  singleBien: any; 
  
  constructor(public modal: NgbModal, private userService: UserService, ) {}

  bienList: any[] = [];
  data:any[] = [];
  lots:any[] = [];
  pageSize = 12;
  selectedLotId:number =0;
  selectedReservationId:number =0;
  currentIndex:number =0;
  //lazy loading 
  currentPage: number = 0;
  
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;
  currentUser:any
  ProfilEnum = ProfilEnum; 
  
  
  
  getMe() {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: data => {
 
        this.currentUser=data
      },
      error: err => {
  
  
    
      }
    });
  
  }
  ///end lazy
  ngOnInit(): void {
    this.loadMorePropreties()
    this. loadMoreLots()
    this.  getMe() 
  }
  
  
  
  // Function to handle selected option
  onOptionSelected(optionId: number) {
    this.selectedLotId = optionId;

  }

  getStatusLot(status: string): { text: string; class: string } {
    return status === 'RESERVED'
      ? { text: 'Réservé', class: 'success' }
      : { text: 'Prospect', class: 'warning' };
  }

  openModal(template: any,id:any,index:any) {
   this. lots = this.lots.filter(option => option.status !== 'RESERVED' && option.status !== 'SOLD' && option.id!==  this. bienList[index].property.id)
    
    
    this.selectedReservationId=id
    this. currentIndex=index
    this.modal.open(template, {
      centered: true,
      scrollable: true,
    });
  }

  onSave() {
    
    if(this.selectedLotId > 0 &&  this.selectedReservationId>0){
    this.send()
    }
  
    
    
  }
  
  getLotIndexById(id: number): number {
    return this.lots.findIndex(lot => lot.id === id);
  }
  send() {
  
    var  endpoint=  `/reservations/${this.selectedReservationId}`;

   var body= {
    "propertyId": this.selectedLotId ,
    "userId":0,

   }

  this.userService.updateAnyData(body,endpoint).subscribe({
    next: data => {
  
     this.lots[this.getLotIndexById( this.selectedLotId )]=data.property
     this.bienList[this. currentIndex]=data
     
     this.loadMorePropreties()

      Swal.fire({
        icon: 'success',
        html: 'Information enregistrée avec succès.',
        showConfirmButton: false,
        timer: 2000,
      })
      
    
   
    },
    error: err => {
      if (err.error) {
 
        try {
     
       
        
        } catch {
         

        //  this.offresContent = `Error with status: ${err.status} - ${err.statusText}`;
        }
      } else {
  
 
       // this.offresContent= `Error with status_: ${err}`;
      }
    }
  });

}
  
  
  
  
  
  
  
  loadMorePropreties() {
    if (!this.loading && !this.dataEnded ) {
      this.loading = true;
    
      if(this.  bienList)
        if (this.bienList.length === 0) {
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
  
  
  
  
  
  
  loadMoreLots() {
      this.loading = true;
    
      if(   this. lots)
        if ( this. lots.length === 0) {
        } else {
          this.currentPage1=this.currentPage1+1;
  
        
        }
        var  endpoint=  `/realestate/search-by-parent?page=${this.currentPage1}&size=${200}`;
  
       var body= {
        "parentPropertyId":  this. singleBien.id,
        
       }
      this.userService.saveAnyData(body,endpoint).subscribe({
        next: data => {
       
          this.loading = false;
          this. lots= data.content;  
          
       
     
       
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
  
  /*getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }*/
}
