<script setup lang="ts">
import { ref, PropType } from "vue";
import { format, parseISO } from "date-fns";
import { useEventStore } from "../stores/eventStore";
import { MusicEvent } from "../types/event";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { TrashIcon } from "../utils/icons";

const props = defineProps({
  event: {
    type: Object as PropType<MusicEvent>,
    required: true,
  },
});

const showModal = ref(false);
const isDeleting = ref(false);
const deleteMode = ref<"single" | "all">("single");
const eventStore = useEventStore();

async function confirmDelete() {
  if (!props.event?.id) {
    console.error("Evento inválido o sin ID");
    return;
  }

  try {
    isDeleting.value = true;
    if (props.event.activityType === "Fija" && deleteMode.value === "all") {
      await eventStore.deleteRecurringEvents(props.event);
    } else {
      await eventStore.deleteEvent(props.event.id);
    }
    // Primero cerramos el modal
    showModal.value = false;
    // Luego emitimos el evento y actualizamos
    await eventStore.fetchEvents();
  } catch (error) {
    console.error("Error al eliminar:", error);
  } finally {
    isDeleting.value = false;
  }
}

// Función auxiliar para formatear fecha
const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "dd/MM/yyyy");
};
</script>

<template>
  <div>
    <ButtonComponent
      type="button"
      variant="danger"
      class="p-1.5 hover:bg-red-100"
      @click="() => (showModal = true)"
    >
      <TrashIcon class="h-4 w-4" />
    </ButtonComponent>

    <!-- Modal de confirmación -->
    <Teleport to="body">
      <ModalComponent v-if="showModal" v-model:modelValue="showModal">
        <template #header>
          <h2 class="text-lg font-semibold text-red-600">Confirmar eliminación</h2>
        </template>

        <template #default>
          <div class="flex flex-col space-y-4">
            <p class="text-gray-700">¿Estás seguro de que deseas eliminar este evento?</p>

            <!-- Detalles del evento -->
            <div class="bg-gray-50 p-4 rounded-md space-y-2">
              <p class="text-sm text-gray-600">
                <span class="font-medium">Descripción:</span>
                {{ event.description }}
              </p>
              <p class="text-sm text-gray-600">
                <span class="font-medium">Fecha:</span>
                {{ formatDate(event.date) }}
              </p>
            </div>

            <!-- Si es un evento fijo, mostrar opción adicional -->
            <div v-if="event.activityType === 'Fija'" class="space-y-2">
              <p class="text-sm text-yellow-600">
                Este es un evento fijo semanal. ¿Qué deseas hacer?
              </p>
              <div class="space-y-2">
                <label class="flex items-center space-x-2">
                  <input
                    type="radio"
                    v-model="deleteMode"
                    value="single"
                    class="text-blue-600"
                  />
                  <span class="text-sm">Eliminar solo este evento</span>
                </label>
                <label class="flex items-center space-x-2">
                  <input
                    type="radio"
                    v-model="deleteMode"
                    value="all"
                    class="text-blue-600"
                  />
                  <span class="text-sm">Eliminar todos los eventos similares</span>
                </label>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <ButtonComponent
              type="button"
              variant="secondary"
              @click="showModal = false"
              :disabled="isDeleting"
            >
              Cancelar
            </ButtonComponent>
            <ButtonComponent
              type="button"
              variant="danger"
              :loading="isDeleting"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              {{ isDeleting ? "Eliminando..." : "Eliminar" }}
            </ButtonComponent>
          </div>
        </template>
      </ModalComponent>
    </Teleport>
  </div>
</template>

<style lang="postcss">
.ActionButtons {
  display: flex;
  gap: 1rem;
}

.ActionButtons button {
  flex: 1;
}
</style>
