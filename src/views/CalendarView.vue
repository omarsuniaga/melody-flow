<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <!-- Calendar Header -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
            {{ format(currentDate, 'MMMM yyyy') }}
          </h2>
          <div class="flex gap-2">
            <Button variant="secondary" class="p-1 sm:p-2" @click="previousMonth">
              <ChevronLeftIcon class="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="secondary" class="text-sm sm:text-base px-2 sm:px-4" @click="currentDate = new Date()">
              Today
            </Button>
            <Button variant="secondary" class="p-1 sm:p-2" @click="nextMonth">
              <ChevronRightIcon class="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1">
          <!-- Day Headers -->
          <div v-for="day in weekDays"
               :key="day"
               class="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-gray-600">
            {{ isMobile ? day.charAt(0) : day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="date in calendarDays"
            :key="date.toISOString()"
            :class="[
              'p-1 sm:p-2 min-h-[60px] sm:min-h-[100px] border rounded-md relative',
              isToday(date) ? 'border-blue-500' : 'border-gray-200',
              getDateEvents(date).length > 0 ? getDayColorClass(date) : '',
              'cursor-pointer hover:border-blue-300'
            ]"
            @click="selectDate(date)"
          >
            <div class="flex justify-between items-start">
              <span :class="[
                'text-xs sm:text-sm font-medium',
                !isSameMonth(date, currentDate) ? 'text-gray-400' : 'text-gray-700'
              ]">
                {{ format(date, 'd') }}
              </span>
              <!-- Badge de eventos mejorado -->
              <div v-if="getDateEvents(date).length > 0"
                class="flex items-center justify-center min-w-[1.25rem] sm:min-w-[1.5rem] h-5 sm:h-6 px-1 sm:px-1.5 text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm">
                {{ getDateEvents(date).length }}
              </div>
            </div>
            <!-- Vista previa de eventos -->
            <div class="mt-1 space-y-1">
              <div v-for="(event, index) in getDateEvents(date).slice(0, isMobile ? 1 : 2)"
                   :key="index"
                   class="text-[10px] sm:text-xs truncate p-0.5 sm:p-1 rounded"
                   :class="event.paymentStatus === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                {{ event.provider }}
              </div>
              <div v-if="getDateEvents(date).length > (isMobile ? 1 : 2)"
                   class="text-[10px] sm:text-xs text-gray-500 pl-1">
                +{{ getDateEvents(date).length - (isMobile ? 1 : 2) }} más
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales responsivos -->
    <Modal v-if="selectedDateEvents.length > 0"
           v-model="isEventListModalOpen"
           :title="format(selectedDate, 'MMMM d, yyyy')"
           class="w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Eventos del día</h3>
        <Button variant="primary" @click="openNewEventForm">
          <PlusIcon class="h-5 w-5 mr-1" />
          Nuevo Evento
        </Button>
      </div>
      <div class="mt-4 space-y-4">
        <div v-for="event in selectedDateEvents" :key="event.id"
          class="p-4 rounded-lg border"
          :class="{
            'bg-green-50': event.paymentStatus === 'Pagado',
            'bg-yellow-50': event.paymentStatus === 'Pendiente'
          }"
        >
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <h4 class="font-medium text-lg">{{ event.provider }}</h4>
              <p class="text-sm text-gray-600">{{ event.description }}</p>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon class="h-4 w-4" />
                {{ event.location }}
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon class="h-4 w-4" />
                {{ event.time }}
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="togglePaymentStatus(event)"
                class="p-2 rounded-full hover:bg-gray-100 transition-colors"
                :title="event.paymentStatus === 'Pagado' ? 'Marcar como Pendiente' : 'Marcar como Pagado'"
              >
                <CheckCircleIcon
                  v-if="event.paymentStatus === 'Pendiente'"
                  class="h-6 w-6 text-green-600"
                />
                <ClockIcon
                  v-else
                  class="h-6 w-6 text-red-600"
                />
              </button>
              <Button variant="secondary" @click="viewEvent(event)">
                <EyeIcon class="h-4 w-4" />
              </Button>
              <Button variant="secondary" @click="editEvent(event)">
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button variant="danger" @click="confirmDelete(event)">
                <TrashIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Formulario de nuevo evento -->
    <EventFormModal
      v-model="isEventFormOpen"
      :selected-date="selectedDate"
      :shared-message="sharedMessage"
      @saved="handleEventSaved"
    />

    <!-- Event View Modal -->
    <EventViewModal
      v-if="selectedEvent"
      v-model="isViewModalOpen"
      :event="selectedEvent"
      @edit="handleEditEvent"
    />

    <!-- Event Edit Modal -->
    <EventEditModal
      v-if="selectedEvent"
      v-model="isEditModalOpen"
      :event="selectedEvent"
      @saved="handleEventSaved"
    />

    <!-- Delete Confirmation Modal -->
    <Modal v-model="isDeleteModalOpen" title="Delete Event">
      <p>Are you sure you want to delete this event? This action cannot be undone.</p>
      <template #footer>
        <Button variant="secondary" @click="closeDeleteModal">
          Cancel
        </Button>
        <Button variant="danger" @click="deleteEvent">
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addWeeks, getDay } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import { useEventStore } from '../stores/eventStore'
import type { MusicEvent } from '../types/event'
import Modal from '../components/Modal.vue'
import Button from '../components/Button.vue'
import EventFormModal from '../components/EventFormModal.vue'
import EventViewModal from '../components/EventViewModal.vue'
import EventEditModal from '../components/EventEditModal.vue'

