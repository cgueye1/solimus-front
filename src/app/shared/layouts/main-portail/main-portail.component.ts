import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuPortailComponent } from "../menu-portail/menu-portail.component";
import { FooterPortailComponent } from "../footer-portail/footer-portail.component";

@Component({
  selector: 'app-main-portail',
  standalone: true,
  imports: [RouterModule, MenuPortailComponent, FooterPortailComponent],
  templateUrl: './main-portail.component.html',
  styleUrl: './main-portail.component.css',
})
export class MainPortailComponent {
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const btnScrollToTop = document.querySelector('#btnScrollToTop');

    if (window.scrollY > 200) {
      btnScrollToTop?.classList.add('show');
    } else {
      btnScrollToTop?.classList.remove('show');
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
