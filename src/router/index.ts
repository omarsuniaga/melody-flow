import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import CalendarView from '../views/CalendarView.vue'
import MonthlyBalanceView from '../views/MonthlyBalanceView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    children: [
      { path: '', redirect: '/calendar' },
      {
        path: '/calendar',
        name: 'calendar',
        component: () => import('../views/CalendarView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/monthly-balance',
        name: 'monthly-balance',
        component: () => import('../views/MonthlyBalanceView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/profile',
        name: 'profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Esperar a que se inicialice la autenticación
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
