<template>
  <ModalComponent
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="'Editar Evento'"
  >
    <form @submit.prevent="saveEvent" class="space-y-6">
      <!-- Tipo de Actividad -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Tipo de Actividad</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Fija"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Fija</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Eventual"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Eventual</span>
          </label>
        </div>
      </div>

      <!-- Estado de Pago -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Estado de Pago</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pagado"
              class="form-radio text-green-600"
            />
            <span class="ml-2">Pagado</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pendiente"
              class="form-radio text-yellow-600"
            />
            <span class="ml-2">Pendiente</span>
          </label>
        </div>
      </div>

      <!-- Campos del formulario -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Proveedor</label>
          <input
            v-model="eventForm.provider"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Descripción</label>
          <input
            v-model="eventForm.description"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Lugar</label>
          <input
            v-model="eventForm.location"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              v-model="eventForm.date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Hora</label>
            <input
              v-model="eventForm.time"
              type="time"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Monto</label>
          <input
            v-model.number="eventForm.amount"
            type="number"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <ButtonComponent variant="secondary" @click="close">Cancelar</ButtonComponent>
        <ButtonComponent type="submit" variant="primary">Guardar Cambios</ButtonComponent>
      </div>
    </form>
  </ModalComponent>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { useEventStore } from "../stores/eventStore";
import { MusicEvent, EventFormData } from "../types/event";

const props = defineProps<{
  modelValue: boolean;
  event: MusicEvent;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
}>();

const eventStore = useEventStore();
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
  isFixed: props.event.isFixed,
});

async function saveEvent() {
  try {
    if (props.event.id) {
      await eventStore.updateEvent(props.event.id, eventForm.value);
      emit("saved");
      close();
    }
  } catch (error) {
    console.error("Error al actualizar el evento:", error);
  }
}

function close() {
  emit("update:modelValue", false);
}
</script>

<script lang="ts">
export default {
  name: "EventEditModal",
};
</script>
