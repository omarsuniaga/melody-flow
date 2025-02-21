// GeminiService.ts
import axios from 'axios';
import type { ParsedEventData } from '../types/event';
import { ModelStorageService } from './ModelStorageService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Genera una carta predeterminada basada en el proveedor y monto.
 * Se utiliza en caso de que no se cuente con la API key o se produzca un error.
 */
export const generateLetter = async (provider: string, amount: number): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      return `Estimado ${provider}, este documento detalla los eventos pendientes de pago por un monto total de $${amount}. Por favor, revise los detalles adjuntos.`;
    }

    const prompt = `"Escribe un párrafo breve, agradeciendo la oportunidad
de participar en estas actividades musicales, y confiando en mi talento
para ofrecer un trabajo excelente.
De antemano, agradece la gestión para el pago de las actividades y deja
abierta la invitación para participar en más actividades musicales donde pueda
incluirme. Evita elogios excesivos y términos que sobreedifiquen; mantén la redacción clara y concisa.

Por último, deséale que este año sea un año lleno de prosperidad y de trabajos mutuos.

---Ejemplo del modelo de la carta---
Adjunto un resumen de los eventos realizados durante el mes.
Gracias por incluirme regularmente en sus proyectos.
Espero que esta colaboración siga siendo productiva y fluida
en beneficio de ambas partes.

---Evita---
- Elogios excesivos
- "Estimados [nombre]"
- "[Nombre de la empresa]"
- "[Nombre de la persona]"
- "[Nombre del artista]"
- "[Nombre del proveedor]"
- "Estimado proveedor de eventos musicales,"
- "Estimados amigos de [nombre de la empresa]"`;

    const response = await axios.post(
      `${API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generando la carta:', error);
    return `Estimado ${provider}, este documento detalla los eventos pendientes de pago por un monto total de $${amount}. Por favor, revise los detalles adjuntos.`;
  }
};

/**
 * Procesa el texto del evento mediante la API Gemini y retorna los datos en formato JSON.
 */
export const processEventText = async (text: string): Promise<ParsedEventData> => {
  try {
    const prompt = `Analiza el siguiente texto y extrae la información del evento en formato JSON. 
Usa este formato específico:
{
  "provider": "nombre del proveedor o empresa o persona",
  "description": "breve descripción del evento, si es un lobby, una piscina, restaurant, o el elemento sobrante que no forma parte del resto de propiedades",
  "location": "lugar del evento, si es un hotel, un restaurante, un parque, una piscina, etc.",
  "date": "YYYY-MM-DD, revisa si en el texto aparece palabras como mañana, pasado mañana, hoy, o un dia de la semana en especifico, revisa la fecha actual y busca en la semana actual la fecha del dia que se especifica en el texto",
  "time": "busca en el texto HH:mm o en formato de 12 horas, revisa si en el texto aparece palabras pm o am ejemplo: 7pm y devuelve 19:00",
  "amount": número normalmente de 4 digitos, tambien revisa si el texto contiene montos por ejemplo 7mil que representan 7000, omite el tipo de moneda
}

Si algún campo no está presente, déjalo como null.

Texto a analizar: "${text}"

Responde SOLO con el JSON, sin explicaciones adicionales.`;

    const response = await axios.post(
      `${API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
    );

    let responseText = response.data.candidates[0].content.parts[0].text.trim();

    // Limpia la respuesta eliminando posibles bloques de código Markdown
    responseText = responseText.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/m, '$1');

    const parsed = JSON.parse(responseText);

    const parsedEvent: ParsedEventData = {
      provider: parsed.provider || null,
      description: parsed.description || null,
      location: parsed.location || null,
      date: parsed.date || null,
      time: parsed.time || null,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      error: false
    };

    // Guarda el ejemplo en Firestore para entrenamiento futuro
    await ModelStorageService.saveTrainingDataLocal([{
      originalText: text, // Texto original
      prediction: parsedEvent, // El JSON que generó Gemini
      correction: parsedEvent, // En este caso, la predicción se usa como ejemplo
      reward: 1 // Valor de recompensa (puede ajustarse)
    }]);

    return parsedEvent;
  } catch (error) {
    console.error('Error al procesar texto con GeminiService:', error);
    return {
      provider: '',
      description: '',
      location: '',
      date: null,
      time: null,
      amount: null,
      error: true,
      message: 'Error al procesar el texto con GeminiService'
    };
  }
};

/**
 * Genera un texto inspirador que contenga frases de algún compositor o artista,
 * con mensajes positivos que inviten a la superación y al éxito.
 */
export const generateInspirationalText = async (): Promise<string> => {
  try {
    if (!GEMINI_API_KEY) {
      return "El éxito es el resultado de la perseverancia y la dedicación. ¡Sigue adelante!";
    }

    const prompt = `Escribe un párrafo inspirador al estilo de un reconocido compositor o artista,
que contenga frases motivadoras sobre la superación personal y el éxito. El mensaje
debe ser positivo, claro y lleno de energía para invitar a la acción.`;

    const response = await axios.post(
      `${API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generando texto inspirador:', error);
    return "El éxito es el resultado de la perseverancia. ¡Nunca te rindas y sigue adelante!";
  }
};

export default { generateLetter, processEventText, generateInspirationalText };