const eventStore = useEventStore()
const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const isEventListModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const eventToDelete = ref<MusicEvent | null>(null)
const isEventFormOpen = ref(false)
const isViewModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedEvent = ref<MusicEvent | null>(null)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value))
  const end = endOfWeek(endOfMonth(currentDate.value))
  return eachDayOfInterval({ start, end })
})

const selectedDateEvents = computed(() => {
  return eventStore.getEventsByDate(format(selectedDate.value, 'yyyy-MM-dd'))
})

onMounted(() => {
  eventStore.fetchEvents()
})

// Añadir detección de dispositivo móvil
const isMobile = ref(window.innerWidth < 640)

// Actualizar el estado de isMobile cuando cambie el tamaño de la ventana
onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 640
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    isMobile.value = window.innerWidth < 640
  })
})

function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1)
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1)
}

function getDateEvents(date: Date) {
  const events = eventStore.getEventsByDate(format(date, 'yyyy-MM-dd'))
  const fixedEvents = events.filter(event => event.isFixed)
  const nonFixedEvents = events.filter(event => !event.isFixed)

  // Duplicar eventos fijos para las próximas semanas del mes
  fixedEvents.forEach(event => {
    let nextDate = addWeeks(date, 1)
    while (isSameMonth(nextDate, date)) {
      nonFixedEvents.push({ ...event, date: format(nextDate, 'yyyy-MM-dd') })
      nextDate = addWeeks(nextDate, 1)
    }
  })

  return nonFixedEvents
}

function getDayColorClass(date: Date) {
  const events = getDateEvents(date)
  if (events.length === 0) return ''

  const hasPaid = events.some(e => e.paymentStatus === 'Pagado')
  const hasPending = events.some(e => e.paymentStatus === 'Pendiente')

  if (hasPaid && hasPending) return 'bg-event-mixed'
  if (hasPaid) return 'bg-event-paid'
  return 'bg-event-pending'
}

function selectDate(date: Date) {
  selectedDate.value = date
  const events = getDateEvents(date)
  if (events.length > 0) {
    isEventListModalOpen.value = true
  } else {
    isEventFormOpen.value = true
  }
}

function openNewEventForm() {
  isEventListModalOpen.value = false // Cerrar el modal de listado
  isEventFormOpen.value = true // Abrir el formulario de nuevo evento
}

function viewEvent(event: MusicEvent) {
  selectedEvent.value = event
  isViewModalOpen.value = true
}

function handleEditEvent() {
  isViewModalOpen.value = false
  isEditModalOpen.value = true
}

function editEvent(event: MusicEvent) {
  selectedEvent.value = event
  isEditModalOpen.value = true
}

function confirmDelete(event: MusicEvent) {
  eventToDelete.value = event
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  eventToDelete.value = null
}

async function deleteEvent() {
  if (eventToDelete.value?.id) {
    const eventDate = new Date(eventToDelete.value.date)
    const dayOfWeek = getDay(eventDate)

    // Eliminar eventos fijos para el resto del mes
    if (eventToDelete.value.isFixed) {
      const eventsToDelete = eventStore.events.filter(e =>
        e.provider === eventToDelete.value.provider &&
        e.description === eventToDelete.value.description &&
        e.location === eventToDelete.value.location &&
        e.time === eventToDelete.value.time &&
        e.amount === eventToDelete.value.amount &&
        getDay(new Date(e.date)) === dayOfWeek &&
        isSameMonth(new Date(e.date), eventDate)
      )
      for (const event of eventsToDelete) {
        if (event.id) {
          await eventStore.deleteEvent(event.id)
        }
      }
    } else {
      await eventStore.deleteEvent(eventToDelete.value.id)
    }

    closeDeleteModal()
  }
}

async function togglePaymentStatus(event: MusicEvent) {
  if (event.id) {
    try {
      await eventStore.togglePaymentStatus(event.id)
    } catch (error) {
      console.error('Error al actualizar el estado de pago:', error)
    }
  }
}

function handleEventSaved() {
  isEventFormOpen.value = false
  isEventListModalOpen.value = true // Volver a mostrar el listado después de guardar
  isEditModalOpen.value = false
  selectedEvent.value = null
  eventStore.fetchEvents()
}

const sharedMessage = ref<string | undefined>(undefined)

// Función para manejar mensajes compartidos
async function handleSharedMessage() {
  try {
    if ('share' in navigator && 'shareTarget' in navigator) {
      const shareData = await (navigator as any).shareTarget.receive()
      if (shareData.text) {
        sharedMessage.value = shareData.text
        isEventFormOpen.value = true
      }
    }
  } catch (error) {
    console.error('Error receiving shared message:', error)
  }
}

onMounted(() => {
  handleSharedMessage()
})
</script>

<style>
.calendar-day-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  transform: translate(25%, -25%);
}

/* Estilos adicionales para mejorar el responsive */
@media (max-width: 640px) {
  .calendar-day-badge {
    transform: translate(15%, -15%);
  }

  /* Ajustes para modales en móvil */
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
}

/* Prevenir el zoom en inputs en iOS */
@supports (-webkit-touch-callout: none) {
  input {
    font-size: 16px;
  }
}

/* Asegurar que el calendario ocupe todo el espacio disponible */
.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
</style>
