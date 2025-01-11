import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '../views/CalendarView.vue'
import MonthlyBalanceView from '../views/MonthlyBalanceView.vue'
import ProfileView from '../views/ProfileView.vue'
import { auth } from '../firebase/config'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/',
    name: 'calendar',
    component: CalendarView,
    meta: { requiresAuth: true }
  },
  {
    path: '/balance',
    name: 'balance',
    component: MonthlyBalanceView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
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
