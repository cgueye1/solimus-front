import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { SubscriptionPlanTypeComponent } from './subscription-plan-type.component';

export const subscriptionPlanTypeRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: SubscriptionPlanTypeComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
