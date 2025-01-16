<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <!-- Calendar Header -->
        <div
          class="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3"
        >
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
            {{ format(currentDate, "MMMM yyyy") }}
          </h2>
          <div class="flex gap-2">
            <ButtonComponent
              type="button"
              variant="secondary"
              class="p-1 sm:p-2"
              :loading="false"
              :disabled="false"
              @click="previousMonth"
            >
              <ChevronLeftIcon class="h-4 w-4 sm:h-5 sm:w-5" />
            </ButtonComponent>
            <ButtonComponent
              type="button"
              variant="secondary"
              class="text-sm sm:text-base px-2 sm:px-4"
              :loading="false"
              :disabled="false"
              @click="currentDate = new Date()"
            >
              Hoy
            </ButtonComponent>
            <ButtonComponent
              type="button"
              variant="secondary"
              class="p-1 sm:p-2"
              :loading="false"
              :disabled="false"
              @click="nextMonth"
            >
              <ChevronRightIcon class="h-4 w-4 sm:h-5 sm:w-5" />
            </ButtonComponent>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1">
          <!-- Day Headers -->
          <div
            v-for="day in weekDays"
            :key="day"
            class="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-gray-600"
          >
            {{ isMobile ? day.charAt(0) : day }}
          </div>

          <!-- Calendar Days -->
          <div
            v-for="date in calendarDays"
            :key="date.toISOString()"
            :class="[
              'p-1 sm:p-2 min-h-[45px] sm:min-h-[80px] md:min-h-[100px] border rounded-md relative',
              isToday(date) ? 'border-blue-500' : 'border-gray-200',
              getDateEvents(date).length > 0 ? getDayColorClass(date) : '',
              'cursor-pointer hover:border-blue-300',
            ]"
            @click="selectDate(date)"
          >
            <div class="flex justify-between items-start">
              <span
                :class="[
                  'text-xs sm:text-sm font-medium',
                  !isSameMonth(date, currentDate) ? 'text-gray-400' : 'text-gray-700',
                ]"
              >
                {{ format(date, "d") }}
              </span>
              <!-- Badge de eventos optimizado para móvil -->
              <div
                v-if="getDateEvents(date).length > 0"
                class="flex items-center justify-center min-w-[1rem] sm:min-w-[1.25rem] h-4 sm:h-5 px-1 text-[10px] sm:text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm"
              >
                {{ getDateEvents(date).length }}
              </div>
            </div>
            <!-- Vista previa de eventos optimizada -->
            <div class="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
              <div
                v-for="(event, index) in getDateEvents(date).slice(0, isMobile ? 1 : 2)"
                :key="index"
                class="text-[8px] sm:text-[10px] md:text-xs truncate p-0.5 rounded"
                :class="
                  event.paymentStatus === 'Pagado'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                "
              >
                {{ event.provider }}
              </div>
              <div
                v-if="getDateEvents(date).length > (isMobile ? 1 : 2)"
                class="text-[8px] sm:text-[10px] md:text-xs text-gray-500 pl-0.5"
              >
                +{{ getDateEvents(date).length - (isMobile ? 1 : 2) }} más
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reemplazar los modales antiguos con el nuevo componente -->
    <CalendarModal
      :selected-date-events="selectedDateEvents"
      :selected-date="selectedDate"
      :selected-event="selectedEvent"
      :is-event-list-modal-open="isEventListModalOpen"
      :is-event-form-open="isEventFormOpen"
      :is-view-modal-open="isViewModalOpen"
      :is-edit-modal-open="isEditModalOpen"
      :is-delete-modal-open="isDeleteModalOpen"
      :shared-message="sharedMessage"
      :is-deleting="isDeleting"
      @update:is-event-list-modal-open="isEventListModalOpen = $event"
      @update:is-event-form-open="isEventFormOpen = $event"
      @update:is-view-modal-open="isViewModalOpen = $event"
      @update:is-edit-modal-open="isEditModalOpen = $event"
      @update:is-delete-modal-open="isDeleteModalOpen = $event"
      @view-event="viewEvent"
      @edit-event="editEvent"
      @confirm-delete="confirmDelete"
      @edit-from-view="handleEditEvent"
      @event-saved="handleEventSaved"
      @delete-event="handleDeleteEvent"
      @toggle-payment-status="togglePaymentStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addWeeks,
  getDay,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
} from "../utils/icons";
import { useEventStore } from "../stores/eventStore";
import { MusicEvent } from "../types/event";
import ButtonComponent from "../components/ButtonComponent.vue";
import CalendarModal from "../components/CalendarModal.vue";
import { NotificationService } from "../services/NotificationService";

