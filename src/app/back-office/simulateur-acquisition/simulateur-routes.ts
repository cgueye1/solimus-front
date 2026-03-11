import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { SimulateurAcquisitionComponent } from './simulateur-acquisition.component';


export const simulateurAcqRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: SimulateurAcquisitionComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
