import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase/config';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/calendar'
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('../views/CalendarView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'balance',
        name: 'balance',
        component: () => import('../views/MonthlyBalanceView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  // Ruta comodín para manejar páginas no encontradas
  {
    path: '/:catchAll(.*)',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  // Esperar a que Firebase inicialice y obtener el usuario actual
  const user = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });

  if (to.matched.some(record => record.meta.requiresAuth) && !user) {
    next('/login');
  } else if (to.matched.some(record => record.meta.requiresGuest) && user) {
    next('/calendar');
  } else {
    next();
  }
});

export default router;
