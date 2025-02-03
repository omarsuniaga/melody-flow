import axios from 'axios';
import type { ParsedEventData } from '../types/event';

export class MistralService {
  private static readonly apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
  private static readonly API_URL = 'https://api.mistral.ai/v1/chat/completions';

  static async processEventText(text: string): Promise<ParsedEventData> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: "mistral-small-latest",
          temperature: 0.7, // Reducido para respuestas más precisas
          max_tokens: 500,
          stream: false,
          messages: [{
            role: "user",
            content: `Analiza el siguiente texto y extrae la información del evento en formato JSON. 
            Usa este formato específico:
            {
              "provider": "nombre del proveedor o empresa",
              "description": "breve descripción del evento",
              "location": "lugar del evento",
              "date": "YYYY-MM-DD",
              "time": "HH:mm",
              "amount": número (sin símbolos de moneda)
            }

            Si algún campo no está presente en el texto, déjalo como null.
            
            Texto a analizar: "${text}"
            
            Responde SOLO con el JSON, sin explicaciones adicionales.`
          }],
          response_format: {
            type: "text"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const jsonStr = response.data.choices[0].message.content.trim();
      const parsed = JSON.parse(jsonStr);

      return {
        provider: parsed.provider || null,
        description: parsed.description || null,
        location: parsed.location || null,
        date: parsed.date || null,
        time: parsed.time || null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        error: false
      };
    } catch (error) {
      console.error('Error al procesar texto con Mistral:', error);
      return {
        provider: '',
        description: '',
        location: '',
        date: null,
        time: null,
        amount: null,
        error: true,
        message: 'Error al procesar el texto con Mistral'
      };
    }
  }

  static async testConnection(): Promise<string> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: "mistral-small-latest",
          temperature: 0.7,
          stream: false,
          messages: [{ 
            role: "user", 
            content: "Hola, ¿estás funcionando?" 
          }],
          response_format: {
            type: "text"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error al conectar con Mistral:', error);
      throw new Error('No se pudo establecer conexión con Mistral API');
    }
  }
}
