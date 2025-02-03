import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { logPageView } from '../utils/analytics';

const routes = [
    {
        path: '/',
        name: 'login',
        component: () => import('../views/LoginView.vue')
    },
    {
        path: '/',
        component: () => import('../layouts/DefaultLayout.vue'),
        children: [
            { path: '', redirect: '/calendar' },
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
        next('/');
    }
    else if (to.path === '/' && authStore.isAuthenticated) {
        next('/calendar'); // Cambiado de '/app' a '/calendar'
    }
    else {
        next();
    }
});

// Agregar after hook para tracking
router.afterEach((to) => {
    // Registrar la vista de página después de la navegación
    logPageView(to.path, to.name);
});

export default router;
