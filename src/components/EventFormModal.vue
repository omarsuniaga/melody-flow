<template>
  <ModalComponent
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Nuevo Evento"
  >
    <!-- Botón de prueba API -->
    <div class="mb-4 flex justify-end">
      <ButtonComponent
        variant="secondary"
        size="sm"
        @click="testGeminiAPI"
        :disabled="isTestingAPI"
      >
        <template v-if="isTestingAPI">
          <span class="inline-block animate-spin mr-2">⌛</span>
          Probando API...
        </template>
        <template v-else>
          🔍 Probar API
        </template>
      </ButtonComponent>
    </div>

    <!-- Mostrar resultado de la prueba -->
    <div
      v-if="apiTestResult !== null"
      :class="[
        'mb-4 p-2 rounded text-sm',
        apiTestResult
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      ]"
    >
      {{ apiTestResult
        ? '✅ API funcionando correctamente'
        : '❌ Error al conectar con la API'
      }}
    </div>

    <!-- Formulario principal -->
    <form @submit.prevent="saveEvent" class="space-y-6">
      <!-- Tipo de Actividad -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Tipo de Actividad</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Fija"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Fija</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Eventual"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Eventual</span>
          </label>
        </div>
      </div>

      <!-- Estado de Pago -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Estado de Pago</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pagado"
              class="form-radio text-green-600"
            />
            <span class="ml-2">Pagado</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pendiente"
              class="form-radio text-yellow-600"
            />
            <span class="ml-2">Pendiente</span>
          </label>
        </div>
      </div>

      <!-- Campos del formulario -->
      <div class="space-y-4">
        <!-- Proveedor -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Proveedor</label>
          <input
            v-model="eventForm.provider"
            type="text"
            required
            @focus="fetchSuggestions('provider')"
            list="provider-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                   focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="provider-list">
            <option
              v-for="suggestion in providerSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Descripción</label>
          <input
            v-model="eventForm.description"
            type="text"
            required
            @focus="fetchSuggestions('description')"
            list="description-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                   focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="description-list">
            <option
              v-for="suggestion in descriptionSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Lugar -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Lugar</label>
          <input
            v-model="eventForm.location"
            type="text"
            required
            @focus="fetchSuggestions('location')"
            list="location-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                   focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="location-list">
            <option
              v-for="suggestion in locationSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Fecha y Hora -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              v-model="eventForm.date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-gray-300
                     shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Hora</label>
            <input
              v-model="eventForm.time"
              type="time"
              required
              class="mt-1 block w-full rounded-md border-gray-300
                     shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Monto</label>
          <input
            v-model.number="eventForm.amount"
            type="number"
            required
            class="mt-1 block w-full rounded-md border-gray-300
                   shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex justify-end gap-3">
        <ButtonComponent
          type="button"
          variant="secondary"
          @click="close"
        >
          Cancelar
        </ButtonComponent>
        <ButtonComponent
          type="submit"
          variant="primary"
        >
          Guardar
        </ButtonComponent>
        <!--
        <ButtonComponent variant="danger" @click="deleteEvent">
          Eliminar
        </ButtonComponent>
        -->
      </div>
    </form>
  </ModalComponent>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ModalComponent from './ModalComponent.vue'
import ButtonComponent from './ButtonComponent.vue'
import { useEventStore } from '../stores/eventStore'
import { useUserStore } from '../stores/userStore'
import { addWeeks, isSameMonth, getDay } from 'date-fns'
import { MessageParserService } from '../services/MessageParserService'
import EventFormModal from './EventFormModal.vue';
import { EventFormData } from '../types/event'

/**
 * Props
 */
const props = defineProps<{
  modelValue: boolean
  selectedDate?: Date
  sharedMessage?: string
}>()

/**
 * Emits
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

/**
 * Stores
 */
const eventStore = useEventStore()
const userStore = useUserStore()

/**
 * Formulario por defecto
 */
const defaultFormValues = {
  id: '',
  activityType: 'Eventual',
  paymentStatus: 'Pendiente' as const,
  provider: '',
  description: '',
  location: '',
  date: props.selectedDate
    ? props.selectedDate.toISOString().split('T')[0]
    : '',
  time: '19:00',
  amount: 6000,
  userId: userStore.currentUser?.uid || '',
  isFixed: false,
}

/**
 * Estado Reactivo del Form
 */
const eventForm = ref<EventFormData>({ ...defaultFormValues })

/**
 * Sugerencias (localStorage)
 */
const providerSuggestions = ref<string[]>([])
const descriptionSuggestions = ref<string[]>([])
const locationSuggestions = ref<string[]>([])

/**
 * Estado del Test de API
 */
const isTestingAPI = ref(false)
const apiTestResult = ref<boolean | null>(null)

/**
 * Watcher para el cambio de fecha seleccionada
 */
watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    eventForm.value.date = newDate.toISOString().split('T')[0]
  }
})

/**
 * Manejo de sugerencias desde localStorage
 */
