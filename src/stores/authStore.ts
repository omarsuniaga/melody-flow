import { defineStore } from 'pinia'
import { auth } from '../firebase/config'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useAuthService } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    loading: false,
    error: null as string | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async initializeAuth() {
      const authService = useAuthService()
      return new Promise<void>((resolve) => {
        authService.onAuthStateChanged((newUser: any) => {
          this.user = newUser
          this.initialized = true
          resolve()
        })
      })
    },
    async login(email: string, password: string) {
      try {
        this.loading = true
        this.error = null
        const authService = useAuthService()
        this.user = await authService.login(email, password)
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async register(email: string, password: string, displayName: string) {
      try {
        this.loading = true
        this.error = null
        const authService = useAuthService()
        this.user = await authService.register(email, password, displayName)
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        this.loading = true
        this.error = null
        const authService = useAuthService()
        await authService.logout()
        this.user = null
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async updatePassword(currentPassword: string, newPassword: string) {
      try {
        this.loading = true
        this.error = null
        const authService = useAuthService()
        await authService.updatePassword(currentPassword, newPassword)
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async resetPassword(email: string) {
      try {
        this.loading = true
        this.error = null
        const authService = useAuthService()
        await authService.resetPassword(email)
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async handleGoogleLogin() {
      try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({
          prompt: 'select_account',
          
        })
        const result = await signInWithPopup(auth, provider)
        this.user = result.user
        return result.user
      } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
          console.warn('El usuario cerró el popup de autenticación.')
          return
        }
        console.error('Error en login con Google:', error)
        throw error
      }
    },
  }
})
