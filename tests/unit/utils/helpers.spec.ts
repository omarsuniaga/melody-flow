import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatNumber,
  formatTime,
} from '../../../src/utils/helpers'

describe('helpers.ts', () => {
  describe('formatCurrency', () => {
    it('formatea un número positivo como USD', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })

    it('formatea cero correctamente', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('formatea números decimales', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('formatea números negativos', () => {
      expect(formatCurrency(-500)).toBe('-$500.00')
    })

    it('formatea números grandes con separadores de miles', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatDate', () => {
    it('formatea una fecha ISO en formato en-US', () => {
      const result = formatDate('2026-04-15')
      expect(result).toMatch(/4\/15\/2026/)
    })

    it('formatea fechas de inicio de año', () => {
      const result = formatDate('2026-01-01')
      expect(result).toMatch(/1\/1\/2026/)
    })
  })

  describe('formatPercentage', () => {
    it('formatea 0.5 como 50.00%', () => {
      expect(formatPercentage(0.5)).toBe('50.00%')
    })

    it('formatea 1 como 100.00%', () => {
      expect(formatPercentage(1)).toBe('100.00%')
    })

    it('formatea 0 como 0.00%', () => {
      expect(formatPercentage(0)).toBe('0.00%')
    })

    it('formatea fracciones pequeñas', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%')
    })
  })

  describe('formatNumber', () => {
    it('formatea número con separadores de miles', () => {
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('formatea número sin decimales', () => {
      expect(formatNumber(1234)).toBe('1,234')
    })

    it('formatea cero', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatTime', () => {
    it('devuelve una cadena de tiempo con AM/PM', () => {
      const result = formatTime('2026-04-15T14:30:00')
      expect(result).toMatch(/2:30 PM/i)
    })

    it('formatea medianoche correctamente', () => {
      const result = formatTime('2026-04-15T00:00:00')
      expect(result).toMatch(/12:00 AM/i)
    })
  })
})
