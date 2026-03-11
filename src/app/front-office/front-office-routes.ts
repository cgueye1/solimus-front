import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { MainPortailComponent } from '../shared/layouts/main-portail/main-portail.component';
import { AllBienComponent } from './all-bien/all-bien.component';
import { SingleBienComponent } from './single-bien/single-bien.component';
import { SingleBienComponent1 } from './single-immeble/single-bien.component';

export const frontRoutes: Routes = [
  {
    path: '',
    redirectTo: 'accueil', // Root path redirects to 'accueil'
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainPortailComponent,
    children: [
      {
        path: 'biens',
        component: AllBienComponent,
      },
      {
        path: 'parent/:dataId/detail',
        component: SingleBienComponent1,
      },
        {
        path: 'biens/:dataId/detail',
        component: SingleBienComponent,
      },
    ],
  },
  {
    path: 'accueil',
    component: HomepageComponent, // This will display the homepage
  },
  {
    path: '**',
    redirectTo: 'accueil', // Wildcard route redirects to 'accueil'
  },
];
