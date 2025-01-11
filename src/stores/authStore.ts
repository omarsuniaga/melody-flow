import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'
import { useAuthService } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const authService = useAuthService()
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function initializeAuth() {
    return new Promise<void>((resolve) => {
      authService.onAuthStateChanged((newUser) => {
        user.value = newUser
        initialized.value = true
        resolve()
      })
    })
  }

  async function login(email: string, password: string) {
    try {
      loading.value = true
      error.value = null
      user.value = await authService.login(email, password)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, displayName: string) {
    try {
      loading.value = true
      error.value = null
      user.value = await authService.register(email, password, displayName)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      loading.value = true
      error.value = null
      await authService.logout()
      user.value = null
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    try {
      loading.value = true
      error.value = null
      await authService.updatePassword(currentPassword, newPassword)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(email: string) {
    try {
      loading.value = true
      error.value = null
      await authService.resetPassword(email)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
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
    resetPassword
  }
})
