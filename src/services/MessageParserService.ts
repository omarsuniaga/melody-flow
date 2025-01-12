import axios from 'axios';
import { config } from '../config/config';

export interface ParsedEventData {
  provider?: string;
  description?: string;
  location?: string;
  date?: string;
  time?: string;
  amount?: number;
}

export class MessageParserService {
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  private static readonly GEMINI_API_KEY = config.GEMINI_API_KEY;

  static async parseSharedMessage(message: string): Promise<ParsedEventData> {
    try {
      const prompt = `
        Analiza el siguiente mensaje y extrae la información del evento en formato JSON:
        - provider: nombre del proveedor o persona
        - description: descripción del evento
        - location: ubicación
        - date: fecha en formato YYYY-MM-DD
        - time: hora en formato HH:mm
        - amount: monto numérico

        Mensaje: ${message}
      `;

      const response = await axios.post(
        `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // La respuesta de Gemini viene en formato de texto, necesitamos extraer el JSON
      const jsonMatch = response.data.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return this.normalizeResponse(parsedData);
      }

      return {};
    } catch (error) {
      console.error('Error parsing message with Gemini:', error);
      return {};
    }
  }

  private static normalizeResponse(aiResponse: any): ParsedEventData {
    return {
      provider: aiResponse.provider || undefined,
      description: aiResponse.description || undefined,
      location: aiResponse.location || undefined,
      date: aiResponse.date || undefined,
      time: aiResponse.time || undefined,
      amount: typeof aiResponse.amount === 'number' ? aiResponse.amount : undefined
    };
  }
}
