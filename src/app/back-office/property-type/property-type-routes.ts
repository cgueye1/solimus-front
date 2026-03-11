import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { PropertyTypeComponent } from './property-type.component';

export const PaymentHistoryRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: PropertyTypeComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
