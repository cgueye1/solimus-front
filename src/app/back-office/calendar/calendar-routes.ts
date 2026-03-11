import { Routes } from "@angular/router";
import { MainComponent } from "../../shared/layouts/main/main.component";
import { CalendarComponent } from "./calendar.component";

export const calendarRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        component: CalendarComponent,
      },
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
