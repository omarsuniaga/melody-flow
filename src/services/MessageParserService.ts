//MessageParserService.ts
import { LocalNLPService } from './LocalNLPService';
import GeminiService from './geminiService'; // Importar GeminiService
import type { ParsedEventData } from '../types/event';

export class MessageParserService {
  static async parseSharedMessage(message: string): Promise<ParsedEventData> {
    try {
      // Primero se procesa con GeminiService
      console.log('Procesando con GeminiService');
      const geminiResult = await GeminiService.processEventText(message);
      // Si Gemini retorna información válida (sin error) la usamos
      if (geminiResult && !geminiResult.error && geminiResult.provider) {
        return {
          ...geminiResult,
          amount: typeof geminiResult.amount === 'object' && geminiResult.amount !== null
            ? (geminiResult.amount as { value: any }).value : geminiResult.amount
        };
      }
      // Si Gemini falló, se usa procesamiento local
      console.log('Fallback a procesamiento local');
      const localResult = await LocalNLPService.parseText(message);
      return {
        ...localResult,
        amount: typeof localResult.amount === 'object' && localResult.amount !== null
          ? localResult.amount.value : localResult.amount
      };
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      return {
        provider: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        amount: 0,
        error: true,
        message: 'Error al procesar el texto. Intente con un formato más claro.'
      };
    }
  }

  static async provideFeedback(message: string): Promise<ParsedEventData> {
    try {
      const result = await LocalNLPService.parseText(message);
      return {
        ...result,
        amount: typeof result.amount === 'object' && result.amount !== null ? result.amount.value : result.amount
      };
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      return {
        provider: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        amount: 0,
        error: true,
        message: 'Error al procesar el texto. Intente con un formato más claro.'
      };
    }
  }
}
