<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <CalendarHeader
          :currentDate="currentDate"
          :title="format(currentDate, 'MMMM yyyy')"
          @update:currentDate="currentDate = $event"
        />
        <CalendarGrid
          :calendarDays="calendarDays"
          :getDateEvents="getDateEvents"
          :isMobile="isMobile"
          :weekDays="weekDays"
          @selectDate="selectDate"
        />
      </div>
    </div>
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
  </div>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import { useCalendarLogic } from "../composables/calendarLogic";
import CalendarModal from "../components/CalendarModal.vue";
import CalendarHeader from "../components/CalendarHeader.vue";
import CalendarGrid from "../components/CalendarGrid.vue";

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
</script>

<style lang="postcss">
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
