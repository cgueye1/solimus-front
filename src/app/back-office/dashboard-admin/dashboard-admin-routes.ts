import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { DashboardAdminComponent } from './dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component:  DashboardAdminComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
