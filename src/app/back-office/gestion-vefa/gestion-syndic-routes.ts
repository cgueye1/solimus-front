import { Routes } from '@angular/router';
import { MainComponent } from '../../shared/layouts/main/main.component';
import { ListBienComponent } from './pages/list-bien/list-bien.component';
import { CreateBienComponent } from './pages/create-bien/create-bien.component';
import { EditBienComponent } from './pages/edit-bien/edit-bien.component';
import { DetailBienComponent } from './pages/detail-bien/detail-bien.component';
import { SingleBienComponent } from './pages/single-bien/single-bien.component';
import { CreateLotComponent } from './pages/create-lot/create-lot.component';
import { DetailLotComponent } from './pages/detail-lot/detail-lot.component';
import { EditLotComponent } from './pages/edit-lot/edit-lot.component';
import { ListBienSyndicComponent } from './pages/list-bien-syndic/list-bien-syndic.component';
import { DetailSyndicComponent } from './pages/detail-syndic/detail-syndic.component';
import { CreateBienSyndicComponent } from './pages/create-bien-syndic/create-bien-syndic.component';

export const syndicRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
   
       {
        path: '',
        component: ListBienSyndicComponent ,
      },
    
        {
        path: 'create-bien-syndic',
        component: CreateBienSyndicComponent,
      },
     
      {
        path: ':dataId/detail-syndic',
        component: DetailSyndicComponent ,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
