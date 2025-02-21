// DataExtractor.ts
import { TextPreprocessor } from './TextPreprocessor';
import type { ParsedEventData } from '../types/event';

export interface Amount {
  value: number | null;
}

export interface ImprovedParsedEventData extends Omit<ParsedEventData, 'amount'> {
  amount: Amount | null;
  error?: boolean;
  message?: string;
}

// Definición de expresiones regulares para la extracción
export const patterns = {
  // Modificamos el patrón provider para que no capture palabras de intervalo y añadimos un patrón específico para "con"
  provider: /(?:(?!viernes|sábado|dominio)[A-Za-zá-úÁ-Ú\s]+)/i, // se evitará palabras como "viernes"
  providerCon: /(?:con\s+)([A-Za-zá-úÁ-Ú\s]+)/i, // nuevo patrón para extraer proveedor tras "con"
  date: /(?:este|el|próximo|siguiente)?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|viernes|sábado|domingo|lunes|martes|miércoles|jueves|hoy|mañana|manana)/i,
  time: /(?:a las|desde las|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|h|hrs)?/i,
  // Actualizamos el patrón amount para que capture números de 3 dígitos o más
  amount: /(?:por|cobro|precio|costo|pago|pagan|son|pesos|dolares|)?\s*\$?\s*(\d{3,}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)(?:\s*(?:dolares|pesos|usd|\$|MXN|mxn))?/i,
  location: /(?:en|lugar|local|salón|hotel)\s+(?:el|la|los|las)?\s*([^,\.]+?)(?=\s*(?:,|\.|$|a las|\d|por\s*\$))/i,
  event_type: /(boda|matrimonio|fiesta|ceremonia|evento|celebración|cumpleaños|aniversario|lobby|piscina)/i,
  description: /(?:lobby|terraza|piscina|jardín|jardines|salón|sala)/i,
  areaKeywords: /(restaurant(?:e)?|lobby|hotel|terraza|piscina|jardín|jardines|salón|sala)/i,
  properName: /[A-Z][a-zá-úÁ-Ú]+(?:\s+[A-Z][a-zá-úÁ-Ú]+)*/,
};

// Lista de palabras excluidas (se puede ampliar)
export let excludedWords: string[] = [];

export class DataExtractor {
  // Se puede asignar un contexto (por ejemplo, de eventos previos)
  public static currentContext: ImprovedParsedEventData | null = null;

  public static extractDataWithRegex(text: string, scores: Float32Array, confidenceThresholds: any): ImprovedParsedEventData {
    // Priorizar la extracción con el patrón "con" para el proveedor
    const providerConMatch = text.match(patterns.providerCon);
    const providerExtracted = providerConMatch
      ? this.getValueBasedOnConfidence(providerConMatch[1], scores[0], confidenceThresholds.provider)
      : this.getValueBasedOnConfidence(text.match(patterns.provider)?.[0], scores[0], confidenceThresholds.provider);

    const dateMatch = text.toLowerCase().match(patterns.date);
    const timeMatch = text.toLowerCase().match(patterns.time);
    const amountMatch = text.toLowerCase().match(patterns.amount);
    const locationMatch = text.toLowerCase().match(patterns.location);
    const descriptionExtracted = this.getValueBasedOnConfidence(text.match(patterns.description)?.[0], scores[1], confidenceThresholds.description) || 'Evento';

    const data: ImprovedParsedEventData = {
      provider: providerExtracted,
      location: this.getValueBasedOnConfidence(locationMatch?.[1], scores[2], confidenceThresholds.location),
      date: this.getValueBasedOnConfidence(dateMatch ? this.processDate(dateMatch[1]) : null, scores[3], confidenceThresholds.date),
      time: this.getValueBasedOnConfidence(timeMatch ? this.processTime(timeMatch) : null, scores[4], confidenceThresholds.time),
      amount: this.processAmount(amountMatch, scores[5], confidenceThresholds.amount),
      description: descriptionExtracted,
    };

    return data;
  }

