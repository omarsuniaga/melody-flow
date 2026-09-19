import { collection, addDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import type { AuditAction, AuditLogEntry, LeadSource } from '../types/negotiation'

/**
 * Audit log de Hermes Negotiator (spec sección 31).
 * Colección Firestore: negotiation_audit (nueva, no colisiona con
 * actividades/nlp_training/locations, ya usadas por el resto de la app).
 * Nunca lanza si falla: un fallo de auditoría no bloquea la acción de
 * negocio, pero sí queda registrado como warning (spec 46).
 */
export async function logAuditEvent(entry: {
  action: AuditAction
  source: LeadSource | 'app'
  before: unknown
  after: unknown
  reason: string
  conversationId: string | null
}): Promise<void> {
  if (!auth.currentUser) return

  const record: Omit<AuditLogEntry, 'id'> = {
    timestamp: new Date().toISOString(),
    actor: entry.source === 'app' ? 'user' : 'hermes',
    action: entry.action,
    source: entry.source,
    before: entry.before,
    after: entry.after,
    reason: entry.reason,
    conversationId: entry.conversationId,
    userId: auth.currentUser.uid
  }

  try {
    await addDoc(collection(db, 'negotiation_audit'), record)
  } catch (err) {
    console.warn('[HermesAudit] No se pudo registrar el evento de auditoría', entry.action, err)
  }
}