function fetchSuggestions(field: string) {
  const suggestions = JSON.parse(localStorage.getItem(field) || '[]')
  if (field === 'provider') {
    providerSuggestions.value = suggestions
  } else if (field === 'description') {
    descriptionSuggestions.value = suggestions
  } else if (field === 'location') {
    locationSuggestions.value = suggestions
  }
}

function saveSuggestions(field: string, value: string) {
  const suggestions = JSON.parse(localStorage.getItem(field) || '[]')
  if (!suggestions.includes(value)) {
    suggestions.push(value)
    localStorage.setItem(field, JSON.stringify(suggestions))
  }
}

/**
 * Función para guardar el evento
 */
async function saveEvent() {
  try {
    await eventStore.addEvent(eventForm.value)
    saveSuggestions('provider', eventForm.value.provider)
    saveSuggestions('description', eventForm.value.description)
    saveSuggestions('location', eventForm.value.location)

    // Duplicar evento si es 'Fija'
    if (eventForm.value.activityType === 'Fija') {
      let nextDate = addWeeks(new Date(eventForm.value.date), 1)
      while (isSameMonth(nextDate, new Date(eventForm.value.date))) {
        await eventStore.addEvent({
          ...eventForm.value,
          date: nextDate.toISOString().split('T')[0],
        })
        nextDate = addWeeks(nextDate, 1)
      }
    }

    // Resetear el formulario
    eventForm.value = { ...defaultFormValues }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al guardar el evento:', error)
  }
}

/**
 * Eliminar evento (opcional, si decides habilitar el botón)
 */
async function deleteEvent() {
  try {
    const eventDate = new Date(eventForm.value.date)
    const dayOfWeek = getDay(eventDate)

    // Eliminar eventos fijos para el resto del mes
    if (eventForm.value.activityType === 'Fija') {
      const eventsToDelete = eventStore.events.filter(e =>
        e.provider === eventForm.value.provider &&
        e.description === eventForm.value.description &&
        e.location === eventForm.value.location &&
        e.time === eventForm.value.time &&
        e.amount === eventForm.value.amount &&
        getDay(new Date(e.date)) === dayOfWeek &&
        isSameMonth(new Date(e.date), eventDate)
      )
      for (const evt of eventsToDelete) {
        await eventStore.deleteEvent(evt.id)
      }
    } else if (eventForm.value.id) {
      await eventStore.deleteEvent(eventForm.value.id)
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al eliminar el evento:', error)
  }
}

/**
 * Editar evento (opcional, si tu lógica lo requiere)
 */
async function editEvent() {
  try {
    await eventStore.updateEvent(eventForm.value.id, eventForm.value)
    const eventDate = new Date(eventForm.value.date)
    const dayOfWeek = getDay(eventDate)

    // Editar eventos fijos para el resto del mes
    if (eventForm.value.activityType === 'Fija') {
      const eventsToEdit = eventStore.events.filter(e =>
        e.provider === eventForm.value.provider &&
        e.description === eventForm.value.description &&
        e.location === eventForm.value.location &&
        e.time === eventForm.value.time &&
        e.amount === eventForm.value.amount &&
        getDay(new Date(e.date)) === dayOfWeek &&
        isSameMonth(new Date(e.date), eventDate)
      )
      for (const evt of eventsToEdit) {
        await eventStore.updateEvent(evt.id, {
          ...evt,
          ...eventForm.value,
        })
      }
    } else if (eventForm.value.id) {
      await eventStore.updateEvent(eventForm.value.id, {
        ...eventForm.value,
      })
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al editar el evento:', error)
  }
}

/**
 * Cerrar el modal
 */
function close() {
  emit('update:modelValue', false)
}

/**
 * Procesar mensaje compartido
 */
async function processSharedMessage(message: string) {
  try {
    const parsedData = await MessageParserService.parseSharedMessage(message)

    // Actualizar el formulario con los datos extraídos
    if (parsedData.provider) eventForm.value.provider = parsedData.provider
    if (parsedData.description) eventForm.value.description = parsedData.description
    if (parsedData.location) eventForm.value.location = parsedData.location
    if (parsedData.date) eventForm.value.date = parsedData.date
    if (parsedData.time) eventForm.value.time = parsedData.time
    if (parsedData.amount) eventForm.value.amount = parsedData.amount
  } catch (error) {
    console.error('Error processing shared message:', error)
  }
}

/**
 * Watch para sharedMessage (si se provee)
 */
watch(() => props.sharedMessage, (newMessage) => {
  if (newMessage) {
    processSharedMessage(newMessage)
  }
})

/**
 * Test de API (Gemini)
 */
async function testGeminiAPI() {
  try {
    isTestingAPI.value = true
    console.log('Iniciando prueba de API...')
    const result = await MessageParserService.testConnection()
    console.log('Resultado de la prueba:', result)
    apiTestResult.value = result
  } catch (error) {
    console.error('Error al probar la API:', error)
    apiTestResult.value = false
  } finally {
    isTestingAPI.value = false
    setTimeout(() => {
      apiTestResult.value = null
    }, 3000)
  }
}
</script>
