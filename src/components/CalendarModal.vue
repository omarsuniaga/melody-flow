<template>
  <div>
    <!-- Modal de Lista de Eventos -->
    <ModalComponent
      v-if="selectedDateEvents.length > 0"
      :model-value="isEventListModalOpen"
      @update:model-value="$emit('update:isEventListModalOpen', $event)"
      :title="`Eventos para ${format(selectedDate, 'MMMM d, yyyy')}`"
      class="modal-wrapper"
    >
      <!-- Botón de Nuevo Evento en la parte superior -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">{{ selectedDateEvents.length }} eventos</h3>
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
          v-for="(event, index) in selectedDateEvents"
          :key="index"
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
                @click="handleTogglePaymentStatus(event)"
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
              <!-- Solo renderizar DeleteEvent si event existe y tiene id -->
              <DeleteEvent
                v-if="event && event.id"
                :event="event"
                @deleted="fetchEvents"
              />
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
      v-if="isViewModalOpen"
      :model-value="isViewModalOpen"
      @update:model-value="$emit('update:isViewModalOpen', $event)"
      :event="selectedEvent"
      @edit="handleEditFromView"
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
    <DeleteConfirmationModal
      :model-value="isDeleteModalOpen"
      @update:model-value="$emit('update:isDeleteModalOpen', $event)"
      :event="selectedEvent"
      :is-deleting="isDeleting"
      @cancel="$emit('update:isDeleteModalOpen', false)"
      @delete="(event, mode) => $emit('delete-event', { ...event, deleteMode: mode })"
    />
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
import DeleteEvent from "./DeleteEvent.vue";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from "../utils/icons.js"; // Cambiamos la importación para usar nuestro archivo de iconos
import { useEventStore } from "../stores/eventStore"; // Eliminar cualquier referencia a Supabase
import { defineProps, defineEmits, withDefaults } from "vue";
import { defineAsyncComponent, ref, computed } from "vue";

const props = withDefaults(
  defineProps<{
    selectedDateEvents: MusicEvent[];
    selectedDate: Date;
    selectedEvent: MusicEvent | null;
    isEventListModalOpen: boolean;
    isEventFormOpen: boolean;
    isViewModalOpen: boolean;
    isEditModalOpen: boolean;
    isDeleteModalOpen: boolean;
    sharedMessage?: string;
    isDeleting?: boolean;
  }>(),
  {
    sharedMessage: undefined,
    isDeleting: false,
  }
);

interface Emits {
  (e: "update:isEventListModalOpen", value: boolean): void;
  (e: "update:isEventFormOpen", value: boolean): void;
  (e: "update:isViewModalOpen", value: boolean): void;
  (e: "update:isEditModalOpen", value: boolean): void;
  (e: "update:isDeleteModalOpen", value: boolean): void;
  (e: "view-event", event: MusicEvent): void;
  (e: "edit-event", event: MusicEvent): void;
  (e: "confirm-delete", event: MusicEvent): void;
  (e: "edit-from-view"): void;
  (e: "event-saved"): void;
  (e: "toggle-payment-status", event: MusicEvent): void;
  (e: "delete-event", event: DeleteEvent): void;
}
const DeleteConfirmationModal = defineAsyncComponent(
  () => import("./DeleteConfirmationModal.vue")
);
console.log("selectedEvent", props.selectedEvent);

const eventStore = useEventStore();
const isLoading = ref(false);
const errorMessage = ref("");

const emit = defineEmits<Emits>();

const handleTogglePaymentStatus = async (event: MusicEvent) => {
  if (!event.id) {
    console.error("Error: El evento no tiene id");
    return;
  }
  try {
    const newStatus = event.paymentStatus === "Pendiente" ? "Pagado" : "Pendiente";
    console.log("Marcando como pagado el evento:", event.paymentStatus);
    console.log("Cambiando estado para evento:", newStatus);
    emit("toggle-payment-status", { ...event, paymentStatus: newStatus });
  } catch (error) {
    console.error("Error al cambiar el estado de pago:", error);
  }
};

const openNewEventForm = () => {
  emit("update:isEventListModalOpen", false);
  emit("update:isEventFormOpen", true);
};

const handleEditFromView = () => {
  emit("edit-from-view");
};

// Agregar método fetchEvents
const fetchEvents = async () => {
  await eventStore.fetchEvents();
};

// Asegúrate de que selectedEvent tenga todas las propiedades
const selectedEvent = computed(() => {
  if (!props.selectedEvent) return null;

  return {
    ...props.selectedEvent,
    location: props.selectedEvent.location || "Sin ubicación",
    // Asegura otras propiedades requeridas aquí
  };
});
</script>
<script lang="ts">
export default {
  name: "CalendarModal",
};
</script>
<style lang="postcss">
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
