import { Routes } from "@angular/router";
import { MainComponent } from "../../shared/layouts/main/main.component";
import { ListUtilisateurComponent } from "./list-utilisateur/list-utilisateur.component";

export const UsersRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: ListUtilisateurComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
