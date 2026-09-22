import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../../../src/stores/authStore'
import { mockFirebaseUser } from '../../fixtures/users'

// Referencia mutable del servicio mock para poder customizar por test
const mockAuthService = {
  onAuthStateChanged: vi.fn((cb: (u: null) => void) => {
    // Ejecutar callback async para que `unsubscribe` ya esté asignado
    Promise.resolve().then(() => cb(null))
    return vi.fn()
  }),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updatePassword: vi.fn(),
  resetPassword: vi.fn(),
  handleGoogleLogin: vi.fn(),
}

vi.mock('../../../src/services/authService', () => ({
  useAuthService: () => mockAuthService,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthService.onAuthStateChanged = vi.fn((cb: (u: null) => void) => {
    Promise.resolve().then(() => cb(null))
    return vi.fn()
  })
})

describe('authStore.ts', () => {
  describe('estado inicial', () => {
    it('user es null', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('loading es false', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
    })

    it('error es null', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })

    it('initialized es false', () => {
      const store = useAuthStore()
      expect(store.initialized).toBe(false)
    })

    it('isAuthenticated retorna false sin usuario', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('initializeAuth', () => {
    it('marca initialized en true después de completar', async () => {
      const store = useAuthStore()
      await store.initializeAuth()
      expect(store.initialized).toBe(true)
    })

    it('loading queda en false tras inicializar', async () => {
      const store = useAuthStore()
      await store.initializeAuth()
      expect(store.loading).toBe(false)
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockFirebaseUser,
      } as any)
    })

    it('asigna user tras login exitoso', async () => {
      const store = useAuthStore()
      await store.login('user@test.com', 'Password@1')
      expect(store.user).toEqual(mockFirebaseUser)
    })

    it('loading queda en false tras login exitoso', async () => {
      const store = useAuthStore()
      await store.login('user@test.com', 'Password@1')
      expect(store.loading).toBe(false)
    })

    it('isAuthenticated retorna true tras login', async () => {
      const store = useAuthStore()
      await store.login('user@test.com', 'Password@1')
      expect(store.isAuthenticated).toBe(true)
    })

    it('guarda el error y lanza excepción si el login falla', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
        new Error('auth/user-not-found')
      )
      const store = useAuthStore()
      await expect(store.login('bad@test.com', 'wrong')).rejects.toThrow()
      expect(store.error).toContain('auth/user-not-found')
      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('limpia user tras logout', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
        user: mockFirebaseUser,
      } as any)
      const store = useAuthStore()
      await store.login('user@test.com', 'Password@1')
      await store.logout()
      expect(store.user).toBeNull()
    })

    it('isAuthenticated retorna false tras logout', async () => {
      const store = useAuthStore()
      store.user = mockFirebaseUser as any
      await store.logout()
      expect(store.isAuthenticated).toBe(false)
    })

    it('guarda error si logout falla', async () => {
      mockAuthService.logout.mockRejectedValueOnce(new Error('logout-error'))
      const store = useAuthStore()
      store.user = mockFirebaseUser as any
      await expect(store.logout()).rejects.toThrow()
      expect(store.error).toContain('logout-error')
    })
  })

  describe('handleGoogleLogin', () => {
    it('retorna success:false con reason cuando el popup es cerrado', async () => {
      mockAuthService.handleGoogleLogin.mockResolvedValueOnce({
        success: false,
        reason: 'popup-closed-by-user',
      })
      const store = useAuthStore()
      const result = await store.handleGoogleLogin()
      expect(result.success).toBe(false)
      expect(result.reason).toBe('popup-closed-by-user')
    })

    it('asigna user cuando Google login es exitoso', async () => {
      mockAuthService.handleGoogleLogin.mockResolvedValueOnce({
        success: true,
        user: mockFirebaseUser,
      })
      const store = useAuthStore()
      const result = await store.handleGoogleLogin()
      expect(result.success).toBe(true)
      expect(store.user).toEqual(mockFirebaseUser)
    })

    it('retorna success:false con general-error si lanza excepción', async () => {
      mockAuthService.handleGoogleLogin.mockRejectedValueOnce(new Error('popup-error'))
      const store = useAuthStore()
      const result = await store.handleGoogleLogin()
      expect(result.success).toBe(false)
      expect(result.reason).toBe('general-error')
    })

    it('loading queda en false tras Google login', async () => {
      mockAuthService.handleGoogleLogin.mockResolvedValueOnce({ success: false, reason: 'x' })
      const store = useAuthStore()
      await store.handleGoogleLogin()
      expect(store.loading).toBe(false)
    })
  })
})
