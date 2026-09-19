import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

/**
 * Proxy server-side para el "Conversation Analyzer" de Hermes Negotiator.
 * Reemplaza el patrón inseguro de geminiService.ts/mistralService.ts (API
 * key expuesta en el cliente vía VITE_*): aquí la key de Anthropic vive
 * SOLO en variables de entorno de Netlify (ANTHROPIC_API_KEY, configurada
 * en el panel de Netlify, nunca con prefijo VITE_) y nunca llega al bundle.
 *
 * Formato de función moderno de Netlify (.mts, Request/Response estándar),
 * sin necesitar @netlify/functions como dependencia.
 */

const FieldValueSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    value: inner.nullable(),
    confidence: z.enum(['CONFIRMED', 'INFERRED', 'UNKNOWN'])
  })

const EventDetailsSchema = z.object({
  eventType: FieldValueSchema(
    z.enum([
      'hotel', 'restaurant', 'wedding', 'private', 'corporate', 'cultural',
      'brunch', 'cocktail', 'ceremony', 'dinner', 'concert', 'recurring',
      'special_session', 'other'
    ])
  ),
  date: FieldValueSchema(z.string()),
  venue: FieldValueSchema(z.string()),
  timing: z.object({
    arrivalTime: z.string().nullable(),
    startTime: FieldValueSchema(z.string()),
    endTime: FieldValueSchema(z.string()),
    setsCount: FieldValueSchema(z.number()),
    setDurationMinutes: FieldValueSchema(z.number()),
    departureTime: z.string().nullable(),
    performanceMinutes: z.number().nullable(),
    reservedMinutes: z.number().nullable(),
    waitingMinutes: z.number().nullable(),
    setupMinutes: z.number().nullable(),
    travelMinutes: z.number().nullable()
  }),
  soundCondition: FieldValueSchema(
    z.enum(['SOUND_CLIENT', 'SOUND_MUSICIAN', 'SOUND_EXTERNAL_PROVIDER', 'SOUND_NOT_REQUIRED', 'SOUND_UNKNOWN'])
  ),
  specialRepertoireRequested: FieldValueSchema(z.boolean()),
  requestedSongs: z.array(z.string()),
  isRecurring: FieldValueSchema(z.boolean()),
  musicianCount: FieldValueSchema(z.number())
})

const ConversationAnalysisSchema = z.object({
  intent: z.enum(['request_quote', 'follow_up', 'confirmation', 'counteroffer', 'general', 'unknown']),
  stage: z.enum([
    'NEW_LEAD', 'DISCOVERY', 'QUALIFIED', 'PRICING_READY', 'QUOTE_SENT', 'NEGOTIATING',
    'WAITING_CLIENT', 'COUNTEROFFER', 'AGREEMENT_PENDING', 'APPROVAL_REQUIRED', 'CONFIRMED',
    'DECLINED', 'LOST', 'FOLLOW_UP', 'COMPLETED'
  ]),
  event: EventDetailsSchema,
  missingCriticalFields: z.array(z.string()),
  nextBestAction: z.string(),
  suggestedReply: z.string(),
  confidence: z.number().min(0).max(1)
})

const RequestSchema = z.object({
  conversationText: z.string().min(1).max(8000)
})

const SYSTEM_PROMPT = `Eres el motor de análisis de Hermes Negotiator, un asistente comercial para un violinista que toca en hoteles y eventos privados en República Dominicana.

Tu única tarea: leer el texto de una conversación (WhatsApp u otro medio) sobre una posible contratación musical, y devolver EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto adicional) que cumpla exactamente este esquema:

{
  "intent": "request_quote" | "follow_up" | "confirmation" | "counteroffer" | "general" | "unknown",
  "stage": "NEW_LEAD" | "DISCOVERY" | "QUALIFIED" | "PRICING_READY" | "QUOTE_SENT" | "NEGOTIATING" | "WAITING_CLIENT" | "COUNTEROFFER" | "AGREEMENT_PENDING" | "APPROVAL_REQUIRED" | "CONFIRMED" | "DECLINED" | "LOST" | "FOLLOW_UP" | "COMPLETED",
  "event": {
    "eventType": {"value": string|null, "confidence": "CONFIRMED"|"INFERRED"|"UNKNOWN"},
    "date": {"value": string|null (YYYY-MM-DD si es posible), "confidence": ...},
    "venue": {"value": string|null, "confidence": ...},
    "timing": {
      "arrivalTime": string|null, "startTime": {"value":string|null,"confidence":...},
      "endTime": {"value":string|null,"confidence":...}, "setsCount": {"value":number|null,"confidence":...},
      "setDurationMinutes": {"value":number|null,"confidence":...}, "departureTime": string|null,
      "performanceMinutes": number|null, "reservedMinutes": number|null, "waitingMinutes": number|null,
      "setupMinutes": number|null, "travelMinutes": number|null
    },
    "soundCondition": {"value": "SOUND_CLIENT"|"SOUND_MUSICIAN"|"SOUND_EXTERNAL_PROVIDER"|"SOUND_NOT_REQUIRED"|"SOUND_UNKNOWN"|null, "confidence": ...},
    "specialRepertoireRequested": {"value": boolean|null, "confidence": ...},
    "requestedSongs": string[],
    "isRecurring": {"value": boolean|null, "confidence": ...},
    "musicianCount": {"value": number|null, "confidence": ...}
  },
  "missingCriticalFields": string[],
  "nextBestAction": string,
  "suggestedReply": string,
  "confidence": number (0 a 1)
}

Reglas estrictas:
- Un dato es "CONFIRMED" solo si el cliente lo dijo explícitamente. Si lo dedujiste del contexto, es "INFERRED". Si no hay ninguna pista, es "UNKNOWN" con value null. NUNCA inventes un valor.
- Nunca decidas precios ni descuentos: eso lo calcula un motor separado, tú solo extraes datos e intención.
- "suggestedReply" debe ser UNA sola pregunta o frase breve y natural en español dominicano, como para WhatsApp (no un párrafo corporativo). Prioriza la pregunta con mayor valor de información (por ejemplo, si no se sabe si hay sonido, pregunta eso antes que otra cosa).
- "missingCriticalFields" debe listar los campos críticos que faltan para poder cotizar con confianza: por ejemplo "soundProvided", "date", "venue", "eventTiming".
- Devuelve SOLO el JSON, nada más.`

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el entorno de Netlify' }),
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido, se esperaba JSON' }), { status: 400 })
  }

  const parsedRequest = RequestSchema.safeParse(body)
  if (!parsedRequest.success) {
    return new Response(JSON.stringify({ error: 'conversationText requerido (1-8000 caracteres)' }), {
      status: 400
    })
  }

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: parsedRequest.data.conversationText }]
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return new Response(JSON.stringify({ error: 'Respuesta de IA sin contenido de texto' }), {
        status: 502
      })
    }

    let rawJson: unknown
    try {
      rawJson = JSON.parse(textBlock.text)
    } catch {
      return new Response(JSON.stringify({ error: 'La IA no devolvió JSON válido' }), { status: 502 })
    }

    const validated = ConversationAnalysisSchema.safeParse(rawJson)
    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: 'JSON de la IA no cumple el esquema esperado', details: validated.error.issues }),
        { status: 502 }
      )
    }

    return new Response(JSON.stringify(validated.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[hermes-negotiate] Error llamando a Claude:', err)
    return new Response(JSON.stringify({ error: 'Error interno analizando la conversación' }), {
      status: 500
    })
  }
}
