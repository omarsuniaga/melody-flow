import type { NegotiationStage } from '../../types/negotiation'

/** Transiciones válidas explícitas (spec sección 44). Evita condicionales dispersos. */
const TRANSITIONS: Record<NegotiationStage, NegotiationStage[]> = {
  NEW_LEAD: ['DISCOVERY', 'LOST'],
  DISCOVERY: ['QUALIFIED', 'DISCOVERY', 'LOST', 'FOLLOW_UP'],
  QUALIFIED: ['PRICING_READY', 'DISCOVERY', 'LOST'],
  PRICING_READY: ['QUOTE_SENT', 'LOST'],
  QUOTE_SENT: ['NEGOTIATING', 'WAITING_CLIENT', 'AGREEMENT_PENDING', 'DECLINED', 'FOLLOW_UP', 'LOST'],
  NEGOTIATING: ['COUNTEROFFER', 'AGREEMENT_PENDING', 'APPROVAL_REQUIRED', 'DECLINED', 'LOST'],
  WAITING_CLIENT: ['NEGOTIATING', 'QUOTE_SENT', 'FOLLOW_UP', 'LOST'],
  COUNTEROFFER: ['APPROVAL_REQUIRED', 'AGREEMENT_PENDING', 'NEGOTIATING', 'DECLINED', 'LOST'],
  AGREEMENT_PENDING: ['CONFIRMED', 'DECLINED', 'APPROVAL_REQUIRED'],
  APPROVAL_REQUIRED: ['AGREEMENT_PENDING', 'NEGOTIATING', 'DECLINED'],
  CONFIRMED: ['COMPLETED'],
  DECLINED: ['LOST'],
  LOST: [],
  FOLLOW_UP: ['DISCOVERY', 'NEGOTIATING', 'WAITING_CLIENT', 'LOST'],
  COMPLETED: []
}

export function canTransition(from: NegotiationStage, to: NegotiationStage): boolean {
  if (from === to) return true
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: NegotiationStage, to: NegotiationStage): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transición de negociación inválida: ${from} -> ${to}`)
  }
}
