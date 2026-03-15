import { describe, it, expect } from 'vitest'
import { validateEventForm, eventFormSchema } from '../../../src/validation/eventSchema'
import { validEventFormData } from '../../fixtures/events'

describe('eventSchema.ts', () => {
  describe('validateEventForm — casos válidos', () => {
    it('acepta un formulario completo y válido', () => {
      const result = validateEventForm(validEventFormData)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('acepta activityType "Fija"', () => {
      const result = validateEventForm({ ...validEventFormData, activityType: 'Fija' })
      expect(result.success).toBe(true)
    })

    it('acepta paymentStatus "Pagado"', () => {
      const result = validateEventForm({ ...validEventFormData, paymentStatus: 'Pagado' })
      expect(result.success).toBe(true)
    })

    it('acepta id opcional cuando está presente', () => {
      const result = validateEventForm({ ...validEventFormData, id: 'evt-001' })
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('evt-001')
    })

    it('acepta formulario sin id (campo opcional)', () => {
      const { ...data } = validEventFormData
      const result = validateEventForm(data)
      expect(result.success).toBe(true)
    })
  })

  describe('validateEventForm — campos obligatorios vacíos', () => {
    it('rechaza provider vacío', () => {
      const result = validateEventForm({ ...validEventFormData, provider: '' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('proveedor es obligatorio')
    })

    it('rechaza description vacía', () => {
      const result = validateEventForm({ ...validEventFormData, description: '' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('descripción es obligatoria')
    })

    it('rechaza location vacía', () => {
      const result = validateEventForm({ ...validEventFormData, location: '' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('ubicación es obligatoria')
    })

    it('rechaza userId vacío', () => {
      const result = validateEventForm({ ...validEventFormData, userId: '' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('ID de usuario requerido')
    })
  })

  describe('validateEventForm — formatos incorrectos', () => {
    it('rechaza fecha con formato incorrecto (dd/mm/yyyy)', () => {
      const result = validateEventForm({ ...validEventFormData, date: '15/04/2026' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('fecha inválido')
    })

    it('rechaza fecha sin guiones', () => {
      const result = validateEventForm({ ...validEventFormData, date: '20260415' })
      expect(result.success).toBe(false)
    })

    it('rechaza hora con formato incorrecto', () => {
      const result = validateEventForm({ ...validEventFormData, time: '8pm' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('hora inválido')
    })

    it('rechaza hora sin dos puntos', () => {
      const result = validateEventForm({ ...validEventFormData, time: '2000' })
      expect(result.success).toBe(false)
    })

    it('rechaza activityType inválido', () => {
      const result = validateEventForm({ ...validEventFormData, activityType: 'Freelance' })
      expect(result.success).toBe(false)
    })

    it('rechaza paymentStatus inválido', () => {
      const result = validateEventForm({ ...validEventFormData, paymentStatus: 'Cancelado' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateEventForm — validación de monto', () => {
    it('rechaza monto de cero', () => {
      const result = validateEventForm({ ...validEventFormData, amount: 0 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('mayor a cero')
    })

    it('rechaza monto negativo', () => {
      const result = validateEventForm({ ...validEventFormData, amount: -100 })
      expect(result.success).toBe(false)
    })

    it('acepta monto de 0.01', () => {
      const result = validateEventForm({ ...validEventFormData, amount: 0.01 })
      expect(result.success).toBe(true)
    })
  })

  describe('eventFormSchema.safeParse — múltiples errores', () => {
    it('reporta todos los errores juntos cuando hay varios campos inválidos', () => {
      const result = eventFormSchema.safeParse({
        activityType: 'Eventual',
        paymentStatus: 'Pendiente',
        provider: '',
        description: '',
        location: '',
        date: 'invalid',
        time: 'invalid',
        amount: -1,
        userId: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1)
      }
    })
  })
})
