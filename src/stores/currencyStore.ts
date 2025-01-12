import { defineStore } from 'pinia'
import type { Currency, CurrencySettings } from '../types/currency'
import axios from 'axios'
import * as countryFlagIcons from 'country-flag-icons/unicode'

const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/'

// Mapeo de códigos de moneda a códigos de país ISO 3166-1 alpha-2
const currencyToCountryMap: Record<string, string> = {
  'USD': 'US',
  'EUR': 'EU',
  'DOP': 'DO',
  'GBP': 'GB',
  'CAD': 'CA',
  'JPY': 'JP',
  'CNY': 'CN',
  'MXN': 'MX',
  'BRL': 'BR',
  'ARS': 'AR',
  'COP': 'CO',
  'CLP': 'CL',
  'PEN': 'PE',
  // Añade más según necesites
}

// Objeto con emojis de banderas predeterminados
const defaultFlags: Record<string, string> = {
  'USD': '🇺🇸',
  'EUR': '🇪🇺',
  'DOP': '🇩🇴',
  'GBP': '🇬🇧',
  // Añade más según necesites
}

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    settings: {
      nativeCurrency: {
        code: 'DOP',
        symbol: 'RD$',
        flag: '🇩🇴',
        name: 'Peso dominicano',
        rate: 1,
        isNative: true
      },
      foreignCurrency: {
        code: 'USD',
        symbol: '$',
        flag: '🇺🇸',
        name: 'Dólar estadounidense',
        rate: 0.017, // 1 DOP = 0.017 USD
        isNative: false
      },
      exchangeRate: 58.82 // 1 USD = 58.82 DOP
    } as CurrencySettings,
    isLoading: false,
    lastUpdate: null as string | null
  }),

  actions: {
    updateCurrencySettings(settings: Partial<CurrencySettings>) {
      this.settings = { ...this.settings, ...settings }
    },

    convertToNative(amount: number, currencyCode: string): number {
      if (currencyCode === this.settings.nativeCurrency.code) {
        return amount
      }
      return amount * this.settings.exchangeRate
    },

    convertFromNative(amount: number, targetCurrency: string): number {
      if (targetCurrency === this.settings.nativeCurrency.code) {
        return amount
      }
      return amount / this.settings.exchangeRate
    },

    formatAmount(amount: number, currencyCode?: string): string {
      const currency = currencyCode === this.settings.foreignCurrency.code
        ? this.settings.foreignCurrency
        : this.settings.nativeCurrency

      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 2
      }).format(amount)
    },

    async updateExchangeRate() {
      this.isLoading = true
      try {
        const response = await axios.get(`${EXCHANGE_API_URL}${this.settings.foreignCurrency.code}`)
        const rate = response.data.rates[this.settings.nativeCurrency.code]
        if (rate) {
          this.settings.exchangeRate = rate
          this.lastUpdate = new Date().toISOString()
        }
      } catch (error) {
        console.error('Error actualizando tasa de cambio:', error)
        throw new Error('No se pudo actualizar la tasa de cambio')
      } finally {
        this.isLoading = false
      }
    },

    getFlagEmoji(currencyCode: string): string {
      try {
        // Primero intentar obtener del mapeo predeterminado
        if (defaultFlags[currencyCode]) {
          return defaultFlags[currencyCode]
        }

        // Luego intentar convertir el código de moneda a código de país
        const countryCode = this.getCurrencyCountry(currencyCode)

        // Obtener el emoji de la bandera usando el código del país
        return countryFlagIcons.default[countryCode] || '🏳️'
      } catch {
        return '🏳️' // Bandera neutral como fallback
      }
    },

    getCurrencyCountry(currency: string): string {
      return currencyToCountryMap[currency] || currency.slice(0, 2)
    }
  },

  getters: {
    formattedLastUpdate(): string {
      if (!this.lastUpdate) return 'Nunca actualizado'
      return new Date(this.lastUpdate).toLocaleString('es-DO')
    }
  },

  persist: true
})
