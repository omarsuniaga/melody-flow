// Dominio de Hermes Negotiator. Un archivo por dominio, siguiendo el patrón de src/types/event.ts.
// No reutiliza MusicEvent/EventFormData: la conversión final a un evento real
// pasa por eventStore (colección 'actividades'), no se duplica aquí.

export type DataConfidence = 'CONFIRMED' | 'INFERRED' | 'UNKNOWN'

export interface FieldValue<T> {
  value: T | null
  confidence: DataConfidence
}

export type SoundCondition =
  | 'SOUND_CLIENT'
  | 'SOUND_MUSICIAN'
  | 'SOUND_EXTERNAL_PROVIDER'
  | 'SOUND_NOT_REQUIRED'
  | 'SOUND_UNKNOWN'

export type EventCategory =
  | 'hotel'
  | 'restaurant'
  | 'wedding'
  | 'private'
  | 'corporate'
  | 'cultural'
  | 'brunch'
  | 'cocktail'
  | 'ceremony'
  | 'dinner'
  | 'concert'
  | 'recurring'
  | 'special_session'
  | 'other'

export type LeadSource =
  | 'whatsapp'
  | 'manual'
  | 'melody_flow'
  | 'instagram'
  | 'website'
  | 'referral'
  | 'email'
  | 'other'

export type NegotiationStage =
  | 'NEW_LEAD'
  | 'DISCOVERY'
  | 'QUALIFIED'
  | 'PRICING_READY'
  | 'QUOTE_SENT'
  | 'NEGOTIATING'
  | 'WAITING_CLIENT'
  | 'COUNTEROFFER'
  | 'AGREEMENT_PENDING'
  | 'APPROVAL_REQUIRED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'LOST'
  | 'FOLLOW_UP'
  | 'COMPLETED'

export type AutonomyLevel = 1 | 2 | 3 | 4 | 5

/** Distingue tiempo tocando de tiempo reservado (spec sección 9). */
export interface EventTiming {
  arrivalTime: string | null
  startTime: FieldValue<string>
  endTime: FieldValue<string>
  setsCount: FieldValue<number>
  setDurationMinutes: FieldValue<number>
  departureTime: string | null
  performanceMinutes: number | null
  reservedMinutes: number | null
  waitingMinutes: number | null
  setupMinutes: number | null
  travelMinutes: number | null
}

export interface EventDetails {
  eventType: FieldValue<EventCategory>
  date: FieldValue<string>
  venue: FieldValue<string>
  timing: EventTiming
  soundCondition: FieldValue<SoundCondition>
  specialRepertoireRequested: FieldValue<boolean>
  requestedSongs: string[]
  isRecurring: FieldValue<boolean>
  musicianCount: FieldValue<number>
}

export interface PricingBreakdown {
  baseRate: number
  performanceRate: number
  availabilityRate: number
  setupRate: number
  travelRate: number
  specialRepertoireRate: number
  equipmentRate: number
  urgencyRate: number
  holidayRate: number
  additionalSetRate: number
  waitingRate: number
}

export interface PricingResult {
  breakdown: PricingBreakdown
  recommendedPrice: number
  openingPrice: number
  targetPrice: number
  comfortablePrice: number
  floorPrice: number
  explanation: string[]
}

export interface NegotiationPolicy {
  id?: string
  name: string
  recurringRate: number
  oneTimeRate: number
  minimumRate: number
  extraHourRate: number
  extraSetRate: number
  waitingRate: number
  travelRate: number
  specialRepertoireRate: number
  soundEquipmentRate: number
  urgencyRate: number
  maxDiscountPercent: number
  negotiationMarginPercent: number
  absoluteFloorPrice: number
  autonomyLevel: AutonomyLevel
  createdAt: string
  updatedAt: string
  userId: string
}

export interface ConversationMessage {
  role: 'client' | 'musician' | 'system'
  text: string
  timestamp: string
  source: LeadSource
}

/** Salida estructurada validada del analizador (spec sección 33). Nunca confiar ciegamente en el LLM. */
export interface ConversationAnalysis {
  intent: 'request_quote' | 'follow_up' | 'confirmation' | 'counteroffer' | 'general' | 'unknown'
  stage: NegotiationStage
  event: EventDetails
  missingCriticalFields: string[]
  nextBestAction: string
  suggestedReply: string
  confidence: number
}

export interface Conversation {
  id?: string
  clientName: string
  source: LeadSource
  stage: NegotiationStage
  messages: ConversationMessage[]
  lastAnalysis?: ConversationAnalysis
  eventDetails?: EventDetails
  analyzedBy: 'ai' | 'rules'
  linkedEventId?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Quote {
  id?: string
  conversationId: string
  eventDetails: EventDetails
  pricing: PricingResult
  finalPrice?: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  textMessage: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type AuditAction =
  | 'AI_RECOMMENDATION'
  | 'QUOTE_CREATED'
  | 'QUOTE_CHANGED'
  | 'MESSAGE_SUGGESTED'
  | 'MESSAGE_SENT'
  | 'PRICE_CHANGED'
  | 'DISCOUNT_GRANTED'
  | 'USER_APPROVED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_DECLINED'
  | 'POLICY_CHANGED'

export interface AuditLogEntry {
  id?: string
  timestamp: string
  actor: 'hermes' | 'user' | 'system'
  action: AuditAction
  source: LeadSource | 'app'
  before: unknown
  after: unknown
  reason: string
  conversationId: string | null
  userId: string
}

export interface FeatureFlags {
  negotiatorEnabled: boolean
  aiEnabled: boolean
  whatsappEnabled: boolean
  autoReplyEnabled: boolean
  autoNegotiationEnabled: boolean
  autoFollowUpEnabled: boolean
}
