export interface IMenu {
  menId: number;
  menPath: string;
  menTitle: string;
  menIconType: string;
  type: 'link' | 'sub';

  // 👇 AJOUT ICI
  menQueryParams?: {
    [key: string]: any;
  };

  childrens?: {
    menId: number;
    menPath: string;
    menTitle: string;
  }[];
}

export const MENU_ITEMS1: IMenu[] = [
  {
    menId: 0,
    menTitle: 'Vue analytique',
    menPath: '/dashbord-admin',
    menIconType: 'home',
    type: 'link',
    childrens: [],
  },

  {
    menId: 1,
    menTitle: 'Tableau de bord',
    menPath: '/dashboard',
    menIconType: 'home',
    type: 'link',
    childrens: [],
  },
  {
    menId: 2,
    menTitle: 'Gestion Vente VEFA',
    menPath: '/gestion-vente-vefa',

    menIconType: 'apartment',
    type: 'link',
    childrens: [],
  },

  {
    menId: 3,
    menTitle: 'Gestion Location',
    menPath: '/gestion-vente-vefa',
    menQueryParams: { rental: true },

    menIconType: 'home_work',
    type: 'link',
    childrens: [],
  },
  {
    menId: 4,
    menTitle: 'Simulateur d’acquisiton',
    menPath: '/simulateur-acquisiton',
    menIconType: 'calculate',
    type: 'link',
    childrens: [],
  },

  {
    menId: 5,
    menTitle: 'Agenda',
    menPath: '/agenda',
    menIconType: 'calendar_today', // Utilise l'icône de calendrier
    type: 'link',
    childrens: [],
  },
  {
    menId: 6,
    menTitle: 'Gestion utilisateurs',
    menPath: '/utilisateurs',
    menIconType: 'group', // Utilise l'icône de calendrier
    type: 'link',
    childrens: [],
  },

  {
    menId: 7,
    menTitle: 'Copropriétaires',
    menPath: '/gestion-syndic',

    menIconType: 'apartment',
    type: 'link',
    childrens: [],
  },

  {
    menId: 8,
    menTitle: 'Plan abonnements',
    menPath: '/subscription-plan',
    menIconType: 'subscriptions',
    type: 'link',
    childrens: [],
  },

  {
    menId: 9,
    menTitle: 'Types abonnements',
    menPath: '/plan-type',
    menIconType: 'view_list',
    type: 'link',
    childrens: [],
  },
  {
    menId: 10,
    menTitle: 'Historiques',
    menPath: '/payment-history',
    menIconType: 'history',
    type: 'link',
    childrens: [],
  },

  {
    menId: 11,
    menTitle: 'Types de biens',
    menPath: '/property-types',
    menIconType: 'home_work',
    type: 'link',
    childrens: [],
  },
];
