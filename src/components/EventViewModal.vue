<template>
  <ModalComponent
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="'Detalles del Evento'"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500">Tipo de Actividad</h4>
          <p class="mt-1">{{ event.activityType }}</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500">Estado de Pago</h4>
          <p
            :class="{
              'text-green-600': event.paymentStatus === 'Pagado',
              'text-red-600': event.paymentStatus === 'Pendiente',
            }"
          >
            {{ event.paymentStatus }}
          </p>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Proveedor</h4>
        <p class="mt-1">{{ event.provider }}</p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Descripción</h4>
        <p class="mt-1">{{ event.description }}</p>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Lugar</h4>
        <p class="mt-1">
          {{ event?.location || "No especificado" }}
          <span v-if="!event?.location" class="text-yellow-500 text-xs">
            (Ubicación no disponible)
          </span>
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500">Fecha</h4>
          <p class="mt-1">{{ formatDate(event.date) }}</p>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-500">Hora</h4>
          <p class="mt-1">{{ event.time }}</p>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-500">Monto</h4>
        <p class="mt-1">{{ formatCurrency(event.amount) }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
        <div>
          <p>Creado: {{ formatDateTime(event.createdAt) }}</p>
        </div>
        <div>
          <p>
            Actualizado: {{ event.updatedAt ? formatDateTime(event.updatedAt) : "N/A" }}
          </p>
        </div>
      </div>
    </div>

    <!-- Debug info - remove in production -->
    <div class="mt-4 p-2 bg-gray-100 rounded text-xs" v-if="debug">
      <pre>{{ JSON.stringify(event, null, 2) }}</pre>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ButtonComponent variant="secondary" @click="$emit('edit')">
          Editar
        </ButtonComponent>
        <ButtonComponent variant="primary" @click="close"> Cerrar </ButtonComponent>
      </div>
    </template>
  </ModalComponent>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { format } from "date-fns";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import type { MusicEvent } from "../types/event";

const props = defineProps<{
  modelValue: boolean;
  event: MusicEvent;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "edit"): void;
}>();

const close = (): void => {
  emit("update:modelValue", false);
};

const debug = ref(false); // Set to true to see event data

// Monitor event prop changes
watchEffect(() => {
  if (props.event) {
    console.log("Event data received:", props.event);
    if (!props.event.location) {
      console.warn("Location data is missing for event:", props.event.id);
    }
  }
});

const formatDate = (date: string): string => {
  return format(new Date(date), "dd/MM/yyyy");
};

const formatDateTime = (date?: string): string => {
  if (!date) return "N/A";
  return format(new Date(date), "dd/MM/yyyy HH:mm");
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(amount);
};
</script>

<style lang="postcss">
.field-missing {
  @apply italic text-gray-400;
}
</style>
