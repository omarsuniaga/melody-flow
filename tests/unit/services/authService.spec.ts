import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthService } from '../../../src/services/authService'

// El mock de firebase/auth ya está en tests/setup.ts
// Aquí configuramos los retornos específicos por test

describe('authService.js', () => {
  describe('validateEmail', () => {
    it('acepta un email válido', () => {
      const { validateEmail } = useAuthService()
      expect(validateEmail('user@example.com')).toBe(true)
    })

    it('rechaza email sin @', () => {
      const { validateEmail } = useAuthService()
      expect(validateEmail('userexample.com')).toBe(false)
    })

    it('rechaza email sin dominio', () => {
      const { validateEmail } = useAuthService()
      expect(validateEmail('user@')).toBe(false)
    })

    it('rechaza cadena vacía', () => {
      const { validateEmail } = useAuthService()
      expect(validateEmail('')).toBe(false)
    })

    it('acepta email con subdominio', () => {
      const { validateEmail } = useAuthService()
      expect(validateEmail('user@mail.example.com')).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('acepta contraseña que cumple todos los criterios', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('Secure@123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rechaza contraseña de menos de 8 caracteres', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('Ab@1')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe tener al menos 8 caracteres')
    })

    it('rechaza contraseña sin mayúsculas', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('secure@123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Debe incluir al menos una mayúscula')
    })

    it('rechaza contraseña sin minúsculas', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('SECURE@123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Debe incluir al menos una minúscula')
    })

    it('rechaza contraseña sin números', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('Secure@abc')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Debe incluir al menos un número')
    })

    it('rechaza contraseña sin carácter especial', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('Secure1234')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Debe incluir al menos un carácter especial')
    })
  })

  describe('calculatePasswordStrength', () => {
    it('contraseña vacía tiene puntuación 0', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('')
      expect(result.strength.score).toBe(0)
    })

    it('contraseña corta y simple es Muy débil', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('abc')
      expect(result.strength.score).toBeLessThan(3)
    })

    it('contraseña fuerte tiene puntuación alta', () => {
      const { validatePassword } = useAuthService()
      const result = validatePassword('Secure@1234Extra')
      expect(result.strength.score).toBeGreaterThanOrEqual(5)
    })
  })

  describe('login', () => {
    it('llama a signInWithEmailAndPassword y retorna el usuario', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
        user: { uid: 'user-123', email: 'test@test.com' },
      } as any)

      const { login } = useAuthService()
      const user = await login('test@test.com', 'password123')
      expect(user.uid).toBe('user-123')
    })

    it('lanza error si las credenciales son inválidas', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
        new Error('auth/wrong-password')
      )

      const { login } = useAuthService()
      await expect(login('test@test.com', 'wrong')).rejects.toThrow('auth/wrong-password')
    })
  })
})
