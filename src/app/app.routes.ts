import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: 'payment-contribute/:donorId/:prescriptionId/:amount',
    loadComponent: () =>
      import('./back-office/payment/contribution-payment/contribution-payment.component').then(
        (c) => c.ContributionPaymentComponent,
      ),
  },
  {
    path: 'payment-prescription/:presId/:amount',
    loadComponent: () =>
      import('./back-office/payment/prescription-payment/prescription-payment.component').then(
        (c) => c.PrescriptionPaymentComponent,
      ),
  },
  {
    path: 'payment-redirect/:userId/:profil',
    loadComponent: () =>
      import('./back-office/payment/payment-redirect/payment-redirect.component').then(
        (c) => c.PaymentRedirectComponent,
      ),
  },

  {
    path: 'payment-wallet/:userId/:amount',
    loadComponent: () =>
      import('./back-office/payment/walet-delivery/walet-delivery.component').then(
        (c) => c.WaletDeliveryComponent,
      ),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./back-office/dashboard/dashboard-routes').then(
        (routes) => routes.dashboardRoutes,
      ),
  },
  {
    path: 'gestion-vente-vefa',
    loadChildren: () =>
      import('./back-office/gestion-vefa/gestion-vefa-routes').then(
        (routes) => routes.vefaRoutes,
      ),
  },

  {
    path: 'gestion-syndic',
    loadChildren: () =>
      import('./back-office/gestion-vefa/gestion-syndic-routes').then(
        (routes) => routes.syndicRoutes,
      ),
  },
  {
    path: 'simulateur-acquisiton',
    loadChildren: () =>
      import('./back-office/simulateur-acquisition/simulateur-routes').then(
        (routes) => routes.simulateurAcqRoutes,
      ),
  },
  {
    path: 'agenda',
    loadChildren: () =>
      import('./back-office/calendar/calendar-routes').then(
        (routes) => routes.calendarRoutes,
      ),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./back-office/settings/settings-routes').then(
        (routes) => routes.settingsRoutes,
      ),
  },

  {
    path: 'dashbord',
    loadChildren: () =>
      import('./back-office/dashboard/dashboard-routes').then(
        (routes) => routes.dashboardRoutes,
      ),
  },
  {
    path: 'dashbord-admin',
    loadChildren: () =>
      import('./back-office/dashboard-admin/dashboard-admin-routes').then(
        (routes) => routes.dashboardRoutes,
      ),
  },

  {
    path: 'subscription-plan',
    loadChildren: () =>
      import('./back-office/subscription-plan/subscription-plan.component-routes').then(
        (routes) => routes.subscriptionPlanRoutes,
      ),
  },
  {
    path: 'plan-type',
    loadChildren: () =>
      import('./back-office/subscription-plan-type/subscription-plan-type.component-routes').then(
        (routes) => routes.subscriptionPlanTypeRoutes,
      ),
  },

  {
    path: 'payment-history',
    loadChildren: () =>
      import('./back-office/payment-history/payment-history-routes').then(
        (routes) => routes.PaymentHistoryRoutes,
      ),
  },
  {
    path: 'property-types',
    loadChildren: () =>
      import('./back-office/property-type/property-type-routes').then(
        (routes) => routes.PaymentHistoryRoutes,
      ),
    // canActivate: [AuthGuard]
  },

  {
    path: 'utilisateurs',
    loadChildren: () =>
      import('./back-office/users/users-routes').then(
        (routes) => routes.UsersRoutes,
      ),
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./back-office/auth/auth-routes').then(
        (routes) => routes.authRoutes,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./front-office/front-office-routes').then(
        (routes) => routes.frontRoutes,
      ),
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
];
