import { LocalNLPService } from './LocalNLPService';
import { MistralService } from './mistralService';
import type { ParsedEventData } from '../types/event';

export class MessageParserService {
  static async parseSharedMessage(message: string): Promise<ParsedEventData> {
    try {
      // Primero intentamos con Mistral
      const mistralResult = await MistralService.processEventText(message);
      
      if (!mistralResult.error) {
        console.log('Procesado exitosamente con Mistral:', mistralResult);
        return mistralResult;
      }

      // Si falla Mistral, usamos el procesamiento local
      console.log('Fallback a procesamiento local');
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

// Agregar export default si prefieres usar import default
export default MessageParserService;

// O simplemente usar export class si prefieres import nombrado
// export class MessageParserService {
//   ...existing code...
// }
