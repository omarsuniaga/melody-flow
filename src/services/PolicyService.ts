import { collection, addDoc, query, where, getDocs, updateDoc, doc, limit } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import type { NegotiationPolicy } from '../types/negotiation'
import { logAuditEvent } from './AuditService'

const COLLECTION = 'negotiation_policies'

/** Política por defecto editable en Configuración > Negociación > Tarifas (spec sección 8). */
export function buildDefaultPolicy(userId: string): NegotiationPolicy {
  const now = new Date().toISOString()
  return {
    name: 'Política predeterminada',
    recurringRate: 7500,
    oneTimeRate: 15000,
    minimumRate: 12000,
    extraHourRate: 1500,
    extraSetRate: 1200,
    waitingRate: 800,
    travelRate: 1000,
    specialRepertoireRate: 1500,
    soundEquipmentRate: 3000,
    urgencyRate: 1000,
    maxDiscountPercent: 15,
    negotiationMarginPercent: 15,
    absoluteFloorPrice: 12000,
    autonomyLevel: 1,
    createdAt: now,
    updatedAt: now,
    userId
  }
}

export async function fetchOrCreatePolicy(): Promise<NegotiationPolicy> {
  if (!auth.currentUser) throw new Error('User not authenticated')
  const userId = auth.currentUser.uid

  const q = query(collection(db, COLLECTION), where('userId', '==', userId), limit(1))
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0]
    return { id: docSnap.id, ...docSnap.data() } as NegotiationPolicy
  }

  const defaultPolicy = buildDefaultPolicy(userId)
  const docRef = await addDoc(collection(db, COLLECTION), defaultPolicy)
  return { id: docRef.id, ...defaultPolicy }
}

export async function updatePolicy(
  policyId: string,
  before: NegotiationPolicy,
  changes: Partial<NegotiationPolicy>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, policyId), {
    ...changes,
    updatedAt: new Date().toISOString()
  })

  await logAuditEvent({
    action: 'POLICY_CHANGED',
    source: 'app',
    before,
    after: { ...before, ...changes },
    reason: 'Actualización manual de política de negociación',
    conversationId: null
  })
}
