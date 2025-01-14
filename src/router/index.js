import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
const routes = [
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
                path: '/balance',
                name: 'balance',
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
    },
    // Añadir la ruta de registro
    {
        path: '/register',
        name: 'register',
        component: () => import('../views/RegisterView.vue')
    }
];
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    // Esperar a que se inicialice la autenticación
    if (!authStore.initialized) {
        await authStore.initializeAuth();
    }
    if (requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    }
    else if (to.path === '/login' && authStore.isAuthenticated) {
        next('/');
    }
    else {
        next();
    }
});
export default router;
