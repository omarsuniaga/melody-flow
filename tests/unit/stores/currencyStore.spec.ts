import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCurrencyStore } from '../../../src/stores/currencyStore'
import axios from 'axios'

vi.mock('axios')

describe('currencyStore.ts', () => {
  describe('estado inicial', () => {
    it('moneda nativa es DOP', () => {
      const store = useCurrencyStore()
      expect(store.settings.nativeCurrency.code).toBe('DOP')
    })

    it('moneda extranjera es USD', () => {
      const store = useCurrencyStore()
      expect(store.settings.foreignCurrency.code).toBe('USD')
    })

    it('tasa de cambio inicial es 58.82', () => {
      const store = useCurrencyStore()
      expect(store.settings.exchangeRate).toBe(58.82)
    })

    it('isLoading es false', () => {
      const store = useCurrencyStore()
      expect(store.isLoading).toBe(false)
    })

    it('lastUpdate es null', () => {
      const store = useCurrencyStore()
      expect(store.lastUpdate).toBeNull()
    })
  })

  describe('convertToNative', () => {
    it('convierte USD a DOP multiplicando por la tasa', () => {
      const store = useCurrencyStore()
      const result = store.convertToNative(100, 'USD')
      expect(result).toBe(100 * 58.82)
    })

    it('retorna el mismo monto si la moneda ya es la nativa', () => {
      const store = useCurrencyStore()
      expect(store.convertToNative(100, 'DOP')).toBe(100)
    })
  })

  describe('convertFromNative', () => {
    it('convierte DOP a USD dividiendo por la tasa', () => {
      const store = useCurrencyStore()
      const result = store.convertFromNative(5882, 'USD')
      expect(result).toBeCloseTo(5882 / 58.82, 4)
    })

    it('retorna el mismo monto si el destino es la moneda nativa', () => {
      const store = useCurrencyStore()
      expect(store.convertFromNative(100, 'DOP')).toBe(100)
    })
  })

  describe('convertToNative / convertFromNative — consistencia', () => {
    it('convertir y reconvertir retorna el monto original', () => {
      const store = useCurrencyStore()
      const original = 1000
      const converted = store.convertFromNative(original, 'USD')
      const back = store.convertToNative(converted, 'USD')
      expect(back).toBeCloseTo(original, 4)
    })
  })

  describe('formatAmount', () => {
    it('formatea sin currencyCode usando la moneda nativa', () => {
      const store = useCurrencyStore()
      const result = store.formatAmount(1000)
      expect(result).toContain('1')
      expect(typeof result).toBe('string')
    })

    it('formatea con currencyCode USD usando la moneda extranjera', () => {
      const store = useCurrencyStore()
      const result = store.formatAmount(100, 'USD')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getCurrencyCountry', () => {
    it('retorna código de país correcto para USD', () => {
      const store = useCurrencyStore()
      expect(store.getCurrencyCountry('USD')).toBe('US')
    })

    it('retorna código de país correcto para DOP', () => {
      const store = useCurrencyStore()
      expect(store.getCurrencyCountry('DOP')).toBe('DO')
    })

    it('retorna los dos primeros caracteres si la moneda no está en el mapa', () => {
      const store = useCurrencyStore()
      expect(store.getCurrencyCountry('XYZ')).toBe('XY')
    })
  })

  describe('getFlagEmoji', () => {
    it('retorna emoji de bandera para USD', () => {
      const store = useCurrencyStore()
      expect(store.getFlagEmoji('USD')).toBe('🇺🇸')
    })

    it('retorna emoji de bandera para DOP', () => {
      const store = useCurrencyStore()
      expect(store.getFlagEmoji('DOP')).toBe('🇩🇴')
    })

    it('retorna bandera neutral para código desconocido', () => {
      const store = useCurrencyStore()
      const flag = store.getFlagEmoji('XXX')
      expect(typeof flag).toBe('string')
      expect(flag.length).toBeGreaterThan(0)
    })
  })

  describe('shouldUpdateRate', () => {
    it('retorna true si lastUpdate es null', () => {
      const store = useCurrencyStore()
      expect(store.shouldUpdateRate()).toBe(true)
    })

    it('retorna false si la última actualización fue hace menos de 6 horas', () => {
      const store = useCurrencyStore()
      store.lastUpdate = new Date().toISOString()
      expect(store.shouldUpdateRate()).toBe(false)
    })

    it('retorna true si la última actualización fue hace más de 6 horas', () => {
      const store = useCurrencyStore()
      const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
      store.lastUpdate = sevenHoursAgo
      expect(store.shouldUpdateRate()).toBe(true)
    })
  })

  describe('updateExchangeRate', () => {
    it('actualiza exchangeRate con el valor de la API', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { rates: { DOP: 60.5 } },
      })

      const store = useCurrencyStore()
      await store.updateExchangeRate()

      expect(store.settings.exchangeRate).toBe(60.5)
      expect(store.lastUpdate).not.toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('lanza error y no modifica la tasa si la API falla', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'))

      const store = useCurrencyStore()
      const originalRate = store.settings.exchangeRate

      await expect(store.updateExchangeRate()).rejects.toThrow('No se pudo actualizar')
      expect(store.settings.exchangeRate).toBe(originalRate)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('initializeExchangeRates', () => {
    it('carga tasa guardada desde localStorage', async () => {
      localStorage.setItem('lastExchangeRate', '62.0')
      localStorage.setItem('lastExchangeUpdate', new Date().toISOString())

      const store = useCurrencyStore()
      await store.initializeExchangeRates()

      expect(store.settings.exchangeRate).toBe(62.0)
    })

    it('no llama a la API si la tasa está actualizada', async () => {
      localStorage.setItem('lastExchangeRate', '62.0')
      localStorage.setItem('lastExchangeUpdate', new Date().toISOString())

      const store = useCurrencyStore()
      await store.initializeExchangeRates()

      expect(axios.get).not.toHaveBeenCalled()
    })
  })

  describe('formattedLastUpdate (getter)', () => {
    it('retorna "Nunca actualizado" si lastUpdate es null', () => {
      const store = useCurrencyStore()
      expect(store.formattedLastUpdate).toBe('Nunca actualizado')
    })

    it('retorna una cadena de fecha si lastUpdate tiene valor', () => {
      const store = useCurrencyStore()
      store.lastUpdate = new Date('2026-03-15T10:00:00.000Z').toISOString()
      expect(typeof store.formattedLastUpdate).toBe('string')
      expect(store.formattedLastUpdate).not.toBe('Nunca actualizado')
    })
  })
})