  public static processAmount(match: RegExpMatchArray | null, score: number, threshold: number): Amount | null {
    if (!match || score < threshold) {
      return null;
    }
    // Eliminar cualquier símbolo y dejar solo dígitos
    const numericStr = match[1].replace(/[^0-9]/g, '');
    const parsedValue = parseFloat(numericStr);
    return { value: !isNaN(parsedValue) ? parsedValue : null };
  }

  public static getValueBasedOnConfidence<T>(value: T | undefined, score: number, threshold: number): T | null {
    if (value === undefined || value === null) {
      return null;
    }
    return score >= threshold ? (typeof value === 'string' ? this.cleanText(value) : value) as T : null;
  }

  public static interpretRelativeDays(text: string, data: ImprovedParsedEventData): ImprovedParsedEventData {
    const tokens = text.toLowerCase().split(/\s+/);
    const today = new Date();
    if (tokens.includes('hoy')) {
      data.date = TextPreprocessor.formatDateISO(today);
    } else if (tokens.includes('mañana') || tokens.includes('manana')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      data.date = TextPreprocessor.formatDateISO(tomorrow);
    }
    return data;
  }

  public static processDate(dateStr: string): string {
    if (!dateStr) return '';
    const lower = dateStr.toLowerCase().trim();
    const today = new Date();
    // Retornar en formato ISO (YYYY-MM-DD) para input date
    if (lower === 'hoy') return today.toISOString().split('T')[0];
    if (lower === 'mañana' || lower === 'manana') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    // Para días de la semana, calcular el día más cercano
    const weekdays: Record<string, number> = { domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3, jueves: 4, viernes: 5, sábado: 6, sabado: 6 };
    if (weekdays.hasOwnProperty(lower)) {
      let daysToAdd = weekdays[lower] - today.getDay();
      if (daysToAdd < 0) daysToAdd += 7;
      const target = new Date(today);
      target.setDate(today.getDate() + daysToAdd);
      return target.toISOString().split('T')[0];
    }
    // Para fechas en formato numérico, se asume que ya vienen en formato ISO o convertible
    const parsedDate = new Date(dateStr);
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : '';
  }

