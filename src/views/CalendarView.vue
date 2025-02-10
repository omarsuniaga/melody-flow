<template>
  <!-- Contenedor principal del calendario.
       Se han agregado eventos touch para detectar gestos de swipe y cambiar de mes -->
  <div
    class="min-h-screen p-2 sm:p-4"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Contenedor del calendario con encabezado y grilla de días -->
      <div class="bg-white rounded-lg shadow p-3 sm:p-6 mb-4">
        <!-- Encabezado del calendario: muestra la fecha actual en formato "MMMM yyyy" -->
        <CalendarHeader
          :currentDate="currentDate"
          :title="format(currentDate, 'MMMM yyyy')"
          @update:currentDate="currentDate = $event"
        />
        <!-- Grilla de días que muestra los eventos asociados a cada fecha -->
        <CalendarGrid
          :calendarDays="calendarDays"
          :getDateEvents="getDateEvents"
          :isMobile="isMobile"
          :weekDays="weekDays"
          @selectDate="selectDate"
        />
      </div>
    </div>
    <div>
      <!-- Card de proximidad - Comentamos temporalmente la condición de isEventListModalOpen -->
      <Transition
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition ease-in duration-300"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <CalendarDistance
          v-if="hasActiveEvent"
          :active-event="getCurrentEvent()"
          class="transition-all duration-300 ease-in-out max-w-7xl mx-auto"
        />
      </Transition>
    </div>
    <!-- Modal para la visualización y edición de eventos -->
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

    <!-- Componente para procesar prompts de eventos.
         Cuando se procesa un evento, se dispara el método handleProcessedEvent -->
    <AddPrompt @event-processed="handleProcessedEvent" class="AddPrompt" />
  </div>
</template>

<script setup lang="ts">
/**
 * Componente CalendarView
 * Esta vista muestra el calendario, permite la navegación entre meses mediante gestos de swipe,
 * y gestiona la visualización, edición y creación de eventos.
 * Se utiliza un composable (useCalendarLogic) para encapsular la lógica del calendario.
 */
defineOptions({ name: "CalendarView" });

import { ref, computed } from "vue";
import { format, addMonths, subMonths, parse } from "date-fns";
import CalendarHeader from "../components/CalendarHeader.vue";
import CalendarGrid from "../components/CalendarGrid.vue";
import CalendarModal from "../components/CalendarModal.vue";
import AddPrompt from "../components/AddPrompt.vue";
import CalendarDistance from "../components/CalendarDistance.vue";
import { useCalendarLogic } from "../composables/calendarLogic";

// Extraemos la lógica del calendario mediante un composable para mantener el código limpio y modular.
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
 * Maneja el evento procesado desde el componente AddPrompt.
 * - Cierra todos los modales abiertos.
 * - Reinicia el evento seleccionado para indicar un nuevo evento.
 * - Guarda el mensaje compartido (preprocesado) y abre el formulario de evento.
 *
 * @param eventData - Datos del evento procesado.
 */
const handleProcessedEvent = (eventData: any) => {
  // Cerrar todos los modales abiertos
  isEventListModalOpen.value = false;
  isViewModalOpen.value = false;
  isEditModalOpen.value = false;
  isDeleteModalOpen.value = false;

  // Reiniciar el evento seleccionado para indicar la creación de un nuevo evento
  selectedEvent.value = null;
  // Guardar el mensaje compartido, se puede formatear según sea necesario
  sharedMessage.value = JSON.stringify(eventData);

  // Abrir el formulario de evento para crear o editar
  isEventFormOpen.value = true;
};

/* ===================================================
   Implementación de detección de gestos (swipe)
   =================================================== */

// Variables reactivas para almacenar la posición inicial y final del toque
const touchStartX = ref<number | null>(null);
const touchEndX = ref<number | null>(null);
const swipeThreshold = 50; // Umbral en píxeles para considerar un swipe

/**
 * Registra la posición X inicial del toque.
 *
 * @param e - Evento touchstart.
 */
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].clientX;
};

/**
 * Compara la posición inicial y final del toque y, si la diferencia supera el umbral,
 * actualiza el mes mostrado en el calendario.
 * - Swipe de derecha a izquierda: avanza un mes.
 * - Swipe de izquierda a derecha: retrocede un mes.
 *
 * @param e - Evento touchend.
 */
const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX;
  if (touchStartX.value !== null && touchEndX.value !== null) {
    const diff = touchStartX.value - touchEndX.value;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe hacia la izquierda: avanzar un mes
        currentDate.value = addMonths(currentDate.value, 1);
      } else {
        // Swipe hacia la derecha: retroceder un mes
        currentDate.value = subMonths(currentDate.value, 1);
      }
    }
  }
  // Reiniciar las posiciones para el próximo gesto
  touchStartX.value = null;
  touchEndX.value = null;
};

// Modificar la lógica de eventos activos
const hasActiveEvent = computed(() => {
  const now = new Date();
  const todayEvents = getDateEvents(now);
  return todayEvents.some((event) => {
    return event.coord !== undefined && event.coord !== null;
  });
});

const getCurrentEvent = () => {
  const now = new Date();
  const todayEvents = getDateEvents(now);

  if (!todayEvents || todayEvents.length === 0) {
    return null;
  }

  const activeEvents = todayEvents.filter((event) => {
    return event.coord !== undefined && event.coord !== null;
  });

  if (activeEvents.length === 0) {
    return null;
  }

  // Ordenar por hora y retornar el más próximo
  return activeEvents.sort((a, b) => {
    const timeA = parse(a.time, "HH:mm", now);
    const timeB = parse(b.time, "HH:mm", now);
    return timeA.getTime() - timeB.getTime();
  })[0];
};
</script>

<style lang="postcss">
/* Badge para cada día del calendario */
.calendar-day-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  transform: translate(25%, -25%);
}

/* Estilos responsivos para modales y badges */
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

/* Asegurar que el calendario ocupe todo el ancho disponible */
.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

/* Optimización para pantallas con altura reducida */
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

/* Asegurar que el contenedor principal ocupe todo el alto de la pantalla */
.min-h-screen {
  min-height: 100vh;
  height: 100%;
}

/* Separación para el componente AddPrompt */
.AddPrompt {
  margin-top: 1rem;
}
</style>
