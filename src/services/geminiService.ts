import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

export const generateLetter = async (provider: string, amount: number): Promise<string> => {
  try {
    // Si no hay API key, devolver un mensaje predeterminado
    if (!GEMINI_API_KEY) {
      return `Estimado ${provider}, este documento detalla los eventos pendientes de pago por un monto total de $${amount}. Por favor, revise los detalles adjuntos.`;
    }

    const prompt = `"Escribe un párrafo breve, agradeciendo la oportunidad
    de participar en estas actividades musicales, y confiando en mi talento
    para ofrecer un trabajo excelente.
    de antemano agradece la gestion para el pago de las actividades y deja
    abierta la invitacion para participar en mas actividades musicales donde pueda
    incluirme, evita elogios excesivos, y palabras o terminos que sobre edifiquen a alguien o algo,
    mantén la redacción clara y concisa."

    por ultimo deseale que este año, sea un año lleno de prosperidad y  de trabajos mutuos

    ---Ejemplo del modelo de la carta---
    Adjunto un resumen de los eventos realizados durante el mes.
    Gracias por incluirme regularmente en sus proyectos.
    Espero que esta colaboración siga siendo productiva y fluida
    en beneficio de ambas partes.

    ---Evita---
    - Elogios excesivos
    - Estimados [nombre]
    - [Nombre de la empresa]
    - [Nombre de la persona]
    - [Nombre del artista]
    - [Nombre del proveedor]
    - Estimado proveedor de eventos musicales,
    - Estimados amigos de [nombre de la empresa],

      `;
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
    // Devolver un mensaje de respaldo en caso de error
    return `Estimado ${provider}, este documento detalla los eventos pendientes de pago por un monto total de $${amount}. Por favor, revise los detalles adjuntos.`;
  }
};
