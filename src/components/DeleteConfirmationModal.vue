<template>
  <ModalComponent
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', false)"
    title="Confirmar Eliminación"
  >
    <div class="space-y-6">
      <!-- Mensaje de confirmación -->
      <div class="text-gray-700">
        <p v-if="event?.activityType === 'Fija'" class="mb-2">
          Este es un evento fijo del proveedor:
          <span class="font-semibold">{{ event.provider }}</span>
        </p>
        <p v-if="event?.activityType === 'Fija'" class="text-sm text-gray-600">
          Seleccione qué desea eliminar:
        </p>
        <p v-else>
          ¿Está seguro que desea eliminar este evento? Esta acción no se puede deshacer.
        </p>
      </div>

      <!-- Detalles del evento -->
      <div v-if="event" class="bg-gray-50 p-4 rounded-md space-y-2">
        <div class="flex items-center gap-2">
          <CalendarIcon class="h-4 w-4 text-gray-500" />
          <span class="text-sm">{{ event.date }}</span>
        </div>
        <div class="flex items-center gap-2">
          <ClockIcon class="h-4 w-4 text-gray-500" />
          <span class="text-sm">{{ event.time }}</span>
        </div>
        <div class="flex items-center gap-2">
          <MapPinIcon class="h-4 w-4 text-gray-500" />
          <span class="text-sm">{{ event.location }}</span>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="ActionButtons">
        <template v-if="event?.activityType === 'Fija'">
          <ButtonComponent
            type="button"
            variant="primary"
            :disabled="isDeleting"
            class="flex-1"
            @click="handleDelete('single')"
          >
            Este evento
          </ButtonComponent>
          <ButtonComponent
            type="button"
            variant="danger"
            :disabled="isDeleting"
            class="flex-1"
            @click="handleDelete('all')"
          >
            Todos
          </ButtonComponent>
          <ButtonComponent
            type="button"
            variant="secondary"
            :disabled="isDeleting"
            @click="cancel"
          >
            Ninguno
          </ButtonComponent>
        </template>
        <template v-else>
          <ButtonComponent
            type="button"
            variant="secondary"
            :disabled="isDeleting"
            @click="cancel"
          >
            Cancelar
          </ButtonComponent>
          <ButtonComponent
            type="button"
            variant="danger"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="handleDelete('single')"
          >
            {{ isDeleting ? "Eliminando..." : "Eliminar" }}
          </ButtonComponent>
        </template>
      </div>
    </div>
  </ModalComponent>
</template>

<script setup lang="ts">
import { MusicEvent } from "../types/event";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { CalendarIcon, ClockIcon, MapPinIcon } from "../utils/icons";

const props = defineProps<{
  modelValue: boolean;
  event: MusicEvent | null;
  isDeleting: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  delete: [event: MusicEvent, mode: "single" | "all"];
  cancel: [];
}>();

function handleDelete(mode: "single" | "all") {
  if (!props.event) {
    console.error("Error: No hay evento para eliminar", props.event);
    return;
  }
  console.log("Eliminando evento", props.event.activityType);
  console.log("Valor de mode: ", mode);

  emit("delete", props.event, mode); // Emitir evento de eliminación
  emit("update:modelValue", false); // Cerrar modal
}

function cancel() {
  emit("update:modelValue", false); // Cerrar modal
  emit("cancel"); // Emitir evento de cancelación
}
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DeleteConfirmationModal",
});
</script>

<style scoped>
.ActionButtons {
  /* botones ordenados por columnas */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
</style>
