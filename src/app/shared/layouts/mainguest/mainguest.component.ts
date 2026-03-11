import {
  Component,
} from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mainguest',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './mainguest.component.html',
  styleUrl: './mainguest.component.css'
})
export class MainguestComponent {
  constructor() {}

  ngOnInit(): void {
  }
}
