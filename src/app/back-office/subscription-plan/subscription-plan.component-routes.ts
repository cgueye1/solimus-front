import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { SubscriptionPlanComponent } from './subscription-plan.component';

export const subscriptionPlanRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: SubscriptionPlanComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
