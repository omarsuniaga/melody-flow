import type { FeatureFlags } from '../types/negotiation'

/**
 * Flags de Hermes Negotiator (spec sección 47). Todo lo autónomo está
 * apagado por defecto hasta validar el sandbox. `aiEnabled` en true usa la
 * Netlify Function que llama a Claude; si falla o está apagado, se usa el
 * analizador basado en reglas como respaldo.
 */
export const defaultFeatureFlags: FeatureFlags = {
  negotiatorEnabled: true,
  aiEnabled: true,
  whatsappEnabled: false,
  autoReplyEnabled: false,
  autoNegotiationEnabled: false,
  autoFollowUpEnabled: false
}
