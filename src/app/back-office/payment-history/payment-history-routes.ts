import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { PaymentHistoryComponent } from './payment-history.component';

export const PaymentHistoryRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: PaymentHistoryComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
