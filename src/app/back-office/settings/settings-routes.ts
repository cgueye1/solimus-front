import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { MonCompteComponent } from './mon-compte/mon-compte.component';


export const settingsRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'accounts',
        component: MonCompteComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
