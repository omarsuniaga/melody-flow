<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNegotiationStore } from '../../stores/negotiationStore'

const store = useNegotiationStore()
const clientName = ref('')
const rawText = ref('')

const analysis = computed(() => store.currentConversation?.lastAnalysis)
const analyzedBy = computed(() => store.currentConversation?.analyzedBy)
const quote = computed(() => store.currentQuote)

const confidenceLabel: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  INFERRED: 'Inferido',
  UNKNOWN: 'Desconocido'
}

const handleAnalyze = async () => {
  if (!rawText.value.trim()) return
  await store.analyze(clientName.value || 'Cliente sin nombre', rawText.value)
}

const handleSave = async () => {
  await store.save()
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 space-y-4">
    <h1 class="text-xl font-semibold">Hermes Negotiator — Sandbox</h1>
    <p class="text-sm text-gray-500">
      Pega una conversación para analizarla. Nada se envía; esto es solo simulación (spec 26).
    </p>

    <div class="space-y-2">
      <input
        v-model="clientName"
        type="text"
        placeholder="Nombre del cliente"
        class="w-full border rounded-lg p-3"
      />
      <textarea
        v-model="rawText"
        rows="6"
        placeholder="Pega aquí el mensaje del cliente..."
        class="w-full border rounded-lg p-3"
      />
      <button
        class="w-full bg-indigo-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        :disabled="store.loading"
        @click="handleAnalyze"
      >
        {{ store.loading ? 'Analizando...' : 'Analizar' }}
      </button>
    </div>

    <p v-if="store.error" class="text-red-600 text-sm">{{ store.error }}</p>

    <div v-if="analysis" class="border rounded-lg p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between items-center">
        <span class="font-medium">Etapa</span>
        <div class="flex items-center gap-2">
          <span v-if="analyzedBy" class="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
            {{ analyzedBy === 'ai' ? 'Claude' : 'Reglas (respaldo)' }}
          </span>
          <span class="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-sm">{{ analysis.stage }}</span>
        </div>
      </div>

      <div>
        <span class="font-medium block mb-1">Datos faltantes</span>
        <ul v-if="analysis.missingCriticalFields.length" class="text-sm text-amber-700 list-disc pl-5">
          <li v-for="field in analysis.missingCriticalFields" :key="field">{{ field }}</li>
        </ul>
        <p v-else class="text-sm text-green-700">Ninguno — listo para cotizar</p>
      </div>

      <div class="text-sm space-y-1">
        <p><b>Tipo de evento:</b> {{ analysis.event.eventType.value ?? '—' }} ({{ confidenceLabel[analysis.event.eventType.confidence] }})</p>
        <p><b>Horario:</b> {{ analysis.event.timing.startTime.value ?? '—' }} - {{ analysis.event.timing.endTime.value ?? '—' }}</p>
        <p><b>Sonido:</b> {{ analysis.event.soundCondition.value ?? '—' }} ({{ confidenceLabel[analysis.event.soundCondition.confidence] }})</p>
      </div>

      <div>
        <span class="font-medium block mb-1">Siguiente mejor acción</span>
        <p class="text-sm">{{ analysis.nextBestAction }}</p>
      </div>

      <div class="bg-white border rounded-lg p-3">
        <span class="font-medium block mb-1">Respuesta sugerida</span>
        <p class="text-sm italic">"{{ analysis.suggestedReply }}"</p>
      </div>
    </div>

    <div v-if="quote" class="border rounded-lg p-4 space-y-2 bg-indigo-50">
      <h2 class="font-medium">Precio recomendado</h2>
      <div class="grid grid-cols-3 gap-2 text-sm text-center">
        <div>
          <p class="text-gray-500">Opening</p>
          <p class="font-semibold">RD${{ quote.pricing.openingPrice.toLocaleString('es-DO') }}</p>
        </div>
        <div>
          <p class="text-gray-500">Target</p>
          <p class="font-semibold">RD${{ quote.pricing.targetPrice.toLocaleString('es-DO') }}</p>
        </div>
        <div>
          <p class="text-gray-500">Floor</p>
          <p class="font-semibold">RD${{ quote.pricing.floorPrice.toLocaleString('es-DO') }}</p>
        </div>
      </div>
      <div class="bg-white border rounded-lg p-3 text-sm">
        <p class="font-medium mb-1">Mensaje sugerido (WhatsApp)</p>
        <p>{{ quote.textMessage }}</p>
      </div>
      <button
        class="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        :disabled="store.loading"
        @click="handleSave"
      >
        Guardar negociación
      </button>
    </div>

    <p v-if="store.lastSavedId" class="text-sm text-green-700">
      Guardado. ID de conversación: {{ store.lastSavedId }}
    </p>
  </div>
</template>
