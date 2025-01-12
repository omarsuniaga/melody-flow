<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
         :title="'Nuevo Evento'">
    <form @submit.prevent="saveEvent" class="space-y-6">
      <!-- Tipo de Actividad -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Tipo de Actividad</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input type="radio" v-model="eventForm.activityType" value="Fija"
                   class="form-radio text-blue-600" />
            <span class="ml-2">Fija</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="eventForm.activityType" value="Eventual"
                   class="form-radio text-blue-600" />
            <span class="ml-2">Eventual</span>
          </label>
        </div>
      </div>

      <!-- Estado de Pago -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Estado de Pago</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input type="radio" v-model="eventForm.paymentStatus" value="Pagado"
                   class="form-radio text-green-600" />
            <span class="ml-2">Pagado</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="eventForm.paymentStatus" value="Pendiente"
                   class="form-radio text-yellow-600" />
            <span class="ml-2">Pendiente</span>
          </label>
        </div>
      </div>

      <!-- Campos del formulario -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Proveedor</label>
          <input v-model="eventForm.provider" type="text" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 @focus="fetchSuggestions('provider')" list="provider-list" />
          <datalist id="provider-list">
            <option v-for="suggestion in providerSuggestions" :key="suggestion" :value="suggestion" />
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Descripción</label>
          <input v-model="eventForm.description" type="text" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 @focus="fetchSuggestions('description')" list="description-list" />
          <datalist id="description-list">
            <option v-for="suggestion in descriptionSuggestions" :key="suggestion" :value="suggestion" />
          </datalist>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Lugar</label>
          <input v-model="eventForm.location" type="text" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                 @focus="fetchSuggestions('location')" list="location-list" />
          <datalist id="location-list">
            <option v-for="suggestion in locationSuggestions" :key="suggestion" :value="suggestion" />
          </datalist>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha</label>
            <input v-model="eventForm.date" type="date" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Hora</label>
            <input v-model="eventForm.time" type="time" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Monto</label>
          <input v-model.number="eventForm.amount" type="number" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <Button variant="secondary" @click="close">Cancelar</Button>
        <Button type="submit" variant="primary" >Guardar</Button>
        <!-- <Button variant="danger" @click="deleteEvent">Eliminar</Button> -->
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'
import { useEventStore } from '../stores/eventStore'
import { useUserStore } from '../stores/userStore'
import type { EventFormData } from '../types/event'
import { addWeeks, isSameMonth, getDay } from 'date-fns'
import { MessageParserService } from '../services/MessageParserService'

const props = defineProps<{
  modelValue: boolean
  selectedDate?: Date
  sharedMessage?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const eventStore = useEventStore()
const userStore = useUserStore()

const eventForm = ref<EventFormData>({
  activityType: 'Eventual',
  paymentStatus: 'Pendiente',
  provider: '',
  description: '',
  location: '',
  date: props.selectedDate ? props.selectedDate.toISOString().split('T')[0] : '',
  time: '19:00',
  amount: 6000,
  userId: userStore.currentUser?.uid || '',
  isFixed: false,
}) // Eliminado el paréntesis extra

const providerSuggestions = ref<string[]>([])
const descriptionSuggestions = ref<string[]>([])
const locationSuggestions = ref<string[]>([])

watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    eventForm.value.date = newDate.toISOString().split('T')[0]
  }
})

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
  let suggestions = JSON.parse(localStorage.getItem(field) || '[]')
  if (!suggestions.includes(value)) {
    suggestions.push(value)
    localStorage.setItem(field, JSON.stringify(suggestions))
  }
}

async function saveEvent() {
  try {
    await eventStore.addEvent(eventForm.value)
    saveSuggestions('provider', eventForm.value.provider)
    saveSuggestions('description', eventForm.value.description)
    saveSuggestions('location', eventForm.value.location)

    // Duplicar el evento si es fijo
    if (eventForm.value.activityType === 'Fija') {
      let nextDate = addWeeks(new Date(eventForm.value.date), 1)
      while (isSameMonth(nextDate, new Date(eventForm.value.date))) {
        await eventStore.addEvent({
          ...eventForm.value,
          date: nextDate.toISOString().split('T')[0]
        })
        nextDate = addWeeks(nextDate, 1)
      }
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al guardar el evento:', error)
  }
}

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
      for (const event of eventsToDelete) {
        await eventStore.deleteEvent(event.id)
      }
    } else {
      await eventStore.deleteEvent(eventForm.value.id)
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al eliminar el evento:', error)
  }
}

async function editEvent() {
  try {
    await eventStore.updateEvent(eventForm.value)
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
      for (const event of eventsToEdit) {
        await eventStore.updateEvent({
          ...event,
          ...eventForm.value
        })
      }
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('Error al editar el evento:', error)
  }
}

function close() {
  emit('update:modelValue', false)
}

// Añadir esta función para procesar mensajes compartidos
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

// Observar cambios en el mensaje compartido
watch(() => props.sharedMessage, (newMessage) => {
  if (newMessage) {
    processSharedMessage(newMessage)
  }
})
</script>
