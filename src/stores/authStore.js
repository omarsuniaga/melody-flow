import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthService } from '../services/authService';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
// Corrección: se eliminó el carácter "|" erróneo
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, auth } from '../firebase/config'; // Importa la configuración correctamente

export const useAuthStore = defineStore('auth', () => {
    const authService = useAuthService();
    const user = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const initialized = ref(false);
    const isAuthenticated = computed(() => !!user.value);
    async function initializeAuth() {
        return new Promise((resolve) => {
            authService.onAuthStateChanged((newUser) => {
                user.value = newUser;
                initialized.value = true;
                resolve();
            });
        });
    }
    async function login(email, password) {
        try {
            loading.value = true;
            error.value = null;
            user.value = await authService.login(email, password);
        }
        catch (e) {
            error.value = e.message;
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function register(email, password, displayName) {
        try {
            loading.value = true;
            error.value = null;
            user.value = await authService.register(email, password, displayName);
        }
        catch (e) {
            error.value = e.message;
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function logout() {
        try {
            loading.value = true;
            error.value = null;
            await authService.logout();
            user.value = null;
        }
        catch (e) {
            error.value = e.message;
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function updatePassword(currentPassword, newPassword) {
        try {
            loading.value = true;
            error.value = null;
            await authService.updatePassword(currentPassword, newPassword);
        }
        catch (e) {
            error.value = e.message;
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    async function handleGoogleLogin() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const googleUser = result.user;
            user.value = googleUser;
            return googleUser;
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                console.warn('El usuario cerró el popup de autenticación.');
                return;
            }
            console.error('Error en login con Google (popup):', error);
            throw error;
        }
    }
    async function resetPassword(email) {
        try {
            loading.value = true;
            error.value = null;
            await authService.resetPassword(email);
        }
        catch (e) {
            error.value = e.message;
            throw e;
        }
        finally {
            loading.value = false;
        }
    }
    return {
        user,
        loading,
        error,
        initialized,
        isAuthenticated,
        initializeAuth,
        login,
        register,
        logout,
        updatePassword,
        resetPassword,
        handleGoogleLogin
    };
});
