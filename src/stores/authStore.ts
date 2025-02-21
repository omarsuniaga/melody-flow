import { defineStore } from "pinia";
import { auth } from "../firebase/config";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { useAuthService } from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as any,
    loading: false,
    error: null as string | null,
    initialized: false,
  }),

  getters: {
    // Retorna true si hay un usuario, false de lo contrario
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    /**
     * Inicializa la autenticación: Espera a que Firebase reporte el usuario actual.
     * Usa la función onAuthStateChanged del authService para actualizar 'this.user' en tiempo real.
     */
    async initializeAuth(): Promise<void> {
      this.loading = true;
      const authService = useAuthService();

      return new Promise<void>((resolve) => {
        const unsubscribe = authService.onAuthStateChanged((newUser: any) => {
          this.user = newUser;
          this.initialized = true;
          this.loading = false;
          unsubscribe(); // opcional, para dejar de escuchar cambios en este punto
          resolve();
        });
      });
    },

    /**
     * Inicia sesión con email y contraseña usando Firebase Auth.
     */
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        this.user = user;
        return user;
      } catch (e: any) {
        console.error("Error en login (email):", e);
        this.error = e.message || "Error desconocido";
        throw e; // Se lanza para que el componente maneje el error si necesita
      } finally {
        this.loading = false;
      }
    },

    /**
     * Registra un nuevo usuario con email, contraseña y displayName.
     * Se apoya en authService para la lógica adicional de registro.
     */
    async register(email: string, password: string, displayName: string) {
      this.loading = true;
      this.error = null;
      try {
        const authService = useAuthService();
        const user = await authService.register(email, password, displayName);
        this.user = user;
        return user;
      } catch (e: any) {
        console.error("Error en registro:", e);
        this.error = e.message || "Error desconocido";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cierra la sesión del usuario actual.
     */
    async logout() {
      this.loading = true;
      this.error = null;
      try {
        const authService = useAuthService();
        await authService.logout();
        this.user = null;
      } catch (e: any) {
        console.error("Error en logout:", e);
        this.error = e.message || "Error desconocido";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Actualiza la contraseña del usuario actual pidiendo la contraseña actual.
     */
    async updatePassword(currentPassword: string, newPassword: string) {
      this.loading = true;
      this.error = null;
      try {
        const authService = useAuthService();
        await authService.updatePassword(currentPassword, newPassword);
      } catch (e: any) {
        console.error("Error en updatePassword:", e);
        this.error = e.message || "Error desconocido";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Envía un correo de restablecimiento de contraseña al email proporcionado.
     */
    async resetPassword(email: string) {
      this.loading = true;
      this.error = null;
      try {
        const authService = useAuthService();
        await authService.resetPassword(email);
      } catch (e: any) {
        console.error("Error en resetPassword:", e);
        this.error = e.message || "Error desconocido";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Inicia sesión con Google usando un popup de Firebase Auth.
     * Retorna un objeto con { success: boolean, user?: any, reason?: string, error?: any }
     * para que el componente decida cómo manejar la UI.
     */
    async handleGoogleLogin() {
      this.loading = true;
      this.error = null;
      try {
        const authService = useAuthService();
        let result = await authService.handleGoogleLogin();
        // Si result es undefined, se asigna un valor por defecto
        if (!result) {
          result = { success: false, reason: "undefined-result" };
        }
        if (result.success) {
          this.user = result.user;
          return { success: true, user: result.user };
        }
        return result; // { success: false, reason: ... }
      } catch (error: any) {
        console.error("Error en Google login:", error);
        this.error = error.message || "Error desconocido";
        return { success: false, reason: "general-error", error };
      } finally {
        this.loading = false;
      }
    },
  },
});
