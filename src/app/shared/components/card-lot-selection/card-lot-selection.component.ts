import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-card-lot-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-lot-selection.component.html',
  styleUrl: './card-lot-selection.component.scss',
})
export class CardLotSelectionComponent {
  @Input() options: any[] = []; // Liste d'options
  @Input() name: string = ''; // Nom pour identifier les inputs
  //@Input() id: any = 0; 
  @Output() selected = new EventEmitter<number>(); // Emet l'option sélectionnée
    IMG_URL:String =  environment.fileUrl;
    pageSize = 12;
  //lazy loading 
  currentPage: number = 0;
  currentPage1: number = 0;
  loading: boolean = false;
  dataEnded: boolean = false;
  totalPages: number = 0;

  onSelect(option: number) {
    this.selected.emit(option);
  }
  formatPrix(value: number): string {
    // Formatting the value for better readability (e.g., 1,000,000,000 FCFA)
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(value);
  }
  
  
  getFullImageUrl(img: string): string {
    return `${this.IMG_URL}/${encodeURIComponent(img)}`;
  }
  
  
      @HostListener('window:scroll', ['$event'])
      onScroll(): void {
      
      console.log((window.innerHeight + window.scrollY) >= document.body.offsetHeight)
      
      
      
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
          
          
        }
      }
      
      
      
      
      
     /* oadMoreLots() {
        this.loading = true;
      

          if ( this. options.length === 0) {
            console.log("La variable content est vide.");
          } else {
            this.currentPage=this.currentPage+1;
    
          
          }
          var  endpoint=  `/realestate/search-by-parent?page=${this.currentPage}&size=${this.pageSize}`;
      console.log( endpoint)
         var body= {
          "parentPropertyId":  this. id,
          
         }
        this.userService.saveAnyData(body,endpoint).subscribe({
          next: data => {
            console.log( "lots")
            console.log( data )
            this.loading = false;
            this. lots= data.content;  
            
         
       
         
          },
          error: err => {
            if (err.error) {
              console.log(err)
              try {
                const res = JSON.parse(err.error);
                this. bienList= res.message;
           
              
              } catch {
              
              }
            } else {
         
            }
          }
        });
    
    }*/

}