const eventStore = useEventStore();
const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const isEventListModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const eventToDelete = ref<MusicEvent | null>(null);
const isEventFormOpen = ref(false);
const isViewModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedEvent = ref<MusicEvent | null>(null);
const isDeleting = ref(false); // Agregar estado isDeleting

const weekDays = ["Dom", "Lun", "Mar", "Mier", "Jue", "Vie", "Sab"];

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value));
  const end = endOfWeek(endOfMonth(currentDate.value));
  return eachDayOfInterval({ start, end });
});

const selectedDateEvents = computed(() => {
  return eventStore.getEventsByDate(format(selectedDate.value, "yyyy-MM-dd"));
});

onMounted(() => {
  eventStore.fetchEvents();
});

// Añadir detección de dispositivo móvil
const isMobile = ref(window.innerWidth < 640);

// Actualizar el estado de isMobile cuando cambie el tamaño de la ventana
onMounted(() => {
  window.addEventListener("resize", () => {
    isMobile.value = window.innerWidth < 640;
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", () => {
    isMobile.value = window.innerWidth < 640;
  });
});

function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

function getDateEvents(date: Date) {
  const events = eventStore.getEventsByDate(format(date, "yyyy-MM-dd"));
  const fixedEvents = events.filter((event) => event.isFixed);
  const nonFixedEvents = events.filter((event) => !event.isFixed);

  // Duplicar eventos fijos para las próximas semanas del mes
  fixedEvents.forEach((event) => {
    let nextDate = addWeeks(date, 1);
    while (isSameMonth(nextDate, date)) {
      nonFixedEvents.push({ ...event, date: format(nextDate, "yyyy-MM-dd") });
      nextDate = addWeeks(nextDate, 1);
    }
  });

  return nonFixedEvents;
}

function getDayColorClass(date: Date) {
  const events = getDateEvents(date);
  if (events.length === 0) return "";

  const hasPaid = events.some((e) => e.paymentStatus === "Pagado");
  const hasPending = events.some((e) => e.paymentStatus === "Pendiente");

  if (hasPaid && hasPending) return "bg-event-mixed";
  if (hasPaid) return "bg-event-paid";
  return "bg-event-pending";
}

function selectDate(date: Date) {
  selectedDate.value = date;
  const events = getDateEvents(date);
  if (events.length > 0) {
    isEventListModalOpen.value = true;
  } else {
    isEventFormOpen.value = true;
  }
}

function openNewEventForm() {
  isEventListModalOpen.value = false; // Cerrar el modal de listado
  isEventFormOpen.value = true; // Abrir el formulario de nuevo evento
}

function viewEvent(event: MusicEvent) {
  selectedEvent.value = event;
  isViewModalOpen.value = true;
}

function handleEditEvent() {
  isViewModalOpen.value = false;
  isEditModalOpen.value = true;
}

function editEvent(event: MusicEvent) {
  selectedEvent.value = event;
  isEditModalOpen.value = true;
}

function confirmDelete(event: MusicEvent) {
  // Asignar el evento a eliminar antes de abrir el modal
  selectedEvent.value = event;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  eventToDelete.value = null;
}

async function deleteEvent() {
  const eventToDeleteValue = eventToDelete.value;

  if (!eventToDeleteValue?.id) {
    console.error("ID de evento no válido");
    return;
  }

  try {
    if (eventToDeleteValue.isFixed) {
      const similarEvents = findSimilarEvents.value;
      await Promise.all(
        similarEvents.map(async (event) => {
          if (event.id) {
            await eventStore.deleteEvent(event.id);
          }
        })
      );
    } else {
      await eventStore.deleteEvent(eventToDeleteValue.id);
    }

    closeDeleteModal();
    // Actualizar la lista de eventos después de eliminar
    await eventStore.fetchEvents();
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
  }
}

