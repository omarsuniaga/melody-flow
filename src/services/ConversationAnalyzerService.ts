import type {
  ConversationAnalysis,
  ConversationMessage,
  EventDetails,
  FieldValue
} from '../types/negotiation'

/**
 * Analizador de conversaciones basado en reglas (regex), usado como
 * respaldo cuando la Netlify Function de IA (HermesAIService) falla o
 * `aiEnabled` está apagado. Mismo contrato de salida que la IA
 * (ConversationAnalysis), para que quien lo consuma no note la diferencia.
 *
 * Regla de oro (spec sección 34): todo dato no explícito en el texto queda
 * como UNKNOWN, nunca se convierte una inferencia en un hecho.
 */

function unknownField<T>(): FieldValue<T> {
  return { value: null, confidence: 'UNKNOWN' }
}

function confirmedField<T>(value: T): FieldValue<T> {
  return { value, confidence: 'CONFIRMED' }
}

function emptyEventDetails(): EventDetails {
  return {
    eventType: unknownField(),
    date: unknownField(),
    venue: unknownField(),
    timing: {
      arrivalTime: null,
      startTime: unknownField(),
      endTime: unknownField(),
      setsCount: unknownField(),
      setDurationMinutes: unknownField(),
      departureTime: null,
      performanceMinutes: null,
      reservedMinutes: null,
      waitingMinutes: null,
      setupMinutes: null,
      travelMinutes: null
    },
    soundCondition: unknownField(),
    specialRepertoireRequested: unknownField(),
    requestedSongs: [],
    isRecurring: unknownField(),
    musicianCount: unknownField()
  }
}

const EVENT_TYPE_KEYWORDS: Record<string, EventDetails['eventType']['value']> = {
  brunch: 'brunch',
  boda: 'wedding',
  wedding: 'wedding',
  ceremonia: 'ceremony',
  cena: 'dinner',
  coctel: 'cocktail',
  concierto: 'concert',
  hotel: 'hotel',
  restaurante: 'restaurant',
  corporativo: 'corporate',
  empresarial: 'corporate'
}

const TIME_RANGE_REGEX = /(\d{1,2})(?::(\d{2}))?\s*(?:a|-|hasta)\s*(\d{1,2})(?::(\d{2}))?/i

function toHHMM(hour: string, minute?: string): string {
  return `${hour.padStart(2, '0')}:${(minute ?? '00').padStart(2, '0')}`
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return mins
}

export function analyzeConversationWithRules(messages: ConversationMessage[]): ConversationAnalysis {
  const text = messages.map((m) => m.text).join('\n').toLowerCase()
  const event = emptyEventDetails()
  const missing: string[] = []

  for (const [keyword, type] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    if (text.includes(keyword) && type) {
      event.eventType = confirmedField(type)
      break
    }
  }

  const timeMatch = text.match(TIME_RANGE_REGEX)
  if (timeMatch) {
    const [, h1, m1, h2, m2] = timeMatch
    const start = toHHMM(h1, m1)
    const end = toHHMM(h2, m2)
    event.timing.startTime = confirmedField(start)
    event.timing.endTime = confirmedField(end)
    event.timing.reservedMinutes = minutesBetween(start, end)
  }

  const setsMatch = text.match(/(\d+)\s*(?:sets|intervenciones|bloques)/)
  if (setsMatch) {
    event.timing.setsCount = confirmedField(Number(setsMatch[1]))
  }

  if (/sin sonido|no (?:tiene|tienen|hay) sonido|no cuenta con sonido/.test(text)) {
    event.soundCondition = confirmedField('SOUND_MUSICIAN')
  } else if (/con sonido|tienen sonido|hay sonido|sonido incluido/.test(text)) {
    event.soundCondition = confirmedField('SOUND_CLIENT')
  }

  if (/repertorio especial|canciones específicas|canción especial/.test(text)) {
    event.specialRepertoireRequested = confirmedField(true)
  }

  if (/cada semana|mensual|recurrente|todos los (?:domingos|sábados|viernes)/.test(text)) {
    event.isRecurring = confirmedField(true)
  }

  if (event.timing.startTime.confidence === 'UNKNOWN' || event.timing.endTime.confidence === 'UNKNOWN') {
    missing.push('eventTiming')
  }
  if (event.soundCondition.confidence === 'UNKNOWN') missing.push('soundProvided')
  if (event.date.confidence === 'UNKNOWN') missing.push('date')
  if (event.venue.confidence === 'UNKNOWN') missing.push('venue')

  let nextBestAction = 'ask_more_info'
  let suggestedReply = '¿Me confirmas la fecha del evento?'
  if (missing.includes('soundProvided')) {
    nextBestAction = 'ask_sound'
    suggestedReply = '¿El lugar cuenta con sonido o necesitarían que lo lleve?'
  } else if (missing.includes('venue')) {
    nextBestAction = 'ask_venue'
    suggestedReply = '¿En qué lugar sería?'
  } else if (missing.includes('date')) {
    nextBestAction = 'ask_date'
    suggestedReply = '¿Qué fecha tienen en mente?'
  } else if (missing.length === 0) {
    nextBestAction = 'prepare_quote'
    suggestedReply = 'Dame un momento y te paso la propuesta.'
  }

  return {
    intent: /cuánto|cuanto|tarifa|precio|cotiz/i.test(text) ? 'request_quote' : 'general',
    stage: missing.length === 0 ? 'PRICING_READY' : 'DISCOVERY',
    event,
    missingCriticalFields: missing,
    nextBestAction,
    suggestedReply,
    confidence: missing.length === 0 ? 0.55 : 0.35
  }
}
