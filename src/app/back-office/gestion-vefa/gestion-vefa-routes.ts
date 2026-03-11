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

export const vefaRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: ListBienComponent,
      },
       {
        path: 'list-bien-syndic',
        component: ListBienSyndicComponent ,
      },
      {
        path: 'create-bien',
        component: CreateBienComponent,
      },
        {
        path: 'create-bien-syndic',
        component: CreateBienComponent,
      },
      {
        path: ':dataId/edit-bien',
        component: EditBienComponent,
      },
      {
        path: ':dataId/detail-bien',
        component: SingleBienComponent,
        children: [
          {
            path: '',
            component: DetailBienComponent,
          },
          {
            path: ':dataId/create-lot',
            component: CreateLotComponent,
          },
          {
            path: ':dataId/edit-lot',
            component: EditLotComponent,
          },
          {
            path: ':dataId/detail-lot',
            component: DetailLotComponent,
          },
        ],
      },
      {
        path: ':dataId/detail-lot',
        component: DetailLotComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
