<template>
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-6">
        <!-- Calendar Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            {{ format(currentDate, 'MMMM yyyy') }}
          </h2>
          <div class="flex gap-2">
            <Button variant="secondary" @click="previousMonth">
              <ChevronLeftIcon class="h-5 w-5" />
            </Button>
            <Button variant="secondary" @click="currentDate = new Date()">
              Today
            </Button>
            <Button variant="secondary" @click="nextMonth">
              <ChevronRightIcon class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1">
          <!-- Day Headers -->
          <div v-for="day in weekDays" :key="day" class="p-2 text-center font-semibold text-gray-600">
            {{ day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="date in calendarDays"
            :key="date.toISOString()"
            :class="[
              'p-2 min-h-[100px] border rounded-md relative', // Añadido 'relative'
              isToday(date) ? 'border-blue-500' : 'border-gray-200',
              getDateEvents(date).length > 0 ? getDayColorClass(date) : '',
              'cursor-pointer hover:border-blue-300'
            ]"
            @click="selectDate(date)"
          >
            <div class="flex justify-between items-start">
              <span :class="[
                'text-sm font-medium',
                !isSameMonth(date, currentDate) ? 'text-gray-400' : 'text-gray-700'
              ]">
                {{ format(date, 'd') }}
              </span>
              <!-- Badge de eventos mejorado -->
              <div v-if="getDateEvents(date).length > 0"
                class="flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm">
                {{ getDateEvents(date).length }}
              </div>
            </div>
            <!-- Vista previa de eventos -->
            <div class="mt-1 space-y-1">
              <div v-for="(event, index) in getDateEvents(date).slice(0, 2)"
                   :key="event.id"
                   class="text-xs truncate p-1 rounded"
                   :class="event.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                {{ event.provider }}
              </div>
              <div v-if="getDateEvents(date).length > 2"
                   class="text-xs text-gray-500 pl-1">
                +{{ getDateEvents(date).length - 2 }} más
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event List Modal or New Event Modal -->
    <Modal v-if="selectedDateEvents.length > 0" v-model="isEventListModalOpen"
           :title="format(selectedDate, 'MMMM d, yyyy')">
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

    <EventFormModal v-else
      v-model="isEventFormOpen"
      :selected-date="selectedDate"
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
import { ref, computed } from 'vue'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon
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

function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1)
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1)
}

function getDateEvents(date: Date) {
  return eventStore.getEventsByDate(format(date, 'yyyy-MM-dd'))
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

function closeEventListModal() {
  isEventListModalOpen.value = false
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
    await eventStore.deleteEvent(eventToDelete.value.id)
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
  isEditModalOpen.value = false
  selectedEvent.value = null
  eventStore.fetchEvents()
}
</script>

<style>
.calendar-day-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  transform: translate(25%, -25%);
}
</style>