  public static processTime(match: RegExpMatchArray | null): string | null {
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? match[2] : '00';
    const period = match[3] ? match[3].toLowerCase() : '';
    // Convertir a 24 horas
    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if ((period === 'am' || period === '') && hours === 12) {
      hours = 0;
    }
    // Retornar hora en formato HH:MM (24 hrs)
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  public static extractDescription(text: string, eventType: string): string {
    const descriptionMatch = text.match(patterns.description);
    if (descriptionMatch) {
      const fullMatch = descriptionMatch[0];
      const areaMatch = text.match(patterns.areaKeywords);
      const areaType = areaMatch ? areaMatch[0] : '';
      const afterArea = text.slice(text.indexOf(fullMatch) + areaType.length).trim();
      const properNameMatch = afterArea.match(patterns.properName);
      if (properNameMatch && !this.isExcludedName(properNameMatch[0])) {
        return this.cleanText(`${areaType} ${properNameMatch[0]}`);
      }
      return this.cleanText(areaType);
    }
    return eventType || 'Evento';
  }

  public static isExcludedName(name: string): boolean {
    const excluded = [
      ...excludedWords,
      'Hotel', 'Plaza', 'Centro', 'Events', 'Productions',
      'Principal', 'Central', 'Exterior', 'Interior',
    ];
    if (this.currentContext?.provider?.toLowerCase().includes(name.toLowerCase()) ||
        this.currentContext?.location?.toLowerCase().includes(name.toLowerCase())) {
      return true;
    }
    return excluded.some((word) => name.toLowerCase().includes(word.toLowerCase()));
  }

  public static fallbackAmount(originalText: string, data: ImprovedParsedEventData): ImprovedParsedEventData {
    if (data.amount && data.amount.value !== null ) {
      return data;
    }
    const tokens = originalText.split(/[\s,]+/).filter(Boolean);
    const usedTokens = [
      data.provider?.toLowerCase(),
      data.location?.toLowerCase(),
      data.date,
      data.time,
      data.description?.toLowerCase()
    ].filter(Boolean) as string[];
    const leftoverTokens = tokens.filter(tk => !usedTokens.includes(tk.toLowerCase()));
    for (const leftover of leftoverTokens) {
      const numericCandidate = leftover.replace(/\$/g, '');
      if (/^\d{4,}$/.test(numericCandidate)) {
        const value = parseInt(numericCandidate, 10);
        let currency: string | null = null;
        const currencyMatch = originalText.match(/(?:dolares|pesos|usd|\$|MXN|mxn)/i);
        if (currencyMatch) {
          currency = currencyMatch[0].toLowerCase();
        }
        return { ...data, amount: { value} };
      }
    }
    return data;
  }

  public static createErrorResponse(message: string): ImprovedParsedEventData {
    return {
      provider: null,
      description: null,
      location: null,
      date: null,
      time: null,
      amount: null,
      error: true,
      message,
    };
  }

  public static cleanText(text: string): string {
    return text.trim();
  }

  /**
   * Construye un diccionario (con Sets) para cada propiedad a partir de eventos históricos.
   * Se espera que 'events' sea un array de objetos con las propiedades: provider, description, location, date, time, amount.
   */
  public static buildPropertyDictionaries(events: any[]): {
    provider: Set<string>;
    description: Set<string>;
    location: Set<string>;
    date: Set<string>;
    time: Set<string>;
    amount: Set<string>;
  } {
    const dictionaries = {
      provider: new Set<string>(),
      description: new Set<string>(),
      location: new Set<string>(),
      date: new Set<string>(),
      time: new Set<string>(),
      amount: new Set<string>(),
    };
    events.forEach(event => {
      if (event.provider) dictionaries.provider.add(event.provider.toLowerCase());
      if (event.description) dictionaries.description.add(event.description.toLowerCase());
      if (event.location) dictionaries.location.add(event.location.toLowerCase());
      if (event.date) dictionaries.date.add(event.date);
      if (event.time) dictionaries.time.add(event.time);
      // Se almacena el monto como cadena para facilitar la búsqueda
      if (event.amount) dictionaries.amount.add(String(event.amount));
    });
    return dictionaries;
  }

  /**
   * Función de extracción que combina regex y búsqueda en diccionarios.
   * Se espera que 'dictionaries' sea obtenido del eventStore mediante buildPropertyDictionaries.
   */
  public static enhancedExtractData(text: string, scores: Float32Array, confidenceThresholds: any, dictionaries: {
      provider: Set<string>;
      description: Set<string>;
      location: Set<string>;
      date: Set<string>;
      time: Set<string>;
      amount: Set<string>;
    }): ImprovedParsedEventData {
    // Extraer usando regex (como se hace actualmente)
    const data = this.extractDataWithRegex(text, scores, confidenceThresholds);

    // Buscar coincidencias en diccionarios para refinar cada propiedad
    const lowerText = text.toLowerCase();
    // Para cada campo, si la extracción regex es nula o de baja confianza, buscar coincidencias en el diccionario
    if (!data.provider) {
      for (const candidate of dictionaries.provider) {
        if (lowerText.includes(candidate)) {
          data.provider = candidate;
          break;
        }
      }
    }
    if (!data.description) {
      for (const candidate of dictionaries.description) {
        if (lowerText.includes(candidate)) {
          data.description = candidate;
          break;
        }
      }
    }
    if (!data.location) {
      for (const candidate of dictionaries.location) {
        if (lowerText.includes(candidate)) {
          data.location = candidate;
          break;
        }
      }
    }
    // Se puede hacer algo similar para fecha, hora y monto si se requiere
    // ...
    return data;
  }

  /*
    Nota: La integración del entrenamiento en segundo plano se podría implementar
    agregando aquí o en TrainingManager un proceso que convierta el prompt y la extracción
    a tensores y, de forma asíncrona, guarde estos tensores en Firestore.
    Por ejemplo:
    - Convertir 'text' a tensor usando TextPreprocessor.textToTensor.
    - Guardar el tensor junto a los datos extraídos en Firestore.
    Esto facilitaría que otros dispositivos (sin localStorage o IndexedDB) puedan reentrenar el modelo.
  */

    
}
