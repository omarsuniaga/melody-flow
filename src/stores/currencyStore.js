import { defineStore } from 'pinia';
import axios from 'axios';
import * as countryFlagIcons from 'country-flag-icons/unicode';
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/';
// Mapeo de códigos de moneda a códigos de país ISO 3166-1 alpha-2
const currencyToCountryMap = {
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
    "VEN": "VE",
    // Añade más según necesites
};
// Objeto con emojis de banderas predeterminados
const defaultFlags = {
    'USD': '🇺🇸',
    'EUR': '🇪🇺',
    'DOP': '🇩🇴',
    'GBP': '🇬🇧',
    // Añade más según necesites
};
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
        },
        isLoading: false,
        lastUpdate: null
    }),
    actions: {
        updateCurrencySettings(settings) {
            this.settings = { ...this.settings, ...settings };
        },
        convertToNative(amount, currencyCode) {
            if (currencyCode === this.settings.nativeCurrency.code) {
                return amount;
            }
            return amount * this.settings.exchangeRate;
        },
        convertFromNative(amount, targetCurrency) {
            if (targetCurrency === this.settings.nativeCurrency.code) {
                return amount;
            }
            return amount / this.settings.exchangeRate;
        },
        formatAmount(amount, currencyCode) {
            try {
                const currency = currencyCode === this.settings.foreignCurrency.code
                    ? this.settings.foreignCurrency
                    : this.settings.nativeCurrency;
                return new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: currency.code.toUpperCase(),
                    minimumFractionDigits: 2
                }).format(amount);
            }
            catch (error) {
                console.error('Error formateando cantidad:', error);
                return `${amount.toFixed(2)} ${currencyCode || this.settings.nativeCurrency.code}`;
            }
        },
        async updateExchangeRate() {
            this.isLoading = true;
            try {
                const response = await axios.get(`${EXCHANGE_API_URL}${this.settings.foreignCurrency.code}`);
                const rate = response.data.rates[this.settings.nativeCurrency.code];
                if (rate) {
                    this.settings.exchangeRate = rate;
                    this.lastUpdate = new Date().toISOString();
                }
            }
            catch (error) {
                console.error('Error actualizando tasa de cambio:', error);
                throw new Error('No se pudo actualizar la tasa de cambio');
            }
            finally {
                this.isLoading = false;
            }
        },
        getFlagEmoji(currencyCode) {
            try {
                // Primero intentar obtener del mapeo predeterminado
                if (defaultFlags[currencyCode]) {
                    return defaultFlags[currencyCode];
                }
                // Luego intentar convertir el código de moneda a código de país
                const countryCode = this.getCurrencyCountry(currencyCode);
                // Obtener el emoji de la bandera usando el código del país
                return countryFlagIcons.default[countryCode] || '🏳️';
            }
            catch {
                return '🏳️'; // Bandera neutral como fallback
            }
        },
        getCurrencyCountry(currency) {
            return currencyToCountryMap[currency] || currency.slice(0, 2);
        },
        shouldUpdateRate() {
            if (!this.lastUpdate)
                return true;
            const lastUpdateTime = new Date(this.lastUpdate).getTime();
            const now = new Date().getTime();
            const hoursSinceLastUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
            // Actualizar si han pasado más de 6 horas
            return hoursSinceLastUpdate > 6;
        },
        async initializeExchangeRates() {
            // Intentar cargar tasa guardada en localStorage
            const savedRate = localStorage.getItem('lastExchangeRate');
            const savedUpdate = localStorage.getItem('lastExchangeUpdate');
            if (savedRate && savedUpdate) {
                this.settings.exchangeRate = parseFloat(savedRate);
                this.lastUpdate = savedUpdate;
            }
            // Actualizar tasa si es necesario
            if (this.shouldUpdateRate()) {
                try {
                    await this.updateExchangeRate();
                }
                catch (error) {
                    console.warn('No se pudo actualizar la tasa de cambio inicial:', error);
                }
            }
        }
    },
    getters: {
        formattedLastUpdate() {
            if (!this.lastUpdate)
                return 'Nunca actualizado';
            return new Date(this.lastUpdate).toLocaleString('es-DO');
        }
    },
    // persist: true
});
