// TextPreprocessor.ts
import * as tf from '@tensorflow/tfjs';
import { ModelManager } from './ModelManager';

export class TextPreprocessor {
  // Lista de stop words (puedes ampliarla)
  private static readonly stopWords = new Set([
    'de', 'la', 'el', 'y', 'a', 'los', 'las', 'del', 'al', 'en', 'con', 'para', 'por', 'es', 'un', 'una', 'unos', 'unas'
  ]);

  /**
   * Tokeniza el texto eliminando caracteres especiales.
   */
  public static tokenizeText(text: string): string[] {
    const cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    return cleanedText.split(/\s+/).filter(Boolean);
  }

  /**
   * Normaliza el texto: remueve acentos, pasa a minúsculas y elimina stop words.
   */
  public static normalizeText(text: string): string {
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tokens = this.tokenizeText(normalized.toLowerCase());
    const filteredTokens = tokens.filter(token => !this.stopWords.has(token));
    return filteredTokens.join(' ');
  }

  /**
   * Convierte un texto a un tensor 2D de dimensión [1, SEQUENCE_LENGTH].
   */
  public static textToTensor(text: string): tf.Tensor2D {
    const normalizedText = this.normalizeText(text);
    const tokens = normalizedText.split(/\s+/);
    const sequence: number[] = tokens
      .map(token => ModelManager.vocabMap[token] || 0)
      .slice(0, ModelManager.SEQUENCE_LENGTH);
    while (sequence.length < ModelManager.SEQUENCE_LENGTH) {
      sequence.push(0);
    }
    return tf.tensor2d([sequence], [1, ModelManager.SEQUENCE_LENGTH]);
  }

  /**
   * Limpia el texto: remueve acentos, signos de puntuación y lo convierte a minúsculas.
   */
  public static cleanText(text: string): string {
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized
      .trim()
      .replace(/^[\s]*(el|la|los|las)[\s]+/i, '')
      .replace(/[“”‘’'".,!?;:()]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Formatea una fecha en formato dd-MM-yyyy.
   */
  public static formatDateDisplay(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  /**
   * Formatea una fecha en formato ISO.
   */
  public static formatDateISO(date: Date): string {
    return date.toISOString();
  }
}
