<template>
  <!-- Se agregan los eventos touchstart y touchend al contenedor raíz -->
  <div
    class="min-h-screen p-2 sm:p-4"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p6">
        <!-- Encabezado del calendario -->
        <CalendarHeader
          :currentDate="currentDate"
          :title="format(currentDate, 'MMMM yyyy')"
          @update:currentDate="currentDate = $event"
        />
        <!-- Grilla de días -->
        <CalendarGrid
          :calendarDays="calendarDays"
          :getDateEvents="getDateEvents"
          :isMobile="isMobile"
          :weekDays="weekDays"
          @selectDate="selectDate"
        />
      </div>
    </div>

    <!-- Modal para eventos -->
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
      @edit-from-view="handleEditEvent"
      @event-saved="handleEventSaved"
      @toggle-payment-status="togglePaymentStatus"
    />

    <!-- Componente para procesar prompts de eventos -->
    <AddPrompt @event-processed="handleProcessedEvent" class="AddPrompt" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { format, addMonths, subMonths } from "date-fns";
import CalendarHeader from "../components/CalendarHeader.vue";
import CalendarGrid from "../components/CalendarGrid.vue";
import CalendarModal from "../components/CalendarModal.vue";
import AddPrompt from "../components/AddPrompt.vue";
import { useCalendarLogic } from "../composables/calendarLogic";

// Desestructuramos la lógica del calendario desde el composable
const {
  currentDate,
  selectedDate,
  isEventListModalOpen,
  isDeleteModalOpen,
  isEventFormOpen,
  isViewModalOpen,
  isEditModalOpen,
  selectedEvent,
  isDeleting,
  isMobile,
  weekDays,
  calendarDays,
  selectedDateEvents,
  sharedMessage,
  getDateEvents,
  selectDate,
  viewEvent,
  editEvent,
  handleEditEvent,
  togglePaymentStatus,
  handleEventSaved,
} = useCalendarLogic();

/**
 * Maneja el evento procesado desde el AddPrompt:
 * - Cierra los modales abiertos.
 * - Pre-llena el formulario con los datos recibidos.
 * - Abre el formulario para crear/editar evento.
 */
const handleProcessedEvent = (eventData: any) => {
  // Cerrar todos los modales
  isEventListModalOpen.value = false;
  isViewModalOpen.value = false;
  isEditModalOpen.value = false;
  isDeleteModalOpen.value = false;

  // Reiniciar el evento seleccionado para indicar un nuevo evento
  selectedEvent.value = null;
  // Guardamos el mensaje preprocesado (podrías mejorar el formato según sea necesario)
  sharedMessage.value = JSON.stringify(eventData);

  // Abrir el formulario de evento
  isEventFormOpen.value = true;
};

/* ---------------------------
   Implementación del swipe
   --------------------------- */

// Variables para almacenar la posición inicial y final del toque
const touchStartX = ref<number | null>(null);
const touchEndX = ref<number | null>(null);
const swipeThreshold = 50; // Umbral en píxeles

/**
 * Guarda la posición X inicial del toque.
 */
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].clientX;
};

/**
 * Al finalizar el toque, compara la posición inicial y final.
 * Si la diferencia horizontal supera el umbral, actualiza el mes:
 * - Swipe de derecha a izquierda: avanza un mes.
 * - Swipe de izquierda a derecha: retrocede un mes.
 */
const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX;
  if (touchStartX.value !== null && touchEndX.value !== null) {
    const diff = touchStartX.value - touchEndX.value;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe hacia la izquierda: siguiente mes
        currentDate.value = addMonths(currentDate.value, 1);
      } else {
        // Swipe hacia la derecha: mes anterior
        currentDate.value = subMonths(currentDate.value, 1);
      }
    }
  }
  // Resetear valores
  touchStartX.value = null;
  touchEndX.value = null;
};
</script>

<style lang="postcss">
/* Badge en cada día del calendario */
.calendar-day-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  transform: translate(25%, -25%);
}

/* Estilos responsive para modales y badges */
@media (max-width: 640px) {
  .calendar-day-badge {
    transform: translate(15%, -15%);
  }
  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
}

/* Prevenir zoom en inputs en iOS */
@supports (-webkit-touch-callout: none) {
  input {
    font-size: 16px;
  }
}

/* Asegurar que el calendario ocupe todo el espacio disponible */
.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

/* Optimización para pantallas pequeñas */
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

/* Ajuste vertical general */
.min-h-screen {
  min-height: 100vh;
  height: 100%;
}

/* Separación para el componente AddPrompt */
.AddPrompt {
  margin-top: 1rem;
}
</style>
