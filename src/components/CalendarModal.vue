<template>
  <div>
    <!-- Modal de Lista de Eventos -->
    <ModalComponent
      v-if="selectedDateEvents.length > 0"
      :model-value="isEventListModalOpen"
      @update:model-value="$emit('update:isEventListModalOpen', $event)"
      :title="format(selectedDate, 'MMMM d, yyyy')"
      class="modal-wrapper"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Eventos del día</h3>
        <ButtonComponent
          type="button"
          variant="primary"
          :loading="false"
          :disabled="false"
          @click="openNewEventForm"
        >
          <PlusIcon class="h-5 w-5 mr-1" />
          Nuevo Evento
        </ButtonComponent>
      </div>
      <div class="mt-4 space-y-4">
        <div
          v-for="event in selectedDateEvents"
          :key="event.id"
          class="p-3 rounded-lg border transition-colors"
          :class="{
            'bg-green-50 border-green-200': event.paymentStatus === 'Pagado',
            'bg-yellow-50 border-yellow-200': event.paymentStatus === 'Pendiente',
          }"
        >
          <!-- Fila 1: Proveedor | Estado de Pago | Acciones -->
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-medium text-lg text-gray-800">{{ event.provider }}</h4>
            <span
              :class="{
                'text-green-600': event.paymentStatus === 'Pagado',
                'text-red-600': event.paymentStatus === 'Pendiente',
                'text-sm font-medium': true,
              }"
            >
              {{ event.paymentStatus }}
            </span>
            <div class="flex gap-1">
              <button
                @click="togglePaymentStatus(event)"
                class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                :title="
                  event.paymentStatus === 'Pagado'
                    ? 'Marcar como Pendiente'
                    : 'Marcar como Pagado'
                "
              >
                <CheckCircleIcon
                  v-if="event.paymentStatus === 'Pendiente'"
                  class="h-5 w-5 text-green-600"
                />
                <ClockIcon v-else class="h-5 w-5 text-red-600" />
              </button>
              <ButtonComponent
                type="button"
                variant="secondary"
                class="p-1.5 hover:bg-gray-100"
                @click="$emit('view-event', event)"
              >
                <EyeIcon class="h-4 w-4" />
              </ButtonComponent>
              <ButtonComponent
                type="button"
                variant="secondary"
                class="p-1.5 hover:bg-gray-100"
                @click="$emit('edit-event', event)"
              >
                <PencilIcon class="h-4 w-4" />
              </ButtonComponent>
              <ButtonComponent
                type="button"
                variant="danger"
                class="p-1.5 hover:bg-red-50"
                @click="$emit('confirm-delete', event)"
              >
                <TrashIcon class="h-4 w-4" />
              </ButtonComponent>
            </div>
          </div>

          <!-- Fila 2: Descripción | Ubicación | Hora -->
          <div class="flex justify-between items-center text-sm text-gray-600">
            <p class="flex-1">{{ event.description }}</p>
            <div class="flex items-center gap-4 ml-4">
              <span class="flex items-center gap-1">
                <MapPinIcon class="h-4 w-4 text-gray-500" />
                {{ event.location }}
              </span>
              <span class="flex items-center gap-1">
                <ClockIcon class="h-4 w-4 text-gray-500" />
                {{ event.time }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModalComponent>

    <!-- Formulario de nuevo evento -->
    <EventFormModal
      :model-value="isEventFormOpen"
      @update:model-value="$emit('update:isEventFormOpen', $event)"
      :selected-date="selectedDate"
      :shared-message="sharedMessage"
      @saved="$emit('event-saved')"
    />

    <!-- Event View Modal -->
    <EventViewModal
      v-if="selectedEvent"
      :model-value="isViewModalOpen"
      @update:model-value="$emit('update:isViewModalOpen', $event)"
      :event="selectedEvent"
      @edit="$emit('edit-from-view')"
    />

    <!-- Event Edit Modal -->
    <EventEditModal
      v-if="selectedEvent"
      :model-value="isEditModalOpen"
      @update:model-value="$emit('update:isEditModalOpen', $event)"
      :event="selectedEvent"
      @saved="$emit('event-saved')"
    />
    <!-- Delete Confirmation Modal -->
    <ModalComponent
      :model-value="isDeleteModalOpen"
      @update:model-value="$emit('update:isDeleteModalOpen', $event)"
      title="Eliminar Evento"
    >
      <p>
        ¿Está seguro que desea eliminar este evento? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <ButtonComponent
          type="button"
          variant="secondary"
          :disabled="isDeleting"
          @click="$emit('update:isDeleteModalOpen', false)"
        >
          Cancelar
        </ButtonComponent>
        <ButtonComponent
          type="button"
          variant="danger"
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="handleDelete"
        >
          {{ isDeleting ? "Eliminando..." : "Eliminar" }}
        </ButtonComponent>
      </template>
    </ModalComponent>
  </div>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import { MusicEvent } from "../types/event";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import EventFormModal from "./EventFormModal.vue";
import EventViewModal from "./EventViewModal.vue";
import EventEditModal from "./EventEditModal.vue";
import { ref } from "vue";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from "../utils/icons"; // Cambiamos la importación para usar nuestro archivo de iconos

type Props = {
  selectedDateEvents: MusicEvent[];
  selectedDate: Date;
  selectedEvent: MusicEvent | null;
  isEventListModalOpen: boolean;
  isEventFormOpen: boolean;
  isViewModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  sharedMessage?: string;
  isDeleting?: boolean; // Hacer la prop opcional
};

const props = withDefaults(defineProps<Props>(), {
  sharedMessage: undefined,
  isDeleting: false, // Valor por defecto
});

const emit = defineEmits<{
  "update:isEventListModalOpen": [value: boolean];
  "update:isEventFormOpen": [value: boolean];
  "update:isViewModalOpen": [value: boolean];
  "update:isEditModalOpen": [value: boolean];
  "update:isDeleteModalOpen": [value: boolean];
  "view-event": [event: MusicEvent];
  "edit-event": [event: MusicEvent];
  "confirm-delete": [event: MusicEvent];
  "edit-from-view": [];
  "event-saved": [];
  "delete-event": [event: MusicEvent];
  "toggle-payment-status": [event: MusicEvent];
}>();

const togglePaymentStatus = (event: MusicEvent) => {
  emit("toggle-payment-status", event);
};

const openNewEventForm = () => {
  emit("update:isEventListModalOpen", false);
  emit("update:isEventFormOpen", true);
};

// Modificar handleDelete para emitir el evento con el evento seleccionado
const handleDelete = () => {
  if (props.selectedEvent) {
    emit("delete-event", props.selectedEvent);
  } else {
    console.error("No hay un evento seleccionado para eliminar");
    alert("No hay un evento seleccionado para eliminar.");
  }
};
</script>
<script lang="ts">
export default {
  name: "CalendarModal",
};
</script>

<style scoped>
/* Estilos heredados del modal anterior */
:deep(.modal-content) {
  @apply bg-white rounded-lg shadow-xl overflow-hidden mx-auto my-4;
  max-width: min(
    calc(100vw - 2rem),
    42rem
  ); /* Limita el ancho máximo y asegura margen en móviles */
  width: 100%;
}

:deep(.modal-header) {
  @apply px-4 sm:px-6 py-4 border-b border-gray-200;
}

:deep(.modal-body) {
  @apply px-4 sm:px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto;
}

:deep(.modal-footer) {
  @apply px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2;
}

/* Clase para envolver el modal y centrarlo */
.modal-wrapper {
  @apply fixed inset-0 flex items-center justify-center p-4 z-50;
  background-color: rgba(0, 0, 0, 0.5);
}

/* Ajustes responsive mejorados */
@media (max-width: 640px) {
  :deep(.modal-content) {
    @apply rounded-md;
    margin: 1rem;
    width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
  }

  .modal-wrapper {
    @apply p-0;
  }
}

/* Estilos específicos para los botones */
.btn {
  @apply px-4 py-2 rounded-md transition-colors;
}

.btn-secondary {
  @apply bg-gray-100 hover:bg-gray-200 text-gray-700;
}

.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white;
}

.btn-danger {
  @apply bg-red-500 hover:bg-red-600 text-white;
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ajustes responsive */
@media (max-width: 640px) {
  :deep(.modal-content) {
    @apply m-4;
  }
}

/* Añadir estos estilos para mejorar el diseño compacto */
.btn-action {
  @apply p-1.5 rounded transition-colors;
}

.event-info {
  @apply flex items-center gap-1 whitespace-nowrap;
}
</style>
