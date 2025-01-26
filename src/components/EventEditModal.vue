<script setup lang="ts">
import { ref, computed } from "vue";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { useEventStore } from "../stores/eventStore";
import type { MusicEvent, EventFormData } from "../types/event";

interface Props {
  event: MusicEvent;
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
}>();

const eventStore = useEventStore();
const isLoading = ref(false);
const errorMessage = ref("");

const eventForm = ref<EventFormData>({
  id: props.event.id,
  activityType: props.event.activityType,
  paymentStatus: props.event.paymentStatus,
  provider: props.event.provider,
  description: props.event.description,
  location: props.event.location,
  date: props.event.date,
  time: props.event.time,
  amount: props.event.amount,
  userId: props.event.userId,
});

const isFormValid = computed(() => {
  return (
    eventForm.value.description.trim() !== "" &&
    eventForm.value.location.trim() !== "" &&
    eventForm.value.date !== "" &&
    eventForm.value.time !== "" &&
    eventForm.value.amount > 0
  );
});

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = "Por favor complete todos los campos requeridos";
    return;
  }

  try {
    isLoading.value = true;
    await eventStore.updateEvent(props.event.userId, {
      ...props.event,
      ...eventForm.value,
    });
    emit("saved");
    closeModal();
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    errorMessage.value = "Error al guardar los cambios";
  } finally {
    isLoading.value = false;
  }
}

function closeModal() {
  emit("update:modelValue", false);
  errorMessage.value = "";
}
</script>
<script lang="ts">
export default {
  name: "EventEditModal",
};
</script>

<template>
  <ModalComponent :modelValue="modelValue" @close="closeModal" title="Editar Evento">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="form-group">
        <label for="description">Descripción</label>
        <input
          id="description"
          v-model="eventForm.description"
          type="text"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="location">Ubicación</label>
        <input
          id="location"
          v-model="eventForm.location"
          type="text"
          required
          class="form-input"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="form-group">
          <label for="date">Fecha</label>
          <input
            id="date"
            v-model="eventForm.date"
            type="date"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="time">Hora</label>
          <input
            id="time"
            v-model="eventForm.time"
            type="time"
            required
            class="form-input"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="amount">Monto</label>
        <input
          id="amount"
          v-model.number="eventForm.amount"
          type="number"
          min="0"
          step="0.01"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="paymentStatus">Estado de Pago</label>
        <select id="paymentStatus" v-model="eventForm.paymentStatus" class="form-select">
          <option value="Pendiente">Pendiente</option>
          <option value="Pagado">Pagado</option>
        </select>
      </div>

      <!-- Agregar opción para modificar activityType -->
      <div class="form-group">
        <label for="activityType">Tipo de Actividad</label>
        <select id="activityType" v-model="eventForm.activityType" class="form-select">
          <option value="Eventual">Evento Único</option>
          <option value="Fija">Evento Fijo Semanal</option>
        </select>
      </div>

      <p v-if="errorMessage" class="text-red-500 text-sm mt-2">
        {{ errorMessage }}
      </p>

      <div class="flex justify-end space-x-2 mt-4">
        <ButtonComponent type="button" variant="secondary" @click="closeModal">
          Cancelar
        </ButtonComponent>
        <ButtonComponent
          type="submit"
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
        >
          Guardar Cambios
        </ButtonComponent>
      </div>
    </form>
  </ModalComponent>
</template>

<style lang="postcss">
.form-group {
  @apply mb-4;

  label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
}

.form-input,
.form-select {
  @apply w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500;
}

.form-checkbox {
  @apply rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500;
}
</style>
