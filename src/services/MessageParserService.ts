import { LocalNLPService } from './LocalNLPService';
import type { ParsedEventData } from '../types/event';

export class MessageParserService {
  static async parseSharedMessage(message: string): Promise<ParsedEventData> {
    try {
      console.log('Procesando mensaje:', message); // Debug
      const result = await LocalNLPService.parseText(message);
      console.log('Resultado del análisis:', result); // Debug
      return result;
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
      return await LocalNLPService.parseText(message);
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

  static async parseMessage(message: string): Promise<ParsedEventData> {
    try {
      return await LocalNLPService.parseText(message);
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

  static async parseMessageWithFeedback(message: string): Promise<ParsedEventData> {
    try {
      return await LocalNLPService.parseText(message);
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
