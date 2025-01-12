export interface Currency {
  code: string;      // Ejemplo: "USD", "DOP"
  symbol: string;    // Ejemplo: "$", "RD$"
  flag: string;      // Ejemplo: "🇺🇸", "🇩🇴"
  name: string;      // Ejemplo: "Dólar estadounidense", "Peso dominicano"
  rate: number;      // Tasa de cambio respecto a la moneda nativa
  isNative: boolean; // true para moneda local
}

export interface CurrencySettings {
  nativeCurrency: Currency;
  foreignCurrency: Currency;
  exchangeRate: number; // Cuántas unidades de moneda nativa equivalen a 1 unidad de moneda extranjera
}
