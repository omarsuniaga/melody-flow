import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import type { Conversation, ConversationMessage, Quote } from '../types/negotiation'
import { analyzeConversation } from './HermesAIService'
import { calculatePricing } from '../domain/pricing/PricingEngine'
import { fetchOrCreatePolicy } from './PolicyService'
import { logAuditEvent } from './AuditService'
import { canTransition } from '../domain/negotiation/NegotiationStateMachine'

const CONVERSATIONS = 'negotiation_conversations'
const QUOTES = 'negotiation_quotes'

export interface SandboxAnalysisResult {
  conversation: Conversation
  quote: Quote | null
}

/**
 * Ejecuta el análisis de una conversación pegada manualmente (Sandbox Mode,
 * spec sección 26): intenta IA (Claude) y cae a reglas si falla. Calcula
 * pricing solo si hay suficiente información CONFIRMED/INFERRED. No envía
 * ni persiste nada hasta que el usuario lo guarde explícitamente.
 */
export async function runSandboxAnalysis(
  clientName: string,
  rawText: string
): Promise<SandboxAnalysisResult> {
  if (!auth.currentUser) throw new Error('User not authenticated')

  const messages: ConversationMessage[] = [
    { role: 'client', text: rawText, timestamp: new Date().toISOString(), source: 'whatsapp' }
  ]

  const { analysis, analyzedBy } = await analyzeConversation(messages)
  const now = new Date().toISOString()

  const conversation: Conversation = {
    clientName,
    source: 'whatsapp',
    stage: analysis.stage,
    messages,
    lastAnalysis: analysis,
    eventDetails: analysis.event,
    analyzedBy,
    createdAt: now,
    updatedAt: now,
    userId: auth.currentUser.uid
  }

  await logAuditEvent({
    action: 'AI_RECOMMENDATION',
    source: 'whatsapp',
    before: null,
    after: { analysis, analyzedBy },
    reason: `Análisis de conversación en modo sandbox (${analyzedBy === 'ai' ? 'Claude' : 'reglas de respaldo'})`,
    conversationId: null
  })

  let quote: Quote | null = null
  if (analysis.missingCriticalFields.length === 0) {
    const policy = await fetchOrCreatePolicy()
    const pricing = calculatePricing(analysis.event, policy)
    quote = {
      conversationId: '',
      eventDetails: analysis.event,
      pricing,
      status: 'draft',
      textMessage: buildQuoteMessage(pricing.recommendedPrice, analysis.event),
      createdAt: now,
      updatedAt: now,
      userId: auth.currentUser.uid
    }
  }

  return { conversation, quote }
}

function buildQuoteMessage(price: number, event: Conversation['eventDetails']): string {
  const soundNote =
    event?.soundCondition.value === 'SOUND_CLIENT'
      ? 'el sonido sería proporcionado por la organización.'
      : event?.soundCondition.value === 'SOUND_MUSICIAN'
        ? 'incluye el equipo de sonido necesario.'
        : 'quedaría pendiente confirmar el tema del sonido.'

  return `Para ese formato mi tarifa sería de RD$${price.toLocaleString('es-DO')}. Incluye las intervenciones musicales acordadas; ${soundNote}`
}

/** Persiste una conversación analizada y, si existe, su cotización asociada. */
export async function saveConversationAndQuote(
  conversation: Conversation,
  quote: Quote | null
): Promise<{ conversationId: string; quoteId: string | null }> {
  const conversationRef = await addDoc(collection(db, CONVERSATIONS), conversation)

  await logAuditEvent({
    action: 'QUOTE_CREATED',
    source: conversation.source,
    before: null,
    after: conversation.lastAnalysis,
    reason: 'Conversación guardada desde sandbox',
    conversationId: conversationRef.id
  })

  let quoteId: string | null = null
  if (quote) {
    const quoteRef = await addDoc(collection(db, QUOTES), { ...quote, conversationId: conversationRef.id })
    quoteId = quoteRef.id
    await updateDoc(doc(db, CONVERSATIONS, conversationRef.id), {
      stage: canTransition(conversation.stage, 'QUOTE_SENT') ? 'QUOTE_SENT' : conversation.stage
    })
  }

  return { conversationId: conversationRef.id, quoteId }
}
