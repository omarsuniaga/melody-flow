import axios from 'axios'
import type { ConversationAnalysis, ConversationMessage } from '../types/negotiation'
import { analyzeConversationWithRules } from './ConversationAnalyzerService'
import { defaultFeatureFlags } from '../config/featureFlags'

const FUNCTION_URL = '/.netlify/functions/hermes-negotiate'

/**
 * Punto único de entrada para analizar una conversación. Intenta primero
 * la IA (Claude, vía Netlify Function con la key server-side) y si falla
 * o está desactivada (`aiEnabled=false`), cae al analizador de reglas.
 * El llamador nunca sabe cuál de los dos respondió más que por `analyzedBy`.
 */
export async function analyzeConversation(
  messages: ConversationMessage[]
): Promise<{ analysis: ConversationAnalysis; analyzedBy: 'ai' | 'rules' }> {
  const conversationText = messages.map((m) => m.text).join('\n')

  if (defaultFeatureFlags.aiEnabled) {
    try {
      const { data } = await axios.post<ConversationAnalysis>(
        FUNCTION_URL,
        { conversationText },
        { timeout: 20000 }
      )
      return { analysis: data, analyzedBy: 'ai' }
    } catch (err) {
      console.warn('[HermesAIService] Falló el análisis por IA, usando reglas como respaldo', err)
    }
  }

  return { analysis: analyzeConversationWithRules(messages), analyzedBy: 'rules' }
}