// Añadir esta función de verificación de tipo antes de la función deleteEvent
function isMusicEvent(event: any): event is MusicEvent {
  return (
    event &&
    typeof event === "object" &&
    "id" in event &&
    "date" in event &&
    "provider" in event &&
    "description" in event &&
    "location" in event &&
    "time" in event &&
    "amount" in event &&
    "isFixed" in event
  );
}

const findSimilarEvents = computed(() => {
  const eventToDeleteValue = eventToDelete.value;

  if (!eventToDeleteValue || !isMusicEvent(eventToDeleteValue)) {
    return [];
  }

  const { provider, description, location, time, amount, date } = eventToDeleteValue;
  const eventDate = new Date(date);

  return eventStore.events.filter(
    (e) =>
      e.provider === provider &&
      e.description === description &&
      e.location === location &&
      e.time === time &&
      e.amount === amount &&
      getDay(new Date(e.date)) === getDay(eventDate)
  );
});

async function togglePaymentStatus(event: MusicEvent) {
  if (!event.id) return;

  try {
    await eventStore.togglePaymentStatus(event.id);
    // Actualizar la lista de eventos después del toggle
    await eventStore.fetchEvents();
  } catch (error) {
    console.error("Error al actualizar el estado de pago:", error);
  }
}

function handleEventSaved() {
  isEventFormOpen.value = false;
  isEventListModalOpen.value = true; // Volver a mostrar el listado después de guardar
  isEditModalOpen.value = false;
  selectedEvent.value = null;
  eventStore.fetchEvents();
}

const sharedMessage = ref<string | undefined>(undefined);

// Función para manejar mensajes compartidos
async function handleSharedMessage() {
  try {
    if ("share" in navigator && "shareTarget" in navigator) {
      const shareData = await (navigator as any).shareTarget.receive();
      if (shareData.text) {
        sharedMessage.value = shareData.text;
        isEventFormOpen.value = true;
      }
    }
  } catch (error) {
    console.error("Error receiving shared message:", error);
  }
}

onMounted(() => {
  handleSharedMessage();
  // Escuchar mensajes del service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "SHARED_CONTENT") {
      sharedMessage.value = event.data.text;
      isEventFormOpen.value = true;
    }
  });
});

const notificationService = NotificationService.getInstance();
const notificationSettings = ref({
  led: true,
  screen: true,
});

async function handleDeleteEvent(event: MusicEvent) {
  if (!event?.id) {
    console.error("No hay ID de evento para eliminar");
    return;
  }

  try {
    isDeleting.value = true; // Iniciar estado de eliminación
    console.log("Eliminando evento:", event.id);
    await eventStore.deleteEvent(event.id); // Llamar al store para eliminar

    // Activar LED si está habilitado
    if (notificationSettings.value.led) {
      await notificationService.flashLED(false);
    }

    // Activar pantalla si está habilitado
    if (notificationSettings.value.screen) {
      await notificationService.wakeScreen();
    }

    isDeleteModalOpen.value = false;
    isEventListModalOpen.value = false;
    selectedEvent.value = null;
    eventToDelete.value = null;
    await eventStore.fetchEvents(); // Actualizar la lista de eventos
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    alert("Error al eliminar el evento."); // Notificar al usuario
  } finally {
    isDeleting.value = false; // Finalizar estado de eliminación
  }
}
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
/* Optimizaciones adicionales para pantallas pequeñas */
@media (max-height: 667px) {
  .grid-cols-7 > div {
    min-height: 40px !important;
  }
  .calendar-day-badge {
    transform: translate(10%, -10%);
  }
}
@media (max-height: 568px) {
  .grid-cols-7 > div {
    min-height: 35px !important;
  }
}
/* Asegurar que el contenido se ajuste verticalmente */
.min-h-screen {
  min-height: 100vh;
  height: 100%;
}
</style>
