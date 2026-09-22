import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { auth } from '../firebase/config';
import type { User } from 'firebase/auth';

const routes: RouteRecordRaw[] = [
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
        component: () => import('../views/BalanceView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'negotiator',
        name: 'negotiator',
        component: () => import('../views/negotiator/NegotiatorSandboxView.vue'),
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
  const user = await new Promise<User | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      unsubscribe();
      resolve(currentUser);
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
