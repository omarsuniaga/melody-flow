import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Quote } from '../types/negotiation'
import { runSandboxAnalysis, saveConversationAndQuote } from '../services/NegotiationService'

export const useNegotiationStore = defineStore('negotiation', () => {
  const currentConversation = ref<Conversation | null>(null)
  const currentQuote = ref<Quote | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSavedId = ref<string | null>(null)

  const analyze = async (clientName: string, rawText: string) => {
    loading.value = true
    error.value = null
    try {
      const result = await runSandboxAnalysis(clientName, rawText)
      currentConversation.value = result.conversation
      currentQuote.value = result.quote
    } catch (err) {
      error.value = 'No se pudo analizar la conversación'
      throw err
    } finally {
      loading.value = false
    }
  }

  const save = async () => {
    if (!currentConversation.value) return
    loading.value = true
    error.value = null
    try {
      const { conversationId } = await saveConversationAndQuote(
        currentConversation.value,
        currentQuote.value
      )
      lastSavedId.value = conversationId
    } catch (err) {
      error.value = 'No se pudo guardar la negociación'
      throw err
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    currentConversation.value = null
    currentQuote.value = null
    lastSavedId.value = null
    error.value = null
  }

  return { currentConversation, currentQuote, loading, error, lastSavedId, analyze, save, reset }
})
